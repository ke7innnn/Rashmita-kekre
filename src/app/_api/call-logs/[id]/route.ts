import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

import { CallDirection, CallOutcome } from '@prisma/client';

const patchCallLogSchema = z.object({
  direction: z.nativeEnum(CallDirection).optional(),
  phoneNumber: z.string().optional(),
  duration: z.number().int().nonnegative().optional(),
  transcript: z.string().optional(),
  summary: z.string().optional(),
  outcome: z.nativeEnum(CallOutcome).optional(),
  timestamp: z.string().transform((val) => (val ? new Date(val) : undefined)).optional(),
  followUpActioned: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await req.json();
    const body = patchCallLogSchema.parse(json);

    const existing = await prisma.callLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (body.direction !== undefined) dataToUpdate.direction = body.direction;
    if (body.phoneNumber !== undefined) dataToUpdate.phoneNumber = body.phoneNumber;
    if (body.duration !== undefined) dataToUpdate.duration = body.duration;
    if (body.transcript !== undefined) dataToUpdate.transcript = body.transcript;
    if (body.summary !== undefined) dataToUpdate.summary = body.summary;
    if (body.outcome !== undefined) dataToUpdate.outcome = body.outcome;
    if (body.timestamp !== undefined) dataToUpdate.timestamp = body.timestamp;
    if (body.followUpActioned !== undefined) dataToUpdate.followUpActioned = body.followUpActioned;

    const callLog = await prisma.callLog.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(callLog);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }
    console.error('Error updating call log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.callLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 });
    }

    await prisma.callLog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting call log:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
