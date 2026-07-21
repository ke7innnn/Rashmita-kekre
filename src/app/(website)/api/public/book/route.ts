import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { AppointmentStatus, AppointmentSource } from '@prisma/client';

const publicBookingSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  gender: z.string().default('Female'), // Default gender if not provided
  dateOfBirth: z.string().optional().transform((val) => (val ? new Date(val) : new Date('1990-01-01'))),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  treatmentType: z.string().min(1, 'Treatment type is required'),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    if (!dateStr) {
      return NextResponse.json({ bookedSlots: [], isHoliday: false });
    }

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const settings = await prisma.clinicSettings.findUnique({
      where: { id: 'clinic_settings' },
    });

    const holidaysList = settings?.holidays 
      ? settings.holidays.split(',').map((h) => h.trim()).filter(Boolean) 
      : [];

    const isSunday = targetDate.getDay() === 0;
    const isHoliday = isSunday || holidaysList.includes(dateStr);

    const appointments = await prisma.appointment.findMany({
      where: {
        date: targetDate,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED],
        },
      },
      select: {
        startTime: true,
      },
    });

    const bookedSlots = appointments.map((a) => a.startTime);

    return NextResponse.json({ bookedSlots, isHoliday, isSunday });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    return NextResponse.json({ bookedSlots: [], isHoliday: false, isSunday: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = publicBookingSchema.parse(json);

    // 1. Fetch Clinic Settings
    const settings = await prisma.clinicSettings.findUnique({
      where: { id: 'clinic_settings' },
    });

    if (!settings) {
      return NextResponse.json({ error: 'Clinic configurations not found.' }, { status: 500 });
    }

    if (!settings.isPubliclyVisible) {
      return NextResponse.json({ error: 'The clinic is temporarily offline for public bookings.' }, { status: 403 });
    }

    // 2. Validate against blockdates/holidays
    const holidaysList = settings.holidays 
      ? settings.holidays.split(',').map((h) => h.trim()).filter(Boolean) 
      : [];

    if (holidaysList.includes(body.date)) {
      return NextResponse.json({ error: 'Selected date is a holiday/blocked date.' }, { status: 400 });
    }

    // 3. Validate against working hours (Allow slots from 09:00 up to 21:00)
    const { startTime, date } = body;
    if (startTime < '09:00' || startTime >= '21:00') {
      return NextResponse.json({
        error: `Appointments can only be scheduled between 09:00 AM and 09:00 PM.`,
      }, { status: 400 });
    }

    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (bookingDate < now) {
      return NextResponse.json({ error: 'Cannot book appointments in the past.' }, { status: 400 });
    }

    // 4. Double booking check
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        date: bookingDate,
        startTime,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING, AppointmentStatus.IN_PROGRESS],
        },
      },
    });

    if (existingAppointment) {
      return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 400 });
    }

    // 5. Patient Lookup or Create
    let patient = await prisma.patient.findFirst({
      where: { phone: body.phone },
    });

    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          fullName: body.fullName,
          phone: body.phone,
          gender: body.gender,
          dateOfBirth: body.dateOfBirth,
          presentingComplaint: 'Booked via Website. Modality assigned at intake.',
          tags: 'website-lead',
        },
      });
    }

    // Calculate end time based on settings or default 30 mins
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = minutes + settings.slotDuration;
    const endHours = hours + Math.floor(endMinutes / 60);
    const finalMinutes = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;

    // 6. Create the Appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        date: bookingDate,
        startTime,
        endTime,
        treatmentType: body.treatmentType,
        assignedSlotDuration: settings.slotDuration,
        source: AppointmentSource.WEBSITE,
        notes: body.notes || 'Inbound online web booking.',
      },
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        title: 'New Web Booking',
        message: `${patient.fullName} booked ${body.treatmentType} on ${body.date} @ ${startTime}.`,
        type: 'BOOKING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully.',
      booking: {
        id: appointment.id,
        patientName: patient.fullName,
        date: body.date,
        time: startTime,
        treatmentType: appointment.treatmentType,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data format.', details: error.issues }, { status: 400 });
    }
    console.error('Error handling public booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
