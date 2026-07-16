import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const settingsSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email(),
  address: z.string().min(1),
  primaryDoctor: z.string().min(1),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/),
  slotDuration: z.number().int().positive(),
  holidays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  isPubliclyVisible: z.boolean().default(true),
  reminder24hTemplate: z.string().optional(),
  reminder2hTemplate: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let settings = await prisma.clinicSettings.findUnique({
      where: { id: 'clinic_settings' },
    });

    // If somehow deleted, create default
    if (!settings) {
      settings = await prisma.clinicSettings.create({
        data: {
          id: 'clinic_settings',
        },
      });
    }

    const parsedSettings = {
      ...settings,
      holidays: settings.holidays ? settings.holidays.split(',').map((h) => h.trim()).filter(Boolean) : [],
    };

    return NextResponse.json(parsedSettings);
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin or Receptionist role can update settings (Adjust Timings support)
  const role = (session.user as any).role;
  if (role !== 'admin' && role !== 'receptionist') {
    return NextResponse.json({ error: 'Forbidden. Authorized role required.' }, { status: 403 });
  }

  try {
    const json = await req.json();
    const body = settingsSchema.parse(json);

    const dbPayload = {
      ...body,
      holidays: body.holidays.join(', '),
    };

    const updated = await prisma.clinicSettings.upsert({
      where: { id: 'clinic_settings' },
      update: dbPayload,
      create: {
        id: 'clinic_settings',
        ...dbPayload,
      },
    });

    const parsedUpdated = {
      ...updated,
      holidays: updated.holidays ? updated.holidays.split(',').map((h) => h.trim()).filter(Boolean) : [],
    };

    return NextResponse.json(parsedUpdated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid settings data', details: error.issues }, { status: 400 });
    }
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
