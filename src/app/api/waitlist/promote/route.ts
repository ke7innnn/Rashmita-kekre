import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { AppointmentSource, AppointmentStatus } from '@prisma/client';

const promoteSchema = z.object({
  waitlistId: z.string(),
  date: z.string().transform((val) => new Date(val)),
  startTime: z.string(),
  endTime: z.string(),
  treatmentType: z.string(),
  assignedSlotDuration: z.number().int().default(30),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const body = promoteSchema.parse(json);

    // 1. Get waitlist entry
    const entry = await prisma.waitlist.findUnique({
      where: { id: body.waitlistId },
      include: { patient: true },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 });
    }

    // 2. Create appointment for the patient
    const appointment = await prisma.appointment.create({
      data: {
        patientId: entry.patientId,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        treatmentType: body.treatmentType,
        assignedSlotDuration: body.assignedSlotDuration,
        status: AppointmentStatus.SCHEDULED,
        source: AppointmentSource.MANUAL_ADMIN,
        notes: `Auto-promoted from Waitlist. Entry ID: ${entry.id}`,
      },
    });

    // 3. Mark waitlist entry as FILLED
    await prisma.waitlist.update({
      where: { id: body.waitlistId },
      data: { status: 'FILLED' },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid promotion schema', details: error.issues }, { status: 400 });
    }
    console.error('Error promoting waitlist patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
