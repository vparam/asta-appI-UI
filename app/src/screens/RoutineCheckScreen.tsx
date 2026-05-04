import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { PatientToken } from '@/data/types';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { RiskScore } from '@/components/RiskScore';
import { Pill } from '@/components/Pill';

type Props = {
  token: PatientToken;
  onClose: () => void;
};

/**
 * Matches reference screenshot 1 — the bedside Routine Check capture flow.
 * Read-only header showing risk + state, then a vitals capture form.
 */
export function RoutineCheckScreen({ token, onClose }: Props) {
  const t = useTokens();
  const [hr, setHr] = useState('57');
  const [spo2, setSpo2] = useState('100');
  const [sbp, setSbp] = useState('132');
  const [dbp, setDbp] = useState('90');
  const [perfusion, setPerfusion] = useState<'adequate' | 'reduced'>('adequate');
  const [notes, setNotes] = useState('');

  return (
    <ScrollView style={[styles.root, { backgroundColor: t.surface.canvas }]} contentContainerStyle={styles.scroll}>
      <Card style={{ alignItems: 'center', paddingVertical: 16 }}>
        <Text style={[type.smallCaps, { color: t.text.mute, marginBottom: 4 }]}>RISK SCORE</Text>
        <RiskScore score={19} state="stable" />
        <View style={{ marginTop: 8 }}>
          <Pill severity="stable" label="STABLE state (no active alert)" />
        </View>
        <View style={[styles.divider, { backgroundColor: t.surface.hairline }]} />
        <Text style={[type.bodySemibold, { color: t.text.body, textAlign: 'center' }]}>
          No action required — continue routine monitoring.
        </Text>
        <Text style={[type.metadata, { color: t.text.mute, marginTop: 4 }]}>Next routine check: 30 min</Text>
      </Card>

      <Card>
        <View style={styles.headerRow}>
          <Text style={[type.cardTitle, { color: t.text.body }]}>Routine Check Capture</Text>
          <Text style={[type.metadata, { color: t.text.mute }]}>{nowIst()}</Text>
        </View>

        <CaptureRow icon="♥" lane="hr" title="Heart Rate" unit="bpm (60-100)" current={57} value={hr} onChangeText={setHr} />
        <CaptureRow icon="◐" lane="spo2" title="SpO2" unit="%" current={100} value={spo2} onChangeText={setSpo2} />

        <View style={[styles.bp, { backgroundColor: t.surface.surface, borderColor: t.surface.hairline }]}>
          <View style={{ flex: 1 }}>
            <Text style={[type.bodySemibold, { color: t.text.body }]}>Blood Pressure</Text>
            <Text style={[type.metadata, { color: t.text.mute }]}>mmHg (90-140 Sys)</Text>
            <Text style={[type.metadata, { color: t.text.mute, marginTop: 4 }]}>{`Current: 132/90`}</Text>
          </View>
          <TextInput value={sbp} onChangeText={setSbp} keyboardType="number-pad" style={[styles.bpInput, { borderColor: t.surface.hairline, color: t.text.body }, type.body]} />
          <Text style={[type.body, { marginHorizontal: 4, color: t.text.body }]}>/</Text>
          <TextInput value={dbp} onChangeText={setDbp} keyboardType="number-pad" style={[styles.bpInput, { borderColor: t.surface.hairline, color: t.text.body }, type.body]} />
        </View>

        <View style={[styles.perfusion, { backgroundColor: t.surface.surface, borderColor: t.surface.hairline }]}>
          <Text style={[type.bodySemibold, { color: t.text.body, marginBottom: 8 }]}>Perfusion Assessment</Text>
          <View style={{ flexDirection: 'row' }}>
            {(['adequate', 'reduced'] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPerfusion(p)}
                style={[
                  styles.choice,
                  {
                    borderColor: perfusion === p ? t.accent.accent : t.surface.hairline,
                    backgroundColor: perfusion === p ? t.accent.accentBg : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    type.body,
                    {
                      color: perfusion === p ? t.accent.accent : t.text.body,
                      textTransform: 'capitalize',
                      textAlign: 'center',
                    },
                  ]}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[type.bodySemibold, { color: t.text.body, marginTop: 16, marginBottom: 6 }]}>Optional Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any clinical observations…"
          placeholderTextColor={t.text.faint}
          multiline
          style={[
            type.body,
            {
              backgroundColor: t.surface.surface,
              borderColor: t.surface.hairline,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              minHeight: 80,
              color: t.text.body,
              textAlignVertical: 'top',
            },
          ]}
        />

        <View style={{ height: 16 }} />
        <Button label="Cancel" variant="outlined" onPress={onClose} fullWidth />
        <View style={{ height: 8 }} />
        <Button label="Complete Check" variant="primary" onPress={onClose} fullWidth haptic="light" />
      </Card>
    </ScrollView>
  );
}

function CaptureRow({
  icon, lane, title, unit, current, value, onChangeText,
}: {
  icon: string; lane: 'hr' | 'spo2'; title: string; unit: string; current: number; value: string; onChangeText: (s: string) => void;
}) {
  const t = useTokens();
  return (
    <View style={[capStyles.row, { backgroundColor: t.surface.surface, borderColor: t.surface.hairline }]}>
      <View style={[capStyles.icon, { backgroundColor: t.surface.recess }]}>
        <Text style={{ color: t.vital[lane], fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[type.bodySemibold, { color: t.text.body }]}>{title}</Text>
        <Text style={[type.metadata, { color: t.text.mute }]}>{unit}</Text>
      </View>
      <Text style={[type.metadata, { color: t.text.mute, marginRight: 8 }]}>{`Current: ${current}`}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        style={[capStyles.input, { borderColor: t.surface.hairline, color: t.text.body }, type.body]}
      />
    </View>
  );
}

function nowIst(): string {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date()) + ' IST';
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  divider: { width: '60%', height: 1, marginVertical: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  bp: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  bpInput: { width: 64, padding: 8, borderRadius: 8, borderWidth: 1, textAlign: 'center' },
  perfusion: { padding: 12, borderRadius: 12, borderWidth: 1 },
  choice: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, marginRight: 8 },
});

const capStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  icon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: { width: 64, padding: 8, borderRadius: 8, borderWidth: 1, textAlign: 'center' },
});
