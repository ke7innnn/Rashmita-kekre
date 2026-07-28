import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const invite = await prisma.staffInvite.findUnique({
      where: { token }
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });
    }

    if (invite.isUsed) {
      return NextResponse.json({ error: 'This invite link has already been used' }, { status: 400 });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      invite: {
        email: invite.email,
        name: invite.name,
        role: invite.role,
        designation: invite.designation
      }
    });
  } catch (error: any) {
    console.error('Error validating staff invite token:', error);
    return NextResponse.json({ error: 'Failed to validate invite token' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, username, password } = body;

    if (!token || !username || !password) {
      return NextResponse.json({ error: 'Token, username, and password are required' }, { status: 400 });
    }

    const invite = await prisma.staffInvite.findUnique({
      where: { token }
    });

    if (!invite || invite.isUsed || new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired invite token' }, { status: 400 });
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });
    if (existingUsername) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          email: invite.email,
          phone: invite.phone,
          role: invite.role,
          designation: invite.designation,
          isActive: true,
          joinedDate: new Date()
        }
      }),
      prisma.staffInvite.update({
        where: { id: invite.id },
        data: { isUsed: true }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error accepting staff invite:', error);
    return NextResponse.json({ error: 'Failed to create staff account' }, { status: 500 });
  }
}
