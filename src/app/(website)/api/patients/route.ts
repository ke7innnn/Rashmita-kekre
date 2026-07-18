import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const createPatientSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z.string().transform((val) => new Date(val)),
  phone: z.string().min(10, 'Primary contact must be a valid number'),
  secondaryPhone: z.string().optional(),
  address: z.string().optional(),
  referringDoctor: z.string().optional(),
  presentingComplaint: z.string().optional(),
  treatmentModalityAssigned: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q') || '';

  try {
    let query = supabase
      .from('Patient')
      .select('*, appointments:Appointment(*), sessionPackages:SessionPackage(*)')
      .order('fullName', { ascending: true })
      .limit(50);

    if (search) {
      query = query.or(`fullName.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: patients, error } = await query;

    if (error) {
      console.error('Supabase error fetching patients:', error);
      throw error;
    }

    const parsedPatients = (patients || []).map((p: any) => ({
      ...p,
      appointments: p.appointments?.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [],
      tags: p.tags ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    }));

    return NextResponse.json(parsedPatients);
  } catch (error: any) {
    console.error('Error fetching patients:', error);
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
    const body = createPatientSchema.parse(json);

    const { data: patient, error: supabaseError } = await supabase
      .from('Patient')
      .insert({
        fullName: body.fullName,
        gender: body.gender,
        dateOfBirth: body.dateOfBirth,
        phone: body.phone,
        secondaryPhone: body.secondaryPhone,
        address: body.address,
        referringDoctor: body.referringDoctor,
        presentingComplaint: body.presentingComplaint,
        treatmentModalityAssigned: body.treatmentModalityAssigned,
        tags: body.tags.join(', '),
        notes: body.notes,
      })
      .select()
      .single();

    if (supabaseError) {
      console.error('Supabase error creating patient:', supabaseError);
      throw supabaseError;
    }

    const parsedPatient = {
      ...patient,
      tags: patient.tags ? patient.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    };

    return NextResponse.json(parsedPatient, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
