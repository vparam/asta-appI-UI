import React from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { Card } from './Card';

type Props = {
  onOpenFullScreen: () => void;
  onAsk?: (text: string) => void;
};

const TOP_CHIPS = ['Patient summary', 'What could go wrong?', 'Explain confidence'];

/**
 * §7.11 Compact Clinical Conversation entry — three quick-action chips
 * plus a free-text input. Full conversation runs on its own screen.
 */
export function ConversationEntry({ onOpenFullScreen, onAsk }: Props) {
  const t = useTokens();
  const [text, setText] = React.useState('');

  return (
    <Card>
      <View style={styles.header}>
        <Text style={[type.bodySemibold, { color: t.text.body }]}>Clinical Conversation</Text>
        <Pressable onPress={onOpenFullScreen}>
          <Text style={[type.metadata, { color: t.text.mute }]}>Open full-screen ↗</Text>
        </Pressable>
      </View>
      <View style={styles.chipRow}>
        {TOP_CHIPS.map((c) => (
          <Pressable
            key={c}
            onPress={() => {
              setText(c);
              onAsk?.(c);
            }}
            style={[styles.chip, { backgroundColor: t.surface.recess }]}
          >
            <Text style={[type.metadata, { color: t.accent.accent }]}>{c}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ask as if you are talking to a clinical copilot"
        placeholderTextColor={t.text.faint}
        onSubmitEditing={() => onAsk?.(text)}
        style={[
          styles.input,
          {
            backgroundColor: t.surface.recess,
            color: t.text.body,
            ...type.body,
          },
        ]}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  input: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
});
