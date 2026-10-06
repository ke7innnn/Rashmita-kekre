import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { errorResponse, role } = await requireRole([
    Role.ADMIN,
    Role.PHYSIO,
  ]);
  if (errorResponse) return errorResponse;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const fourteenDaysFromNow = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Run all billing aggregations in parallel to eliminate slow sequential round-trips
    const [
      unpaidInvoices,
      paymentsThisMonth,
      activePackages,
      recentInvoices,
      expiringPackagesRaw,
    ] = await Promise.all([
      // 1. All pending & partially paid invoices (used for totalOutstanding, overdueCount, and outstanding balances)
      prisma.invoice.findMany({
        where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
          dueDate: true,
          patientId: true,
          patient: { select: { id: true, fullName: true, phone: true } },
        },
      }),

      // 2. Payments collected this month
      prisma.payment.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),

      // 3. Active patient packages
      prisma.patientPackage.findMany({
        where: { status: 'ACTIVE' },
        select: { daysPurchased: true, sessionsUsed: true },
      }),

      // 4. Recent invoices (8 rows)
      prisma.invoice.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, fullName: true, phone: true } },
        },
      }),

      // 5. Expiring Packages (Active packages expiring within 14 days)
      prisma.patientPackage.findMany({
        where: {
          status: 'ACTIVE',
          expiryDate: {
            not: null,
            lte: fourteenDaysFromNow,
          },
        },
        include: {
          patient: { select: { id: true, fullName: true, phone: true } },
          plan: { select: { name: true } },
        },
        orderBy: { expiryDate: 'asc' },
      }),
    ]);

    // Calculate total outstanding & overdue counts & patient balances from single unified dataset
    let totalOutstanding = 0;
    let overdueCount = 0;
    const patientBalanceMap: Record<string, { patient: any; balance: number; invoiceCount: number }> = {};

    unpaidInvoices.forEach((inv) => {
      const bal = Number(inv.totalAmount) - Number(inv.paidAmount);
      if (bal > 0) {
        totalOutstanding += bal;
        if (!patientBalanceMap[inv.patientId]) {
          patientBalanceMap[inv.patientId] = {
            patient: inv.patient,
            balance: 0,
            invoiceCount: 0,
          };
        }
        patientBalanceMap[inv.patientId].balance += bal;
        patientBalanceMap[inv.patientId].invoiceCount += 1;
      }
      if (inv.dueDate && new Date(inv.dueDate) < now) {
        overdueCount++;
      }
    });

    const outstandingPatients = Object.values(patientBalanceMap).sort((a, b) => b.balance - a.balance);

    // Active courses summary
    const activeCoursesCount = activePackages.length;
    let totalDaysRemaining = 0;
    activePackages.forEach((pkg) => {
      const rem = pkg.daysPurchased - pkg.sessionsUsed;
      if (rem > 0) totalDaysRemaining += rem;
    });

    const totalCollectedThisMonth = Number(paymentsThisMonth._sum.amount || 0);

    // Expiring packages formatting
    const expiringPackages = expiringPackagesRaw
      .map((pkg) => {
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
          expiryDate: pkg.expiryDate,
        };
      })
      .filter((pkg) => pkg.remainingDays > 0 && pkg.daysToExpiry >= 0);

    return NextResponse.json(
      {
        metrics: {
          totalOutstanding,
          totalCollectedThisMonth,
          activeCoursesCount,
          totalDaysRemaining,
          overdueCount,
        },
        recentInvoices,
        outstandingPatients,
        expiringPackages,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error: any) {
    console.error('Error in /api/billing/overview:', error);
    return NextResponse.json({ error: 'Failed to fetch billing overview' }, { status: 500 });
  }
}
