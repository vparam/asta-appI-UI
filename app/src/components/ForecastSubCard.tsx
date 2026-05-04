import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { Forecast } from '@/data/types';
import { ConfidencePill } from './ConfidencePill';
import { Tooltip } from './Tooltip';

const TITLE: Record<Forecast['lane'], string> = {
  hr: 'Heart Rate',
  spo2: 'SpO2',
  sbp: 'Systolic BP',
  dbp: 'Diastolic BP',
  map: 'MAP',
};

/**
 * §7.6 per-vital sub-card. At-risk sub-cards get a 1px watch hairline.
 * Stable sub-cards have no severity treatment.
 */
export function ForecastSubCard({ forecast }: { forecast: Forecast }) {
  const t = useTokens();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: t.surface.recess,
          borderColor: forecast.atRisk ? t.severity.watchRule : 'transparent',
          borderWidth: forecast.atRisk ? 1 : 0,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[type.bodySemibold, { color: t.text.body }]}>{TITLE[forecast.lane]}</Text>
          <Tooltip kind="timesfm" accessibilityLabel="TimesFM forecast model — long-press for details">
            <View style={[styles.badge, { backgroundColor: t.surface.surface, borderColor: t.surface.hairline }]}>
              <Text style={[type.mono, { fontSize: 10, color: t.text.mute }]}>TimesFM</Text>
            </View>
          </Tooltip>
        </View>
        {/* §19.11: nested pills must not carry the uncertain-signal hint. */}
        <ConfidencePill pill={{ ...forecast.confidence, showUncertainHint: false }} />
      </View>
      <Text style={[type.body, { color: t.text.body, marginTop: 8 }]}>{forecast.narrative}</Text>
      <View style={styles.horizons}>
        {forecast.horizons.map((h) => (
          <View key={h.tMin} style={[styles.chip, { borderColor: t.surface.hairline }]}>
            <Text style={[type.metadata, { color: t.text.body }]}>{`${h.tMin}m: ${h.value.toFixed(1)}`}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: 10, marginVertical: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8, borderRadius: 4, borderWidth: 1 },
  horizons: { flexDirection: 'row', marginTop: 10, gap: 6 },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
});
