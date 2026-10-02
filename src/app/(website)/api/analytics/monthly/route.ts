import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    // Format: YYYY-MM, e.g. "2026-09"
    const requestedMonth = searchParams.get('month');

    // Default to September 2026 if requested or current/last month
    let targetYear: number;
    let targetMonth: number; // 1-12

    if (requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth)) {
      const [y, m] = requestedMonth.split('-').map(Number);
      targetYear = y;
      targetMonth = m;
    } else {
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth() + 1; // current month
    }

    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    // 1. Payments in requested month
    const payments = await prisma.payment.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            patient: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    let totalCollected = 0;
    let upiTotal = 0;
    let cashTotal = 0;
    let cardTotal = 0;
    let otherTotal = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      totalCollected += amt;
      const mode = (p.paymentMode || '').toUpperCase().trim();
      if (mode === 'UPI') upiTotal += amt;
      else if (mode === 'CASH') cashTotal += amt;
      else if (mode === 'CARD') cardTotal += amt;
      else otherTotal += amt;
    });

    // 2. Appointments in requested month
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        status: true,
        treatmentType: true,
      },
    });

    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter((a) => a.status === 'COMPLETED').length;
    const noShowAppointments = appointments.filter((a) => a.status === 'NO_SHOW').length;
    const cancelledAppointments = appointments.filter((a) => a.status === 'CANCELLED').length;
    const scheduledAppointments = appointments.filter(
      (a) => a.status === 'SCHEDULED' || a.status === 'WAITING' || a.status === 'IN_PROGRESS'
    ).length;
    const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

    // 3. New Patients registered in requested month
    const newPatientsCount = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // 4. Invoices in requested month
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
        status: true,
      },
    });

    let totalInvoiced = 0;
    let totalInvoicePaid = 0;
    invoices.forEach((inv) => {
      totalInvoiced += Number(inv.totalAmount) || 0;
      totalInvoicePaid += Number(inv.paidAmount) || 0;
    });

    // 5. Available months in database (for easy switching)
    const distinctPaymentDates = await prisma.payment.findMany({
      select: { date: true },
      distinct: ['date'],
    });

    const monthsSet = new Set<string>();
    distinctPaymentDates.forEach((p) => {
      const d = new Date(p.date);
      monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    // Ensure current month and September 2026 are included
    monthsSet.add('2026-09');
    monthsSet.add('2026-10');
    monthsSet.add('2026-08');

    const availableMonths = Array.from(monthsSet).sort().reverse();

    return NextResponse.json({
      period: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
      earnings: {
        totalCollected,
        upiTotal,
        cashTotal,
        cardTotal,
        otherTotal,
        transactionCount: payments.length,
        upiPercentage: totalCollected > 0 ? Math.round((upiTotal / totalCollected) * 100) : 0,
        cashPercentage: totalCollected > 0 ? Math.round((cashTotal / totalCollected) * 100) : 0,
      },
      sessions: {
        total: totalAppointments,
        completed: completedAppointments,
        noShow: noShowAppointments,
        cancelled: cancelledAppointments,
        scheduled: scheduledAppointments,
        completionRate,
      },
      patients: {
        newRegistered: newPatientsCount,
      },
      invoices: {
        count: invoices.length,
        totalInvoiced,
        totalInvoicePaid,
        pendingBalance: Math.max(0, totalInvoiced - totalInvoicePaid),
      },
      availableMonths,
      recentPayments: payments.slice(0, 10).map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        mode: p.paymentMode,
        date: p.date,
        patientName: p.invoice?.patient?.fullName || 'Walk-in Patient',
        patientPhone: p.invoice?.patient?.phone || '',
        invoiceNumber: p.invoice?.invoiceNumber || '',
      })),
    });
  } catch (error: any) {
    console.error('Failed to fetch monthly analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly analytics' }, { status: 500 });
  }
}
