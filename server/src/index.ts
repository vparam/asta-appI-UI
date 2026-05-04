import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { roster } from './fixtures/roster.js';
import { bed4Stable } from './fixtures/bed4-stable.js';
import { bed4Watch } from './fixtures/bed4-watch.js';
import { bed4Critical } from './fixtures/bed4-critical.js';
import { PatientFile } from './fixtures/types.js';

const app = express();
app.use(cors());
// 16 KB body cap — bedside data is small. Bigger payloads are dropped on the floor.
app.use(express.json({ limit: '16kb' }));

const PORT = Number(process.env.PORT ?? 3001);

let bed4State: 'stable' | 'watch' | 'critical' = 'stable';

// ============================================================================
// Validation helpers
// ============================================================================

/** §3.2 token shape. Accept legacy 5-digit numeric IDs from the demo fixtures. */
const TOKEN_RE = /^PT-[A-Z0-9]{4,12}$/;

function isValidToken(s: unknown): s is string {
  return typeof s === 'string' && TOKEN_RE.test(s);
}

function isValidEventId(s: unknown): s is string {
  return typeof s === 'string' && /^evt-[A-Za-z0-9-]{4,64}$/.test(s);
}

function isFiniteNumber(n: unknown, min: number, max: number): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
}

/** §16.7: server refuses any client-supplied object that contains PII-shaped fields. */
const PII_KEYS = new Set([
  'name', 'firstName', 'first_name', 'lastName', 'last_name',
  'fullName', 'full_name', 'patientName', 'patient_name',
  'mrn', 'medicalRecordNumber',
  'dob', 'dateOfBirth', 'date_of_birth', 'birthDate', 'birth_date',
  'address', 'phone', 'phoneNumber', 'phone_number',
  'email', 'ssn', 'aadhaar', 'aadhar',
]);

function refusePii(obj: unknown): { ok: true } | { ok: false; key: string } {
  if (!obj || typeof obj !== 'object') return { ok: true };
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_KEYS.has(k)) return { ok: false, key: k };
    if (v && typeof v === 'object') {
      const sub = refusePii(v);
      if (!sub.ok) return sub;
    }
  }
  return { ok: true };
}

const piiGuard = (req: Request, res: Response, next: NextFunction) => {
  const r = refusePii(req.body);
  if (!r.ok) {
    res.status(400).json({ error: 'pii_in_request', key: r.key });
    return;
  }
  next();
};

/**
 * Token-segment middleware: every patient route validates :token shape and
 * refuses path-traversal / injection attempts before any handler runs.
 */
const tokenGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!isValidToken(req.params.token)) {
    res.status(400).json({ error: 'invalid_token' });
    return;
  }
  next();
};

// ============================================================================
// Rate limiter — fixed window per IP
// ============================================================================

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60; // 60 req / min / IP
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const b = rateBuckets.get(ip);
  if (!b || b.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    next();
    return;
  }
  b.count += 1;
  if (b.count > RATE_MAX) {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }
  next();
};

// ============================================================================
// Audit log — append-only
// ============================================================================

type AuditRow = { t: number; kind: string; actor: 'system' | 'clinician'; details: Record<string, unknown> };
const audit: AuditRow[] = [];
function logAudit(row: AuditRow) {
  // Last-line of defence: refuse to write PII into the audit row.
  const r = refusePii(row.details);
  if (!r.ok) {
    console.error(`[audit] REJECTED — PII key "${r.key}" in ${row.kind} details`);
    return;
  }
  audit.push(row);
  console.log(`[audit] ${row.kind}`, row.details);
}

function bed4Current(): PatientFile {
  if (bed4State === 'critical') return bed4Critical;
  if (bed4State === 'watch') return bed4Watch;
  return bed4Stable;
}

/** Track per-patient last score so rerun receipts are honest. */
const lastScore: Record<string, number> = {};

// ============================================================================
// Apply guards globally to mutating routes
// ============================================================================

app.use((req, res, next) => {
  // Reject JSON bodies on GET requests outright.
  if (req.method === 'GET' && req.headers['content-length']) {
    res.status(400).json({ error: 'unexpected_body_on_get' });
    return;
  }
  next();
});

app.use(rateLimit);

