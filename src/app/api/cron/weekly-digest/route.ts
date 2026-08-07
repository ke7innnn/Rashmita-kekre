import { NextRequest, NextResponse } from 'next/server';
import { runInsightsPipeline } from '@/lib/insights/engine';
import { InsightPeriodType } from '@prisma/client';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.INSIGHTS_CRON_SECRET || 'your-cron-secret-bearer-token';

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized bearer token' }, { status: 401 });
  }

  try {
    const insights = await runInsightsPipeline(InsightPeriodType.WEEKLY, true);
    return NextResponse.json({
      success: true,
      message: 'Weekly action queue insights generated successfully',
      generatedCount: insights.length,
      insights
    });
  } catch (error: any) {
    console.error('Cron error generating weekly digest:', error);
    return NextResponse.json({ error: 'Failed to generate weekly digest' }, { status: 500 });
  }
}
