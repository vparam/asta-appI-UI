/**
 * Visual tokens — PPLM Mobile Bedside spec §13 v2.7 (clinical-modern + calm palette).
 *
 * The palette is asymmetric by design:
 *   stable  uses 0.5 visual channels (a 6px green dot)
 *   watch   uses 1 channel (a wash + hairline)
 *   critical uses 3 channels (outline + wash + bold numeric)
 *
 * Severity colours never act as accent. The single deep-teal accent carries
 * the Clinical Action Line, Conversation chips, and link affordances.
 */

export type Mode = 'light' | 'dark';

export type Tokens = {
  surface: {
    canvas: string;
    surface: string;
    recess: string;
    hairline: string;
  };
  text: {
    ink: string;
    body: string;
    mute: string;
    faint: string;
  };
  accent: {
    accent: string;
    accentBg: string;
    accentRule: string;
  };
  severity: {
    stable: string;
    stableBg: string;
    watch: string;
    watchBg: string;
    watchRule: string;
    critical: string;
    criticalBg: string;
    criticalRule: string;
  };
  vital: {
    hr: string;
    spo2: string;
    sbp: string;
    dbp: string;
    map: string;
  };
};

export const lightTokens: Tokens = {
  surface: {
    canvas: '#FBFAF7',
    surface: '#FFFFFF',
    recess: '#F1EEE8',
    hairline: '#E8E2D6',
  },
  text: {
    ink: '#0E1726',
    body: '#1F2937',
    mute: '#6B7280',
    faint: '#9CA3AF',
  },
  accent: {
    accent: '#0F766E',
    accentBg: '#ECF6F4',
    accentRule: '#99D9D2',
  },
  severity: {
    stable: '#047857',
    stableBg: '#EFF6F1',
    watch: '#B45309',
    watchBg: '#FBF1E6',
    watchRule: '#E9C893',
    critical: '#B42318',
    criticalBg: '#FEF1EF',
    criticalRule: '#E89890',
  },
  vital: {
    hr: '#1098AD',
    spo2: '#0E7C8C',
    sbp: '#6E47C7',
    dbp: '#8261D2',
    map: '#14716A',
  },
};

export const darkTokens: Tokens = {
  surface: {
    canvas: '#0A0B0D',
    surface: '#13151A',
    recess: '#1A1D24',
    hairline: '#1F2329',
  },
  text: {
    ink: '#E8E9EB',
    body: '#C5C7CA',
    mute: '#9CA3AF',
    faint: '#6B7280',
  },
  accent: {
    accent: '#5EEAD4',
    accentBg: '#0E2826',
    accentRule: '#134E48',
  },
  severity: {
    stable: '#10B981',
    stableBg: '#0D2418',
    watch: '#F59E0B',
    watchBg: '#3B2810',
    watchRule: '#7A5A2A',
    critical: '#F87171',
    criticalBg: '#3B0F0F',
    criticalRule: '#7A2A2A',
  },
  vital: {
    hr: '#5BD0E0',
    spo2: '#3FB8C8',
    sbp: '#A78BFA',
    dbp: '#BAA0E8',
    map: '#5DAEA6',
  },
};

export function getTokens(mode: Mode): Tokens {
  return mode === 'dark' ? darkTokens : lightTokens;
}
