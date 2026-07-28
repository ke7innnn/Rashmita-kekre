import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

async function checkStaffDocumentAccess(targetUserId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null, user: null, role: null };
  }

  const user = session.user as any;
  const userRole: Role = user.role === 'admin' || user.role === Role.ADMIN ? Role.ADMIN : Role.PHYSIO;
  const currentUserId = user.id;

  // ADMIN can access any staff member's documents
  if (userRole === Role.ADMIN) {
    return { errorResponse: null, session, user, role: userRole };
  }

  // PHYSIO can ONLY access their own documents (matching user.id or matching username/id)
  if (userRole === Role.PHYSIO) {
    const isSelf = currentUserId === targetUserId || user.username === targetUserId;
    if (!isSelf) {
      return { 
        errorResponse: NextResponse.json({ error: 'Forbidden. You can only access your own documents.' }, { status: 403 }), 
        session, 
        user, 
        role: userRole 
      };
    }
  }

  return { errorResponse: null, session, user, role: userRole };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params;
  const { errorResponse } = await checkStaffDocumentAccess(targetUserId);
  if (errorResponse) return errorResponse;

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ id: targetUserId }, { username: targetUserId }] },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const documents = await prisma.staffDocument.findMany({
      where: { userId: user.id },
      orderBy: [
        { expiryDate: 'asc' },
        { uploadedAt: 'desc' }
      ]
    });

    const now = new Date();
    const formatted = documents.map(doc => {
      let isExpired = false;
      let isExpiringSoon = false;
      let daysRemaining = null;

      if (doc.expiryDate) {
        const exp = new Date(doc.expiryDate);
        daysRemaining = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (daysRemaining <= 0) {
          isExpired = true;
        } else if (daysRemaining <= 60) {
          isExpiringSoon = true;
        }
      }

      return {
        ...doc,
        isExpired,
        isExpiringSoon,
        daysRemaining
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching staff documents:', error);
    return NextResponse.json({ error: 'Failed to fetch staff documents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentUserRole = (session.user as any).role;
  if (currentUserRole !== 'ADMIN' && currentUserRole !== Role.ADMIN && currentUserRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden. Only ADMIN can upload staff documents.' }, { status: 403 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { OR: [{ id: targetUserId }, { username: targetUserId }] }
    });

    if (!user) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const body = await req.json();
    const { fileName, fileUrl, fileSize, mimeType, documentType, issueDate, expiryDate, notes } = body;

    if (!fileName || !fileUrl || !documentType) {
      return NextResponse.json({ error: 'fileName, fileUrl, and documentType are required' }, { status: 400 });
    }

    const doc = await prisma.staffDocument.create({
      data: {
        userId: user.id,
        fileName,
        fileUrl,
        fileSize: fileSize || 0,
        mimeType: mimeType || 'application/octet-stream',
        documentType,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes: notes || null,
        uploadedBy: (session.user as any).username || 'Admin'
      }
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    console.error('Error creating staff document:', error);
    return NextResponse.json({ error: 'Failed to upload staff document' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentUserRole = (session.user as any).role;
  if (currentUserRole !== 'ADMIN' && currentUserRole !== Role.ADMIN && currentUserRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden. Only ADMIN can delete staff documents.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'documentId parameter is required' }, { status: 400 });
    }

    await prisma.staffDocument.delete({
      where: { id: documentId }
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting staff document:', error);
    return NextResponse.json({ error: 'Failed to delete staff document' }, { status: 500 });
  }
}
