/**
 * Severity composer — spec §13.2 calm register.
 *
 * v2.7 deliberately drops the v2.2 "same number of channels for watch and
 * critical" rule. Watch must be visible; critical must dominate. The eye
 * should not look for stable.
 */

import { ViewStyle, TextStyle } from 'react-native';
import { Tokens } from './tokens';

export type SeverityState = 'stable' | 'watch' | 'critical';

export type SeverityComposition = {
  cardStyle: ViewStyle;
  scoreNumericStyle: TextStyle;
  /** Use as a small dot/glyph next to the state word. */
  dotColour: string;
  /** Pill background + text colour for the headline pill. */
  pill: { backgroundColor: string; color: string; borderColor?: string };
};

export function compose(state: SeverityState, t: Tokens): SeverityComposition {
  switch (state) {
    case 'stable':
      // 0.5 channels: a 6px dot and nothing else.
      return {
        cardStyle: {
          backgroundColor: t.surface.surface,
          borderColor: t.surface.hairline,
          borderWidth: 0,
        },
        scoreNumericStyle: { color: t.text.ink, fontWeight: '400' },
        dotColour: t.severity.stable,
        pill: {
          backgroundColor: 'transparent',
          color: t.severity.stable,
        },
      };

    case 'watch':
      // 1 channel: a soft warm wash + a left-edge hairline.
      return {
        cardStyle: {
          backgroundColor: t.surface.surface,
          borderLeftColor: t.severity.watchRule,
          borderLeftWidth: 1,
        },
        scoreNumericStyle: { color: t.text.ink, fontWeight: '400' },
        dotColour: t.severity.watch,
        pill: {
          backgroundColor: t.severity.watchBg,
          color: t.severity.watch,
          borderColor: t.severity.watchRule,
        },
      };

    case 'critical':
      // 3 channels: full outline + wash + bold numeric (§19.31 literal: 'bold').
      return {
        cardStyle: {
          backgroundColor: t.severity.criticalBg,
          borderColor: t.severity.criticalRule,
          borderWidth: 2,
        },
        scoreNumericStyle: { color: t.severity.critical, fontWeight: '700' },
        dotColour: t.severity.critical,
        pill: {
          backgroundColor: t.severity.critical,
          color: '#FFFFFF',
        },
      };
  }
}

/** Severity for a numeric risk score. Default bands per spec — configurable per ward in production. */
export function scoreToState(score: number): SeverityState {
  if (score >= 61) return 'critical';
  if (score >= 31) return 'watch';
  return 'stable';
}
