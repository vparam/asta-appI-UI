/**
 * Synchronised scrub context — spec §7.5 + §19.27.
 *
 * One context per Patient screen instance. Each TrendChart subscribes to
 * `scrubMin` (the time index in minutes-from-now, 0 = now). When any chart
 * pans, the context's setter updates and every other chart re-renders to
 * the same time index.
 *
 * Implemented as a small Zustand store rather than React Context to avoid
 * triggering re-renders of the whole carousel on every pan tick.
 */

import { create } from 'zustand';

type Store = {
  /** Minutes from now. Negative = past, 0 = now, positive = forecast. */
  scrubMin: number | null;
  setScrub: (v: number | null) => void;
};

export const useScrub = create<Store>((set) => ({
  scrubMin: null,
  setScrub: (v) => set({ scrubMin: v }),
}));
