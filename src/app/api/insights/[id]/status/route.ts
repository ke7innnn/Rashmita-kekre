import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role, InsightStatus } from '@prisma/client';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, snoozedUntil } = body;

    if (!status || !Object.values(InsightStatus).includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }

    const updated = await prisma.insight.update({
      where: { id },
      data: {
        status,
        ...(snoozedUntil && { snoozedUntil: new Date(snoozedUntil) })
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating insight status:', error);
    return NextResponse.json({ error: 'Failed to update insight status' }, { status: 500 });
  }
}
