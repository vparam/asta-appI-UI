import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { VitalReading, VitalLane } from '@/data/types';
import { telemetry } from '@/state/telemetry';

const TITLE: Record<VitalLane, string> = {
  hr: 'HR',
  spo2: 'SpO2',
  sbp: 'SBP',
  dbp: 'DBP',
  map: 'MAP',
};

type Props = {
  minutesAgo: number;
  changes: VitalReading[];
  onDismiss: () => void;
  onTapVital: (lane: VitalLane) => void;
};

/**
 * §7.5 v2.4 "What's new since last check" banner.
 * Appears under the sticky header on re-entry where last-viewed >5min old.
 * Format: "Since you last viewed (Nm ago): VITAL change, VITAL change…".
 */
export function WhatsNewBanner({ minutesAgo, changes, onDismiss, onTapVital }: Props) {
  const t = useTokens();

  useEffect(() => {
    telemetry.emit('whats_new_shown', { token: '', minutesAgo, vitalCount: changes.length });
  }, [minutesAgo, changes.length]);

  return (
    <View style={[styles.row, { backgroundColor: t.accent.accentBg, borderBottomColor: t.surface.hairline }]}>
      <Text
        style={[type.metadata, { color: t.accent.accent, flex: 1 }]}
        accessibilityLabel={`What's new since you last viewed ${minutesAgo} minutes ago: ${changes
          .map((v) => `${TITLE[v.lane]} ${v.direction}`)
          .join(', ')}`}
      >
        <Text style={[type.metadata, { color: t.text.mute }]}>
          Since you last viewed ({minutesAgo}m ago): {''}
        </Text>
        {changes.map((v, i) => (
          <Text key={v.lane} onPress={() => onTapVital(v.lane)}>
            <Text style={[type.metadata, { color: t.accent.accent, fontWeight: '600' }]}>{TITLE[v.lane]}</Text>
            <Text style={[type.metadata, { color: t.text.body }]}> {v.value} {v.direction}</Text>
            {i < changes.length - 1 ? <Text style={{ color: t.text.mute }}>, </Text> : null}
          </Text>
        ))}
      </Text>
      <Pressable
        onPress={() => {
          telemetry.emit('whats_new_dismissed', { token: '' });
          onDismiss();
        }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss what's new banner"
        style={styles.dismiss}
      >
        <Text style={[type.body, { color: t.text.mute }]}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dismiss: { padding: 4, marginLeft: 8 },
});
