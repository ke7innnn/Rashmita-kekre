'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, PhoneOutgoing, PhoneCall, X, User, Clock, 
  Calendar, CheckCircle, AlertCircle, Sparkles, Mic,
  Volume2, ArrowRight, Loader2, Copy, Check
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface QuickCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any | null;
  onTransferredToCallList?: () => void;
}

export default function QuickCallModal({
  isOpen,
  onClose,
  patient,
  onTransferredToCallList
}: QuickCallModalProps) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isDialing, setIsDialing] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'simulating' | 'completed'>('idle');
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isQueueing, setIsQueueing] = useState(false);

  if (!isOpen || !patient) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(patient.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectDial = async () => {
    // 1. Log the outbound call attempt
    try {
      await fetch('/api/call-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          direction: 'OUTBOUND',
          phoneNumber: patient.phone,
          duration: 30,
          summary: `Direct dial initiated from directory for ${patient.fullName}.`,
          transcript: `[Direct Dial] Staff member dialed ${patient.fullName} (${patient.phone}).`,
          outcome: 'INFO_ONLY',
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['call-logs'] });
    } catch (e) {
      console.error(e);
    }

    // 2. Trigger native phone dialer
    window.location.href = `tel:${patient.phone}`;
  };

  const handleQueueCall = async () => {
    setIsQueueing(true);
    try {
      const res = await fetch('/api/call-logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientIds: [patient.id],
          reason: 'Directly queued from Patient Directory Quick Call',
        }),
      });

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['call-logs'] });
        if (onTransferredToCallList) onTransferredToCallList();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsQueueing(false);
    }
  };

  const handleSimulateAICall = () => {
    setCallStatus('simulating');
    setTranscript([]);

    const lines = [
      `[Dialer] Ringing ${patient.fullName} (${patient.phone})...`,
      `Patient (${patient.fullName}): Hello?`,
      `Agent: Hello ${patient.fullName}, this is the automated care assistant from Health 360 Clinic.`,
      `Agent: We wanted to check in regarding your ${patient.treatmentModalityAssigned || 'physiotherapy'} treatment plan. How is your recovery feeling?`,
      `Patient (${patient.fullName}): Much better, thank you! I'd like to book my next session.`,
      `Agent: Wonderful! Let's lock that in with Dr. Rashmita this week.`,
      `[Dialer] Call finished successfully. Session logged.`
    ];

    let i = 0;
    const timer = setInterval(() => {
      if (i < lines.length) {
        setTranscript(prev => [...prev, lines[i]]);
        i++;
      } else {
        clearInterval(timer);
        setCallStatus('completed');
        
        // Log to database
        fetch('/api/call-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId: patient.id,
            direction: 'OUTBOUND',
            phoneNumber: patient.phone,
            duration: 75,
            summary: `Automated Outbound Care Check-in with ${patient.fullName}. Appointment follow-up recorded.`,
            transcript: lines.join('\n'),
            outcome: 'BOOKED',
          }),
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['call-logs'] });
        });
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-[#0F0C1B] border border-white/15 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#7B5CFF]/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#FF5C7A]/15 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <PhoneOutgoing className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white">Quick Call Patient</h3>
              <p className="text-xs text-white/50">Direct dial, AI outbound assistant, or add to call list</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition cursor-pointer border border-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Patient Profile Snapshot */}
        <div className="my-5 p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3.5 truncate">
            <div className="h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center font-serif text-sm font-bold border border-white/20 shrink-0">
              {(patient.fullName || 'PT').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <h4 className="font-serif text-base font-bold text-white truncate">{patient.fullName}</h4>
              <p className="text-xs text-white/60 mt-0.5">
                {patient.gender} • {patient.treatmentModalityAssigned || 'Standard Care'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-300 block">{patient.phone}</span>
              <span className="text-[10px] text-white/40">Primary Contact</span>
            </div>
            <button
              onClick={handleCopyPhone}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition border border-white/10 cursor-pointer"
              title="Copy Phone Number"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Live Simulation Transcript HUD */}
        {callStatus !== 'idle' && (
          <div className="mb-5 p-4 rounded-2xl bg-black/50 border border-emerald-500/30 space-y-3 relative z-10">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                {callStatus === 'simulating' ? 'AI Calling In Progress...' : 'Call Completed & Logged'}
              </span>
              <span className="text-[10px] font-mono text-white/50">Simulated Audio Flow</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs font-mono">
              {transcript.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`py-0.5 ${line.startsWith('Agent:') ? 'text-cyan-300 font-semibold' : line.startsWith('Patient') ? 'text-white' : 'text-white/50 italic'}`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
          {/* Direct Phone Dial */}
          <button
            onClick={handleDirectDial}
            className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs py-3 px-4 rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Phone className="h-4 w-4 stroke-[2.5]" />
            <span>Direct Dial ({patient.phone})</span>
          </button>

          {/* AI Voice Assistant Dial */}
          <button
            disabled={callStatus === 'simulating'}
            onClick={handleSimulateAICall}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs py-3 px-4 rounded-2xl border border-white/15 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>AI Voice Outreach</span>
          </button>
        </div>

        {/* Secondary Option: Transfer to Call List */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between relative z-10 text-xs">
          <span className="text-white/60">Need to call later or batch outreach?</span>
          <button
            onClick={handleQueueCall}
            disabled={isQueueing}
            className="flex items-center gap-1.5 text-white/80 hover:text-white font-semibold underline underline-offset-4 cursor-pointer transition"
          >
            {isQueueing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PhoneCall className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span>Transfer to Call List</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
