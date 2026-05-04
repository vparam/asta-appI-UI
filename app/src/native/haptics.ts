/**
 * JS bridge for native haptics — implements §13.6 patterns.
 * Falls back to a no-op when the native module is not loaded (e.g. unit tests).
 */

import { NativeModules } from 'react-native';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'paired-heavy' | 'tick';

const Native = NativeModules.RNAstaHaptics as
  | { trigger: (pattern: HapticPattern) => void }
  | undefined;

export function triggerHaptic(pattern: HapticPattern): void {
  try {
    Native?.trigger(pattern);
  } catch {
    // Swallow — haptics are nice-to-have.
  }
}
