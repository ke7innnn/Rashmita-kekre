'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, ExternalLink, Calendar, CheckCircle2, Circle, Briefcase, Stethoscope, User, Loader2 } from 'lucide-react';
import GlassPanel from '@/components/GlassPanel';

interface InboxMessage {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  metadata: string | null;
  attachmentUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function InboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/inbox');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, currentStatus: boolean) => {
    try {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: !currentStatus } : m));
      await fetch(`/api/inbox/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !currentStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    if (type === 'CONTACT') return <User className="text-[#22B8FF]" size={18} />;
    if (type === 'REFERRAL') return <Stethoscope className="text-[#7B5CFF]" size={18} />;
    if (type === 'CAREERS') return <Briefcase className="text-[#FFB454]" size={18} />;
    return <Mail className="text-primary" size={18} />;
  };

  const filteredMessages = messages.filter(m => filter === 'ALL' || m.type === filter);

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Header & Filter Bar */}
      <GlassPanel className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#F5F3FA] font-bold tracking-tight">Unified Inbox</h1>
          <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium mt-0.5">Manage your contact, referral, and career submissions.</p>
        </div>
        <div className="flex bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.08)] p-1 shrink-0">
          {['ALL', 'CONTACT', 'REFERRAL', 'CAREERS'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === f 
                  ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs' 
                  : 'text-[rgba(245,243,250,0.6)] hover:text-[#F5F3FA] hover:bg-[rgba(255,255,255,0.04)]'
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </GlassPanel>

      {loading ? (
        <div className="flex justify-center items-center h-64 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredMessages.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center p-16 text-center border-dashed">
          <Mail className="text-primary/40 mb-3" size={42} />
          <h3 className="text-base font-serif font-bold text-[#F5F3FA]">No messages found</h3>
          <p className="text-xs text-[rgba(245,243,250,0.4)] font-medium mt-0.5">You're all caught up!</p>
        </GlassPanel>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map(msg => (
            <GlassPanel key={msg.id} className={`p-6 transition-all ${msg.isRead ? 'opacity-60' : 'border-primary/30 shadow-[0_0_30px_rgba(18,214,196,0.1)]'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl shrink-0">
                    {getIcon(msg.type)}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-serif font-bold text-[#F5F3FA]">{msg.name}</h3>
                        <span className="text-[9px] eyebrow px-2.5 py-0.5 bg-[rgba(255,255,255,0.04)] text-primary border border-primary/20 rounded-full font-bold">
                          {msg.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[rgba(245,243,250,0.6)] font-medium">
                        {msg.email && msg.email !== 'N/A' && (
                          <span className="flex items-center gap-1.5"><Mail size={13} className="text-primary" /> {msg.email}</span>
                        )}
                        {msg.phone && msg.phone !== 'N/A' && (
                          <span className="flex items-center gap-1.5"><Phone size={13} className="text-primary" /> {msg.phone}</span>
                        )}
                        <span className="flex items-center gap-1.5 num-tabular"><Calendar size={13} className="text-primary" /> {new Date(msg.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {msg.message && (
                      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] p-4 rounded-xl text-xs text-[rgba(245,243,250,0.8)] leading-relaxed max-w-3xl font-medium">
                        {msg.message}
                      </div>
                    )}

                    {msg.attachmentUrl && (
                      <a 
                        href={msg.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <ExternalLink size={14} />
                        View Attached Document
                      </a>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => markAsRead(msg.id, msg.isRead)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    msg.isRead 
                      ? 'bg-[rgba(255,255,255,0.04)] text-[rgba(245,243,250,0.5)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)]' 
                      : 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/25 shadow-xs'
                  }`}
                >
                  {msg.isRead ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                  {msg.isRead ? 'Read' : 'Mark as read'}
                </button>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}
