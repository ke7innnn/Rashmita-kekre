import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { AppointmentStatus, AppointmentSource } from '../appointments/route';

export enum CallDirection {
  INBOUND = "INBOUND",
  OUTBOUND = "OUTBOUND"
}

export enum CallOutcome {
  BOOKED = "BOOKED",
  RESCHEDULED = "RESCHEDULED",
  CANCELLED = "CANCELLED",
  QUERY_RESOLVED = "QUERY_RESOLVED",
  FOLLOW_UP_NEEDED = "FOLLOW_UP_NEEDED",
  VOICEMAIL = "VOICEMAIL",
  NO_ANSWER = "NO_ANSWER"
}

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
    let query = supabase.from('CallLog').select('*, patient:Patient(*)').order('timestamp', { ascending: false });

    if (followUpOnly) {
      query = query.eq('outcome', CallOutcome.FOLLOW_UP_NEEDED).eq('followUpActioned', false);
    }
    if (q) {
      query = query.or(`phoneNumber.ilike.%${q}%,summary.ilike.%${q}%,transcript.ilike.%${q}%`);
    }

    const { data: callLogs, error } = await query;
    if (error) throw error;

    const parsedLogs = callLogs.map((log) => {
      if (log.patient) {
        return {
          ...log,
          patient: {
            ...log.patient,
            tags: log.patient.tags ? log.patient.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
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
      const { data: p } = await supabase.from('Patient').select('*').eq('id', body.patientId).single();
      patient = p;
    } else {
      const { data: p } = await supabase.from('Patient').select('*').eq('phone', body.phoneNumber).limit(1).maybeSingle();
      patient = p;
    }

    // If new caller and agent has details, register patient
    if (!patient && body.actionDetails?.fullName) {
      const { data: p } = await supabase.from('Patient').insert({
        fullName: body.actionDetails.fullName,
        phone: body.phoneNumber,
        gender: 'Female', // Default placeholder
        dateOfBirth: new Date('1990-01-01').toISOString(),
        presentingComplaint: 'Created via AI Phone Agent Call.',
        tags: 'ai-agent-lead',
      }).select().single();
      patient = p;
    }

    // 2. Log Call
    const { data: callLog, error: callLogError } = await supabase.from('CallLog').insert({
      patientId: patient ? patient.id : null,
      direction: body.direction,
      phoneNumber: body.phoneNumber,
      duration: body.duration,
      transcript: body.transcript,
      summary: body.summary,
      outcome: body.outcome,
      recordingUrl: body.recordingUrl,
      timestamp: (body.timestamp || new Date()).toISOString(),
    }).select('id').single();

    if (callLogError || !callLog) throw callLogError;

    if (body.outcome === CallOutcome.FOLLOW_UP_NEEDED) {
      await supabase.from('Notification').insert({
        title: 'Rebooking Call Alert',
        message: `${patient ? patient.fullName : body.phoneNumber} flagged for outbound follow-up.`,
        type: 'CALL_FOLLOWUP',
      });
    }

    // 3. Process actions (Booking, Rescheduling, Cancelling)
    if (patient && body.actionDetails && body.actionDetails.date && body.actionDetails.startTime) {
      const { date, startTime, treatmentType } = body.actionDetails;
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const { data: settings } = await supabase.from('ClinicSettings').select('*').eq('id', 'clinic_settings').single();
      const slotDuration = settings?.slotDuration || 30;

      // Calculate end time
      const [hours, minutes] = startTime.split(':').map(Number);
      const endMinutes = minutes + slotDuration;
      const endHours = hours + Math.floor(endMinutes / 60);
      const finalMinutes = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;

      if (body.outcome === CallOutcome.BOOKED) {
        // Book appointment
        await supabase.from('Appointment').insert({
          patientId: patient.id,
          date: targetDate.toISOString(),
          startTime,
          endTime,
          treatmentType: treatmentType || 'Physiotherapy Evaluation',
          assignedSlotDuration: slotDuration,
          source: AppointmentSource.PHONE_AI_AGENT,
          notes: body.summary || 'Booked via AI Voice Agent.',
        });
      } else if (body.outcome === CallOutcome.CANCELLED) {
        // Cancel existing appointments on that day/time
        await supabase.from('Appointment').update({
          status: AppointmentStatus.CANCELLED,
          notes: `Cancelled via AI Voice Agent: ${body.summary}`,
        })
        .eq('patientId', patient.id)
        .eq('date', targetDate.toISOString())
        .eq('startTime', startTime);
      } else if (body.outcome === CallOutcome.RESCHEDULED) {
        // Cancel outstanding on that day, and schedule new one
        await supabase.from('Appointment').update({
          status: AppointmentStatus.CANCELLED,
          notes: `Cancelled for rescheduling via AI Voice Agent: ${body.summary}`,
        })
        .eq('patientId', patient.id)
        .in('status', [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING]);

        await supabase.from('Appointment').insert({
          patientId: patient.id,
          date: targetDate.toISOString(),
          startTime,
          endTime,
          treatmentType: treatmentType || 'Physiotherapy Evaluation',
          assignedSlotDuration: slotDuration,
          source: AppointmentSource.PHONE_AI_AGENT,
          notes: body.summary || 'Rescheduled via AI Voice Agent.',
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
