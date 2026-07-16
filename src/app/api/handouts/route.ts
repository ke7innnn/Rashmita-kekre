import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
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
    const handouts = await prisma.handout.findMany({
      orderBy: { title: 'asc' },
    });
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
    const patientExists = await prisma.patient.findUnique({ where: { id: body.patientId } });
    const handoutExists = await prisma.handout.findUnique({ where: { id: body.handoutId } });

    if (!patientExists || !handoutExists) {
      return NextResponse.json({ error: 'Patient or Handout not found' }, { status: 404 });
    }

    const logEntry = await prisma.sentHandout.create({
      data: {
        patientId: body.patientId,
        handoutId: body.handoutId,
        sentVia: body.sentVia,
      },
      include: {
        handout: true,
      },
    });

    return NextResponse.json(logEntry, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid share payload', details: error.issues }, { status: 400 });
    }
    console.error('Error sharing handout:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
