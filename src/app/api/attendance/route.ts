import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * Calculates a realistic auto-clock-out timestamp when staff forgets to clock out.
 * 1. Maximum shift duration limit: 8 hours (480 mins).
 * 2. Clinic operational closing cap: 21:30 (9:30 PM) IST on the day of clock-in.
 * 3. Guarantees no extraordinary 20h+ shifts ever accumulate.
 */
export function calculateAutoClockOut(clockInAt: Date): Date {
  const inMs = clockInAt.getTime();
  const eightHoursLater = new Date(inMs + 8 * 60 * 60 * 1000);

  // In India Standard Time (UTC+5:30):
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const inDateIst = new Date(inMs + istOffsetMs);

  const istYear = inDateIst.getUTCFullYear();
  const istMonth = inDateIst.getUTCMonth();
  const istDay = inDateIst.getUTCDate();

  // 21:30 IST is 16:00 UTC
  const clinicClosingUtc = new Date(Date.UTC(istYear, istMonth, istDay, 16, 0, 0, 0));

  // Auto-out is whichever is earlier: 8 hours later or clinic closing time (21:30 IST)
  if (clinicClosingUtc.getTime() > inMs && clinicClosingUtc.getTime() < eightHoursLater.getTime()) {
    return clinicClosingUtc;
  }
  return eightHoursLater;
}

/**
 * Auto-closes any stale open attendance records where the current time
 * has exceeded the 8-hour shift cap or past clinic closing time.
 */
export async function autoCloseStaleAttendance() {
  try {
    const now = new Date();
    const openRecords = await prisma.staffAttendance.findMany({
      where: { clockOutAt: null }
    });

    for (const rec of openRecords) {
      const inTime = new Date(rec.clockInAt);
      const autoOutTime = calculateAutoClockOut(inTime);

      if (now.getTime() > autoOutTime.getTime()) {
        const existingNotes = rec.notes ? `${rec.notes} • ` : '';
        await prisma.staffAttendance.update({
          where: { id: rec.id },
          data: {
            clockOutAt: autoOutTime,
            notes: `${existingNotes}Auto-clocked out by system (Forgot to clock out • 8h max shift cap)`,
          }
        });
      }
    }
  } catch (err) {
    console.error('Error auto-closing stale attendance:', err);
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Automatically auto-close any stale or forgotten clock-out records before returning data
    await autoCloseStaleAttendance();

    const session = await getServerSession(authOptions);
    let userId: string | null = null;
    let userRole: string = 'PHYSIO';

    if (session?.user) {
      userId = (session.user as any).id;
      userRole = (session.user as any).role || 'PHYSIO';
    }

    // Fallback if session isn't populated (e.g., localStorage session mode)
    const { searchParams } = new URL(req.url);
    const queryUsername = searchParams.get('username');

    if (!userId && queryUsername) {
      const dbUser = await prisma.user.findUnique({ where: { username: queryUsername } });
      if (dbUser) {
        userId = dbUser.id;
        userRole = dbUser.role;
      }
    }

    if (!userId) {
      // Default to first staff member
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
        userRole = firstUser.role;
      }
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'admin';

    // Get today's active attendance record
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const activeRecord = userId ? await prisma.staffAttendance.findFirst({
      where: {
        userId: userId,
        clockOutAt: null,
      },
      orderBy: { clockInAt: 'desc' },
    }) : null;

    // Fetch history
    const whereClause = isAdmin ? {} : (userId ? { userId: userId } : {});
    const history = await prisma.staffAttendance.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, username: true, role: true }
        }
      },
      orderBy: { clockInAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      isClockedIn: !!activeRecord,
      activeRecord: activeRecord,
      history: history,
      userRole: userRole
    });
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Auto-close any stale or forgotten clock-out records first
    await autoCloseStaleAttendance();

    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { action, username, notes, attendanceId, clockOutTime } = body;

    let targetUser = null;

    if (session?.user) {
      targetUser = await prisma.user.findUnique({
        where: { id: (session.user as any).id }
      });
    }

    if (!targetUser && username) {
      targetUser = await prisma.user.findUnique({
        where: { username: username }
      });
    }

    if (!targetUser) {
      targetUser = await prisma.user.findFirst();
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ADMIN FORCE CLOCK-OUT ACTION
    if (action === 'adminClockOut') {
      const callerRole = ((session?.user as any)?.role || targetUser.role || '').toUpperCase();
      if (callerRole !== 'ADMIN') {
        return NextResponse.json({ error: 'Only admins can clock out other staff members.' }, { status: 403 });
      }

      if (!attendanceId) {
        return NextResponse.json({ error: 'Attendance record ID required.' }, { status: 400 });
      }

      const targetRec = await prisma.staffAttendance.findUnique({
        where: { id: attendanceId },
        include: { user: true }
      });

      if (!targetRec) {
        return NextResponse.json({ error: 'Attendance record not found.' }, { status: 404 });
      }

      const effectiveOut = clockOutTime ? new Date(clockOutTime) : new Date();
      const existingNotes = targetRec.notes ? `${targetRec.notes} • ` : '';
      const updatedRecord = await prisma.staffAttendance.update({
        where: { id: attendanceId },
        data: {
          clockOutAt: effectiveOut,
          notes: `${existingNotes}${notes || 'Clocked out by Admin'}`,
        }
      });

      return NextResponse.json({ success: true, record: updatedRecord });
    }

    if (action === 'clockIn') {
      // Check if already clocked in today
      const existing = await prisma.staffAttendance.findFirst({
        where: {
          userId: targetUser.id,
          clockOutAt: null,
        }
      });

      if (existing) {
        return NextResponse.json({ error: 'Already clocked in. Please clock out of your active shift first.' }, { status: 400 });
      }

      const newRecord = await prisma.staffAttendance.create({
        data: {
          userId: targetUser.id,
          clockInAt: new Date(),
          date: todayStart,
          notes: notes || null,
        }
      });

      return NextResponse.json({ success: true, record: newRecord });
    } else if (action === 'clockOut') {
      const activeRecord = await prisma.staffAttendance.findFirst({
        where: {
          userId: targetUser.id,
          clockOutAt: null,
        },
        orderBy: { clockInAt: 'desc' }
      });

      if (!activeRecord) {
        return NextResponse.json({ error: 'No active clock-in found.' }, { status: 400 });
      }

      const updatedRecord = await prisma.staffAttendance.update({
        where: { id: activeRecord.id },
        data: {
          clockOutAt: new Date(),
          notes: notes || activeRecord.notes,
        }
      });

      return NextResponse.json({ success: true, record: updatedRecord });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing attendance POST:', error);
    return NextResponse.json({ error: error.message || 'Failed to update attendance' }, { status: 500 });
  }
}
