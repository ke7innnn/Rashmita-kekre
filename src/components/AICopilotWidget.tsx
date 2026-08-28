'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, MessageSquare, X, Send, Bot, RotateCcw
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  { label: '📅 Today\'s Schedule', query: 'Show today\'s appointment schedule and next upcoming patient' },
  { label: '💰 Unpaid Invoices', query: 'Which invoices are currently unpaid or pending?' },
  { label: '⏳ Waitlist Queue', query: 'Who is currently on the waitlist and what timings did they request?' },
  { label: '🏥 Clinic Overview', query: 'Give me a summary of clinic patients, active courses, and operations' },
  { label: '🧠 CST Protocol', query: 'Explain how Craniosacral Therapy (BCST) is used for stress and chronic pain' },
];

/**
 * Clean text formatter that parses bolding and bullet points without raw markdown asterisks or symbols
 */
function FormattedMessage({ text }: { text: string }) {
  // Clean up any extraneous multi-asterisks
  const cleaned = text.replace(/\*{3,}/g, '');
  const lines = cleaned.split('\n');

  return (
    <div className="space-y-1 text-xs leading-relaxed font-normal">
      {lines.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} className="h-1" />;
        
        let cleanLine = line.replace(/^#{1,4}\s*/, '');
        const isBullet = cleanLine.startsWith('• ') || cleanLine.startsWith('- ');
        if (isBullet) cleanLine = cleanLine.replace(/^[•\-]\s*/, '');

        const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

        return (
          <div key={lIdx} className={isBullet ? 'flex items-start gap-1.5 pl-0.5' : ''}>
            {isBullet && <span className="text-[#12D6C4] shrink-0 mt-0.5 font-bold">•</span>}
            <div className="flex-1">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <span key={pIdx} className="font-bold text-white">
                      {part.slice(2, -2)}
                    </span>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AICopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: '👋 **Hello! I am your Health 360 Assistant.**\n\nAsk me anything about your patients, appointments, billing status, or clinical treatments.',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const history = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history })
      });

      if (!res.ok) throw new Error('Failed to get response');
      const data = await res.json();

      const botMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.response || 'No response generated.',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Error in AI Assistant:', err);
      const fallbackMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: 'I encountered an issue getting the latest updates. Please try again.',
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
        text: '👋 Chat cleared! How can I help you today?',
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-[360px] sm:w-[400px] h-[520px] bg-[#0E0C16]/95 border border-white/15 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden mb-4 backdrop-blur-2xl text-white"
          >
            {/* Header */}
            <div className="bg-white/[0.05] text-white p-4 flex justify-between items-center shrink-0 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#12D6C4]/15 border border-[#12D6C4]/30 rounded-xl text-[#12D6C4] shadow-xs">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-wide text-white">Health 360 Assistant</h4>
                  <p className="text-[10px] text-white/50 font-medium mt-0.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Online & Ready
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
                  className="text-white/50 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white/[0.01] to-transparent">
              {messages.map((msg) => {
                const isBot = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[88%] ${
                      isBot ? 'self-start items-start' : 'self-end items-end'
                    }`}
                  >
                    <span className="text-[9px] font-semibold text-white/40 mb-1 px-1 capitalize">
                      {isBot ? 'Assistant' : 'You'}
                    </span>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl ${
                        isBot 
                          ? 'bg-white/[0.08] text-white/95 border border-white/10 rounded-tl-none shadow-xs' 
                          : 'bg-emerald-500 text-white font-semibold rounded-tr-none shadow-md'
                      }`}
                    >
                      <FormattedMessage text={msg.text} />
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex flex-col max-w-[85%] self-start items-start">
                  <span className="text-[9px] font-semibold text-white/40 mb-1 px-1">Assistant</span>
                  <div className="px-3.5 py-2.5 bg-white/[0.08] border border-white/10 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 bg-[#12D6C4] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 bg-[#12D6C4] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 bg-[#12D6C4] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={scrollRef} />
            </div>

            {/* Suggested prompts strip */}
            <div className="px-3 py-2 border-t border-white/10 bg-black/30 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5">
              {SUGGESTIONS.map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSendMessage(s.query)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/90 text-[10px] font-semibold rounded-lg transition-all cursor-pointer shrink-0"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Input field */}
            <div className="p-3 border-t border-white/10 bg-black/50 shrink-0 flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask a question..."
                className="flex-1 text-xs bg-white/[0.06] border border-white/15 rounded-xl px-3.5 py-2.5 text-white placeholder-white/35 font-normal focus:outline-none focus:border-[#12D6C4] transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isTyping}
                className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all cursor-pointer border-0 shrink-0 shadow-md font-bold disabled:opacity-30"
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
        className="h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.35)] border border-white/20 cursor-pointer relative"
      >
        <MessageSquare className="h-6 w-6 text-white" />
        <span className="absolute -top-1 -right-1 p-1 bg-amber-400 text-black rounded-full animate-bounce shadow-xs">
          <Sparkles className="h-3 w-3 fill-black text-black" />
        </span>
      </motion.button>
    </div>
  );
}
