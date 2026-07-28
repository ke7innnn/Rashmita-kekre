import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const charges = await prisma.serviceCharge.findMany({
      orderBy: { appointmentType: 'asc' }
    });
    return NextResponse.json(charges);
  } catch (error: any) {
    console.error('Error fetching service charges:', error);
    return NextResponse.json({ error: 'Failed to fetch service charges' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, rate, isBilledByPlan } = body;

    if (!id) {
      return NextResponse.json({ error: 'Service charge ID is required' }, { status: 400 });
    }

    const updated = await prisma.serviceCharge.update({
      where: { id },
      data: {
        ...(rate !== undefined && { rate: parseFloat(rate) }),
        ...(isBilledByPlan !== undefined && { isBilledByPlan })
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating service charge:', error);
    return NextResponse.json({ error: 'Failed to update service charge' }, { status: 500 });
  }
}
