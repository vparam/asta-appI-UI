import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { BedIdentifier, SeverityState } from '@/data/types';
import { Pill } from './Pill';

type Props = {
  bed: BedIdentifier;
  state: SeverityState;
  syncedSecondsAgo: number;
  density?: 'simple' | 'detailed';
  onChangeDensity?: () => void;
  onRerun?: () => void;
  onOpenSettings?: () => void;
};

/**
 * §7.1 sticky 3-line patient header. Line 1 is "<ward> · Bed N" — never a name.
 * Line 2 is "<token> · admitted ~N days ago" (relative form, §3.2).
 */
export function PatientHeader({
  bed,
  state,
  syncedSecondsAgo,
  density = 'simple',
  onChangeDensity,
  onRerun,
  onOpenSettings,
}: Props) {
  const t = useTokens();
  const stale = syncedSecondsAgo > 60;

  return (
    <View
      style={[styles.wrap, { backgroundColor: t.surface.canvas, borderBottomColor: t.surface.hairline }]}
      accessible
      accessibilityLabel={`Patient header: ${bed.ward} bed ${bed.bed}, token ${bed.token}, ${state}`}
    >
      <View style={styles.line1}>
        <Text style={[type.title, { color: t.text.ink }]}>{`${bed.ward} · Bed ${bed.bed}`}</Text>
        <View style={styles.right}>
          <Pill severity={state} label={state.toUpperCase()} />
          {onChangeDensity && (
            <Pressable
              onPress={onChangeDensity}
              style={[styles.densityChip, { borderColor: t.surface.hairline }]}
              accessibilityRole="button"
              accessibilityLabel={`Density: ${density}. Tap to change.`}
            >
              <Text style={[type.metadata, { color: t.text.body }]}>
                {density === 'simple' ? 'Simple ▾' : 'Detailed ▾'}
              </Text>
            </Pressable>
          )}
          {onRerun && (
            <Pressable
              onPress={onRerun}
              style={styles.rerunBtn}
              accessibilityRole="button"
              accessibilityLabel="Rerun inference"
            >
              <Text style={[type.body, { color: t.text.body }]}>⟳</Text>
            </Pressable>
          )}
          {onOpenSettings && (
            <Pressable
              onPress={onOpenSettings}
              style={styles.rerunBtn}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Text style={[type.body, { color: t.text.body }]}>⚙︎</Text>
            </Pressable>
          )}
        </View>
      </View>
      <Text style={[type.body, { color: t.text.mute }]}>
        {`${bed.token} · ${bed.admittedRelative}`}
      </Text>
      <View style={styles.line3}>
        <View style={[styles.dot, { backgroundColor: stale ? t.severity.watch : t.severity.stable }]} />
        <Text style={[type.metadata, { color: t.text.mute }]}>
          {stale ? `Reconnecting… last reading ${Math.round(syncedSecondsAgo / 60)}m ago` : `Synced ${syncedSecondsAgo}s ago`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  line1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  densityChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  rerunBtn: { padding: 4 },
  line3: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
