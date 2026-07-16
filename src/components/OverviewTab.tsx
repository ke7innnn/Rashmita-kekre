'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Activity, Users, PhoneCall, Award, Calendar, 
  ArrowRight, ShieldCheck, HeartPulse, UserCheck, ChevronRight,
  Clock, Sparkles, Plus, Check, Trash2, ArrowUpRight, Share2, Send
} from 'lucide-react';
const AppointmentStatus = { WAITING: 'WAITING', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', SCHEDULED: 'SCHEDULED', NO_SHOW: 'NO_SHOW', CANCELLED: 'CANCELLED' } as const;
type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

interface Props {
  onVoiceAgentClick?: () => void;
}

export default function OverviewTab({ onVoiceAgentClick }: Props) {
  const queryClient = useQueryClient();
  const [promotingEntryId, setPromotingEntryId] = useState<string | null>(null);
  const [promoteTime, setPromoteTime] = useState('11:00');
  const [promoteModality, setPromoteModality] = useState('Physiotherapy');

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
          assignedSlotDuration: 30
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

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* 2-Column Dashboard Shell for Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          
          {/* CENTERPIECE HERO CARD */}
          <div className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.02)] flex flex-col justify-between relative overflow-hidden min-h-[280px] flex-1">
            
            {/* Abstract vector 3D sculpture in centerpiece (Opaque, Visible) */}
            <div className="absolute right-4 top-4 bottom-4 w-1/3 hidden md:block pointer-events-none">
              <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {/* Sage Green Base Blob */}
                <motion.path 
                  d="M 50,100 C 50,60 140,50 150,100 C 160,150 50,150 50,100" 
                  fill="#E2ECE9" 
                  animate={{ scale: [1, 1.05, 0.98, 1], rotate: [0, 90, 180, 270, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
                {/* Terracotta/Amber Accent Sculpture Part */}
                <motion.path 
                  d="M 70,100 C 70,70 130,70 130,100 C 130,130 70,130 70,100" 
                  fill="#FCE2DB"
                  animate={{ rotate: [360, 270, 180, 90, 0], scale: [0.95, 1.05, 0.95] }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Inner Core Solid Primary Sage Ball */}
                <motion.circle 
                  cx="100" 
                  cy="100" 
                  r="20" 
                  fill="#4E6551"
                  opacity="0.95"
                  animate={{ scale: [0.9, 1.1, 0.9], y: [0, -4, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* Terracotta Core Ball */}
                <motion.circle 
                  cx="120" 
                  cy="90" 
                  r="12" 
                  fill="#D98353"
                  opacity="0.9"
                  animate={{ x: [0, 8, 0], y: [0, 5, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                />
              </svg>
            </div>

            <div className="space-y-2 max-w-md relative z-10">
              <span className="inline-block text-[9px] font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full uppercase tracking-wider">
                Practice Overview
              </span>
              <h3 className="text-2xl font-serif text-[#2B2620] font-semibold leading-snug mt-1">
                Dr. Rashmita's Clinic Desk
              </h3>
              <p className="text-xs text-[#2B2620]/60 leading-normal font-semibold mt-1">
                Manage your daily schedule, check in upcoming patients, and coordinate active voice agent triage logs.
              </p>
            </div>

            {/* Today's Daily Intake Checklist */}
            <div className="space-y-3 relative z-10 w-full mt-6 border-t border-[#EADFCA]/40 pt-4">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/50 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  Today's Intake Checklist ({appointmentsList.length} scheduled)
                </h4>
              </div>

              <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1 select-none">
                {appointmentsList.length === 0 ? (
                  <div className="p-5 text-center bg-[#FAF6EF]/50 rounded-xl border border-[#EADFCA]/50">
                    <p className="text-xs text-foreground/45 italic font-bold">No appointments registered for today.</p>
                  </div>
                ) : (
                  appointmentsList.map((app: any) => {
                    const status = app.status;
                    return (
                      <div key={app.id} className="flex justify-between items-center p-3 border border-[#EADFCA]/70 bg-[#FAF6EF]/30 hover:bg-[#FAF6EF]/50 rounded-xl gap-4 transition-colors">
                        <div className="flex items-center gap-3 truncate w-[75%]">
                          {/* Time tag */}
                          <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg shrink-0">
                            {app.startTime}
                          </span>
                          <div className="truncate">
                            <p className="text-xs font-bold text-[#2B2620] truncate">{app.patient?.fullName || 'Patient'}</p>
                            <p className="text-[9px] text-[#2B2620]/50 font-bold uppercase tracking-wider">{app.treatmentType}</p>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {status === 'SCHEDULED' ? (
                            <button
                              onClick={() => checkInMutation.mutate(app.id)}
                              className="bg-primary hover:bg-[#3C5040] text-background text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer shadow-xxs border-0"
                            >
                              Check In
                            </button>
                          ) : status === 'WAITING' ? (
                            <span className="text-[9px] font-bold uppercase text-[#D98353] bg-[#D98353]/10 border border-[#D98353]/25 px-2.5 py-1 rounded-full">
                              Waiting
                            </span>
                          ) : status === 'IN_PROGRESS' ? (
                            <span className="text-[9px] font-bold uppercase text-primary bg-primary/10 border border-primary/25 px-2.5 py-1 rounded-full">
                              In Progress
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase text-[#2B2620]/45 bg-[#FAF6EF] border border-[#EADFCA]/50 px-2.5 py-1 rounded-full">
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
          </div>
          
          {/* Sub-grid of two cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* WEEKLY APPOINTMENTS CHART CARD */}
            <div className="bg-[#FFFCF6] border border-[#EADFCA] p-5 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.01)] flex flex-col justify-between min-h-[160px]">
              <div className="space-y-0.5">
                <h5 className="text-[9px] font-mono font-bold text-foreground/40 uppercase tracking-wider">
                  Demand Levels
                </h5>
                <h4 className="font-serif font-bold text-xs text-[#2B2620]">
                  Weekly Appointments
                </h4>
              </div>

              {/* Native, Robust SVG Weekly Bar Chart */}
              <div className="mt-4 select-none">
                <svg viewBox="0 0 240 80" className="w-full h-20 overflow-visible" xmlns="http://www.w3.org/2000/svg">
                  {/* Background grid lines */}
                  <line x1="0" y1="60" x2="240" y2="60" stroke="#EADFCA" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="0" y1="30" x2="240" y2="30" stroke="#EADFCA" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                  
                  {/* Bars (M, T, W, T, F, S) */}
                  {[35, 60, 45, 80, 50, 20].map((heightPct, idx) => {
                    const xPos = idx * 40 + 15;
                    const barHeight = (heightPct / 100) * 55; // max 55px height
                    const yPos = 60 - barHeight;
                    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S'];
                    
                    return (
                      <g key={idx} className="group cursor-pointer">
                        {/* Shadow/Track */}
                        <rect x={xPos} y="5" width="12" height="55" rx="3" fill="#FAF6EF" />
                        {/* Actual Bar with Spring Animation simulated */}
                        <motion.rect 
                          x={xPos} 
                          y={yPos} 
                          width="12" 
                          height={barHeight} 
                          rx="3" 
                          fill="#4E6551" 
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          style={{ transformOrigin: 'bottom', originY: 1 }}
                          className="transition-all duration-200 hover:fill-[#D98353]"
                          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: idx * 0.05 }}
                        />
                        {/* Text Label */}
                        <text 
                          x={xPos + 6} 
                          y="75" 
                          textAnchor="middle" 
                          className="text-[9px] font-bold fill-[#2B2620]/50 font-sans"
                        >
                          {dayLabels[idx]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* TALL VOICE AGENT WIDGET */}
            <div 
              onClick={onVoiceAgentClick}
              className="bg-[#FFFCF6] border border-[#EADFCA] p-5 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.01)] flex flex-col justify-between min-h-[160px] cursor-pointer hover:border-primary/50 transition-all hover:scale-[1.01] duration-200 active:scale-[0.99] group"
            >
              <div className="space-y-0.5">
                <h5 className="text-[9px] font-mono font-bold text-foreground/40 uppercase tracking-wider">
                  Live AI calling
                </h5>
                <h4 className="font-serif font-bold text-xs text-[#2B2620]">
                  Voice Agent Status
                </h4>
              </div>

              <div className="bg-[#FAF6EF]/70 border border-[#EADFCA] p-3 rounded-xl flex items-center justify-between gap-3 mt-4">
                <div className="flex flex-col gap-0.5 items-start">
                  <span className="text-[8px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-150 rounded-md">
                    Online
                  </span>
                  <p className="text-[10px] font-bold text-[#2B2620] mt-1">Ready for inbound routing</p>
                </div>
                <div className="flex gap-0.5 items-center justify-center h-4 shrink-0">
                  {[0.4, 0.9, 0.5, 0.7, 0.3].map((val, idx) => (
                    <motion.div 
                      key={idx}
                      animate={{ scaleY: [1, 2.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: idx * 0.15 }}
                      className="w-0.5 bg-primary h-2"
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN (1/3 width on desktop) */}
        <div className="space-y-6 flex flex-col">
          
          {/* SPOTLIGHT GRADIENT KPI TILE */}
          <div className="bg-[#D98353] text-[#FFFCF6] p-6 rounded-2xl flex flex-col justify-between shadow-[0_6px_25px_rgba(217,131,83,0.15)] border border-[#D98353] min-h-[150px] flex-1">
            <div className="space-y-0.5">
              <p className="text-[9px] font-mono font-bold text-[#FFFCF6]/80 uppercase tracking-wider">
                Glanceable Metrics
              </p>
              <h4 className="font-serif font-bold text-lg leading-snug">
                Appointments Volume
              </h4>
            </div>
            <div className="mt-4">
              <p className="text-5xl font-mono font-bold tracking-tight">
                {appointmentsList.length}
              </p>
              <p className="text-[10px] text-[#FFFCF6]/80 mt-1 font-bold">
                Sessions scheduled for today
              </p>
            </div>
          </div>

          {/* SESSIONS STATUS (DONUT) */}
          <div className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.01)] flex flex-col justify-between min-h-[150px] flex-1">
            <div className="space-y-0.5">
              <h5 className="text-[9px] font-mono font-bold text-foreground/40 uppercase tracking-wider">
                Sessions Status
              </h5>
              <h4 className="font-serif font-bold text-xs text-[#2B2620]">
                Completion Rate
              </h4>
            </div>

            <div className="flex items-center gap-6 mt-4">
              {/* Embedded Donut Widget */}
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="absolute -rotate-90" width="100%" height="100%" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#FAF6EF" strokeWidth="3" />
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke="#4E6551" 
                    strokeWidth="3.5" 
                    strokeDasharray={`${appointmentsList.length > 0 ? (completedCount / appointmentsList.length) * 100 : 0} ${100 - (appointmentsList.length > 0 ? (completedCount / appointmentsList.length) * 100 : 0)}`}
                  />
                </svg>
                <span className="text-[10px] font-mono font-bold text-primary">
                  {appointmentsList.length > 0 ? Math.round((completedCount / appointmentsList.length) * 100) : 0}%
                </span>
              </div>

              <div className="space-y-1.5 font-bold text-[10px] text-[#2B2620]/70">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-primary rounded-full" />
                  <span>Completed: {completedCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-orange-400 rounded-full" />
                  <span>Waiting: {waitingCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LIVE WAITLIST TRACKER & PROMOTION TILE (Replaces Practitioner Profile) */}
          <div className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.01)] flex flex-col justify-between min-h-[220px] flex-1">
            <div className="space-y-0.5 border-b border-[#EADFCA]/40 pb-2.5">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="text-[9px] font-mono font-bold text-foreground/40 uppercase tracking-wider">
                    Waitlist Management
                  </h5>
                  <h4 className="font-serif font-bold text-xs text-[#2B2620]">
                    Clinic Live Waitlist
                  </h4>
                </div>
                <span className="bg-[#FAF6EF] border border-[#EADFCA] text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0">
                  {waitlistList.length} Active
                </span>
              </div>
            </div>

            <div className="mt-3.5 space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-1">
              {waitlistList.length === 0 ? (
                <div className="p-4 bg-[#FAF6EF]/50 rounded-xl text-center">
                  <p className="text-xxs text-foreground/45 italic font-bold">No patients waitlisted today.</p>
                </div>
              ) : (
                waitlistList.map((entry: any) => {
                  const isPromoting = promotingEntryId === entry.id;
                  return (
                    <div key={entry.id} className="p-3 border border-[#EADFCA] bg-[#FAF6EF]/40 rounded-xl space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="truncate">
                          <p className="text-xs font-bold text-[#2B2620] truncate">{entry.patient.fullName}</p>
                          <p className="text-[9px] text-[#2B2620]/45 font-bold uppercase tracking-wider mt-0.5">
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
                            className="bg-primary hover:bg-[#3C5040] text-background text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors cursor-pointer border-0"
                          >
                            Promote
                          </button>
                        )}
                      </div>

                      {isPromoting && (
                        <div className="bg-[#FFFCF6] border border-[#EADFCA] p-2.5 rounded-lg space-y-2.5">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[8px] font-bold text-[#2B2620]/40 uppercase tracking-wider block mb-0.5">Start Time</label>
                              <input
                                type="text"
                                value={promoteTime}
                                onChange={(e) => setPromoteTime(e.target.value)}
                                className="w-full text-[10px] bg-[#FAF6EF] border border-[#EADFCA] rounded-md p-1 focus:outline-hidden font-semibold"
                                placeholder="e.g. 12:00"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-bold text-[#2B2620]/40 uppercase tracking-wider block mb-0.5">Modality</label>
                              <input
                                type="text"
                                value={promoteModality}
                                onChange={(e) => setPromoteModality(e.target.value)}
                                className="w-full text-[10px] bg-[#FAF6EF] border border-[#EADFCA] rounded-md p-1 focus:outline-hidden font-semibold"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-1.5 pt-1 border-t border-[#EADFCA]/40">
                            <button
                              onClick={() => setPromotingEntryId(null)}
                              className="px-2 py-0.5 border border-[#EADFCA] text-[9px] font-bold rounded-md cursor-pointer bg-transparent"
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
                              className="px-2 py-0.5 bg-primary text-background text-[9px] font-bold rounded-md cursor-pointer border-0"
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
          </div>

        </div>

      </div>
    </div>
  );
}
