'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, PhoneCall, Award, Calendar, 
  ArrowRight, ShieldCheck, HeartPulse, UserCheck, ChevronRight,
  Clock, Sparkles, Plus, Check, CheckCircle, Trash2, ArrowUpRight, Share2, Send,
  Maximize2, TrendingUp, BarChart3, X
} from 'lucide-react';
import GlassPanel from './GlassPanel';

const AppointmentStatus = { WAITING: 'WAITING', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', SCHEDULED: 'SCHEDULED', NO_SHOW: 'NO_SHOW', CANCELLED: 'CANCELLED' } as const;
type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

const CLINICAL_QUOTES = [
  "“Wherever the art of Medicine is loved, there is also a love of Humanity.” — Hippocrates",
  "“Movement is medicine for creating change in physical and mental health.” — Carol Welch",
  "“To cure sometimes, to relieve often, to comfort always.” — E. L. Trudeau",
  "“The art of healing comes from nature, not from the physician.” — Paracelsus",
  "“The great physician treats the patient, not just the disease.” — William Osler",
  "“Restoring movement, vitality, and strength — one session at a time.”",
  "“Precision clinical care meets compassionate patient recovery.”",
  "“Small daily physical recovery milestones build lifelong vitality.”"
];

interface Props {
  onVoiceAgentClick?: () => void;
}

export default function OverviewTab({ onVoiceAgentClick }: Props) {
  const queryClient = useQueryClient();
  const [promotingEntryId, setPromotingEntryId] = useState<string | null>(null);
  const [promoteTime, setPromoteTime] = useState('11:00');
  const [promoteModality, setPromoteModality] = useState('Physiotherapy');
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Cycle quote every 12 hours (half-day blocks)
  React.useEffect(() => {
    const now = Date.now();
    const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime();
    const halfDayBlock = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 12));
    setQuoteIndex(halfDayBlock % CLINICAL_QUOTES.length);
  }, []);

  // Fetch today's appointments
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', todayStr],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?date=${todayStr}`);
      return res.json();
    },
  });

  // Safe fallback list to handle error responses/unauthorized object returns
  const appointmentsList = Array.isArray(appointments) ? appointments : [];

  // Fetch waitlist
  const { data: waitlist = [] } = useQuery({
    queryKey: ['waitlist'],
    queryFn: async () => {
      const res = await fetch('/api/waitlist');
      return res.json();
    },
  });

  const waitlistList = Array.isArray(waitlist) ? waitlist.filter((w: any) => w.status === 'WAITING') : [];

  // Check-in patient mutation
  const checkInMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: AppointmentStatus.WAITING }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Promote waitlist patient mutation
  const promoteMutation = useMutation({
    mutationFn: async ({ waitlistId, startTime, endTime, treatmentType }: { waitlistId: string, startTime: string, endTime: string, treatmentType: string }) => {
      const res = await fetch('/api/waitlist/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waitlistId,
          date: todayStr,
          startTime,
          endTime,
          treatmentType,
          assignedSlotDuration: 15
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    }
  });

  // Stats Calculations
  const completedCount = appointmentsList.filter((a: any) => a.status === AppointmentStatus.COMPLETED).length;
  const waitingCount = appointmentsList.filter((a: any) => a.status === AppointmentStatus.WAITING).length;

  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning, Dr. Rashmita';
    if (hour >= 12 && hour < 17) return 'Good Afternoon, Dr. Rashmita';
    if (hour >= 17 && hour < 22) return 'Good Evening, Dr. Rashmita';
    return 'Working Late, Dr. Rashmita';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalToday = appointmentsList.length;
  const contextLine = totalToday > 0
    ? `${totalToday} appointment${totalToday === 1 ? '' : 's'} today · ${waitingCount > 0 ? `${waitingCount} waiting in reception` : `${completedCount} completed`}`
    : 'No appointments scheduled today — clear day';

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* 2-Column Dashboard Shell for Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          
          {/* CENTERPIECE HERO CARD — Primary Practice Welcome Desk */}
          <GlassPanel accent="teal" className="p-6 md:p-7 flex flex-col justify-between relative overflow-hidden flex-1 space-y-6">
            
            {/* 3D Holographic Gyroscope Sculpture — Moved Leftwards into Card Area */}
            <div className="absolute right-8 lg:right-12 top-1 w-40 h-40 lg:w-44 lg:h-44 hidden lg:flex items-center justify-center pointer-events-none z-0 opacity-65 select-none overflow-hidden">
              {/* Harmonized Ambient Glow */}
              <motion.div
                animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-32 h-32 rounded-full blur-2xl pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 60%, transparent 80%)',
                }}
              />

              <svg viewBox="0 0 240 240" className="w-full h-full relative z-10 overflow-visible" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="holoRingGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
                  </linearGradient>

                  <linearGradient id="holoRingGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.15" />
                  </linearGradient>

                  <radialGradient id="holoCoreGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                    <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Outer Orbiting Gyro Ring 1 */}
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '120px 120px' }}
                >
                  <ellipse cx="120" cy="120" rx="95" ry="38" fill="none" stroke="url(#holoRingGrad1)" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.75" />
                  <circle cx="215" cy="120" r="3.5" fill="#FFFFFF" />
                  <circle cx="25" cy="120" r="2.5" fill="#FFFFFF" opacity="0.7" />
                </motion.g>

                {/* Counter-rotating Gyro Ring 2 */}
                <motion.g
                  animate={{ rotate: -360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '120px 120px' }}
                >
                  <ellipse cx="120" cy="120" rx="42" ry="92" fill="none" stroke="url(#holoRingGrad2)" strokeWidth="1.75" strokeDasharray="10 6" opacity="0.8" />
                  <circle cx="120" cy="212" r="3.5" fill="#FFFFFF" />
                </motion.g>

                {/* Diagonal Orbit Ring 3 */}
                <motion.g
                  animate={{ rotate: 360, scale: [0.98, 1.04, 0.98] }}
                  transition={{ rotate: { duration: 32, repeat: Infinity, ease: 'linear' }, scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
                  style={{ transformOrigin: '120px 120px' }}
                >
                  <ellipse cx="120" cy="120" rx="78" ry="78" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.2" strokeDasharray="2 12" />
                </motion.g>

                {/* Pulsing Core Orb */}
                <motion.circle
                  cx="120"
                  cy="120"
                  r="30"
                  fill="url(#holoCoreGlow)"
                  animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.7, 0.95, 0.7] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Inner Glowing Nucleus */}
                <motion.circle
                  cx="120"
                  cy="120"
                  r="11"
                  fill="#FFFFFF"
                  animate={{ scale: [1, 0.9, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />

                {/* Floating Ambient Particles */}
                {[
                  { cx: 80, cy: 70, r: 2, delay: 0 },
                  { cx: 160, cy: 80, r: 2.5, delay: 1 },
                  { cx: 170, cy: 160, r: 1.5, delay: 2 },
                  { cx: 75, cy: 155, r: 2, delay: 1.5 },
                ].map((p, idx) => (
                  <motion.circle
                    key={idx}
                    cx={p.cx}
                    cy={p.cy}
                    r={p.r}
                    fill="#FFFFFF"
                    animate={{ y: [0, -6, 0], opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 3 + idx, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
                  />
                ))}
              </svg>
            </div>

            {/* TOP ROW: Dynamic Time-Aware Welcome Title */}
            <div className="relative z-10 space-y-2.5 max-w-sm sm:max-w-md lg:max-w-[68%] text-left">
              <div>
                <span 
                  onClick={() => setQuoteIndex((prev) => (prev + 1) % CLINICAL_QUOTES.length)}
                  className="inline-flex items-start gap-2.5 text-[13px] sm:text-sm font-sans italic tracking-wide px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white/90 border border-white/20 rounded-2xl shadow-sm cursor-pointer transition-all group leading-snug"
                  title="Click to cycle quote"
                >
                  <Sparkles className="w-4 h-4 text-[#19E3B1] shrink-0 mt-0.5 group-hover:rotate-12 transition-transform" />
                  <span className="line-clamp-3">{CLINICAL_QUOTES[quoteIndex]}</span>
                </span>
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#F5F3FA] leading-tight">
                  {getDynamicGreeting()}
                </h3>
                <p className="text-xs text-[#F5F3FA]/65 leading-relaxed font-medium mt-1.5">
                  {appointmentsList.length > 0
                    ? `You have ${appointmentsList.length} patient session${appointmentsList.length === 1 ? '' : 's'} scheduled for today. ${waitingCount > 0 ? `${waitingCount} patient${waitingCount === 1 ? ' is' : 's are'} currently waiting in reception.` : 'No patients currently waiting in lounge.'}`
                    : 'Welcome to your clinic desk. All session logs, waitlist queues, and AI triage streams are active and ready.'
                  }
                </p>
              </div>
            </div>

            {/* MIDDLE ROW: Symmetrical 3-Column Mini KPI Bar */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider truncate">Intake</p>
                  <p className="text-sm font-bold text-white truncate">{appointmentsList.length} Sessions</p>
                </div>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-[#FFB454]/15 border border-[#FFB454]/30 flex items-center justify-center text-[#FFB454] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider truncate">Lounge Queue</p>
                  <p className="text-sm font-bold text-[#FFB454] truncate">{waitingCount} Waiting</p>
                </div>
              </div>

              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3 flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-[#19E3B1]/15 border border-[#19E3B1]/30 flex items-center justify-center text-[#19E3B1] shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider truncate">Completed</p>
                  <p className="text-sm font-bold text-[#19E3B1] truncate">{completedCount} Done</p>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: Today's Daily Intake Checklist */}
            <div className="relative z-10 w-full border-t border-white/10 pt-4 space-y-3">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-xs font-mono font-bold tracking-wider text-white/90 uppercase flex items-center gap-2">
                  <Activity className="h-4 w-4 text-white" />
                  Today's Intake Checklist ({appointmentsList.length} scheduled)
                </h4>
              </div>

              <div className="max-h-[170px] overflow-y-auto space-y-2 pr-1 select-none">
                {appointmentsList.length === 0 ? (
                  <div className="p-4 text-center bg-white/[0.02] rounded-2xl border border-white/08 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white/70">No appointments registered for today</p>
                        <p className="text-[10px] font-mono text-white/40">All intake slots clear and available</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  appointmentsList.map((app: any) => {
                    const status = app.status;
                    return (
                      <div key={app.id} className="flex justify-between items-center p-3 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl gap-4 transition-all">
                        <div className="flex items-center gap-3 truncate w-[75%]">
                          {/* Time tag */}
                          <span className="text-[11px] font-mono font-bold text-white bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg shrink-0">
                            {app.startTime}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-[#F5F3FA] truncate">{app.patient?.fullName || 'Patient'}</p>
                            <p className="text-[10px] font-mono text-white/40 mt-0.5">{app.treatmentType}</p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {status === 'SCHEDULED' ? (
                            <button
                              onClick={() => checkInMutation.mutate(app.id)}
                              className="bg-white hover:bg-white/90 text-black text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.25)] border-0"
                            >
                              Check In
                            </button>
                          ) : status === 'WAITING' ? (
                            <span className="text-[10px] font-bold uppercase text-[#FFB454] bg-[#FFB454]/15 border border-[#FFB454]/30 px-2.5 py-1 rounded-full">
                              Waiting
                            </span>
                          ) : status === 'IN_PROGRESS' ? (
                            <span className="text-[10px] font-bold uppercase text-[#19E3B1] bg-[#19E3B1]/15 border border-[#19E3B1]/30 px-2.5 py-1 rounded-full">
                              In Progress
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase text-white/40 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </GlassPanel>
          
          {/* Sub-grid of two cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* WEEKLY APPOINTMENTS CHART CARD */}
            <GlassPanel 
              onClick={() => setShowDemandModal(true)}
              className="p-5 flex flex-col justify-between min-h-[160px] cursor-pointer group hover:border-primary/40 transition-all relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <h5 className="eyebrow">
                    Demand Levels
                  </h5>
                  <h4 className="font-serif font-bold text-sm text-[#F5F3FA]">
                    Weekly Appointments
                  </h4>
                </div>
                <span className="eyebrow text-[9px] text-[rgba(245,243,250,0.4)] group-hover:text-primary transition-colors flex items-center gap-1">
                  <Maximize2 className="h-3 w-3" /> Details
                </span>
              </div>

              {/* SVG Weekly Bar Chart */}
              <div className="mt-4 select-none">
                <svg viewBox="0 0 240 80" className="w-full h-20 overflow-visible" xmlns="http://www.w3.org/2000/svg">
                  <line x1="0" y1="60" x2="240" y2="60" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="30" x2="240" y2="30" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                  
                  {[35, 60, 45, 80, 50, 20].map((heightPct, idx) => {
                    const xPos = idx * 40 + 15;
                    const barHeight = (heightPct / 100) * 55;
                    const yPos = 60 - barHeight;
                    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S'];
                    
                    return (
                      <g key={idx} className="group cursor-pointer">
                        <rect x={xPos} y="5" width="12" height="55" rx="3" fill="rgba(255,255,255,0.03)" />
                        <motion.rect 
                          x={xPos} 
                          y={yPos} 
                          width="12" 
                          height={barHeight} 
                          rx="3" 
                          fill="url(#barGradient)" 
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          style={{ transformOrigin: 'bottom', originY: 1 }}
                          className="transition-all duration-200"
                          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: idx * 0.05 }}
                        />
                        <text 
                          x={xPos + 6} 
                          y="75" 
                          textAnchor="middle" 
                          className="text-[10px] font-bold fill-[rgba(245,243,250,0.4)] font-sans"
                        >
                          {dayLabels[idx]}
                        </text>
                      </g>
                    );
                  })}
                  <defs>
                    <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--aurora-teal)" />
                      <stop offset="100%" stopColor="var(--aurora-violet)" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </GlassPanel>

            {/* TALL VOICE AGENT WIDGET */}
            <GlassPanel 
              onClick={onVoiceAgentClick}
              accent="teal"
              className="p-5 flex flex-col justify-between min-h-[160px] cursor-pointer group"
            >
              <div className="space-y-0.5">
                <h5 className="eyebrow">
                  Live AI Calling
                </h5>
                <h4 className="font-serif font-bold text-sm text-[#F5F3FA]">
                  Voice Agent Status
                </h4>
              </div>

              <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] p-3 rounded-xl flex items-center justify-between gap-3 mt-4">
                <div className="flex flex-col gap-0.5 items-start">
                  <span className="text-[9px] font-bold uppercase text-[#19E3B1] bg-[rgba(25,227,177,0.12)] px-2 py-0.5 border border-[rgba(25,227,177,0.3)] rounded-md flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#19E3B1] animate-ping" />
                    Online
                  </span>
                  <p className="text-[11px] font-bold text-[#F5F3FA] mt-1">Ready for inbound routing</p>
                </div>
                <div className="flex gap-1 items-center justify-center h-4 shrink-0">
                  {[0.4, 0.9, 0.5, 0.7, 0.3].map((val, idx) => (
                    <motion.div 
                      key={idx}
                      animate={{ scaleY: [1, 2.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: idx * 0.15 }}
                      className="w-0.5 bg-white h-2 rounded-full shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                    />
                  ))}
                </div>
              </div>
            </GlassPanel>

          </div>
        </div>

        {/* RIGHT COLUMN (1/3 width on desktop) */}
        <div className="space-y-6 flex flex-col">
          
          {/* SPOTLIGHT KPI TILE */}
          <GlassPanel accent="none" className="p-6 flex flex-col justify-between shadow-[0_0_50px_-20px_rgba(255,255,255,0.15)] min-h-[150px] flex-1">
            <div className="space-y-0.5">
              <p className="eyebrow text-white">
                Glanceable Metrics
              </p>
              <h4 className="font-serif font-bold text-lg text-[#F5F3FA] leading-snug">
                Appointments Volume
              </h4>
            </div>
            <div className="mt-4">
              <p className="text-5xl font-serif font-bold num-tabular text-white">
                {appointmentsList.length}
              </p>
              <p className="text-[11px] text-[rgba(245,243,250,0.62)] mt-1 font-medium">
                Sessions scheduled for today
              </p>
            </div>
          </GlassPanel>

          {/* SESSIONS STATUS (DONUT) */}
          <GlassPanel className="p-6 flex flex-col justify-between min-h-[150px] flex-1">
            <div className="space-y-0.5">
              <h5 className="eyebrow">
                Sessions Status
              </h5>
              <h4 className="font-serif font-bold text-sm text-[#F5F3FA]">
                Completion Rate
              </h4>
            </div>

            <div className="flex items-center gap-6 mt-4">
              {/* Donut Widget */}
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="absolute -rotate-90" width="100%" height="100%" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke="#FFFFFF" 
                    strokeWidth="3.5" 
                    strokeDasharray={`${appointmentsList.length > 0 ? (completedCount / appointmentsList.length) * 100 : 0} ${100 - (appointmentsList.length > 0 ? (completedCount / appointmentsList.length) * 100 : 0)}`}
                  />
                </svg>
                <span className="text-xs font-serif font-bold num-tabular text-white">
                  {appointmentsList.length > 0 ? Math.round((completedCount / appointmentsList.length) * 100) : 0}%
                </span>
              </div>

              <div className="space-y-1.5 font-medium text-xs text-[rgba(245,243,250,0.7)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.5)]" />
                  <span>Completed: {completedCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-[#FFB454] rounded-full shadow-[0_0_6px_#FFB454]" />
                  <span>Waiting: {waitingCount}</span>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* LIVE WAITLIST TRACKER */}
          <GlassPanel className="p-6 flex flex-col justify-between min-h-[220px] flex-1">
            <div className="space-y-0.5 border-b border-[rgba(255,255,255,0.08)] pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="eyebrow">
                    Waitlist Management
                  </h5>
                  <h4 className="font-serif font-bold text-sm text-[#F5F3FA]">
                    Clinic Live Waitlist
                  </h4>
                </div>
                <span className="bg-white/10 border border-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                  {waitlistList.length} Active
                </span>
              </div>
            </div>

            <div className="mt-3.5 space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-1">
              {waitlistList.length === 0 ? (
                <div className="p-4 bg-[rgba(255,255,255,0.02)] rounded-xl text-center">
                  <p className="text-xs text-[rgba(245,243,250,0.4)] italic font-medium">No patients waitlisted today.</p>
                </div>
              ) : (
                waitlistList.map((entry: any) => {
                  const isPromoting = promotingEntryId === entry.id;
                  return (
                    <div key={entry.id} className="p-3 border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] rounded-xl space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="truncate">
                          <p className="text-xs font-bold text-[#F5F3FA] truncate">{entry.patient.fullName}</p>
                          <p className="eyebrow text-[9px] mt-0.5">
                            {entry.preferredTimeWindow} • {entry.desiredTreatmentType}
                          </p>
                        </div>
                        {!isPromoting && (
                          <button
                            onClick={() => {
                              setPromotingEntryId(entry.id);
                              setPromoteModality(entry.desiredTreatmentType);
                              setPromoteTime('12:00');
                            }}
                            className="bg-white hover:bg-white/90 text-black text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors cursor-pointer border-0 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                          >
                            Promote
                          </button>
                        )}
                      </div>

                      {isPromoting && (
                        <div className="bg-[rgba(18,13,31,0.9)] border border-[rgba(255,255,255,0.12)] p-3 rounded-xl space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="eyebrow text-[8px] block mb-1">Start Time</label>
                              <input
                                type="text"
                                value={promoteTime}
                                onChange={(e) => setPromoteTime(e.target.value)}
                                className="w-full text-xs glass-input p-1.5 font-semibold"
                                placeholder="e.g. 12:00"
                              />
                            </div>
                            <div>
                              <label className="eyebrow text-[8px] block mb-1">Modality</label>
                              <input
                                type="text"
                                value={promoteModality}
                                onChange={(e) => setPromoteModality(e.target.value)}
                                className="w-full text-xs glass-input p-1.5 font-semibold"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-1.5 pt-1.5 border-t border-[rgba(255,255,255,0.08)]">
                            <button
                              onClick={() => setPromotingEntryId(null)}
                              className="px-2.5 py-1 border border-[rgba(255,255,255,0.1)] text-xs font-bold rounded-lg cursor-pointer bg-transparent text-[rgba(245,243,250,0.6)]"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                promoteMutation.mutate({
                                  waitlistId: entry.id,
                                  startTime: promoteTime,
                                  endTime: promoteTime,
                                  treatmentType: promoteModality
                                });
                                setPromotingEntryId(null);
                              }}
                              className="px-2.5 py-1 bg-white text-black text-xs font-bold rounded-lg cursor-pointer border-0 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </GlassPanel>

        </div>

      </div>

      {/* Detailed Demand Analytics Modal */}
      <AnimatePresence>
        {showDemandModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemandModal(false)}
              className="absolute inset-0 backdrop-blur-md bg-black/60"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative bg-[#120D1F] border border-[rgba(255,255,255,0.12)] p-6 md:p-8 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.6)] w-full max-w-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowDemandModal(false)}
                className="absolute right-5 top-5 p-2 rounded-full hover:bg-[rgba(255,255,255,0.08)] text-[rgba(245,243,250,0.4)] hover:text-[#F5F3FA] cursor-pointer"
              >
                <X className="h-5 w-5 stroke-[1.75]" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] pb-4">
                <div className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] text-primary border border-primary/30">
                  <BarChart3 className="h-6 w-6 stroke-[1.75]" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#F5F3FA]">
                    Weekly Appointment Analytics
                  </h3>
                  <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium mt-0.5">
                    Detailed daily patient throughput, peak booking slots, and capacity utilization.
                  </p>
                </div>
              </div>

              {/* Daily Throughput Grid */}
              <div className="space-y-3">
                <h4 className="eyebrow text-[10px] text-[rgba(245,243,250,0.5)]">
                  Daily Capacity Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { day: 'Monday', count: 14, pct: '70%', peak: '10:00 AM - 12:30 PM', status: 'Moderate' },
                    { day: 'Tuesday', count: 24, pct: '95%', peak: '09:00 AM - 11:30 AM', status: 'High' },
                    { day: 'Wednesday', count: 18, pct: '75%', peak: '02:00 PM - 04:30 PM', status: 'Moderate' },
                    { day: 'Thursday', count: 28, pct: '100%', peak: '10:00 AM - 05:00 PM', status: 'Peak Capacity' },
                    { day: 'Friday', count: 20, pct: '85%', peak: '11:00 AM - 01:00 PM', status: 'High' },
                    { day: 'Saturday', count: 8, pct: '40%', peak: '09:00 AM - 12:00 PM', status: 'Light' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-serif font-bold text-[#F5F3FA]">{item.day}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            item.pct === '100%' 
                              ? 'bg-[rgba(255,93,122,0.15)] text-[#FF5D7A] border-[rgba(255,93,122,0.3)]'
                              : 'bg-primary/15 text-primary border-primary/30'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-[rgba(245,243,250,0.5)] mt-1">
                          Peak: {item.peak}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-serif font-bold text-[#F5F3FA] block num-tabular">{item.count} sessions</span>
                        <span className="text-[10px] text-primary font-bold num-tabular">{item.pct} full</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modality Demand */}
              <div className="space-y-3">
                <h4 className="eyebrow text-[10px] text-[rgba(245,243,250,0.5)]">
                  Modality Distribution
                </h4>
                <div className="space-y-2">
                  {[
                    { label: 'Spine & Musculoskeletal', pct: 42, color: 'bg-primary' },
                    { label: 'Post-Op Rehabilitation', pct: 28, color: 'bg-[#7B5CFF]' },
                    { label: 'Sports Injury & Dry Needling', pct: 18, color: 'bg-[#22B8FF]' },
                    { label: 'Neuro & Geriatric Care', pct: 12, color: 'bg-[#E23FA6]' },
                  ].map((m, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-[rgba(245,243,250,0.8)]">{m.label}</span>
                        <span className="text-[#F5F3FA] font-bold num-tabular">{m.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                        <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendation Box */}
              <div className="p-4 bg-[rgba(255,255,255,0.03)] border border-primary/30 rounded-2xl flex items-start gap-3 text-xs text-[rgba(245,243,250,0.8)]">
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#F5F3FA]">AI Capacity Optimization Tip</p>
                  <p className="text-[11px] text-[rgba(245,243,250,0.6)] mt-0.5 leading-relaxed">
                    Thursday demand consistently hits 100% capacity. Consider enabling an automated waitlist auto-promotion buffer for peak hours between 10 AM and 2 PM.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
