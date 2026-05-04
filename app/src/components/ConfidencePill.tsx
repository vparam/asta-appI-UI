import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { ConfidencePill as ConfidencePillT } from '@/data/types';

type Props = {
  pill: ConfidencePillT;
};

const LABEL: Record<ConfidencePillT['label'], string> = {
  low: 'Low confidence',
  moderate: 'Moderate confidence',
  high: 'High confidence',
};

/**
 * §7.2: every confidence pill leads with the interpreted label and the
 * percent in parentheses. The "· uncertain signal" suffix appears only on
 * the headline pill (§7.2 only) and only when label === 'low'.
 * §6.2: nested pills inside Scenario Matrix or Forecast sub-cards do NOT
 * repeat the suffix — they pass `showUncertainHint: false`.
 */
export function ConfidencePill({ pill }: Props) {
  const t = useTokens();

  const colour =
    pill.label === 'low'
      ? t.severity.watch
      : pill.label === 'moderate'
        ? t.text.body
        : t.severity.stable;

  const bg =
    pill.label === 'low'
      ? t.severity.watchBg
      : pill.label === 'high'
        ? t.severity.stableBg
        : 'transparent';

  const border =
    pill.label === 'low'
      ? t.severity.watchRule
      : pill.label === 'moderate'
        ? t.surface.hairline
        : t.severity.stable;

  const text = `${LABEL[pill.label]} (${pill.percent}%)${
    pill.showUncertainHint && pill.label === 'low' ? ' · uncertain signal' : ''
  }`;

  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: bg, borderColor: border, borderWidth: bg === 'transparent' ? 1 : 0.5 },
      ]}
    >
      <Text style={[type.metadata, { color: colour, fontWeight: '600' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
});
