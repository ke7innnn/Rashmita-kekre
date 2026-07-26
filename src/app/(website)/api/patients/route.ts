import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createPatientSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required'),
  gender: z.string().default('Female'),
  dateOfBirth: z.union([z.string(), z.date()]).optional().transform((val) => {
    if (!val) return new Date('1990-01-01');
    if (val instanceof Date) return val;
    if (typeof val === 'string' && val.includes('/')) {
      const parts = val.split('/');
      if (parts.length === 3) {
        const [p1, p2, yr] = parts.map(p => p.trim());
        if (yr && yr.length === 4) {
          const parsed = new Date(`${yr}-${p2.padStart(2, '0')}-${p1.padStart(2, '0')}`);
          if (!isNaN(parsed.getTime())) return parsed;
        }
      }
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date('1990-01-01') : d;
  }),
  phone: z.string().trim().min(5, 'Contact number is required').transform(v => v.replace(/[^\d+]/g, '')),
  secondaryPhone: z.string().optional(),
  address: z.string().optional(),
  referringDoctor: z.string().optional(),
  presentingComplaint: z.string().optional(),
  treatmentModalityAssigned: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
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
              { fullName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
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

    const dataToCreate: any = {
      fullName: body.fullName,
      gender: body.gender || 'Female',
      dateOfBirth: body.dateOfBirth || new Date('1990-01-01'),
      phone: body.phone,
      tags: Array.isArray(body.tags) ? body.tags.join(', ') : '',
    };

    if (body.secondaryPhone) dataToCreate.secondaryPhone = body.secondaryPhone;
    if (body.address) dataToCreate.address = body.address;
    if (body.referringDoctor) dataToCreate.referringDoctor = body.referringDoctor;
    if (body.presentingComplaint) dataToCreate.presentingComplaint = body.presentingComplaint;
    if (body.treatmentModalityAssigned) dataToCreate.treatmentModalityAssigned = body.treatmentModalityAssigned;
    if (body.notes) dataToCreate.notes = body.notes;

    const patient = await prisma.patient.create({
      data: dataToCreate,
    });

    const parsedPatient = {
      ...patient,
      tags: patient.tags ? patient.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };

    return NextResponse.json(parsedPatient, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const issueMsg = error.issues[0]?.message || 'Invalid request data';
      return NextResponse.json({ error: issueMsg, details: error.issues }, { status: 400 });
    }

    console.error('Error creating patient:', {
      code: error?.code,
      meta: error?.meta,
      message: error?.message,
    });

    if (error?.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A patient with this number already exists' 
      }, { status: 400 });
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const responseMsg = isDev 
      ? (error?.message || 'Failed to create patient record')
      : 'Failed to create patient record';

    return NextResponse.json({ error: responseMsg }, { status: 400 });
  }
}
