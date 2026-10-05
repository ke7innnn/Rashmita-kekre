import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface StaffShiftRecord {
  id: string;
  date: string;
  clockInAt: string;
  clockOutAt: string | null;
  durationHours: number;
  notes: string | null;
}

interface StaffDailyItem {
  day: number;
  date: string;
  weekday: string;
  isSunday: boolean;
  isWorkingDay: boolean;
  status: 'PRESENT' | 'ABSENT' | 'OFF' | 'UPCOMING';
  hours: number;
  clockInAt: string | null;
  clockOutAt: string | null;
  notes: string | null;
  shiftCount: number;
}

interface StaffMemberAttendance {
  userId: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  department: string | null;
  daysPresent: number;
  daysAbsent: number;
  daysOff: number;
  daysUpcoming: number;
  totalWorkingDaysInPeriod: number;
  attendanceRate: number;
  totalHours: number;
  avgHoursPerDay: number;
  avgHoursAcrossWorkingDays: number;
  totalShifts: number;
  dailyMatrix: StaffDailyItem[];
  recentShifts: StaffShiftRecord[];
  records: StaffShiftRecord[];
  avgHoursPerShift: number;
}

function formatStaffName(user: { fullName?: string | null; email?: string | null; designation?: string | null }): string {
  if (user.fullName && user.fullName.trim()) return user.fullName.trim();
  const email = (user.email || '').toLowerCase();
  if (email.includes('rashmita')) return 'Dr. Rashmita Kekre';
  if (email.includes('gachchami')) return 'Dr. Gachchami Sharma';
  if (email.includes('pritee')) return 'Dr. Pritee Patil';
  if (email.includes('receptionist')) return 'Clinic Receptionist';
  if (email.includes('physio')) return 'Clinical Physiotherapist';

  const emailPrefix = (user.email || 'staff').split('@')[0];
  if (emailPrefix.toLowerCase().startsWith('dr.')) {
    const raw = emailPrefix.slice(3);
    const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
    return `Dr. ${capitalized}`;
  }
  if (user.designation) return `${user.designation}`;
  return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    // Format: YYYY-MM, e.g. "2026-09"
    const requestedMonth = searchParams.get('month');

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

    // Helper to test if a timestamp belongs to the target month in UTC or IST
    const isDateInTargetMonth = (dateObj: Date | string | null | undefined) => {
      if (!dateObj) return false;
      const d = new Date(dateObj);
      if (isNaN(d.getTime())) return false;
      const inUTC = d.getUTCFullYear() === targetYear && (d.getUTCMonth() + 1) === targetMonth;
      const istDate = new Date(d.getTime() + (5.5 * 60 * 60 * 1000));
      const inIST = istDate.getUTCFullYear() === targetYear && (istDate.getUTCMonth() + 1) === targetMonth;
      return inUTC || inIST;
    };

    // ─────────────────────────────────────────────────────────────
    // 1. EARNINGS OF THE MONTH: CASH & UPI BREAKDOWN
    // ─────────────────────────────────────────────────────────────
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

    const upiPercentage = totalCollected > 0 ? Math.round((upiTotal / totalCollected) * 100) : 0;
    const cashPercentage = totalCollected > 0 ? Math.round((cashTotal / totalCollected) * 100) : 0;

    // ─────────────────────────────────────────────────────────────
    // 2. TOTAL NUMBER OF SESSIONS & MODALITY BREAKDOWN
    // ─────────────────────────────────────────────────────────────
    const rawAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startRange,
          lte: endRange,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            referringDoctor: true,
            treatmentModalityAssigned: true,
          },
        },
        assignedPhysio: {
          select: {
            id: true,
            fullName: true,
            email: true,
            designation: true,
          },
        },
      },
      orderBy: { date: 'desc' },
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

    // Modality breakdown
    const modalityCountMap: Record<string, number> = {};
    appointments.forEach((a) => {
      const mod = a.treatmentType?.trim() || 'General Physiotherapy';
      modalityCountMap[mod] = (modalityCountMap[mod] || 0) + 1;
    });

    const modalityBreakdown = Object.entries(modalityCountMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalAppointments > 0 ? Math.round((count / totalAppointments) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ─────────────────────────────────────────────────────────────
    // 3. PATIENTS WHO CAME IN THE MONTH
    // ─────────────────────────────────────────────────────────────
    const patientAttendanceMap = new Map<string, {
      id: string;
      fullName: string;
      phone: string;
      totalVisits: number;
      modalities: Set<string>;
      referringDoctor: string;
      lastVisitDate: string;
      statusPill: string;
    }>();

    appointments.forEach((app) => {
      if (!app.patient) return;
      const p = app.patient;
      const appDateStr = new Date(app.date).toISOString().split('T')[0];
      const isAttended = app.status === 'COMPLETED' || app.status === 'IN_PROGRESS' || app.status === 'WAITING';

      const existing = patientAttendanceMap.get(p.id) || {
        id: p.id,
        fullName: p.fullName,
        phone: p.phone || '',
        totalVisits: 0,
        modalities: new Set<string>(),
        referringDoctor: p.referringDoctor?.trim() || 'Self / Walk-in',
        lastVisitDate: appDateStr,
        statusPill: isAttended ? 'Attended' : app.status,
      };

      if (isAttended) {
        existing.totalVisits += 1;
        existing.statusPill = 'Attended';
      }
      if (app.treatmentType) {
        existing.modalities.add(app.treatmentType);
      }
      if (appDateStr > existing.lastVisitDate) {
        existing.lastVisitDate = appDateStr;
      }

      patientAttendanceMap.set(p.id, existing);
    });

    const patientsWhoCameList = Array.from(patientAttendanceMap.values())
      .map((entry) => ({
        id: entry.id,
        fullName: entry.fullName,
        phone: entry.phone,
        totalVisits: entry.totalVisits,
        treatmentTypes: Array.from(entry.modalities),
        referringDoctor: entry.referringDoctor,
        lastVisitDate: entry.lastVisitDate,
      }))
      .sort((a, b) => b.totalVisits - a.totalVisits);

    // ─────────────────────────────────────────────────────────────
    // 4. STAFF ATTENDANCE (EVERY STAFF MEMBER & DAY-BY-DAY AUDIT)
    // ─────────────────────────────────────────────────────────────
    const allActiveStaffUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true,
        designation: true,
        role: true,
        department: true,
      },
      orderBy: [
        { role: 'asc' }, // ADMIN first, then PHYSIO
        { fullName: 'asc' },
      ],
    });

    const rawAttendance = await prisma.staffAttendance.findMany({
      where: {
        date: {
          gte: startRange,
          lte: endRange,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            designation: true,
            role: true,
          },
        },
      },
      orderBy: { clockInAt: 'asc' },
    });

    // Calendar setup for target month
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const now = new Date();
    const todayISTStr = new Date(now.getTime() + (5.5 * 3600 * 1000)).toISOString().split('T')[0];
    const weekdaysList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Map records to user and target day (1..daysInMonth)
    const userDateRecordMap = new Map<string, typeof rawAttendance>();
    const monthFilteredRecords: typeof rawAttendance = [];

    rawAttendance.forEach((att) => {
      const d = new Date(att.date);
      let recordDay: number | null = null;

      if (d.getUTCFullYear() === targetYear && (d.getUTCMonth() + 1) === targetMonth) {
        recordDay = d.getUTCDate();
      } else {
        const ist = new Date(d.getTime() + (5.5 * 3600 * 1000));
        if (ist.getUTCFullYear() === targetYear && (ist.getUTCMonth() + 1) === targetMonth) {
          recordDay = ist.getUTCDate();
        }
      }

      if (recordDay !== null && recordDay >= 1 && recordDay <= daysInMonth) {
        const recordDateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(recordDay).padStart(2, '0')}`;
        const key = `${att.userId}_${recordDateStr}`;
        if (!userDateRecordMap.has(key)) userDateRecordMap.set(key, []);
        userDateRecordMap.get(key)!.push(att);
        monthFilteredRecords.push(att);
      }
    });

    // Compute working days elapsed and clinic daily summary
    let totalWorkingDaysInMonth = 0;
    let workingDaysElapsed = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(Date.UTC(targetYear, targetMonth - 1, day));
      const dayOfWeek = dayDate.getUTCDay();
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSunday = dayOfWeek === 0;
      const isUpcoming = dateStr > todayISTStr;

      if (!isSunday) {
        totalWorkingDaysInMonth++;
        if (!isUpcoming) {
          workingDaysElapsed++;
        }
      }
    }

    // Daily Clinic Roster Heatmap
    const dailyClinicRoster: Array<{
      day: number;
      date: string;
      weekday: string;
      isSunday: boolean;
      isUpcoming: boolean;
      presentCount: number;
      absentCount: number;
      offCount: number;
      totalHours: number;
    }> = [];

    let clinicTotalHoursMinutes = 0;
    let clinicTotalPresentShifts = 0;

    const staffSummaries: StaffMemberAttendance[] = allActiveStaffUsers.map((user) => {
      let daysPresent = 0;
      let daysAbsent = 0;
      let daysOff = 0;
      let daysUpcoming = 0;
      let userTotalMinutes = 0;
      let userWorkingDaysInPeriod = 0;
      const dailyMatrix: StaffDailyItem[] = [];
      const userShiftRecords: StaffShiftRecord[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(Date.UTC(targetYear, targetMonth - 1, day));
        const dayOfWeek = dayDate.getUTCDay();
        const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isSunday = dayOfWeek === 0;
        const isUpcoming = dateStr > todayISTStr;
        const isWorkingDay = !isSunday;

        if (!isUpcoming && isWorkingDay) {
          userWorkingDaysInPeriod++;
        }

        const dayRecs = userDateRecordMap.get(`${user.id}_${dateStr}`) || [];
        let status: 'PRESENT' | 'ABSENT' | 'OFF' | 'UPCOMING' = 'ABSENT';
        let dayMinutes = 0;
        let earliestClockIn: string | null = null;
        let latestClockOut: string | null = null;
        let shiftNotes: string | null = null;

        if (dayRecs.length > 0) {
          status = 'PRESENT';
          daysPresent++;
          dayRecs.forEach((r) => {
            const inT = new Date(r.clockInAt).getTime();
            const outT = r.clockOutAt ? new Date(r.clockOutAt).getTime() : inT + 4 * 3600 * 1000;
            const diffMins = Math.max(15, Math.min(720, Math.round((outT - inT) / (60 * 1000))));
            dayMinutes += diffMins;
            userTotalMinutes += diffMins;

            if (!earliestClockIn || new Date(r.clockInAt) < new Date(earliestClockIn)) {
              earliestClockIn = r.clockInAt.toISOString();
            }
            if (r.clockOutAt && (!latestClockOut || new Date(r.clockOutAt) > new Date(latestClockOut))) {
              latestClockOut = r.clockOutAt.toISOString();
            }
            if (r.notes && !shiftNotes) {
              shiftNotes = r.notes;
            }

            userShiftRecords.push({
              id: r.id,
              date: dateStr,
              clockInAt: r.clockInAt.toISOString(),
              clockOutAt: r.clockOutAt ? r.clockOutAt.toISOString() : null,
              durationHours: parseFloat((diffMins / 60).toFixed(1)),
              notes: r.notes,
            });
          });
        } else if (isUpcoming) {
          status = 'UPCOMING';
          daysUpcoming++;
        } else if (isSunday) {
          status = 'OFF';
          daysOff++;
        } else {
          status = 'ABSENT';
          daysAbsent++;
        }

        dailyMatrix.push({
          day,
          date: dateStr,
          weekday: weekdaysList[dayOfWeek],
          isSunday,
          isWorkingDay,
          status,
          hours: parseFloat((dayMinutes / 60).toFixed(1)),
          clockInAt: earliestClockIn,
          clockOutAt: latestClockOut,
          notes: shiftNotes,
          shiftCount: dayRecs.length,
        });
      }

      const totalHours = parseFloat((userTotalMinutes / 60).toFixed(1));
      const avgHoursPerDay = daysPresent > 0 ? parseFloat((totalHours / daysPresent).toFixed(1)) : 0;
      const avgHoursAcrossWorkingDays = userWorkingDaysInPeriod > 0 ? parseFloat((totalHours / userWorkingDaysInPeriod).toFixed(1)) : 0;
      const attendanceRate = userWorkingDaysInPeriod > 0
        ? Math.min(100, Math.round((daysPresent / userWorkingDaysInPeriod) * 100))
        : (daysPresent > 0 ? 100 : 0);

      clinicTotalHoursMinutes += userTotalMinutes;
      clinicTotalPresentShifts += daysPresent;

      // Sort recent shifts in descending order
      const sortedShifts = [...userShiftRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
        userId: user.id,
        name: formatStaffName(user),
        email: user.email || '',
        role: user.role,
        designation: user.designation || (user.role === 'ADMIN' ? 'Clinic Director & Physio' : 'Staff Physiotherapist'),
        department: user.department,
        daysPresent,
        daysAbsent,
        daysOff,
        daysUpcoming,
        totalWorkingDaysInPeriod: userWorkingDaysInPeriod,
        attendanceRate,
        totalHours,
        avgHoursPerDay,
        avgHoursAcrossWorkingDays,
        totalShifts: userShiftRecords.length,
        dailyMatrix,
        recentShifts: sortedShifts.slice(0, 15),
        records: sortedShifts.slice(0, 10),
        avgHoursPerShift: avgHoursPerDay,
      };
    }).sort((a, b) => {
      if (b.daysPresent !== a.daysPresent) return b.daysPresent - a.daysPresent;
      return b.totalHours - a.totalHours;
    });

    // Populate daily clinic roster summary
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(Date.UTC(targetYear, targetMonth - 1, day));
      const dayOfWeek = dayDate.getUTCDay();
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSunday = dayOfWeek === 0;
      const isUpcoming = dateStr > todayISTStr;

      let presentCount = 0;
      let absentCount = 0;
      let offCount = 0;
      let dayHours = 0;

      staffSummaries.forEach((staff) => {
        const item = staff.dailyMatrix[day - 1];
        if (item) {
          if (item.status === 'PRESENT') {
            presentCount++;
            dayHours += item.hours;
          } else if (item.status === 'ABSENT') {
            absentCount++;
          } else if (item.status === 'OFF') {
            offCount++;
          }
        }
      });

      dailyClinicRoster.push({
        day,
        date: dateStr,
        weekday: weekdaysList[dayOfWeek],
        isSunday,
        isUpcoming,
        presentCount,
        absentCount,
        offCount,
        totalHours: parseFloat(dayHours.toFixed(1)),
      });
    }

    const totalStaffShifts = monthFilteredRecords.length;
    const totalStaffHours = parseFloat((clinicTotalHoursMinutes / 60).toFixed(1));
    const clinicAvgHoursPerDay = clinicTotalPresentShifts > 0
      ? parseFloat((totalStaffHours / clinicTotalPresentShifts).toFixed(1))
      : 0;

    const totalExpectedWorkingDaysAllStaff = workingDaysElapsed * allActiveStaffUsers.length;
    const overallAttendanceRate = totalExpectedWorkingDaysAllStaff > 0
      ? Math.min(100, Math.round((clinicTotalPresentShifts / totalExpectedWorkingDaysAllStaff) * 100))
      : 0;

    const clinicAttendanceOverview = {
      totalStaffCount: allActiveStaffUsers.length,
      totalWorkingDaysInMonth,
      workingDaysElapsed,
      totalShiftsLogged: totalStaffShifts,
      totalHoursClocked: totalStaffHours,
      clinicAvgHoursPerDay,
      overallAttendanceRate,
      daysInMonth,
      targetMonth,
      targetYear,
      dailyClinicRoster,
    };

    // ─────────────────────────────────────────────────────────────
    // 5. DROP-OUTS (MISSED SESSIONS & STALLED PACKAGES)
    // ─────────────────────────────────────────────────────────────
    // A: Patients with NO_SHOW or CANCELLED appointments in this month who have not had a subsequent completed appointment
    const dropoutsMap = new Map<string, {
      patientId: string;
      fullName: string;
      phone: string;
      referringDoctor: string;
      reason: string;
      treatmentType: string;
      date: string;
      type: 'NO_SHOW' | 'CANCELLED' | 'STALLED_COURSE';
      unusedSessions?: number;
    }>();

    // Check no-shows & cancellations
    appointments
      .filter((a) => a.status === 'NO_SHOW' || a.status === 'CANCELLED')
      .forEach((a) => {
        if (!a.patient) return;
        // Check if patient had any completed visit after this date
        const hasCompletedLater = appointments.some(
          (other) => other.patientId === a.patientId &&
            other.status === 'COMPLETED' &&
            new Date(other.date).getTime() >= new Date(a.date).getTime()
        );

        if (!hasCompletedLater) {
          dropoutsMap.set(a.patientId, {
            patientId: a.patientId,
            fullName: a.patient.fullName,
            phone: a.patient.phone || '',
            referringDoctor: a.patient.referringDoctor || 'Self / Direct',
            reason: a.status === 'NO_SHOW'
              ? `Missed session (No-Show on ${new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}) — not rebooked`
              : `Appointment cancelled on ${new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — no follow-up scheduled`,
            treatmentType: a.treatmentType || 'Consultation',
            date: new Date(a.date).toISOString().split('T')[0],
            type: a.status as 'NO_SHOW' | 'CANCELLED',
          });
        }
      });

    // B: Active packages with unused sessions where patient has not visited clinic in the last 14 days of the target month
    const activePackages = await prisma.patientPackage.findMany({
      where: { status: 'ACTIVE' },
      include: {
        patient: {
          select: { id: true, fullName: true, phone: true, referringDoctor: true }
        },
        plan: { select: { name: true } }
      }
    });

    const monthEndTimestamp = endOfMonthUTC.getTime();
    activePackages.forEach((pkg) => {
      const unused = pkg.daysPurchased - pkg.sessionsUsed;
      if (unused > 0 && pkg.patient) {
        // If not already in dropouts, check their last appointment
        if (!dropoutsMap.has(pkg.patient.id)) {
          const patientApps = appointments.filter((a) => a.patientId === pkg.patient.id && a.status === 'COMPLETED');
          const lastApp = patientApps[0]; // sorted desc
          const lastDate = lastApp ? new Date(lastApp.date).getTime() : 0;
          const daysSinceVisit = lastDate > 0 ? Math.round((monthEndTimestamp - lastDate) / (24 * 3600 * 1000)) : 30;

          if (daysSinceVisit >= 12) {
            dropoutsMap.set(pkg.patient.id, {
              patientId: pkg.patient.id,
              fullName: pkg.patient.fullName,
              phone: pkg.patient.phone || '',
              referringDoctor: pkg.patient.referringDoctor || 'Self / Direct',
              reason: `Stalled Treatment Plan: ${unused} session${unused !== 1 ? 's' : ''} unused (${pkg.plan?.name || 'Package'}). No visit in ${daysSinceVisit} days.`,
              treatmentType: pkg.plan?.name || 'Treatment Course',
              date: lastApp ? new Date(lastApp.date).toISOString().split('T')[0] : 'No recent visit',
              type: 'STALLED_COURSE',
              unusedSessions: unused,
            });
          }
        }
      }
    });

    const dropoutsList = Array.from(dropoutsMap.values());

    // ─────────────────────────────────────────────────────────────
    // 6. REFERRED DOCTOR NAME BREAKDOWN
    // ─────────────────────────────────────────────────────────────
    const doctorPatientsMap: Record<string, Set<string>> = {};
    let totalDoctorReferred = 0;
    let selfDirectCount = 0;

    appointments.forEach((a) => {
      if (!a.patient) return;
      const rawDoc = (a.patient.referringDoctor || '').trim();
      const isSelf = !rawDoc ||
        rawDoc.toLowerCase() === 'self' ||
        rawDoc.toLowerCase() === 'walk-in' ||
        rawDoc.toLowerCase() === 'direct' ||
        rawDoc.toLowerCase() === 'none' ||
        rawDoc.toLowerCase() === 'google' ||
        rawDoc.toLowerCase() === 'website';

      if (isSelf) {
        selfDirectCount++;
      } else {
        totalDoctorReferred++;
        if (!doctorPatientsMap[rawDoc]) {
          doctorPatientsMap[rawDoc] = new Set();
        }
        doctorPatientsMap[rawDoc].add(a.patient.fullName);
      }
    });

    const referringDoctorsList = Object.entries(doctorPatientsMap)
      .map(([doctorName, patientSet]) => ({
        doctorName,
        count: patientSet.size,
        patientNames: Array.from(patientSet),
        percentage: totalDoctorReferred > 0 ? Math.round((patientSet.size / totalDoctorReferred) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ─────────────────────────────────────────────────────────────
    // 7. AVAILABLE MONTHS CALCULATION
    // ─────────────────────────────────────────────────────────────
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
        upiPercentage,
        cashPercentage,
        avgPerSession: completedAppointments > 0 ? Math.round(totalCollected / completedAppointments) : 0,
        recentPayments: payments.slice(0, 15).map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          mode: p.paymentMode,
          date: p.date,
          patientName: p.invoice?.patient?.fullName || 'Walk-in Patient',
          patientPhone: p.invoice?.patient?.phone || '',
          invoiceNumber: p.invoice?.invoiceNumber || '',
        })),
      },
      sessions: {
        total: totalAppointments,
        completed: completedAppointments,
        noShow: noShowAppointments,
        cancelled: cancelledAppointments,
        scheduled: scheduledAppointments,
        completionRate,
        modalities: modalityBreakdown,
      },
      patientsWhoCame: {
        totalUnique: patientsWhoCameList.length,
        list: patientsWhoCameList,
      },
      staffAttendance: {
        totalShifts: totalStaffShifts,
        totalHours: totalStaffHours,
        activeStaffCount: allActiveStaffUsers.length,
        overview: clinicAttendanceOverview,
        staffList: staffSummaries,
      },
      dropouts: {
        count: dropoutsList.length,
        list: dropoutsList,
      },
      referringDoctors: {
        totalDoctors: referringDoctorsList.length,
        totalReferredPatients: totalDoctorReferred,
        selfDirectCount,
        list: referringDoctorsList,
      },
      availableMonths,
    });
  } catch (error: any) {
    console.error('Failed to fetch monthly analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch monthly analytics' }, { status: 500 });
  }
}
