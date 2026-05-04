import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { AlertEvent } from '@/data/types';
import { relativeFromNow } from '@/data/time';
import { Card } from './Card';
import { Button } from './Button';

type Props = {
  event: AlertEvent;
  onAcknowledge: () => void;
  onEscalate: () => void;
};

/**
 * §7.3 Active alert strip. Anchored under Risk Summary. Two equal-weight
 * primary buttons: Acknowledge (stable green), Escalate (critical outlined).
 *
 * §3.2: time displayed as relative ("2m ago"), never as an absolute timestamp.
 */
export function ActiveAlertStrip({ event, onAcknowledge, onEscalate }: Props) {
  const t = useTokens();
  const isCrit = event.severity === 'critical';
  const bg = isCrit ? t.severity.criticalBg : t.severity.watchBg;
  const tag = isCrit ? t.severity.critical : t.severity.watch;

  // Tick the relative time once a minute so the strip reads honestly.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  // Touch tick so it stays as a render dep (silence unused).
  void tick;

  return (
    <Card
      style={{ backgroundColor: bg, marginVertical: 8, padding: 16 }}
      accessibilityLabel={`${event.severity} alert fired ${relativeFromNow(event.firedAt)}: ${event.headline}`}
    >
      <Text style={[type.smallCaps, { color: tag, marginBottom: 4 }]}>
        {`${relativeFromNow(event.firedAt)} · ${event.severity.toUpperCase()}`}
      </Text>
      <Text style={[type.bodySemibold, { color: t.text.body }]}>{event.headline}</Text>
      <View style={styles.btnRow}>
        <Button label="Acknowledge" variant="stable" onPress={onAcknowledge} fullWidth style={{ flex: 1 }} haptic="light" />
        <View style={{ width: 12 }} />
        <Button label="Escalate" variant="critical" onPress={onEscalate} fullWidth style={{ flex: 1 }} haptic="medium" />
      </View>
      <Text style={[type.metadata, { color: t.text.mute, marginTop: 10, textDecorationLine: 'underline' }]}>
        Why this fired
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  btnRow: { flexDirection: 'row', marginTop: 12 },
});
