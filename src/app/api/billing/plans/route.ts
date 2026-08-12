import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const plans = await prisma.treatmentPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
    return NextResponse.json(plans);
  } catch (error: any) {
    console.error('Error fetching treatment plans:', error);
    return NextResponse.json({ error: 'Failed to fetch treatment plans' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, perSessionRate, packageRate, name, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Treatment plan ID is required' }, { status: 400 });
    }

    const updated = await prisma.treatmentPlan.update({
      where: { id },
      data: {
        ...(perSessionRate !== undefined && { perSessionRate: parseFloat(perSessionRate) }),
        ...(packageRate !== undefined && { packageRate: parseFloat(packageRate) }),
        ...(name && { name }),
        ...(description !== undefined && { description })
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating treatment plan:', error);
    return NextResponse.json({ error: 'Failed to update treatment plan' }, { status: 500 });
  }
}
