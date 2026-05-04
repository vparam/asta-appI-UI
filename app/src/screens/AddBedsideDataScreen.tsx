import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { api } from '@/data/api';
import { PatientFile, PatientToken } from '@/data/types';
import { telemetry } from '@/state/telemetry';
import { Button } from '@/components/Button';

type Tab = 'respiratory' | 'circulation' | 'labs' | 'neuro';

type RerunResult = {
  patient: PatientFile;
  receipts: { score: { copy: string } | null; confidence: { copy: string } | null };
};

type Props = {
  token: PatientToken;
  /** Optional initial tab — set when arriving from a contextual prompt. */
  initialTab?: Tab;
  /** When set, focuses this field after mount. */
  initialFocus?: string;
  /** Callback invoked after a successful rerun, so the calling Patient screen can refresh. */
  onRerunComplete?: (r: RerunResult) => void;
  onClose: () => void;
};

const TAB_TITLES: Record<Tab, string> = {
  respiratory: 'Respiratory',
  circulation: 'Circulation',
  labs: 'Labs',
  neuro: 'Neuro/OB',
};

export function AddBedsideDataScreen({ token, initialTab = 'labs', initialFocus, onRerunComplete, onClose }: Props) {
  const t = useTokens();
  const [tab, setTab] = useState<Tab>(initialTab);

  // Form state for every field. Per-tab dictionaries make persistence trivial.
  const [labs, setLabs] = useState<{ temp: string; lactate: string }>({ temp: '37.2', lactate: '' });
  const [resp, setResp] = useState<{ o2: string; fio2: string; peep: string; etco2: string }>({
    o2: '2', fio2: '28', peep: '5', etco2: '',
  });
  const [circ, setCirc] = useState<{ urine: string; fluid: string; cap: string }>({ urine: '', fluid: '', cap: '' });
  const [neuro, setNeuro] = useState<{ gcs: string; pain: string }>({ gcs: '', pain: '' });

  const [submitting, setSubmitting] = useState(false);

  const collectBody = () => ({
    lactate: labs.lactate ? parseFloat(labs.lactate) : undefined,
    temp: labs.temp ? parseFloat(labs.temp) : undefined,
    o2: resp.o2 ? parseFloat(resp.o2) : undefined,
  });

  const save = async (rerun: boolean) => {
    setSubmitting(true);
    telemetry.emit('add_bedside_data_saved', { token, rerun });
    try {
      if (rerun) {
        const r = await api.rerun(token, collectBody());
        onRerunComplete?.(r);
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: t.surface.canvas }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel and dismiss">
          <Text style={[type.body, { color: t.text.mute }]}>✕</Text>
        </Pressable>
        <Text style={[type.cardTitle, { color: t.text.body, flex: 1, textAlign: 'center' }]}>
          Add Bedside Data
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.tabBar, { borderBottomColor: t.surface.hairline }]}>
        {(Object.keys(TAB_TITLES) as Tab[]).map((k) => (
          <Pressable
            key={k}
            onPress={() => setTab(k)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === k }}
            accessibilityLabel={TAB_TITLES[k]}
          >
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
            <Field
              label="Temp"
              unit="°C"
              value={labs.temp}
              onChangeText={(s) => setLabs({ ...labs, temp: s })}
              keyboardType="decimal-pad"
            />
            <Field
              label="Lactate"
              unit="mmol/L"
              helper="Range 0.5–10. Lactate helps distinguish sepsis from fluid imbalance patterns."
              value={labs.lactate}
              onChangeText={(s) => setLabs({ ...labs, lactate: s })}
              autoFocus={initialFocus === 'lactate'}
              keyboardType="decimal-pad"
            />
          </>
        )}
        {tab === 'respiratory' && (
          <>
            <Field label="O₂" unit="L/min" value={resp.o2} onChangeText={(s) => setResp({ ...resp, o2: s })} keyboardType="decimal-pad" />
            <Field label="FiO₂" unit="%" value={resp.fio2} onChangeText={(s) => setResp({ ...resp, fio2: s })} keyboardType="number-pad" />
            <Field label="PEEP" unit="cmH₂O" value={resp.peep} onChangeText={(s) => setResp({ ...resp, peep: s })} keyboardType="number-pad" />
            <Field label="EtCO₂" unit="mmHg" value={resp.etco2} onChangeText={(s) => setResp({ ...resp, etco2: s })} keyboardType="number-pad" />
          </>
        )}
        {tab === 'circulation' && (
          <>
            <Field label="Urine" unit="ml/kg/hr" value={circ.urine} onChangeText={(s) => setCirc({ ...circ, urine: s })} keyboardType="decimal-pad" />
            <Field label="Fluid balance" unit="ml" value={circ.fluid} onChangeText={(s) => setCirc({ ...circ, fluid: s })} keyboardType="numeric" />
            <Field label="Cap refill" unit="sec" value={circ.cap} onChangeText={(s) => setCirc({ ...circ, cap: s })} keyboardType="number-pad" />
          </>
        )}
        {tab === 'neuro' && (
          <>
            <Field label="GCS" unit="3–15" value={neuro.gcs} onChangeText={(s) => setNeuro({ ...neuro, gcs: s })} keyboardType="number-pad" />
            <Field label="Pain score" unit="0–10" value={neuro.pain} onChangeText={(s) => setNeuro({ ...neuro, pain: s })} keyboardType="number-pad" />
          </>
        )}

        <View style={{ marginTop: 24 }}>
          <Button
            label={submitting ? 'Saving…' : 'Save and rerun'}
            variant="primary"
            onPress={() => save(true)}
            fullWidth
            haptic="light"
          />
          <Pressable
            onPress={() => save(false)}
            style={{ alignSelf: 'center', marginTop: 12, padding: 4 }}
            accessibilityRole="button"
            accessibilityLabel="Save without rerunning the model"
          >
            <Text style={[type.metadata, { color: t.text.mute }]}>Save without rerun</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  unit,
  value,
  onChangeText,
  autoFocus,
  helper,
  keyboardType,
}: {
  label: string;
  unit?: string;
  value: string;
  onChangeText: (s: string) => void;
  autoFocus?: boolean;
  helper?: string;
  keyboardType?: 'decimal-pad' | 'number-pad' | 'default' | 'numeric';
}) {
  const tt = useTokens();
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={[type.bodySemibold, { color: tt.text.body, flex: 1 }]}>{label}</Text>
        {unit && <Text style={[type.metadata, { color: tt.text.mute }]}>{unit}</Text>}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        keyboardType={keyboardType ?? 'default'}
        style={[
          type.body,
          {
            backgroundColor: tt.surface.surface,
            borderColor: tt.surface.hairline,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: tt.text.body,
            marginTop: 6,
          },
        ]}
        accessibilityLabel={label}
      />
      {helper && (
        <Text style={[type.metadata, { color: tt.text.mute, marginTop: 6 }]}>{helper}</Text>
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
