import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  date: z.string().optional().transform((val) => val ? new Date(val) : new Date()),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  lines: z.array(z.object({
    description: z.string().min(1, 'Line description is required'),
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().min(0),
    isCoveredByPackage: z.boolean().default(false),
    patientPackageId: z.string().optional(),
  })).min(1, 'At least one line item is required'),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Server-side ADMIN role enforcement
  const role = (session.user as any).role;
  if (role === 'PHYSIO' || role === 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Forbidden. Billing access is restricted to ADMIN role.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const query = searchParams.get('query');

  try {
    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (query) {
      where.OR = [
        { invoiceNumber: { contains: query, mode: 'insensitive' } },
        { patient: { fullName: { contains: query, mode: 'insensitive' } } },
        { patient: { phone: { contains: query } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        lines: true,
        payments: true,
      },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
    const body = createInvoiceSchema.parse(json);

    // Compute line item totals server-side
    let calculatedTotal = 0;
    const processedLines = body.lines.map((line) => {
      const lineTotal = line.isCoveredByPackage ? 0 : (line.quantity * line.unitPrice);
      calculatedTotal += lineTotal;
      return {
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice: lineTotal,
        isCoveredByPackage: line.isCoveredByPackage,
        patientPackageId: line.patientPackageId || null,
      };
    });

    const finalTotal = Math.max(0, calculatedTotal - body.discountAmount);

    // Generate unique sequential invoice number (INV-2026-XXXX)
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: body.patientId,
        date: body.date,
        dueDate: body.dueDate,
        totalAmount: finalTotal,
        discountAmount: body.discountAmount,
        status: finalTotal === 0 ? 'PAID' : 'PENDING',
        paidAmount: finalTotal === 0 ? 0 : 0,
        notes: body.notes,
        lines: {
          create: processedLines,
        },
      },
      include: {
        patient: true,
        lines: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid invoice payload', details: error.issues }, { status: 400 });
    }
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
