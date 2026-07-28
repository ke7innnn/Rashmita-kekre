import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        lines: {
          include: {
            patientPackage: {
              include: { plan: true }
            }
          }
        },
        payments: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const now = new Date();
    const isOverdue = invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && invoice.dueDate && new Date(invoice.dueDate) < now;
    const derivedStatus = isOverdue ? 'OVERDUE' : invoice.status;

    const subtotalAmount = invoice.lines.reduce((sum, line) => {
      const lineVal = Number(line.totalPrice) || (Number(line.quantity) * Number(line.unitPrice));
      return sum + (isNaN(lineVal) ? 0 : lineVal);
    }, 0);

    const discountAmount = Number(invoice.discountAmount || 0);
    const totalAmount = Math.max(0, subtotalAmount - discountAmount);

    return NextResponse.json({
      ...invoice,
      subtotalAmount,
      totalAmount,
      status: derivedStatus,
      rawStatus: invoice.status
    });
  } catch (error: any) {
    console.error('Error fetching invoice details:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === 'cancel') {
      const updated = await prisma.invoice.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { patient: true, lines: true, payments: true }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
