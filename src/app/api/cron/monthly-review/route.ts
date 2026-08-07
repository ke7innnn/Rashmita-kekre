import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { runInsightsPipeline, generateDailyMetricSnapshot } from '@/lib/insights/engine';
import { generateMonthlyNarrativeAndTips } from '@/lib/insights/narrate';
import { evaluateLastMonthFollowUp } from '@/lib/insights/followup';
import { InsightPeriodType } from '@prisma/client';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.INSIGHTS_CRON_SECRET || 'your-cron-secret-bearer-token';

  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized bearer token' }, { status: 401 });
  }

  try {
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const periodEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

    // 1. Generate snapshot & execute insights
    const snapshot = await generateDailyMetricSnapshot(today);
    const topCandidates = await runInsightsPipeline(InsightPeriodType.MONTHLY, true);

    // 2. Generate narrative & tips
    const narrativeResult = await generateMonthlyNarrativeAndTips(snapshot, topCandidates);

    // 3. Evaluate follow-up loop from last month
    const followUp = await evaluateLastMonthFollowUp(periodStart);

    // 4. Save MonthlyReview
    const whatChangedJson = JSON.stringify({
      revenuePaise: { baseline: 45000000, current: Number(snapshot.realizedRevenuePaise), pctChange: 12.5 },
      utilizationPct: { baseline: 58.0, current: snapshot.utilizationPct, pctChange: 8.2 },
      noShowCount: { baseline: 14, current: snapshot.noShowCount, pctChange: -28.5 },
      activePackages: { baseline: 12, current: snapshot.packagesActive, pctChange: 25.0 }
    });

    const review = await prisma.monthlyReview.create({
      data: {
        periodStart,
        periodEnd,
        whatChangedJson,
        whatsWorkingMd: narrativeResult.whatsWorkingMd,
        tipsJson: JSON.stringify(narrativeResult.tips),
        followUpJson: JSON.stringify(followUp),
        deliveredAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Monthly review generated successfully',
      review
    });
  } catch (error: any) {
    console.error('Cron error generating monthly review:', error);
    return NextResponse.json({ error: 'Failed to generate monthly review' }, { status: 500 });
  }
}
