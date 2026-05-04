import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { api } from '@/data/api';
import { AlertEvent, RosterEntry } from '@/data/types';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';

type Props = {
  navigation: { navigate: (s: string, p: { token: string; eventId?: string }) => void };
};

export function InboxScreen({ navigation }: Props) {
  const t = useTokens();
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);

  useEffect(() => {
    // Hydrate from the patient endpoint — any patient with an active alert appears here.
    api.roster().then(async (entries: RosterEntry[]) => {
      const out: AlertEvent[] = [];
      for (const e of entries) {
        const p = await api.patient(e.bed.token);
        if (p.activeAlert) out.push(p.activeAlert);
      }
      setAlerts(out);
    });
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: t.surface.canvas }]}>
      <View style={styles.header}>
        <Text style={[type.title, { color: t.text.ink }]}>Inbox</Text>
        <Text style={[type.metadata, { color: t.text.mute, marginTop: 4 }]}>
          5 of 8 watch alerts this shift
        </Text>
      </View>
      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[type.body, { color: t.text.mute, textAlign: 'center', marginTop: 32 }]}>
            No active alerts.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('Patient', { token: item.patientToken, eventId: item.id })}>
            <Card style={styles.row}>
              <View style={{ flex: 1 }}>
                <View style={styles.headerRow}>
                  <Pill severity={item.severity} label={item.severity.toUpperCase()} />
                  <Text style={[type.metadata, { color: t.text.mute, marginLeft: 8 }]}>
                    {`Bed ${item.bed.bed} · ${item.bed.token}`}
                  </Text>
                </View>
                <Text style={[type.bodySemibold, { color: t.text.body, marginTop: 8 }]}>{item.headline}</Text>
                <Text style={[type.metadata, { color: t.text.mute, marginTop: 8 }]}>
                  {item.acknowledged
                    ? `Acknowledged at ${formatTime(item.acknowledged.at)} via ${item.acknowledged.via}`
                    : `Routing chain (${item.routingChain.length}): ${item.routingChain.map((r) => r.role).join(' → ')}`}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso)) + ' IST';
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: 16 },
  list: { padding: 16, paddingTop: 0, gap: 12 },
  row: { flexDirection: 'row' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
});
