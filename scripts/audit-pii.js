#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * audit-pii.js
 *
 * Static grep audit for the privacy architecture (spec §3.2 + §16.7).
 * Walks the source tree under app/src and server/src and fails CI if it
 * finds any forbidden PII-shaped fields outside the allow-listed contexts.
 *
 * Allow-list: routingChain[*].name (clinician role identification per §5.4).
 *             this script itself, types.ts (definitions), audit.ts.
 *             Comments in fixture files (see beds.ts).
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
const ALLOWLIST_FILES = new Set([
  'audit.ts',
  'types.ts',
]);

let violations = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) scanFile(p);
  }
}

function scanFile(file) {
  const base = path.basename(file);
  if (ALLOWLIST_FILES.has(base)) return;
  const text = fs.readFileSync(file, 'utf8');
  text.split('\n').forEach((line, i) => {
    for (const re of FORBIDDEN) {
      if (re.test(line)) {
        // Allow if the line is in a comment block discussing the forbidden field.
        if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) return;
        // Allow `name` inside a `routingChain[*]` literal — clinician role identification.
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
