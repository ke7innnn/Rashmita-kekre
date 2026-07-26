import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createAttachmentSchema = z.object({
  name: z.string().min(1, 'Attachment name is required'),
  url: z.string().min(1, 'File URL or data URI is required'),
  fileType: z.string().default('PDF'),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const attachments = await prisma.attachment.findMany({
      where: { patientId: id },
      orderBy: { uploadedAt: 'desc' },
    });
    return NextResponse.json(attachments);
  } catch (error: any) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await req.json();
    const body = createAttachmentSchema.parse(json);

    const attachment = await prisma.attachment.create({
      data: {
        patientId: id,
        name: body.name,
        url: body.url,
        fileType: body.fileType,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid attachment data', details: error.issues }, { status: 400 });
    }
    console.error('Error creating attachment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const attachmentId = searchParams.get('attachmentId');

  if (!attachmentId) {
    return NextResponse.json({ error: 'Attachment ID is required' }, { status: 400 });
  }

  try {
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
