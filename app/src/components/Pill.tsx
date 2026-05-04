import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { compose, SeverityState } from '@/theme/severity';
import { type } from '@/theme/typography';

type Props = {
  /** Severity state pill (STABLE / WATCH / CRITICAL) used in headers. */
  severity?: SeverityState;
  label: string;
  /** Render with a leading 6px dot — default true for stable. */
  withDot?: boolean;
  outlined?: boolean;
  style?: ViewStyle;
};

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
    return (
      <View style={[styles.row, style]}>
        <View style={[styles.dot, { backgroundColor: t.severity.stable }]} />
        <Text style={[type.metadata, { color: t.severity.stable, fontWeight: '600' }]}>{label}</Text>
      </View>
    );
  }

  return (
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
      {useDot && <View style={[styles.dot, { backgroundColor: colour, marginRight: 6 }]} />}
      <Text style={[type.metadata, { color: colour, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
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
