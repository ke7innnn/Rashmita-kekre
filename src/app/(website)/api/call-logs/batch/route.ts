import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CallDirection, CallOutcome } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { patientIds, reason } = await req.json();

    if (!Array.isArray(patientIds) || patientIds.length === 0) {
      return NextResponse.json({ error: 'No patients specified' }, { status: 400 });
    }

    // Fetch patient details
    const patients = await prisma.patient.findMany({
      where: {
        id: { in: patientIds },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        treatmentModalityAssigned: true,
      },
    });

    if (patients.length === 0) {
      return NextResponse.json({ error: 'Patients not found' }, { status: 404 });
    }

    const note = reason || 'Transferred to Outbound Call Queue from Patient Directory';

    // Create call logs in bulk
    const createdLogs = await Promise.all(
      patients.map(p =>
        prisma.callLog.create({
          data: {
            patientId: p.id,
            direction: CallDirection.OUTBOUND,
            phoneNumber: p.phone,
            duration: 0,
            summary: `${note} for ${p.fullName} (${p.treatmentModalityAssigned || 'General Consultation'}).`,
            transcript: `[System] Patient ${p.fullName} (${p.phone}) queued for outbound telecalling.`,
            outcome: CallOutcome.FOLLOW_UP_NEEDED,
            followUpActioned: false,
          },
        })
      )
    );

    // Also trigger notification for clinic staff
    await prisma.notification.create({
      data: {
        title: 'Call List Updated',
        message: `${createdLogs.length} patient(s) transferred to the outbound call list.`,
        type: 'CALL_FOLLOWUP',
      },
    });

    return NextResponse.json({
      success: true,
      count: createdLogs.length,
      callLogs: createdLogs,
    });
  } catch (error: any) {
    console.error('Error batch transferring patients to call list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
