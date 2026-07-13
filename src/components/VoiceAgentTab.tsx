'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneCall, PhoneIncoming, PhoneOutgoing, User, Clock, 
  MessageSquare, AlertCircle, CheckCircle, Search, 
  ChevronDown, ChevronUp, Loader2, Play, Activity, Mic,
  UserCheck, AlertTriangle
} from 'lucide-react';
const CallDirection = { INBOUND: 'INBOUND', OUTBOUND: 'OUTBOUND' } as const;
type CallDirection = typeof CallDirection[keyof typeof CallDirection];
const CallOutcome = { BOOKED: 'BOOKED', CANCELLED: 'CANCELLED', INFO_ONLY: 'INFO_ONLY', NO_ANSWER: 'NO_ANSWER', RESCHEDULED: 'RESCHEDULED' } as const;
type CallOutcome = typeof CallOutcome[keyof typeof CallOutcome];
import SegmentedControl from './SegmentedControl';

export default function VoiceAgentTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  // Tab state for left panel (Followups vs Drop-offs)
  const [leftTab, setLeftTab] = useState('followups');

  // Live simulation states for Gemini experience
  const [isLiveCallActive, setIsLiveCallActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const [liveSummary, setLiveSummary] = useState('');
  const [activeCallTarget, setActiveCallTarget] = useState<string | null>(null);

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

    // Last completed date (Prisma returns sorted by date desc)
    const lastApp = completedApps[0];
    const lastDate = new Date(lastApp.date).getTime();
    const daysSinceLastSession = (Date.now() - lastDate) / (1000 * 24 * 60 * 60);

    const cadenceDays = p.expectedCadence === 'biweekly' ? 14 : 7;
    
    // Check if patient has any future scheduled appointment
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
      // Outbound Rebooking Call
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
      // Standard Inbound Triage Simulation
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
        
        // Log to database simulation
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

            // Also create the actual simulated appointment!
            if (targetId) {
              const targetDate = new Date();
              targetDate.setDate(targetDate.getDate() + 3); // Wednesday approximation
              await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  patientId: targetId,
                  date: targetDate.toISOString().split('T')[0],
                  startTime: '15:00',
                  endTime: '15:30',
                  treatmentType: targetPatient.treatmentModalityAssigned || 'Manual Therapy & Joint Mobilization',
                  assignedSlotDuration: 30,
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case CallOutcome.RESCHEDULED:
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case CallOutcome.CANCELLED:
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
      case CallOutcome.FOLLOW_UP_NEEDED:
        return 'bg-orange-50 text-orange-700 border-orange-200/60';
      case CallOutcome.MISSED:
        return 'bg-red-50 text-red-700 border-red-200/60';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200/60';
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
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Left panel: Active Follow-up Queue vs Drop-offs */}
      <div className="xl:col-span-1 bg-[#FFFCF6] border border-[#EADFCA] rounded-2xl flex flex-col overflow-hidden h-full shadow-[0_8px_30px_rgb(42,38,32,0.02)]">
        <div className="p-4 border-b border-[#EADFCA] bg-[#FFFCF6] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-serif text-[#2B2620] font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500 stroke-[1.75]" />
              Agent Warnings
            </h3>
            <span className="bg-orange-500 text-background px-2.5 py-0.5 rounded-full text-xxs font-bold shadow-xxs">
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="wait">
            {leftTab === 'followups' ? (
              <motion.div key="followups" className="space-y-4">
                {followUpQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 border border-dashed border-[#EADFCA] rounded-xl p-4">
                    <CheckCircle className="h-8 w-8 text-emerald-500 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-foreground/60">All Caught Up!</p>
                    <p className="text-xxs text-foreground/40 font-bold">No pending client calls in the follow-up queue.</p>
                  </div>
                ) : (
                  followUpQueue.map((log: any) => (
                    <motion.div 
                      key={log.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[#FFFCF6] border border-[#EADFCA] hover:border-orange-300 p-4 rounded-xl shadow-xxs space-y-3 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#2B2620]">
                            {log.patient?.fullName || 'Unregistered Caller'}
                          </h4>
                          <p className="text-xs text-[#2B2620]/50 font-semibold">{log.phoneNumber}</p>
                        </div>
                        <span className="text-xxs text-foreground/40 font-bold">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#2B2620]/60 italic bg-[#FAF6EF] px-2.5 py-2 rounded-lg border border-[#EADFCA]/50 font-medium">
                        "{log.summary}"
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t border-[#EADFCA]/45">
                        <span className="text-xxs font-bold uppercase tracking-wider text-orange-500">
                          Callback Needed
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => resolveMutation.mutate(log.id)}
                          className="flex items-center gap-1 text-xxs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 cursor-pointer focus:outline-hidden"
                        >
                          <CheckCircle className="h-3 w-3 stroke-[1.75]" />
                          Resolve
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div key="dropoffs" className="space-y-4">
                {dropOffAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 border border-dashed border-[#EADFCA] rounded-xl p-4">
                    <CheckCircle className="h-8 w-8 text-emerald-500 stroke-[1.5]" />
                    <p className="text-sm font-semibold text-foreground/60">No Patient Drop-offs!</p>
                    <p className="text-xxs text-foreground/40 font-bold">All active patients are aligned with their expected cadences.</p>
                  </div>
                ) : (
                  dropOffAlerts.map((p: any) => (
                    <motion.div 
                      key={p.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[#FFFCF6] border border-[#EADFCA] hover:border-red-300 p-4 rounded-xl shadow-xxs space-y-3 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#2B2620] flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-red-500 stroke-[1.75]" />
                            {p.fullName}
                          </h4>
                          <p className="text-xs text-[#2B2620]/50 font-semibold">{p.phone}</p>
                        </div>
                        <span className="text-xxs font-bold uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100/50">
                          {p.expectedCadence}
                        </span>
                      </div>
                      <p className="text-xs text-[#2B2620]/60 bg-[#FAF6EF] px-2.5 py-2 rounded-lg border border-[#EADFCA]/50 font-medium">
                        Patient has missed their schedule. No future scheduled appointments detected.
                      </p>
                      <div className="flex justify-end pt-2 border-t border-[#EADFCA]/45">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => triggerSimulation(p)}
                          className="flex items-center gap-1.5 text-xxs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/20 cursor-pointer focus:outline-hidden"
                        >
                          <PhoneCall className="h-3 w-3 stroke-[1.75]" />
                          Trigger Rebooking Call
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right panel: Live activity & history */}
      <div className="xl:col-span-2 flex flex-col gap-6 h-full overflow-hidden">
        {/* Opal-gradient live calling block */}
        <div className="opal-crystal-gradient border border-[#EADFCA]/85 p-6 rounded-2xl shadow-[0_8px_30px_rgb(42,38,32,0.02)] flex flex-col gap-4 relative overflow-hidden shrink-0">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${isLiveCallActive ? 'bg-red-500 animate-pulse' : 'bg-foreground/25'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/50 animate-pulse">
              {isLiveCallActive ? 'Call In Progress' : 'Agent Ready'}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-serif text-[#2B2620] font-bold flex items-center gap-1.5">
              <Mic className="h-5 w-5 text-primary stroke-[1.75]" />
              AI Voice Assistant Console
            </h3>
            <p className="text-xs text-[#2B2620]/60 font-semibold">Simulated incoming portal for Health 360 call operations</p>
          </div>

          <div className="bg-[#FFFCF6]/85 backdrop-blur-xs p-4 rounded-xl min-h-[120px] flex flex-col justify-between border border-[#EADFCA]/35">
            {liveTranscript.length === 0 && !isLiveCallActive ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-[#2B2620]/45 font-semibold font-bold">No active call running. Trigger drop-offs rebooking or test inbound below.</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => triggerSimulation(null)}
                  className="mt-3 text-xxs font-bold tracking-wider uppercase bg-primary hover:bg-[#3C5040] text-background px-4 py-2 rounded-xl transition-colors cursor-pointer focus:outline-hidden shadow-xs"
                >
                  Simulate Patient Inbound Call
                </motion.button>
              </div>
            ) : (
              <div className="space-y-2 flex-1 flex flex-col justify-end">
                <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 select-none">
                  {liveTranscript.map((line, idx) => (
                    <motion.p
                      key={idx}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-semibold text-[#2B2620]/85 leading-relaxed"
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>
                {liveSummary && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 p-2 bg-emerald-50/70 border border-emerald-200/50 rounded-lg text-xxs text-emerald-800 font-bold"
                  >
                    <strong>Agent Outcome Summary:</strong> {liveSummary}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Call history panel */}
        <div className="bg-[#FFFCF6] border border-[#EADFCA] rounded-2xl flex flex-col overflow-hidden flex-1 shadow-[0_8px_30px_rgb(42,38,32,0.02)]">
          {/* Search header */}
          <div className="p-4 border-b border-[#EADFCA] bg-[#FFFCF6] flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0">
            <div>
              <h3 className="text-2xl font-serif text-[#2B2620] font-bold flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-primary stroke-[1.75]" />
                Call Logs History
              </h3>
              <p className="text-xs text-foreground/45 mt-0.5 font-bold">Historical phone recordings & transcripts</p>
            </div>
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#2B2620]/30 stroke-[1.75]" />
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-sm bg-[#FAF6EF] border border-[#EADFCA] rounded-xl focus:border-primary focus:outline-hidden text-[#2B2620] placeholder-[#2B2620]/40 font-medium"
              />
            </div>
          </div>

          {/* Scroll list */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#EADFCA]/60">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : callLogs.length === 0 ? (
              <div className="p-16 text-center text-foreground/45 font-medium">No calls logged yet.</div>
            ) : (
              callLogs.map((log: any) => (
                <div key={log.id} className="p-5 hover:bg-[#FAF6EF]/30 space-y-3 transition-colors duration-150">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-full ${
                        log.direction === CallDirection.INBOUND 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {log.direction === CallDirection.INBOUND ? (
                          <PhoneIncoming className="h-4 w-4 stroke-[1.75]" />
                        ) : (
                          <PhoneOutgoing className="h-4 w-4 stroke-[1.75]" />
                        )}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-lg text-[#2B2620] leading-tight">
                            {log.patient?.fullName || 'Unregistered Caller'}
                          </h4>
                          <span className="text-xxs text-foreground/40 font-bold">• {log.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xxs text-foreground/50 mt-1 font-bold">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span>Duration: {log.duration}s</span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 text-xxs font-semibold rounded-full border ${getOutcomeStyle(log.outcome)}`}>
                      {log.outcome.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Summary */}
                  <div className="pl-12 text-xs text-[#2B2620]/80 leading-relaxed font-semibold">
                    <p className="text-primary font-bold">AI Summary:</p>
                    <p className="mt-0.5 bg-[#FAF6EF] border border-[#EADFCA]/55 px-3 py-2 rounded-xl italic font-medium">
                      "{log.summary || 'Caller hung up without leaving inquiry.'}"
                    </p>
                  </div>

                  {/* Play Recording & Collapsible Transcript */}
                  <div className="pl-12 pt-1 flex flex-wrap items-center gap-4 font-bold select-none">
                    {log.recordingUrl && (
                      <motion.a
                        href={log.recordingUrl}
                        target="_blank"
                        rel="noreferrer"
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 text-xxs uppercase tracking-wider text-primary hover:text-[#3C5040] cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-current text-primary" />
                        Listen to Call
                      </motion.a>
                    )}

                    {log.transcript && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setExpandedCallId(expandedCallId === log.id ? null : log.id)}
                        className="flex items-center gap-1.5 text-xxs uppercase tracking-wider text-primary hover:text-[#3C5040] cursor-pointer focus:outline-hidden"
                      >
                        <MessageSquare className="h-3.5 w-3.5 stroke-[1.75]" />
                        {expandedCallId === log.id ? 'Hide Chat Logs' : 'View Full Transcript'}
                      </motion.button>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedCallId === log.id && log.transcript && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="pl-12 overflow-hidden"
                      >
                        <div className="bg-[#FAF6EF] border border-[#EADFCA]/60 p-4 rounded-2xl flex flex-col gap-3 max-h-[300px] overflow-y-auto mt-2 font-sans shadow-inner">
                          {parseTranscript(log.transcript).map((chat) => {
                            const isSent = chat.speaker.toLowerCase().includes('agent') || chat.speaker.toLowerCase().includes('doctor');
                            return (
                              <div
                                key={chat.id}
                                className={`flex flex-col max-w-[85%] ${
                                  isSent ? 'self-end items-end' : 'self-start items-start'
                                }`}
                              >
                                <span className="text-[10px] font-bold text-[#2B2620]/45 mb-0.5 px-1.5 capitalize">
                                  {chat.speaker || 'Caller'}
                                </span>
                                <div
                                  className={`relative px-3.5 py-2 text-xs font-medium shadow-xxs ${
                                    isSent
                                      ? 'bg-primary text-background rounded-2xl rounded-tr-none'
                                      : 'bg-[#EADFCA] text-[#2B2620] rounded-2xl rounded-tl-none'
                                  }`}
                                >
                                  <div className={`absolute top-0 w-2 h-2 ${
                                    isSent 
                                      ? '-right-1 bg-primary clip-path-sent' 
                                      : '-left-1 bg-[#EADFCA] clip-path-received'
                                  }`} />
                                  <p className="relative z-10 leading-normal">{chat.message}</p>
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
        </div>
      </div>
    </div>
  );
}
