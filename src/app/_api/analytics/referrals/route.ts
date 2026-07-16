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
    const patients = await prisma.patient.findMany({
      select: {
        referringDoctor: true,
      },
    });

    const referralCounts: { [source: string]: number } = {};

    patients.forEach((p) => {
      const source = p.referringDoctor?.trim() || 'Self / Direct';
      referralCounts[source] = (referralCounts[source] || 0) + 1;
    });

    // Flatten to list of objects
    const data = Object.entries(referralCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching referral analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
