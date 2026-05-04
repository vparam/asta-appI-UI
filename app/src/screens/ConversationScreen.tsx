import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { PatientToken } from '@/data/types';
import { Card } from '@/components/Card';

const QUICK_ACTIONS = [
  'Patient summary',
  'What could go wrong?',
  'Tests and procedures',
  'Medication lane',
  'Explain confidence',
  'What data is missing?',
  'Respiratory review',
  'Cardiac review',
];

type Message = { role: 'user' | 'assistant'; text: string };

const SCRIPTED: Record<string, string> = {
  'Patient summary':
    'PT-9K2X (Bed 4, Trail ward) admitted ~5 days ago. Risk score 19/100, stable. Vitals: HR 57 ↓, SpO2 100, BP 132/90, MAP 104. No dominant high-risk trend in the retained vital window.',
  'What could go wrong?':
    'Leading scenario is Shock / sepsis progression at low confidence (17%). Perfusion may drop rapidly if hypotension, tachycardia, lactate, oliguria, or fever cluster. Monitor lactate, BP, urine output.',
  'Explain confidence':
    'Confidence percentages reflect ranking among modelled scenarios, not absolute probability. 17% means PPLM considers shock/sepsis the most likely of several scenarios — not that the patient has a 17% chance of crisis.',
};

type Props = { token: PatientToken; prefill?: string };

export function ConversationScreen({ token, prefill }: Props) {
  const t = useTokens();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState(prefill ?? '');

  const send = (s: string) => {
    if (!s.trim()) return;
    const reply = SCRIPTED[s] ?? `(mock) PPLM would answer "${s}" using the cardiac, respiratory, and TimesFM model heads. Configured deployment will wire this to the production copilot.`;
    setMessages((m) => [...m, { role: 'user', text: s }, { role: 'assistant', text: reply }]);
    setText('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: t.surface.canvas }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={[type.cardTitle, { color: t.text.body }]}>Clinical Conversation</Text>
        <Text style={[type.metadata, { color: t.text.mute }]}>{`Bed 4 · ${token}`}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              {
                backgroundColor: m.role === 'user' ? t.accent.accentBg : t.surface.surface,
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              },
            ]}
          >
            <Text style={[type.body, { color: t.text.body }]}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.chipRow}>
        {QUICK_ACTIONS.map((c) => (
          <Pressable
            key={c}
            onPress={() => send(c)}
            style={[styles.chip, { backgroundColor: t.surface.recess }]}
          >
            <Text style={[type.metadata, { color: t.accent.accent }]}>{c}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.inputRow, { backgroundColor: t.surface.surface, borderTopColor: t.surface.hairline }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ask as if you are talking to a clinical copilot"
          placeholderTextColor={t.text.faint}
          style={[styles.input, type.body, { color: t.text.body, backgroundColor: t.surface.recess }]}
          onSubmitEditing={() => send(text)}
        />
        <Pressable onPress={() => send(text)} style={styles.send}>
          <Text style={[type.bodySemibold, { color: t.accent.accent }]}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  scroll: { padding: 16, gap: 8 },
  bubble: { padding: 12, borderRadius: 12, maxWidth: '85%' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  send: { paddingHorizontal: 12 },
});
