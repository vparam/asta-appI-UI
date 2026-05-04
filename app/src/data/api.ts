/** Typed fetcher for the mock server. Validates every response through the privacy audit. */

import { Platform } from 'react-native';
import { assertNoPii } from '@/privacy/audit';
import { PatientFile, PatientToken, RosterEntry } from './types';

// Android emulator can't reach localhost; use 10.0.2.2 instead.
const HOST = Platform.select({
  ios: 'http://localhost:3001',
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${HOST}${path}`);
  if (!r.ok) throw new Error(`GET ${path} failed: ${r.status}`);
  const json = (await r.json()) as T;
  assertNoPii(json);
  return json;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${HOST}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${path} failed: ${r.status}`);
  const json = (await r.json()) as T;
  assertNoPii(json);
  return json;
}

export const api = {
  roster: () => get<RosterEntry[]>('/patients'),
  patient: (token: PatientToken) => get<PatientFile>(`/patients/${token}`),
  rerun: (token: PatientToken, body: { lactate?: number }) =>
    post<{
      patient: PatientFile;
      receipts: {
        score: { from: number; to: number; copy: string };
        confidence: { from: string; to: string; copy: string } | null;
      };
    }>(`/patients/${token}/rerun`, body),
  setDevState: (state: 'stable' | 'watch' | 'critical') =>
    post<{ state: string }>('/dev/state', { state }),
  testPush: (token: PatientToken, severity: 'watch' | 'critical') =>
    post<{ sent: boolean; payload: unknown }>('/push/test', { token, severity }),
};
