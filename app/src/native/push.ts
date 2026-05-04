/** Push notification bridge — registers with APNs/FCM and surfaces deep-link payloads. */

import { NativeModules, NativeEventEmitter, EmitterSubscription } from 'react-native';

export type PushPayload = {
  patient_token: string;
  event_id: string;
  severity: 'watch' | 'critical';
  epoch: number;
};

const Native = NativeModules.RNAstaPush as
  | {
      registerForRemoteNotifications: () => Promise<string | null>;
      acknowledgeFromNotification: (eventId: string) => void;
    }
  | undefined;

const emitter = Native ? new NativeEventEmitter(NativeModules.RNAstaPush) : null;

export function registerForPush(): Promise<string | null> {
  return Native?.registerForRemoteNotifications() ?? Promise.resolve(null);
}

export function ackFromNotification(eventId: string): void {
  Native?.acknowledgeFromNotification(eventId);
}

export function subscribeToPushTaps(handler: (p: PushPayload) => void): EmitterSubscription | null {
  return emitter?.addListener('PushTapped', handler) ?? null;
}
