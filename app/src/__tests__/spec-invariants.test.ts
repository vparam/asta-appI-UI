/**
 * Spec invariants — pins the §19 acceptance criteria that are testable
 * without rendering. Renderer-level tests live in __tests__/components/*.
 */

import { assertNoPii, PrivacyAuditError, isPatientToken } from '@/privacy/audit';
import { computeChangedSince } from '@/data/diff';
import { relativeFromNow } from '@/data/time';

describe('§19.1 — privacy audit refuses PII fields', () => {
  test('throws on `name` outside routingChain', () => {
    expect(() => assertNoPii({ name: 'Robert' })).toThrow(PrivacyAuditError);
  });
  test('allows `name` inside routingChain (clinician name)', () => {
    expect(() =>
      assertNoPii({ activeAlert: { routingChain: [{ name: 'Dr. Priya', role: 'On-call' }] } })
    ).not.toThrow();
  });
  test('throws on mrn / dob / address regardless of context', () => {
    expect(() => assertNoPii({ patient: { mrn: 'MR-001' } })).toThrow();
    expect(() => assertNoPii({ patient: { dob: '1980-01-01' } })).toThrow();
  });
});

describe('§3.2 — opaque token shape', () => {
  test('valid', () => {
    expect(isPatientToken('PT-9K2X')).toBe(true);
  });
  test('invalid — too short', () => {
    expect(isPatientToken('PT-9')).toBe(false);
  });
  test('invalid — wrong prefix', () => {
    expect(isPatientToken('XX-9K2X')).toBe(false);
  });
});

describe('§19.18 — vital diff caps at three changes', () => {
  test('change in five vitals returns at most 3', () => {
    const before = [
      { lane: 'hr', value: 70, unit: 'bpm', direction: 'stable', interpretation: '', outOfRange: false },
      { lane: 'spo2', value: 100, unit: '%', direction: 'stable', interpretation: '', outOfRange: false },
      { lane: 'sbp', value: 120, unit: 'mmHg', direction: 'stable', interpretation: '', outOfRange: false },
      { lane: 'dbp', value: 80, unit: 'mmHg', direction: 'stable', interpretation: '', outOfRange: false },
      { lane: 'map', value: 90, unit: 'mmHg', direction: 'stable', interpretation: '', outOfRange: false },
    ] as const;
    const after = before.map((v) => ({ ...v, value: v.value + 50, direction: 'rising' as const }));
    expect(computeChangedSince(before as any, after as any).length).toBeLessThanOrEqual(3);
  });
  test('returns nothing when nothing significant changed', () => {
    const before = [{ lane: 'hr', value: 70, unit: 'bpm', direction: 'stable', interpretation: '', outOfRange: false }];
    const after = [{ lane: 'hr', value: 71, unit: 'bpm', direction: 'stable', interpretation: '', outOfRange: false }];
    expect(computeChangedSince(before as any, after as any).length).toBe(0);
  });
});

describe('§3.2 — relative time helper', () => {
  test('renders seconds for very recent', () => {
    const iso = new Date(Date.now() - 12_000).toISOString();
    expect(relativeFromNow(iso)).toMatch(/^\d+s ago$/);
  });
  test('renders minutes for sub-hour', () => {
    const iso = new Date(Date.now() - 7 * 60_000).toISOString();
    expect(relativeFromNow(iso)).toMatch(/^\d+m ago$/);
  });
  test('never renders an absolute clock time', () => {
    const iso = new Date(Date.now() - 90_000_000).toISOString();
    const out = relativeFromNow(iso);
    expect(out).not.toMatch(/\d{1,2}:\d{2}/);
  });
});
