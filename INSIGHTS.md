# Health 360 CRM: Insights & Coaching Layer Documentation

## 1. System Architecture

The Insights & Coaching Layer provides operational intelligence for Dr. Rashmita Karvir Kekre's clinic through two distinct surfaces:
1. **Weekly Action Queue** (`/crm360/insights`): A 6–8 item work list prioritizing patients, capacity slots, and accounts receivable with 1-tap dispatches.
2. **Monthly Review** (`/crm360/insights/monthly/[period]`): Reflective 4-block report (What Changed, What's Working, 3 Specific Improvement Tips, and Follow-Up On Last Month's Tips).

### Pipeline Flow

```
Nightly Cron / Trigger
  └─► MetricSnapshot Aggregator (Daily clinic grain)
  └─► RuleEngine (Pure TypeScript, 17 deterministic rules)
  └─► Statistical Significance Guardrail (Denominator ≥ 20)
  └─► Severity & Revenue Ranker (Sorts by Severity × Estimated ₹ Impact)
  └─► Clinical Boundary Validator (Ensures AI never alters medical directives)
  └─► Insight & MonthlyReview Models (Persisted with status tracking)
```

---

## 2. Statistical Guardrails & Thresholds

- **Small-Sample Guardrail**: Denominator minimum threshold $N \ge 20$. Any percentage-change rule or drop-off analysis evaluating fewer than 20 events is suppressed to prevent false positive noise.
- **Clinical Boundary Rule**: Strict validator enforcing zero medical or treatment directives (no dosage, exercise progression, modality, or diagnostic changes). Re-engagement is framed purely as operational patient contact.
- **Monetary Figures**: Stored in paise as `BigInt`/`Int` and formatted to INR (₹) at presentation time.

---

## 3. Rule Catalogue (17 Rules)

| Key | Category | Severity | Threshold / Condition | Default Action |
| :--- | :--- | :--- | :--- | :--- |
| `package_expiring_with_sessions_left` | PACKAGE | URGENT / IMPORTANT | $\le 10$ days left & $\ge 2$ sessions unused | `WHATSAPP_BOOKING_LINK` |
| `package_burn_rate_mismatch` | PACKAGE | NOTICE | $>60\%$ time elapsed with $<40\%$ sessions used | `WHATSAPP_BOOKING_LINK` |
| `deferred_revenue_liability_trending_up` | REVENUE | NOTICE | Deferred revenue liability increased $>20\%$ MoM | `NO_ACTION` |
| `patients_stalled_session_3_to_5` | ADHERENCE | IMPORTANT | Stalled at session 3–5 with no visit in $>30$ days | `VAPI_CHECKIN_CALL` |
| `clinic_specific_dropoff_point` | ADHERENCE | INFO | Modal drop-off session identified ($N \ge 20$) | `NO_ACTION` |
| `lapsed_patients_segmented` | RETENTION | IMPORTANT | Lapsed 30/60 days with incomplete care plan | `VAPI_CHECKIN_CALL` |
| `discharge_conversation_due` | RETENTION | INFO | $\ge 10$ sessions completed → maintenance due | `MARK_FOR_DISCHARGE_REVIEW` |
| `underutilized_slot_blocks` | CAPACITY | NOTICE | Chair utilization $<40\%$ ($N \ge 20$) | `NO_ACTION` |
| `capacity_ceiling_slot_blocks` | CAPACITY | IMPORTANT | Chair utilization $\ge 85\%$ | `OFFER_SLOT_TO_WAITLIST` |
| `weekday_hour_heatmap_outliers` | CAPACITY | INFO | Peak booking hour outlier detected | `NO_ACTION` |
| `unreliable_slot_times` | RELIABILITY | NOTICE | No-show rate $\ge 25\%$ on slot time ($N \ge 5$) | `WHATSAPP_BOOKING_LINK` |
| `repeat_no_show_patients` | RELIABILITY | URGENT | $\ge 2$ no-shows in last 60 days | `VAPI_CHECKIN_CALL` |
| `ar_aging_buckets_crossed` | REVENUE | URGENT / IMPORTANT | Outstanding balance overdue by $\ge 30$ days | `WHATSAPP_PAYMENT_REMINDER` |
| `revenue_per_chair_hour_trend` | REVENUE | INFO | Revenue velocity per available chair-hour | `NO_ACTION` |
| `tierMixShift` | REVENUE | INFO | Gold package distribution mix percentage | `NO_ACTION` |
| `physio_rebooking_rate_vs_clinic` | STAFF | INFO | Clinic-wide rebooking retention rate (Admin only) | `NO_ACTION` |
| `physio_adherence_rate` | STAFF | INFO | Total prescribed sessions delivered (Admin only) | `NO_ACTION` |

---

## 4. How to Add Rule 18

To add a new rule (e.g., `rule_18_new_patient_onboarding_check`):

1. **Open** `src/lib/insights/rules/index.ts`.
2. **Add a new `InsightRule` object** to the `allRules` array:

```ts
{
  key: 'new_patient_onboarding_check',
  category: InsightCategory.RETENTION,
  minDenominator: 1,
  evaluate: (ctx: RuleContext): InsightCandidate[] | null => {
    const candidates: InsightCandidate[] = [];
    const newPatients = (ctx.patients || []).filter(p => {
      const days = (ctx.today.getTime() - new Date(p.intakeDate).getTime()) / (1000 * 3600 * 24);
      return days <= 7 && (p.appointments || []).length <= 1;
    });

    for (const p of newPatients) {
      candidates.push({
        ruleKey: 'new_patient_onboarding_check',
        category: InsightCategory.RETENTION,
        severity: InsightSeverity.NOTICE,
        title: `Onboarding Check: ${p.fullName}`,
        body: `${p.fullName} registered this week but has only booked 1 session. Schedule a follow-up booking link.`,
        evidenceJson: { patientName: p.fullName, intakeDate: p.intakeDate },
        entityIdsJson: [p.id],
        actionType: InsightActionType.WHATSAPP_BOOKING_LINK,
        actionPayloadJson: { patientId: p.id, phone: p.phone }
      });
    }

    return candidates.length > 0 ? candidates : null;
  }
}
```

3. **Verify** type safety and rule execution by running `npx tsc --noEmit`.
