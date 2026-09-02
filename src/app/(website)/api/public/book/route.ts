import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { AppointmentStatus, AppointmentSource } from '@prisma/client';
import { sendWhatsAppMessageDirect } from '@/lib/whatsappTemplates';

const publicBookingSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  gender: z.string().optional().default('Female'),
  dateOfBirth: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return new Date('1990-01-01');
    if (val instanceof Date) return val;
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date('1990-01-01') : d;
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format'),
  treatmentType: z.string().min(1, 'Treatment type is required'),
  presentingComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  otp: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    if (!dateStr) {
      return NextResponse.json({ bookedSlots: [], isHoliday: false });
    }

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const settings = await prisma.clinicSettings.findUnique({
      where: { id: 'clinic_settings' },
    });

    const holidaysList = settings?.holidays 
      ? settings.holidays.split(',').map((h) => h.trim()).filter(Boolean) 
      : [];

    const targetDate = new Date(dateStr + 'T00:00:00');
    const isSunday = targetDate.getDay() === 0;
    const isHoliday = isSunday || holidaysList.includes(dateStr);

    const maxConcurrent = settings?.maxConcurrentPatientsPerSlot || 2;

    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED],
        },
      },
      select: {
        startTime: true,
        endTime: true,
        assignedSlotDuration: true,
      },
    });

    const toMinutes = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number);
      return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    };
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);

    const slotCounts: Record<string, number> = {};
    appointments.forEach((a) => {
      if (!a.startTime) return;
      const startMin = toMinutes(a.startTime);
      const duration = a.assignedSlotDuration || 15;
      const calculatedEndMin = startMin + duration;
      const endMin = a.endTime ? Math.max(toMinutes(a.endTime), calculatedEndMin) : calculatedEndMin;

      for (let t = startMin; t < endMin; t += 15) {
        const timeStr = `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
        slotCounts[timeStr] = (slotCounts[timeStr] || 0) + 1;
      }
    });

    const bookedSlots = Object.keys(slotCounts).filter((time) => slotCounts[time] >= maxConcurrent);

    return NextResponse.json({ bookedSlots, isHoliday, isSunday, maxConcurrent });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    return NextResponse.json({ bookedSlots: [], isHoliday: false, isSunday: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = publicBookingSchema.parse(json);

    // Normalize phone to last 10 digits (strip +91, 91, spaces etc)
    body.phone = body.phone.replace(/\D/g, '').slice(-10);

    // Verify OTP if provided
    if (body.otp) {
      const validOtp = await prisma.otpRequest.findFirst({
        where: {
          phone: body.phone,
          otp: body.otp,
          expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!validOtp) {
        return NextResponse.json({ error: 'Invalid or expired OTP. Please try again.' }, { status: 400 });
      }
    }

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

    // 4. Capacity check against maxConcurrentPatientsPerSlot (Default 2)
    const maxCapacity = settings.maxConcurrentPatientsPerSlot || 2;
    const existingCount = await prisma.appointment.count({
      where: {
        date: bookingDate,
        startTime,
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING, AppointmentStatus.IN_PROGRESS, AppointmentStatus.COMPLETED],
        },
      },
    });

    if (existingCount >= maxCapacity) {
      return NextResponse.json({ error: `This time slot is fully booked (${existingCount}/${maxCapacity} capacity reached).` }, { status: 400 });
    }

    // 5. Patient Lookup or Create
    let patient = await prisma.patient.findFirst({
      where: { phone: body.phone },
    });

    const isNewPatient = !patient;
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          fullName: body.fullName,
          phone: body.phone,
          gender: body.gender || 'Female',
          dateOfBirth: body.dateOfBirth,
          presentingComplaint: body.presentingComplaint || body.treatmentType || 'Booked via Website.',
          diagnosis: body.diagnosis || body.presentingComplaint || '',
          tags: 'website-lead',
        },
      });
    }

    // Calculate end time based on settings or default 15 mins
    const slotDuration = settings?.slotDuration || 15;
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = minutes + slotDuration;
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
        assignedSlotDuration: slotDuration,
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

    // Send Automatic WhatsApp Confirmation to Patient
    try {
      const dateFormatted = new Date(bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const [h, m] = startTime.split(':');
      const hour = parseInt(h, 10);
      const timeFormatted = `${hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
      const firstName = patient.fullName?.split(' ')[0] || patient.fullName;

      // 1. Online Appointment Booking Confirmation (uses verified next_appointment_reminder)
      const res = await sendWhatsAppMessageDirect({
        phone: patient.phone,
        templateName: 'next_appointment_reminder',
        params: [firstName, dateFormatted, timeFormatted],
      });

      if (!res?.success) {
        await sendWhatsAppMessageDirect({
          phone: patient.phone,
          templateName: 'appointment_booking_confirmation',
          params: [firstName, dateFormatted, timeFormatted],
        });
      }
    } catch (waErr) {
      console.warn('Failed to dispatch automated WhatsApp confirmation:', waErr);
    }

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
