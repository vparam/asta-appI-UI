import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { PatientFile, PatientToken } from '@/data/types';
import { api } from '@/data/api';
import { telemetry } from '@/state/telemetry';

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

type Props = { token: PatientToken; prefill?: string };

function buildReply(action: string, p: PatientFile | null): string {
  if (!p) {
    return `(loading patient data — ${action})`;
  }
  switch (action) {
    case 'Patient summary': {
      const v = p.vitals.reduce<Record<string, string>>((m, x) => {
        m[x.lane] = `${x.value}${x.unit === '%' ? '%' : ' ' + x.unit}`;
        return m;
      }, {});
      return `${p.bed.token} (Bed ${p.bed.bed}, ${p.bed.ward}) ${p.bed.admittedRelative}. Risk score ${p.read.score}/100, ${p.read.state}. Vitals: HR ${v.hr}, SpO2 ${v.spo2}, BP ${v.sbp}/${v.dbp}, MAP ${v.map}. ${p.read.currentRead}`;
    }
    case 'What could go wrong?': {
      const top = p.read.scenarios[0];
      return `Leading scenario is ${top.title} at ${top.confidence.label} confidence (${top.confidence.percent}%). ${top.summary} ${top.actionHint}`;
    }
    case 'Explain confidence':
      return 'Confidence percentages reflect ranking among modelled scenarios, not absolute probability. A low percent means the model considers this scenario the most likely of several — not that the patient has a low probability of crisis.';
    case 'What data is missing?':
      return p.read.scenarios[0].confidence.label === 'low'
        ? 'Adding lactate, urine output, or recent labs would let the model narrow its distribution. Open Add Bedside Data on the Patient screen to enter values.'
        : 'No specific input is needed right now — confidence is sufficient on the leading scenario.';
    case 'Tests and procedures':
      return p.read.scenarios[0].actionHint;
    default:
      return `(mock) PPLM would answer "${action}" using the cardiac, respiratory, and TimesFM model heads. Configured deployment will wire this to the production copilot.`;
  }
}

export function ConversationScreen({ token, prefill }: Props) {
  const t = useTokens();
  const [patient, setPatient] = useState<PatientFile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState(prefill ?? '');

  useEffect(() => {
    telemetry.emit('conversation_opened', { token });
    api.patient(token).then(setPatient).catch(() => undefined);
  }, [token]);

  // If a prefill arrived from a chip tap on the Patient screen, send it once
  // patient data is hydrated.
  useEffect(() => {
    if (prefill && patient) {
      send(prefill);
      setText('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  const send = (s: string) => {
    if (!s.trim()) return;
    const reply = buildReply(s, patient);
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
        <Text style={[type.metadata, { color: t.text.mute }]}>
          {patient ? `Bed ${patient.bed.bed} · ${patient.bed.token}` : token}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        {messages.map((m, i) => (
          <View
            key={i}
            accessible
            accessibilityLabel={`${m.role === 'user' ? 'You' : 'PPLM'}: ${m.text}`}
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
            accessibilityRole="button"
            accessibilityLabel={`Quick action: ${c}`}
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
          accessibilityLabel="Conversation input"
        />
        <Pressable
          onPress={() => send(text)}
          style={styles.send}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
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
