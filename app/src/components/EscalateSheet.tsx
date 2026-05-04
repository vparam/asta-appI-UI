import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { AlertEvent } from '@/data/types';
import { Button } from './Button';

type Props = {
  event: AlertEvent;
  onDismiss: () => void;
};

/** Flow 1 Step 4 — escalation sheet with stacked role rows. */
export function EscalateSheet({ event, onDismiss }: Props) {
  const t = useTokens();
  const [selected, setSelected] = useState<number>(
    event.routingChain.findIndex((r) => !r.isCurrent)
  );

  const target = event.routingChain[selected];

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.scrim}>
        <View style={[styles.sheet, { backgroundColor: t.surface.surface }]}>
          <Pressable onPress={onDismiss} style={styles.cancel}>
            <Text style={[type.body, { color: t.text.mute }]}>✕ Cancel</Text>
          </Pressable>
          <Text style={[type.cardTitle, { color: t.text.body }]}>{`Escalate Bed ${event.bed.bed}`}</Text>
          <Text style={[type.body, { color: t.text.mute, marginTop: 4 }]}>
            {'Routing chain: ' + event.routingChain.map((r) => r.role).join(' → ')}
          </Text>

          <View style={{ marginTop: 16 }}>
            {event.routingChain
              .filter((r) => !r.isCurrent)
              .map((r, i) => {
                const idx = event.routingChain.indexOf(r);
                return (
                  <Pressable
                    key={i}
                    onPress={() => setSelected(idx)}
                    style={[
                      styles.row,
                      { borderBottomColor: t.surface.hairline, backgroundColor: idx === selected ? t.accent.accentBg : 'transparent' },
                    ]}
                  >
                    <View style={[styles.avatar, { backgroundColor: t.surface.recess }]}>
                      <Text style={[type.bodySemibold, { color: t.text.body }]}>
                        {initials(r.name)}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[type.bodySemibold, { color: t.text.body }]}>{r.name}</Text>
                      <Text style={[type.metadata, { color: t.text.mute }]}>{r.role}</Text>
                    </View>
                    {i === 0 && (
                      <View style={[styles.onCallBadge, { backgroundColor: t.severity.stableBg }]}>
                        <Text style={[type.metadata, { color: t.severity.stable, fontWeight: '600' }]}>
                          On call now
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
          </View>

          {target && (
            <Button
              label={`Escalate to ${target.name}`}
              variant="critical"
              onPress={onDismiss}
              haptic="medium"
              fullWidth
              style={{ marginTop: 16 }}
            />
          )}

          <Text style={[type.metadata, { color: t.text.mute, marginTop: 12, fontStyle: 'italic' }]}>
            If not acknowledged within 90 s, will auto-escalate to the next role.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function initials(s: string): string {
  return s
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.08)', justifyContent: 'flex-end' },
  sheet: { padding: 16, paddingBottom: 32, borderTopLeftRadius: 16, borderTopRightRadius: 16, minHeight: 360 },
  cancel: { alignSelf: 'flex-start', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  onCallBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
});
