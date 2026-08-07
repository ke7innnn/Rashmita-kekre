import { NextRequest, NextResponse } from 'next/server';
import { generateDailyMetricSnapshot } from '@/lib/insights/engine';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.INSIGHTS_CRON_SECRET || 'your-cron-secret-bearer-token';

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized bearer token' }, { status: 401 });
  }

  try {
    const snapshot = await generateDailyMetricSnapshot(new Date());
    return NextResponse.json({
      success: true,
      message: 'Daily metric snapshot generated successfully',
      snapshotId: snapshot.id,
      date: snapshot.date
    });
  } catch (error: any) {
    console.error('Cron error generating metric snapshot:', error);
    return NextResponse.json({ error: 'Failed to generate metric snapshot' }, { status: 500 });
  }
}
