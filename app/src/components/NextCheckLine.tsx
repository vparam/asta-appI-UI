import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';

/**
 * §7.2 v2.4 Next routine check line. A stopping point — defines a moment
 * to come back, not a "you're done" signal. Hidden in critical state
 * (replaced by the alert strip's "Action requested ≤ 5 min").
 */
export function NextCheckLine({ text }: { text: string }) {
  const t = useTokens();
  if (!text) return null;
  return (
    <View style={styles.row}>
      <View style={[styles.divider, { backgroundColor: t.surface.hairline }]} />
      <Text style={[type.metadata, { color: t.text.mute, marginTop: 8 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginTop: 8 },
  divider: { height: 1, opacity: 0.6 },
});
