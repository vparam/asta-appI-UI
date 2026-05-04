/**
 * Bed 4 / PT-9K2X — WATCH state, 30 minutes after the stable snapshot.
 * The model has ranked lactate as the top-priority data acquisition, so the
 * Action Line uses the directive register (§7.2 register-rank rule).
 * TimesFM has projected SpO2 crossing 92% within ~60 minutes.
 *
 * Vitals haven't crossed yet — the watch state is anticipatory, driven by
 * the forecast and the scenario ranking, not by current vital values.
 */

import { PatientFile } from './types.js';
import { bed4 } from './beds.js';
import { bed4Stable } from './bed4-stable.js';

export const bed4Watch: PatientFile = {
  ...bed4Stable,
  bed: bed4,
  read: {
    ...bed4Stable.read,
    state: 'watch',
    actionLine: 'Check lactate now; monitor BP + urine output.',
    actionRegister: 'directive',
    nextCheck: 'Reassess BP in ~15 min',
    scenarios: bed4Stable.read.scenarios.map((s) =>
      s.id === 'shock-sepsis'
        ? { ...s, actionHint: 'Action: check lactate now; monitor BP + urine output.' }
        : s
    ),
  },
  forecasts: [
    {
      lane: 'spo2',
      narrative: 'SpO2 may drop below 92% in ~60 min — prepare O₂ support.',
      confidence: { label: 'moderate', percent: 78 },
      horizons: [
        { tMin: 30, value: 99.4 },
        { tMin: 60, value: 91.8 },
        { tMin: 120, value: 88.4 },
      ],
      trace: Array.from({ length: 24 }, (_, i) => ({
        tMin: i * 5 + 5,
        // Smooth descent: ~100 → 91.8 by 60min → 88.4 by 120min.
        value: i < 12 ? 99.6 - i * 0.65 : 91.8 - (i - 12) * 0.28,
      })),
      atRisk: true,
    },
    ...bed4Stable.forecasts.filter((f) => f.lane !== 'spo2'),
  ],
  activeAlert: {
    id: 'evt-7c3a-2026-05-02T02:14:27Z',
    patientToken: 'PT-9K2X',
    bed: bed4,
    severity: 'watch',
    firedAt: '2026-05-02T02:14:27+05:30',
    headline: 'SpO2 trending falling — projected below 92% in ~60 min',
    routingChain: [
      { name: 'Asha (you)', role: 'Bedside nurse', isCurrent: true },
      { name: 'Dr. Priya Rao', role: 'On-call physician', isCurrent: false },
      { name: 'Dr. Ramesh Iyer', role: 'ICU lead', isCurrent: false },
    ],
  },
  syncedSecondsAgo: 12,
};
