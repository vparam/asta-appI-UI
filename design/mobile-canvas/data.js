// Seed clinical data — anonymized patients. Vital traces are short series for sparklines.
window.PATIENTS = [
  {
    id: 'p-001',
    initials: 'A.S.',
    ageSex: '67 F',
    bed: 'Bed 1',
    ward: 'ICU · Sim',
    risk: 33,
    band: 'watch', // crit | watch | live | stable
    mode: 'live',
    admittedAgo: '38 min',
    topScenario: { name: 'Shock / sepsis progression', prob: 29, why: 'Perfusion can deteriorate quickly if hypotension, tachycardia, lactate, oliguria or fever cluster.' },
    vitals: {
      hr:   { v: 75,  u: 'bpm',  trend: 'down',  status: 'watch',  spark: [72,74,71,76,78,73,75,70,72,75,74,75] },
      spo2: { v: 98,  u: '%',    trend: 'up',    status: 'ok',     spark: [97,97,98,97,98,98,98,98,98,98,98,98] },
      bps:  { v: 147, d: 99, u: 'mmHg', trend: 'down', status: 'watch', spark: [159,156,153,151,150,148,147,148,147,146,147,147] },
      rr:   { v: 14,  u: '/min', trend: 'down',  status: 'ok',     spark: [16,16,15,15,14,14,15,14,14,14,14,14] },
    },
    checks: [
      { id: 'c1', label: 'Lactate trend', urgency: 'priority' },
      { id: 'c2', label: 'CBC / WBC',     urgency: 'priority' },
      { id: 'c3', label: 'Urine output (last 4h)', urgency: 'now' },
      { id: 'c4', label: 'Cultures if infection suspected', urgency: 'next' },
    ],
    forecast: [
      { name: 'Pulse',        end: '64 bpm',   risk: 65, dir: 'falling', spark: [75,72,70,68,66,65,65,64] },
      { name: 'Systolic BP',  end: '138 mmHg', risk: 56, dir: 'falling', spark: [147,144,142,140,139,138,138,138] },
      { name: 'SpO₂',         end: '99 %',     risk: 54, dir: 'rising',  spark: [98,98,98,98,99,99,99,99] },
      { name: 'Resp rate',    end: '14 /min',  risk: 50, dir: 'flat',    spark: [14,14,14,14,14,14,14,14] },
    ],
    scenarios: [
      { rank: 1, name: 'Shock / sepsis progression', prob: 29, why: 'Latest BP 147 mmHg (range 81–159); recent slope −55 mmHg/h across 80 points.', checks: ['lactate trend','CBC/WBC','urine output','cultures if infection suspected'], meds: 'Antibiotic / vasopressor / fluid decisions require clinician diagnosis, local sepsis protocol, allergies, cultures, BP response, renal/cardiac context.' },
      { rank: 2, name: 'Acute coronary / arrhythmia', prob: 22, why: 'Latest 75 bpm (range 48–80); recent slope −6.9 bpm/h. Rate-pressure instability can hide ischemia.', checks: ['ECG / rhythm strip','chest pain / symptoms','troponin if indicated'], meds: 'Anti-anginal / antiarrhythmic decisions require diagnosis confirmation.' },
      { rank: 3, name: 'Hypovolemia / dehydration', prob: 14, why: 'Falling SBP + tachypnea trend; consider intake / output deficit.', checks: ['I/O balance','skin turgor','postural BP'], meds: 'Fluid trial considered per local protocol.' },
      { rank: 4, name: 'Respiratory compromise',    prob: 11, why: 'Resp rate trending down with stable SpO₂ — monitor for fatigue.', checks: ['work of breathing','ABG if deterioration'], meds: 'O₂ titration only.' },
    ],
  },
  {
    id: 'p-002', initials: 'A.M.', ageSex: '54 F', bed: 'Bed 10', ward: 'ICU',
    risk: 41, band: 'watch', mode: 'live', admittedAgo: '2 h 14 min',
    topScenario: { name: 'Arrhythmia / rate-pressure', prob: 24, why: 'Rate-pressure variance over last hour.' },
    vitals: {
      hr:   { v: 112, u: 'bpm',  trend: 'up',   status: 'watch', spark: [98,102,105,108,110,112,114,112,113,112,112,112] },
      spo2: { v: 96,  u: '%',    trend: 'flat', status: 'ok',    spark: [96,96,97,96,96,96,96,96,96,96,96,96] },
      bps:  { v: 132, d: 88, u: 'mmHg', trend: 'flat', status: 'ok', spark: [130,132,131,133,132,132,131,132,132,131,132,132] },
      rr:   { v: 22,  u: '/min', trend: 'up',   status: 'watch', spark: [18,19,20,21,22,22,22,23,22,22,22,22] },
    },
    checks: [{id:'c1',label:'ECG / rhythm strip',urgency:'now'},{id:'c2',label:'Chest pain check',urgency:'priority'}],
    forecast: [], scenarios: [],
  },
  {
    id: 'p-003', initials: 'J.K.', ageSex: '71 M', bed: 'Bed 1', ward: 'ICU',
    risk: 18, band: 'live', mode: 'live', admittedAgo: '5 h',
    topScenario: { name: 'Stable post-op recovery', prob: 7, why: 'Trends stable, no thresholds breached.' },
    vitals: {
      hr:   { v: 78, u: 'bpm', trend: 'flat', status: 'ok', spark: [78,78,77,78,79,78,78,78,78,78,78,78] },
      spo2: { v: 99, u: '%',   trend: 'flat', status: 'ok', spark: [99,99,99,99,99,99,99,99,99,99,99,99] },
      bps:  { v: 122, d: 78, u: 'mmHg', trend: 'flat', status: 'ok', spark: [122,121,122,123,122,122,122,122,122,122,122,122] },
      rr:   { v: 16, u: '/min', trend: 'flat', status: 'ok', spark: [16,16,16,16,16,16,16,16,16,16,16,16] },
    },
    checks: [], forecast: [], scenarios: [],
  },
  {
    id: 'p-004', initials: 'R.P.', ageSex: '59 M', bed: 'Bed 2', ward: 'ICU',
    risk: 12, band: 'stable', mode: 'live', admittedAgo: '1 d',
    topScenario: { name: 'Monitoring', prob: 4, why: 'No active concern.' },
    vitals: {
      hr:   { v: 68, u: 'bpm', trend: 'flat', status: 'ok', spark: [70,69,68,68,68,68,68,68,68,68,68,68] },
      spo2: { v: 98, u: '%',   trend: 'flat', status: 'ok', spark: [98,98,98,98,98,98,98,98,98,98,98,98] },
      bps:  { v: 118, d: 76, u: 'mmHg', trend: 'flat', status: 'ok', spark: [118,118,118,118,118,118,118,118,118,118,118,118] },
      rr:   { v: 14, u: '/min', trend: 'flat', status: 'ok', spark: [14,14,14,14,14,14,14,14,14,14,14,14] },
    },
    checks: [], forecast: [], scenarios: [],
  },
  {
    id: 'p-005', initials: 'D.O.', ageSex: '44 M', bed: 'Bed 3', ward: 'Monitoring',
    risk: 9, band: 'stable', mode: 'live', admittedAgo: '3 d',
    topScenario: { name: 'Discharge planning', prob: 2, why: 'Sustained stability.' },
    vitals: {
      hr:   { v: 72, u: 'bpm', trend: 'flat', status: 'ok', spark: [72,72,72,72,72,72,72,72,72,72,72,72] },
      spo2: { v: 99, u: '%',   trend: 'flat', status: 'ok', spark: [99,99,99,99,99,99,99,99,99,99,99,99] },
      bps:  { v: 116, d: 74, u: 'mmHg', trend: 'flat', status: 'ok', spark: [116,116,116,116,116,116,116,116,116,116,116,116] },
      rr:   { v: 14, u: '/min', trend: 'flat', status: 'ok', spark: [14,14,14,14,14,14,14,14,14,14,14,14] },
    },
    checks: [], forecast: [], scenarios: [],
  },
];

window.WARDS = [
  { id: 'sim', name: 'AI Simulation', floor: '—', capacity: 1, occupied: 1, critical: 1 },
  { id: 'icu', name: 'ICU', floor: 'Floor 2', capacity: 10, occupied: 3, critical: 0 },
  { id: 'mon', name: 'Monitoring', floor: 'Floor 1', capacity: 6, occupied: 1, critical: 0 },
];
