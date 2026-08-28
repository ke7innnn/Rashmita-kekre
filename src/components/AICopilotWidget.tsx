'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, MessageSquare, X, Send, Bot, RotateCcw, Zap, 
  Calendar, CreditCard, Users, Activity, HelpCircle, ChevronRight
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  tokens?: number;
  source?: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  { label: '📅 Today\'s Schedule', query: 'Show today\'s appointment schedule and next upcoming patient' },
  { label: '💰 Unpaid Invoices', query: 'Which invoices are currently unpaid or pending?' },
  { label: '⏳ Waitlist Queue', query: 'Who is currently on the waitlist and what timings did they request?' },
  { label: '🏥 Clinic Overview', query: 'Give me a complete summary of clinic operations, patients, and courses' },
  { label: '🧠 CST Protocol', query: 'Explain how Craniosacral Therapy (BCST) is used for stress and chronic pain' },
];

export default function AICopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '👋 **Hello! I am your Health 360 AI Assistant.**\n\nI can answer **any question in real-time** about your patients, appointments, invoices, waitlist, or clinical physiotherapy & Craniosacral Therapy protocols with ultra-low token cost.',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      // Build lightweight conversation history for context
      const history = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      if (!res.ok) throw new Error('Failed to get AI response');
      const data = await res.json();

      const botMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.response || 'No response generated.',
        tokens: data.tokenEstimate,
        source: data.source,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Error fetching AI response:', err);
      const fallbackMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: '⚠️ I encountered an issue connecting to the AI server. Please try asking again.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: '👋 Chat cleared! Ask me anything about patients, appointments, billing, or clinical protocols.',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-[380px] sm:w-[420px] h-[540px] bg-[#0C0A14]/95 border border-white/15 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden mb-4 backdrop-blur-2xl text-white"
          >
            {/* Header */}
            <div className="bg-white/[0.06] text-white p-4 flex justify-between items-center shrink-0 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-gradient-to-tr from-[#12D6C4]/20 to-cyan-500/20 border border-[#12D6C4]/40 rounded-xl text-[#12D6C4] shadow-inner">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Health 360 AI Copilot</h4>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#12D6C4]/15 border border-[#12D6C4]/30 text-[#12D6C4] text-[9px] font-bold">
                      Real-Time
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 font-medium mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Live Database Micro-Chunk Engine
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleClearChat}
                  title="Clear Chat"
                  className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-white/60 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-white/[0.01] to-transparent">
              {messages.map((msg) => {
                const isBot = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[88%] ${
                      isBot ? 'self-start items-start' : 'self-end items-end'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[9px] font-bold text-white/40 capitalize">
                        {isBot ? 'Health 360 AI' : 'You'}
                      </span>
                      {msg.tokens && (
                        <span className="text-[8px] font-semibold text-[#12D6C4]/80 px-1 py-0.2 bg-[#12D6C4]/10 rounded border border-[#12D6C4]/20 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" /> ~{msg.tokens} tokens
                        </span>
                      )}
                    </div>
                    <div
                      className={`px-3.5 py-2.5 text-xs rounded-2xl whitespace-pre-wrap leading-relaxed ${
                        isBot 
                          ? 'bg-white/[0.07] text-white/95 border border-white/12 rounded-tl-none shadow-sm' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold rounded-tr-none shadow-md'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex flex-col max-w-[85%] self-start items-start">
                  <span className="text-[9px] font-bold text-white/40 mb-1 px-1">Health 360 AI</span>
                  <div className="px-3.5 py-2.5 bg-white/[0.07] border border-white/12 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="text-[10px] text-[#12D6C4] font-semibold mr-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 animate-pulse" /> Slicing DB chunk...
                    </span>
                    <span className="h-1.5 w-1.5 bg-[#12D6C4] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-[#12D6C4] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 bg-[#12D6C4] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>

            {/* Suggested prompts strip */}
            <div className="px-3.5 py-2 border-t border-white/10 bg-black/40 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
              {SUGGESTIONS.map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSendMessage(s.query)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.05] hover:bg-white/[0.12] border border-white/12 text-white/90 text-[10px] font-bold rounded-lg transition-all cursor-pointer shrink-0"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Input field */}
            <div className="p-3 border-t border-white/10 bg-black/60 shrink-0 flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask anything (e.g., 'Is Malin paid?', 'Today stats')..."
                className="flex-1 text-xs bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-white/40 font-medium focus:outline-none focus:border-[#12D6C4] transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isTyping}
                className="p-2.5 bg-gradient-to-r from-[#12D6C4] to-cyan-400 hover:brightness-110 text-black rounded-xl transition-all cursor-pointer border-0 shrink-0 shadow-md font-bold disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle trigger bubble */}
      <motion.button
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-[#12D6C4] text-black font-bold flex items-center justify-center shadow-[0_10px_25px_rgba(18,214,196,0.4)] border border-white/20 cursor-pointer relative"
      >
        <MessageSquare className="h-6 w-6 text-black" />
        <span className="absolute -top-1 -right-1 p-1.5 bg-amber-400 text-black rounded-full animate-bounce shadow-md">
          <Sparkles className="h-3.5 w-3.5 fill-black" />
        </span>
      </motion.button>
    </div>
  );
}
