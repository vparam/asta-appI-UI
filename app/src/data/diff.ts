/**
 * Vital-snapshot diff — drives the §7.5 "What's new since last check" banner.
 * A change is "significant" if value moved by ≥5% of baseline OR the
 * direction changed OR the out-of-range flag flipped.
 */

import { VitalReading, VitalLane } from './types';

const BASELINE: Record<VitalLane, number> = {
  hr: 80,
  spo2: 96,
  sbp: 120,
  dbp: 80,
  map: 85,
};

export function computeChangedSince(
  prev: VitalReading[],
  curr: VitalReading[]
): VitalReading[] {
  const prevByLane = new Map(prev.map((v) => [v.lane, v]));
  const out: VitalReading[] = [];
  for (const v of curr) {
    const before = prevByLane.get(v.lane);
    if (!before) {
      out.push(v);
      continue;
    }
    const delta = Math.abs(v.value - before.value);
    const pctChange = delta / (BASELINE[v.lane] || 1);
    const directionFlipped = before.direction !== v.direction;
    const rangeFlipped = before.outOfRange !== v.outOfRange;
    if (pctChange >= 0.05 || directionFlipped || rangeFlipped) {
      out.push(v);
    }
  }
  // Cap at three vitals — banner is one line.
  return out.slice(0, 3);
}
