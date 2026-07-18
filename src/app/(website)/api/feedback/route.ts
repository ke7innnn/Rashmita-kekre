import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const feedbackSchema = z.object({
  appointmentId: z.string(),
  patientId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = feedbackSchema.parse(json);

    // Verify appointment exists
    const { data: app } = await supabase
      .from('Appointment')
      .select('id')
      .eq('id', body.appointmentId)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Save feedback
    const { data: feedback, error } = await supabase
      .from('Feedback')
      .insert({
        appointmentId: body.appointmentId,
        patientId: body.patientId,
        rating: body.rating,
        comment: body.comment,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(feedback, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid schema validation', details: error.issues }, { status: 400 });
    }
    console.error('Error logging feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
