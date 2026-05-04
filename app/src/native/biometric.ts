import { NativeModules } from 'react-native';

const Native = NativeModules.RNAstaBiometric as
  | { authenticate: (reason: string) => Promise<boolean> }
  | undefined;

export async function requireBiometric(reason = 'Unlock PPLM Bedside'): Promise<boolean> {
  if (!Native) return true; // Allow unauthenticated when running in JS-only test envs.
  try {
    return await Native.authenticate(reason);
  } catch {
    return false;
  }
}
