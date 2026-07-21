import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updatePackageSchema = z.object({
  sessionsUsed: z.number().int().min(0),
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

    const updatedPackage = await prisma.sessionPackage.update({
      where: { id },
      data: {
        sessionsUsed: body.sessionsUsed,
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
