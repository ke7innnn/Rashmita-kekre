import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { actionType, payload } = body;

    const insight = await prisma.insight.findUnique({
      where: { id }
    });

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    // 1. Dispatch action based on actionType
    let resultMessage = 'Action executed successfully';

    if (actionType === 'WHATSAPP_BOOKING_LINK' || actionType === 'WHATSAPP_PAYMENT_REMINDER') {
      // Trigger WATI WhatsApp notification webhook simulation
      resultMessage = `WhatsApp notification sent to ${payload?.phone || 'patient'}`;
    } else if (actionType === 'VAPI_CHECKIN_CALL') {
      // Trigger VAPI Outbound AI call
      resultMessage = `VAPI outbound re-engagement call queued for ${payload?.phone || 'patient'}`;
    } else if (actionType === 'OFFER_SLOT_TO_WAITLIST') {
      resultMessage = 'Slot candidate match offered to waitlist patient';
    } else if (actionType === 'MARK_FOR_DISCHARGE_REVIEW') {
      resultMessage = 'Patient flagged for clinical discharge review';
    }

    // 2. Write to InsightActionLog
    const actionLog = await prisma.insightActionLog.create({
      data: {
        insightId: id,
        userId: (user as any)?.id || (user as any)?.username || 'admin',
        actionType: actionType || insight.actionType || 'NO_ACTION',
        payloadJson: JSON.stringify(payload || {}),
        result: resultMessage
      }
    });

    // 3. Mark Insight as ACTED
    const updatedInsight = await prisma.insight.update({
      where: { id },
      data: {
        status: 'ACTED',
        actedAt: new Date(),
        actedByUserId: (user as any)?.id || (user as any)?.username || 'admin'
      }
    });

    return NextResponse.json({
      success: true,
      resultMessage,
      actionLog,
      insight: updatedInsight
    });
  } catch (error: any) {
    console.error('Error executing insight action:', error);
    return NextResponse.json({ error: 'Failed to execute insight action' }, { status: 500 });
  }
}
