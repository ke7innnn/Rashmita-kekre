import { 
  InsightCategory, 
  InsightSeverity, 
  InsightActionType, 
  InsightPeriodType,
  SnapshotScope 
} from '@prisma/client';

export interface SnapshotData {
  id: string;
  date: Date;
  scope: SnapshotScope;
  physioId?: string | null;
  chairHoursAvailable: number;
  chairHoursBooked: number;
  utilizationPct: number;
  sessionsDelivered: number;
  noShowCount: number;
  lateCancelCount: number;
  appointmentsBooked: number;
  rebookRatePct: number;
  newPatients: number;
  activePatients: number;
  lapsed30: number;
  lapsed60: number;
  lapsed90: number;
  packagesActive: number;
  packageSessionsRemaining: number;
  packagesExpiring14d: number;
  deferredRevenuePaise: bigint | number;
  realizedRevenuePaise: bigint | number;
  arOutstandingPaise: bigint | number;
  arOver30Paise: bigint | number;
  arOver60Paise: bigint | number;
  revenuePerChairHourPaise: bigint | number;
  tierMixJson: string;
}

export interface RuleContext {
  today: Date;
  periodType: InsightPeriodType;
  periodStart: Date;
  periodEnd: Date;
  scope: SnapshotScope;
  physioId?: string;
  currentSnapshot?: SnapshotData | null;
  historicalSnapshots: SnapshotData[];
  appointments: any[];
  patients: any[];
  packages: any[];
  invoices: any[];
  isUserAdmin: boolean;
}

export interface InsightCandidate {
  ruleKey: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  body: string;
  evidenceJson: Record<string, any>;
  entityIdsJson: string[];
  estimatedImpactPaise?: number | bigint;
  actionType?: InsightActionType;
  actionPayloadJson?: Record<string, any>;
  outcomeMetricKey?: string;
  outcomeBaselineJson?: Record<string, any>;
}

export interface InsightRule {
  key: string;
  category: InsightCategory;
  minDenominator: number;
  evaluate: (ctx: RuleContext) => InsightCandidate[] | null;
}

export interface NarrativeTip {
  tipId: string;
  ruleKey: string;
  text: string;
  targetMetricKey: string;
  baselineValue: any;
}

export interface MonthlyReviewData {
  periodStart: string;
  periodEnd: string;
  whatChanged: {
    revenuePaise: { baseline: number; current: number; pctChange: number };
    utilizationPct: { baseline: number; current: number; pctChange: number };
    noShowCount: { baseline: number; current: number; pctChange: number };
    activePackages: { baseline: number; current: number; pctChange: number };
  };
  whatsWorkingMd: string;
  tips: NarrativeTip[];
  followUp: {
    lastMonthTipsCount: number;
    actedOnCount: number;
    recoveredRevenuePaise: number;
    narrative: string;
  };
}
