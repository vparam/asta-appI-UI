/**
 * Privacy audit — spec §3.2 + §16.7.
 *
 * No surface in this product may render a patient name, MRN, DOB, or any
 * other PII. This module is a runtime tripwire used inside data fetchers
 * and as a unit-test helper. The CI script `yarn audit:pii` runs a static
 * grep across the bundled JS and the running server response.
 */

const PII_SHAPED_KEYS = new Set([
  'name',
  'firstName',
  'first_name',
  'lastName',
  'last_name',
  'fullName',
  'full_name',
  'patientName',
  'patient_name',
  'mrn',
  'medicalRecordNumber',
  'dob',
  'dateOfBirth',
  'date_of_birth',
  'birthDate',
  'birth_date',
  'address',
  'phone',
  'phoneNumber',
  'phone_number',
  'email',
  'ssn',
  'aadhaar',
  'aadhar',
]);

/** Field names allow-listed because they describe a clinician role/responder, not a patient. */
const ROLE_NAME_KEYS = new Set([
  'role',
  'recipientRole',
  'recipient_role',
]);

export class PrivacyAuditError extends Error {
  constructor(message: string) {
    super(`[PrivacyAudit] ${message}`);
    this.name = 'PrivacyAuditError';
  }
}

export function assertNoPii(obj: unknown, path = '$'): void {
  if (obj === null || obj === undefined) return;
  if (typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => assertNoPii(item, `${path}[${i}]`));
    return;
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_SHAPED_KEYS.has(key) && !ROLE_NAME_KEYS.has(key)) {
      // Allow `name` only inside a `routingChain[*]` entry (clinician name) — the spec
      // permits clinician identification on the escalation sheet (§5.4). Detect by
      // inspecting the path.
      const isClinicianContext = path.includes('routingChain');
      if (!isClinicianContext) {
        throw new PrivacyAuditError(
          `Forbidden field "${key}" at ${path}. Patients are identified by ward + bed + opaque token only.`
        );
      }
    }
    assertNoPii(value, `${path}.${key}`);
  }
}

/** Validates that a patient identifier string is the opaque-token shape. */
export function isPatientToken(s: string): s is `PT-${string}` {
  return /^PT-[A-Z0-9]{4}$/.test(s);
}
