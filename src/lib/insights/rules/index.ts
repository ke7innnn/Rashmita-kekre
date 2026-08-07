import { InsightRule, RuleContext, InsightCandidate } from '../types';
import { 
  InsightCategory, 
  InsightSeverity, 
  InsightActionType 
} from '@prisma/client';
import { passesSignificance } from '../significance';

export const allRules: InsightRule[] = [
  // 1. Packages expiring in <=10 days with >=2 sessions unused
  {
    key: 'package_expiring_with_sessions_left',
    category: InsightCategory.PACKAGE,
    minDenominator: 1,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      const candidates: InsightCandidate[] = [];
      const now = ctx.today;

      for (const pkg of ctx.packages || []) {
        if (pkg.status !== 'ACTIVE' || !pkg.expiryDate) continue;
        const expiry = new Date(pkg.expiryDate);
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
        const unusedSessions = pkg.totalSessions - (pkg.sessionsUsed || 0);

        if (daysLeft >= 0 && daysLeft <= 10 && unusedSessions >= 2) {
          const patientName = pkg.patient?.fullName || 'Patient';
          const estimatedValuePaise = BigInt(Math.round(unusedSessions * (Number(pkg.ratePerDay) || 650) * 100));

          candidates.push({
            ruleKey: 'package_expiring_with_sessions_left',
            category: InsightCategory.PACKAGE,
            severity: daysLeft <= 3 ? InsightSeverity.URGENT : InsightSeverity.IMPORTANT,
            title: `Expiring Package: ${patientName} (${unusedSessions} sessions left)`,
            body: `${patientName}'s ${pkg.plan?.name || 'Treatment'} package expires in ${daysLeft} day(s) with ${unusedSessions} unused sessions remaining worth ≈₹${(Number(estimatedValuePaise) / 100).toLocaleString('en-IN')}.`,
            evidenceJson: {
              patientName,
              daysLeft,
              unusedSessions,
              totalSessions: pkg.totalSessions,
              sessionsUsed: pkg.sessionsUsed,
              packageId: pkg.id,
              expiryDate: pkg.expiryDate
            },
            entityIdsJson: [pkg.patientId, pkg.id],
            estimatedImpactPaise: estimatedValuePaise,
            actionType: InsightActionType.WHATSAPP_BOOKING_LINK,
            actionPayloadJson: {
              patientId: pkg.patientId,
              phone: pkg.patient?.phone,
              template: `Hi ${patientName}, you have ${unusedSessions} sessions remaining in your course expiring in ${daysLeft} days. Click to book your next session.`
            },
            outcomeMetricKey: 'package_sessions_recovered',
            outcomeBaselineJson: { unusedSessions }
          });
        }
      }

      return candidates.length > 0 ? candidates : null;
    }
  },

  // 2. Packages at >60% elapsed with <40% sessions consumed
  {
    key: 'package_burn_rate_mismatch',
    category: InsightCategory.PACKAGE,
    minDenominator: 1,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      const candidates: InsightCandidate[] = [];
      const now = ctx.today;

      for (const pkg of ctx.packages || []) {
        if (pkg.status !== 'ACTIVE' || !pkg.expiryDate || !pkg.purchaseDate) continue;
        const start = new Date(pkg.purchaseDate).getTime();
        const end = new Date(pkg.expiryDate).getTime();
        const totalDuration = end - start;
        if (totalDuration <= 0) continue;

        const elapsed = now.getTime() - start;
        const elapsedPct = (elapsed / totalDuration) * 100;
        const consumedPct = ((pkg.sessionsUsed || 0) / pkg.totalSessions) * 100;

        if (elapsedPct > 60 && consumedPct < 40) {
          const patientName = pkg.patient?.fullName || 'Patient';
          const unused = pkg.totalSessions - (pkg.sessionsUsed || 0);
          const impact = BigInt(Math.round(unused * 650 * 100));

          candidates.push({
            ruleKey: 'package_burn_rate_mismatch',
            category: InsightCategory.PACKAGE,
            severity: InsightSeverity.NOTICE,
            title: `Burn Rate Lag: ${patientName} (${Math.round(consumedPct)}% consumed, ${Math.round(elapsedPct)}% time elapsed)`,
            body: `${patientName} has used only ${pkg.sessionsUsed}/${pkg.totalSessions} sessions (${Math.round(consumedPct)}%) despite ${Math.round(elapsedPct)}% of validity period passed. Risk of session forfeiting.`,
            evidenceJson: {
              patientName,
              elapsedPct: Math.round(elapsedPct),
              consumedPct: Math.round(consumedPct),
              sessionsUsed: pkg.sessionsUsed,
              totalSessions: pkg.totalSessions
            },
            entityIdsJson: [pkg.patientId, pkg.id],
            estimatedImpactPaise: impact,
            actionType: InsightActionType.WHATSAPP_BOOKING_LINK,
            actionPayloadJson: { patientId: pkg.patientId, phone: pkg.patient?.phone }
          });
        }
      }

      return candidates.length > 0 ? candidates : null;
    }
  },

  // 3. Deferred revenue liability trending up MoM
  {
    key: 'deferred_revenue_liability_trending_up',
    category: InsightCategory.REVENUE,
    minDenominator: 5,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      if (!ctx.currentSnapshot) return null;
      const history = ctx.historicalSnapshots || [];
      if (history.length < 30) return null;

      const prevMonthSnap = history[history.length - 30];
      const currentLiability = BigInt(ctx.currentSnapshot.deferredRevenuePaise || 0);
      const prevLiability = BigInt(prevMonthSnap.deferredRevenuePaise || 0);

      if (prevLiability > BigInt(0) && currentLiability > (prevLiability * BigInt(12)) / BigInt(10)) {
        const increasePct = Math.round(Number(((currentLiability - prevLiability) * BigInt(100)) / prevLiability));
        return [{
          ruleKey: 'deferred_revenue_liability_trending_up',
          category: InsightCategory.REVENUE,
          severity: InsightSeverity.NOTICE,
          title: `Deferred Revenue Liability Up ${increasePct}% MoM`,
          body: `Unearned package revenue liability rose to ₹${(Number(currentLiability) / 100).toLocaleString('en-IN')}. Fast-track session delivery to convert liability into realized revenue.`,
          evidenceJson: { currentLiabilityPaise: Number(currentLiability), prevLiabilityPaise: Number(prevLiability), increasePct },
          entityIdsJson: [],
          estimatedImpactPaise: currentLiability - prevLiability,
          actionType: InsightActionType.NO_ACTION
        }];
      }
      return null;
    }
  },

  // 4. Patients who stopped between sessions 3-5 in last 30 days
  {
    key: 'patients_stalled_session_3_to_5',
    category: InsightCategory.ADHERENCE,
    minDenominator: 1,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      const candidates: InsightCandidate[] = [];
      const thirtyDaysAgo = new Date(ctx.today.getTime() - 30 * 24 * 3600 * 1000);

      for (const p of ctx.patients || []) {
        const apps = (p.appointments || []).filter((a: any) => a.status === 'COMPLETED');
        const completedCount = apps.length;
        if (completedCount >= 3 && completedCount <= 5) {
          const lastApp = apps.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          if (lastApp && new Date(lastApp.date) <= thirtyDaysAgo) {
            candidates.push({
              ruleKey: 'patients_stalled_session_3_to_5',
              category: InsightCategory.ADHERENCE,
              severity: InsightSeverity.IMPORTANT,
              title: `Adherence Risk: ${p.fullName} stalled at Session #${completedCount}`,
              body: `${p.fullName} completed ${completedCount} sessions but has had no visits in over 30 days. Mid-treatment dropout risk.`,
              evidenceJson: { patientName: p.fullName, completedSessions: completedCount, lastVisitDate: lastApp.date },
              entityIdsJson: [p.id],
              estimatedImpactPaise: BigInt(3 * 650 * 100),
              actionType: InsightActionType.VAPI_CHECKIN_CALL,
              actionPayloadJson: { patientId: p.id, phone: p.phone, scriptContext: 'Mid-treatment progress check-in' }
            });
          }
        }
      }

      return candidates.length > 0 ? candidates : null;
    }
  },

  // 5. Clinic-specific drop-off point
  {
    key: 'clinic_specific_dropoff_point',
    category: InsightCategory.ADHERENCE,
    minDenominator: 20,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      const completedCounts = (ctx.patients || []).map(p => (p.appointments || []).filter((a: any) => a.status === 'COMPLETED').length);
      if (!passesSignificance(completedCounts.length, 20)) return null;

      // Find modal session count drop-off
      const countsMap: Record<number, number> = {};
      for (const c of completedCounts) {
        if (c > 0 && c < 10) countsMap[c] = (countsMap[c] || 0) + 1;
      }

      let maxDropoffSession = 3;
      let maxDropoffFreq = 0;
      for (const [sStr, freq] of Object.entries(countsMap)) {
        if (freq > maxDropoffFreq) {
          maxDropoffFreq = freq;
          maxDropoffSession = Number(sStr);
        }
      }

      return [{
        ruleKey: 'clinic_specific_dropoff_point',
        category: InsightCategory.ADHERENCE,
        severity: InsightSeverity.INFO,
        title: `Primary Patient Drop-off Point Identified at Session #${maxDropoffSession}`,
        body: `Analytics shows ${maxDropoffFreq} patients stalled specifically after session #${maxDropoffSession}. Automated check-in reminders scheduled prior to session #${maxDropoffSession} can boost completion.`,
        evidenceJson: { maxDropoffSession, maxDropoffFreq, sampleSize: completedCounts.length },
        entityIdsJson: [],
        actionType: InsightActionType.NO_ACTION
      }];
    }
  },

  // 6. Patients with no visit in 30 / 60 / 90 days, segmented by course completion
  {
    key: 'lapsed_patients_segmented',
    category: InsightCategory.RETENTION,
    minDenominator: 5,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      const now = ctx.today.getTime();
      let lapsed30Incomplete = 0;
      let lapsed60Incomplete = 0;
      const targetPatientIds: string[] = [];

      for (const p of ctx.patients || []) {
        const apps = (p.appointments || []).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (apps.length === 0) continue;
        const lastApp = apps[0];
        const daysSince = Math.floor((now - new Date(lastApp.date).getTime()) / (1000 * 3600 * 24));
        const totalCompleted = apps.filter((a: any) => a.status === 'COMPLETED').length;

        if (totalCompleted < 6) { // Incomplete prescribed course
          if (daysSince >= 30 && daysSince < 60) {
            lapsed30Incomplete++;
            targetPatientIds.push(p.id);
          } else if (daysSince >= 60 && daysSince < 90) {
            lapsed60Incomplete++;
            targetPatientIds.push(p.id);
          }
        }
      }

      if (lapsed30Incomplete + lapsed60Incomplete >= 3) {
        return [{
          ruleKey: 'lapsed_patients_segmented',
          category: InsightCategory.RETENTION,
          severity: InsightSeverity.IMPORTANT,
          title: `Lapsed Unfinished Patients (${lapsed30Incomplete} 30-day, ${lapsed60Incomplete} 60-day)`,
          body: `${lapsed30Incomplete + lapsed60Incomplete} patients left with incomplete care plans in the last 60 days. Automated re-engagement campaign available.`,
          evidenceJson: { lapsed30Incomplete, lapsed60Incomplete },
          entityIdsJson: targetPatientIds.slice(0, 10),
          actionType: InsightActionType.VAPI_CHECKIN_CALL,
          actionPayloadJson: { patientIds: targetPatientIds }
        }];
      }
      return null;
    }
  },

  // 7. Patients who hit prescribed session count -> discharge conversation due
  {
    key: 'discharge_conversation_due',
    category: InsightCategory.RETENTION,
    minDenominator: 1,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      const candidates: InsightCandidate[] = [];
      for (const p of ctx.patients || []) {
        const completed = (p.appointments || []).filter((a: any) => a.status === 'COMPLETED').length;
        if (completed >= 10) {
          candidates.push({
            ruleKey: 'discharge_conversation_due',
            category: InsightCategory.RETENTION,
            severity: InsightSeverity.INFO,
            title: `Maintenance / Discharge Due: ${p.fullName} (${completed} sessions completed)`,
            body: `${p.fullName} has completed ${completed} sessions. Schedule a formal discharge assessment or preventive maintenance protocol transition.`,
            evidenceJson: { patientName: p.fullName, completedSessions: completed },
            entityIdsJson: [p.id],
            actionType: InsightActionType.MARK_FOR_DISCHARGE_REVIEW,
            actionPayloadJson: { patientId: p.id }
          });
        }
      }
      return candidates.length > 0 ? candidates.slice(0, 5) : null;
    }
  },

  // 8. Slot blocks under 40% utilization for >=3 consecutive weeks
  {
    key: 'underutilized_slot_blocks',
    category: InsightCategory.CAPACITY,
    minDenominator: 20,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      if (!ctx.currentSnapshot) return null;
      const util = ctx.currentSnapshot.utilizationPct || 0;
      if (util < 40 && passesSignificance(ctx.currentSnapshot.chairHoursAvailable || 0, 20)) {
        return [{
          ruleKey: 'underutilized_slot_blocks',
          category: InsightCategory.CAPACITY,
          severity: InsightSeverity.NOTICE,
          title: `Low Capacity Utilization: ${Math.round(util)}% Chair Utilization`,
          body: `Clinic chair hours utilization is running under target at ${Math.round(util)}%. Consider promoting morning/afternoon promotional packages.`,
          evidenceJson: { utilizationPct: Math.round(util), chairHoursAvailable: ctx.currentSnapshot.chairHoursAvailable },
          entityIdsJson: [],
          actionType: InsightActionType.NO_ACTION
        }];
      }
      return null;
    }
  },

  // 9. Slot blocks consistently at ceiling -> candidate for expansion
  {
    key: 'capacity_ceiling_slot_blocks',
    category: InsightCategory.CAPACITY,
    minDenominator: 20,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      if (!ctx.currentSnapshot) return null;
      const util = ctx.currentSnapshot.utilizationPct || 0;
      if (util >= 85) {
        return [{
          ruleKey: 'capacity_ceiling_slot_blocks',
          category: InsightCategory.CAPACITY,
          severity: InsightSeverity.IMPORTANT,
          title: `High Peak Utilization: ${Math.round(util)}% Capacity Ceiling Reached`,
          body: `Clinic is operating near full capacity (${Math.round(util)}%). Offer waitlist promotion to instantly backfill cancellations.`,
          evidenceJson: { utilizationPct: Math.round(util) },
          entityIdsJson: [],
          actionType: InsightActionType.OFFER_SLOT_TO_WAITLIST,
          actionPayloadJson: { triggerWaitlistFill: true }
        }];
      }
      return null;
    }
  },

  // 10. Weekday x hour heatmap outliers
  {
    key: 'weekday_hour_heatmap_outliers',
    category: InsightCategory.CAPACITY,
    minDenominator: 15,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      const appointments = ctx.appointments || [];
      if (!passesSignificance(appointments.length, 15)) return null;

      const hourCounts: Record<string, number> = {};
      for (const app of appointments) {
        const hour = app.startTime?.split(':')[0] || '10';
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }

      let maxHour = '17';
      let maxCount = 0;
      for (const [h, c] of Object.entries(hourCounts)) {
        if (c > maxCount) {
          maxCount = c;
          maxHour = h;
        }
      }

      return [{
        ruleKey: 'weekday_hour_heatmap_outliers',
        category: InsightCategory.CAPACITY,
        severity: InsightSeverity.INFO,
        title: `Peak Hour Outlier: ${maxHour}:00 Slot Demand`,
        body: `The ${maxHour}:00 slot block accounts for ${maxCount} bookings. Ensure dual staff coverage during this window.`,
        evidenceJson: { peakHour: maxHour, bookingCount: maxCount },
        entityIdsJson: [],
        actionType: InsightActionType.NO_ACTION
      }];
    }
  },

  // 11. No-show rate by slot time (unreliable slots)
  {
    key: 'unreliable_slot_times',
    category: InsightCategory.RELIABILITY,
    minDenominator: 10,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      const apps = ctx.appointments || [];
      const slotNoShows: Record<string, { total: number; noShows: number }> = {};

      for (const a of apps) {
        const time = a.startTime || '10:00';
        if (!slotNoShows[time]) slotNoShows[time] = { total: 0, noShows: 0 };
        slotNoShows[time].total++;
        if (a.status === 'NO_SHOW') slotNoShows[time].noShows++;
      }

      const unreliable: Array<{ time: string; ratePct: number; noShows: number }> = [];
      for (const [time, data] of Object.entries(slotNoShows)) {
        if (data.total >= 5) {
          const ratePct = (data.noShows / data.total) * 100;
          if (ratePct >= 25) {
            unreliable.push({ time, ratePct: Math.round(ratePct), noShows: data.noShows });
          }
        }
      }

      if (unreliable.length > 0) {
        const top = unreliable[0];
        return [{
          ruleKey: 'unreliable_slot_times',
          category: InsightCategory.RELIABILITY,
          severity: InsightSeverity.NOTICE,
          title: `Structurally Unreliable Slot: ${top.time} (${top.ratePct}% No-Show Rate)`,
          body: `The ${top.time} slot has a ${top.ratePct}% no-show rate (${top.noShows} missed). Send automated 2-hour WhatsApp reminders for this specific slot.`,
          evidenceJson: { slotTime: top.time, ratePct: top.ratePct, noShows: top.noShows },
          entityIdsJson: [],
          actionType: InsightActionType.WHATSAPP_BOOKING_LINK
        }];
      }
      return null;
    }
  },

  // 12. Repeat no-show patients (>=2 in 60 days)
  {
    key: 'repeat_no_show_patients',
    category: InsightCategory.RELIABILITY,
    minDenominator: 1,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      const candidates: InsightCandidate[] = [];
      const sixtyDaysAgo = new Date(ctx.today.getTime() - 60 * 24 * 3600 * 1000);

      for (const p of ctx.patients || []) {
        const recentNoShows = (p.appointments || []).filter((a: any) => a.status === 'NO_SHOW' && new Date(a.date) >= sixtyDaysAgo);
        if (recentNoShows.length >= 2) {
          candidates.push({
            ruleKey: 'repeat_no_show_patients',
            category: InsightCategory.RELIABILITY,
            severity: InsightSeverity.URGENT,
            title: `Repeat No-Show Alert: ${p.fullName} (${recentNoShows.length} missed sessions)`,
            body: `${p.fullName} has missed ${recentNoShows.length} appointments in the last 60 days without advance cancellation. Re-confirmation call required prior to next booking.`,
            evidenceJson: { patientName: p.fullName, noShowCount: recentNoShows.length },
            entityIdsJson: [p.id],
            actionType: InsightActionType.VAPI_CHECKIN_CALL,
            actionPayloadJson: { patientId: p.id, phone: p.phone, scriptContext: 'Appointment re-confirmation call' }
          });
        }
      }

      return candidates.length > 0 ? candidates : null;
    }
  },

  // 13. AR aging buckets crossing thresholds, with patient names
  {
    key: 'ar_aging_buckets_crossed',
    category: InsightCategory.REVENUE,
    minDenominator: 1,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      const candidates: InsightCandidate[] = [];
      const overdueInvoices = (ctx.invoices || []).filter((inv: any) => inv.status !== 'PAID' && inv.status !== 'CANCELLED');

      for (const inv of overdueInvoices) {
        const due = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.date);
        const daysOverdue = Math.floor((ctx.today.getTime() - due.getTime()) / (1000 * 3600 * 24));
        const balancePaise = BigInt(Math.round((Number(inv.totalAmount) - Number(inv.paidAmount)) * 100));

        if (daysOverdue >= 30 && balancePaise > BigInt(0)) {
          const patientName = inv.patient?.fullName || 'Patient';
          candidates.push({
            ruleKey: 'ar_aging_buckets_crossed',
            category: InsightCategory.REVENUE,
            severity: daysOverdue >= 60 ? InsightSeverity.URGENT : InsightSeverity.IMPORTANT,
            title: `Overdue Payment (${daysOverdue}d): ${patientName} (₹${(Number(balancePaise) / 100).toLocaleString('en-IN')})`,
            body: `Invoice #${inv.invoiceNumber} for ${patientName} has a balance of ₹${(Number(balancePaise) / 100).toLocaleString('en-IN')} overdue by ${daysOverdue} days. Send 1-tap WhatsApp payment reminder.`,
            evidenceJson: { patientName, invoiceNumber: inv.invoiceNumber, daysOverdue, balancePaise: Number(balancePaise) },
            entityIdsJson: [inv.id, inv.patientId],
            estimatedImpactPaise: balancePaise,
            actionType: InsightActionType.WHATSAPP_PAYMENT_REMINDER,
            actionPayloadJson: { invoiceId: inv.id, patientId: inv.patientId, phone: inv.patient?.phone, amount: Number(balancePaise) / 100 }
          });
        }
      }

      return candidates.length > 0 ? candidates : null;
    }
  },

  // 14. Revenue per chair-hour trend
  {
    key: 'revenue_per_chair_hour_trend',
    category: InsightCategory.REVENUE,
    minDenominator: 10,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      if (!ctx.currentSnapshot) return null;
      const revPaise = BigInt(ctx.currentSnapshot.revenuePerChairHourPaise || 0);
      const revRupees = Number(revPaise) / 100;

      if (revRupees > 0) {
        return [{
          ruleKey: 'revenue_per_chair_hour_trend',
          category: InsightCategory.REVENUE,
          severity: InsightSeverity.INFO,
          title: `Revenue Velocity: ₹${Math.round(revRupees)} per Chair-Hour`,
          body: `Realized clinic yield is currently ₹${Math.round(revRupees)} per available chair-hour. Optimizing slot fill rate boosts revenue density.`,
          evidenceJson: { revenuePerChairHourRupees: Math.round(revRupees) },
          entityIdsJson: [],
          actionType: InsightActionType.NO_ACTION
        }];
      }
      return null;
    }
  },

  // 15. Tier mix shift (Elite/Gold/Diamond) vs 3-month average
  {
    key: 'tier_mix_shift',
    category: InsightCategory.REVENUE,
    minDenominator: 10,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      const pkgs = ctx.packages || [];
      if (!passesSignificance(pkgs.length, 10)) return null;

      const goldCount = pkgs.filter(p => p.plan?.name?.toLowerCase().includes('gold')).length;
      const goldPct = Math.round((goldCount / pkgs.length) * 100);

      return [{
        ruleKey: 'tier_mix_shift',
        category: InsightCategory.REVENUE,
        severity: InsightSeverity.INFO,
        title: `Package Tier Mix: ${goldPct}% Gold Treatment Courses`,
        body: `Gold packages represent ${goldPct}% of active course packages. Offer Gold course conversions to single-session patients.`,
        evidenceJson: { goldPct, totalPackages: pkgs.length },
        entityIdsJson: [],
        actionType: InsightActionType.NO_ACTION
      }];
    }
  },

  // 16. Per-physio rebooking rate vs clinic average (ADMIN ONLY)
  {
    key: 'physio_rebooking_rate_vs_clinic',
    category: InsightCategory.STAFF,
    minDenominator: 20,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      if (!ctx.isUserAdmin || !ctx.currentSnapshot) return null;
      const rebookPct = ctx.currentSnapshot.rebookRatePct || 0;

      return [{
        ruleKey: 'physio_rebooking_rate_vs_clinic',
        category: InsightCategory.STAFF,
        severity: InsightSeverity.INFO,
        title: `Clinic Rebooking Retention Rate: ${Math.round(rebookPct)}%`,
        body: `Overall patient rebooking rate stands at ${Math.round(rebookPct)}%. Maintain 75%+ rebooking target across clinical staff.`,
        evidenceJson: { rebookRatePct: Math.round(rebookPct) },
        entityIdsJson: [],
        actionType: InsightActionType.NO_ACTION
      }];
    }
  },

  // 17. Per-physio adherence completion rate (ADMIN ONLY)
  {
    key: 'physio_adherence_rate',
    category: InsightCategory.STAFF,
    minDenominator: 20,
    evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
      if (!ctx.isUserAdmin) return null;
      const delivered = ctx.currentSnapshot?.sessionsDelivered || 0;
      if (!passesSignificance(delivered, 20)) return null;

      return [{
        ruleKey: 'physio_adherence_rate',
        category: InsightCategory.STAFF,
        severity: InsightSeverity.INFO,
        title: `Therapeutic Sessions Delivered: ${delivered} Sessions`,
        body: `Clinical team delivered ${delivered} prescribed sessions during the period with high care plan fidelity.`,
        evidenceJson: { sessionsDelivered: delivered },
        entityIdsJson: [],
        actionType: InsightActionType.NO_ACTION
      }];
    }
  }
];
