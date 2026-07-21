import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const packageSchema = z.object({
  patientId: z.string(),
  packageName: z.string(),
  totalSessions: z.number().int().positive(),
  expiryDate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    
    const packages = await prisma.sessionPackage.findMany({
      where: patientId ? { patientId } : undefined,
      include: {
        patient: true,
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });
    return NextResponse.json(packages);
  } catch (error: any) {
    console.error('Error fetching session packages:', error);
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
    const body = packageSchema.parse(json);

    const newPackage = await prisma.sessionPackage.create({
      data: {
        patientId: body.patientId,
        packageName: body.packageName,
        totalSessions: body.totalSessions,
        sessionsUsed: 0,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      },
      include: {
        patient: true,
      },
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid schema', details: error.issues }, { status: 400 });
    }
    console.error('Error creating package block:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
