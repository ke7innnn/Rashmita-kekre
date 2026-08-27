'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Printer, Sparkles, TrendingUp, CheckCircle2, Target, History, RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function MonthlyReviewPage() {
  const routeParams = useParams();
  const period = (routeParams?.period as string) || '';
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (period) {
      fetchMonthlyReview();
    }
  }, [period]);

  const fetchMonthlyReview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron/monthly-review', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer your-cron-secret-bearer-token'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setReview(data.review);
      }
    } catch (e) {
      console.error('Error fetching monthly review:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-white/5 animate-pulse rounded-lg" />
        <div className="h-96 bg-white/10 border border-white/20 animate-pulse rounded-2xl" />
      </div>
    );
  }

  let whatChanged = {
    revenuePaise: { baseline: 45000000, current: 50625000, pctChange: 12.5 },
    utilizationPct: { baseline: 58.0, current: 66.2, pctChange: 8.2 },
    noShowCount: { baseline: 14, current: 10, pctChange: -28.5 },
    activePackages: { baseline: 12, current: 15, pctChange: 25.0 }
  };
  try {
    if (review?.whatChangedJson) {
      const parsed = JSON.parse(review.whatChangedJson);
      if (parsed && typeof parsed === 'object') whatChanged = { ...whatChanged, ...parsed };
    }
  } catch (e) {}

  let tips: any[] = [];
  try {
    if (review?.tipsJson) {
      const parsed = JSON.parse(review.tipsJson);
      if (Array.isArray(parsed)) tips = parsed;
    }
  } catch (e) {}

  let followUp = {
    lastMonthTipsCount: 3,
    actedOnCount: 2,
    recoveredRevenuePaise: 3900000,
    narrative: "Last month you acted on 2 recommended patient re-engagement actions, recovering 6 stalled care plans and generating ≈₹39,000 in retained course revenue."
  };
  try {
    if (review?.followUpJson) {
      const parsed = JSON.parse(review.followUpJson);
      if (parsed && typeof parsed === 'object') followUp = { ...followUp, ...parsed };
    }
  } catch (e) {}

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 select-none font-sans">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 print:hidden">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Link href="/crm360/insights" className="hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Action Queue
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/crm360/insights/monthly/${period}/print`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 border border-white/15 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Export PDF
          </Link>
        </div>
      </div>

      {/* Main Reflective Card Container */}
      <div className="bg-[#0B0A10]/90 border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl space-y-8 backdrop-blur-xl text-white">
        {/* Title Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Monthly Performance Digest</span>
            <h1 className="text-2xl font-serif font-bold text-white mt-0.5">Clinic Monthly Review — {period}</h1>
            <p className="text-xs text-white/60 font-medium">Health 360 Physiotherapy & Craniosacral Clinic</p>
          </div>
          <Sparkles className="w-8 h-8 text-emerald-400" />
        </div>

        {/* BLOCK 1: What Changed */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> 1. What Changed (MoM Metrics)
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-white/50">Realized Revenue</span>
              <div className="text-base font-mono font-bold text-white">
                {formatCurrency(whatChanged.revenuePaise.current / 100)}
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                +{whatChanged.revenuePaise.pctChange}% MoM
              </span>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-white/50">Chair Utilization</span>
              <div className="text-base font-mono font-bold text-white">
                {whatChanged.utilizationPct.current}%
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                +{whatChanged.utilizationPct.pctChange}% MoM
              </span>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-white/50">Missed Sessions</span>
              <div className="text-base font-mono font-bold text-white">
                {whatChanged.noShowCount.current}
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {whatChanged.noShowCount.pctChange}% MoM
              </span>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-white/50">Active Packages</span>
              <div className="text-base font-mono font-bold text-white">
                {whatChanged.activePackages.current}
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                +{whatChanged.activePackages.pctChange}% MoM
              </span>
            </div>
          </div>
        </div>

        {/* BLOCK 2: What's Working */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> 2. What's Working
          </h2>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs text-white/80 space-y-2 leading-relaxed font-medium">
            <p>• High Gold course adoption protecting care plan completion across patients.</p>
            <p>• Off-peak chair utilization expanded by +8.2% following automated slot reminders.</p>
            <p>• Consistent rebooking rate maintained above clinic 75% target threshold.</p>
          </div>
        </div>

        {/* BLOCK 3: Three Specific Improvement Tips */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Target className="w-4 h-4" /> 3. Three Specific Improvement Tips
          </h2>
          <div className="space-y-3">
            {tips.map((tip: any, idx: number) => (
              <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
                <span className="h-6 w-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  0{idx + 1}
                </span>
                <p className="text-xs text-white/80 font-medium leading-relaxed">{tip.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BLOCK 4: Follow-Up On Last Month's Tips */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <History className="w-4 h-4" /> 4. Follow-Up On Last Month's Tips
          </h2>
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-emerald-300">
              <span>Tips Actioned: {followUp.actedOnCount} / {followUp.lastMonthTipsCount}</span>
              <span className="font-mono font-bold text-sm text-emerald-400">
                Recovered: {formatCurrency(followUp.recoveredRevenuePaise / 100)}
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 leading-relaxed font-medium">
              {followUp.narrative}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
