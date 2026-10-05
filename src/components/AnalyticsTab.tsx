'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Search, Sparkles, AlertCircle, 
  Map, Calendar, Users, HelpCircle, FileText, Loader2,
  TrendingUp, CreditCard, CheckCircle2, ChevronDown, ChevronUp, ArrowUpRight,
  UserCheck, Activity, RefreshCw, Wallet, QrCode, Banknote
} from 'lucide-react';
import GlassPanel from './GlassPanel';
import { formatCurrency, formatCurrencyCompact } from '@/lib/formatters';

export default function AnalyticsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic current month (e.g. "2026-10")
  const defaultMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [showRecentPayments, setShowRecentPayments] = useState(false);

  // 1. Fetch Monthly Performance & Revenue Breakdown
  const { 
    data: monthlyData, 
    isLoading: isMonthlyLoading, 
    isError: isMonthlyError,
    error: monthlyError,
    refetch: refetchMonthly 
  } = useQuery({
    queryKey: ['analytics-monthly', selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/monthly?month=${selectedMonth}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch monthly analytics (${res.status})`);
      }
      return res.json();
    },
    staleTime: 30 * 1000,
    retry: 2,
  });

  // 2. Fetch Heatmap Analytics
  const { 
    data: heatmap = [], 
    isLoading: isHeatmapLoading,
    isError: isHeatmapError,
    refetch: refetchHeatmap 
  } = useQuery({
    queryKey: ['analytics-heatmap'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/heatmap');
      if (!res.ok) throw new Error('Failed to fetch heatmap');
      return res.json();
    },
    retry: 2,
  });

  // 3. Fetch Referral Analytics
  const { 
    data: referrals = [], 
    isLoading: isReferralsLoading,
    isError: isReferralsError,
    refetch: refetchReferrals 
  } = useQuery({
    queryKey: ['analytics-referrals'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/referrals');
      if (!res.ok) throw new Error('Failed to fetch referrals');
      return res.json();
    },
    retry: 2,
  });

  // 4. Fetch Clinical Search Results
  const { data: searchResults = [], isLoading: isSearchLoading } = useQuery({
    queryKey: ['clinical-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await fetch(`/api/search?q=${searchQuery}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: searchQuery.trim().length >= 3,
  });

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-[rgba(245,243,250,0.3)]';
    if (count <= 2) return 'bg-[rgba(18,214,196,0.15)] border-[rgba(18,214,196,0.3)] text-[#12D6C4] shadow-[0_0_12px_rgba(18,214,196,0.2)]';
    if (count <= 4) return 'bg-[rgba(123,92,255,0.2)] border-[rgba(123,92,255,0.35)] text-[#7B5CFF] shadow-[0_0_12px_rgba(123,92,255,0.25)]';
    return 'bg-[rgba(226,63,166,0.25)] border-[rgba(226,63,166,0.4)] text-[#E23FA6] shadow-[0_0_15px_rgba(226,63,166,0.3)]';
  };

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const segments = ['MORNING', 'AFTERNOON', 'EVENING'];

  const getCellCount = (day: string, segment: string) => {
    const match = heatmap.find((h: any) => h.day === day && h.segment === segment);
    return match ? match.count : 0;
  };

  const formatMonthLabel = (mStr: string) => {
    try {
      const [y, m] = mStr.split('-').map(Number);
      const d = new Date(Date.UTC(y, m - 1, 1));
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch (e) {
      return mStr;
    }
  };

  const availableMonths = monthlyData?.availableMonths || ['2026-10', '2026-09', '2026-08'];
  const earnings = monthlyData?.earnings || { totalCollected: 0, upiTotal: 0, cashTotal: 0, transactionCount: 0, upiPercentage: 0, cashPercentage: 0 };
  const sessions = monthlyData?.sessions || { total: 0, completed: 0, noShow: 0, cancelled: 0, scheduled: 0, completionRate: 0 };
  const patients = monthlyData?.patients || { newRegistered: 0 };
  const recentPayments = monthlyData?.recentPayments || [];

  return (
    <div className="space-y-8 select-none">
      {/* Title & Month Selector Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#12D6C4]/20 text-[#12D6C4] border border-[#12D6C4]/30 rounded-full">
              Monthly Audit
            </span>
            <span className="text-xs text-white/50 font-medium">Practice & Financial Intelligence</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-serif text-[#F5F3FA] font-bold">Clinical & Practice Analytics</h3>
          <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">
            Monthly collections by payment method (UPI vs Cash), session attendance rates, and patient volume.
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/15 px-3 py-1.5 rounded-2xl backdrop-blur-xl">
            <Calendar className="w-4 h-4 text-[#12D6C4]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-2"
            >
              {availableMonths.map((m: string) => (
                <option key={m} value={m} className="bg-[#12101B] text-white">
                  {formatMonthLabel(m)} {m === defaultMonth() ? '(Current Month)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => refetchMonthly()}
            className="p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/10 border border-white/15 text-white/80 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isMonthlyLoading ? 'animate-spin text-[#12D6C4]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner if monthly API fails */}
      {isMonthlyError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {monthlyError instanceof Error ? monthlyError.message : 'Unable to load revenue and performance metrics for this month.'}
            </span>
          </div>
          <button
            onClick={() => refetchMonthly()}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* ─── PRIMARY MONTHLY PERFORMANCE CARDS (Direct Answer to Doctor's 3 Questions) ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#12D6C4]" />
            Monthly Executive Summary: {formatMonthLabel(selectedMonth)}
          </h4>
          {isMonthlyLoading ? (
            <span className="text-xs text-[#12D6C4] flex items-center gap-1.5 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" /> Updating metrics...
            </span>
          ) : earnings.totalCollected === 0 ? (
            <span className="text-xs text-amber-300/80 font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              No payments logged for {formatMonthLabel(selectedMonth)}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CARD 1: Monthly Earnings with UPI vs Cash Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.015] backdrop-blur-2xl border border-white/15 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_36px_rgba(0,0,0,0.45)]"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Total Realized Earnings
                </span>
                <div className="text-3xl font-bold text-white mt-1 font-mono tracking-tight">
                  {formatCurrency(earnings.totalCollected)}
                </div>
              </div>
              <span className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Wallet className="w-5 h-5" />
              </span>
            </div>

            {/* UPI vs Cash breakdown */}
            <div className="mt-5 space-y-3 pt-4 border-t border-white/10">
              <div className="text-xs font-semibold text-white/60 flex justify-between items-center">
                <span>Payment Mode Breakdown</span>
                <span className="text-[10px] font-mono text-white/40">{earnings.transactionCount} payments</span>
              </div>

              {/* Progress Distribution Bar */}
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${earnings.upiPercentage}%` }} 
                  className="bg-emerald-400 h-full transition-all duration-500" 
                  title={`UPI: ${earnings.upiPercentage}%`}
                />
                <div 
                  style={{ width: `${earnings.cashPercentage}%` }} 
                  className="bg-amber-400 h-full transition-all duration-500" 
                  title={`Cash: ${earnings.cashPercentage}%`}
                />
              </div>

              {/* Mode Badges */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 uppercase">
                    <QrCode className="w-3 h-3" /> UPI
                  </div>
                  <div className="text-sm font-bold font-mono text-white">
                    {formatCurrency(earnings.upiTotal)}
                  </div>
                  <div className="text-[9px] text-emerald-300/70 font-medium">
                    {earnings.upiPercentage}% of collections
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 uppercase">
                    <Banknote className="w-3 h-3" /> CASH
                  </div>
                  <div className="text-sm font-bold font-mono text-white">
                    {formatCurrency(earnings.cashTotal)}
                  </div>
                  <div className="text-[9px] text-amber-300/70 font-medium">
                    {earnings.cashPercentage}% of collections
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CARD 2: Completed Clinical Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.015] backdrop-blur-2xl border border-white/15 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_36px_rgba(0,0,0,0.45)]"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Completed Sessions
                </span>
                <div className="text-3xl font-bold text-white mt-1 font-mono tracking-tight flex items-baseline gap-2">
                  <span>{sessions.completed}</span>
                  <span className="text-xs font-sans font-normal text-white/50">attended</span>
                </div>
              </div>
              <span className="p-3 rounded-2xl bg-[#12D6C4]/15 text-[#12D6C4] border border-[#12D6C4]/30">
                <Activity className="w-5 h-5" />
              </span>
            </div>

            {/* Attendance & Session status breakdown */}
            <div className="mt-5 space-y-3 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center text-xs font-semibold text-white/60">
                <span>Attendance Rate</span>
                <span className="font-mono text-[#12D6C4] font-bold">{sessions.completionRate}%</span>
              </div>

              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${sessions.completionRate}%` }} 
                  className="bg-[#12D6C4] h-full rounded-full transition-all duration-500" 
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[9px] font-bold text-white/50 uppercase">Total Booked</div>
                  <div className="text-xs font-bold text-white font-mono mt-0.5">{sessions.total}</div>
                </div>
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-[9px] font-bold text-rose-300 uppercase">No-Show</div>
                  <div className="text-xs font-bold text-rose-200 font-mono mt-0.5">{sessions.noShow}</div>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[9px] font-bold text-white/50 uppercase">Cancelled</div>
                  <div className="text-xs font-bold text-white/70 font-mono mt-0.5">{sessions.cancelled}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CARD 3: New Patients Registered */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.015] backdrop-blur-2xl border border-white/15 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_36px_rgba(0,0,0,0.45)]"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  New Patient Intake
                </span>
                <div className="text-3xl font-bold text-white mt-1 font-mono tracking-tight flex items-baseline gap-2">
                  <span>{patients.directRegistered ?? patients.newRegistered}</span>
                  <span className="text-xs font-sans font-normal text-white/50">new walk-in/portal</span>
                </div>
              </div>
              <span className="p-3 rounded-2xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Users className="w-5 h-5" />
              </span>
            </div>

            <div className="mt-5 space-y-3 pt-4 border-t border-white/10 text-xs text-white/70 font-medium">
              {patients.importedBatch ? (
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-200">
                  <span className="font-bold text-white">+{patients.importedBatch} historical records</span> imported in bulk from clinic records on Sept 10.
                </div>
              ) : (
                <p className="leading-relaxed">
                  Registered in {formatMonthLabel(selectedMonth)} across online portal, reception check-ins, and referrals.
                </p>
              )}

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                <span className="text-white/60">Total Active Clinic Database</span>
                <span className="font-mono font-bold text-white">676 Patients</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Expandable Payment Audit Trail for Selected Month */}
        {recentPayments.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowRecentPayments(!showRecentPayments)}
              className="text-xs text-white/70 hover:text-white flex items-center gap-1.5 transition font-semibold px-1 py-1 cursor-pointer"
            >
              <span>{showRecentPayments ? 'Hide' : 'View'} {formatMonthLabel(selectedMonth)} Payment Transactions ({earnings.transactionCount} total)</span>
              {showRecentPayments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {showRecentPayments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0B0A10]/80 shadow-2xl"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-white/80">
                      <thead className="bg-white/[0.05] border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/50">
                        <tr>
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Patient Name</th>
                          <th className="py-2.5 px-4">Invoice #</th>
                          <th className="py-2.5 px-4 text-center">Payment Mode</th>
                          <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {recentPayments.map((p: any) => (
                          <tr key={p.id} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-4 font-mono text-[11px] text-white/60">
                              {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </td>
                            <td className="py-2.5 px-4 font-medium text-white">{p.patientName}</td>
                            <td className="py-2.5 px-4 font-mono text-[11px] text-white/50">{p.invoiceNumber || '—'}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                (p.mode || '').toUpperCase() === 'UPI' 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}>
                                {p.mode || 'CASH'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                              {formatCurrency(p.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── DENSITY & REFERRAL SECTION ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Heatmap density */}
        <GlassPanel className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <h4 className="text-xl font-serif font-bold text-[#F5F3FA] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#12D6C4] stroke-[1.75]" />
              OPD Demand Heatmap
            </h4>
            <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">Weekday vs Time segment appointment density</p>
          </div>

          {isHeatmapLoading ? (
            <div className="flex justify-center py-20 flex-1">
              <Loader2 className="h-6 w-6 text-[#12D6C4] animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-4 gap-2 text-center eyebrow text-[9px] mb-2">
                <span>Day</span>
                <span>Morning (9-12)</span>
                <span>Afternoon (12-15)</span>
                <span>Evening (15-18)</span>
              </div>

              {weekdays.map((day) => (
                <div key={day} className="grid grid-cols-4 gap-2 items-center">
                  <span className="text-xs font-bold text-[#F5F3FA]">{day}</span>
                  {segments.map((seg) => {
                    const count = getCellCount(day, seg);
                    return (
                      <motion.div
                        key={seg}
                        whileHover={{ scale: 1.02 }}
                        className={`py-2 px-2 rounded-xl text-center font-bold text-xs border ${getHeatmapColor(count)} flex items-center justify-center gap-1.5`}
                      >
                        {count > 0 ? (
                          <>
                            <span className="text-xs font-serif font-bold num-tabular leading-none">{count}</span>
                            <span style={{ fontSize: '9px' }} className="eyebrow opacity-80">session{count !== 1 ? 's' : ''}</span>
                          </>
                        ) : (
                          <span className="text-[rgba(245,243,250,0.3)] font-medium">—</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ))}

              {/* Heatmap Legend */}
              <div className="flex justify-end gap-4 pt-4 text-[10px] font-medium text-[rgba(245,243,250,0.6)]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xs" />
                  <span>Empty</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[rgba(18,214,196,0.2)] border border-[rgba(18,214,196,0.3)] rounded-xs" />
                  <span>Light (1-2)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[rgba(123,92,255,0.25)] border border-[rgba(123,92,255,0.35)] rounded-xs" />
                  <span>Moderate (3-4)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[rgba(226,63,166,0.3)] border border-[rgba(226,63,166,0.4)] rounded-xs" />
                  <span>Dense (5+)</span>
                </div>
              </div>
            </div>
          )}
        </GlassPanel>

        {/* Referral conversions */}
        <GlassPanel className="lg:col-span-1 p-6 flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <h4 className="text-xl font-serif font-bold text-[#F5F3FA] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#12D6C4] stroke-[1.75]" />
              Referral Source Tracker
            </h4>
            <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">Top clinical channels converting to patients</p>
          </div>

          {isReferralsLoading ? (
            <div className="flex justify-center py-20 flex-1">
              <Loader2 className="h-6 w-6 text-[#12D6C4] animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 flex-1 flex flex-col justify-start">
              {referrals.map((ref: any) => (
                <div key={ref.name} className="space-y-2 p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl">
                  <div className="flex justify-between items-center text-xs font-bold text-[#F5F3FA]">
                    <span className="truncate pr-2">{ref.name}</span>
                    <span className="shrink-0 bg-[rgba(18,214,196,0.12)] text-[#12D6C4] px-2 py-0.5 rounded-full text-[9px] font-bold border border-[rgba(18,214,196,0.3)] num-tabular">
                      {ref.count} Patient{ref.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="w-full bg-[rgba(255,255,255,0.04)] h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (ref.count / Math.max(1, referrals[0]?.count || 1)) * 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-[#12D6C4] to-[#7B5CFF] h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Natural language clinical search */}
      <GlassPanel className="p-6 space-y-6">
        <div className="space-y-1">
          <h4 className="text-xl font-serif font-bold text-[#F5F3FA] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#12D6C4] stroke-[1.75]" />
            Natural-Language Note Index
          </h4>
          <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">Query session summaries, tags, and complaints (e.g. "frozen shoulder last month")</p>
        </div>

        <div className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[rgba(245,243,250,0.4)] stroke-[1.75] shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Type search terms... e.g. 'ACL reconstruction', 'chronic back pain'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-4 py-3 w-full text-sm glass-input font-medium placeholder-[rgba(245,243,250,0.4)]"
          />
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {isSearchLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 text-[#12D6C4] animate-spin" />
            </div>
          ) : searchResults.length === 0 && searchQuery.trim().length >= 3 ? (
            <div className="p-6 text-center text-[rgba(245,243,250,0.4)] text-xs font-medium bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl">
              No matching clinical logs or patient diagnoses found.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((res: any) => (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.005 }}
                  className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3 hover:border-[rgba(18,214,196,0.4)] transition-colors duration-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        res.type === 'PATIENT_PROFILE' 
                          ? 'bg-[rgba(18,214,196,0.12)] text-[#12D6C4] border-[rgba(18,214,196,0.3)]' 
                          : 'bg-[rgba(123,92,255,0.12)] text-[#7B5CFF] border-[rgba(123,92,255,0.3)]'
                      }`}>
                        {res.type.replace('_', ' ')}
                      </span>
                      <h5 className="font-serif font-bold text-sm text-[#F5F3FA]">{res.title}</h5>
                    </div>
                    <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">{res.subtitle}</p>
                    <p className="text-xs text-[rgba(245,243,250,0.8)] font-medium leading-relaxed italic">"{res.description}"</p>
                  </div>

                  <div className="flex flex-wrap gap-1 md:self-start">
                    {res.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="eyebrow text-[9px] bg-[rgba(255,255,255,0.04)] text-[rgba(245,243,250,0.6)] border border-[rgba(255,255,255,0.08)] px-2 py-0.5 rounded-md capitalize">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
