import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { VitalReading, VitalLane, Forecast } from '@/data/types';
import { Card } from './Card';
import { TrendChart } from './TrendChart';

type Props = {
  vitals: VitalReading[];
  history: Record<VitalLane, { tMin: number; value: number }[]>;
  forecasts: Forecast[];
  density: 'simple' | 'detailed';
  syncedSecondsAgo?: number;
};

const TITLE: Record<VitalLane, string> = {
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

const GLYPH = { stable: '•', falling: '↓', rising: '↑' } as const;

export function LiveTrendBoard({ vitals, history, forecasts, density, syncedSecondsAgo }: Props) {
  const t = useTokens();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const cardW = width - 32;

  const lanes = vitals.map((v) => v.lane);

  return (
    <Card>
      {density === 'detailed' && (
        <View style={styles.overviewGrid}>
          {vitals.map((v) => (
            <View key={v.lane} style={styles.overviewCell}>
              <Text style={[type.metadata, { color: t.text.mute }]}>{TITLE[v.lane]}</Text>
              <TrendChart
                lane={v.lane}
                history={history[v.lane]}
                forecast={forecasts.find((f) => f.lane === v.lane)?.trace}
                width={(cardW - 16) / 2}
                height={80}
                thresholds={THRESHOLDS[v.lane]}
                syncedSecondsAgo={syncedSecondsAgo}
                participatesInScrub={false}
              />
            </View>
          ))}
        </View>
      )}

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / cardW))}
      >
        {vitals.map((v) => {
          const interpColour = v.outOfRange ? t.severity.watch : t.text.mute;
          return (
            <View key={v.lane} style={{ width: cardW }}>
              <View style={styles.cardHeader}>
                <Text style={[type.bodySemibold, { color: t.text.body }]}>{TITLE[v.lane]}</Text>
                <Text style={[type.metadata, { color: interpColour }]}>{`${GLYPH[v.direction]} ${v.direction}`}</Text>
              </View>
              <Text
                style={[
                  type.metadata,
                  { color: interpColour, marginVertical: 6, fontWeight: v.outOfRange ? '600' : '400' },
                ]}
              >
                {`${v.value} ${v.unit} · ${GLYPH[v.direction]} ${v.interpretation}`}
              </Text>
              <TrendChart
                lane={v.lane}
                history={history[v.lane]}
                forecast={forecasts.find((f) => f.lane === v.lane)?.trace}
                width={cardW}
                height={180}
                thresholds={THRESHOLDS[v.lane]}
                syncedSecondsAgo={syncedSecondsAgo}
              />
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.dots}>
        {lanes.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === page ? t.text.body : t.surface.hairline },
            ]}
          />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  overviewCell: { width: '48%' },
});
