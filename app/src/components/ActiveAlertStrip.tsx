import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { AlertEvent } from '@/data/types';
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
 */
export function ActiveAlertStrip({ event, onAcknowledge, onEscalate }: Props) {
  const t = useTokens();
  const isCrit = event.severity === 'critical';
  const bg = isCrit ? t.severity.criticalBg : t.severity.watchBg;
  const tag = isCrit ? t.severity.critical : t.severity.watch;

  return (
    <Card style={{ backgroundColor: bg, marginVertical: 8, padding: 16 }}>
      <Text style={[type.smallCaps, { color: tag, marginBottom: 4 }]}>
        {`${eventTime(event.firedAt)} · ${event.severity.toUpperCase()}`}
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

function eventTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(d) + ' IST';
}

const styles = StyleSheet.create({
  btnRow: { flexDirection: 'row', marginTop: 12 },
});
