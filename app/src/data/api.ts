/** Typed fetcher for the mock server. Validates every response through the privacy audit. */

import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { assertNoPii } from '@/privacy/audit';
import { PatientFile, PatientToken, RosterEntry } from './types';

// Android emulator can't reach localhost; use 10.0.2.2 instead.
const HOST = Platform.select({
  ios: 'http://localhost:3001',
  android: 'http://10.0.2.2:3001',
  default: 'http://localhost:3001',
});

const queue = new MMKV({ id: 'pplm-offline-queue' });

type QueuedPost = { path: string; body: unknown; queuedAt: number };

function enqueue(path: string, body: unknown) {
  const all: QueuedPost[] = JSON.parse(queue.getString('q') ?? '[]');
  all.push({ path, body, queuedAt: Date.now() });
  queue.set('q', JSON.stringify(all));
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${HOST}${path}`);
  if (!r.ok) throw new Error(`GET ${path} failed: ${r.status}`);
  const json = (await r.json()) as T;
  assertNoPii(json);
  return json;
}

async function post<T>(path: string, body: unknown, opts?: { queueOnFailure?: boolean }): Promise<T> {
  try {
    const r = await fetch(`${HOST}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`POST ${path} failed: ${r.status}`);
    const json = (await r.json()) as T;
    assertNoPii(json);
    return json;
  } catch (e) {
    if (opts?.queueOnFailure) {
      enqueue(path, body);
    }
    throw e;
  }
}

/** Drain the offline queue. Called on app foreground / network recovery. */
export async function drainQueue(): Promise<number> {
  const all: QueuedPost[] = JSON.parse(queue.getString('q') ?? '[]');
  let drained = 0;
  const remaining: QueuedPost[] = [];
  for (const p of all) {
    try {
      await fetch(`${HOST}${p.path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p.body),
      });
      drained += 1;
    } catch {
      remaining.push(p);
    }
  }
  queue.set('q', JSON.stringify(remaining));
  return drained;
}

export const api = {
  roster: () => get<RosterEntry[]>('/patients'),
  patient: (token: PatientToken) => get<PatientFile>(`/patients/${token}`),
  rerun: (token: PatientToken, body: { lactate?: number; temp?: number; o2?: number }) =>
    post<{
      patient: PatientFile;
      receipts: {
        score: { from: number; to: number; copy: string } | null;
        confidence: { from: string; to: string; copy: string } | null;
      };
    }>(`/patients/${token}/rerun`, body),
  acknowledgeAlert: (eventId: string, via: 'in-app' | 'notification') =>
    post<{ ok: true; via: string }>(`/alerts/${eventId}/ack`, { via }, { queueOnFailure: true }),
  scenarioFeedback: (token: PatientToken, scenarioId: string, kind: 'confirm' | 'false' | 'uncertain') =>
    post<{ ok: true }>(`/patients/${token}/feedback`, { scenarioId, kind }, { queueOnFailure: true }),
  /** §19.3: privacy acknowledgement audit row. Account identifier is hashed server-side. */
  privacyAck: (appVersion: string) =>
    post<{ ok: true }>('/privacy/ack', { appVersion }, { queueOnFailure: true }),
  setDevState: (state: 'stable' | 'watch' | 'critical') =>
    post<{ state: string }>('/dev/state', { state }),
  testPush: (token: PatientToken, severity: 'watch' | 'critical') =>
    post<{ sent: boolean; payload: unknown }>('/push/test', { token, severity }),
};
