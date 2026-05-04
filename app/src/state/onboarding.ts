/** Onboarding state — privacy ack (per account), density choice (per device). */

import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'pplm-prefs' });

type Store = {
  privacyAcknowledged: boolean;
  onboardingComplete: boolean;
  acknowledgePrivacy: () => void;
  completeOnboarding: () => void;
  reset: () => void;
};

export const useOnboarding = create<Store>((set) => ({
  privacyAcknowledged: storage.getBoolean('privacyAck') ?? false,
  onboardingComplete: storage.getBoolean('onboardingComplete') ?? false,
  acknowledgePrivacy: () => {
    storage.set('privacyAck', true);
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
