/**
 * Telemetry — spec §15.
 *
 * Documented events, each with a typed payload. The `emit` function is a
 * single sink so we can swap out the transport (console / production
 * analytics endpoint) without touching call sites.
 *
 * Patient identifiers in payloads are opaque tokens only — never names,
 * never absolute timestamps that combined with bed could re-identify.
 */

import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'pplm-telemetry' });

export type TelemetryEvent =
  | { name: 'patient_screen_open'; props: { token: string } }
  | { name: 'alert_landing_time_ms'; props: { token: string; eventId: string; durationMs: number } }
  | { name: 'alert_acknowledged'; props: { eventId: string; via: 'in-app' | 'notification' } }
  | { name: 'alert_escalate_opened'; props: { eventId: string } }
  | { name: 'alert_escalated'; props: { eventId: string; role: string } }
  | { name: 'alert_auto_escalated'; props: { eventId: string; toRole: string } }
  | { name: 'rerun_completed'; props: { token: string; scoreFrom?: number; scoreTo?: number } }
  | { name: 'density_changed'; props: { density: 'simple' | 'detailed' } }
  | { name: 'scenario_feedback'; props: { scenarioId: string; kind: 'confirm' | 'false' | 'uncertain'; patientToken?: string } }
  | { name: 'add_bedside_data_opened'; props: { token: string; via: 'contextual_prompt' | 'manual' } }
  | { name: 'add_bedside_data_saved'; props: { token: string; rerun: boolean } }
  | { name: 'conversation_opened'; props: { token: string } }
  | { name: 'whats_new_shown'; props: { token: string; minutesAgo: number; vitalCount: number } }
  | { name: 'whats_new_dismissed'; props: { token: string } }
  | { name: 'tooltip_opened'; props: { kind: 'confidence' | 'timesfm' | 'severity' | 'risk_score' } };

type EventName = TelemetryEvent['name'];
type PropsOf<N extends EventName> = Extract<TelemetryEvent, { name: N }>['props'];

const QUEUE_KEY = 'queue.v1';

function loadQueue(): { name: string; props: unknown; t: number }[] {
  try {
    return JSON.parse(storage.getString(QUEUE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveQueue(q: unknown[]): void {
  storage.set(QUEUE_KEY, JSON.stringify(q));
}

export const telemetry = {
  emit<N extends EventName>(name: N, props: PropsOf<N>): void {
    const event = { name, props, t: Date.now() };
    if (__DEV__) {
      console.log(`[telemetry] ${name}`, props);
    }
    const q = loadQueue();
    q.push(event);
    // Cap the local queue at 200 events; older drop on the floor.
    if (q.length > 200) q.splice(0, q.length - 200);
    saveQueue(q);
  },
  /** Dev / test helper. */
  drain(): unknown[] {
    const q = loadQueue();
    saveQueue([]);
    return q;
  },
};
