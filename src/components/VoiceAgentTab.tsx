'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneCall, PhoneIncoming, PhoneOutgoing, User, Clock, 
  MessageSquare, AlertCircle, CheckCircle, Search, 
  ChevronDown, ChevronUp, Loader2, Play, Activity, Mic,
  UserCheck, AlertTriangle, Sparkles, Volume2
} from 'lucide-react';
import SegmentedControl from './SegmentedControl';
import GlassPanel from './GlassPanel';

const CallDirection = { INBOUND: 'INBOUND', OUTBOUND: 'OUTBOUND' } as const;
type CallDirection = typeof CallDirection[keyof typeof CallDirection];
const CallOutcome = {
  BOOKED: 'BOOKED',
  RESCHEDULED: 'RESCHEDULED',
  CANCELLED: 'CANCELLED',
  INQUIRY_ONLY: 'INQUIRY_ONLY',
  FOLLOW_UP_NEEDED: 'FOLLOW_UP_NEEDED',
  MISSED: 'MISSED',
  INFO_ONLY: 'INFO_ONLY',
  NO_ANSWER: 'NO_ANSWER'
} as const;
type CallOutcome = typeof CallOutcome[keyof typeof CallOutcome];

export default function VoiceAgentTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  // Tab state for left panel (Followups vs Drop-offs)
  const [leftTab, setLeftTab] = useState('followups');

  // Live simulation states
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const [liveSummary, setLiveSummary] = useState('');

  // 1. Fetch Call Logs
  const { data: callLogs = [], isLoading } = useQuery({
    queryKey: ['call-logs', search],
    queryFn: async () => {
      const res = await fetch(`/api/call-logs?q=${search}`);
      if (!res.ok) throw new Error('Failed to fetch call logs');
      return res.json();
    },
  });

  // 2. Fetch Patients for Drop-off calculations
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-list-for-dropoff'],
    queryFn: async () => {
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    },
  });

  // 3. Mutation to resolve follow-ups
  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/call-logs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpActioned: true }),
      });
      if (!res.ok) throw new Error('Action failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['call-logs'] });
    },
  });

  // Calculate Drop-off List (cadence elapsed and no upcoming scheduled booking)
  const dropOffAlerts = patients.filter((p: any) => {
    if (!p.appointments || p.appointments.length === 0) return false;
    const completedApps = p.appointments.filter((a: any) => a.status === 'COMPLETED');
    if (completedApps.length === 0) return false;

    const lastApp = completedApps[0];
    const lastDate = new Date(lastApp.date).getTime();
    const daysSinceLastSession = (Date.now() - lastDate) / (1000 * 24 * 60 * 60);

    const cadenceDays = p.expectedCadence === 'biweekly' ? 14 : 7;
    
    const hasFutureApp = p.appointments.some((a: any) => {
      const appDate = new Date(a.date).getTime();
      return appDate > Date.now() && a.status === 'SCHEDULED';
    });

    return daysSinceLastSession > cadenceDays && !hasFutureApp;
  });

  // Simulate an active call (inbound or outbound rebooking)
  const triggerSimulation = (targetPatient: any = null) => {
    if (isLiveCallActive) return;
    setIsLiveCallActive(true);
    setLiveTranscript([]);
    setLiveSummary('');

    let lines: string[] = [];
    let summaryText = '';
    let targetName = 'Caller';
    let targetId = '';
    let phoneNum = '+919999988888';

    if (targetPatient && targetPatient.fullName) {
      targetName = targetPatient.fullName;
      targetId = targetPatient.id;
      phoneNum = targetPatient.phone;
      lines = [
        `[System] Dialing ${targetName} (${phoneNum})...`,
        `Patient (${targetName}): Hello?`,
        `Agent: Hello ${targetName}, I am the AI calling from Health 360 Clinic. I notice you missed your expected ${targetPatient.expectedCadence} session this week. Would you like to schedule one?`,
        `Patient (${targetName}): Oh yes, I forgot. Can we do Wednesday afternoon at 3:00 PM?`,
        `Agent: Yes, we have a 3:00 PM slot open with Dr. Rashmita for ${targetPatient.treatmentModalityAssigned || 'Manual Therapy'}. Let me lock that in.`,
        `Patient (${targetName}): Perfect, thank you.`,
        `Agent: Excellent, booked for Wednesday at 3:00 PM. See you then!`
      ];
      summaryText = `Outbound Rebooking Call successfully booked an appointment for ${targetName} on Wednesday at 3:00 PM.`;
    } else {
      lines = [
        "Agent: Hello, thank you for calling Health 360 Clinic. How can I help you?",
        "Patient (Karan): Hi, I would like to schedule a session for dry needling tomorrow afternoon.",
        "Agent: Let me check the schedule for tomorrow. Yes, we have a slot available at 2:30 PM with Dr. Rashmita. Does that work?",
        "Patient (Karan): Yes, that works perfectly. Thank you.",
        "Agent: Excellent, I have scheduled your appointment for tomorrow at 2:30 PM. See you then!"
      ];
      summaryText = "Inbound call from Karan Malhotra requesting Dry Needling. Appointment created successfully for tomorrow at 2:30 PM.";
    }

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < lines.length) {
        setLiveTranscript(prev => [...prev, lines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
        setLiveSummary(summaryText);
        
        const logCallToDatabase = async () => {
          try {
            await fetch('/api/call-logs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                patientId: targetId || null,
                direction: targetPatient ? 'OUTBOUND' : 'INBOUND',
                phoneNumber: phoneNum,
                duration: 95,
                transcript: lines.join('\n'),
                summary: summaryText,
                outcome: 'BOOKED',
                recordingUrl: 'https://placeholder.com/audio.mp3',
              })
            });

            if (targetId) {
              const targetDate = new Date();
              targetDate.setDate(targetDate.getDate() + 3);
              await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  patientId: targetId,
                  date: targetDate.toISOString().split('T')[0],
                  startTime: '15:00',
                  endTime: '15:15',
                  treatmentType: targetPatient.treatmentModalityAssigned || 'Manual Therapy & Joint Mobilization',
                  assignedSlotDuration: 15,
                  source: 'PHONE_AI_AGENT',
                  notes: 'Auto-booked by AI Outbound Rebooking Dialer.'
                })
              });
            }
          } catch (err) {
            console.error(err);
          }
        };

        logCallToDatabase();

        setTimeout(() => {
          setIsLiveCallActive(false);
          queryClient.invalidateQueries({ queryKey: ['call-logs'] });
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
          queryClient.invalidateQueries({ queryKey: ['patients-list-for-dropoff'] });
        }, 4000);
      }
    }, 2000);
  };

  const followUpQueue = callLogs.filter(
    (log: any) => log.outcome === CallOutcome.FOLLOW_UP_NEEDED && !log.followUpActioned
  );

  const getOutcomeStyle = (outcome: CallOutcome) => {
    switch (outcome) {
      case CallOutcome.BOOKED:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case CallOutcome.RESCHEDULED:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case CallOutcome.CANCELLED:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case CallOutcome.FOLLOW_UP_NEEDED:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case CallOutcome.MISSED:
      case CallOutcome.NO_ANSWER:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-white/10 text-white/70 border-white/15';
    }
  };

  const parseTranscript = (text: string) => {
    if (!text) return [];
    return text.split('\n').map((line, index) => {
      const match = line.match(/^([^:]+):(.*)$/);
      if (match) {
        return {
          id: index,
          speaker: match[1].trim(),
          message: match[2].trim(),
        };
      }
      return {
        id: index,
        speaker: '',
        message: line.trim(),
      };
    }).filter(l => l.message);
  };

  const timeSegmentOptions = [
    { label: 'Follow-ups', value: 'followups' },
    { label: 'Drop-off Alerts', value: 'dropoffs' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-140px)] select-none font-sans text-white">
      {/* Left panel: Active Follow-up Queue vs Drop-offs */}
      <GlassPanel className="xl:col-span-1 flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-serif text-white font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-400 stroke-[1.75]" />
              Agent Warnings
            </h3>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              {leftTab === 'followups' ? followUpQueue.length : dropOffAlerts.length} Action
            </span>
          </div>

          <SegmentedControl 
            options={timeSegmentOptions}
            activeValue={leftTab}
            onChange={(val) => setLeftTab(val)}
          />
        </div>

        {/* Tab Lists */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence mode="wait">
            {leftTab === 'followups' ? (
              <motion.div key="followups" className="space-y-3">
                {followUpQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 border border-dashed border-white/10 rounded-2xl p-4">
                    <CheckCircle className="h-8 w-8 text-emerald-400 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-white/70">All Caught Up!</p>
                    <p className="text-xs text-white/40 font-medium">No pending client calls in the follow-up queue.</p>
                  </div>
                ) : (
                  followUpQueue.map((log: any) => (
                    <div 
                      key={log.id} 
                      className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-amber-500/30 p-4 rounded-2xl space-y-3 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-white">
                            {log.patient?.fullName || 'Unregistered Caller'}
                          </h4>
                          <p className="text-xs text-white/50 font-mono mt-0.5">{log.phoneNumber}</p>
                        </div>
                        <span className="text-[10px] font-mono text-white/40">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-white/75 italic bg-white/[0.03] px-3 py-2 rounded-xl border border-white/5 font-medium leading-relaxed">
                        "{log.summary}"
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t border-white/10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          Callback Needed
                        </span>
                        <button
                          onClick={() => resolveMutation.mutate(log.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm"
                        >
                          <CheckCircle className="h-3.5 w-3.5 stroke-[1.75]" />
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div key="dropoffs" className="space-y-3">
                {dropOffAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 border border-dashed border-white/10 rounded-2xl p-4">
                    <CheckCircle className="h-8 w-8 text-emerald-400 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-white/70">No Patient Drop-offs!</p>
                    <p className="text-xs text-white/40 font-medium">All active patients are aligned with their expected cadences.</p>
                  </div>
                ) : (
                  dropOffAlerts.map((p: any) => (
                    <div 
                      key={p.id} 
                      className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-rose-500/30 p-4 rounded-2xl space-y-3 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-white flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-rose-400 stroke-[1.75]" />
                            {p.fullName}
                          </h4>
                          <p className="text-xs text-white/50 font-mono mt-0.5">{p.phone}</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/40">
                          {p.expectedCadence}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 bg-white/[0.03] px-3 py-2 rounded-xl border border-white/5 font-medium leading-relaxed">
                        Patient has missed their schedule. No future scheduled appointments detected.
                      </p>
                      <div className="flex justify-end pt-2 border-t border-white/10">
                        <button
                          onClick={() => triggerSimulation(p)}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-sm"
                        >
                          <PhoneCall className="h-3.5 w-3.5 stroke-[1.75]" />
                          Trigger Rebooking Call
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassPanel>

      {/* Right panel: Live activity & history */}
      <div className="xl:col-span-2 flex flex-col gap-6 h-full overflow-hidden">
        {/* Central Listening Orb Console */}
        <GlassPanel className="p-6 flex flex-col gap-4 relative overflow-hidden shrink-0">
          {/* Subtle Ambient Aura */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-gradient-to-r from-emerald-500/20 via-violet-500/20 to-pink-500/20 blur-[70px] opacity-40 pointer-events-none animate-pulse" />

          <div className="flex justify-between items-center relative z-10">
            <div className="space-y-1">
              <h3 className="text-lg font-serif text-white font-bold flex items-center gap-2">
                <Mic className="h-5 w-5 text-emerald-400 stroke-[1.75]" />
                AI Voice Assistant Console
              </h3>
              <p className="text-xs text-white/50 font-medium">Real-time telephonic reception & automated patient rebooking</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
              <span className={`h-2 w-2 rounded-full ${isLiveCallActive ? 'bg-rose-400 animate-ping' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                {isLiveCallActive ? 'Call In Progress' : 'Agent Ready'}
              </span>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-xl p-4 rounded-2xl min-h-[120px] flex flex-col justify-between border border-white/10 relative z-10">
            {liveTranscript.length === 0 && !isLiveCallActive ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                <p className="text-xs text-white/50 font-medium">No active call running. Trigger a drop-off rebooking call from the left or test an incoming call below.</p>
                <button
                  onClick={() => triggerSimulation(null)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500/60 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <PhoneIncoming className="w-3.5 h-3.5" />
                  Simulate Patient Inbound Call
                </button>
              </div>
            ) : (
              <div className="space-y-2 flex-1 flex flex-col justify-end">
                <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 select-none">
                  {liveTranscript.map((line, idx) => (
                    <motion.p
                      key={idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-medium text-white/90 leading-relaxed"
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>
                {liveSummary && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium"
                  >
                    <strong>Agent Outcome Summary:</strong> {liveSummary}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Call history panel */}
        <GlassPanel className="flex flex-col overflow-hidden flex-1">
          {/* Search header */}
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0">
            <div>
              <h3 className="text-lg font-serif text-white font-bold flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-emerald-400 stroke-[1.75]" />
                Call Logs History
              </h3>
              <p className="text-xs text-white/40 font-medium mt-0.5">Historical phone recordings & conversation transcripts</p>
            </div>
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40 stroke-[1.75]" />
              <input
                type="text"
                placeholder="Search call logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs bg-white/10 border border-white/15 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 text-white placeholder-white/40 rounded-xl outline-none transition font-medium"
              />
            </div>
          </div>

          {/* Scroll list */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
              </div>
            ) : callLogs.length === 0 ? (
              <div className="p-16 text-center text-white/40 font-medium text-xs">No calls logged yet.</div>
            ) : (
              callLogs.map((log: any) => (
                <div key={log.id} className="p-5 hover:bg-white/[0.02] space-y-3 transition-colors">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-full border ${
                        log.direction === CallDirection.INBOUND 
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {log.direction === CallDirection.INBOUND ? (
                          <PhoneIncoming className="h-4 w-4 stroke-[1.75]" />
                        ) : (
                          <PhoneOutgoing className="h-4 w-4 stroke-[1.75]" />
                        )}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-base text-white">
                            {log.patient?.fullName || 'Unregistered Caller'}
                          </h4>
                          <span className="text-xs font-mono text-white/40">• {log.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 mt-1">
                          <Clock className="h-3 w-3 text-white/30" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span>Duration: {log.duration}s</span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border ${getOutcomeStyle(log.outcome)}`}>
                      {log.outcome.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="pl-11 text-xs text-white/80 leading-relaxed font-medium">
                    <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider mb-1">AI Summary:</p>
                    <p className="bg-white/[0.02] border border-white/5 px-3 py-2 rounded-xl italic">
                      "{log.summary || 'Caller hung up without leaving inquiry.'}"
                    </p>
                  </div>

                  {/* Collapsible Transcript Toggle */}
                  <div className="pl-11 pt-1 flex flex-wrap items-center gap-4 text-xs font-bold">
                    {log.recordingUrl && (
                      <a
                        href={log.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-current text-emerald-400" />
                        Listen to Audio
                      </a>
                    )}

                    {log.transcript && (
                      <button
                        onClick={() => setExpandedCallId(expandedCallId === log.id ? null : log.id)}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition cursor-pointer focus:outline-none"
                      >
                        <MessageSquare className="h-3.5 w-3.5 stroke-[1.75]" />
                        {expandedCallId === log.id ? 'Hide Chat Logs' : 'View Full Transcript'}
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedCallId === log.id && log.transcript && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="pl-11 overflow-hidden"
                      >
                        <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col gap-3 max-h-[300px] overflow-y-auto mt-2">
                          {parseTranscript(log.transcript).map((chat) => {
                            const isSent = chat.speaker.toLowerCase().includes('agent') || chat.speaker.toLowerCase().includes('doctor');
                            return (
                              <div
                                key={chat.id}
                                className={`flex flex-col max-w-[85%] ${
                                  isSent ? 'self-end items-end' : 'self-start items-start'
                                }`}
                              >
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1 px-1">
                                  {chat.speaker || 'Caller'}
                                </span>
                                <div
                                  className={`px-3.5 py-2 text-xs font-medium ${
                                    isSent
                                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 rounded-2xl rounded-tr-none'
                                      : 'bg-white/10 border border-white/15 text-white rounded-2xl rounded-tl-none'
                                  }`}
                                >
                                  <p className="leading-normal">{chat.message}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
