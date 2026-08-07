'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, MessageSquare, PhoneCall, Calendar, AlertTriangle, 
  CheckCircle2, Clock, EyeOff, RefreshCw, ArrowRight, ShieldAlert, Zap
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function WeeklyActionQueuePage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [userRole, setUserRole] = useState<string>('admin');

  useEffect(() => {
    const session = localStorage.getItem('h360_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUserRole((parsed.role || 'admin').toLowerCase());
      } catch (e) {}
    }
    fetchActionQueue();
  }, []);

  const fetchActionQueue = async () => {
    setLoading(true);
    try {
      // Trigger evaluation & fetch top active insights
      const res = await fetch('/api/cron/weekly-digest', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer your-cron-secret-bearer-token'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch (e) {
      console.error('Error loading action queue:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async (insight: any) => {
    const actionType = insight.actionType;
    let payload = {};
    try {
      payload = JSON.parse(insight.actionPayloadJson || '{}');
    } catch (e) {}

    setActionLoading(prev => ({ ...prev, [insight.id]: true }));
    try {
      const res = await fetch(`/api/insights/${insight.id}/act`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType, payload })
      });
      if (res.ok) {
        setInsights(prev => prev.map(item => item.id === insight.id ? { ...item, status: 'ACTED' } : item));
      }
    } catch (err) {
      console.error('Action error:', err);
    } finally {
      setActionLoading(prev => ({ ...prev, [insight.id]: false }));
    }
  };

  const handleUpdateStatus = async (insightId: string, status: string) => {
    try {
      const res = await fetch(`/api/insights/${insightId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setInsights(prev => prev.filter(item => item.id !== insightId));
      }
    } catch (err) {
      console.error('Status error:', err);
    }
  };

  const currentYearMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 select-none font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
              Live Priority Queue
            </span>
            <span className="text-xs text-white/40 font-mono">Max 8 Items</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mt-1 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" /> Weekly Action Queue
          </h1>
          <p className="text-xs text-white/60 font-semibold mt-0.5">
            Operational priority list. Tap 1-click actions to resolve patient drop-offs, expiring packages, and unfilled capacity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchActionQueue}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href={`/crm360/insights/monthly/${currentYearMonth}`}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-white/15"
          >
            Monthly Review <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Work List Items */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        <div className="p-12 text-center bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Action Queue Clean!</h3>
          <p className="text-xs text-white/50">All high-priority operational items have been resolved for this week.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {insights.map((item, index) => {
              const isUrgent = item.severity === 'URGENT';
              const isImportant = item.severity === 'IMPORTANT';
              const isActed = item.status === 'ACTED';
              const impactPaise = item.estimatedImpactPaise ? Number(item.estimatedImpactPaise) : 0;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl ${
                    isActed
                      ? 'bg-emerald-500/5 border-emerald-500/20 opacity-75'
                      : isUrgent
                      ? 'bg-rose-500/10 border-rose-500/30 shadow-lg'
                      : isImportant
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-md'
                      : 'bg-white/10 border-white/20'
                  }`}
                >
                  {/* Item Content */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${
                        isUrgent ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        isImportant ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                        'bg-white/10 text-white/70 border-white/20'
                      }`}>
                        {item.severity}
                      </span>
                      <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                        {item.category}
                      </span>
                      {impactPaise > 0 && (
                        <span className="text-[11px] font-mono font-bold text-emerald-400 ml-auto md:ml-0">
                          ≈{formatCurrency(impactPaise / 100)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-serif font-bold text-white">{item.title}</h3>
                    <p className="text-xs text-white/70 leading-relaxed font-medium">{item.body}</p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
                    {isActed ? (
                      <span className="px-3.5 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Actioned
                      </span>
                    ) : (
                      <>
                        {item.actionType === 'WHATSAPP_BOOKING_LINK' && (
                          <button
                            onClick={() => handleExecuteAction(item)}
                            disabled={actionLoading[item.id]}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Link
                          </button>
                        )}

                        {item.actionType === 'WHATSAPP_PAYMENT_REMINDER' && (
                          <button
                            onClick={() => handleExecuteAction(item)}
                            disabled={actionLoading[item.id]}
                            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Remind Payment
                          </button>
                        )}

                        {item.actionType === 'VAPI_CHECKIN_CALL' && (
                          <button
                            onClick={() => handleExecuteAction(item)}
                            disabled={actionLoading[item.id]}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <PhoneCall className="w-3.5 h-3.5" /> VAPI Call
                          </button>
                        )}

                        {item.actionType === 'OFFER_SLOT_TO_WAITLIST' && (
                          <button
                            onClick={() => handleExecuteAction(item)}
                            disabled={actionLoading[item.id]}
                            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <Zap className="w-3.5 h-3.5" /> Fill Waitlist
                          </button>
                        )}

                        {item.actionType === 'MARK_FOR_DISCHARGE_REVIEW' && (
                          <button
                            onClick={() => handleExecuteAction(item)}
                            disabled={actionLoading[item.id]}
                            className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" /> Mark Discharge
                          </button>
                        )}

                        {/* Dismiss & Snooze */}
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'SNOOZED')}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition cursor-pointer"
                          title="Snooze"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, 'DISMISSED')}
                          className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 transition cursor-pointer"
                          title="Dismiss"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
