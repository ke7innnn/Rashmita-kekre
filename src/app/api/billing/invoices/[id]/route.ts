import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireRole([Role.ADMIN, Role.PHYSIO]);
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
  const { errorResponse } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { action, status, notes, discountAmount, lines } = body;

    if (action === 'cancel') {
      const updated = await prisma.invoice.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { patient: true, lines: true, payments: true }
      });
      return NextResponse.json(updated);
    }

    const updateData: any = {};
    
    if (status) {
      const raw = String(status).toUpperCase();
      let normalizedStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' = 'PENDING';
      
      if (raw === 'PAID') {
        normalizedStatus = 'PAID';
      } else if (raw === 'PARTIALLY_PAID' || raw === 'PARTIAL') {
        normalizedStatus = 'PARTIALLY_PAID';
      } else if (raw === 'CANCELLED' || raw === 'CANCELED') {
        normalizedStatus = 'CANCELLED';
      } else {
        normalizedStatus = 'PENDING'; // maps 'UNPAID', 'DRAFT', 'PENDING'
      }

      updateData.status = normalizedStatus;

      const existingInv = await prisma.invoice.findUnique({ where: { id } });
      if (existingInv) {
        if (normalizedStatus === 'PAID' && Number(existingInv.paidAmount) < Number(existingInv.totalAmount)) {
          updateData.paidAmount = Number(existingInv.totalAmount);
        } else if (normalizedStatus === 'PENDING' && Number(existingInv.paidAmount) > 0) {
          updateData.paidAmount = 0;
        }
      }
    }

    if (notes !== undefined) updateData.notes = notes;
    if (discountAmount !== undefined) updateData.discountAmount = Number(discountAmount);

    if (lines && Array.isArray(lines)) {
      for (const line of lines) {
        if (line.id) {
          const qty = Number(line.quantity) || 1;
          const uPrice = line.isCoveredByPackage ? 0 : Number(line.unitPrice) || 0;
          const tPrice = qty * uPrice;
          await prisma.invoiceLine.update({
            where: { id: line.id },
            data: {
              description: line.description,
              quantity: qty,
              unitPrice: uPrice,
              totalPrice: tPrice,
            }
          });
        }
      }

      const allLines = await prisma.invoiceLine.findMany({ where: { invoiceId: id } });
      const subtotal = allLines.reduce((sum, l) => sum + Number(l.totalPrice), 0);
      const disc = discountAmount !== undefined ? Number(discountAmount) : 0;
      updateData.subtotalAmount = subtotal;
      updateData.totalAmount = Math.max(0, subtotal - disc);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { patient: true, lines: true, payments: true }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
