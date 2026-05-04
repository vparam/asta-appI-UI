import { RosterEntry } from './types.js';
import { bed1, bed2, bed3, bed4, bed5 } from './beds.js';

export const roster: RosterEntry[] = [
  { bed: bed1, state: 'stable', score: 12, vitalsAgeRelative: '10m ago' },
  { bed: bed2, state: 'stable', score: 15, vitalsAgeRelative: '45m ago' },
  { bed: bed3, state: 'stable', score: 8, vitalsAgeRelative: '1h ago' },
  { bed: bed4, state: 'stable', score: 19, vitalsAgeRelative: 'Just now' },
  { bed: bed5, state: 'stable', score: 22, vitalsAgeRelative: '2h ago' },
];
