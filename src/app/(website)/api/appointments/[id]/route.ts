import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { AppointmentStatus } from '../route';

const patchSchema = z.object({
  status: z.nativeEnum(AppointmentStatus).optional(),
  notes: z.string().optional(),
  treatmentType: z.string().optional(),
  checkInTime: z.string().transform((val) => (val ? new Date(val) : undefined)).optional(),
  seenTime: z.string().transform((val) => (val ? new Date(val) : undefined)).optional(),
  date: z.string().transform((val) => (val ? new Date(val) : undefined)).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: appointment, error } = await supabase
      .from('Appointment')
      .select('*, patient:Patient(*, sessionPackages:SessionPackage(*)), assignedExercises:AssignedExercise(*)')
      .eq('id', id)
      .single();

    if (error || !appointment) {
      console.error('Supabase error fetching appointment:', error);
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await req.json();
    const body = patchSchema.parse(json);

    const { data: existing, error: existingError } = await supabase
      .from('Appointment')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (body.notes !== undefined) dataToUpdate.notes = body.notes;
    if (body.treatmentType !== undefined) dataToUpdate.treatmentType = body.treatmentType;
    if (body.date !== undefined) dataToUpdate.date = body.date?.toISOString();
    if (body.startTime !== undefined) dataToUpdate.startTime = body.startTime;
    if (body.endTime !== undefined) dataToUpdate.endTime = body.endTime;
    
    if (body.status !== undefined) {
      dataToUpdate.status = body.status;

      // Handle check-in and seen time tracking for Wait Time calculation
      if (body.status === AppointmentStatus.WAITING && !existing.checkInTime) {
        dataToUpdate.checkInTime = new Date().toISOString();
      } else if (body.status === AppointmentStatus.IN_PROGRESS && !existing.seenTime) {
        dataToUpdate.seenTime = new Date().toISOString();
      }

      // Track session package usage
      if (body.status === AppointmentStatus.COMPLETED && existing.status !== AppointmentStatus.COMPLETED) {
        const { data: activePkg } = await supabase
          .from('SessionPackage')
          .select('*')
          .eq('patientId', existing.patientId)
          .lt('sessionsUsed', 100)
          .limit(1)
          .maybeSingle();
          
        if (activePkg && activePkg.sessionsUsed < activePkg.totalSessions) {
          await supabase
            .from('SessionPackage')
            .update({ sessionsUsed: activePkg.sessionsUsed + 1 })
            .eq('id', activePkg.id);
        }
      } else if (existing.status === AppointmentStatus.COMPLETED && body.status !== AppointmentStatus.COMPLETED) {
        const { data: activePkg } = await supabase
          .from('SessionPackage')
          .select('*')
          .eq('patientId', existing.patientId)
          .gt('sessionsUsed', 0)
          .limit(1)
          .maybeSingle();
          
        if (activePkg) {
          await supabase
            .from('SessionPackage')
            .update({ sessionsUsed: Math.max(0, activePkg.sessionsUsed - 1) })
            .eq('id', activePkg.id);
        }
      }

      // Log Cancellation Notification
      if (body.status === AppointmentStatus.CANCELLED && existing.status !== AppointmentStatus.CANCELLED) {
        const { data: p } = await supabase.from('Patient').select('fullName').eq('id', existing.patientId).single();
        await supabase.from('Notification').insert({
          title: 'Appointment Cancelled',
          message: `${p?.fullName || 'Patient'} cancelled their ${existing.treatmentType} session.`,
          type: 'CANCELLATION',
        });
      }
    }

    if (body.checkInTime !== undefined) dataToUpdate.checkInTime = body.checkInTime?.toISOString();
    if (body.seenTime !== undefined) dataToUpdate.seenTime = body.seenTime?.toISOString();

    const { data: updated, error: updateError } = await supabase
      .from('Appointment')
      .update(dataToUpdate)
      .eq('id', id)
      .select('*, patient:Patient(*, sessionPackages:SessionPackage(*)), assignedExercises:AssignedExercise(*)')
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: existing, error } = await supabase
      .from('Appointment')
      .select('id')
      .eq('id', id)
      .single();

    if (error || !existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('Appointment')
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
