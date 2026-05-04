import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { api } from '@/data/api';
import { PatientToken } from '@/data/types';
import { Button } from '@/components/Button';

type Tab = 'respiratory' | 'circulation' | 'labs' | 'neuro';

type Props = {
  token: PatientToken;
  /** Optional initial tab — set when arriving from a contextual prompt. */
  initialTab?: Tab;
  /** When set, focuses this field after mount. */
  initialFocus?: string;
  onClose: () => void;
};

const TAB_TITLES: Record<Tab, string> = {
  respiratory: 'Respiratory',
  circulation: 'Circulation',
  labs: 'LABS',
  neuro: 'Neuro/OB',
};

export function AddBedsideDataScreen({ token, initialTab = 'labs', initialFocus, onClose }: Props) {
  const t = useTokens();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [lactate, setLactate] = useState('');
  const [temp, setTemp] = useState('37.2');
  const [submitting, setSubmitting] = useState(false);

  const save = async () => {
    setSubmitting(true);
    try {
      await api.rerun(token, { lactate: lactate ? parseFloat(lactate) : undefined });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: t.surface.canvas }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose}>
          <Text style={[type.body, { color: t.text.mute }]}>✕</Text>
        </Pressable>
        <Text style={[type.cardTitle, { color: t.text.body, flex: 1, textAlign: 'center' }]}>
          Add Bedside Data
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.tabBar, { borderBottomColor: t.surface.hairline }]}>
        {(Object.keys(TAB_TITLES) as Tab[]).map((k) => (
          <Pressable key={k} onPress={() => setTab(k)} style={styles.tab}>
            <Text
              style={[
                tab === k ? type.bodySemibold : type.body,
                {
                  color: tab === k ? t.text.body : t.text.mute,
                  borderBottomColor: tab === k ? t.accent.accent : 'transparent',
                  borderBottomWidth: 2,
                  paddingBottom: 6,
                },
              ]}
            >
              {TAB_TITLES[k]}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'labs' && (
          <>
            <Field label="Temp C" value={temp} onChangeText={setTemp} />
            <Field
              label="Lactate*"
              required
              value={lactate}
              onChangeText={setLactate}
              autoFocus={initialFocus === 'lactate'}
              helper="Range 0.5–10 mmol/L. Lactate helps distinguish sepsis from fluid imbalance patterns."
              keyboardType="decimal-pad"
            />
          </>
        )}
        {tab === 'respiratory' && (
          <>
            <Field label="O2 L/min" value="2" onChangeText={() => {}} />
            <Field label="FiO2 %" value="28" onChangeText={() => {}} />
            <Field label="PEEP" value="5" onChangeText={() => {}} />
            <Field label="EtCO2" value="" onChangeText={() => {}} />
          </>
        )}
        {tab === 'circulation' && (
          <>
            <Field label="Urine ml/kg/hr" value="" onChangeText={() => {}} />
            <Field label="Fluid balance ml" value="" onChangeText={() => {}} />
            <Field label="Cap refill sec" value="" onChangeText={() => {}} />
          </>
        )}
        {tab === 'neuro' && (
          <>
            <Field label="GCS" value="" onChangeText={() => {}} />
            <Field label="Pain score" value="" onChangeText={() => {}} />
          </>
        )}

        <View style={{ marginTop: 24 }}>
          <Button label={submitting ? 'Saving…' : 'Save and rerun'} variant="primary" onPress={save} fullWidth haptic="light" />
          <Pressable style={{ alignSelf: 'center', marginTop: 12 }}>
            <Text style={[type.metadata, { color: t.text.mute }]}>Save without rerun</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  required,
  autoFocus,
  helper,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  required?: boolean;
  autoFocus?: boolean;
  helper?: string;
  keyboardType?: 'decimal-pad' | 'number-pad' | 'default';
}) {
  const t = useTokens();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[type.bodySemibold, { color: required ? t.severity.critical : t.text.body }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        keyboardType={keyboardType ?? 'default'}
        style={[
          type.body,
          {
            backgroundColor: t.surface.surface,
            borderColor: t.surface.hairline,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: t.text.body,
            marginTop: 6,
          },
        ]}
      />
      {helper && (
        <Text style={[type.metadata, { color: t.text.mute, marginTop: 6 }]}>{helper}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, justifyContent: 'space-between' },
  tabBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16 },
  tab: { paddingVertical: 12, marginRight: 16 },
  scroll: { padding: 16, paddingBottom: 64 },
});
