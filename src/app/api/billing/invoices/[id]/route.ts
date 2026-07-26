import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Server-side ADMIN role enforcement
  const role = (session.user as any).role;
  if (role === 'PHYSIO' || role === 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Forbidden. Billing access is restricted to ADMIN role.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: true,
        lines: true,
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Error fetching invoice details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Server-side ADMIN role enforcement
  const role = (session.user as any).role;
  if (role === 'PHYSIO' || role === 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Forbidden. Billing access is restricted to ADMIN role.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const json = await req.json();

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: json.status,
        notes: json.notes,
      },
      include: {
        patient: true,
        lines: true,
        payments: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
