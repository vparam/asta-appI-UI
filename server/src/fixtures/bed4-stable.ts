/**
 * Bed 4 / PT-9K2X — STABLE state.
 * Matches the spec exemplars used throughout §7 and the v2.7 UXPilot prompts.
 * Values: Risk 19/100, HR 57 bpm ↓, SpO2 100, BP 132/90, MAP 104.
 */

import { PatientFile } from './types.js';
import { bed4 } from './beds.js';

const vitalHistoryHr = Array.from({ length: 121 }, (_, i) => ({
  tMin: -120 + i,
  // Slight downward drift from ~72 to 57 over two hours, then plateau.
  value: Math.max(57, 72 - i * 0.13 + Math.sin(i / 5) * 1.2),
}));

const vitalHistorySpo2 = Array.from({ length: 121 }, (_, i) => ({
  tMin: -120 + i,
  value: 100 - Math.abs(Math.sin(i / 11)) * 0.4,
}));

const vitalHistorySbp = Array.from({ length: 121 }, (_, i) => ({
  tMin: -120 + i,
  value: 132 + Math.sin(i / 7) * 3,
}));

const vitalHistoryDbp = Array.from({ length: 121 }, (_, i) => ({
  tMin: -120 + i,
  value: 90 + Math.sin(i / 9) * 2.5,
}));

const vitalHistoryMap = vitalHistorySbp.map((s, i) => ({
  tMin: s.tMin,
  value: (s.value + 2 * vitalHistoryDbp[i].value) / 3,
}));

