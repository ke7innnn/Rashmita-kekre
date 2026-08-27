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

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.referringDoctor.findUnique({
      where: { name: name.trim() }
    });

    if (existing) {
      return NextResponse.json({ error: 'A referring doctor with this name already exists' }, { status: 400 });
    }

    const doctor = await prisma.referringDoctor.create({
      data: {
        name: name.trim(),
        specialty,
        clinic,
        phone,
        email,
      }
    });

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Error creating referring doctor:', error);
    return NextResponse.json({ error: 'Failed to create doctor' }, { status: 500 });
  }
}
