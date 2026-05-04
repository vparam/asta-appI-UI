import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { VitalReading } from '@/data/types';
import { Card } from './Card';

type Props = {
  reading: VitalReading;
  onPress?: () => void;
};

const ICON: Record<VitalReading['lane'], string> = {
  hr: '♥',
  spo2: '◐',
  sbp: '◆',
  dbp: '◇',
  map: '▤',
};

const TITLE: Record<VitalReading['lane'], string> = {
  hr: 'Heart Rate',
  spo2: 'SpO2',
  sbp: 'Systolic BP',
  dbp: 'Diastolic BP',
  map: 'MAP',
};

const GLYPH: Record<VitalReading['direction'], string> = {
  stable: '•',
  falling: '↓',
  rising: '↑',
};

export function VitalTile({ reading, onPress }: Props) {
  const t = useTokens();
  const laneColour = t.vital[reading.lane];
  const interpColour = reading.outOfRange ? t.severity.watch : t.text.mute;

  return (
    <Pressable onPress={onPress} style={{ flex: 1 }} accessibilityRole="button">
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={[type.bodySemibold, { color: t.text.body }]}>{TITLE[reading.lane]}</Text>
          <Text style={[type.bodySemibold, { color: laneColour, fontSize: 18 }]}>{ICON[reading.lane]}</Text>
        </View>
        <View style={styles.numRow}>
          <Text style={[type.vitalNumeric, { color: t.text.ink }]}>{reading.value}</Text>
          <Text style={[type.body, { color: t.text.mute, marginLeft: 6 }]}>{reading.unit}</Text>
        </View>
        <Text
          style={[
            type.metadata,
            {
              color: interpColour,
              fontWeight: reading.outOfRange ? '600' : '400',
              marginTop: 4,
            },
          ]}
        >
          {`${GLYPH[reading.direction]} ${reading.interpretation}`}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 120,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8 },
});
