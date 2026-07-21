import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updatePackageSchema = z.object({
  sessionsUsed: z.number().int().min(0).optional(),
  subSessionNotes: z.string().optional(),
  price: z.number().optional(),
  paidAmount: z.number().optional(),
  packageName: z.string().optional(),
  totalSessions: z.number().int().positive().optional(),
  subSessionNames: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const json = await req.json();
    const body = updatePackageSchema.parse(json);

    const currentPkg = await prisma.sessionPackage.findUnique({
      where: { id }
    });

    if (!currentPkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const price = body.price !== undefined ? body.price : currentPkg.price || 0;
    const paidAmount = body.paidAmount !== undefined ? body.paidAmount : currentPkg.paidAmount || 0;
    const paymentStatus = paidAmount >= price && price > 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'PENDING');

    const updatedPackage = await prisma.sessionPackage.update({
      where: { id },
      data: {
        sessionsUsed: body.sessionsUsed !== undefined ? body.sessionsUsed : currentPkg.sessionsUsed,
        subSessionNotes: body.subSessionNotes !== undefined ? body.subSessionNotes : currentPkg.subSessionNotes,
        packageName: body.packageName !== undefined ? body.packageName : currentPkg.packageName,
        totalSessions: body.totalSessions !== undefined ? body.totalSessions : currentPkg.totalSessions,
        subSessionNames: body.subSessionNames !== undefined ? body.subSessionNames : currentPkg.subSessionNames,
        price,
        paidAmount,
        paymentStatus,
      },
    });

    return NextResponse.json(updatedPackage);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid schema', details: error.issues }, { status: 400 });
    }
    console.error('Error updating session package:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.sessionPackage.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting session package:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
