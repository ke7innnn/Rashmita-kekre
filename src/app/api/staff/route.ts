import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const staffMembers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        isActive: true,
        joinedDate: true,
        createdAt: true,
        _count: {
          select: { documents: true, attendances: true }
        },
        documents: {
          select: { id: true, documentType: true, expiryDate: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const invites = await prisma.staffInvite.findMany({
      where: { isUsed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const formattedStaff = staffMembers.map(staff => {
      let expiringCount = 0;
      let expiredCount = 0;

      staff.documents.forEach(doc => {
        if (doc.expiryDate) {
          const exp = new Date(doc.expiryDate);
          const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if (diffDays <= 0) {
            expiredCount++;
          } else if (diffDays <= 60) {
            expiringCount++;
          }
        }
      });

      return {
        ...staff,
        expiringCount,
        expiredCount
      };
    });

    return NextResponse.json({
      staff: formattedStaff,
      pendingInvites: invites
    });
  } catch (error: any) {
    console.error('Error fetching staff list:', error);
    return NextResponse.json({ error: 'Failed to fetch staff list' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { name, email, phone, role, designation } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { email }
    });
    if (existingUser) {
      return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 400 });
    }

    // Single-use invite token valid 7 days
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.staffInvite.create({
      data: {
        email,
        name,
        phone: phone || null,
        role: role === 'ADMIN' ? Role.ADMIN : Role.PHYSIO,
        designation: designation || 'Physiotherapist',
        token,
        expiresAt
      }
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const inviteUrl = `${protocol}://${host}/crm360/register-staff?token=${token}`;

    return NextResponse.json({
      invite,
      inviteUrl
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating staff invite:', error);
    return NextResponse.json({ error: 'Failed to create staff invite' }, { status: 500 });
  }
}
