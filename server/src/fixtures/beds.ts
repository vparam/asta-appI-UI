import { BedIdentifier } from './types.js';

export const bed1: BedIdentifier = { ward: 'Trail ward', bed: 1, token: 'PT-84920', admittedRelative: 'admitted ~2 days ago' };
export const bed2: BedIdentifier = { ward: 'Trail ward', bed: 2, token: 'PT-93821', admittedRelative: 'admitted ~3 days ago' };
export const bed3: BedIdentifier = { ward: 'Trail ward', bed: 3, token: 'PT-74829', admittedRelative: 'admitted ~1 day ago' };
export const bed4: BedIdentifier = { ward: 'Trail ward', bed: 4, token: 'PT-9K2X', admittedRelative: 'admitted ~5 days ago' };
export const bed5: BedIdentifier = { ward: 'Trail ward', bed: 5, token: 'PT-29384', admittedRelative: 'admitted ~6 days ago' };

// Note: spec exemplars use a 4–5-char token. Beds 1, 2, 3, 5 use legacy
// 5-digit demo IDs from the screenshot — kept here so the roster matches
// what the user has been looking at.
