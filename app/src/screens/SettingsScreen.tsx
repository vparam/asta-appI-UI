import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { useDensity, Density } from '@/state/density';
import { useOnboarding } from '@/state/onboarding';
import { Card } from '@/components/Card';

type Props = { onClose: () => void };

/**
 * Settings — anchors the §16 disclaimer surfaces (§19.4, §19.29).
 *
 * About PPLM holds the §16.1 core positioning, §16.2 prediction disclaimer,
 * §16.4 error-possibility statement, §16.5 clinical responsibility statement,
 * §16.7 privacy posture, and §16.8 bedside identity verification.
 */
export function SettingsScreen({ onClose }: Props) {
  const t = useTokens();
  const { density, set: setDensity } = useDensity();
  const { reset } = useOnboarding();

  return (
    <View style={[styles.root, { backgroundColor: t.surface.canvas }]}>
      <View style={styles.header}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close settings">
          <Text style={[type.body, { color: t.accent.accent }]}>{'< Back'}</Text>
        </Pressable>
        <Text style={[type.cardTitle, { color: t.text.body, flex: 1, textAlign: 'center' }]}>Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={[type.cardTitle, { color: t.text.body, marginBottom: 8 }]}>Display density</Text>
          {(['simple', 'detailed'] as Density[]).map((d) => (
            <Pressable
              key={d}
              onPress={() => setDensity(d)}
              style={[styles.radioRow, { borderColor: density === d ? t.accent.accent : t.surface.hairline, backgroundColor: density === d ? t.accent.accentBg : 'transparent' }]}
              accessibilityRole="radio"
              accessibilityState={{ selected: density === d }}
            >
              <View
                style={[
                  styles.radio,
                  { borderColor: t.text.body, backgroundColor: density === d ? t.accent.accent : 'transparent' },
                ]}
              />
              <Text style={[type.bodySemibold, { color: t.text.body, marginLeft: 12, textTransform: 'capitalize' }]}>
                {d}
              </Text>
            </Pressable>
          ))}
          <Text style={[type.metadata, { color: t.text.mute, marginTop: 8, fontStyle: 'italic' }]}>
            Sticky per device. You can also switch from the patient header.
          </Text>
        </Card>

        <Card>
          <Text style={[type.cardTitle, { color: t.text.body, marginBottom: 8 }]}>About PPLM</Text>

          <Section title="What PPLM is">
            PPLM is a clinical decision-support tool. It is designed to assist clinicians by highlighting patterns and potential risks based on available data. It does not replace clinical judgement.
          </Section>

          <Section title="How predictions are made">
            Predictions and risk scores are generated using machine-learning models trained on historical and real-time data. These outputs reflect patterns in the available data and may not fully capture the unique physiology or clinical condition of an individual patient.
          </Section>

          <Section title="Uncertainty and variability">
            Forecasts and scenario probabilities are estimates and may change as new data becomes available. Confidence levels indicate relative likelihood among modelled scenarios and should not be interpreted as definitive outcomes.
          </Section>

          <Section title="Error possibility">
            The system may produce incorrect or incomplete predictions, especially in cases of missing data, unusual presentations, or rapidly changing clinical conditions.
          </Section>

          <Section title="Clinical responsibility">
            Final clinical decisions must always be made by the treating clinician. PPLM should be used as a supporting tool alongside standard clinical assessment, protocols, and professional judgement.
          </Section>
        </Card>

        <Card>
          <Text style={[type.cardTitle, { color: t.text.body, marginBottom: 8 }]}>Privacy</Text>
          <Section title="Identification">
            PPLM Mobile does not store or display patient names. Patients appear here by ward and bed only. To match a patient on this screen with their record in your hospital&apos;s EHR, use the bed identifier or scan the patient&apos;s wristband at the bedside.
          </Section>
          <Section title="Bedside verification">
            Confirming patient identity at the bedside is the clinician&apos;s responsibility. Use your hospital&apos;s existing systems — wristband scan, verbal confirmation, or the EHR at the workstation — before any clinical action. PPLM Mobile shows you what is happening and what to do, identified by bed; it does not confirm who the patient is.
          </Section>
          <Text style={[type.metadata, { color: t.text.mute, marginTop: 8, fontStyle: 'italic' }]}>
            Compliance: India DPDP and US HIPAA, by architecture, not by policy.
          </Text>
        </Card>

        <Card>
          <Text style={[type.cardTitle, { color: t.text.body, marginBottom: 8 }]}>Practice mode</Text>
          <Text style={[type.body, { color: t.text.body }]}>
            Walk through a 12-minute scripted deterioration on a TRAINING demo bed. No real patients are affected.
          </Text>
          <Pressable
            onPress={() => reset()}
            style={[styles.devBtn, { borderColor: t.surface.hairline }]}
            accessibilityRole="button"
            accessibilityLabel="Reset onboarding (developer)"
          >
            <Text style={[type.metadata, { color: t.text.mute }]}>Reset onboarding (dev)</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTokens();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[type.bodySemibold, { color: t.text.body, marginBottom: 4 }]}>{title}</Text>
      <Text style={[type.body, { color: t.text.body }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  scroll: { padding: 16, gap: 12 },
  radioRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
  devBtn: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 12, alignSelf: 'flex-start' },
});
