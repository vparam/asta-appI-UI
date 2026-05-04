import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { compose, SeverityState } from '@/theme/severity';
import { type } from '@/theme/typography';

type Props = {
  score: number;
  state: SeverityState;
};

/**
 * Risk score numeric — §7.2 + §13.4.
 * Regular weight in stable AND watch. SEMIBOLD only in critical.
 * Watch wraps the numeric in a thin amber outline (§13.2 v2.7 left-edge
 * treatment lives on the parent card, not on the numeric).
 */
export function RiskScore({ score, state }: Props) {
  const t = useTokens();
  const sev = compose(state, t);

  return (
    <View style={styles.row}>
      <Text
        style={[
          state === 'critical' ? type.riskScoreCritical : type.riskScore,
          sev.scoreNumericStyle,
        ]}
      >
        {score}
      </Text>
      <Text style={[type.body, { color: t.text.mute, marginLeft: 6, marginTop: 24 }]}>/100</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
});
