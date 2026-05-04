/**
 * Type ramp — spec §13.4. SF Pro on iOS, Roboto on Android, both have
 * tabular-figure variants natively. Risk score numeric is regular weight in
 * stable AND watch, semibold ONLY in critical (this is an explicit v2.7 rule
 * — watch's calmer treatment depends on the numeric not stealing weight).
 */

import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'SF Pro',
  android: 'Roboto',
  default: 'System',
});

const monoFamily = Platform.select({
  ios: 'SF Mono',
  android: 'monospace',
  default: 'monospace',
});

const tabular: Pick<TextStyle, 'fontVariant'> = {
  fontVariant: ['tabular-nums'],
};

export const type = {
  title: {
    fontFamily,
    fontSize: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  riskScore: {
    fontFamily,
    fontSize: 56,
    fontWeight: '400' as const,
    ...tabular,
  },
  riskScoreCritical: {
    fontFamily,
    fontSize: 56,
    fontWeight: '600' as const,
    ...tabular,
  },
  vitalNumeric: {
    fontFamily,
    fontSize: 32,
    fontWeight: '400' as const,
    ...tabular,
  },
  cardTitle: {
    fontFamily,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily,
    fontSize: 15,
    fontWeight: '400' as const,
  },
  bodySemibold: {
    fontFamily,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  metadata: {
    fontFamily,
    fontSize: 13,
    fontWeight: '400' as const,
  },
  smallCaps: {
    fontFamily,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  mono: {
    fontFamily: monoFamily,
    fontSize: 13,
    fontWeight: '400' as const,
    ...tabular,
  },
} satisfies Record<string, TextStyle>;
