import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const inboxSchema = z.object({
  type: z.enum(['CONTACT', 'REFERRAL', 'CAREERS']),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  message: z.string().optional(),
  metadata: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = inboxSchema.parse(body);

    const message = await prisma.inboxMessage.create({
      data: {
        type: data.type,
        name: data.name,
        email: data.email || 'N/A',
        phone: data.phone || 'N/A',
        message: data.message,
        metadata: data.metadata,
        attachmentUrl: data.attachmentUrl,
      },
    });

    // Automatically create a notification for the admin
    await prisma.notification.create({
      data: {
        title: `New ${data.type} Submission`,
        message: `${data.name} just submitted a new ${data.type.toLowerCase()} request.`,
        type: 'INBOX',
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('Inbox API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit form.' },
      { status: 400 }
    );
  }
}
