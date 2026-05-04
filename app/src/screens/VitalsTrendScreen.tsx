import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { api } from '@/data/api';
import { PatientFile, PatientToken, VitalLane } from '@/data/types';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';
import { TrendChart } from '@/components/TrendChart';

const LANE_TITLES: Record<VitalLane, string> = {
  hr: 'Heart Rate',
  spo2: 'SpO2',
  sbp: 'Systolic BP',
  dbp: 'Diastolic BP',
  map: 'MAP',
};

const THRESHOLDS: Record<VitalLane, { lower: number; baseline: number; upper: number }> = {
  hr: { lower: 60, baseline: 80, upper: 100 },
  spo2: { lower: 92, baseline: 96, upper: 100 },
  sbp: { lower: 90, baseline: 120, upper: 140 },
  dbp: { lower: 60, baseline: 80, upper: 90 },
  map: { lower: 65, baseline: 85, upper: 110 },
};

type Props = {
  token: PatientToken;
  initialLane?: VitalLane;
};

export function VitalsTrendScreen({ token, initialLane = 'hr' }: Props) {
  const t = useTokens();
  const { width } = useWindowDimensions();
  const [patient, setPatient] = useState<PatientFile | null>(null);
  const [lane, setLane] = useState<VitalLane>(initialLane);
  const [horizon, setHorizon] = useState<'4h' | '24h'>('24h');

  useEffect(() => {
    api.patient(token).then(setPatient);
  }, [token]);

  if (!patient) return <View style={[styles.root, { backgroundColor: t.surface.canvas }]} />;

  const reading = patient.vitals.find((v) => v.lane === lane)!;
  const history = patient.vitalHistory[lane];
  const forecast = patient.forecasts.find((f) => f.lane === lane);

  return (
    <ScrollView style={[styles.root, { backgroundColor: t.surface.canvas }]} contentContainerStyle={styles.scroll}>
      <Text style={[type.title, { color: t.text.ink }]}>Vitals Trend</Text>
      <Text style={[type.metadata, { color: t.text.mute, marginBottom: 16 }]}>{`Bed ${patient.bed.bed}`}</Text>

      <View style={styles.tabs}>
        {(['hr', 'spo2', 'sbp', 'map'] as VitalLane[]).map((l) => (
          <Text
            key={l}
            onPress={() => setLane(l)}
            style={[
              type.bodySemibold,
              {
                color: lane === l ? t.text.body : t.text.mute,
                borderBottomColor: lane === l ? t.accent.accent : 'transparent',
                borderBottomWidth: 2,
                paddingVertical: 8,
                paddingHorizontal: 16,
              },
            ]}
          >
            {l.toUpperCase()}
          </Text>
        ))}
      </View>

      <Card style={styles.summary}>
        <Text style={[type.body, { color: t.text.body, textAlign: 'center' }]}>
          {LANE_TITLES[lane]}
        </Text>
        <View style={styles.numRow}>
          <Text style={[type.riskScore, { color: t.text.ink }]}>{reading.value}</Text>
          <Text style={[type.body, { color: t.text.mute, marginLeft: 8, marginTop: 24 }]}>{reading.unit}</Text>
        </View>
        <Pill severity={reading.outOfRange ? 'watch' : 'stable'} label={reading.direction === 'falling' ? '↓ Falling within range' : reading.direction} />
        <Text style={[type.body, { color: t.text.mute, marginTop: 12, textAlign: 'center' }]}>
          {reading.interpretation}
        </Text>
      </Card>

      <Card>
        <View style={styles.trendHeader}>
          <Text style={[type.cardTitle, { color: t.text.body }]}>{`${horizon === '4h' ? '4h' : '24h'} Trend`}</Text>
          <View style={styles.horizonChips}>
            {(['4h', '24h'] as const).map((h) => (
              <Text
                key={h}
                onPress={() => setHorizon(h)}
                style={[
                  type.metadata,
                  {
                    color: horizon === h ? t.text.body : t.text.mute,
                    backgroundColor: horizon === h ? t.surface.recess : 'transparent',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    overflow: 'hidden',
                  },
                ]}
              >
                {h}
              </Text>
            ))}
          </View>
        </View>
        <TrendChart
          lane={lane}
          history={horizon === '4h' ? history.slice(-48) : history}
          forecast={forecast?.trace}
          width={width - 64}
          height={220}
          thresholds={THRESHOLDS[lane]}
        />
      </Card>

      <Card>
        <Text style={[type.bodySemibold, { color: t.severity.stable }]}>✓ No action required</Text>
        <Text style={[type.body, { color: t.text.body, marginTop: 4 }]}>Continue routine monitoring.</Text>
        <View style={[styles.divider, { backgroundColor: t.surface.hairline }]} />
        <Text style={[type.metadata, { color: t.text.mute }]}>{patient.read.nextCheck}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  summary: { alignItems: 'center', paddingVertical: 20 },
  numRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  horizonChips: { flexDirection: 'row', gap: 6 },
  divider: { height: 1, marginVertical: 12 },
});
