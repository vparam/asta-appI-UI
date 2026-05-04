import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { RiskRead } from '@/data/types';
import { Card } from './Card';
import { RiskScore } from './RiskScore';
import { Pill } from './Pill';
import { ConfidencePill } from './ConfidencePill';
import { ActionLine } from './ActionLine';
import { NextCheckLine } from './NextCheckLine';

type Props = {
  read: RiskRead;
  density: 'simple' | 'detailed';
  receipts?: { score?: string; confidence?: string };
};

/**
 * §7.2 Risk Summary card. The most-read block on the screen.
 * Renders ALL of: score, current read, action line, MOST LIKELY SCENARIO sub-card,
 * next check, persistent decision-support disclaimer.
 *
 * Detailed density additionally surfaces the four sub-scores.
 */
export function RiskSummaryCard({ read, density, receipts }: Props) {
  const t = useTokens();
  const scenario = read.scenarios[0];
  const a11yLabel = `Risk score ${read.score} of 100, ${read.state}. ${read.currentRead} ${read.actionLine}. ${read.nextCheck}`;

  return (
    <Card
      severity={read.state}
      style={{ padding: 16 }}
      accessible
      accessibilityLabel={a11yLabel}
    >
      <View style={styles.scoreRow}>
        <View style={{ flex: 1 }}>
          <Text style={[type.smallCaps, { color: t.text.mute, marginBottom: 4 }]}>RISK SCORE</Text>
          <RiskScore score={read.score} state={read.state} />
        </View>
        <View style={styles.pills}>
          <Pill severity={read.state} label={read.state.toUpperCase()} />
          <View style={{ height: 6 }} />
          <Pill label="LIVE" severity="stable" withDot />
        </View>
      </View>

      {receipts?.score && (
        <Text style={[type.body, { color: t.text.body, marginTop: 8 }]}>{receipts.score}</Text>
      )}
      {receipts?.confidence && (
        <Text style={[type.bodySemibold, { color: t.accent.accent, marginTop: 4 }]}>
          {receipts.confidence}
        </Text>
      )}

      <View style={[styles.divider, { backgroundColor: t.surface.hairline }]} />

      <Text style={[type.smallCaps, { color: t.text.mute, marginBottom: 4 }]}>CURRENT READ</Text>
      <Text style={[type.body, { color: t.text.body }]}>{read.currentRead}</Text>

      <ActionLine
        text={read.actionLine}
        register={read.actionRegister}
        errorPossibilityFootnote={
          // §16.4: surface the error-possibility footnote here when leading-scenario
          // confidence is Low, or the top two scenarios are within 5 percentage points
          // (model in conflict, no clear leader).
          read.scenarios[0]?.confidence.label === 'low' ||
          (read.scenarios.length > 1 &&
            Math.abs(read.scenarios[0].confidence.percent - read.scenarios[1].confidence.percent) <= 5)
        }
      />

      {density === 'detailed' && (
        <View style={styles.subScores}>
          {(['cardiac', 'respiratory', 'neurology', 'perfusion'] as const).map((k) => (
            <View key={k} style={[styles.subScoreChip, { backgroundColor: t.surface.recess }]}>
              <Text style={[type.metadata, { color: t.text.mute, textTransform: 'capitalize' }]}>{k}</Text>
              <Text style={[type.bodySemibold, { color: t.text.body }]}>{read.subScores[k]}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Most Likely Scenario sub-card */}
      <View style={[styles.subCard, { backgroundColor: t.surface.recess }]}>
        <Text style={[type.smallCaps, { color: t.severity.watch, marginBottom: 4 }]}>
          MOST LIKELY SCENARIO
        </Text>
        <Text style={[type.bodySemibold, { color: t.text.body }]}>{scenario.title}</Text>
        <View style={{ marginTop: 6 }}>
          <ConfidencePill pill={{ ...scenario.confidence, showUncertainHint: scenario.confidence.label === 'low' }} />
        </View>
        <Text style={[type.body, { color: t.text.body, marginTop: 8 }]}>{scenario.rationaleMobile}</Text>
      </View>

      <NextCheckLine text={read.nextCheck} />

      {/* §16.6 persistent footer */}
      <Text style={[type.metadata, { color: t.text.mute, marginTop: 12, fontStyle: 'italic' }]}>
        Decision-support only — verify with clinical judgement.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  scoreRow: { flexDirection: 'row', alignItems: 'flex-start' },
  pills: { alignItems: 'flex-end' },
  divider: { height: 1, marginVertical: 12 },
  subCard: { padding: 12, borderRadius: 10, marginTop: 12 },
  subScores: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
  subScoreChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 6 },
});
