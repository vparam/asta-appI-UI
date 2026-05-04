import express from 'express';
import cors from 'cors';
import { roster } from './fixtures/roster.js';
import { bed4Stable } from './fixtures/bed4-stable.js';
import { bed4Watch } from './fixtures/bed4-watch.js';
import { bed4Critical } from './fixtures/bed4-critical.js';
import { PatientFile } from './fixtures/types.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT ?? 3001);

let bed4State: 'stable' | 'watch' | 'critical' = 'stable';

/** Audit log — append-only. In production this writes to the hospital audit pipeline. */
type AuditRow = { t: number; kind: string; actor: 'system' | 'clinician'; details: Record<string, unknown> };
const audit: AuditRow[] = [];
function logAudit(row: AuditRow) {
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

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/patients', (_req, res) => {
  const out = roster.map((r) =>
    r.bed.token === 'PT-9K2X'
      ? { ...r, state: bed4Current().read.state, score: bed4Current().read.score }
      : r
  );
  res.json(out);
});

app.get('/patients/:token', (req, res) => {
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
app.post('/patients/:token/rerun', (req, res) => {
  const body = (req.body ?? {}) as { lactate?: number; temp?: number; o2?: number };
  const { token } = req.params;
  if (token !== 'PT-9K2X') {
    res.json({ patient: bed4Current(), receipts: { score: null, confidence: null } });
    return;
  }

  const before = lastScore[token] ?? bed4Current().read.score;
  // Lactate of 2.4 (mild elevation) → mid-band score; 0 lactate → small relief; very high → bump.
  const lactate = body.lactate ?? null;
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
  } else if (body.o2 !== undefined || body.temp !== undefined) {
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
    details: { token, before, after: nextScore, lactate, temp: body.temp, o2: body.o2 },
  });

  res.json({
    patient: updated,
    receipts: { score: scoreReceipt, confidence: confidenceShift },
  });
});

/** Acknowledge an alert — §5.4. action_source is mandatory. */
app.post('/alerts/:id/ack', (req, res) => {
  const { id } = req.params;
  const via = ((req.body ?? {}) as { via?: 'in-app' | 'notification' }).via ?? 'in-app';
  logAudit({
    t: Date.now(),
    kind: 'alert_ack',
    actor: 'clinician',
    details: { eventId: id, action_source: via === 'notification' ? 'notification quick action' : 'in-app button' },
  });
  res.json({ ok: true, via });
});

/** Scenario RL feedback — §7.7. */
app.post('/patients/:token/feedback', (req, res) => {
  const body = (req.body ?? {}) as { scenarioId?: string; kind?: 'confirm' | 'false' | 'uncertain' };
  logAudit({
    t: Date.now(),
    kind: 'scenario_feedback',
    actor: 'clinician',
    details: { token: req.params.token, ...body },
  });
  res.json({ ok: true });
});

/** Read the audit log — useful for tests and the trust-calibration page (§10.4). */
app.get('/audit', (_req, res) => res.json(audit));

app.post('/dev/state', (req, res) => {
  const next = (req.body ?? {}).state as 'stable' | 'watch' | 'critical' | undefined;
  if (next && ['stable', 'watch', 'critical'].includes(next)) {
    bed4State = next;
    delete lastScore['PT-9K2X']; // reset score baseline
  }
  res.json({ state: bed4State });
});

app.post('/push/test', (req, res) => {
  const { token, severity = 'watch' } = (req.body ?? {}) as { token?: string; severity?: 'watch' | 'critical' };
  res.json({
    sent: true,
    payload: {
      patient_token: token ?? 'PT-9K2X',
      event_id: bed4Current().activeAlert?.id ?? 'evt-mock',
      severity,
      epoch: Math.floor(Date.now() / 1000),
    },
  });
});

app.listen(PORT, () => {
  console.log(`[asta-pplm-server] listening on http://localhost:${PORT}`);
});
