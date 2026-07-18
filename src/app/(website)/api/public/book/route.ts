import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';
import { AppointmentStatus, AppointmentSource } from '../../appointments/route';

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

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = publicBookingSchema.parse(json);

    // 1. Fetch Clinic Settings
    const { data: settings } = await supabase
      .from('ClinicSettings')
      .select('*')
      .eq('id', 'clinic_settings')
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Clinic configurations not found.' }, { status: 500 });
    }

    if (!settings.isPubliclyVisible) {
      return NextResponse.json({ error: 'The clinic is temporarily offline for public bookings.' }, { status: 403 });
    }

    // 2. Validate against blockdates/holidays
    const holidaysList = settings.holidays 
      ? settings.holidays.split(',').map((h: string) => h.trim()).filter(Boolean) 
      : [];

    if (holidaysList.includes(body.date)) {
      return NextResponse.json({ error: 'Selected date is a holiday/blocked date.' }, { status: 400 });
    }

    // 3. Validate against working hours
    const { startTime, date } = body;
    if (startTime < settings.workingHoursStart || startTime >= settings.workingHoursEnd) {
      return NextResponse.json({
        error: `Appointments can only be scheduled between ${settings.workingHoursStart} and ${settings.workingHoursEnd}.`,
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
    const { data: existingAppointment } = await supabase
      .from('Appointment')
      .select('id')
      .eq('date', bookingDate.toISOString())
      .eq('startTime', startTime)
      .in('status', [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING, AppointmentStatus.IN_PROGRESS])
      .limit(1)
      .maybeSingle();

    if (existingAppointment) {
      return NextResponse.json({ error: 'This time slot is already booked.' }, { status: 400 });
    }

    // 5. Patient Lookup or Create
    let { data: patient } = await supabase
      .from('Patient')
      .select('*')
      .eq('phone', body.phone)
      .limit(1)
      .maybeSingle();

    if (!patient) {
      const { data: newPatient } = await supabase
        .from('Patient')
        .insert({
          fullName: body.fullName,
          phone: body.phone,
          gender: body.gender,
          dateOfBirth: body.dateOfBirth?.toISOString(),
          presentingComplaint: 'Booked via Website. Modality assigned at intake.',
          tags: 'website-lead',
        })
        .select()
        .single();
        
      patient = newPatient;
    }

    // Calculate end time based on settings or default 30 mins
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = minutes + settings.slotDuration;
    const endHours = hours + Math.floor(endMinutes / 60);
    const finalMinutes = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;

    // 6. Create the Appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('Appointment')
      .insert({
        patientId: patient.id,
        date: bookingDate.toISOString(),
        startTime,
        endTime,
        treatmentType: body.treatmentType,
        assignedSlotDuration: settings.slotDuration,
        source: AppointmentSource.WEBSITE,
        notes: body.notes || 'Inbound online web booking.',
      })
      .select()
      .single();
      
    if (appointmentError || !appointment) {
        throw appointmentError;
    }

    // Create Notification
    await supabase.from('Notification').insert({
      title: 'New Web Booking',
      message: `${patient.fullName} booked ${body.treatmentType} on ${body.date} @ ${startTime}.`,
      type: 'BOOKING',
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
