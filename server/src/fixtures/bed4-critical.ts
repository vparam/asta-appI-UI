/**
 * Bed 4 / PT-9K2X — CRITICAL state, demonstration-only.
 * Triggers the v2.7 critical visual treatment (3 channels).
 */

import { PatientFile } from './types.js';
import { bed4 } from './beds.js';
import { bed4Watch } from './bed4-watch.js';

export const bed4Critical: PatientFile = {
  ...bed4Watch,
  bed: bed4,
  read: {
    ...bed4Watch.read,
    score: 72,
    state: 'critical',
    currentRead: 'SpO2 has crossed below 92%. Sustained hypoxia.',
    actionLine: 'Increase O2 support now. Consider ABG. Notify on-call physician.',
    actionRegister: 'directive',
    nextCheck: '',
  },
  vitals: [
    { lane: 'hr', value: 122, unit: 'bpm', direction: 'rising', interpretation: 'Rising — above 100 bpm tachycardia threshold', outOfRange: true },
    { lane: 'spo2', value: 88, unit: '%', direction: 'falling', interpretation: 'Falling — below 92% hypoxia threshold', outOfRange: true },
    { lane: 'sbp', value: 102, unit: 'mmHg', direction: 'falling', interpretation: 'Falling — within range', outOfRange: false },
    { lane: 'dbp', value: 64, unit: 'mmHg', direction: 'falling', interpretation: 'Falling — within range', outOfRange: false },
    { lane: 'map', value: 76, unit: 'mmHg', direction: 'falling', interpretation: 'Falling — perfusion adequate (>65 mmHg)', outOfRange: false },
  ],
  activeAlert: {
    id: 'evt-9d4b-2026-05-02T03:14:18Z',
    patientToken: 'PT-9K2X',
    bed: bed4,
    severity: 'critical',
    firedAt: '2026-05-02T03:14:18+05:30',
    headline: 'CRITICAL: SpO2 88% sustained — Action requested ≤ 5 min',
    routingChain: bed4Watch.activeAlert!.routingChain,
  },
};
