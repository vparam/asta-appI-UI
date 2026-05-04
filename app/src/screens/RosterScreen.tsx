import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  Switch,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { api } from '@/data/api';
import { RosterEntry } from '@/data/types';
import { Card } from '@/components/Card';
import { Pill } from '@/components/Pill';

type Props = {
  navigation: { navigate: (s: string, p: { token: string }) => void };
};

export function RosterScreen({ navigation }: Props) {
  const t = useTokens();
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stableOnly, setStableOnly] = useState(true);
  const [query, setQuery] = useState('');

  const load = React.useCallback(() => {
    setRefreshing(true);
    api.roster().then(setEntries).finally(() => setRefreshing(false));
  }, []);

  useEffect(load, [load]);

  const filtered = entries.filter((e) => {
    if (stableOnly && e.state !== 'stable') return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      e.bed.token.toLowerCase().includes(q) ||
      String(e.bed.bed).includes(q) ||
      e.bed.ward.toLowerCase().includes(q)
    );
  });

  return (
    <View style={[styles.root, { backgroundColor: t.surface.canvas }]}>
      <View style={styles.header}>
        <Text style={[type.title, { color: t.text.ink }]}>Trail Ward</Text>
        <View style={styles.toggleRow}>
          <Text style={[type.body, { color: t.text.body, marginRight: 8 }]}>Stable Only</Text>
          <Switch value={stableOnly} onValueChange={setStableOnly} />
        </View>
      </View>

      <View style={[styles.search, { backgroundColor: t.surface.surface, borderColor: t.surface.hairline }]}>
        <Text style={{ color: t.text.mute }}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search bed, token, or ward…"
          placeholderTextColor={t.text.faint}
          style={[type.body, { flex: 1, color: t.text.body, marginLeft: 8 }]}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.bed.token}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('Patient', { token: item.bed.token })}>
            <Card style={styles.row}>
              <View style={[styles.bedSquare, { backgroundColor: t.surface.recess }]}>
                <Text style={[type.metadata, { color: t.text.mute }]}>BED</Text>
                <Text style={[type.cardTitle, { color: t.text.body }]}>{item.bed.bed}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[type.body, { color: t.text.body }]}>{`ID: ${item.bed.token}`}</Text>
                <Text style={[type.metadata, { color: t.text.mute, marginTop: 2 }]}>
                  {`Vitals: ${item.vitalsAgeRelative}`}
                </Text>
              </View>
              <View style={styles.right}>
                <Pill severity={item.state} label={item.state.toUpperCase()} />
                <Text style={[type.metadata, { color: t.text.mute, marginTop: 4 }]}>{`Score ${item.score}`}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  list: { padding: 16, paddingTop: 0, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  bedSquare: { width: 56, height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
});
