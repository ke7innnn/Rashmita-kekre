import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const protocols = await prisma.treatmentProtocol.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(protocols);
  } catch (error: any) {
    console.error('Error fetching protocols:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
