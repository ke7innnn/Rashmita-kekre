import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';
import { validateAssessmentOutput } from '@/lib/assessments/clinicalValidator';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const currentUserId = (user as any)?.id || (user as any)?.username;
    const isAdmin = (user as any)?.role === 'ADMIN' || (user as any)?.role === 'admin';

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        patient: true,
        referralSource: true,
        romMeasurements: { orderBy: { sortOrder: 'asc' } },
        specialTestResults: true,
        goals: true,
        amendments: true,
        parentAssessment: {
          include: {
            romMeasurements: true,
            specialTestResults: true,
            goals: true,
          }
        }
      }
    });

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // RBAC: PHYSIO role can only view their assigned patients' assessments
    if (!isAdmin && currentUserId && assessment.physioId !== currentUserId) {
      if (assessment.patient?.assignedProtocolId !== currentUserId) {
        return NextResponse.json({ error: 'Forbidden: Access restricted to assigned physio' }, { status: 403 });
      }
    }

    // Record audit log
    await prisma.assessmentAuditLog.create({
      data: {
        assessmentId: id,
        userId: currentUserId || 'system',
        action: 'VIEW_ASSESSMENT_DETAIL',
      }
    });

    return NextResponse.json(assessment);
  } catch (error: any) {
    console.error('Error fetching assessment detail:', error);
    return NextResponse.json({ error: 'Failed to fetch assessment detail' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const currentUserId = (user as any)?.id || (user as any)?.username || 'admin';

    const existing = await prisma.assessment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // IMMUTABILITY RULE: SIGNED assessment cannot be directly edited via PUT; must use amendment
    if (existing.status === 'SIGNED' || existing.status === 'AMENDED') {
      return NextResponse.json(
        { error: 'Signed assessments are immutable. Use amendment flow to submit corrections.' },
        { status: 400 }
      );
    }

    const {
      status = existing.status,
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
      redFlagWeightLoss,
      redFlagBowelBladder,
      redFlagSaddleAnaesthesia,
      redFlagNightPain,
      redFlagAcknowledgedAt,
      redFlagDecisionNote,
      posture,
      postureNotes,
      gait,
      gaitNotes,
      localInspection,
      tendernessGrade,
      tendernessSiteRegions,
      spasm,
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
      romMeasurements = [],
      specialTestResults = [],
      goals = [],
    } = body;

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

    const isSigningNow = (status as string) === 'SIGNED' && (existing.status as string) !== 'SIGNED';

    // Delete existing child measurements for clean sync
    await prisma.romMeasurement.deleteMany({ where: { assessmentId: id } });
    await prisma.specialTestResult.deleteMany({ where: { assessmentId: id } });
    await prisma.assessmentGoal.deleteMany({ where: { assessmentId: id } });

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        status,
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
        signedAt: isSigningNow ? new Date() : existing.signedAt,
        signedByUserId: isSigningNow ? currentUserId : existing.signedByUserId,

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

    // Record audit log
    await prisma.assessmentAuditLog.create({
      data: {
        assessmentId: id,
        userId: currentUserId,
        action: `UPDATE_ASSESSMENT_${status}`,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating assessment:', error);
    return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Action endpoint for submitting an AssessmentAmendment on a SIGNED assessment
  const { errorResponse, user } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { reason, changesJson } = body;
    const currentUserId = (user as any)?.id || (user as any)?.username || 'admin';

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Reason is required for assessment amendment' }, { status: 400 });
    }

    const assessment = await prisma.assessment.findUnique({ where: { id } });
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const amendment = await prisma.assessmentAmendment.create({
      data: {
        assessmentId: id,
        userId: currentUserId,
        reason,
        changesJson: typeof changesJson === 'object' ? JSON.stringify(changesJson) : changesJson || '{}',
      }
    });

    await prisma.assessment.update({
      where: { id },
      data: { status: 'AMENDED' }
    });

    // Record audit log
    await prisma.assessmentAuditLog.create({
      data: {
        assessmentId: id,
        userId: currentUserId,
        action: 'AMEND_ASSESSMENT',
      }
    });

    return NextResponse.json({ success: true, amendment });
  } catch (error: any) {
    console.error('Error adding assessment amendment:', error);
    return NextResponse.json({ error: 'Failed to add assessment amendment' }, { status: 500 });
  }
}
