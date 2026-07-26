import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const sellPackageSchema = z.object({
  treatmentPackageId: z.string().optional(),
  packageName: z.string().min(1, 'Package name is required'),
  totalSessions: z.number().int().min(1),
  price: z.number().min(0),
  validityDays: z.number().int().min(1).default(30),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Server-side ADMIN role enforcement
  const role = (session.user as any).role;
  if (role === 'PHYSIO' || role === 'RECEPTIONIST') {
    return NextResponse.json({ error: 'Forbidden. Billing access is restricted to ADMIN role.' }, { status: 403 });
  }

  const { id: patientId } = await params;

  try {
    const json = await req.json();
    const body = sellPackageSchema.parse(json);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + body.validityDays);

    // Create PatientPackage
    const patientPackage = await prisma.patientPackage.create({
      data: {
        patientId,
        treatmentPackageId: body.treatmentPackageId || null,
        packageName: body.packageName,
        totalSessions: body.totalSessions,
        sessionsUsed: 0,
        price: body.price,
        paidAmount: 0,
        status: 'ACTIVE',
        purchaseDate: new Date(),
        expiryDate,
      },
    });

    // Also sync to legacy SessionPackage model for backwards compatibility in OPD dashboard
    await prisma.sessionPackage.create({
      data: {
        patientId,
        packageName: body.packageName,
        totalSessions: body.totalSessions,
        sessionsUsed: 0,
        price: body.price,
        paidAmount: 0,
        paymentStatus: 'PENDING',
        expiryDate,
      },
    });

    // Generate corresponding invoice for package purchase
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId,
        date: new Date(),
        totalAmount: body.price,
        paidAmount: 0,
        discountAmount: 0,
        status: body.price === 0 ? 'PAID' : 'PENDING',
        notes: `Prepaid Package Purchase: ${body.packageName} (${body.totalSessions} Sessions)`,
        lines: {
          create: [
            {
              description: `Treatment Package: ${body.packageName} (${body.totalSessions} Sessions)`,
              quantity: 1,
              unitPrice: body.price,
              totalPrice: body.price,
              isCoveredByPackage: false,
              patientPackageId: patientPackage.id,
            },
          ],
        },
      },
    });

    return NextResponse.json({ patientPackage, invoice }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.issues }, { status: 400 });
    }
    console.error('Error selling package:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
