import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { CallDirection, CallOutcome, AppointmentStatus, AppointmentSource } from '@prisma/client';

const webhookSchema = z.object({
  patientId: z.string().optional(),
  direction: z.nativeEnum(CallDirection),
  phoneNumber: z.string(),
  duration: z.number().int().nonnegative(),
  transcript: z.string().optional(),
  summary: z.string().optional(),
  outcome: z.nativeEnum(CallOutcome),
  recordingUrl: z.string().optional(),
  timestamp: z.string().transform((val) => (val ? new Date(val) : undefined)).optional(),
  actionDetails: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    treatmentType: z.string().optional(),
    fullName: z.string().optional(),
  }).optional(),
});

export async function GET(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const followUpOnly = searchParams.get('followUpOnly') === 'true';

  try {
    const whereClause: any = {};
    if (followUpOnly) {
      whereClause.outcome = CallOutcome.FOLLOW_UP_NEEDED;
      whereClause.followUpActioned = false;
    }
    if (q) {
      whereClause.OR = [
        { phoneNumber: { contains: q } },
        { summary: { contains: q } }, // Case insensitive by default in SQLite
        { transcript: { contains: q } },
        {
          patient: {
            fullName: { contains: q },
          },
        },
      ];
    }

    const callLogs = await prisma.callLog.findMany({
      where: whereClause,
      include: {
        patient: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    const parsedLogs = callLogs.map((log) => {
      if (log.patient) {
        return {
          ...log,
          patient: {
            ...log.patient,
            tags: log.patient.tags ? log.patient.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          },
        };
      }
      return log;
    });

    return NextResponse.json(parsedLogs);
  } catch (error: any) {
    console.error('Error fetching call logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  let isWebhook = false;
  
  if (!session) {
    const authHeader = req.headers.get('x-api-key');
    const expectedKey = process.env.AI_AGENT_WEBHOOK_SECRET;
    if (expectedKey && authHeader !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized webhook' }, { status: 401 });
    }
    isWebhook = true;
  }

  try {
    const json = await req.json();
    const body = webhookSchema.parse(json);

    // 1. Resolve Patient
    let patient = null;
    if (body.patientId) {
      patient = await prisma.patient.findUnique({
        where: { id: body.patientId },
      });
    } else {
      patient = await prisma.patient.findFirst({
        where: { phone: body.phoneNumber },
      });
    }

    // If new caller and agent has details, register patient
    if (!patient && body.actionDetails?.fullName) {
      patient = await prisma.patient.create({
        data: {
          fullName: body.actionDetails.fullName,
          phone: body.phoneNumber,
          gender: 'Female', // Default placeholder
          dateOfBirth: new Date('1990-01-01'),
          presentingComplaint: 'Created via AI Phone Agent Call.',
          tags: 'ai-agent-lead',
        },
      });
    }

    // 2. Log Call
    const callLog = await prisma.callLog.create({
      data: {
        patientId: patient ? patient.id : null,
        direction: body.direction,
        phoneNumber: body.phoneNumber,
        duration: body.duration,
        transcript: body.transcript,
        summary: body.summary,
        outcome: body.outcome,
        recordingUrl: body.recordingUrl,
        timestamp: body.timestamp || new Date(),
      },
    });

    if (body.outcome === CallOutcome.FOLLOW_UP_NEEDED) {
      await prisma.notification.create({
        data: {
          title: 'Rebooking Call Alert',
          message: `${patient ? patient.fullName : body.phoneNumber} flagged for outbound follow-up.`,
          type: 'CALL_FOLLOWUP',
        },
      });
    }

    // 3. Process actions (Booking, Rescheduling, Cancelling)
    if (patient && body.actionDetails && body.actionDetails.date && body.actionDetails.startTime) {
      const { date, startTime, treatmentType } = body.actionDetails;
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const settings = await prisma.clinicSettings.findUnique({
        where: { id: 'clinic_settings' },
      });
      const slotDuration = settings?.slotDuration || 30;

      // Calculate end time
      const [hours, minutes] = startTime.split(':').map(Number);
      const endMinutes = minutes + slotDuration;
      const endHours = hours + Math.floor(endMinutes / 60);
      const finalMinutes = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;

      if (body.outcome === CallOutcome.BOOKED) {
        // Book appointment
        await prisma.appointment.create({
          data: {
            patientId: patient.id,
            date: targetDate,
            startTime,
            endTime,
            treatmentType: treatmentType || 'Physiotherapy Evaluation',
            assignedSlotDuration: slotDuration,
            source: AppointmentSource.PHONE_AI_AGENT,
            notes: body.summary || 'Booked via AI Voice Agent.',
          },
        });
      } else if (body.outcome === CallOutcome.CANCELLED) {
        // Cancel existing appointments on that day/time
        await prisma.appointment.updateMany({
          where: {
            patientId: patient.id,
            date: targetDate,
            startTime,
          },
          data: {
            status: AppointmentStatus.CANCELLED,
            notes: `Cancelled via AI Voice Agent: ${body.summary}`,
          },
        });
      } else if (body.outcome === CallOutcome.RESCHEDULED) {
        // Cancel outstanding on that day, and schedule new one
        await prisma.appointment.updateMany({
          where: {
            patientId: patient.id,
            status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING] },
          },
          data: {
            status: AppointmentStatus.CANCELLED,
            notes: `Cancelled for rescheduling via AI Voice Agent: ${body.summary}`,
          },
        });

        await prisma.appointment.create({
          data: {
            patientId: patient.id,
            date: targetDate,
            startTime,
            endTime,
            treatmentType: treatmentType || 'Physiotherapy Evaluation',
            assignedSlotDuration: slotDuration,
            source: AppointmentSource.PHONE_AI_AGENT,
            notes: body.summary || 'Rescheduled via AI Voice Agent.',
          },
        });
      }
    }

    return NextResponse.json({ success: true, callLogId: callLog.id });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid webhook payload', details: error.issues }, { status: 400 });
    }
    console.error('Error logging webhook call:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
