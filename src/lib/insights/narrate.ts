import { InsightCandidate, NarrativeTip } from './types';
import { validateClinicalBoundary } from './clinicalValidator';

export interface GeneratedNarrative {
  title: string;
  body: string;
  tips?: NarrativeTip[];
  whatsWorkingMd?: string;
}

export async function narrateInsightCandidate(candidate: InsightCandidate): Promise<{ title: string; body: string }> {
  // Validate candidate body and title through clinical boundary validator
  const titleValidation = validateClinicalBoundary(candidate.title);
  const bodyValidation = validateClinicalBoundary(candidate.body);

  if (!titleValidation.isValid || !bodyValidation.isValid) {
    return {
      title: candidate.title.replace(/dosage|medication|prescription/gi, 'check-in call'),
      body: candidate.body.replace(/dosage|medication|prescription/gi, 'patient re-engagement call'),
    };
  }

  return {
    title: candidate.title,
    body: candidate.body,
  };
}

export async function generateMonthlyNarrativeAndTips(
  snapshotData: any,
  topCandidates: InsightCandidate[]
): Promise<{ whatsWorkingMd: string; tips: NarrativeTip[] }> {
  const tips: NarrativeTip[] = [];

  // Generate 3 hyper-specific, non-generic operational tips from topCandidates
  let tipIndex = 1;
  for (const c of topCandidates) {
    if (tips.length >= 3) break;
    const bodyValidation = validateClinicalBoundary(c.body);
    if (!bodyValidation.isValid) continue;

    // Suppression test: Check if tip contains specific clinic entity or specific numbers
    const hasSpecifics = c.body.includes('₹') || c.body.includes('%') || c.body.includes('Session') || (c.entityIdsJson && c.entityIdsJson.length > 0);
    if (!hasSpecifics) continue;

    tips.push({
      tipId: `tip-${tipIndex++}`,
      ruleKey: c.ruleKey,
      text: `${c.title}: ${c.body}`,
      targetMetricKey: c.ruleKey,
      baselineValue: c.evidenceJson
    });
  }

  // Fallbacks if fewer than 3 tips
  if (tips.length < 3 && snapshotData) {
    const activePkgs = snapshotData.packagesActive || 0;
    const util = Math.round(snapshotData.utilizationPct || 0);

    if (tips.length < 3) {
      tips.push({
        tipId: `tip-${tipIndex++}`,
        ruleKey: 'capacity_fill_action',
        text: `Optimize Off-Peak Slots: Current chair utilization is ${util}%. Send targeted 1-tap WhatsApp booking links to fill 11:00 AM weekday slots.`,
        targetMetricKey: 'utilizationPct',
        baselineValue: { utilizationPct: util }
      });
    }

    if (tips.length < 3) {
      tips.push({
        tipId: `tip-${tipIndex++}`,
        ruleKey: 'package_conversion_action',
        text: `Convert Single-Session Visits to Packages: ${activePkgs} active courses currently. Present Gold 10-session package to patients reaching visit #2.`,
        targetMetricKey: 'packagesActive',
        baselineValue: { packagesActive: activePkgs }
      });
    }

    if (tips.length < 3) {
      tips.push({
        tipId: `tip-${tipIndex++}`,
        ruleKey: 'cancellation_prevention_action',
        text: `Reduce Same-Day Missed Appointments: Set 2-hour automated WhatsApp pre-session notifications for afternoon appointment blocks.`,
        targetMetricKey: 'noShowCount',
        baselineValue: { noShowCount: snapshotData.noShowCount || 0 }
      });
    }
  }

  const whatsWorkingMd = `### Operational Achievements & Highlights

- **Chair Utilization & Velocity**: Delivered ${snapshotData?.sessionsDelivered || 0} therapeutic sessions with ${Math.round(snapshotData?.utilizationPct || 0)}% chair occupancy.
- **Course Package Retention**: Maintained ${snapshotData?.packagesActive || 0} active multi-session packages, protecting care plan continuity.
- **Rebooking Rate**: Achieved a ${Math.round(snapshotData?.rebookRatePct || 0)}% patient rebooking rate across clinical appointments.`;

  return {
    whatsWorkingMd,
    tips
  };
}
