import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl, Pressable, Linking, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { useDensity } from '@/state/density';
import { lastViewed } from '@/state/lastViewed';
import { telemetry } from '@/state/telemetry';
import { api } from '@/data/api';
import { PatientFile, PatientToken, VitalReading } from '@/data/types';
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
import { WhatsNewBanner } from '@/components/WhatsNewBanner';
import { computeChangedSince } from '@/data/diff';
import { useAutoEscalation } from '@/state/escalationTimer';

type Props = {
  token: PatientToken;
  /** Optional event ID — when present, scrolls to the event marker on load. */
  eventId?: string;
  /** When true, opens the EscalateSheet immediately (used by notification escalate quick action). */
  openEscalateSheet?: boolean;
  navigation: { navigate: (screen: string, params?: unknown) => void; goBack: () => void };
};

type Receipts = { score?: string; confidence?: string };

export function PatientScreen({ token, eventId, openEscalateSheet, navigation }: Props) {
  const t = useTokens();
  const { density, set: setDensity } = useDensity();
  const [patient, setPatient] = useState<PatientFile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reRunning, setRerunning] = useState(false);
  const [receipts, setReceipts] = useState<Receipts | undefined>();
  const [acknowledged, setAcknowledged] = useState(false);
  const [showDensity, setShowDensity] = useState(false);
  const [showEscalate, setShowEscalate] = useState(!!openEscalateSheet);
  const [showFutureRisk, setShowFutureRisk] = useState(false);
  const [contextualPrompt, setContextualPrompt] = useState<string | undefined>();
  const [whatsNew, setWhatsNew] = useState<{ minutesAgo: number; changes: VitalReading[] } | undefined>();

  const scrollRef = useRef<ScrollView>(null);
  const alertStripY = useRef<number | null>(null);
  const landingDeadline = useRef<number>(Date.now());
  const scrollFired = useRef<boolean>(false);
  const receiptsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    (opts?: { showRefreshing?: boolean }) => {
      if (opts?.showRefreshing !== false) setRefreshing(true);
      return api
        .patient(token)
        .then((p) => {
          // Compute "what's new since last check" before storing the new patient.
          const last = lastViewed.get(token);
          if (last) {
            const minutesAgo = Math.round((Date.now() - last.viewedAt) / 60000);
            if (minutesAgo > 5) {
              const changes = computeChangedSince(last.snapshot, p.vitals);
              if (changes.length > 0) setWhatsNew({ minutesAgo, changes });
            }
          }
          setPatient(p);
          // §7.10 contextual prompt: only when the model has a reason to ask.
          const hasLowConfidence = p.read.scenarios.some((s) => s.confidence.label === 'low');
          const stale = p.context.generatedAt.includes('h ago') || p.context.generatedAt.includes('day');
          if (hasLowConfidence && stale) {
            setContextualPrompt('Lactate from earlier this shift may sharpen the read');
          } else if (hasLowConfidence) {
            setContextualPrompt('Adding lactate or urine output may improve this prediction');
          } else {
            setContextualPrompt(undefined);
          }
          return p;
        })
        .finally(() => setRefreshing(false));
    },
    [token]
  );

  // First load.
  useEffect(() => {
    load({ showRefreshing: false });
    telemetry.emit('patient_screen_open', { token });
  }, [load, token]);

  // Track last-viewed timestamp per (user, patient) on every focus.
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (patient) lastViewed.set(token, patient.vitals);
      };
    }, [patient, token])
  );

  // Reset the scroll-target latch whenever a new eventId arrives.
  useEffect(() => {
    if (eventId) {
      scrollFired.current = false;
      landingDeadline.current = Date.now();
      // If layout already happened (warm reopen), fire immediately.
      if (alertStripY.current !== null && patient?.activeAlert?.id === eventId) {
        scrollAndReport();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, patient?.activeAlert?.id]);

  const scrollAndReport = useCallback(() => {
    if (scrollFired.current) return;
    if (alertStripY.current === null) return;
    scrollFired.current = true;
    scrollRef.current?.scrollTo({ y: alertStripY.current, animated: true });
    telemetry.emit('alert_landing_time_ms', {
      token,
      eventId: eventId ?? '',
      durationMs: Date.now() - landingDeadline.current,
    });
  }, [token, eventId]);

  // App freshness: §12.3 — auto-rerun when foregrounded after >60s in background.
  // (Hooked at the App level in production; the navigation state change here is a proxy.)

  // §19.33: 90s auto-escalation for unacknowledged criticals.
  useAutoEscalation(patient?.activeAlert, acknowledged, (nextRole) => {
    setPatient((p) => {
      if (!p?.activeAlert) return p;
      const newChain = p.activeAlert.routingChain.map((r) =>
        r.role === nextRole ? { ...r, isCurrent: true } : { ...r, isCurrent: false }
      );
      return {
        ...p,
        activeAlert: { ...p.activeAlert, routingChain: newChain },
      };
    });
    if (patient?.activeAlert) {
      api.acknowledgeAlert(patient.activeAlert.id, 'in-app').catch(() => undefined);
    }
  });

  if (!patient) {
    return (
      <View style={[styles.loading, { backgroundColor: t.surface.canvas }]}>
        <ActivityIndicator />
      </View>
    );
  }

  const ackAlert = async () => {
    if (!patient.activeAlert) return;
    setAcknowledged(true);
    telemetry.emit('alert_acknowledged', { eventId: patient.activeAlert.id, via: 'in-app' });
    try {
      await api.acknowledgeAlert(patient.activeAlert.id, 'in-app');
    } catch {
      /* offline — queued by api client */
    }
  };

  const showReceiptsFor6Seconds = (next: Receipts) => {
    setReceipts(next);
    if (receiptsTimer.current) clearTimeout(receiptsTimer.current);
    receiptsTimer.current = setTimeout(() => setReceipts(undefined), 6000);
  };

  // Cleanup the receipts timer on unmount so we don't setState on a dead component.
  useEffect(() => {
    return () => {
      if (receiptsTimer.current) clearTimeout(receiptsTimer.current);
    };
  }, []);

  const rerun = async (lactate?: number) => {
    setRerunning(true);
    try {
      const r = await api.rerun(token, lactate ? { lactate } : {});
      setPatient(r.patient);
      const next: Receipts = {};
      if (r.receipts.score) next.score = r.receipts.score.copy;
      if (r.receipts.confidence) next.confidence = r.receipts.confidence.copy;
      showReceiptsFor6Seconds(next);
      telemetry.emit('rerun_completed', { token, scoreFrom: r.receipts.score?.from, scoreTo: r.receipts.score?.to });
    } finally {
      setRerunning(false);
    }
  };

  const openAddBedsideData = () => {
    // Pass a callback the modal will call after rerun completes — refreshes
    // this screen and surfaces the receipts (§19.25, §19.26).
    navigation.navigate('AddBedsideData', {
      token,
      onRerunComplete: (r: { patient: PatientFile; receipts: { score?: { copy: string }; confidence?: { copy: string } } }) => {
        setPatient(r.patient);
        const next: Receipts = {};
        if (r.receipts.score) next.score = r.receipts.score.copy;
        if (r.receipts.confidence) next.confidence = r.receipts.confidence.copy;
        showReceiptsFor6Seconds(next);
      },
    });
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
        onRerun={() => rerun()}
        onOpenSettings={() => navigation.navigate('Settings')}
      />
      {reRunning && (
        <View style={[styles.banner, { backgroundColor: t.accent.accentBg }]}>
          <ActivityIndicator color={t.accent.accent} />
          <Text style={[type.body, { color: t.accent.accent, marginLeft: 8 }]}>
            Re-running PPLM with new data…
          </Text>
        </View>
      )}

      {whatsNew && (
        <WhatsNewBanner
          token={token}
          minutesAgo={whatsNew.minutesAgo}
          changes={whatsNew.changes}
          onDismiss={() => setWhatsNew(undefined)}
          onTapVital={(lane) => {
            navigation.navigate('VitalsTrend', { token, lane });
            setWhatsNew(undefined);
          }}
        />
      )}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load()} />}
      >
        <RiskSummaryCard read={patient.read} density={density} receipts={receipts} />

        {patient.activeAlert && !acknowledged && (
          <View
            onLayout={(e) => {
              alertStripY.current = e.nativeEvent.layout.y;
              // §19.5: scroll runs ONCE, after the strip is laid out and only when
              // we arrived from a push (eventId matches the active alert).
              if (eventId && patient.activeAlert?.id === eventId) {
                scrollAndReport();
              }
            }}
          >
            <ActiveAlertStrip
              event={patient.activeAlert}
              onAcknowledge={ackAlert}
              onEscalate={() => {
                setShowEscalate(true);
                telemetry.emit('alert_escalate_opened', { eventId: patient.activeAlert!.id });
              }}
            />
          </View>
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
          syncedSecondsAgo={patient.syncedSecondsAgo}
        />

        <VitalForecastCard
          forecasts={patient.forecasts}
          density={density}
          syncedSecondsAgo={patient.syncedSecondsAgo}
        />

        <ScenarioMatrixCard scenarios={patient.read.scenarios} density={density} patientToken={token} />

        <Pressable
          onPress={() => setShowFutureRisk((x) => !x)}
          accessibilityRole="button"
          accessibilityLabel={showFutureRisk ? 'Collapse Future Risk and Medication Safety' : 'Expand Future Risk and Medication Safety'}
        >
          <Card>
            <View style={styles.futureRiskHeader}>
              <Text style={[type.cardTitle, { color: t.text.body }]}>Future Risk / Medication Safety</Text>
              <Text style={[type.body, { color: t.text.mute }]}>{showFutureRisk || density === 'detailed' ? '▾' : '▸'}</Text>
            </View>
            {(density === 'detailed' || showFutureRisk) && (
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
            )}
          </Card>
        </Pressable>

        <Text style={[type.metadata, { color: t.text.mute, marginVertical: 8, textAlign: 'center' }]}>
          {`Medicines: ${patient.context.medicines} · Allergies: ${patient.context.allergies} · Records: ${patient.context.records} · Generated ${patient.context.generatedAt}`}
        </Text>

        <AddBedsideDataRow prompt={contextualPrompt} onPress={openAddBedsideData} />

        <ConversationEntry
          onOpenFullScreen={() => navigation.navigate('Conversation', { token })}
          onAsk={(q) => navigation.navigate('Conversation', { token, prefill: q })}
        />

        <View style={styles.actionRow}>
          <Button label="⟳ Rerun" variant="outlined" onPress={() => rerun()} fullWidth style={{ flex: 1 }} />
          <View style={{ width: 8 }} />
          <Button
            label="↗ Open in Pro"
            variant="outlined"
            onPress={() => {
              const url = `https://app.astahealthtech.com/pro/patient/${token}`;
              Linking.openURL(url).catch(() => undefined);
            }}
            fullWidth
            style={{ flex: 1 }}
          />
          <View style={{ width: 8 }} />
          <Button
            label="⤴ Share"
            variant="outlined"
            onPress={() => {
              // Three-line summary per §7.12 share sheet "Copy summary".
              // §3.2: only token + bed + clinical interpretation — no PII.
              const summary =
                `${patient.bed.ward} · Bed ${patient.bed.bed} · ${patient.bed.token}\n` +
                `Risk ${patient.read.score}/100 · ${patient.read.state.toUpperCase()}\n` +
                `${patient.read.actionLine}`;
              Share.share({ message: summary }).catch(() => undefined);
            }}
            fullWidth
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>

      {showDensity && (
        <DensitySheet
          current={density}
          onPick={(d) => {
            setDensity(d);
            setShowDensity(false);
            telemetry.emit('density_changed', { density: d });
          }}
          onDismiss={() => setShowDensity(false)}
        />
      )}

      {showEscalate && patient.activeAlert && (
        <EscalateSheet
          event={patient.activeAlert}
          onDismiss={() => setShowEscalate(false)}
          onConfirmEscalate={(target) => {
            telemetry.emit('alert_escalated', { eventId: patient.activeAlert!.id, role: target.role });
            api.acknowledgeAlert(patient.activeAlert!.id, 'in-app').catch(() => undefined);
            setShowEscalate(false);
            setAcknowledged(true);
          }}
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
  futureRiskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
