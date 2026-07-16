import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

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
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            sessionPackages: true,
          }
        },
        assignedExercises: true,
      },
    });

    if (!appointment) {
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

    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (body.notes !== undefined) dataToUpdate.notes = body.notes;
    if (body.treatmentType !== undefined) dataToUpdate.treatmentType = body.treatmentType;
    if (body.date !== undefined) dataToUpdate.date = body.date;
    if (body.startTime !== undefined) dataToUpdate.startTime = body.startTime;
    if (body.endTime !== undefined) dataToUpdate.endTime = body.endTime;
    
    if (body.status !== undefined) {
      dataToUpdate.status = body.status;

      // Handle check-in and seen time tracking for Wait Time calculation
      if (body.status === AppointmentStatus.WAITING && !existing.checkInTime) {
        dataToUpdate.checkInTime = new Date();
      } else if (body.status === AppointmentStatus.IN_PROGRESS && !existing.seenTime) {
        dataToUpdate.seenTime = new Date();
      }

      // Track session package usage
      if (body.status === AppointmentStatus.COMPLETED && existing.status !== AppointmentStatus.COMPLETED) {
        const activePkg = await prisma.sessionPackage.findFirst({
          where: { patientId: existing.patientId, sessionsUsed: { lt: 100 } }, // simple threshold limit
        });
        if (activePkg && activePkg.sessionsUsed < activePkg.totalSessions) {
          await prisma.sessionPackage.update({
            where: { id: activePkg.id },
            data: { sessionsUsed: activePkg.sessionsUsed + 1 },
          });
        }
      } else if (existing.status === AppointmentStatus.COMPLETED && body.status !== AppointmentStatus.COMPLETED) {
        const activePkg = await prisma.sessionPackage.findFirst({
          where: { patientId: existing.patientId, sessionsUsed: { gt: 0 } },
        });
        if (activePkg) {
          await prisma.sessionPackage.update({
            where: { id: activePkg.id },
            data: { sessionsUsed: Math.max(0, activePkg.sessionsUsed - 1) },
          });
        }
      }

      // Log Cancellation Notification
      if (body.status === AppointmentStatus.CANCELLED && existing.status !== AppointmentStatus.CANCELLED) {
        const p = await prisma.patient.findUnique({ where: { id: existing.patientId } });
        await prisma.notification.create({
          data: {
            title: 'Appointment Cancelled',
            message: `${p?.fullName || 'Patient'} cancelled their ${existing.treatmentType} session.`,
            type: 'CANCELLATION',
          },
        });
      }
    }

    if (body.checkInTime !== undefined) dataToUpdate.checkInTime = body.checkInTime;
    if (body.seenTime !== undefined) dataToUpdate.seenTime = body.seenTime;

    const updated = await prisma.appointment.update({
      where: { id },
      data: dataToUpdate,
      include: {
        patient: {
          include: {
            sessionPackages: true,
          }
        },
        assignedExercises: true,
      },
    });

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
    const existing = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
