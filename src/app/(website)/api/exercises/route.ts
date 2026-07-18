import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const assignSchema = z.object({
  appointmentId: z.string(),
  name: z.string(),
  sets: z.string(),
  reps: z.string(),
  holdTime: z.string(),
  frequency: z.string(),
});

export async function GET(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: templates, error } = await supabase
      .from('ExerciseTemplate')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }
    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Error fetching exercise templates:', error);
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
    
    // Check if we are assigning to an appointment or creating a template
    if (json.appointmentId) {
      const body = assignSchema.parse(json);
      const { data: assigned, error: assignError } = await supabase
        .from('AssignedExercise')
        .insert({
          appointmentId: body.appointmentId,
          name: body.name,
          sets: body.sets,
          reps: body.reps,
          holdTime: body.holdTime,
          frequency: body.frequency,
        })
        .select()
        .single();

      if (assignError) throw assignError;
      return NextResponse.json(assigned, { status: 201 });
    }

    // Creating a template instead
    const templateSchema = z.object({
      name: z.string().min(1),
      defaultSets: z.string().optional(),
      defaultReps: z.string().optional(),
      defaultHoldTime: z.string().optional(),
      defaultFrequency: z.string().optional(),
    });

    const body = templateSchema.parse(json);
    const { data: template, error: templateError } = await supabase
      .from('ExerciseTemplate')
      .insert({
        name: body.name,
        defaultSets: body.defaultSets || '3',
        defaultReps: body.defaultReps || '10',
        defaultHoldTime: body.defaultHoldTime || '5s',
        defaultFrequency: body.defaultFrequency || 'Once daily',
      })
      .select()
      .single();

    if (templateError) throw templateError;

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Schema validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Error in exercises endpoint:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
