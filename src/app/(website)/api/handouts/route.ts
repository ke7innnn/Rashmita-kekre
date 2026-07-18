import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const shareSchema = z.object({
  patientId: z.string(),
  handoutId: z.string(),
  sentVia: z.string().default('whatsapp'),
});

export async function GET(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: handouts, error } = await supabase
      .from('Handout')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      throw error;
    }
    return NextResponse.json(handouts);
  } catch (error: any) {
    console.error('Error fetching handouts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const body = shareSchema.parse(json);

    // Verify patient and handout exist
    const { data: patientExists } = await supabase.from('Patient').select('id').eq('id', body.patientId).single();
    const { data: handoutExists } = await supabase.from('Handout').select('id').eq('id', body.handoutId).single();

    if (!patientExists || !handoutExists) {
      return NextResponse.json({ error: 'Patient or Handout not found' }, { status: 404 });
    }

    const { data: logEntry, error } = await supabase
      .from('SentHandout')
      .insert({
        patientId: body.patientId,
        handoutId: body.handoutId,
        sentVia: body.sentVia,
      })
      .select('*, handout:Handout(*)')
      .single();

    if (error) throw error;

    return NextResponse.json(logEntry, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid share payload', details: error.issues }, { status: 400 });
    }
    console.error('Error sharing handout:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
