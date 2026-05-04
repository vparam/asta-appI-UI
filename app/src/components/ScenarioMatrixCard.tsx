import React, { useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { Scenario } from '@/data/types';
import { Card } from './Card';
import { ScenarioRow } from './ScenarioRow';

type Props = {
  scenarios: Scenario[];
  density: 'simple' | 'detailed';
  patientToken?: string;
};

/**
 * §7.7 Scenario Prediction Matrix.
 * Simple density: top scenario only, "See N alternatives" link below.
 * Detailed density: top THREE scenarios visible (collapsed); chevron expands each row.
 *
 * §19.22: only the top scenario is shown by default — Detailed widens the
 * default-visible window to 3 but each row remains collapsed until tapped.
 */
export function ScenarioMatrixCard({ scenarios, density, patientToken }: Props) {
  const t = useTokens();
  const baseCount = density === 'detailed' ? 3 : 1;
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? scenarios : scenarios.slice(0, baseCount);
  const remaining = scenarios.length - visible.length;

  return (
    <Card>
      <Text style={[type.cardTitle, { color: t.text.body, marginBottom: 8 }]}>Scenario Prediction Matrix</Text>
      {visible.map((s, i) => (
        <ScenarioRow key={s.id} scenario={s} isTopScenario={i === 0} patientToken={patientToken} />
      ))}
      {remaining > 0 && (
        <Pressable
          onPress={() => setExpanded(true)}
          style={styles.linkRow}
          accessibilityRole="button"
          accessibilityLabel={`See ${remaining} alternative scenarios`}
        >
          <Text style={[type.body, { color: t.text.mute }]}>{`See ${remaining} alternatives`}</Text>
        </Pressable>
      )}
      {expanded && (
        <Pressable
          onPress={() => setExpanded(false)}
          style={styles.linkRow}
          accessibilityRole="button"
          accessibilityLabel="Hide alternative scenarios"
        >
          <Text style={[type.body, { color: t.text.mute }]}>Hide alternatives</Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  linkRow: { paddingVertical: 12, alignItems: 'center' },
});
