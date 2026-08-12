import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';
import { validateAssessmentOutput } from '@/lib/assessments/clinicalValidator';

export async function GET(req: NextRequest) {
  const { errorResponse, user } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const physioId = searchParams.get('physioId');

    const isAdmin = (user as any)?.role === 'ADMIN' || (user as any)?.role === 'admin';
    const currentUserId = (user as any)?.id || (user as any)?.username;

    // RBAC: All authorized staff & physio employees can view digital assessments
    const where: any = {};
    if (patientId) where.patientId = patientId;
    if (physioId) where.physioId = physioId;

    const assessments = await prisma.assessment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, fullName: true, dateOfBirth: true, gender: true, phone: true }
        },
        referralSource: true,
        romMeasurements: { orderBy: { sortOrder: 'asc' } },
        specialTestResults: true,
        goals: true,
        amendments: true,
      },
      orderBy: { assessmentDate: 'desc' }
    });

    // Write audit log row
    await prisma.assessmentAuditLog.create({
      data: {
        userId: currentUserId || 'system',
        action: `VIEW_ASSESSMENTS_LIST${patientId ? `_PATIENT_${patientId}` : ''}`,
      }
    });

    return NextResponse.json(assessments);
  } catch (error: any) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse, user } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const currentUserId = (user as any)?.id || (user as any)?.username || 'admin';

    const {
      patientId,
      type = 'INITIAL',
      status = 'DRAFT',
      parentAssessmentId,
      occupation,
      occupationCategory,
      referralSourceId,
      provisionalDiagnosis,
      chiefComplaint,
      onset,
      onsetDate,
      daysSinceOnset,
      mechanismOfInjury,
      painSiteRegions,
      painTypes,
      vasRest,
      vasActivity,
      vasBest,
      vasWorst,
      aggravatingFactors,
      easingFactors,
      diurnalVariation,
      pmh,
      investigations,
      redFlagWeightLoss = false,
      redFlagBowelBladder = false,
      redFlagSaddleAnaesthesia = false,
      redFlagNightPain = false,
      redFlagAcknowledgedAt,
      redFlagDecisionNote,
      posture,
      postureNotes,
      gait,
      gaitNotes,
      localInspection,
      tendernessGrade,
      tendernessSiteRegions,
      spasm = false,
      spasmSite,
      dermatomesState,
      dermatomesLevels,
      myotomesJson,
      reflexesJson,
      functionalLimitations,
      ptDiagnosis,
      prognosis,
      narrativeJson,
      scalesJson,
      consentCapturedAt,
      romMeasurements = [],
      specialTestResults = [],
      goals = [],
    } = body;

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const hasPositiveRedFlag = Boolean(
      redFlagWeightLoss || redFlagBowelBladder || redFlagSaddleAnaesthesia || redFlagNightPain
    );

    // RED FLAG SAFETY INTERLOCK VALIDATION
    if (hasPositiveRedFlag && (status === 'COMPLETED' || status === 'SIGNED')) {
      if (!redFlagAcknowledgedAt || !redFlagDecisionNote || !redFlagDecisionNote.trim()) {
        return NextResponse.json(
          {
            error: 'Red flag response recorded. Document your clinical decision note before completing this assessment.',
            interlockTriggered: true
          },
          { status: 400 }
        );
      }
    }

    // CLINICAL BOUNDARY VALIDATOR
    const validationResult = validateAssessmentOutput(
      `${ptDiagnosis || ''} ${narrativeJson || ''} ${redFlagDecisionNote || ''}`
    );

    if (!validationResult.isValid) {
      return NextResponse.json({ error: validationResult.errorMessage }, { status: 400 });
    }

    const isSigned = status === 'SIGNED';

    const newAssessment = await prisma.assessment.create({
      data: {
        patientId,
        physioId: currentUserId,
        type,
        status,
        parentAssessmentId,
        occupation,
        occupationCategory,
        referralSourceId,
        provisionalDiagnosis,
        chiefComplaint,
        onset,
        onsetDate: onsetDate ? new Date(onsetDate) : null,
        daysSinceOnset,
        mechanismOfInjury,
        painSiteRegions: typeof painSiteRegions === 'object' ? JSON.stringify(painSiteRegions) : painSiteRegions,
        painTypes: typeof painTypes === 'object' ? JSON.stringify(painTypes) : painTypes,
        vasRest: vasRest !== undefined ? Number(vasRest) : null,
        vasActivity: vasActivity !== undefined ? Number(vasActivity) : null,
        vasBest: vasBest !== undefined ? Number(vasBest) : null,
        vasWorst: vasWorst !== undefined ? Number(vasWorst) : null,
        aggravatingFactors,
        easingFactors,
        diurnalVariation,
        pmh: typeof pmh === 'object' ? JSON.stringify(pmh) : pmh,
        investigations: typeof investigations === 'object' ? JSON.stringify(investigations) : investigations,
        redFlagWeightLoss,
        redFlagBowelBladder,
        redFlagSaddleAnaesthesia,
        redFlagNightPain,
        redFlagAcknowledgedAt: redFlagAcknowledgedAt ? new Date(redFlagAcknowledgedAt) : null,
        redFlagDecisionNote,
        redFlagAcknowledgedByUserId: hasPositiveRedFlag ? currentUserId : null,
        posture,
        postureNotes,
        gait,
        gaitNotes,
        localInspection: typeof localInspection === 'object' ? JSON.stringify(localInspection) : localInspection,
        tendernessGrade,
        tendernessSiteRegions: typeof tendernessSiteRegions === 'object' ? JSON.stringify(tendernessSiteRegions) : tendernessSiteRegions,
        spasm,
        spasmSite,
        dermatomesState,
        dermatomesLevels,
        myotomesJson: typeof myotomesJson === 'object' ? JSON.stringify(myotomesJson) : myotomesJson,
        reflexesJson: typeof reflexesJson === 'object' ? JSON.stringify(reflexesJson) : reflexesJson,
        functionalLimitations: typeof functionalLimitations === 'object' ? JSON.stringify(functionalLimitations) : functionalLimitations,
        ptDiagnosis,
        prognosis,
        narrativeJson,
        scalesJson: typeof scalesJson === 'object' ? JSON.stringify(scalesJson) : scalesJson,
        consentCapturedAt: consentCapturedAt ? new Date(consentCapturedAt) : new Date(),
        signedAt: isSigned ? new Date() : null,
        signedByUserId: isSigned ? currentUserId : null,

        // Child repeating tables
        romMeasurements: {
          create: romMeasurements.map((r: any, idx: number) => ({
            region: r.region,
            movement: r.movement,
            aromRight: r.aromRight !== undefined ? Number(r.aromRight) : null,
            aromLeft: r.aromLeft !== undefined ? Number(r.aromLeft) : null,
            promRight: r.promRight !== undefined ? Number(r.promRight) : null,
            promLeft: r.promLeft !== undefined ? Number(r.promLeft) : null,
            mmtRight: r.mmtRight !== undefined ? Number(r.mmtRight) : null,
            mmtLeft: r.mmtLeft !== undefined ? Number(r.mmtLeft) : null,
            painOnMovement: Boolean(r.painOnMovement),
            sortOrder: idx,
          }))
        },
        specialTestResults: {
          create: specialTestResults.map((t: any) => ({
            testId: t.testId || null,
            testName: t.testName,
            side: t.side || 'BILATERAL',
            result: t.result || 'NOT_TESTED',
            note: t.note || null,
          }))
        },
        goals: {
          create: goals.map((g: any) => ({
            horizon: g.horizon || 'SHORT',
            text: g.text,
            metricKey: g.metricKey || null,
            baselineValue: g.baselineValue || null,
            targetValue: g.targetValue || null,
            targetDate: g.targetDate ? new Date(g.targetDate) : new Date(Date.now() + (g.horizon === 'LONG' ? 42 : 14) * 24 * 3600 * 1000),
            status: g.status || 'OPEN',
          }))
        }
      },
      include: {
        romMeasurements: true,
        specialTestResults: true,
        goals: true,
      }
    });

    // Write audit log row
    await prisma.assessmentAuditLog.create({
      data: {
        assessmentId: newAssessment.id,
        userId: currentUserId,
        action: `CREATE_ASSESSMENT_${status}`,
      }
    });

    return NextResponse.json(newAssessment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assessment:', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}
