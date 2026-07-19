import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
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
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('q') || '';

  try {
    const patients = await prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search } }, // Case insensitive by default in SQLite
              { phone: { contains: search } },
            ],
          }
        : {},
      include: {
        appointments: {
          orderBy: { date: 'desc' },
        },
        sessionPackages: true,
      },
      orderBy: {
        fullName: 'asc',
      },
      take: 50,
    });

    const parsedPatients = patients.map((p) => ({
      ...p,
      tags: p.tags ? p.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    }));

    return NextResponse.json(parsedPatients);
  } catch (error: any) {
    console.error('Error fetching patients:', error);
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
    const body = createPatientSchema.parse(json);

    const patient = await prisma.patient.create({
      data: {
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
      },
    });

    const parsedPatient = {
      ...patient,
      tags: patient.tags ? patient.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
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
