import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    // 1. Outstanding total across all pending/partially paid invoices
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
      select: { totalAmount: true, paidAmount: true, status: true, dueDate: true }
    });

    let totalOutstanding = 0;
    let overdueCount = 0;
    const now = new Date();

    invoices.forEach(inv => {
      const outstanding = Number(inv.totalAmount) - Number(inv.paidAmount);
      if (outstanding > 0) {
        totalOutstanding += outstanding;
      }
      if (inv.dueDate && new Date(inv.dueDate) < now) {
        overdueCount++;
      }
    });

    // 2. Collected this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const paymentsThisMonth = await prisma.payment.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { amount: true }
    });
    const totalCollectedThisMonth = Number(paymentsThisMonth._sum.amount || 0);

    // 3. Active courses (count + total days remaining)
    const activePackages = await prisma.patientPackage.findMany({
      where: { status: 'ACTIVE' },
      select: { daysPurchased: true, sessionsUsed: true }
    });

    const activeCoursesCount = activePackages.length;
    let totalDaysRemaining = 0;
    activePackages.forEach(pkg => {
      const rem = pkg.daysPurchased - pkg.sessionsUsed;
      if (rem > 0) totalDaysRemaining += rem;
    });

    // 4. Recent invoices (8 rows)
    const recentInvoices = await prisma.invoice.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, fullName: true, phone: true } }
      }
    });

    // 5. Patients with outstanding balances (highest first)
    const allUnpaidInvoices = await prisma.invoice.findMany({
      where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
      include: { patient: { select: { id: true, fullName: true, phone: true } } }
    });

    const patientBalanceMap: Record<string, { patient: any; balance: number; invoiceCount: number }> = {};

    allUnpaidInvoices.forEach(inv => {
      const bal = Number(inv.totalAmount) - Number(inv.paidAmount);
      if (bal > 0) {
        if (!patientBalanceMap[inv.patientId]) {
          patientBalanceMap[inv.patientId] = {
            patient: inv.patient,
            balance: 0,
            invoiceCount: 0
          };
        }
        patientBalanceMap[inv.patientId].balance += bal;
        patientBalanceMap[inv.patientId].invoiceCount += 1;
      }
    });

    const outstandingPatients = Object.values(patientBalanceMap).sort((a, b) => b.balance - a.balance);

    // 6. Expiring Packages (Active packages expiring within 14 days with unused days)
    const fourteenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const expiringPackagesRaw = await prisma.patientPackage.findMany({
      where: {
        status: 'ACTIVE',
        expiryDate: {
          not: null,
          lte: fourteenDaysFromNow
        }
      },
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
        plan: { select: { name: true } }
      },
      orderBy: { expiryDate: 'asc' }
    });

    const expiringPackages = expiringPackagesRaw
      .map(pkg => {
        const remainingDays = pkg.daysPurchased - pkg.sessionsUsed;
        const daysToExpiry = Math.ceil((new Date(pkg.expiryDate!).getTime() - now.getTime()) / (1000 * 3600 * 24));
        return {
          id: pkg.id,
          patient: pkg.patient,
          planName: pkg.plan?.name || 'Treatment Course',
          daysPurchased: pkg.daysPurchased,
          sessionsUsed: pkg.sessionsUsed,
          remainingDays,
          daysToExpiry,
          expiryDate: pkg.expiryDate
        };
      })
      .filter(pkg => pkg.remainingDays > 0 && pkg.daysToExpiry >= 0);

    return NextResponse.json({
      metrics: {
        totalOutstanding,
        totalCollectedThisMonth,
        activeCoursesCount,
        totalDaysRemaining,
        overdueCount
      },
      recentInvoices,
      outstandingPatients,
      expiringPackages
    });
  } catch (error: any) {
    console.error('Error in /api/billing/overview:', error);
    return NextResponse.json({ error: 'Failed to fetch billing overview' }, { status: 500 });
  }
}
