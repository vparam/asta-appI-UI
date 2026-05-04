/**
 * Server endpoint tests + red-team / security probes.
 * Run with `npm test` (uses node --test --import tsx).
 *
 * Each test exercises one of:
 *   1. The §19 acceptance contract (token shape, audit row, action_source).
 *   2. A red-team threat (PII injection, path traversal, oversized payload,
 *      rate limiting, audit log tamper).
 */

process.env.PPLM_NO_LISTEN = '1';

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/index.ts';

// ---------------------------------------------------------------------------
// Sanity / contract
// ---------------------------------------------------------------------------

describe('Health + contract', () => {
  test('GET /health returns ok', async () => {
    const r = await request(app).get('/health');
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { ok: true });
  });

  test('GET /patients returns 5 beds, all with token-only identification', async () => {
    const r = await request(app).get('/patients');
    assert.equal(r.status, 200);
    assert.equal(r.body.length, 5);
    for (const entry of r.body) {
      assert.match(entry.bed.token, /^PT-[A-Z0-9]{4,12}$/);
      assert.equal(entry.bed.name, undefined);
      assert.equal(entry.bed.firstName, undefined);
      assert.equal(entry.bed.mrn, undefined);
    }
  });

  test('GET /patients/:token returns the spec exemplar values for PT-9K2X', async () => {
    const r = await request(app).get('/patients/PT-9K2X');
    assert.equal(r.status, 200);
    assert.equal(r.body.bed.token, 'PT-9K2X');
    assert.equal(r.body.read.score, 19);
    assert.equal(r.body.read.scenarios[0].title, 'Shock / sepsis progression pattern');
    assert.equal(r.body.read.scenarios[0].confidence.percent, 17);
  });
});

// ---------------------------------------------------------------------------
// §19.7 — ack endpoint records action_source
// ---------------------------------------------------------------------------

describe('§19.7 ack endpoint', () => {
  test('ack via notification writes audit row with action_source = notification quick action', async () => {
    const ack = await request(app)
      .post('/alerts/evt-7c3a-2026-05-02T02-14-27Z/ack')
      .send({ via: 'notification' });
    assert.equal(ack.status, 200);
    assert.equal(ack.body.ok, true);

    const audit = await request(app).get('/audit');
    const rows = audit.body as Array<{ kind: string; details: { action_source?: string; eventId?: string } }>;
    const ackRow = rows.find((r) => r.kind === 'alert_ack' && r.details.eventId?.startsWith('evt-7c3a'));
    assert.ok(ackRow, 'expected an alert_ack audit row');
    assert.equal(ackRow!.details.action_source, 'notification quick action');
  });

  test('ack via in-app writes audit row with action_source = in-app button', async () => {
    const ack = await request(app).post('/alerts/evt-test/ack').send({ via: 'in-app' });
    assert.equal(ack.status, 200);
    const audit = await request(app).get('/audit');
    const rows = audit.body as Array<{ kind: string; details: { action_source?: string } }>;
    const last = rows.filter((r) => r.kind === 'alert_ack').pop();
    assert.equal(last?.details.action_source, 'in-app button');
  });

  test('invalid event id is rejected', async () => {
    // Single-segment payload: ID validator fires → 400.
    const r = await request(app).post('/alerts/javascript:alert(1)/ack').send({ via: 'in-app' });
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'invalid_event_id');
  });

  test('XSS payload with embedded slashes never reaches the handler (route 404)', async () => {
    // `</script>` contains a `/` so Express splits the URL; the route doesn't
    // match → 404. Either 400 or 404 is an acceptable mitigation outcome —
    // both mean the handler never ran.
    const r = await request(app).post('/alerts/<script>alert(1)</script>/ack').send({ via: 'in-app' });
    assert.ok(r.status === 400 || r.status === 404, `expected 400 or 404, got ${r.status}`);
  });

  test('invalid via value is rejected', async () => {
    const r = await request(app).post('/alerts/evt-x123/ack').send({ via: 'magic' });
    assert.equal(r.status, 400);
  });
});

// ---------------------------------------------------------------------------
// §19.20 — rerun receipts honest about cause
// ---------------------------------------------------------------------------

describe('§19.20 rerun receipts', () => {
  test('lactate=2.4 from stable score 19 produces neutral score copy + causal confidence copy', async () => {
    // Reset.
    await request(app).post('/dev/state').send({ state: 'stable' });
    await request(app).get('/patients/PT-9K2X');
    const r = await request(app).post('/patients/PT-9K2X/rerun').send({ lactate: 2.4 });
    assert.equal(r.status, 200);
    assert.match(r.body.receipts.score.copy, /^Risk score updated: \d+ → \d+ after data entry$/);
    assert.equal(r.body.receipts.confidence.copy, 'Confidence improved: Low → Moderate');
    // Score is honest — should be ≤ 19 (some reduction), not the bogus 32.
    assert.ok(r.body.patient.read.score <= 19, 'score should drop or stay');
  });

  test('out-of-range lactate is silently ignored (no rerun)', async () => {
    await request(app).post('/dev/state').send({ state: 'stable' });
    await request(app).get('/patients/PT-9K2X');
    const r = await request(app).post('/patients/PT-9K2X/rerun').send({ lactate: 99 });
    // 99 mmol/L is rejected by isFiniteNumber range — no rerun fires.
    assert.equal(r.body.receipts.score, null);
    assert.equal(r.body.receipts.confidence, null);
  });

  test('non-numeric lactate is silently ignored', async () => {
    const r = await request(app).post('/patients/PT-9K2X/rerun').send({ lactate: '<script>' });
    assert.equal(r.body.receipts.score, null);
  });
});

