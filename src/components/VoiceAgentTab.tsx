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

  // Live simulation states for Gemini experience
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
        return 'bg-[rgba(25,227,177,0.12)] text-[#19E3B1] border-[rgba(25,227,177,0.3)]';
      case CallOutcome.RESCHEDULED:
        return 'bg-[rgba(34,184,255,0.12)] text-[#22B8FF] border-[rgba(34,184,255,0.3)]';
      case CallOutcome.CANCELLED:
        return 'bg-[rgba(255,93,122,0.12)] text-[#FF5D7A] border-[rgba(255,93,122,0.3)]';
      case CallOutcome.FOLLOW_UP_NEEDED:
        return 'bg-[rgba(255,180,84,0.12)] text-[#FFB454] border-[rgba(255,180,84,0.3)]';
      case CallOutcome.MISSED:
        return 'bg-[rgba(255,93,122,0.12)] text-[#FF5D7A] border-[rgba(255,93,122,0.3)]';
      default:
        return 'bg-[rgba(255,255,255,0.04)] text-[rgba(245,243,250,0.6)] border-[rgba(255,255,255,0.08)]';
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
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-140px)] select-none">
      {/* Left panel: Active Follow-up Queue vs Drop-offs */}
      <GlassPanel className="xl:col-span-1 flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b border-[rgba(255,255,255,0.08)] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-serif text-[#F5F3FA] font-bold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#FFB454] stroke-[1.75]" />
              Agent Warnings
            </h3>
            <span className="bg-[#FFB454] text-[#0A0711] px-2.5 py-0.5 rounded-full text-[10px] font-bold">
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
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                    <CheckCircle className="h-8 w-8 text-[#19E3B1] stroke-[1.5]" />
                    <p className="text-sm font-semibold text-[rgba(245,243,250,0.62)]">All Caught Up!</p>
                    <p className="text-xs text-[rgba(245,243,250,0.4)] font-medium">No pending client calls in the follow-up queue.</p>
                  </div>
                ) : (
                  followUpQueue.map((log: any) => (
                    <div 
                      key={log.id} 
                      className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,180,84,0.4)] p-4 rounded-xl space-y-3 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#F5F3FA]">
                            {log.patient?.fullName || 'Unregistered Caller'}
                          </h4>
                          <p className="text-xs text-[rgba(245,243,250,0.62)] num-tabular">{log.phoneNumber}</p>
                        </div>
                        <span className="eyebrow text-[9px] num-tabular">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[rgba(245,243,250,0.7)] italic bg-[rgba(255,255,255,0.02)] px-2.5 py-2 rounded-lg border border-[rgba(255,255,255,0.06)] font-medium">
                        "{log.summary}"
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t border-[rgba(255,255,255,0.08)]">
                        <span className="eyebrow text-[9px] text-[#FFB454]">
                          Callback Needed
                        </span>
                        <button
                          onClick={() => resolveMutation.mutate(log.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#19E3B1] bg-[rgba(25,227,177,0.12)] border border-[rgba(25,227,177,0.3)] px-3 py-1.5 rounded-lg hover:bg-[rgba(25,227,177,0.2)] cursor-pointer"
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
              <motion.div key="dropoffs" className="space-y-4">
                {dropOffAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 border border-dashed border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                    <CheckCircle className="h-8 w-8 text-[#19E3B1] stroke-[1.5]" />
                    <p className="text-sm font-semibold text-[rgba(245,243,250,0.62)]">No Patient Drop-offs!</p>
                    <p className="text-xs text-[rgba(245,243,250,0.4)] font-medium">All active patients are aligned with their expected cadences.</p>
                  </div>
                ) : (
                  dropOffAlerts.map((p: any) => (
                    <div 
                      key={p.id} 
                      className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,93,122,0.4)] p-4 rounded-xl space-y-3 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#F5F3FA] flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-[#FF5D7A] stroke-[1.75]" />
                            {p.fullName}
                          </h4>
                          <p className="text-xs text-[rgba(245,243,250,0.62)] num-tabular">{p.phone}</p>
                        </div>
                        <span className="eyebrow text-[9px] text-[#FF5D7A] bg-[rgba(255,93,122,0.12)] px-2 py-0.5 rounded border border-[rgba(255,93,122,0.3)]">
                          {p.expectedCadence}
                        </span>
                      </div>
                      <p className="text-xs text-[rgba(245,243,250,0.7)] bg-[rgba(255,255,255,0.02)] px-2.5 py-2 rounded-lg border border-[rgba(255,255,255,0.06)] font-medium">
                        Patient has missed their schedule. No future scheduled appointments detected.
                      </p>
                      <div className="flex justify-end pt-2 border-t border-[rgba(255,255,255,0.08)]">
                        <button
                          onClick={() => triggerSimulation(p)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#12D6C4] bg-[rgba(18,214,196,0.12)] border border-[rgba(18,214,196,0.3)] px-3 py-1.5 rounded-lg hover:bg-[rgba(18,214,196,0.2)] cursor-pointer"
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
        <GlassPanel accent="teal" className="p-6 flex flex-col gap-4 relative overflow-hidden shrink-0">
          {/* Animated central listening orb signature visual */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-gradient-to-r from-[#12D6C4] via-[#7B5CFF] to-[#E23FA6] blur-[60px] opacity-35 pointer-events-none animate-pulse" />

          <div className="flex justify-between items-center relative z-10">
            <div className="space-y-1">
              <h3 className="text-xl font-serif text-[#F5F3FA] font-bold flex items-center gap-2">
                <Mic className="h-5 w-5 text-[#12D6C4] stroke-[1.75]" />
                AI Voice Assistant Console
              </h3>
              <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">Simulated incoming portal for Health 360 call operations</p>
            </div>
            <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] px-3 py-1.5 rounded-full">
              <span className={`h-2.5 w-2.5 rounded-full ${isLiveCallActive ? 'bg-[#FF5D7A] animate-ping' : 'bg-[#19E3B1]'}`} />
              <span className="eyebrow text-[9px] text-[#F5F3FA]">
                {isLiveCallActive ? 'Call In Progress' : 'Agent Ready'}
              </span>
            </div>
          </div>

          <div className="bg-[rgba(10,7,17,0.7)] backdrop-blur-md p-4 rounded-xl min-h-[120px] flex flex-col justify-between border border-[rgba(255,255,255,0.08)] relative z-10">
            {liveTranscript.length === 0 && !isLiveCallActive ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">No active call running. Trigger drop-offs rebooking or test inbound below.</p>
                <button
                  onClick={() => triggerSimulation(null)}
                  className="mt-3 text-xs font-bold uppercase tracking-wider bg-[#12D6C4] hover:bg-[#0FBDAE] text-[#06231D] px-4 py-2 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(18,214,196,0.3)] border-0"
                >
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
                      className="text-xs font-medium text-[#F5F3FA] leading-relaxed"
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>
                {liveSummary && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 p-2.5 bg-[rgba(25,227,177,0.12)] border border-[rgba(25,227,177,0.3)] rounded-lg text-xs text-[#19E3B1] font-medium"
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
          <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0">
            <div>
              <h3 className="text-xl font-serif text-[#F5F3FA] font-bold flex items-center gap-2">
                <PhoneCall className="h-5 w-5 text-[#12D6C4] stroke-[1.75]" />
                Call Logs History
              </h3>
              <p className="text-xs text-[rgba(245,243,250,0.4)] font-medium mt-0.5">Historical phone recordings & transcripts</p>
            </div>
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[rgba(245,243,250,0.4)] stroke-[1.75]" />
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-full text-xs glass-input font-medium placeholder-[rgba(245,243,250,0.4)]"
              />
            </div>
          </div>

          {/* Scroll list */}
          <div className="flex-1 overflow-y-auto divide-y divide-[rgba(255,255,255,0.06)]">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 text-[#12D6C4] animate-spin" />
              </div>
            ) : callLogs.length === 0 ? (
              <div className="p-16 text-center text-[rgba(245,243,250,0.4)] font-medium text-xs">No calls logged yet.</div>
            ) : (
              callLogs.map((log: any) => (
                <div key={log.id} className="p-5 hover:bg-[rgba(255,255,255,0.02)] space-y-3 transition-colors">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-full border ${
                        log.direction === CallDirection.INBOUND 
                          ? 'bg-[rgba(34,184,255,0.12)] text-[#22B8FF] border-[rgba(34,184,255,0.3)]' 
                          : 'bg-[rgba(25,227,177,0.12)] text-[#19E3B1] border-[rgba(25,227,177,0.3)]'
                      }`}>
                        {log.direction === CallDirection.INBOUND ? (
                          <PhoneIncoming className="h-4 w-4 stroke-[1.75]" />
                        ) : (
                          <PhoneOutgoing className="h-4 w-4 stroke-[1.75]" />
                        )}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif font-bold text-base text-[#F5F3FA]">
                            {log.patient?.fullName || 'Unregistered Caller'}
                          </h4>
                          <span className="eyebrow text-[10px] num-tabular">• {log.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 eyebrow text-[10px] num-tabular mt-1">
                          <Clock className="h-3 w-3 text-[rgba(245,243,250,0.4)]" />
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
                  <div className="pl-11 text-xs text-[rgba(245,243,250,0.8)] leading-relaxed font-medium">
                    <p className="text-[#12D6C4] font-bold text-[10px] uppercase tracking-wider mb-1">AI Summary:</p>
                    <p className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] px-3 py-2 rounded-xl italic">
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
                        className="flex items-center gap-1.5 eyebrow text-[10px] text-[#12D6C4] hover:underline cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-current text-[#12D6C4]" />
                        Listen to Call
                      </a>
                    )}

                    {log.transcript && (
                      <button
                        onClick={() => setExpandedCallId(expandedCallId === log.id ? null : log.id)}
                        className="flex items-center gap-1.5 eyebrow text-[10px] text-[#12D6C4] hover:underline cursor-pointer focus:outline-hidden"
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
                        <div className="bg-[rgba(10,7,17,0.8)] border border-[rgba(255,255,255,0.08)] p-4 rounded-2xl flex flex-col gap-3 max-h-[300px] overflow-y-auto mt-2">
                          {parseTranscript(log.transcript).map((chat) => {
                            const isSent = chat.speaker.toLowerCase().includes('agent') || chat.speaker.toLowerCase().includes('doctor');
                            return (
                              <div
                                key={chat.id}
                                className={`flex flex-col max-w-[85%] ${
                                  isSent ? 'self-end items-end' : 'self-start items-start'
                                }`}
                              >
                                <span className="eyebrow text-[9px] mb-1 px-1 capitalize">
                                  {chat.speaker || 'Caller'}
                                </span>
                                <div
                                  className={`px-3.5 py-2 text-xs font-medium ${
                                    isSent
                                      ? 'bg-[rgba(18,214,196,0.15)] border border-[rgba(18,214,196,0.3)] text-[#12D6C4] rounded-2xl rounded-tr-none'
                                      : 'bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] text-[#F5F3FA] rounded-2xl rounded-tl-none'
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
