/**
 * Last-viewed tracking — spec §7.5 v2.4 "What's new since last check" banner.
 * Stored per-(user, patient) on the device only. Not synced across devices in v1.0.
 */

import { MMKV } from 'react-native-mmkv';
import { VitalReading } from '@/data/types';

const storage = new MMKV({ id: 'pplm-last-viewed' });

export type LastViewedEntry = {
  viewedAt: number; // epoch ms
  snapshot: VitalReading[];
};

export const lastViewed = {
  get(token: string): LastViewedEntry | undefined {
    const raw = storage.getString(token);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as LastViewedEntry;
    } catch {
      return undefined;
    }
  },
  set(token: string, snapshot: VitalReading[]): void {
    storage.set(token, JSON.stringify({ viewedAt: Date.now(), snapshot }));
  },
  clear(token: string): void {
    storage.delete(token);
  },
};
