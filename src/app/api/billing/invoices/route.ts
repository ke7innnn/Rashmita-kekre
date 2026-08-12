import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { patient: { fullName: { contains: search, mode: 'insensitive' } } },
        { patient: { phone: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        lines: true,
        payments: true
      }
    });

    const formatted = invoices.map(inv => {
      const now = new Date();
      const isOverdue = inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.dueDate && new Date(inv.dueDate) < now;
      const derivedStatus = isOverdue ? 'OVERDUE' : inv.status;

      const subtotalAmount = inv.lines.reduce((sum, line) => {
        const lineVal = Number(line.totalPrice) || (Number(line.quantity) * Number(line.unitPrice));
        return sum + (isNaN(lineVal) ? 0 : lineVal);
      }, 0);

      const discountAmount = Number(inv.discountAmount || 0);
      const totalAmount = Math.max(0, subtotalAmount - discountAmount);

      return {
        ...inv,
        subtotalAmount,
        totalAmount,
        status: derivedStatus,
        rawStatus: inv.status
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { patientId, lines, discountAmount = 0, notes, dueDate } = body;

    if (!patientId || !lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'Patient ID and at least one line item are required' }, { status: 400 });
    }

    // Calculate total on server-side
    let lineTotalSum = 0;
    const invoiceLinesData = lines.map((l: any) => {
      const q = Math.max(1, parseInt(l.quantity) || 1);
      const price = parseFloat(l.unitPrice) || 0;
      const tot = q * price;
      lineTotalSum += tot;
      return {
        description: l.description,
        quantity: q,
        unitPrice: price,
        totalPrice: tot,
        isCoveredByPackage: !!l.isCoveredByPackage,
        patientPackageId: l.patientPackageId || null
      };
    });

    const discount = Math.max(0, parseFloat(discountAmount) || 0);
    const finalTotal = Math.max(0, lineTotalSum - discount);

    // Generate unique Invoice Number
    const count = await prisma.invoice.count();
    const year = new Date().getFullYear();
    const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId,
        totalAmount: finalTotal,
        discountAmount: discount,
        paidAmount: 0,
        status: 'PENDING',
        notes,
        dueDate: dueDate ? new Date(dueDate) : null,
        lines: {
          create: invoiceLinesData
        }
      },
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        lines: true
      }
    });

    const subtotalAmount = invoice.lines.reduce((sum, line) => {
      const lineVal = Number(line.totalPrice) || (Number(line.quantity) * Number(line.unitPrice));
      return sum + (isNaN(lineVal) ? 0 : lineVal);
    }, 0);

    return NextResponse.json({
      ...invoice,
      subtotalAmount,
      totalAmount: Math.max(0, subtotalAmount - Number(invoice.discountAmount || 0))
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
