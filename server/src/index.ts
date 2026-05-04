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

/**
 * The fixture currently selected for Bed 4. Switchable via /dev/state so the
 * mobile dev menu can flip stable → watch → critical without restarting.
 */
let bed4State: 'stable' | 'watch' | 'critical' = 'stable';

function bed4Current(): PatientFile {
  if (bed4State === 'critical') return bed4Critical;
  if (bed4State === 'watch') return bed4Watch;
  return bed4Stable;
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/patients', (_req, res) => {
  // Reflect bed4's currently-selected state in the roster.
  const out = roster.map((r) =>
    r.bed.token === 'PT-9K2X' ? { ...r, state: bed4Current().read.state, score: bed4Current().read.score } : r
  );
  res.json(out);
});

app.get('/patients/:token', (req, res) => {
  const { token } = req.params;
  if (token === 'PT-9K2X') {
    res.json(bed4Current());
    return;
  }
  // Other beds have a stable read echoing bed4Stable for now.
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

/** Re-inference after bedside data entry. Returns the updated PatientFile. */
app.post('/patients/:token/rerun', (req, res) => {
  const { lactate } = (req.body ?? {}) as { lactate?: number };
  if (req.params.token !== 'PT-9K2X') {
    res.json(bed4Current());
    return;
  }
  const updated: PatientFile = {
    ...bed4Current(),
    read: {
      ...bed4Current().read,
      score: 32, // 45 → 32 example from the spec
      currentRead: 'No dominant high-risk trend in the retained vital window.',
      scenarios: bed4Current().read.scenarios.map((s) =>
        s.id === 'shock-sepsis'
          ? { ...s, confidence: { label: 'moderate', percent: 45 } }
          : s
      ),
    },
  };
  res.json({
    patient: updated,
    receipts: {
      score: { from: 45, to: 32, copy: 'Risk score updated: 45 → 32 after data entry' },
      confidence: lactate
        ? { from: 'low', to: 'moderate', copy: 'Confidence improved: Low → Moderate' }
        : null,
    },
  });
});

/** Dev-only: cycle bed4 state. Used by the in-app dev menu. */
app.post('/dev/state', (req, res) => {
  const next = (req.body ?? {}).state as 'stable' | 'watch' | 'critical' | undefined;
  if (next && ['stable', 'watch', 'critical'].includes(next)) {
    bed4State = next;
  }
  res.json({ state: bed4State });
});

/** Dev-only: simulate a push notification. In production this calls APNs/FCM via the native modules. */
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
