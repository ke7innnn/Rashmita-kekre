import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { invoiceId, amount, paymentMode, referenceNumber, date, paymentDate } = body;
    const effectiveDate = date || paymentDate;

    if (!invoiceId || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Valid invoice ID and payment amount are required' }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const pAmount = parseFloat(amount);
    const currentPaid = Number(invoice.paidAmount);
    const newPaidTotal = currentPaid + pAmount;
    const invTotal = Number(invoice.totalAmount);

    let newStatus = invoice.status;
    if (newPaidTotal >= invTotal) {
      newStatus = 'PAID';
    } else if (newPaidTotal > 0) {
      newStatus = 'PARTIALLY_PAID';
    }

    // Transaction to add payment record and update invoice status
    const [payment, updatedInvoice] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId,
          amount: pAmount,
          paymentMode: paymentMode || 'Cash',
          referenceNumber: referenceNumber || null,
          date: effectiveDate ? new Date(effectiveDate) : new Date()
        }
      }),
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidTotal,
          status: newStatus
        },
        include: {
          patient: true,
          lines: true,
          payments: { orderBy: { date: 'desc' } }
        }
      })
    ]);

    return NextResponse.json({ payment, invoice: updatedInvoice }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
