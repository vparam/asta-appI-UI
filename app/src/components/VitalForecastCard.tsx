import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { Forecast } from '@/data/types';
import { Card } from './Card';
import { ForecastSubCard } from './ForecastSubCard';

type Props = {
  forecasts: Forecast[];
  density: 'simple' | 'detailed';
  syncedSecondsAgo?: number;
};

/**
 * §7.6 Vital Forecast.
 * Default-collapsed when nothing is at risk; auto-expanded when at least one
 * vital crosses a threshold. Detailed density forces expanded with all vitals.
 */
export function VitalForecastCard({ forecasts, density, syncedSecondsAgo = 0 }: Props) {
  const t = useTokens();
  const stale = syncedSecondsAgo > 120;
  const atRiskForecasts = forecasts.filter((f) => f.atRisk);
  const hasAtRisk = atRiskForecasts.length > 0;

  const [showAll, setShowAll] = useState(density === 'detailed' || !hasAtRisk);

  // §19.28 + §7.6: when feed is stale, the forecast region is erased — not faded —
  // and the card collapses to a single line.
  if (stale) {
    return (
      <Card>
        <View style={styles.calmRow}>
          <Text style={[type.bodySemibold, { color: t.text.body }]}>Vital Forecast</Text>
          <Text style={[type.body, { color: t.severity.watch, fontStyle: 'italic' }]}>
            Forecast unavailable — feed stale
          </Text>
        </View>
      </Card>
    );
  }

  if (!hasAtRisk && density === 'simple' && !showAll) {
    return (
      <Card>
        <Pressable onPress={() => setShowAll(true)} style={styles.calmRow}>
          <Text style={[type.bodySemibold, { color: t.text.body }]}>Vital Forecast</Text>
          <Text style={[type.body, { color: t.text.mute, fontStyle: 'italic' }]}>No risk forecasted in next 2 h</Text>
          <Text style={[type.metadata, { color: t.text.mute }]}>▾</Text>
        </Pressable>
      </Card>
    );
  }

  const surfaced =
    density === 'detailed' || showAll ? forecasts : atRiskForecasts;
  const hidden = density === 'simple' && !showAll ? forecasts.filter((f) => !f.atRisk) : [];

  return (
    <Card>
      <Text style={[type.cardTitle, { color: t.text.body }]}>Vital Forecast</Text>
      <Text style={[type.mono, { color: t.text.mute, marginTop: 4 }]}>
        Forecast model: google/timesfm-2.0-500m-pytorch · HF time-series
      </Text>
      {surfaced.map((f) => (
        <ForecastSubCard key={f.lane} forecast={f} />
      ))}
      {hidden.length > 0 && (
        <Pressable onPress={() => setShowAll(true)}>
          <Text style={[type.metadata, { color: t.text.mute, marginTop: 8 }]}>
            ▾ Show all forecasts
          </Text>
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  calmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
