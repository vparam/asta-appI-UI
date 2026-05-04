import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTokens } from '@/theme/ThemeProvider';
import { type } from '@/theme/typography';
import { telemetry } from '@/state/telemetry';

type Kind = 'confidence' | 'timesfm' | 'severity' | 'risk_score';

const CONTENT: Record<Kind, { title: string; body: React.ReactNode }> = {
  confidence: {
    title: 'How to read confidence',
    body: (
      <>
        <Row label="Low confidence (0–30%)" body="Model considers this scenario possible but not dominant." />
        <Row label="Moderate confidence (31–65%)" body="Clinically relevant signal worth investigating." />
        <Row label="High confidence (66–100%)" body="Strong model signal; verify clinically." />
        <FooterNote>
          Confidence is a ranking among modelled scenarios, not an absolute probability of crisis.
        </FooterNote>
      </>
    ),
  },
  timesfm: {
    title: 'About the forecast model',
    body: (
      <>
        <Row label="TimesFM" body="A time-series foundation model from Google. We use the 500m-pytorch checkpoint, trained on 100B+ time points across many domains." />
        <Row label="Horizon" body="Forecast horizon is configured per vital. The shaded band widens with horizon to indicate growing uncertainty." />
        <Row label="Limitations" body="Forecasts assume the recent vital pattern continues. Clinical interventions or sudden physiology changes are not anticipated." />
      </>
    ),
  },
  severity: {
    title: 'Risk states',
    body: (
      <>
        <Row label="Stable (0–30)" body="No dominant high-risk trend. Continue routine monitoring." />
        <Row label="Watch (31–60)" body="Elevated risk. Tighter monitoring; specific actions may be ranked." />
        <Row label="Critical (61–100)" body="Action requested ≤ 5 min. Escalation routing active." />
      </>
    ),
  },
  risk_score: {
    title: 'About the risk score',
    body: (
      <>
        <Row label="Composite" body="The 0–100 score combines four sub-models: cardiac, respiratory, neurology, and perfusion." />
        <Row label="Calibration" body="Bands are set per ward by clinical leadership in Pro Command." />
        <FooterNote>
          The score is decision-support — verify with clinical judgement.
        </FooterNote>
      </>
    ),
  },
};

function Row({ label, body }: { label: string; body: string }) {
  const t = useTokens();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[type.bodySemibold, { color: t.text.body }]}>{label}</Text>
      <Text style={[type.body, { color: t.text.body, marginTop: 2 }]}>{body}</Text>
    </View>
  );
}

function FooterNote({ children }: { children: React.ReactNode }) {
  const t = useTokens();
  return (
    <Text style={[type.metadata, { color: t.text.mute, marginTop: 8, fontStyle: 'italic' }]}>{children}</Text>
  );
}

type Props = {
  kind: Kind;
  /** The element to wrap. Long-press opens the tooltip; short tap is forwarded. */
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Tooltip({ kind, children, onPress, accessibilityLabel }: Props) {
  const t = useTokens();
  const [visible, setVisible] = useState(false);
  const c = CONTENT[kind];

  return (
    <>
      <Pressable
        onPress={onPress}
        onLongPress={() => {
          telemetry.emit('tooltip_opened', { kind });
          setVisible(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="Long-press for explanation"
      >
        {children}
      </Pressable>
      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.scrim} onPress={() => setVisible(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: t.surface.surface, borderColor: t.surface.hairline }]}>
            <Text style={[type.cardTitle, { color: t.text.body, marginBottom: 12 }]}>{c.title}</Text>
            {c.body}
            <Pressable
              onPress={() => setVisible(false)}
              style={{ alignSelf: 'flex-end', marginTop: 16 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={[type.bodySemibold, { color: t.accent.accent }]}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { padding: 20, borderRadius: 16, borderWidth: 1, width: '100%', maxWidth: 480 },
});
