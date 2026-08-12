import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';
import crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const staffMembers = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        department: true,
        employmentType: true,
        employeeId: true,
        profilePhotoUrl: true,
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
    const {
      mode, // 'direct' or 'invite' (default: 'invite' for backward compat)
      name, fullName, email, phone, role, designation,
      dateOfBirth, employeeId, department, employmentType,
      profilePhotoUrl, aadhaarNumber, joinedDate
    } = body;

    // ─── Direct Employee Creation ───
    if (mode === 'direct') {
      const displayName = fullName || name;
      if (!displayName) {
        return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
      }

      // Auto-generate username from name
      const baseUsername = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
      let username = baseUsername;
      let attempt = 0;
      while (true) {
        const existing = await prisma.user.findUnique({ where: { username } });
        if (!existing) break;
        attempt++;
        username = `${baseUsername}${attempt}`;
      }

      // Check email uniqueness if provided
      if (email) {
        const existingEmail = await prisma.user.findFirst({ where: { email } });
        if (existingEmail) {
          return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 400 });
        }
      }

      // Check employeeId uniqueness if provided
      if (employeeId) {
        const existingEmpId = await prisma.user.findUnique({ where: { employeeId } });
        if (existingEmpId) {
          return NextResponse.json({ error: 'This Employee ID is already in use' }, { status: 400 });
        }
      }

      // Default password: "health360" — employee must change on first login
      const defaultPassword = hashPassword('health360');

      const user = await prisma.user.create({
        data: {
          username,
          password: defaultPassword,
          fullName: displayName,
          email: email || null,
          phone: phone || null,
          role: role === 'ADMIN' ? Role.ADMIN : Role.PHYSIO,
          designation: designation || 'Physiotherapist',
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          employeeId: employeeId || null,
          department: department || null,
          employmentType: employmentType || 'Full-Time',
          profilePhotoUrl: profilePhotoUrl || null,
          aadhaarNumber: aadhaarNumber || null,
          joinedDate: joinedDate ? new Date(joinedDate) : new Date(),
          isActive: true
        }
      });

      const { password: _, aadhaarNumber: aadhaar, ...safeUser } = user;

      return NextResponse.json({
        user: {
          ...safeUser,
          aadhaarMasked: aadhaar ? `XXXX-XXXX-${aadhaar.replace(/\D/g, '').slice(-4)}` : null
        },
        generatedUsername: username,
        defaultPassword: 'health360'
      }, { status: 201 });
    }

    // ─── Invite Flow (original behavior) ───
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
    console.error('Error creating staff member:', error);
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
  }
}
