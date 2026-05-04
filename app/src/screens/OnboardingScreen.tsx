import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { Button } from '@/components/Button';
import { useDensity, Density } from '@/state/density';
import { useOnboarding } from '@/state/onboarding';

type Card = {
  headline: string;
  body: string;
  required?: boolean;
  customCta?: string;
};

const CARDS: Card[] = [
  {
    headline: 'What PPLM is',
    body:
      'PPLM is a physiology model that watches your monitored beds continuously. It produces a risk score, a most-likely scenario, and a forecast for each patient. It does not replace your judgement. It surfaces patterns earlier than threshold alerts can.',
  },
  {
    headline: 'How to read confidence',
    body:
      'Every prediction carries a confidence percent. 17% means the model considers this scenario the most likely of several, not that the patient has a 17% chance of crisis. Treat confidence as a ranking signal, not a probability of outcome. Tap any percent in the app to see what it means in that context.',
  },
  {
    headline: 'Forecast vs measurement',
    body:
      'Solid trace lines are measurements. Dotted lines past the now line are forecasts. The shaded band around a forecast is the model’s uncertainty — wider bands mean less certain. If the feed goes stale, the forecast is erased, not faded.',
  },
  {
    headline: 'When to trust, when to override',
    body:
      'The Confirm / False / Uncertain buttons on each scenario teach the model. Use them. Your feedback compounds — within weeks the suppression thresholds for false-positives in your ward are tuned to your hospital’s case mix. The model gets better only if you push back when it is wrong.',
  },
  {
    headline: 'Privacy and identification',
    body:
      'PPLM Mobile does not store or display patient names. Patients appear here by ward and bed only. To match a patient on this screen with their record in your hospital’s EHR, use the bed identifier or scan the patient’s wristband at the bedside. Confirming patient identity is your responsibility, performed via your hospital’s existing systems.',
    required: true,
    customCta: 'I understand — bed-only identification',
  },
  {
    headline: 'Pick a density',
    body:
      'Simple keeps the Patient screen lean — the answer plus your next action, nothing more. Tap to drill when you need depth. Detailed shows the full read by default — scenarios, traces, and forecasts open. You can switch any time.',
    required: true,
  },
];

const SANDBOX: Card = {
  headline: 'Try a 12-minute practice run',
  body:
    'Before you work with real beds, walk through a scripted deterioration. A demo bed declines over 12 minutes. An alert fires at minute 6. You acknowledge, you give feedback, and we show you what the right read was. No real patients are affected.',
};

type Props = { onDone: () => void };

export function OnboardingScreen({ onDone }: Props) {
  const t = useTokens();
  const [step, setStep] = useState(0);
  const { density, set: setDensity } = useDensity();
  const { acknowledgePrivacy, completeOnboarding } = useOnboarding();
  const [pickedDensity, setPickedDensity] = useState<Density>(density);
  const isSandbox = step === CARDS.length;
  const card = isSandbox ? SANDBOX : CARDS[step];

  const next = () => {
    if (step === 4) acknowledgePrivacy();
    if (step === 5) setDensity(pickedDensity);
    if (step >= CARDS.length) {
      completeOnboarding();
      onDone();
    } else {
      setStep((s) => s + 1);
    }
  };

  // §19.3: Skip on cards 1-4 jumps to the required Privacy card (index 4).
  // Privacy ack and Density pick must always be performed before reaching the live Roster.
  const skip = () => {
    setStep(4);
  };

  return (
    <View style={[styles.root, { backgroundColor: t.surface.canvas }]}>
      {!card.required && !isSandbox && (
        <Pressable style={styles.skip} onPress={skip}>
          <Text style={[type.metadata, { color: t.text.mute }]}>Skip</Text>
        </Pressable>
      )}

      <View style={styles.monogram}>
        <Text style={[type.bodySemibold, { color: t.text.body, letterSpacing: 2 }]}>ASTA</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.image, { backgroundColor: t.surface.recess }]}>
          <Text style={[type.smallCaps, { color: t.text.mute }]}>
            {isSandbox ? 'TRAINING — Demo Bed' : `Step ${step + 1} of ${CARDS.length}`}
          </Text>
        </View>

        <Text style={[type.title, { color: t.text.ink, marginTop: 24 }]}>{card.headline}</Text>
        <Text style={[type.body, { color: t.text.body, marginTop: 12 }]}>{card.body}</Text>

        {step === 5 && (
          <View style={{ marginTop: 16 }}>
            {(['simple', 'detailed'] as const).map((d) => (
              <Pressable
                key={d}
                onPress={() => setPickedDensity(d)}
                style={[
                  styles.densityChoice,
                  {
                    borderColor: pickedDensity === d ? t.accent.accent : t.surface.hairline,
                    backgroundColor: pickedDensity === d ? t.accent.accentBg : 'transparent',
                  },
                ]}
              >
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: t.text.body,
                      backgroundColor: pickedDensity === d ? t.accent.accent : 'transparent',
                    },
                  ]}
                />
                <Text style={[type.bodySemibold, { color: t.text.body, marginLeft: 12, textTransform: 'capitalize' }]}>
                  {d}
                  {d === 'simple' ? '   (recommended for new users)' : ''}
                </Text>
              </Pressable>
            ))}
            <Text style={[type.metadata, { color: t.text.mute, marginTop: 8, fontStyle: 'italic' }]}>
              You can change this any time in Settings or from the patient header.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.dots}>
        {CARDS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i <= step && !isSandbox ? t.text.body : t.surface.hairline }]}
          />
        ))}
      </View>

      <View style={styles.btnRow}>
        {isSandbox && (
          <>
            <Button label="Start sandbox" variant="primary" onPress={next} fullWidth />
            <View style={{ height: 8 }} />
            <Button label="Skip — go to Roster" variant="outlined" onPress={onDone} fullWidth />
          </>
        )}
        {!isSandbox && (
          <Button label={card.customCta ?? 'Continue'} variant="primary" onPress={next} fullWidth />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24 },
  skip: { position: 'absolute', top: 16, right: 16, padding: 8, zIndex: 10 },
  monogram: { alignItems: 'center', marginTop: 32 },
  scroll: { paddingTop: 16 },
  image: { height: 220, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginVertical: 16, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  btnRow: { paddingBottom: 16 },
  densityChoice: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
});
