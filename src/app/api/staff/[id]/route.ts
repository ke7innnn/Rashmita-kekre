import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role } from '@prisma/client';

const REQUIRED_DOC_TYPES = ['CV / Resume', 'IAP Certificate', 'MSOTPT', 'Aadhaar'];

function maskAadhaar(aadhaar: string | null | undefined): string | null {
  if (!aadhaar) return null;
  const digits = aadhaar.replace(/\D/g, '');
  if (digits.length < 4) return 'XXXX-XXXX-XXXX';
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ id }, { username: id }] },
      include: {
        documents: {
          orderBy: [{ documentType: 'asc' }, { uploadedAt: 'desc' }]
        },
        _count: {
          select: { attendances: true, assignedAppointments: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Build document status summary
    const now = new Date();
    const documentsByType: Record<string, any[]> = {};

    user.documents.forEach(doc => {
      if (!documentsByType[doc.documentType]) {
        documentsByType[doc.documentType] = [];
      }

      let isExpired = false;
      let isExpiringSoon = false;
      let daysRemaining: number | null = null;

      if (doc.expiryDate) {
        const exp = new Date(doc.expiryDate);
        daysRemaining = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (daysRemaining <= 0) isExpired = true;
        else if (daysRemaining <= 60) isExpiringSoon = true;
      }

      documentsByType[doc.documentType].push({
        ...doc,
        isExpired,
        isExpiringSoon,
        daysRemaining
      });
    });

    // Document status for required types
    const documentStatus = REQUIRED_DOC_TYPES.map(docType => {
      const docs = documentsByType[docType] || [];
      let status: 'uploaded' | 'missing' | 'expired' = 'missing';
      if (docs.length > 0) {
        const hasExpired = docs.some((d: any) => d.isExpired);
        status = hasExpired ? 'expired' : 'uploaded';
      }
      return {
        documentType: docType,
        status,
        count: docs.length,
        documents: docs
      };
    });

    // Add Certificates as a special multi-entry type
    const certs = documentsByType['Certificate'] || [];
    documentStatus.push({
      documentType: 'Certificates',
      status: certs.length > 0 ? 'uploaded' : 'missing',
      count: certs.length,
      documents: certs
    });

    // Mask Aadhaar for response
    const { password, aadhaarNumber, ...safeUser } = user;

    return NextResponse.json({
      ...safeUser,
      aadhaarMasked: maskAadhaar(aadhaarNumber),
      documentStatus,
      documentsByType,
      stats: {
        totalDocuments: user.documents.length,
        attendanceCount: user._count.attendances,
        appointmentCount: user._count.assignedAppointments
      }
    });
  } catch (error: any) {
    console.error('Error fetching staff profile:', error);
    return NextResponse.json({ error: 'Failed to fetch staff profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      fullName, phone, email, dateOfBirth, employeeId,
      designation, department, employmentType, profilePhotoUrl,
      aadhaarNumber, joinedDate, isActive
    } = body;

    const user = await prisma.user.findFirst({
      where: { OR: [{ id }, { username: id }] }
    });

    if (!user) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Check for uniqueness conflicts
    if (employeeId && employeeId !== user.employeeId) {
      const existing = await prisma.user.findUnique({ where: { employeeId } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: 'Employee ID already in use' }, { status: 400 });
      }
    }

    if (email && email !== user.email) {
      const existing = await prisma.user.findFirst({ where: { email } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(employeeId !== undefined && { employeeId }),
        ...(designation !== undefined && { designation }),
        ...(department !== undefined && { department }),
        ...(employmentType !== undefined && { employmentType }),
        ...(profilePhotoUrl !== undefined && { profilePhotoUrl }),
        ...(aadhaarNumber !== undefined && { aadhaarNumber }),
        ...(joinedDate !== undefined && { joinedDate: joinedDate ? new Date(joinedDate) : null }),
        ...(isActive !== undefined && { isActive })
      }
    });

    const { password: _, aadhaarNumber: aadhaar, ...safeUpdated } = updated;

    return NextResponse.json({
      ...safeUpdated,
      aadhaarMasked: maskAadhaar(aadhaar)
    });
  } catch (error: any) {
    console.error('Error updating staff profile:', error);
    return NextResponse.json({ error: 'Failed to update staff profile' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { errorResponse, user: currentUser } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  const { id } = await params;

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ id }, { username: id }] }
    });

    if (!user) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const currentUserId = (currentUser as any).id;
    if (user.id === currentUserId) {
      return NextResponse.json({ error: 'You cannot remove your own account' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.staffAttendance.deleteMany({
        where: { userId: user.id }
      }),
      prisma.user.delete({
        where: { id: user.id }
      })
    ]);

    return NextResponse.json({ success: true, message: 'Staff member removed successfully' });
  } catch (error: any) {
    console.error('Error removing staff member:', error);
    return NextResponse.json({ error: 'Failed to remove staff member' }, { status: 500 });
  }
}
