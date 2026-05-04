import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { compose, SeverityState } from '@/theme/severity';
import { type } from '@/theme/typography';
import { Tooltip } from './Tooltip';

type Props = {
  /** Severity state pill (STABLE / WATCH / CRITICAL) used in headers. */
  severity?: SeverityState;
  label: string;
  /** Render with a leading 6px dot — default true for stable. */
  withDot?: boolean;
  outlined?: boolean;
  style?: ViewStyle;
};

/**
 * §13.2 v2.7 + §19.31:
 * - Stable: dot + word, no fill, no border (calm).
 * - Watch:  warm pill with hairline border.
 * - Critical: filled red pill with a bold filled-circle glyph alongside the
 *             word (so the eye can identify state at arm's length in <1s).
 */
export function Pill({ severity, label, withDot, outlined, style }: Props) {
  const t = useTokens();
  const sev = severity ? compose(severity, t) : null;
  const useDot = withDot ?? severity === 'stable';

  const bg = outlined
    ? 'transparent'
    : sev?.pill.backgroundColor ?? t.surface.recess;
  const border = outlined
    ? sev?.pill.color ?? t.text.body
    : sev?.pill.borderColor ?? 'transparent';
  const colour = sev?.pill.color ?? t.text.body;

  // Stable per §13.2 v2.7: dot only, no fill, no border.
  if (severity === 'stable') {
    const inner = (
      <View style={[styles.row, style]}>
        <View style={[styles.dot, { backgroundColor: t.severity.stable }]} />
        <Text style={[type.metadata, { color: t.severity.stable, fontWeight: '600' }]}>{label}</Text>
      </View>
    );
    return <Tooltip kind="severity" accessibilityLabel={`${label} severity`}>{inner}</Tooltip>;
  }

  const inner = (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: outlined || sev?.pill.borderColor ? 0.5 : 0,
        },
        style,
      ]}
    >
      {/* §19.31: critical pill carries a filled-circle glyph alongside the word. */}
      {severity === 'critical' && (
        <Text style={[type.metadata, { color: colour, marginRight: 6, fontWeight: '700' }]}>●</Text>
      )}
      {useDot && severity !== 'critical' && (
        <View style={[styles.dot, { backgroundColor: colour, marginRight: 6 }]} />
      )}
      <Text
        style={[
          type.metadata,
          { color: colour, fontWeight: severity === 'critical' ? '700' : '600' },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return <Tooltip kind="severity" accessibilityLabel={`${label} severity`}>{inner}</Tooltip>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
