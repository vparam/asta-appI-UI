/**
 * Wire types — strictly enforce the spec §3.2 privacy architecture: NO field
 * on any of these types is allowed to carry a patient name, MRN, DOB, address
 * or any other PII. Patients are identified by ward + bed + opaque token.
 */

export type PatientToken = `PT-${string}`;

export type BedIdentifier = {
  ward: string;
  bed: number;
  token: PatientToken;
  /** Relative form. Never an absolute timestamp — see §3.2. */
  admittedRelative: string;
};

export type SeverityState = 'stable' | 'watch' | 'critical';

export type ConfidenceLabel = 'low' | 'moderate' | 'high';

export type ConfidencePill = {
  label: ConfidenceLabel;
  percent: number;
  /** Headline pill on §7.2 only. Suffix " · uncertain signal" is added at render. */
  showUncertainHint?: boolean;
};

export type Scenario = {
  id: string;
  title: string;
  confidence: ConfidencePill;
  /** Mobile rewrite (§7.2 v2.5): ≤18 words, consequence-led. */
  rationaleMobile: string;
  /** One-sentence summary for Scenario Matrix rows (§7.7). */
  summary: string;
  /** Action hint, scoped to this scenario. Register matches priority. */
  actionHint: string;
  /** Why traces — model name + line. */
  whyTraces: { model: string; line: string }[];
  /** Clinical follow-up bullets. */
  checks: string[];
};

export type VitalLane = 'hr' | 'spo2' | 'sbp' | 'dbp' | 'map';

export type VitalReading = {
  lane: VitalLane;
  value: number;
  unit: string;
  /** "stable" | "falling" | "rising" — directional glyph at render. */
  direction: 'stable' | 'falling' | 'rising';
  /** Interpretation suffix: "within range (60–100)" or "below 92% hypoxia threshold". */
  interpretation: string;
  /** True if `interpretation` should render in severity colour. */
  outOfRange: boolean;
};

export type ForecastSample = { tMin: number; value: number };

export type Forecast = {
  lane: VitalLane;
  /** Plain-language narrative + optional preparatory bridge. */
  narrative: string;
  confidence: ConfidencePill;
  /** Horizon chips: 30m, 60m, 120m. */
  horizons: { tMin: 30 | 60 | 120; value: number }[];
  /** Predicted samples for the chart trace (dotted). */
  trace: ForecastSample[];
  /** True if this forecast crosses a watch/critical threshold within the horizon. */
  atRisk: boolean;
};

export type RiskRead = {
  /** 0–100 integer. */
  score: number;
  state: SeverityState;
  /** §7.2 Current Read sentence. */
  currentRead: string;
  /** §7.2 Clinical Action Line, ≤15 words. */
  actionLine: string;
  /** Directive register requires model-ranked priority — see §7.2 register-rank rule. */
  actionRegister: 'monitoring' | 'directive';
  /** §7.2 Next routine check. */
  nextCheck: string;
  scenarios: Scenario[];
  /** Four sub-scores revealed on long-press (Simple) or default (Detailed). */
  subScores: { cardiac: number; respiratory: number; neurology: number; perfusion: number };
};

export type AlertEvent = {
  id: string;
  patientToken: PatientToken;
  bed: BedIdentifier;
  severity: SeverityState;
  /** ISO 8601 string. Render in IST in the UI. */
  firedAt: string;
  /** Headline shown on the active alert strip and the push body. */
  headline: string;
  /** Routing chain. Recipient #1 of N, etc. */
  routingChain: { name: string; role: string; isCurrent: boolean }[];
  acknowledged?: { at: string; via: 'in-app' | 'notification' };
};

export type PatientFile = {
  bed: BedIdentifier;
  read: RiskRead;
  vitals: VitalReading[];
  /** Last ~2h of measured samples per vital. */
  vitalHistory: Record<VitalLane, { tMin: number; value: number }[]>;
  forecasts: Forecast[];
  /** Active alert, if any. */
  activeAlert?: AlertEvent;
  /** Clinical context strip. */
  context: { medicines: number; allergies: number; records: number; generatedAt: string };
  /** Last sync, in seconds ago. */
  syncedSecondsAgo: number;
};

export type RosterEntry = {
  bed: BedIdentifier;
  state: SeverityState;
  score: number;
  vitalsAgeRelative: string;
};
