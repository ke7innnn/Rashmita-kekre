import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { AppointmentStatus, AppointmentSource, AppointmentType } from '@prisma/client';
import { sendWhatsAppMessageDirect } from '@/lib/whatsappTemplates';

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const createSchema = z.object({
  patientId: z.string(),
  date: z.string().transform((val) => new Date(val)),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  treatmentType: z.string().default('Physiotherapy Consultation'),
  appointmentType: z.nativeEnum(AppointmentType).optional(),
  assignedSlotDuration: z.number().int().positive().default(15),
  source: z.nativeEnum(AppointmentSource).default(AppointmentSource.MANUAL_ADMIN),
  notes: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  isRecurring: z.boolean().optional().default(false),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY']).optional().default('WEEKLY'),
  totalOccurrences: z.number().int().min(1).max(30).optional().default(1),
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

  const dateStr = validation.data.date;
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  try {
    let appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
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

    const occurrences = body.isRecurring ? body.totalOccurrences : 1;
    const createdAppointments = [];

    for (let i = 0; i < occurrences; i++) {
      const occurrenceDate = new Date(body.date);
      if (body.isRecurring && i > 0) {
        if (body.frequency === 'DAILY') {
          occurrenceDate.setDate(occurrenceDate.getDate() + i);
        } else if (body.frequency === 'WEEKLY') {
          occurrenceDate.setDate(occurrenceDate.getDate() + (i * 7));
        } else if (body.frequency === 'BIWEEKLY') {
          occurrenceDate.setDate(occurrenceDate.getDate() + (i * 14));
        }
      }

      // Check double-booking for occurrence date
      const existing = await prisma.appointment.findFirst({
        where: {
          date: occurrenceDate,
          startTime: body.startTime,
          status: {
            in: [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING, AppointmentStatus.IN_PROGRESS],
          },
        },
      });

      if (existing && !body.isRecurring) {
        return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 400 });
      }

      if (!existing) {
        const appointment = await prisma.appointment.create({
          data: {
            patientId: body.patientId,
            date: occurrenceDate,
            startTime: body.startTime,
            endTime: body.endTime,
            treatmentType: body.treatmentType || 'Physiotherapy Consultation',
            appointmentType: body.appointmentType,
            assignedSlotDuration: body.assignedSlotDuration,
            source: body.source,
            notes: body.notes ? (body.isRecurring ? `[Recurring Session ${i + 1}/${occurrences}] ${body.notes}` : body.notes) : (body.isRecurring ? `[Recurring Session ${i + 1}/${occurrences}]` : undefined),
            status: body.status || AppointmentStatus.SCHEDULED,
          },
          include: {
            patient: true,
            assignedExercises: true,
          },
        });
        createdAppointments.push(appointment);

        // Auto-send WhatsApp Next Appointment Confirmation
        if (appointment.patient?.phone) {
          try {
            const dateFormatted = new Date(occurrenceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const [h, m] = body.startTime.split(':');
            const hour = parseInt(h, 10);
            const timeFormatted = `${hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
            const firstName = appointment.patient.fullName?.split(' ')[0] || appointment.patient.fullName;

            await sendWhatsAppMessageDirect({
              phone: appointment.patient.phone,
              templateName: 'next_appointment_reminder',
              params: [firstName, dateFormatted, timeFormatted],
            });
          } catch (waErr) {
            console.warn('Failed to dispatch CRM automated WhatsApp appointment reminder:', waErr);
          }
        }
      }
    }

    return NextResponse.json(createdAppointments.length === 1 ? createdAppointments[0] : createdAppointments, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
