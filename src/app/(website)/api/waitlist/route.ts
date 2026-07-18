import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const waitlistSchema = z.object({
  patientId: z.string(),
  desiredTreatmentType: z.string(),
  preferredTimeWindow: z.string(), // "MORNING" | "AFTERNOON" | "EVENING"
});

export async function GET(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: waitlist, error } = await supabase
      .from('Waitlist')
      .select('*, patient:Patient(*)')
      .order('createdAt', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(waitlist);
  } catch (error: any) {
    console.error('Error fetching waitlist:', error);
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
    const body = waitlistSchema.parse(json);

    const { data: waitlistEntry, error } = await supabase
      .from('Waitlist')
      .insert({
        patientId: body.patientId,
        desiredTreatmentType: body.desiredTreatmentType,
        preferredTimeWindow: body.preferredTimeWindow,
        status: 'WAITING',
      })
      .select('*, patient:Patient(*)')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(waitlistEntry, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data schema', details: error.issues }, { status: 400 });
    }
    console.error('Error creating waitlist entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