// ---------------------------------------------------------------------------
// §3.2 — token shape guard
// ---------------------------------------------------------------------------

describe('§3.2 token shape guard', () => {
  test('valid token is accepted', async () => {
    const r = await request(app).get('/patients/PT-9K2X');
    assert.equal(r.status, 200);
  });

  test('path traversal token returns 400', async () => {
    const r = await request(app).get('/patients/PT-..%2Fetc%2Fpasswd');
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'invalid_token');
  });

  test('lowercase token returns 400', async () => {
    const r = await request(app).get('/patients/PT-9k2x');
    assert.equal(r.status, 400);
  });

  test('SQL-shaped token returns 400', async () => {
    const r = await request(app).get(`/patients/${encodeURIComponent("PT-9K2X' OR '1'='1")}`);
    assert.equal(r.status, 400);
  });
});

// ---------------------------------------------------------------------------
// Threat: PII smuggled into a request body
// ---------------------------------------------------------------------------

describe('Threat: PII in request body is rejected', () => {
  test('rerun body containing firstName is rejected', async () => {
    const r = await request(app).post('/patients/PT-9K2X/rerun').send({ lactate: 2.4, firstName: 'Robert' });
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'pii_in_request');
    assert.equal(r.body.key, 'firstName');
  });

  test('feedback body containing dob is rejected', async () => {
    const r = await request(app).post('/patients/PT-9K2X/feedback').send({ scenarioId: 'shock-sepsis', kind: 'confirm', dob: '1980-01-01' });
    assert.equal(r.status, 400);
  });

  test('nested PII (deeply buried) is rejected', async () => {
    const r = await request(app).post('/patients/PT-9K2X/rerun').send({ lactate: 1, meta: { deep: { mrn: 'M-1' } } });
    assert.equal(r.status, 400);
  });

  test('attempt to add account `name` to privacy ack is rejected', async () => {
    const r = await request(app).post('/privacy/ack').send({ name: 'Robert', appVersion: 'v1' });
    assert.equal(r.status, 400);
  });
});

// ---------------------------------------------------------------------------
// Threat: oversized payload
// ---------------------------------------------------------------------------

describe('Threat: oversized JSON', () => {
  test('20 KB body is rejected by express.json limit', async () => {
    const huge = { lactate: 1, payload: 'x'.repeat(20 * 1024) };
    const r = await request(app).post('/patients/PT-9K2X/rerun').send(huge);
    // express body-parser returns 413 when over the configured limit.
    assert.ok(r.status === 413 || r.status === 400, `unexpected status ${r.status}`);
  });
});

// ---------------------------------------------------------------------------
// Threat: scenario feedback with malformed kind
// ---------------------------------------------------------------------------

describe('Threat: scenario feedback validation', () => {
  test('invalid kind is rejected', async () => {
    const r = await request(app).post('/patients/PT-9K2X/feedback').send({ scenarioId: 'shock-sepsis', kind: 'weaponize' });
    assert.equal(r.status, 400);
  });
  test('missing scenarioId is rejected', async () => {
    const r = await request(app).post('/patients/PT-9K2X/feedback').send({ kind: 'confirm' });
    assert.equal(r.status, 400);
  });
  test('scenarioId with shell metachars is rejected', async () => {
    const r = await request(app).post('/patients/PT-9K2X/feedback').send({ scenarioId: 'shock; rm -rf /', kind: 'confirm' });
    assert.equal(r.status, 400);
  });
});

// ---------------------------------------------------------------------------
// Audit log integrity — append-only, no PII ever
// ---------------------------------------------------------------------------

describe('Audit log integrity', () => {
  test('audit rows accumulate and remain in order (append-only)', async () => {
    const before = await request(app).get('/audit');
    const beforeLen = before.body.length;
    await request(app).post('/alerts/evt-aud-1/ack').send({ via: 'in-app' });
    await request(app).post('/alerts/evt-aud-2/ack').send({ via: 'notification' });
    const after = await request(app).get('/audit');
    assert.ok(after.body.length >= beforeLen + 2);
    const last = after.body[after.body.length - 1];
    const prev = after.body[after.body.length - 2];
    assert.ok(last.t >= prev.t, 'audit timestamps must be non-decreasing');
  });

  test('audit log contains no name-shaped keys', async () => {
    const r = await request(app).get('/audit');
    const json = JSON.stringify(r.body);
    assert.ok(!/"firstName"/.test(json));
    assert.ok(!/"patient_name"/.test(json));
    assert.ok(!/"mrn"/.test(json));
    assert.ok(!/"dob"/.test(json));
  });
});

// ---------------------------------------------------------------------------
// §5.3 — push test endpoint payload schema
// ---------------------------------------------------------------------------

describe('§5.3 push payload schema', () => {
  test('contains exactly the four keys: patient_token, event_id, severity, epoch', async () => {
    const r = await request(app).post('/push/test').send({ token: 'PT-9K2X', severity: 'watch' });
    assert.equal(r.status, 200);
    assert.deepEqual(Object.keys(r.body.payload).sort(), ['epoch', 'event_id', 'patient_token', 'severity']);
  });
  test('attacker sending severity="custom-script" is normalised to "watch"', async () => {
    const r = await request(app).post('/push/test').send({ token: 'PT-9K2X', severity: '<script>' });
    assert.equal(r.body.payload.severity, 'watch');
  });
  test('invalid token field is normalised to default — no path-traversal echoed back', async () => {
    const r = await request(app).post('/push/test').send({ token: '../etc/passwd', severity: 'watch' });
    assert.equal(r.body.payload.patient_token, 'PT-9K2X');
  });
});
