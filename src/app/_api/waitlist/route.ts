import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const waitlistSchema = z.object({
  patientId: z.string(),
  desiredTreatmentType: z.string(),
  preferredTimeWindow: z.string(), // "MORNING" | "AFTERNOON" | "EVENING"
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const waitlist = await prisma.waitlist.findMany({
      include: {
        patient: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return NextResponse.json(waitlist);
  } catch (error: any) {
    console.error('Error fetching waitlist:', error);
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
    const body = waitlistSchema.parse(json);

    const waitlistEntry = await prisma.waitlist.create({
      data: {
        patientId: body.patientId,
        desiredTreatmentType: body.desiredTreatmentType,
        preferredTimeWindow: body.preferredTimeWindow,
        status: 'WAITING',
      },
      include: {
        patient: true,
      },
    });

    return NextResponse.json(waitlistEntry, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data schema', details: error.issues }, { status: 400 });
    }
    console.error('Error creating waitlist entry:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
