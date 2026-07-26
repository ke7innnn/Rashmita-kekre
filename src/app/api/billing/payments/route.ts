import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentMode: z.enum(['Cash', 'UPI', 'Card', 'Bank transfer']),
  referenceNumber: z.string().optional(),
  date: z.string().optional().transform((val) => val ? new Date(val) : new Date()),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Server-side ADMIN role enforcement
  const role = (session.user as any).role;
  if (role === 'PHYSIO' || role === 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Forbidden. Billing access is restricted to ADMIN role.' }, { status: 403 });
  }

  try {
    const json = await req.json();
    const body = paymentSchema.parse(json);

    const invoice = await prisma.invoice.findUnique({
      where: { id: body.invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const newPaidAmount = invoice.paidAmount + body.amount;
    const isFullyPaid = newPaidAmount >= invoice.totalAmount;
    const newStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    // Record Payment & update Invoice in a transaction
    const [payment, updatedInvoice] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: body.invoiceId,
          amount: body.amount,
          paymentMode: body.paymentMode,
          referenceNumber: body.referenceNumber,
          date: body.date,
        },
      }),
      prisma.invoice.update({
        where: { id: body.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
        include: {
          patient: true,
          lines: true,
          payments: { orderBy: { date: 'desc' } },
        },
      }),
    ]);

    return NextResponse.json({ payment, invoice: updatedInvoice }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payment payload', details: error.issues }, { status: 400 });
    }
    console.error('Error recording payment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
