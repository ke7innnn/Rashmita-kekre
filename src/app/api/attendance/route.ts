import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
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
      // Default to rashmita or first staff member
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
        date: todayStart,
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
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { action, username, notes } = body;

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

    if (action === 'clockIn') {
      // Check if already clocked in
      const existing = await prisma.staffAttendance.findFirst({
        where: {
          userId: targetUser.id,
          date: todayStart,
          clockOutAt: null,
        }
      });

      if (existing) {
        return NextResponse.json({ error: 'Already clocked in for today.' }, { status: 400 });
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
          date: todayStart,
          clockOutAt: null,
        },
        orderBy: { clockInAt: 'desc' }
      });

      if (!activeRecord) {
        return NextResponse.json({ error: 'No active clock-in found for today.' }, { status: 400 });
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
