import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Find invoice by ID or invoiceNumber
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { id },
          { invoiceNumber: id }
        ]
      },
      include: {
        patient: {
          select: {
            fullName: true,
            phone: true,
          }
        },
        lines: true,
        payments: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const subtotal = invoice.lines.reduce((sum, line) => {
      const lineVal = Number(line.totalPrice) || (Number(line.quantity) * Number(line.unitPrice));
      return sum + (isNaN(lineVal) ? 0 : lineVal);
    }, 0);

    const discount = Number(invoice.discountAmount || 0);
    const total = Math.max(0, subtotal - discount);
    const amountPaid = Number(invoice.paidAmount || 0);
    const balanceDue = Math.max(0, total - amountPaid);

    const settings = await prisma.clinicSettings.findUnique({
      where: { id: 'clinic_settings' }
    }).catch(() => null);

    return NextResponse.json({
      invoiceNumber: invoice.invoiceNumber,
      createdAt: invoice.createdAt,
      patientName: invoice.patient?.fullName || 'Patient',
      patientPhone: invoice.patient?.phone || '',
      lines: invoice.lines.map(l => ({
        id: l.id,
        description: l.description,
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice || 0),
        lineTotal: Number(l.totalPrice || 0)
      })),
      subtotal,
      discount,
      total,
      amountPaid,
      balanceDue,
      paymentMode: invoice.payments?.[0]?.paymentMode || 'UPI',
      notes: invoice.notes,
      clinic: {
        name: 'Health 360',
        tagline: settings?.tagline || 'Physiotherapy and Craniosacral Therapy Clinic',
        doctorName: settings?.primaryDoctor || 'Dr. Rashmita Karvir Kekre',
        credentials: ['B.PTh.(M.I.A.P.)', 'BCST'],
        address: settings?.address || 'Shop No.1 & 2, Amardeep Society, Om Nagar, Vasai (West), Dist. Palghar - 401202',
        phone: settings?.phone || '+91 8482812859',
        email: settings?.email || 'health360vasai@gmail.com',
        logoUrl: settings?.logoUrl || '/logo/rklogo.png'
      }
    });
  } catch (error: any) {
    console.error('Error in public receipt endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
