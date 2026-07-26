import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

  try {
    // Total unpaid outstanding across all patients
    const pendingInvoices = await prisma.invoice.findMany({
      where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
      select: { totalAmount: true, paidAmount: true },
    });

    const outstanding = pendingInvoices.reduce((acc, inv) => acc + (inv.totalAmount - inv.paidAmount), 0);

    // Collected this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthPayments = await prisma.payment.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { amount: true },
    });

    const collectedThisMonth = monthPayments._sum.amount || 0;

    // Active packages count & total remaining sessions
    const activePackages = await prisma.patientPackage.findMany({
      where: { status: 'ACTIVE' },
      select: { totalSessions: true, sessionsUsed: true },
    });

    const activePackagesCount = activePackages.length;
    const remainingSessionsCount = activePackages.reduce((acc, pkg) => acc + (pkg.totalSessions - pkg.sessionsUsed), 0);

    // Recent invoices (8 dense rows)
    const recentInvoices = await prisma.invoice.findMany({
      take: 8,
      orderBy: { date: 'desc' },
      include: {
        patient: { select: { id: true, fullName: true, phone: true } },
      },
    });

    // Patients with outstanding balances, sorted highest first
    const patients = await prisma.patient.findMany({
      where: {
        invoices: {
          some: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
        },
      },
      include: {
        invoices: {
          where: { status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
          select: { totalAmount: true, paidAmount: true },
        },
      },
    });

    const patientsWithOutstanding = patients
      .map((p) => {
        const balance = p.invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
        return {
          id: p.id,
          fullName: p.fullName,
          phone: p.phone,
          outstandingBalance: balance,
        };
      })
      .filter((p) => p.outstandingBalance > 0)
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance);

    return NextResponse.json({
      outstanding,
      collectedThisMonth,
      activePackagesCount,
      remainingSessionsCount,
      recentInvoices,
      patientsWithOutstanding,
    });
  } catch (error: any) {
    console.error('Error fetching billing overview:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
