/** Density store — Simple / Detailed (§9.2). Sticky per device via MMKV. */

import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'pplm-prefs' });
const KEY = 'density';

export type Density = 'simple' | 'detailed';

type Store = {
  density: Density;
  set: (d: Density) => void;
};

export const useDensity = create<Store>((set) => ({
  density: (storage.getString(KEY) as Density) ?? 'simple',
  set: (d) => {
    storage.set(KEY, d);
    set({ density: d });
  },
}));
