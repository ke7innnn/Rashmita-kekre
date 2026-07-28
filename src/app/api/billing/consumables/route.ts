import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const consumables = await prisma.consumableProduct.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(consumables);
  } catch (error: any) {
    console.error('Error fetching consumables:', error);
    return NextResponse.json({ error: 'Failed to fetch consumables' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, unitPrice, unit, notes } = body;

    if (!name || unitPrice === undefined) {
      return NextResponse.json({ error: 'Name and unit price are required' }, { status: 400 });
    }

    const created = await prisma.consumableProduct.create({
      data: {
        name,
        unitPrice: parseFloat(unitPrice),
        unit: unit || null,
        notes: notes || null
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating consumable:', error);
    return NextResponse.json({ error: 'Failed to create consumable' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, name, unitPrice, unit, notes, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Consumable ID is required' }, { status: 400 });
    }

    const updated = await prisma.consumableProduct.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
        ...(unit !== undefined && { unit }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating consumable:', error);
    return NextResponse.json({ error: 'Failed to update consumable' }, { status: 500 });
  }
}
