import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const { id: patientId } = await params;
    const packages = await prisma.patientPackage.findMany({
      where: { patientId },
      include: { plan: true },
      orderBy: { purchaseDate: 'desc' }
    });

    const now = new Date();
    // Auto-expire packages past expiryDate
    for (const pkg of packages) {
      if (pkg.status === 'ACTIVE' && pkg.expiryDate && new Date(pkg.expiryDate) < now) {
        await prisma.patientPackage.update({
          where: { id: pkg.id },
          data: { status: 'EXPIRED' }
        });
        pkg.status = 'EXPIRED';
      }
    }

    const activePackage = packages.find(p => p.status === 'ACTIVE') || null;

    return NextResponse.json({
      activePackage,
      allPackages: packages
    });
  } catch (error: any) {
    console.error('Error fetching patient packages:', error);
    return NextResponse.json({ error: 'Failed to fetch patient packages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireRole([Role.ADMIN, Role.PHYSIO]);
  if (errorResponse) return errorResponse;

  try {
    const { id: patientId } = await params;
    const body = await req.json();
    const { planId, daysPurchased, expiryDate, createInvoice = true } = body;

    if (!planId || !daysPurchased || parseInt(daysPurchased) <= 0) {
      return NextResponse.json({ error: 'Plan ID and valid days purchased are required' }, { status: 400 });
    }

    const plan = await prisma.treatmentPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Treatment plan not found' }, { status: 404 });
    }

    const days = parseInt(daysPurchased);
    // Rate Snapshot taken at purchase!
    const rateSnapshot = Number(plan.packageRate);
    const totalAmount = rateSnapshot * days;

    // Automatic 45-day expiry calculation
    const autoExpiryDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

    // 1. Create PatientPackage record
    const patientPackage = await prisma.patientPackage.create({
      data: {
        patientId,
        planId,
        daysPurchased: days,
        ratePerDay: rateSnapshot,
        totalAmount,
        sessionsUsed: 0,
        status: 'ACTIVE',
        purchaseDate: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : autoExpiryDate
      },
      include: { plan: true, patient: true }
    });

    let invoice = null;
    if (createInvoice) {
      // Generate invoice for course purchase
      const count = await prisma.invoice.count();
      const year = new Date().getFullYear();
      const invoiceNumber = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`;

      invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          patientId,
          totalAmount,
          discountAmount: 0,
          paidAmount: 0,
          status: 'PENDING',
          notes: `${plan.name} Treatment Course (${days} days @ ₹${rateSnapshot}/day)`,
          lines: {
            create: [
              {
                description: `${plan.name} Treatment Course (${days} days)`,
                quantity: days,
                unitPrice: rateSnapshot,
                totalPrice: totalAmount,
                isCoveredByPackage: false,
                patientPackageId: patientPackage.id
              }
            ]
          }
        }
      });

      // Update package with invoiceId
      await prisma.patientPackage.update({
        where: { id: patientPackage.id },
        data: { invoiceId: invoice.id }
      });
    }

    return NextResponse.json({ patientPackage, invoice }, { status: 201 });
  } catch (error: any) {
    console.error('Error purchasing course package:', error);
    return NextResponse.json({ error: 'Failed to purchase course package' }, { status: 500 });
  }
}
