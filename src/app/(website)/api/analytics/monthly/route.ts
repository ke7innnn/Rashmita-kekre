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

    // Cover Indian Standard Time (UTC+5:30) and UTC boundaries safely
    const startOfMonthUTC = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0));
    const startRange = new Date(startOfMonthUTC.getTime() - (6 * 60 * 60 * 1000)); // 6h buffer before for IST

    const endOfMonthUTC = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));
    const endRange = new Date(endOfMonthUTC.getTime() + (6 * 60 * 60 * 1000)); // 6h buffer after for IST

    const startOfMonth = startRange;
    const endOfMonth = endRange;

    // Helper to test if a timestamp belongs to the target month in UTC or IST
    const isDateInTargetMonth = (dateObj: Date | string) => {
      const d = new Date(dateObj);
      if (isNaN(d.getTime())) return false;
      const inUTC = d.getUTCFullYear() === targetYear && (d.getUTCMonth() + 1) === targetMonth;
      const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
      const inIST = istDate.getUTCFullYear() === targetYear && (istDate.getUTCMonth() + 1) === targetMonth;
      return inUTC || inIST;
    };

    // 1. Payments in requested month
    const rawPayments = await prisma.payment.findMany({
      where: {
        date: {
          gte: startRange,
          lte: endRange,
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

    const payments = rawPayments.filter((p) => isDateInTargetMonth(p.date));

    let totalCollected = 0;
    let upiTotal = 0;
    let cashTotal = 0;
    let cardTotal = 0;
    let otherTotal = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      totalCollected += amt;
      const rawMode = (p.paymentMode || '').toUpperCase().trim();
      if (
        rawMode.includes('UPI') ||
        rawMode.includes('GPAY') ||
        rawMode.includes('PHONEPE') ||
        rawMode.includes('PAYTM') ||
        rawMode.includes('QR') ||
        rawMode.includes('ONLINE') ||
        rawMode.includes('BHIM')
      ) {
        upiTotal += amt;
      } else if (rawMode.includes('CASH')) {
        cashTotal += amt;
      } else if (
        rawMode.includes('CARD') ||
        rawMode.includes('DEBIT') ||
        rawMode.includes('CREDIT') ||
        rawMode.includes('POS')
      ) {
        cardTotal += amt;
      } else {
        otherTotal += amt;
      }
    });

    // 2. Appointments in requested month
    const rawAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startRange,
          lte: endRange,
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

    const appointments = rawAppointments.filter((a) => isDateInTargetMonth(a.date));

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

    const directRegistered = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        importBatchId: null,
      },
    });

    const importedBatch = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        importBatchId: { not: null },
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
    const recentPaymentsForMonths = await prisma.payment.findMany({
      select: { date: true },
      orderBy: { date: 'desc' },
      take: 200,
    });

    const monthsSet = new Set<string>();
    recentPaymentsForMonths.forEach((p) => {
      const d = new Date(p.date);
      if (!isNaN(d.getTime())) {
        monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });

    // Also include current month and last 4 calendar months
    const curDate = new Date();
    for (let i = 0; i <= 4; i++) {
      const past = new Date(curDate.getFullYear(), curDate.getMonth() - i, 1);
      monthsSet.add(`${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}`);
    }

    const availableMonths = Array.from(monthsSet)
      .filter((m) => /^\d{4}-\d{2}$/.test(m))
      .sort()
      .reverse();

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
        directRegistered,
        importedBatch,
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
