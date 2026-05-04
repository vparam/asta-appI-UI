/** Shared fixture types — kept in sync with `app/src/data/types.ts`. */

export type PatientToken = `PT-${string}`;
export type SeverityState = 'stable' | 'watch' | 'critical';
export type ConfidenceLabel = 'low' | 'moderate' | 'high';
export type VitalLane = 'hr' | 'spo2' | 'sbp' | 'dbp' | 'map';

export type BedIdentifier = {
  ward: string;
  bed: number;
  token: PatientToken;
  admittedRelative: string;
};

export type ConfidencePill = {
  label: ConfidenceLabel;
  percent: number;
  showUncertainHint?: boolean;
};

export type Scenario = {
  id: string;
  title: string;
  confidence: ConfidencePill;
  rationaleMobile: string;
  summary: string;
  actionHint: string;
  whyTraces: { model: string; line: string }[];
  checks: string[];
};

export type VitalReading = {
  lane: VitalLane;
  value: number;
  unit: string;
  direction: 'stable' | 'falling' | 'rising';
  interpretation: string;
  outOfRange: boolean;
};

export type Forecast = {
  lane: VitalLane;
  narrative: string;
  confidence: ConfidencePill;
  horizons: { tMin: 30 | 60 | 120; value: number }[];
  trace: { tMin: number; value: number }[];
  atRisk: boolean;
};

export type RiskRead = {
  score: number;
  state: SeverityState;
  currentRead: string;
  actionLine: string;
  actionRegister: 'monitoring' | 'directive';
  nextCheck: string;
  scenarios: Scenario[];
  subScores: { cardiac: number; respiratory: number; neurology: number; perfusion: number };
};

export type AlertEvent = {
  id: string;
  patientToken: PatientToken;
  bed: BedIdentifier;
  severity: SeverityState;
  firedAt: string;
  headline: string;
  routingChain: { name: string; role: string; isCurrent: boolean }[];
  acknowledged?: { at: string; via: 'in-app' | 'notification' };
};

export type PatientFile = {
  bed: BedIdentifier;
  read: RiskRead;
  vitals: VitalReading[];
  vitalHistory: Record<VitalLane, { tMin: number; value: number }[]>;
  forecasts: Forecast[];
  activeAlert?: AlertEvent;
  context: { medicines: number; allergies: number; records: number; generatedAt: string };
  syncedSecondsAgo: number;
};

export type RosterEntry = {
  bed: BedIdentifier;
  state: SeverityState;
  score: number;
  vitalsAgeRelative: string;
};
