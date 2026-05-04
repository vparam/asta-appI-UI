/**
 * Edge-case suite — every spec rule that has a boundary, branch, or
 * "what if everything is in tension" case gets one assertion here.
 */

import { computeChangedSince } from '@/data/diff';
import { relativeFromNow, relativeFromEpoch } from '@/data/time';
import { compose, scoreToState } from '@/theme/severity';
import { lightTokens } from '@/theme/tokens';
import { isPatientToken, assertNoPii } from '@/privacy/audit';

describe('Severity boundary transitions (§7.2 risk-score bands)', () => {
  test('score 30 is stable (band ceiling)', () => {
    expect(scoreToState(30)).toBe('stable');
  });
  test('score 31 is watch (band floor)', () => {
    expect(scoreToState(31)).toBe('watch');
  });
  test('score 60 is watch (band ceiling)', () => {
    expect(scoreToState(60)).toBe('watch');
  });
  test('score 61 is critical (band floor)', () => {
    expect(scoreToState(61)).toBe('critical');
  });
  test('score 0 and 100 land in their respective bands', () => {
    expect(scoreToState(0)).toBe('stable');
    expect(scoreToState(100)).toBe('critical');
  });
});

describe('Severity composition asymmetry (§13.2 v2.7)', () => {
  test('stable: 0 visual channels — no border, no fill from severity', () => {
    const c = compose('stable', lightTokens);
    expect(c.cardStyle.borderWidth).toBe(0);
    expect(c.cardStyle.borderColor).toBe(lightTokens.surface.hairline);
  });
  test('watch: 1 channel — left-edge hairline only', () => {
    const c = compose('watch', lightTokens);
    expect(c.cardStyle.borderLeftWidth).toBe(1);
    expect(c.cardStyle.borderLeftColor).toBe(lightTokens.severity.watchRule);
    // No full outline.
    expect(c.cardStyle.borderWidth).toBeUndefined();
  });
  test('critical: 3 channels — outline + wash + bold weight', () => {
    const c = compose('critical', lightTokens);
    expect(c.cardStyle.borderWidth).toBe(2);
    expect(c.cardStyle.backgroundColor).toBe(lightTokens.severity.criticalBg);
    // §19.31 literal: bold. fontWeight '700' is bold; '600' is semibold.
    expect(c.scoreNumericStyle.fontWeight).toBe('700');
  });
  test('regular weight on stable AND watch numerics (§13.4 explicit)', () => {
    expect(compose('stable', lightTokens).scoreNumericStyle.fontWeight).toBe('400');
    expect(compose('watch', lightTokens).scoreNumericStyle.fontWeight).toBe('400');
  });
});

describe('Vital diff edge cases (§7.5 What\'s new)', () => {
  const baseline = (lane: any, value: number, direction: any = 'stable', outOfRange = false) =>
    ({ lane, value, unit: 'bpm', direction, interpretation: '', outOfRange } as const);

  test('direction flip with no value change still counts', () => {
    const before = [baseline('hr', 70, 'stable')];
    const after = [baseline('hr', 70, 'falling')];
    expect(computeChangedSince(before as any, after as any).length).toBe(1);
  });
  test('range flip (stable -> out-of-range) still counts even if value moved <5%', () => {
    const before = [baseline('hr', 100, 'stable', false)];
    const after = [baseline('hr', 101, 'stable', true)];
    expect(computeChangedSince(before as any, after as any).length).toBe(1);
  });
  test('vital newly added in current set is reported', () => {
    const before: any[] = [];
    const after = [baseline('hr', 70)];
    expect(computeChangedSince(before, after as any)).toHaveLength(1);
  });
  test('caps at three even when 5 vitals all changed', () => {
    const before = [
      baseline('hr', 70), baseline('spo2', 100), baseline('sbp', 120),
      baseline('dbp', 80), baseline('map', 90),
    ];
    const after = before.map((v) => ({ ...v, value: v.value + 50, direction: 'rising' as const }));
    expect(computeChangedSince(before as any, after as any).length).toBeLessThanOrEqual(3);
  });
});

