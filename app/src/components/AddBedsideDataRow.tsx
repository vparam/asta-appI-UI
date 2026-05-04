import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { Card } from './Card';

type Props = {
  /** Contextual prompt or default calm text. Default: "Add to improve precision". */
  prompt?: string;
  onPress: () => void;
};

/**
 * §7.10 Add Bedside Data — collapsed opt-in row.
 * NEVER shows "Required this shift" or any obligation language.
 */
export function AddBedsideDataRow({ prompt = 'Add to improve precision', onPress }: Props) {
  const t = useTokens();
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <Text style={[type.body, { fontSize: 18 }]}>📝</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[type.bodySemibold, { color: t.text.body }]}>Add bedside data</Text>
          <Text style={[type.metadata, { color: t.text.mute, marginTop: 2 }]}>{prompt}</Text>
        </View>
        <Text style={[type.body, { color: t.text.mute }]}>▾</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
