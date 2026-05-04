import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { compose, SeverityState } from '@/theme/severity';
import { type } from '@/theme/typography';
import { Tooltip } from './Tooltip';

type Props = {
  score: number;
  state: SeverityState;
};

/**
 * Risk score numeric — §7.2 + §13.4.
 * Regular weight in stable AND watch. SEMIBOLD only in critical.
 * Long-press opens the §10.2 tooltip explaining the four sub-scores.
 */
export function RiskScore({ score, state }: Props) {
  const t = useTokens();
  const sev = compose(state, t);

  return (
    <Tooltip kind="risk_score" accessibilityLabel={`Risk score ${score} of 100, ${state}`}>
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
    </Tooltip>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
});
