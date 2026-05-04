/** Onboarding state — privacy ack (per account), density choice (per device). */

import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';
import { telemetry } from './telemetry';
import { api } from '@/data/api';

const storage = new MMKV({ id: 'pplm-prefs' });

const APP_VERSION = `0.1.0+${Platform.OS}`;

type Store = {
  privacyAcknowledged: boolean;
  onboardingComplete: boolean;
  acknowledgePrivacy: () => void;
  completeOnboarding: () => void;
  reset: () => void;
};

/**
 * §19.3 acknowledgement is logged in three ways for redundancy:
 *   1. Local MMKV flag (so the user is not re-prompted on this device).
 *   2. Telemetry event (so the deployment team can audit acknowledgement
 *      rate across the org).
 *   3. Server audit row via /privacy/ack (so a regulator reviewing the audit
 *      pipeline sees an explicit acknowledgement record per account).
 *
 * The server POST is queued offline and drained on reconnect — same pattern
 * as alert ack and scenario feedback.
 */
export const useOnboarding = create<Store>((set) => ({
  privacyAcknowledged: storage.getBoolean('privacyAck') ?? false,
  onboardingComplete: storage.getBoolean('onboardingComplete') ?? false,
  acknowledgePrivacy: () => {
    storage.set('privacyAck', true);
    telemetry.emit('privacy_ack', { appVersion: APP_VERSION });
    api.privacyAck(APP_VERSION).catch(() => undefined);
    set({ privacyAcknowledged: true });
  },
  completeOnboarding: () => {
    storage.set('onboardingComplete', true);
    set({ onboardingComplete: true });
  },
  reset: () => {
    storage.delete('privacyAck');
    storage.delete('onboardingComplete');
    set({ privacyAcknowledged: false, onboardingComplete: false });
  },
}));