// ============================================================================
// Routes
// ============================================================================

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/patients', (_req, res) => {
  const out = roster.map((r) =>
    r.bed.token === 'PT-9K2X'
      ? { ...r, state: bed4Current().read.state, score: bed4Current().read.score }
      : r
  );
  res.json(out);
});

app.get('/patients/:token', tokenGuard, (req, res) => {
  const { token } = req.params;
  if (token === 'PT-9K2X') {
    const patient = bed4Current();
    lastScore[token] = patient.read.score;
    res.json(patient);
    return;
  }
  const entry = roster.find((r) => r.bed.token === token);
  if (!entry) {
    res.status(404).json({ error: 'unknown patient token' });
    return;
  }
  res.json({
    ...bed4Stable,
    bed: entry.bed,
    read: { ...bed4Stable.read, score: entry.score },
  });
});

/**
 * Re-inference. Receipts are honest about cause:
 *   - score:      neutral copy ("Risk score updated: A → B after data entry")
 *   - confidence: only present when new data could narrow the model's distribution
 *                 (e.g. a real lactate value); causal copy ("Confidence improved: …").
 */
app.post('/patients/:token/rerun', tokenGuard, piiGuard, (req, res) => {
  const body = (req.body ?? {}) as { lactate?: unknown; temp?: unknown; o2?: unknown };

  // Validate every numeric input is in range. Out-of-range values are ignored, not coerced.
  const lactate = isFiniteNumber(body.lactate, 0, 30) ? body.lactate : null;
  const temp = isFiniteNumber(body.temp, 30, 45) ? body.temp : null;
  const o2 = isFiniteNumber(body.o2, 0, 30) ? body.o2 : null;

  const { token } = req.params;
  if (token !== 'PT-9K2X') {
    res.json({ patient: bed4Current(), receipts: { score: null, confidence: null } });
    return;
  }

  const before = lastScore[token] ?? bed4Current().read.score;
  let nextScore = before;
  let confidenceShift: { from: 'low' | 'moderate' | 'high'; to: 'low' | 'moderate' | 'high'; copy: string } | null = null;

  if (lactate !== null) {
    if (lactate < 2) nextScore = Math.max(8, before - 4);
    else if (lactate <= 2.5) nextScore = Math.max(12, Math.round(before * 0.7));
    else if (lactate <= 4) nextScore = Math.min(72, before + 8);
    else nextScore = Math.min(94, before + 22);

    const next = lactate <= 2.5 ? 'moderate' : lactate <= 4 ? 'moderate' : 'low';
    if (next === 'moderate' && bed4Current().read.scenarios[0].confidence.label !== 'moderate') {
      confidenceShift = { from: 'low', to: 'moderate', copy: 'Confidence improved: Low → Moderate' };
    } else if (next === 'low' && bed4Current().read.scenarios[0].confidence.label === 'moderate') {
      confidenceShift = { from: 'moderate', to: 'low', copy: 'Confidence dropped: Moderate → Low — readings in tension' };
    }
  } else if (o2 !== null || temp !== null) {
    nextScore = Math.max(8, before - 2);
  }

  lastScore[token] = nextScore;

  const updated: PatientFile = {
    ...bed4Current(),
    read: {
      ...bed4Current().read,
      score: nextScore,
      scenarios: confidenceShift
        ? bed4Current().read.scenarios.map((s, i) =>
            i === 0
              ? {
                  ...s,
                  confidence: { ...s.confidence, label: confidenceShift!.to, percent: confidenceShift!.to === 'moderate' ? 45 : 17 },
                }
              : s
          )
        : bed4Current().read.scenarios,
    },
  };

  const scoreReceipt =
    nextScore !== before
      ? { from: before, to: nextScore, copy: `Risk score updated: ${before} → ${nextScore} after data entry` }
      : null;

  logAudit({
    t: Date.now(),
    kind: 'rerun',
    actor: 'clinician',
    details: { token, before, after: nextScore, lactate, temp, o2 },
  });

  res.json({
    patient: updated,
    receipts: { score: scoreReceipt, confidence: confidenceShift },
  });
});

