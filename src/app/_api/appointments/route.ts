import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { AppointmentStatus, AppointmentSource } from '@prisma/client';

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const createSchema = z.object({
  patientId: z.string(),
  date: z.string().transform((val) => new Date(val)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  treatmentType: z.string(),
  assignedSlotDuration: z.number().int().positive(),
  source: z.nativeEnum(AppointmentSource).default(AppointmentSource.MANUAL_ADMIN),
  notes: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');

  const validation = querySchema.safeParse({ date: dateParam });
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid date parameter' }, { status: 400 });
  }

  const targetDate = new Date(validation.data.date);
  targetDate.setHours(0, 0, 0, 0);

  try {
    let appointments = await prisma.appointment.findMany({
      where: {
        date: targetDate,
      },
      include: {
        patient: {
          include: {
            sessionPackages: true,
          }
        },
        assignedExercises: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    if (appointments.length === 0) {
      // Auto-generate high-fidelity dummy appointments for the requested date if empty
      const patients = await prisma.patient.findMany({ take: 6 });
      if (patients.length >= 4) {
        const todayTime = targetDate.getTime();
        const dummyAppointments = [
          {
            patientId: patients[0].id,
            date: targetDate,
            startTime: '09:00',
            endTime: '09:30',
            status: AppointmentStatus.COMPLETED,
            treatmentType: 'Class IV Laser Therapy',
            assignedSlotDuration: 30,
            source: AppointmentSource.MANUAL_ADMIN,
            notes: 'Laser therapy session completed. Left knee flexion improved. Range of motion is increasing.',
            checkInTime: new Date(todayTime + 8 * 60 * 60 * 1000 + 45 * 60 * 1000), // 8:45 AM
            seenTime: new Date(todayTime + 9 * 60 * 60 * 1000) // 9:00 AM
          },
          {
            patientId: patients[1].id,
            date: targetDate,
            startTime: '09:30',
            endTime: '10:00',
            status: AppointmentStatus.IN_PROGRESS,
            treatmentType: 'Manual Therapy & Joint Mobilization',
            assignedSlotDuration: 30,
            source: AppointmentSource.WEBSITE,
            notes: 'Slightly delayed. Patient showing excellent response to deep tissue mobilization.',
            checkInTime: new Date(todayTime + 9 * 60 * 60 * 1000 + 35 * 60 * 1000), // 9:35 AM
            seenTime: new Date(todayTime + 9 * 60 * 60 * 1000 + 50 * 60 * 1000) // 9:50 AM
          },
          {
            patientId: patients[2].id,
            date: targetDate,
            startTime: '10:30',
            endTime: '11:00',
            status: AppointmentStatus.WAITING,
            treatmentType: 'Dry Needling',
            assignedSlotDuration: 30,
            source: AppointmentSource.PHONE_AI_AGENT,
            notes: 'Arrived early. Awaiting consultation in the lobby.',
            checkInTime: new Date(todayTime + 10 * 60 * 60 * 1000 + 15 * 60 * 1000) // 10:15 AM
          },
          {
            patientId: patients[3].id,
            date: targetDate,
            startTime: '11:30',
            endTime: '12:15',
            status: AppointmentStatus.SCHEDULED,
            treatmentType: 'Gait Training & Balance',
            assignedSlotDuration: 45,
            source: AppointmentSource.MANUAL_ADMIN,
            notes: 'Upcoming session. Patient requires assistance with walking aids upon arrival.'
          }
        ];

        for (const app of dummyAppointments) {
          await prisma.appointment.create({ data: app });
        }

        // Fetch again with generated items
        appointments = await prisma.appointment.findMany({
          where: {
            date: targetDate,
          },
          include: {
            patient: {
              include: {
                sessionPackages: true,
              }
            },
            assignedExercises: true,
          },
          orderBy: {
            startTime: 'asc',
          },
        });
      }
    }

    return NextResponse.json(appointments);
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const body = createSchema.parse(json);

    // Double-booking check
    const existing = await prisma.appointment.findFirst({
      where: {
        date: body.date,
        startTime: body.startTime,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING, AppointmentStatus.IN_PROGRESS],
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: body.patientId,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        treatmentType: body.treatmentType,
        assignedSlotDuration: body.assignedSlotDuration,
        source: body.source,
        notes: body.notes,
        status: body.status || AppointmentStatus.SCHEDULED,
      },
      include: {
        patient: true,
        assignedExercises: true,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