describe('Relative time formatting (§3.2)', () => {
  test('boundary at 60s: 59s renders as "Ns ago", 60s renders as "1m ago"', () => {
    expect(relativeFromNow(new Date(Date.now() - 59_000).toISOString())).toMatch(/s ago$/);
    // 60s rounds to 1 min in our helper.
    expect(relativeFromNow(new Date(Date.now() - 60_000).toISOString())).toMatch(/m ago$/);
  });
  test('boundary at 1h: 59m renders minutes, 60m renders hours', () => {
    expect(relativeFromNow(new Date(Date.now() - 59 * 60_000).toISOString())).toMatch(/m ago$/);
    expect(relativeFromNow(new Date(Date.now() - 60 * 60_000).toISOString())).toMatch(/h ago$/);
  });
  test('boundary at 1d: 23h renders hours, 24h renders days', () => {
    expect(relativeFromNow(new Date(Date.now() - 23 * 3600_000).toISOString())).toMatch(/h ago$/);
    expect(relativeFromNow(new Date(Date.now() - 24 * 3600_000).toISOString())).toMatch(/d ago$/);
  });
  test('a future timestamp is clamped to "0s ago" — never negative or absolute', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(relativeFromNow(future)).toBe('0s ago');
  });
  test('relativeFromEpoch matches relativeFromNow', () => {
    const epoch = Math.floor((Date.now() - 7 * 60_000) / 1000);
    expect(relativeFromEpoch(epoch)).toMatch(/m ago$/);
  });
});

describe('Token shape (§3.2)', () => {
  test('accepts the spec exemplar', () => {
    expect(isPatientToken('PT-9K2X')).toBe(true);
  });
  test('accepts longer legacy IDs from the demo fixtures', () => {
    expect(isPatientToken('PT-84920')).toBe(true);
    expect(isPatientToken('PT-29384')).toBe(true);
  });
  test('rejects lowercase (must be uppercase to be opaque-canonical)', () => {
    expect(isPatientToken('PT-9k2x')).toBe(false);
  });
  test('rejects path traversal attempts', () => {
    expect(isPatientToken('PT-../etc/passwd')).toBe(false);
    expect(isPatientToken('PT-9K2X/../9K2Y')).toBe(false);
  });
  test('rejects shell metacharacters', () => {
    expect(isPatientToken('PT-9K2X;rm')).toBe(false);
    expect(isPatientToken('PT-9K2X|cat')).toBe(false);
  });
  test('rejects empty / undefined-shape', () => {
    expect(isPatientToken('PT-')).toBe(false);
    expect(isPatientToken('')).toBe(false);
  });
});

describe('Privacy audit corner cases (§3.2)', () => {
  test('deeply nested PII still throws', () => {
    expect(() =>
      assertNoPii({ a: { b: { c: { d: { firstName: 'X' } } } } })
    ).toThrow();
  });
  test('PII in array element throws', () => {
    expect(() => assertNoPii([{ ok: true }, { mrn: 'M-1' }])).toThrow();
  });
  test('null and undefined are silent', () => {
    expect(() => assertNoPii(null)).not.toThrow();
    expect(() => assertNoPii(undefined)).not.toThrow();
  });
  test('primitive values are silent (only objects can carry keys)', () => {
    expect(() => assertNoPii('Robert Smith')).not.toThrow();
    expect(() => assertNoPii(42)).not.toThrow();
  });
  test('routingChain carve-out applies only when path includes routingChain', () => {
    // Same key "name" — allowed inside routingChain, denied at root.
    expect(() => assertNoPii({ name: 'X' })).toThrow();
    expect(() => assertNoPii({ activeAlert: { routingChain: [{ name: 'X' }] } })).not.toThrow();
  });
});
