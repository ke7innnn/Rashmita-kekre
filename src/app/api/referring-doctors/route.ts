import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doctors = await prisma.referringDoctor.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Error fetching referring doctors:', error);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, specialty, clinic, phone, email } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : null;

    // Check if already exists
    const existing = await prisma.referringDoctor.findUnique({
      where: { name: cleanName }
    });

    if (existing) {
      // If exists, update with any new phone/clinic/specialty provided
      const updated = await prisma.referringDoctor.update({
        where: { id: existing.id },
        data: {
          ...(specialty && { specialty }),
          ...(clinic && { clinic }),
          ...(cleanPhone && { phone: cleanPhone }),
          ...(email && { email }),
        }
      });
      return NextResponse.json(updated);
    }

    const doctor = await prisma.referringDoctor.create({
      data: {
        name: cleanName,
        specialty: specialty || 'General Practice',
        clinic: clinic || 'General Clinic',
        phone: cleanPhone,
        email: email || null,
      }
    });

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Error creating referring doctor:', error);
    return NextResponse.json({ error: 'Failed to create doctor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, oldName, name, specialty, clinic, phone, email } = body;

    const cleanPhone = phone ? phone.replace(/\D/g, '').slice(-10) : undefined;
    const cleanName = name ? name.trim() : undefined;

    let doctor;

    if (id) {
      doctor = await prisma.referringDoctor.update({
        where: { id },
        data: {
          ...(cleanName && { name: cleanName }),
          ...(specialty !== undefined && { specialty }),
          ...(clinic !== undefined && { clinic }),
          ...(cleanPhone !== undefined && { phone: cleanPhone }),
          ...(email !== undefined && { email }),
        }
      });
    } else if (oldName || cleanName) {
      const lookupName = (oldName || cleanName)!.trim();
      const existing = await prisma.referringDoctor.findFirst({
        where: {
          name: {
            equals: lookupName,
            mode: 'insensitive'
          }
        }
      });

      if (existing) {
        doctor = await prisma.referringDoctor.update({
          where: { id: existing.id },
          data: {
            ...(cleanName && { name: cleanName }),
            ...(specialty !== undefined && { specialty }),
            ...(clinic !== undefined && { clinic }),
            ...(cleanPhone !== undefined && { phone: cleanPhone }),
            ...(email !== undefined && { email }),
          }
        });
      } else {
        doctor = await prisma.referringDoctor.create({
          data: {
            name: cleanName || lookupName,
            specialty: specialty || 'General Practice',
            clinic: clinic || 'General Clinic',
            phone: cleanPhone || null,
            email: email || null,
          }
        });
      }
    } else {
      return NextResponse.json({ error: 'Doctor ID or Name required for update' }, { status: 400 });
    }

    // If the doctor name changed, sync all patient records that had the old doctor name
    if (oldName && cleanName && oldName.trim().toLowerCase() !== cleanName.toLowerCase()) {
      await prisma.patient.updateMany({
        where: {
          referringDoctor: {
            equals: oldName.trim(),
            mode: 'insensitive'
          }
        },
        data: {
          referringDoctor: cleanName
        }
      });
    }

    return NextResponse.json({ success: true, doctor });
  } catch (error: any) {
    console.error('Error updating referring doctor:', error);
    return NextResponse.json({ error: error.message || 'Failed to update doctor' }, { status: 500 });
  }
}
