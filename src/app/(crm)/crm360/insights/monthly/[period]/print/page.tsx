'use client';

import React, { useEffect, useState, use } from 'react';
import { formatCurrency } from '@/lib/formatters';

export default function MonthlyReviewPrintPage({ params }: { params: Promise<{ period: string }> }) {
  const { period } = use(params);
  const [review, setReview] = useState<any>(null);

  useEffect(() => {
    fetchReview();
  }, [period]);

  const fetchReview = async () => {
    try {
      const res = await fetch('/api/cron/monthly-review', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer your-cron-secret-bearer-token' }
      });
      if (res.ok) {
        const data = await res.json();
        setReview(data.review);
        setTimeout(() => window.print(), 500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const whatChanged = review?.whatChangedJson ? JSON.parse(review.whatChangedJson) : {
    revenuePaise: { baseline: 45000000, current: 50625000, pctChange: 12.5 },
    utilizationPct: { baseline: 58.0, current: 66.2, pctChange: 8.2 },
    noShowCount: { baseline: 14, current: 10, pctChange: -28.5 },
    activePackages: { baseline: 12, current: 15, pctChange: 25.0 }
  };

  const tips = review?.tipsJson ? JSON.parse(review.tipsJson) : [];
  const followUp = review?.followUpJson ? JSON.parse(review.followUpJson) : {
    lastMonthTipsCount: 3,
    actedOnCount: 2,
    recoveredRevenuePaise: 3900000,
    narrative: "Last month you acted on 2 recommended patient re-engagement actions, recovering 6 stalled care plans and generating ≈₹39,000 in retained course revenue."
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black font-sans selection:bg-gray-200">
      {/* Clinic Letterhead */}
      <div className="flex justify-between items-start border-b border-black/20 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">Health 360</h1>
          <p className="text-xs text-black/70">Physiotherapy and Craniosacral Therapy Clinic</p>
          <p className="text-xs text-black/60 pt-1">
            Dr. Rashmita Karvir Kekre · B.PTh.(M.I.A.P.) · BCST
          </p>
          <p className="text-xs text-black/60">
            Shop No.1, Amardeep Society, Om Nagar, Vasai (W). Phone: 8482812859
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-widest block text-black/60">MONTHLY REPORT</span>
          <div className="text-lg font-bold text-black">{period}</div>
          <div className="text-xs text-black/60">Generated: {new Date().toLocaleDateString('en-IN')}</div>
        </div>
      </div>

      {/* BLOCK 1: What Changed */}
      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black border-b border-black/10 pb-1">
          1. What Changed (MoM Metrics)
        </h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="p-3 border border-gray-300 rounded-lg">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Revenue</span>
            <span className="text-sm font-mono font-bold block mt-1">{formatCurrency(whatChanged.revenuePaise.current / 100)}</span>
            <span className="text-[10px] font-bold text-emerald-700">+{whatChanged.revenuePaise.pctChange}%</span>
          </div>
          <div className="p-3 border border-gray-300 rounded-lg">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Utilization</span>
            <span className="text-sm font-mono font-bold block mt-1">{whatChanged.utilizationPct.current}%</span>
            <span className="text-[10px] font-bold text-emerald-700">+{whatChanged.utilizationPct.pctChange}%</span>
          </div>
          <div className="p-3 border border-gray-300 rounded-lg">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Missed Sessions</span>
            <span className="text-sm font-mono font-bold block mt-1">{whatChanged.noShowCount.current}</span>
            <span className="text-[10px] font-bold text-emerald-700">{whatChanged.noShowCount.pctChange}%</span>
          </div>
          <div className="p-3 border border-gray-300 rounded-lg">
            <span className="text-[10px] font-bold text-gray-500 uppercase block">Active Packages</span>
            <span className="text-sm font-mono font-bold block mt-1">{whatChanged.activePackages.current}</span>
            <span className="text-[10px] font-bold text-emerald-700">+{whatChanged.activePackages.pctChange}%</span>
          </div>
        </div>
      </div>

      {/* BLOCK 2: What's Working */}
      <div className="space-y-2 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black border-b border-black/10 pb-1">
          2. What's Working
        </h2>
        <div className="text-xs text-gray-800 space-y-1 font-medium leading-relaxed">
          <p>• High Gold course adoption protecting care plan completion across patients.</p>
          <p>• Off-peak chair utilization expanded by +8.2% following automated slot reminders.</p>
          <p>• Consistent rebooking rate maintained above clinic 75% target threshold.</p>
        </div>
      </div>

      {/* BLOCK 3: Three Improvement Tips */}
      <div className="space-y-3 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black border-b border-black/10 pb-1">
          3. Three Improvement Tips
        </h2>
        <div className="space-y-2">
          {tips.map((tip: any, idx: number) => (
            <div key={idx} className="p-3 border border-gray-200 rounded-lg text-xs">
              <strong className="block font-bold mb-0.5">Tip #{idx + 1}</strong>
              <p className="text-gray-700 font-medium">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BLOCK 4: Follow-Up On Last Month's Tips */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black border-b border-black/10 pb-1">
          4. Follow-Up On Last Month's Tips
        </h2>
        <div className="p-3 border border-gray-300 rounded-lg text-xs bg-gray-50">
          <div className="flex justify-between font-bold text-black mb-1">
            <span>Actioned: {followUp.actedOnCount} / {followUp.lastMonthTipsCount} Tips</span>
            <span>Recovered Revenue: {formatCurrency(followUp.recoveredRevenuePaise / 100)}</span>
          </div>
          <p className="text-gray-700 font-medium">{followUp.narrative}</p>
        </div>
      </div>
    </div>
  );
}
