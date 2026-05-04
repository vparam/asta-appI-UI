import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { useDensity } from '@/state/density';
import { api } from '@/data/api';
import { PatientFile, PatientToken } from '@/data/types';
import { PatientHeader } from '@/components/PatientHeader';
import { RiskSummaryCard } from '@/components/RiskSummaryCard';
import { ActiveAlertStrip } from '@/components/ActiveAlertStrip';
import { VitalTile } from '@/components/VitalTile';
import { LiveTrendBoard } from '@/components/LiveTrendBoard';
import { VitalForecastCard } from '@/components/VitalForecastCard';
import { ScenarioMatrixCard } from '@/components/ScenarioMatrixCard';
import { Card } from '@/components/Card';
import { AddBedsideDataRow } from '@/components/AddBedsideDataRow';
import { ConversationEntry } from '@/components/ConversationEntry';
import { Button } from '@/components/Button';
import { DensitySheet } from '@/components/DensitySheet';
import { EscalateSheet } from '@/components/EscalateSheet';

type Props = {
  token: PatientToken;
  /** Optional event ID — when present, scrolls to the event marker on load. */
  eventId?: string;
  navigation: { navigate: (screen: string, params?: unknown) => void; goBack: () => void };
};

export function PatientScreen({ token, navigation }: Props) {
  const t = useTokens();
  const { density, set: setDensity } = useDensity();
  const [patient, setPatient] = useState<PatientFile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reRunning, setRerunning] = useState(false);
  const [receipts, setReceipts] = useState<{ score?: string; confidence?: string } | undefined>();
  const [acknowledged, setAcknowledged] = useState(false);
  const [showDensity, setShowDensity] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [contextualPrompt, setContextualPrompt] = useState<string | undefined>();

  const load = React.useCallback(() => {
    setRefreshing(true);
    api
      .patient(token)
      .then((p) => {
        setPatient(p);
        // §7.10: surface a contextual prompt only when the model has a reason to.
        const hasLowConfidence = p.read.scenarios.some((s) => s.confidence.label === 'low');
        if (hasLowConfidence) {
          setContextualPrompt('Adding lactate or urine output may improve this prediction');
        } else {
          setContextualPrompt(undefined);
        }
      })
      .finally(() => setRefreshing(false));
  }, [token]);

  useEffect(load, [load]);

  if (!patient) {
    return (
      <View style={[styles.loading, { backgroundColor: t.surface.canvas }]}>
        <ActivityIndicator />
      </View>
    );
  }

  const rerun = async () => {
    setRerunning(true);
    try {
      const r = await api.rerun(token, { lactate: 2.4 });
      setPatient(r.patient);
      setReceipts({
        score: r.receipts.score?.copy,
        confidence: r.receipts.confidence?.copy,
      });
      setTimeout(() => setReceipts(undefined), 6000);
    } finally {
      setRerunning(false);
    }
  };

  const tilePairs: typeof patient.vitals[] = [];
  for (let i = 0; i < patient.vitals.length; i += 2) {
    tilePairs.push(patient.vitals.slice(i, i + 2));
  }

  return (
    <View style={[styles.root, { backgroundColor: t.surface.canvas }]}>
      <PatientHeader
        bed={patient.bed}
        state={patient.read.state}
        syncedSecondsAgo={patient.syncedSecondsAgo}
        density={density}
        onChangeDensity={() => setShowDensity(true)}
        onRerun={rerun}
      />
      {reRunning && (
        <View style={[styles.banner, { backgroundColor: t.accent.accentBg }]}>
          <ActivityIndicator color={t.accent.accent} />
          <Text style={[type.body, { color: t.accent.accent, marginLeft: 8 }]}>
            Re-running PPLM with new data…
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        <RiskSummaryCard read={patient.read} density={density} receipts={receipts} />

        {patient.activeAlert && !acknowledged && (
          <ActiveAlertStrip
            event={patient.activeAlert}
            onAcknowledge={() => setAcknowledged(true)}
            onEscalate={() => setShowEscalate(true)}
          />
        )}

        <Text style={[type.smallCaps, { color: t.text.mute, marginTop: 8, marginHorizontal: 4 }]}>
          CURRENT VITALS
        </Text>
        <View style={styles.tileGrid}>
          {tilePairs.map((pair, i) => (
            <View key={i} style={styles.tileRow}>
              {pair.map((v) => (
                <View key={v.lane} style={styles.tileCell}>
                  <VitalTile
                    reading={v}
                    onPress={() => navigation.navigate('VitalsTrend', { token, lane: v.lane })}
                  />
                </View>
              ))}
              {pair.length === 1 && <View style={styles.tileCell} />}
            </View>
          ))}
        </View>

        <LiveTrendBoard
          vitals={patient.vitals}
          history={patient.vitalHistory}
          forecasts={patient.forecasts}
          density={density}
        />

        <VitalForecastCard forecasts={patient.forecasts} density={density} />

        <ScenarioMatrixCard scenarios={patient.read.scenarios} density={density} />

        <Card>
          <Text style={[type.cardTitle, { color: t.text.body }]}>Future Risk / Medication Safety</Text>
          {density === 'detailed' ? (
            <>
              <Text style={[type.smallCaps, { color: t.text.mute, marginTop: 8 }]}>RISK TRAJECTORY</Text>
              <Text style={[type.body, { color: t.text.body, marginTop: 4 }]}>
                {patient.read.scenarios[0].title} remains the leading future-risk lane.{' '}
                {patient.read.scenarios[0].rationaleMobile}
              </Text>
              <Text style={[type.smallCaps, { color: t.text.mute, marginTop: 12 }]}>MEDICATION CONSTRAINTS</Text>
              <Text style={[type.body, { color: t.text.body, marginTop: 4 }]}>
                Antibiotic / vasopressor / fluid decisions require clinician diagnosis, local sepsis protocol, allergies, cultures, BP response, and renal/cardiac context.
              </Text>
            </>
          ) : (
            <Text style={[type.body, { color: t.text.mute, marginTop: 8 }]}>Tap to expand ▾</Text>
          )}
        </Card>

        <Text style={[type.metadata, { color: t.text.mute, marginVertical: 8, textAlign: 'center' }]}>
          {`Medicines: ${patient.context.medicines} · Allergies: ${patient.context.allergies} · Records: ${patient.context.records} · Generated ${patient.context.generatedAt}`}
        </Text>

        <AddBedsideDataRow
          prompt={contextualPrompt}
          onPress={() => navigation.navigate('AddBedsideData', { token })}
        />

        <ConversationEntry
          onOpenFullScreen={() => navigation.navigate('Conversation', { token })}
          onAsk={(q) => navigation.navigate('Conversation', { token, prefill: q })}
        />

        <View style={styles.actionRow}>
          <Button label="⟳ Rerun" variant="outlined" onPress={rerun} fullWidth style={{ flex: 1 }} />
          <View style={{ width: 8 }} />
          <Button label="↗ Open in Pro" variant="outlined" fullWidth style={{ flex: 1 }} />
          <View style={{ width: 8 }} />
          <Button label="⤴ Share" variant="outlined" fullWidth style={{ flex: 1 }} />
        </View>
      </ScrollView>

      {showDensity && (
        <DensitySheet
          current={density}
          onPick={(d) => {
            setDensity(d);
            setShowDensity(false);
          }}
          onDismiss={() => setShowDensity(false)}
        />
      )}

      {showEscalate && patient.activeAlert && (
        <EscalateSheet
          event={patient.activeAlert}
          onDismiss={() => setShowEscalate(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  scroll: { padding: 16, paddingBottom: 48, gap: 12 },
  tileGrid: { gap: 8 },
  tileRow: { flexDirection: 'row', gap: 8 },
  tileCell: { flex: 1 },
  actionRow: { flexDirection: 'row', marginTop: 8 },
});
