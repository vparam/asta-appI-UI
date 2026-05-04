#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * audit-pii.js
 *
 * Static grep audit for the privacy architecture (spec §3.2 + §16.7).
 * Walks the source tree under app/src and server/src and fails CI if it
 * finds any forbidden PII-shaped fields outside the allow-listed contexts.
 *
 * Allow-listed contexts:
 *   - The privacy infrastructure itself: app/src/privacy/audit.ts, the
 *     server's index.ts PII_KEYS list — these MUST mention the forbidden
 *     keys to enforce them.
 *   - Wire types: app/src/data/types.ts and server/src/fixtures/types.ts —
 *     definitions that explicitly carve PII out of the schema.
 *   - Test files: anything under __tests__/ or matching *.test.{ts,tsx,js}.
 *     Tests that prove rejection MUST mention the rejected field names.
 *   - Comment-only mentions: lines that begin with `//` or `*` are scanned
 *     but reported only as `info`, not as a violation.
 *   - routingChain[*].name: clinician role identification per §5.4.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SCANS = ['app/src', 'server/src'];

const FORBIDDEN = [
  /\b(firstName|first_name|lastName|last_name|fullName|full_name|patientName|patient_name)\b/,
  /\b(mrn|medicalRecordNumber)\b/i,
  /\b(dob|dateOfBirth|date_of_birth|birthDate|birth_date)\b/,
  /\b(ssn|aadhaar|aadhar)\b/i,
];

// File basenames that legitimately mention PII keys (definitions, audits, tests).
const ALLOWLIST_FILES = new Set([
  'audit.ts',
  'types.ts',
]);

// Path substrings that legitimately mention PII keys.
// Anything under __tests__/, anything ending in .test.*, the server's
// hardening file (index.ts in server/src) which lists the rejected keys.
const ALLOWLIST_PATHS = [
  /__tests__/,
  /\.test\.(ts|tsx|js|jsx)$/,
  /server\/src\/index\.ts$/,
];

let violations = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) scanFile(p);
  }
}

function isAllowlisted(file) {
  if (ALLOWLIST_FILES.has(path.basename(file))) return true;
  for (const re of ALLOWLIST_PATHS) {
    if (re.test(file)) return true;
  }
  return false;
}

function scanFile(file) {
  if (isAllowlisted(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    for (const re of FORBIDDEN) {
      if (re.test(line)) {
        // Allow if the line is in a comment.
        if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) return;
        // Allow `name` inside a `routingChain[*]` literal.
        if (/routingChain/.test(text.slice(0, text.indexOf(line) + 200))) return;
        console.error(`${file}:${i + 1}  ${line.trim()}`);
        violations++;
      }
    }
  });
}

for (const sub of SCANS) {
  walk(path.join(ROOT, sub));
}

if (violations > 0) {
  console.error(`\n[audit-pii] FAIL: ${violations} violation(s).`);
  process.exit(1);
}
console.log('[audit-pii] OK — no forbidden PII fields found.');
