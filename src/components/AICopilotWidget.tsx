'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, X, Send, Bot, RefreshCw, BarChart2 } from 'lucide-react';
const AppointmentStatus = { WAITING: 'WAITING', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', SCHEDULED: 'SCHEDULED', NO_SHOW: 'NO_SHOW', CANCELLED: 'CANCELLED' } as const;
type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function AICopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am your Health 360 AI Assistant. Ask me for real-time updates on today’s sessions, waitlist status, or overall clinic operations.',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch today's date for live data lookup
  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch appointments for real-time updates
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', todayStr],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?date=${todayStr}`);
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Fetch waitlist for waitlist queries
  const { data: waitlist = [] } = useQuery({
    queryKey: ['waitlist'],
    queryFn: async () => {
      const res = await fetch('/api/waitlist');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Fetch call logs
  const { data: callLogs = [] } = useQuery({
    queryKey: ['call-logs'],
    queryFn: async () => {
      const res = await fetch('/api/call-logs');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const appointmentsList = Array.isArray(appointments) ? appointments : [];
  const waitlistList = Array.isArray(waitlist) ? waitlist.filter((w: any) => w.status === 'WAITING') : [];
  const logsList = Array.isArray(callLogs) ? callLogs : [];

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Trigger bot response
    setIsTyping(true);
    setTimeout(() => {
      const responseText = generateBotResponse(text);
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: responseText,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const generateBotResponse = (query: string): string => {
    const q = query.toLowerCase();

    // 1. Completion & Stats Queries
    if (q.includes('completion') || q.includes('stats') || q.includes('completed') || q.includes('appointments') || q.includes('session')) {
      const scheduled = appointmentsList.filter((a: any) => a.status === AppointmentStatus.SCHEDULED).length;
      const waiting = appointmentsList.filter((a: any) => a.status === AppointmentStatus.WAITING).length;
      const progress = appointmentsList.filter((a: any) => a.status === AppointmentStatus.IN_PROGRESS).length;
      const completed = appointmentsList.filter((a: any) => a.status === AppointmentStatus.COMPLETED).length;
      
      return `Here is today's appointments volume overview:\n\n` +
             `• Completed: **${completed}**\n` +
             `• In Progress: **${progress}**\n` +
             `• Checked-in (Waiting): **${waiting}**\n` +
             `• Scheduled: **${scheduled}**\n\n` +
             `Total Booked Slots: **${appointmentsList.length}**.`;
    }

    // 2. Waitlist queries
    if (q.includes('waitlist') || q.includes('queue') || q.includes('promote')) {
      if (waitlistList.length === 0) {
        return `There are currently **no active patients** on the waitlist. All priority intake requests have been successfully accommodated or scheduled.`;
      }
      const waitlistNames = waitlistList.map((w: any) => `• **${w.patient?.fullName || 'Anonymous'}** (Modality: ${w.desiredTreatmentType}, Timing: ${w.preferredTimeWindow})`).join('\n');
      return `We have **${waitlistList.length} patients** actively waiting on the queue:\n\n${waitlistNames}\n\nTo promote a waitlisted candidate to an active appointment, navigate to the Waitlist box in the Clinic Overview or the Appointments Board.`;
    }

    // 3. Next patient check-in
    if (q.includes('next') || q.includes('upcoming') || q.includes('checkin') || q.includes('check in')) {
      const nextScheduled = appointmentsList.find((a: any) => a.status === AppointmentStatus.SCHEDULED);
      if (!nextScheduled) {
        return `All scheduled patients for today have already checked in or finished their treatment modalities.`;
      }
      return `The next patient scheduled is **${nextScheduled.patient?.fullName || 'Patient'}** at **${nextScheduled.startTime}** for a ${nextScheduled.treatmentType} session. You can check them in directly from the Clinic Overview Intake checklist.`;
    }

    // 4. Call logs or voice agent
    if (q.includes('call') || q.includes('voice') || q.includes('agent') || q.includes('triage')) {
      const missed = logsList.filter((log: any) => log.outcome === 'MISSED').length;
      const followUp = logsList.filter((log: any) => log.outcome === 'FOLLOW_UP_NEEDED').length;
      const booked = logsList.filter((log: any) => log.outcome === 'BOOKED').length;

      return `AI Voice Agent Summary:\n\n` +
             `• Booked via agent: **${booked}**\n` +
             `• Follow-ups needed: **${followUp}**\n` +
             `• Missed connections: **${missed}**\n\n` +
             `You can review call transcripts or listen to recordings on the **AI Voice Agent** logs tab.`;
    }

    // 5. Help / generic greeting
    if (q.includes('hello') || q.includes('hi') || q.includes('help') || q.includes('hey')) {
      return `I can help you monitor live clinic details. Try asking:\n\n` +
             `• "How many patients are waitlisted?"\n` +
             `• "Show today's session stats"\n` +
             `• "Who is the next upcoming patient?"\n` +
             `• "Summarize voice agent activity"`;
    }

    // Fallback response
    return `I've analyzed your query regarding "${query}". For today's operations:\n` +
           `• Total Appointments: **${appointmentsList.length}**\n` +
           `• Active Waitlist: **${waitlistList.length}**\n` +
           `• Call Logs Registered: **${logsList.length}**\n\n` +
           `Let me know if you need specific details on any of these parameters.`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="w-[360px] h-[480px] bg-[#FFFCF6] border border-[#EADFCA] rounded-3xl shadow-[0_20px_50px_rgba(42,38,32,0.12)] flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-primary text-background p-4 flex justify-between items-center shrink-0 shadow-xxs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-background/15 rounded-lg text-background">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">Health 360 Copilot</h4>
                  <p className="text-[9px] text-background/70 font-semibold mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Live CRM Assistant
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-background/80 hover:text-background p-1 hover:bg-background/10 rounded-lg transition-colors cursor-pointer border-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF6EF]/30">
              {messages.map((msg) => {
                const isBot = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      isBot ? 'self-start items-start' : 'self-end items-end'
                    }`}
                  >
                    <span className="text-[9px] font-bold text-[#2B2620]/45 mb-0.5 px-1 capitalize">
                      {isBot ? 'Copilot' : 'Admin'}
                    </span>
                    <div
                      className={`px-3 py-2 text-xs font-semibold shadow-xxs rounded-2xl whitespace-pre-wrap leading-normal ${
                        isBot 
                          ? 'bg-[#FFFCF6] text-[#2B2620] border border-[#EADFCA]/60 rounded-tl-none' 
                          : 'bg-primary text-background rounded-tr-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex flex-col max-w-[85%] self-start items-start">
                  <span className="text-[9px] font-bold text-[#2B2620]/45 mb-0.5 px-1 capitalize">Copilot</span>
                  <div className="px-3 py-2 bg-[#FFFCF6] border border-[#EADFCA]/60 rounded-2xl rounded-tl-none flex items-center gap-1 shadow-xxs">
                    <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>

            {/* Suggested prompts strip */}
            <div className="px-4 py-2 border-t border-[#EADFCA]/40 bg-[#FFFCF6] shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
              <button 
                onClick={() => handleSendMessage("Show today's session stats")}
                className="inline-block px-2.5 py-1 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 text-primary text-[10px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap bg-transparent"
              >
                Today's Stats
              </button>
              <button 
                onClick={() => handleSendMessage("Who is waitlisted?")}
                className="inline-block px-2.5 py-1 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 text-primary text-[10px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap bg-transparent"
              >
                Waitlist Queue
              </button>
              <button 
                onClick={() => handleSendMessage("Who is the next upcoming patient?")}
                className="inline-block px-2.5 py-1 hover:bg-primary/10 border border-primary/20 hover:border-primary/30 text-primary text-[10px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap bg-transparent"
              >
                Next Patient
              </button>
            </div>

            {/* Input field */}
            <div className="p-3 border-t border-[#EADFCA]/40 bg-[#FFFCF6] shrink-0 flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Health 360 Copilot..."
                className="flex-1 text-xs bg-[#FAF6EF]/60 border border-[#EADFCA] rounded-xl px-3 py-2 text-[#2B2620] placeholder-[#2B2620]/45 font-semibold focus:outline-hidden focus:border-primary"
              />
              <button
                onClick={() => handleSendMessage()}
                className="p-2 bg-primary hover:bg-[#3C5040] text-background rounded-xl transition-all cursor-pointer border-0 shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle trigger bubble */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full bg-primary hover:bg-[#3C5040] text-background flex items-center justify-center shadow-lg border-0 cursor-pointer relative"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="absolute -top-1.5 -right-1.5 p-1 bg-accent text-background rounded-full animate-bounce shadow-xxs">
          <Sparkles className="h-3 w-3" />
        </span>
      </motion.button>
    </div>
  );
}
