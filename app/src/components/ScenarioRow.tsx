import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { Scenario } from '@/data/types';
import { api } from '@/data/api';
import { telemetry } from '@/state/telemetry';
import { ConfidencePill } from './ConfidencePill';
import { Button } from './Button';

type Props = {
  scenario: Scenario;
  /** Default-collapsed (3-line summary) vs expanded (Why / Checks / Feedback). */
  defaultExpanded?: boolean;
  /** True when this is the leading scenario in the matrix. */
  isTopScenario?: boolean;
  /** Token + matrix context for the RL feedback POST. */
  patientToken?: string;
};

/**
 * §7.7 row anatomy. Collapsed: title + confidence + summary + actionHint + chevron.
 * Expanded: adds Why mono block, Checks bullets, Feedback buttons.
 *
 * §19.11: nested confidence pills inside Scenario Matrix rows do NOT carry
 * the "· uncertain signal" suffix — only the headline pill on Risk Summary
 * does. We strip the hint here regardless of whether the fixture set it.
 */
export function ScenarioRow({ scenario, defaultExpanded = false, isTopScenario = false, patientToken }: Props) {
  const t = useTokens();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [feedback, setFeedback] = useState<'confirm' | 'false' | 'uncertain' | null>(null);

  const onFeedback = (kind: 'confirm' | 'false' | 'uncertain') => {
    setFeedback(kind);
    telemetry.emit('scenario_feedback', { scenarioId: scenario.id, kind, patientToken });
    if (patientToken) {
      api.scenarioFeedback(patientToken as `PT-${string}`, scenario.id, kind).catch(() => {
        /* offline — feedback queued in MMKV by the api client */
      });
    }
  };

  // Strip the uncertain-signal hint from non-headline pills (§19.11).
  // Even on the top scenario inside the Scenario Matrix, the hint is reserved
  // for the Risk Summary headline pill only.
  const pillForRow = { ...scenario.confidence, showUncertainHint: false };

  return (
    <View
      style={[styles.row, { borderColor: t.surface.hairline }]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${isTopScenario ? 'Most likely scenario: ' : ''}${scenario.title}, ${scenario.confidence.label} confidence ${scenario.confidence.percent} percent. ${scenario.summary}`}
      accessibilityHint={expanded ? 'Tap to collapse' : 'Tap to expand for evidence and feedback'}
    >
      <Pressable onPress={() => setExpanded((e) => !e)}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[type.bodySemibold, { color: t.text.body }]}>{scenario.title}</Text>
            <View style={{ marginTop: 6 }}>
              <ConfidencePill pill={pillForRow} />
            </View>
            <Text style={[type.body, { color: t.text.body, marginTop: 8 }]}>{scenario.summary}</Text>
            <Text
              style={[
                type.bodySemibold,
                {
                  color: t.accent.accent,
                  marginTop: 6,
                  backgroundColor: t.accent.accentBg,
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  borderRadius: 6,
                },
              ]}
            >
              {scenario.actionHint}
            </Text>
          </View>
          <Text style={[type.body, { color: t.text.mute, marginLeft: 8 }]}>{expanded ? '▾' : '▸'}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={{ marginTop: 12 }}>
          <Text style={[type.smallCaps, { color: t.text.mute, marginBottom: 6 }]}>WHY</Text>
          <View style={[styles.mono, { backgroundColor: t.surface.recess }]}>
            {scenario.whyTraces.map((tr, i) => (
              <Text key={i} style={[type.mono, { color: t.text.body, marginBottom: 4 }]}>
                <Text style={{ color: t.accent.accent }}>{tr.model}: </Text>
                {tr.line}
              </Text>
            ))}
          </View>

          <Text style={[type.smallCaps, { color: t.text.mute, marginTop: 12, marginBottom: 6 }]}>CHECKS</Text>
          {scenario.checks.map((c, i) => (
            <Text key={i} style={[type.body, { color: t.text.body }]}>
              · {c}
            </Text>
          ))}

          <Text style={[type.smallCaps, { color: t.text.mute, marginTop: 12, marginBottom: 8 }]}>FEEDBACK</Text>
          <View style={styles.feedbackRow}>
            <Button label="✓ Confirm" variant="stable" onPress={() => onFeedback('confirm')} fullWidth style={{ flex: 1 }} />
            <Button label="✗ False" variant="critical" onPress={() => onFeedback('false')} fullWidth style={{ flex: 1, marginHorizontal: 8 }} />
            <Button label="? Uncertain" variant="outlined" onPress={() => onFeedback('uncertain')} fullWidth style={{ flex: 1 }} />
          </View>
          {feedback && (
            <Text style={[type.metadata, { color: t.text.mute, marginTop: 8 }]}>
              {feedback === 'confirm' ? 'Confirmed.' : feedback === 'false' ? 'Marked false.' : 'Marked uncertain.'}
              {' Your feedback trains the model on your ward\'s case mix.'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start' },
  mono: { padding: 10, borderRadius: 8 },
  feedbackRow: { flexDirection: 'row' },
});
