import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { Density } from '@/state/density';

type Props = {
  current: Density;
  onPick: (d: Density) => void;
  onDismiss: () => void;
};

/** Flow 7 Step 2 — small dropdown picker anchored to the header chip. */
export function DensitySheet({ current, onPick, onDismiss }: Props) {
  const t = useTokens();
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.scrim} onPress={onDismiss}>
        <Pressable style={[styles.sheet, { backgroundColor: t.surface.surface, borderColor: t.surface.hairline }]}>
          <Text style={[type.smallCaps, { color: t.text.mute, marginBottom: 8 }]}>DENSITY</Text>
          {(['simple', 'detailed'] as const).map((d) => (
            <Pressable key={d} onPress={() => onPick(d)} style={styles.row}>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: t.text.body,
                    backgroundColor: current === d ? t.accent.accent : 'transparent',
                  },
                ]}
              />
              <Text
                style={[
                  current === d ? type.bodySemibold : type.body,
                  { color: t.text.body, marginLeft: 12, textTransform: 'capitalize' },
                ]}
              >
                {d}
              </Text>
            </Pressable>
          ))}
          <Text style={[type.metadata, { color: t.text.mute, marginTop: 12, fontStyle: 'italic' }]}>
            Tap to change. Choice is sticky per device.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.04)', justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 80, paddingRight: 16 },
  sheet: { padding: 16, borderRadius: 12, borderWidth: 1, minWidth: 240 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
});
