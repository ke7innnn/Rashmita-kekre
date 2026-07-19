'use client';

import { useState, useEffect } from 'react';
import { Mail, Phone, ExternalLink, Calendar, CheckCircle2, Circle, Briefcase, Stethoscope, User } from 'lucide-react';

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
    if (type === 'CONTACT') return <User className="text-blue-500" size={20} />;
    if (type === 'REFERRAL') return <Stethoscope className="text-purple-500" size={20} />;
    if (type === 'CAREERS') return <Briefcase className="text-orange-500" size={20} />;
    return <Mail size={20} />;
  };

  const filteredMessages = messages.filter(m => filter === 'ALL' || m.type === filter);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50/30 p-8 animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-light text-[#2B2620] mb-2 tracking-tight">Unified Inbox</h1>
          <p className="text-sm text-[#2B2620]/60">Manage your contact, referral, and career submissions.</p>
        </div>
        <div className="flex bg-white rounded-lg border border-gray-100 p-1">
          {['ALL', 'CONTACT', 'REFERRAL', 'CAREERS'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-gray-100">
          <Mail className="text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900">No messages found</h3>
          <p className="text-gray-500">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map(msg => (
            <div key={msg.id} className={`bg-white rounded-xl border p-6 transition-all ${msg.isRead ? 'border-gray-100 opacity-70' : 'border-primary/20 shadow-sm'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1 p-2 bg-gray-50 rounded-lg">
                    {getIcon(msg.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{msg.name}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                        {msg.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      {msg.email !== 'N/A' && msg.email !== '' && (
                        <span className="flex items-center gap-1.5"><Mail size={14} /> {msg.email}</span>
                      )}
                      {msg.phone !== 'N/A' && msg.phone !== '' && (
                        <span className="flex items-center gap-1.5"><Phone size={14} /> {msg.phone}</span>
                      )}
                      <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    {msg.message && (
                      <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 leading-relaxed max-w-3xl">
                        {msg.message}
                      </div>
                    )}

                    {msg.attachmentUrl && (
                      <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline bg-primary/5 px-4 py-2 rounded-lg">
                        <ExternalLink size={16} />
                        View Attached Document
                      </a>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => markAsRead(msg.id, msg.isRead)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${msg.isRead ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                >
                  {msg.isRead ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  {msg.isRead ? 'Read' : 'Mark as read'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