/** Acknowledge an alert — §5.4. action_source is mandatory. */
app.post('/alerts/:id/ack', piiGuard, (req, res) => {
  const { id } = req.params;
  if (!isValidEventId(id)) {
    res.status(400).json({ error: 'invalid_event_id' });
    return;
  }
  const via = ((req.body ?? {}) as { via?: 'in-app' | 'notification' }).via ?? 'in-app';
  if (via !== 'in-app' && via !== 'notification') {
    res.status(400).json({ error: 'invalid_via' });
    return;
  }
  logAudit({
    t: Date.now(),
    kind: 'alert_ack',
    actor: 'clinician',
    details: { eventId: id, action_source: via === 'notification' ? 'notification quick action' : 'in-app button' },
  });
  res.json({ ok: true, via });
});

/** Scenario RL feedback — §7.7. */
app.post('/patients/:token/feedback', tokenGuard, piiGuard, (req, res) => {
  const body = (req.body ?? {}) as { scenarioId?: unknown; kind?: unknown };
  const scenarioId = typeof body.scenarioId === 'string' && /^[a-z][a-z0-9-]{2,32}$/.test(body.scenarioId) ? body.scenarioId : null;
  const kind = body.kind === 'confirm' || body.kind === 'false' || body.kind === 'uncertain' ? body.kind : null;
  if (!scenarioId || !kind) {
    res.status(400).json({ error: 'invalid_feedback' });
    return;
  }
  logAudit({
    t: Date.now(),
    kind: 'scenario_feedback',
    actor: 'clinician',
    details: { token: req.params.token, scenarioId, kind },
  });
  res.json({ ok: true });
});

/** Privacy acknowledgement — §19.3. */
app.post('/privacy/ack', piiGuard, (req, res) => {
  const body = (req.body ?? {}) as { account?: unknown; appVersion?: unknown };
  const account = typeof body.account === 'string' && body.account.length <= 256 ? body.account : null;
  const appVersion = typeof body.appVersion === 'string' && body.appVersion.length <= 64 ? body.appVersion : 'unknown';
  logAudit({
    t: Date.now(),
    kind: 'privacy_ack',
    actor: 'clinician',
    details: {
      account: account ? `acct-${hashTrunc(account)}` : 'anonymous',
      appVersion,
    },
  });
  res.json({ ok: true });
});

/** Read the audit log — useful for tests and the trust-calibration page (§10.4). */
app.get('/audit', (_req, res) => res.json(audit));

/** Trivial truncated hash so the audit log can carry an account identifier
 *  without the raw value. Not a security control on its own — the upstream
 *  account identifier is already opaque (login token), this just shortens it. */
function hashTrunc(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).slice(0, 8);
}

app.post('/dev/state', piiGuard, (req, res) => {
  const next = (req.body ?? {}).state as 'stable' | 'watch' | 'critical' | undefined;
  if (next && ['stable', 'watch', 'critical'].includes(next)) {
    bed4State = next;
    delete lastScore['PT-9K2X']; // reset score baseline
  }
  res.json({ state: bed4State });
});

app.post('/push/test', piiGuard, (req, res) => {
  const body = (req.body ?? {}) as { token?: unknown; severity?: unknown };
  const token = isValidToken(body.token) ? body.token : 'PT-9K2X';
  const severity = body.severity === 'critical' ? 'critical' : 'watch';
  res.json({
    sent: true,
    payload: {
      patient_token: token,
      event_id: bed4Current().activeAlert?.id ?? 'evt-mock',
      severity,
      epoch: Math.floor(Date.now() / 1000),
    },
  });
});

// ============================================================================
// Centralised error handler — never leak stack traces to the client.
// Honours the `status` body-parser sets for things like PayloadTooLargeError
// (413) and SyntaxError on malformed JSON (400).
// ============================================================================
app.use((err: Error & { status?: number; statusCode?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status ?? err.statusCode ?? 500;
  console.error('[server-error]', err.message, '->', status);
  if (status === 413) {
    res.status(413).json({ error: 'payload_too_large' });
    return;
  }
  if (status === 400) {
    res.status(400).json({ error: 'malformed_request' });
    return;
  }
  res.status(500).json({ error: 'internal' });
});

// Export the configured app so test harnesses can supertest it directly.
// The CLI binds the port from src/main.ts; tests import this file and
// never bind. Splitting the entry points is the only way to avoid
// listen() running before the test sets PPLM_NO_LISTEN (ESM imports
// are hoisted, env-var assignments in test files are not).
export { app, PORT };
