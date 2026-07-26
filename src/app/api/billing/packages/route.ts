import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const packageSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  totalSessions: z.number().int().min(1),
  price: z.number().min(0),
  validityDays: z.number().int().min(1).default(30),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const packages = await prisma.treatmentPackage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // If none exist, seed default rates
    if (packages.length === 0) {
      const defaults = [
        { name: 'Initial Consultation Package', totalSessions: 1, price: 1500, validityDays: 30 },
        { name: '5-Session Rehabilitation Pack', totalSessions: 5, price: 6500, validityDays: 60 },
        { name: '10-Session Intensive Recovery Pack', totalSessions: 10, price: 12000, validityDays: 90 },
      ];

      for (const d of defaults) {
        await prisma.treatmentPackage.create({ data: d });
      }

      const seeded = await prisma.treatmentPackage.findMany({ orderBy: { createdAt: 'desc' } });
      return NextResponse.json(seeded);
    }

    return NextResponse.json(packages);
  } catch (error: any) {
    console.error('Error fetching treatment packages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Server-side ADMIN role enforcement
  const role = (session.user as any).role;
  if (role === 'PHYSIO' || role === 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Forbidden. Billing access is restricted to ADMIN role.' }, { status: 403 });
  }

  try {
    const json = await req.json();
    const body = packageSchema.parse(json);

    const pkg = await prisma.treatmentPackage.create({
      data: body,
    });

    return NextResponse.json(pkg, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid package payload', details: error.issues }, { status: 400 });
    }
    console.error('Error creating package template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