export const bed4Stable: PatientFile = {
  bed: bed4,
  read: {
    score: 19,
    state: 'stable',
    currentRead: 'No dominant high-risk trend in the retained vital window.',
    actionLine: 'No action required — continue routine monitoring.',
    actionRegister: 'monitoring',
    nextCheck: 'Next routine check: 30 min',
    subScores: { cardiac: 8, respiratory: 4, neurology: 2, perfusion: 5 },
    scenarios: [
      {
        id: 'shock-sepsis',
        title: 'Shock / sepsis progression pattern',
        confidence: { label: 'low', percent: 17, showUncertainHint: true },
        rationaleMobile: 'Perfusion may drop rapidly → risk of shock if untreated.',
        summary:
          'Perfusion can deteriorate quickly if hypotension, tachycardia, lactate, oliguria, or fever cluster together.',
        actionHint: 'Action: monitor lactate, BP, urine; sepsis screen if patterns cluster.',
        whyTraces: [
          { model: 'cardiac model', line: 'Latest 57 bpm; range 54–63; overall slope –90.18 bpm/hour; recent slope –471.37 bpm/hour across 80 points.' },
          { model: 'respiratory model', line: 'SpO2 100%, stable; no decompensation signal.' },
          { model: 'perfusion model', line: 'BP stable; MAP 104, perfusion adequate.' },
          { model: 'neurology model', line: 'GCS not assessed; no input.' },
        ],
        checks: ['lactate trend', 'urine output', 'temperature / WBC', 'blood pressure response', 'source / infection review'],
      },
      {
        id: 'pulmonary-edema',
        title: 'Pulmonary edema / fluid overload pattern',
        confidence: { label: 'low', percent: 14 },
        rationaleMobile: 'Worsening oxygenation → risk of respiratory failure if fluid overload.',
        summary: 'Worsening oxygenation → risk of respiratory failure if fluid overload.',
        actionHint: 'Review fluid balance and oxygenation. Recheck breath sounds.',
        whyTraces: [
          { model: 'respiratory model', line: 'SpO2 stable at 100% over last 2h; no descent.' },
        ],
        checks: ['fluid balance', 'breath sounds', 'recent diuretics', 'JVP'],
      },
      {
        id: 'neuro-decline',
        title: 'Neurologic decline / sedation effect',
        confidence: { label: 'low', percent: 11 },
        rationaleMobile: 'Mental-status decline → consider sedation, hypoxia, or neurologic event.',
        summary: 'Mental-status decline → consider sedation, hypoxia, or neurologic event.',
        actionHint: 'GCS recheck. Review sedation and analgesia.',
        whyTraces: [{ model: 'neurology model', line: 'No GCS input; cannot assess.' }],
        checks: ['GCS', 'sedation review', 'pupillary response'],
      },
      {
        id: 'cardiac-dysrhythmia',
        title: 'Cardiac dysrhythmia',
        confidence: { label: 'low', percent: 8 },
        rationaleMobile: 'Rhythm instability may progress without warning if undiagnosed.',
        summary: 'Rhythm instability may progress without warning if undiagnosed.',
        actionHint: 'Review rhythm strip if available.',
        whyTraces: [{ model: 'cardiac model', line: 'No ectopy detected in retained window.' }],
        checks: ['rhythm strip', '12-lead if symptomatic', 'electrolytes'],
      },
      {
        id: 'metabolic',
        title: 'Metabolic abnormality',
        confidence: { label: 'low', percent: 5 },
        rationaleMobile: 'Electrolyte or acid-base shift may underlie current findings.',
        summary: 'Electrolyte or acid-base shift may underlie current findings.',
        actionHint: 'Review most recent labs.',
        whyTraces: [{ model: 'perfusion model', line: 'No perfusion deficit detected.' }],
        checks: ['recent BMP', 'ABG', 'glucose'],
      },
    ],
  },
  vitals: [
    { lane: 'hr', value: 57, unit: 'bpm', direction: 'falling', interpretation: 'Falling — within range (60–100)', outOfRange: false },
    { lane: 'spo2', value: 100, unit: '%', direction: 'stable', interpretation: 'Stable — within range', outOfRange: false },
    { lane: 'sbp', value: 132, unit: 'mmHg', direction: 'stable', interpretation: 'Stable — within range (90–140)', outOfRange: false },
    { lane: 'dbp', value: 90, unit: 'mmHg', direction: 'stable', interpretation: 'Stable', outOfRange: false },
    { lane: 'map', value: 104, unit: 'mmHg', direction: 'stable', interpretation: 'Stable — perfusion adequate (>65 mmHg)', outOfRange: false },
  ],
  vitalHistory: {
    hr: vitalHistoryHr,
    spo2: vitalHistorySpo2,
    sbp: vitalHistorySbp,
    dbp: vitalHistoryDbp,
    map: vitalHistoryMap,
  },
  forecasts: [
    {
      lane: 'hr',
      narrative: 'Heart rate stays in range for next 2 h.',
      confidence: { label: 'moderate', percent: 76 },
      horizons: [{ tMin: 30, value: 58 }, { tMin: 60, value: 60 }, { tMin: 120, value: 62 }],
      trace: Array.from({ length: 24 }, (_, i) => ({ tMin: i * 5 + 5, value: 57 + i * 0.2 })),
      atRisk: false,
    },
    {
      lane: 'spo2',
      narrative: 'SpO2 stays above 92% for next 2 h.',
      confidence: { label: 'high', percent: 78 },
      horizons: [{ tMin: 30, value: 99.4 }, { tMin: 60, value: 99.4 }, { tMin: 120, value: 99.4 }],
      trace: Array.from({ length: 24 }, (_, i) => ({ tMin: i * 5 + 5, value: 99.6 - i * 0.01 })),
      atRisk: false,
    },
    {
      lane: 'sbp',
      narrative: 'Systolic BP holds steady for next 2 h.',
      confidence: { label: 'moderate', percent: 76 },
      horizons: [{ tMin: 30, value: 132 }, { tMin: 60, value: 131 }, { tMin: 120, value: 130 }],
      trace: Array.from({ length: 24 }, (_, i) => ({ tMin: i * 5 + 5, value: 132 - i * 0.08 })),
      atRisk: false,
    },
  ],
  context: {
    medicines: 0,
    allergies: 0,
    records: 0,
    // §3.2: relative form. Absolute timestamps in combination with ward+bed
    // are a re-identification vector in small wards.
    generatedAt: '12 m ago',
  },
  syncedSecondsAgo: 12,
};
