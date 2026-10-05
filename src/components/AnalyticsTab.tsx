'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Sparkles, AlertCircle, Calendar, Users, FileText, Loader2,
  TrendingUp, CheckCircle2, ChevronDown, ChevronUp, ArrowUpRight,
  Activity, RefreshCw, Wallet, QrCode, Banknote, UserX, Stethoscope,
  Phone, MessageSquare, Clock, ShieldCheck, HeartPulse, UserCheck,
  ChevronLeft, ChevronRight, BarChart3, Filter
} from 'lucide-react';
import GlassPanel from './GlassPanel';
import { formatCurrency, formatCurrencyCompact } from '@/lib/formatters';

type AuditTabType = 'earnings' | 'attendance' | 'patients' | 'sessions' | 'dropouts' | 'doctors';

export default function AnalyticsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAuditTab, setActiveAuditTab] = useState<AuditTabType>('earnings');
  const [patientSearch, setPatientSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [selectedModalityFilter, setSelectedModalityFilter] = useState<string>('ALL');

  // Dynamic default month (e.g. "2026-10")
  const defaultMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  // 1. Fetch Monthly Comprehensive Analytics Suite
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

  // Date parsing helpers
  const formatMonthLabel = (mStr: string) => {
    try {
      const [y, m] = mStr.split('-').map(Number);
      const d = new Date(Date.UTC(y, m - 1, 1));
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    } catch (e) {
      return mStr;
    }
  };

  const handlePrevMonth = () => {
    try {
      const [y, m] = selectedMonth.split('-').map(Number);
      const prev = new Date(y, m - 2, 1);
      const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(prevKey);
    } catch (e) {}
  };

  const handleNextMonth = () => {
    try {
      const [y, m] = selectedMonth.split('-').map(Number);
      const next = new Date(y, m, 1);
      const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
      setSelectedMonth(nextKey);
    } catch (e) {}
  };

  // Safe destructuring of monthly metrics
  const availableMonths = monthlyData?.availableMonths || ['2026-10', '2026-09', '2026-08'];
  const earnings = monthlyData?.earnings || { 
    totalCollected: 0, 
    upiTotal: 0, 
    cashTotal: 0, 
    cardTotal: 0, 
    otherTotal: 0, 
    transactionCount: 0, 
    upiPercentage: 0, 
    cashPercentage: 0, 
    avgPerSession: 0, 
    recentPayments: [] 
  };
  const sessions = monthlyData?.sessions || { 
    total: 0, 
    completed: 0, 
    noShow: 0, 
    cancelled: 0, 
    scheduled: 0, 
    completionRate: 0, 
    modalities: [] 
  };
  const patientsWhoCame = monthlyData?.patientsWhoCame || { 
    totalUnique: 0, 
    list: [] 
  };
  const staffAttendance = monthlyData?.staffAttendance || { 
    totalShifts: 0, 
    totalHours: 0, 
    activeStaffCount: 0, 
    staffList: [] 
  };
  const dropouts = monthlyData?.dropouts || { 
    count: 0, 
    list: [] 
  };
  const referringDoctors = monthlyData?.referringDoctors || { 
    totalDoctors: 0, 
    totalReferredPatients: 0, 
    selfDirectCount: 0, 
    list: [] 
  };

  // Filtered Patients List
  const filteredPatients = useMemo(() => {
    return patientsWhoCame.list.filter((p: any) => {
      const q = patientSearch.toLowerCase().trim();
      const matchesSearch = !q || p.fullName.toLowerCase().includes(q) || (p.phone && p.phone.includes(q)) || p.referringDoctor.toLowerCase().includes(q);
      const matchesModality = selectedModalityFilter === 'ALL' || p.treatmentTypes.some((t: string) => t.toLowerCase().includes(selectedModalityFilter.toLowerCase()));
      return matchesSearch && matchesModality;
    });
  }, [patientsWhoCame.list, patientSearch, selectedModalityFilter]);

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return earnings.recentPayments.filter((p: any) => {
      const q = paymentSearch.toLowerCase().trim();
      return !q || p.patientName.toLowerCase().includes(q) || (p.patientPhone && p.patientPhone.includes(q)) || (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)) || p.mode.toLowerCase().includes(q);
    });
  }, [earnings.recentPayments, paymentSearch]);

  // Filtered Referring Doctors List
  const filteredDoctors = useMemo(() => {
    return referringDoctors.list.filter((d: any) => {
      const q = doctorSearch.toLowerCase().trim();
      return !q || d.doctorName.toLowerCase().includes(q) || d.patientNames.some((p: string) => p.toLowerCase().includes(q));
    });
  }, [referringDoctors.list, doctorSearch]);

  // Heatmap styling
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

  // WhatsApp Re-engagement trigger for dropouts
  const handleWhatsAppReengage = (p: any) => {
    const cleanPhone = (p.phone || '').replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Dear ${p.fullName}, this is Health 360 Physiotherapy & Wellness Clinic. We noticed your rehabilitation care plan was recently interrupted (${p.reason}). Regular therapy continuity is vital for complete healing and pain relief. Would you like to schedule a convenient catch-up slot this week?`;
    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // WhatsApp Thank You to referring doctor
  const handleWhatsAppDoctor = (doc: any) => {
    const msg = `Dear ${doc.doctorName}, greetings from Health 360 Clinic. We sincerely appreciate your clinical trust in referring ${doc.count} patient${doc.count !== 1 ? 's' : ''} to us in ${formatMonthLabel(selectedMonth)}. We are closely managing their rehabilitation progress and look forward to our continuous clinical collaboration. Warm regards, Dr. Rashmita & Clinical Team.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-8 select-none font-sans pb-16">
      
      {/* ─── HEADER & TIME NAVIGATION ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#12D6C4]/20 text-[#12D6C4] border border-[#12D6C4]/30 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12D6C4] animate-pulse" />
              End of Month Clinical Audit
            </span>
            <span className="text-xs text-white/50 font-medium">Monthly Practice Intelligence Suite</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif text-[#F5F3FA] font-bold tracking-tight">
            Clinical Practice & Operations Review
          </h2>
          <p className="text-xs text-[rgba(245,243,250,0.65)] font-medium max-w-2xl leading-relaxed">
            Review month-end financial earnings (Cash & UPI), staff attendance, unique patient footfall, session completion rates, drop-out recovery, and referring doctor contribution.
          </p>
        </div>

        {/* Month Selector with Prev/Next Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-white/[0.04] p-1.5 border border-white/15 rounded-2xl backdrop-blur-xl">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-4 h-4 text-[#12D6C4]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-1"
            >
              {availableMonths.map((m: string) => (
                <option key={m} value={m} className="bg-[#12101B] text-white">
                  {formatMonthLabel(m)} {m === defaultMonth() ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-white/15 mx-1" />

          <button
            onClick={() => refetchMonthly()}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-[#12D6C4] transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isMonthlyLoading ? 'animate-spin text-[#12D6C4]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Alert Banner if fetch fails */}
      {isMonthlyError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300 shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Unable to fetch monthly analytics</p>
              <p className="text-[11px] text-rose-300/80">
                {monthlyError instanceof Error ? monthlyError.message : 'Please check your internet or retry.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetchMonthly()}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Now
          </button>
        </div>
      )}

      {/* ─── 6 EXECUTIVE SUMMARY KPI TILES (1-Tap Deep Dive Launchers) ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#12D6C4]" />
            Monthly Snapshot: {formatMonthLabel(selectedMonth)}
          </h4>
          {isMonthlyLoading && (
            <span className="text-xs text-[#12D6C4] flex items-center gap-1.5 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" /> Aggregating clinical metrics...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* TILE 1: Earnings (Cash & UPI) */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            onClick={() => setActiveAuditTab('earnings')}
            className={`p-5 rounded-2xl cursor-pointer transition-all border ${
              activeAuditTab === 'earnings'
                ? 'bg-gradient-to-b from-white/[0.1] to-white/[0.04] border-[#12D6C4]/60 shadow-[0_0_25px_rgba(18,214,196,0.2)]'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">1. Total Earnings</span>
                <div className="text-2xl font-bold text-white mt-0.5 font-mono">
                  {formatCurrency(earnings.totalCollected)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            {/* UPI & Cash pill badges */}
            <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <QrCode className="w-3 h-3" /> UPI {formatCurrency(earnings.upiTotal)} ({earnings.upiPercentage}%)
              </span>
              <span className="text-amber-400 font-mono font-semibold flex items-center gap-1">
                <Banknote className="w-3 h-3" /> Cash {formatCurrency(earnings.cashTotal)}
              </span>
            </div>
          </motion.div>

          {/* TILE 2: Total Sessions & Completion */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            onClick={() => setActiveAuditTab('sessions')}
            className={`p-5 rounded-2xl cursor-pointer transition-all border ${
              activeAuditTab === 'sessions'
                ? 'bg-gradient-to-b from-white/[0.1] to-white/[0.04] border-[#12D6C4]/60 shadow-[0_0_25px_rgba(18,214,196,0.2)]'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">2. Clinical Sessions</span>
                <div className="text-2xl font-bold text-white mt-0.5 font-mono flex items-baseline gap-2">
                  <span>{sessions.completed}</span>
                  <span className="text-xs font-normal text-white/50 font-sans">/ {sessions.total} booked</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#12D6C4]/15 text-[#12D6C4] border border-[#12D6C4]/30">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-[#12D6C4] font-semibold">
                {sessions.completionRate}% Attendance Rate
              </span>
              <span className="text-white/50 font-mono text-[10px]">
                {sessions.modalities.length} Modalities
              </span>
            </div>
          </motion.div>

          {/* TILE 3: Patients Who Came */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            onClick={() => setActiveAuditTab('patients')}
            className={`p-5 rounded-2xl cursor-pointer transition-all border ${
              activeAuditTab === 'patients'
                ? 'bg-gradient-to-b from-white/[0.1] to-white/[0.04] border-[#12D6C4]/60 shadow-[0_0_25px_rgba(18,214,196,0.2)]'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">3. Monthly Patient Footfall</span>
                <div className="text-2xl font-bold text-white mt-0.5 font-mono flex items-baseline gap-2">
                  <span>{patientsWhoCame.totalUnique}</span>
                  <span className="text-xs font-normal text-white/50 font-sans">unique patients</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-purple-300 font-semibold">
                View Full Patient Roster
              </span>
              <span className="text-white/40 text-[10px]">
                {patientsWhoCame.totalUnique > 0 ? (sessions.completed / patientsWhoCame.totalUnique).toFixed(1) : '0'} avg visits
              </span>
            </div>
          </motion.div>

          {/* TILE 4: Staff Attendance */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            onClick={() => setActiveAuditTab('attendance')}
            className={`p-5 rounded-2xl cursor-pointer transition-all border ${
              activeAuditTab === 'attendance'
                ? 'bg-gradient-to-b from-white/[0.1] to-white/[0.04] border-[#12D6C4]/60 shadow-[0_0_25px_rgba(18,214,196,0.2)]'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">4. Staff Attendance</span>
                <div className="text-2xl font-bold text-white mt-0.5 font-mono flex items-baseline gap-2">
                  <span>{staffAttendance.totalShifts}</span>
                  <span className="text-xs font-normal text-white/50 font-sans">shifts logged</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-blue-300 font-semibold">
                {staffAttendance.activeStaffCount} Active Practitioners
              </span>
              <span className="text-white/50 font-mono text-[10px]">
                {staffAttendance.totalHours} Total Hours
              </span>
            </div>
          </motion.div>

          {/* TILE 5: Drop Outs & Stalled Plans */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            onClick={() => setActiveAuditTab('dropouts')}
            className={`p-5 rounded-2xl cursor-pointer transition-all border ${
              activeAuditTab === 'dropouts'
                ? 'bg-gradient-to-b from-white/[0.1] to-white/[0.04] border-[#FF5D7A]/60 shadow-[0_0_25px_rgba(255,93,122,0.2)]'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">5. Drop-Outs & Stalled</span>
                <div className="text-2xl font-bold text-rose-300 mt-0.5 font-mono flex items-baseline gap-2">
                  <span>{dropouts.count}</span>
                  <span className="text-xs font-normal text-rose-300/60 font-sans">needs follow-up</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <UserX className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-rose-400 font-semibold">
                1-Click WhatsApp Re-engage
              </span>
              <span className="text-white/40 text-[10px]">
                Active retention
              </span>
            </div>
          </motion.div>

          {/* TILE 6: Referring Doctors */}
          <motion.div
            whileHover={{ scale: 1.015 }}
            onClick={() => setActiveAuditTab('doctors')}
            className={`p-5 rounded-2xl cursor-pointer transition-all border ${
              activeAuditTab === 'doctors'
                ? 'bg-gradient-to-b from-white/[0.1] to-white/[0.04] border-[#12D6C4]/60 shadow-[0_0_25px_rgba(18,214,196,0.2)]'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">6. Referred Doctors</span>
                <div className="text-2xl font-bold text-white mt-0.5 font-mono flex items-baseline gap-2">
                  <span>{referringDoctors.totalDoctors}</span>
                  <span className="text-xs font-normal text-white/50 font-sans">referring doctors</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Stethoscope className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-cyan-300 font-semibold">
                {referringDoctors.totalReferredPatients} Referred Patients
              </span>
              <span className="text-white/40 text-[10px]">
                Network partners
              </span>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ─── INTERACTIVE TABBED DRILLDOWN WORKBENCH ─── */}
      <GlassPanel className="p-6 md:p-7 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {[
            { id: 'earnings', label: 'Earnings & Collections', icon: Wallet, count: earnings.totalCollected > 0 ? formatCurrencyCompact(earnings.totalCollected) : undefined },
            { id: 'patients', label: 'Patients Who Came', icon: Users, count: patientsWhoCame.totalUnique },
            { id: 'attendance', label: 'Staff Attendance', icon: Clock, count: `${staffAttendance.totalShifts} shifts` },
            { id: 'sessions', label: 'Sessions & Modalities', icon: Activity, count: sessions.completed },
            { id: 'dropouts', label: 'Drop-Outs & Follow-ups', icon: UserX, count: dropouts.count, alert: dropouts.count > 0 },
            { id: 'doctors', label: 'Referring Doctors', icon: Stethoscope, count: referringDoctors.totalDoctors },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAuditTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAuditTab(tab.id as AuditTabType)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? 'bg-[#12D6C4]/15 border-[#12D6C4] text-[#12D6C4] shadow-[0_0_15px_rgba(18,214,196,0.2)]'
                    : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    tab.alert 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                      : isActive 
                        ? 'bg-[#12D6C4]/20 text-[#12D6C4]' 
                        : 'bg-white/10 text-white/60'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── TAB CONTENT PANELS ─── */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: EARNINGS OF THE MONTH (CASH & UPI) */}
          {activeAuditTab === 'earnings' && (
            <motion.div
              key="earnings"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    Revenue Collections: {formatMonthLabel(selectedMonth)}
                  </h4>
                  <p className="text-xs text-white/60">
                    Realized income audit with complete payment mode split (UPI, Cash, Card) and transaction receipt logs.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search payment or patient..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/15 rounded-xl text-white outline-none w-56 placeholder-white/40"
                    />
                  </div>
                </div>
              </div>

              {/* UPI vs Cash Visual Progress Meter */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    UPI Collections: {formatCurrency(earnings.upiTotal)} ({earnings.upiPercentage}%)
                  </span>
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    Cash Collections: {formatCurrency(earnings.cashTotal)} ({earnings.cashPercentage}%)
                  </span>
                </div>

                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${earnings.upiPercentage}%` }} 
                    className="bg-emerald-400 h-full transition-all duration-700" 
                    title={`UPI: ${earnings.upiPercentage}%`}
                  />
                  <div 
                    style={{ width: `${earnings.cashPercentage}%` }} 
                    className="bg-amber-400 h-full transition-all duration-700" 
                    title={`Cash: ${earnings.cashPercentage}%`}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] text-white/50 pt-1 font-mono">
                  <span>{earnings.transactionCount} payment transactions logged in {formatMonthLabel(selectedMonth)}</span>
                  <span>Average per attended session: ₹{earnings.avgPerSession}</span>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B0A10]/60">
                <table className="w-full text-left text-xs text-white/80">
                  <thead className="bg-white/[0.04] border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/50">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4 text-center">Payment Mode</th>
                      <th className="py-3 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-white/40 italic">
                          No payment transactions recorded for {formatMonthLabel(selectedMonth)}.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-white/60">
                            {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-white">
                            <div>{p.patientName}</div>
                            {p.patientPhone && <div className="text-[10px] text-white/40 font-mono">{p.patientPhone}</div>}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-white/50">
                            {p.invoiceNumber || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              (p.mode || '').toUpperCase().includes('UPI')
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {p.mode || 'CASH'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-white text-sm">
                            {formatCurrency(p.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 2: PATIENTS WHO CAME IN A MONTH */}
          {activeAuditTab === 'patients' && (
            <motion.div
              key="patients"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Patients Who Visited in {formatMonthLabel(selectedMonth)} ({patientsWhoCame.totalUnique})
                  </h4>
                  <p className="text-xs text-white/60">
                    Comprehensive patient directory of individuals who attended appointments at Health 360 this month.
                  </p>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by patient name or doctor..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/15 rounded-xl text-white outline-none w-64 placeholder-white/40"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-white/[0.04] p-1 border border-white/10 rounded-xl text-[10px] font-bold">
                    {['ALL', 'Physiotherapy', 'Consultation', 'CST'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedModalityFilter(m)}
                        className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                          selectedModalityFilter === m
                            ? 'bg-[#12D6C4]/20 text-[#12D6C4]'
                            : 'text-white/50 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Patients Roster Table */}
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0B0A10]/60">
                <table className="w-full text-left text-xs text-white/80">
                  <thead className="bg-white/[0.04] border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/50">
                    <tr>
                      <th className="py-3 px-4">Patient Name</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4 text-center">Visits This Month</th>
                      <th className="py-3 px-4">Treatment Modality</th>
                      <th className="py-3 px-4">Referred By</th>
                      <th className="py-3 px-4 text-right">Last Visit Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPatients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-white/40 italic">
                          No patients matched the criteria for {formatMonthLabel(selectedMonth)}.
                        </td>
                      </tr>
                    ) : (
                      filteredPatients.map((p: any) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-[10px] font-mono">
                              {p.fullName.charAt(0)}
                            </span>
                            <span>{p.fullName}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-white/60">
                            {p.phone || '—'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full bg-[#12D6C4]/15 text-[#12D6C4] font-mono font-bold text-xs border border-[#12D6C4]/30">
                              {p.totalVisits} visit{p.totalVisits !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {p.treatmentTypes.map((t: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] text-white/70">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              p.referringDoctor.toLowerCase().includes('self') || p.referringDoctor.toLowerCase().includes('walk-in')
                                ? 'bg-white/[0.03] text-white/50 border-white/10'
                                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            }`}>
                              {p.referringDoctor}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[11px] text-white/60">
                            {p.lastVisitDate ? new Date(p.lastVisitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 3: TOTAL SESSIONS & MODALITIES */}
          {activeAuditTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div>
                <h4 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#12D6C4]" />
                  Total Sessions & Modality Performance ({sessions.total} Booked)
                </h4>
                <p className="text-xs text-white/60">
                  Detailed distribution of attended sessions, cancellations, and capacity utilization across modalities.
                </p>
              </div>

              {/* Status Breakdown Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Completed / Attended</span>
                  <div className="text-2xl font-bold font-mono text-white">{sessions.completed}</div>
                  <span className="text-[10px] text-emerald-300/70 font-medium">{sessions.completionRate}% completion</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Scheduled / Queued</span>
                  <div className="text-2xl font-bold font-mono text-white">{sessions.scheduled}</div>
                  <span className="text-[10px] text-white/40 font-medium">In lounge or booked</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 space-y-1">
                  <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">Missed No-Show</span>
                  <div className="text-2xl font-bold font-mono text-white">{sessions.noShow}</div>
                  <span className="text-[10px] text-rose-300/70 font-medium">Unattended slots</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Cancelled</span>
                  <div className="text-2xl font-bold font-mono text-white">{sessions.cancelled}</div>
                  <span className="text-[10px] text-amber-300/70 font-medium">Patient cancellations</span>
                </div>
              </div>

              {/* Modality Distribution Breakdown */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Modality Utilization & Patient Care Delivery
                </h5>

                <div className="space-y-3">
                  {sessions.modalities.map((mod: any, idx: number) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="text-white font-semibold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#12D6C4]" />
                          {mod.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white font-bold">{mod.count} sessions</span>
                          <span className="text-white/40 text-[10px] font-mono">({mod.percentage}%)</span>
                        </div>
                      </div>

                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${mod.percentage}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                          className="bg-gradient-to-r from-[#12D6C4] to-[#7B5CFF] h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: DROP-OUTS & PATIENT FOLLOW-UP QUEUE */}
          {activeAuditTab === 'dropouts' && (
            <motion.div
              key="dropouts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    <UserX className="w-5 h-5 text-rose-400" />
                    Drop-Out & Stalled Treatment Queue ({dropouts.count})
                  </h4>
                  <p className="text-xs text-white/60">
                    Patients who missed their appointments or whose multi-session rehabilitation courses have stalled. Take immediate action to recover retention.
                  </p>
                </div>

                <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-1.5 self-start md:self-auto">
                  <AlertCircle className="w-4 h-4" />
                  <span>Immediate Action Recommended</span>
                </div>
              </div>

              {dropouts.list.length === 0 ? (
                <div className="p-12 text-center bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h5 className="text-sm font-bold text-white">Zero Patient Drop-outs</h5>
                  <p className="text-xs text-white/50 max-w-sm mx-auto">
                    All patients in {formatMonthLabel(selectedMonth)} are on active care tracks or have fulfilled their prescribed rehabilitation goals.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dropouts.list.map((dp: any) => (
                    <div 
                      key={dp.patientId} 
                      className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 hover:border-rose-500/40 transition space-y-3"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h5 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                            <span>{dp.fullName}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              {dp.type === 'STALLED_COURSE' ? 'Stalled Plan' : 'No-Show'}
                            </span>
                          </h5>
                          <p className="text-[11px] text-white/50 font-mono mt-0.5">{dp.phone || 'No phone recorded'}</p>
                        </div>

                        <span className="text-[10px] font-mono text-white/40">
                          {dp.date ? new Date(dp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200">
                        <p className="font-semibold text-rose-300">{dp.reason}</p>
                        <p className="text-[10px] text-white/50 mt-1">
                          Modality: {dp.treatmentType} • Doctor: {dp.referringDoctor}
                        </p>
                      </div>

                      {/* Action buttons: WhatsApp & Call */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleWhatsAppReengage(dp)}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Re-engage</span>
                        </button>

                        {dp.phone && (
                          <a
                            href={`tel:${dp.phone}`}
                            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/15 text-white/80 transition cursor-pointer"
                            title="Direct Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 5: STAFF ATTENDANCE */}
          {activeAuditTab === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    Clinical Staff Attendance: {formatMonthLabel(selectedMonth)}
                  </h4>
                  <p className="text-xs text-white/60">
                    Monthly shift logs, total hours clocked, and attendance punctuality for doctors and staff.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-bold text-white font-mono">
                    Total: {staffAttendance.totalHours} Hours ({staffAttendance.totalShifts} Shifts)
                  </div>
                </div>
              </div>

              {/* Staff Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffAttendance.staffList.length === 0 ? (
                  <div className="col-span-2 p-10 text-center bg-white/[0.02] border border-white/10 rounded-2xl text-white/40 italic">
                    No staff attendance shifts logged in {formatMonthLabel(selectedMonth)}.
                  </div>
                ) : (
                  staffAttendance.staffList.map((st: any) => (
                    <div key={st.userId} className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-serif font-bold text-white text-base flex items-center gap-2">
                            <span>{st.name}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Active
                            </span>
                          </h5>
                          <p className="text-xs text-white/50">{st.designation}</p>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5">{st.email}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-2xl font-bold font-mono text-white block">
                            {st.daysPresent}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-white/40">
                            Days On Duty
                          </span>
                        </div>
                      </div>

                      {/* Mini stats row */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/05">
                          <span className="text-[9px] text-white/40 font-bold uppercase block">Total Duty Hours</span>
                          <span className="text-sm font-bold font-mono text-white">{st.totalHours} hrs</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/05">
                          <span className="text-[9px] text-white/40 font-bold uppercase block">Avg Shift</span>
                          <span className="text-sm font-bold font-mono text-white">{st.avgHoursPerShift} hrs/day</span>
                        </div>
                      </div>

                      {/* Recent Shifts Snippet */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                          Recent Shifts ({st.records.length} logged)
                        </span>
                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {st.records.slice(0, 5).map((rec: any) => (
                            <div key={rec.id} className="p-2 rounded-lg bg-white/[0.02] border border-white/05 flex items-center justify-between text-[11px]">
                              <span className="font-mono text-white/70">
                                {new Date(rec.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className="font-mono text-white/50 text-[10px]">
                                {new Date(rec.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {rec.clockOutAt ? new Date(rec.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Open'}
                              </span>
                              <span className="font-mono font-bold text-[#12D6C4] text-[10px]">
                                {rec.durationHours}h
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 6: REFERRED DOCTORS */}
          {activeAuditTab === 'doctors' && (
            <motion.div
              key="doctors"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-cyan-400" />
                    Referring Doctor Channel Breakdown ({referringDoctors.totalDoctors} Active Doctors)
                  </h4>
                  <p className="text-xs text-white/60">
                    Medical partners and external doctors who directed patients to Health 360 in {formatMonthLabel(selectedMonth)}.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search doctor or patient name..."
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/15 rounded-xl text-white outline-none w-56 placeholder-white/40"
                    />
                  </div>
                </div>
              </div>

              {/* Doctors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDoctors.length === 0 ? (
                  <div className="col-span-3 p-10 text-center bg-white/[0.02] border border-white/10 rounded-2xl text-white/40 italic">
                    No doctor-referred patient visits logged in {formatMonthLabel(selectedMonth)}.
                  </div>
                ) : (
                  filteredDoctors.map((doc: any, idx: number) => (
                    <div key={idx} className="p-5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 transition space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h5 className="font-serif font-bold text-sm text-white">
                            {doc.doctorName}
                          </h5>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {doc.count} Patient{doc.count !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${doc.percentage}%` }} 
                            className="bg-gradient-to-r from-cyan-400 to-[#12D6C4] h-full rounded-full"
                          />
                        </div>

                        <div className="text-[10px] text-white/50 flex justify-between">
                          <span>{doc.percentage}% of doctor referrals</span>
                        </div>

                        {/* Patient Names List */}
                        <div className="pt-2 border-t border-white/10">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                            Referred Patients:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {doc.patientNames.map((pName: string, pIdx: number) => (
                              <span key={pIdx} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[10px] text-white/80 font-medium">
                                {pName}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* WhatsApp Note Action */}
                      <button
                        onClick={() => handleWhatsAppDoctor(doc)}
                        className="w-full mt-2 py-2 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp Thank You</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </GlassPanel>

      {/* ─── DENSITY & OPD HEATMAP SECTION ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
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

        {/* Overall Referral conversion ranking */}
        <GlassPanel className="lg:col-span-1 p-6 flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <h4 className="text-xl font-serif font-bold text-[#F5F3FA] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#12D6C4] stroke-[1.75]" />
              Lifetime Referral Leaders
            </h4>
            <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">All-time top clinical conversion sources</p>
          </div>

          {isReferralsLoading ? (
            <div className="flex justify-center py-20 flex-1">
              <Loader2 className="h-6 w-6 text-[#12D6C4] animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 flex-1 flex flex-col justify-start">
              {referrals.slice(0, 7).map((ref: any) => (
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

      {/* ─── NATURAL LANGUAGE NOTE INDEX SEARCH ─── */}
      <GlassPanel className="p-6 space-y-6">
        <div className="space-y-1">
          <h4 className="text-xl font-serif font-bold text-[#F5F3FA] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#12D6C4] stroke-[1.75]" />
            Natural-Language Clinical Note Index
          </h4>
          <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">Search clinical summaries, tags, patient diagnosis, and therapy complaints</p>
        </div>

        <div className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[rgba(245,243,250,0.4)] stroke-[1.75] shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Type clinical keywords... e.g. 'cervical spondylosis', 'frozen shoulder', 'ACL', 'rehabilitation'"
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
