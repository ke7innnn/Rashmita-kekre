'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Edit3,
  GitMerge,
  Filter,
  Search,
  ArrowLeft,
  Users,
  Building2,
  AlertTriangle,
  RefreshCw,
  Phone,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface PatientItem {
  id: string;
  fullName: string;
  phone: string | null;
  phoneAlt: string | null;
  entryType: string;
  relationNote: string | null;
  importStatus: string;
  importReason: string | null;
  rawContactName: string | null;
  rawPhone: string | null;
  createdAt: string;
}

interface ReferralItem {
  id: string;
  name: string;
  phone: string | null;
  phoneAlt: string | null;
  category: string;
  specialty: string | null;
  location: string | null;
  organisation: string | null;
  importStatus: string;
  importReason: string | null;
  rawContactName: string | null;
  rawPhone: string | null;
  createdAt: string;
}

interface SurvivorCandidate {
  id: string;
  fullName: string;
  phone: string | null;
  gender: string;
  dateOfBirth: string;
  createdAt: string;
}

export default function AdminImportReviewPage() {
  const [activeTab, setActiveTab] = useState<'patients' | 'referrals'>('patients');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState({ patients: 0, referrals: 0 });

  // Action states
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit Modal
  const [editModalItem, setEditModalItem] = useState<{ id: string; name: string; phone: string } | null>(null);

  // Merge Modal
  const [mergeModalItem, setMergeModalItem] = useState<PatientItem | null>(null);
  const [survivorQuery, setSurvivorQuery] = useState('');
  const [survivorCandidates, setSurvivorCandidates] = useState<SurvivorCandidate[]>([]);
  const [selectedSurvivor, setSelectedSurvivor] = useState<SurvivorCandidate | null>(null);
  const [searchingSurvivors, setSearchingSurvivors] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: activeTab,
        reason: selectedReason,
      });
      const res = await fetch(`/api/admin/imports/review?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load queue (${res.status})`);
      }
      const data = await res.json();
      setItems(data.items || []);
      setReasons(data.reasons || []);
      setCounts(data.counts || { patients: 0, referrals: 0 });
    } catch (err: any) {
      showToast(err.message || 'Error loading items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab, selectedReason]);

  // Survivor live search
  useEffect(() => {
    if (!survivorQuery.trim() || !mergeModalItem) {
      setSurvivorCandidates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingSurvivors(true);
      try {
        const res = await fetch(`/api/admin/imports/review?searchSurvivor=${encodeURIComponent(survivorQuery.trim())}`);
        const data = await res.json();
        setSurvivorCandidates((data.candidates || []).filter((c: any) => c.id !== mergeModalItem.id));
      } catch (err) {
        console.error('Survivor search error:', err);
      } finally {
        setSearchingSurvivors(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [survivorQuery, mergeModalItem]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/imports/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', type: activeTab, id }),
      });
      if (!res.ok) throw new Error('Failed to approve');
      showToast('Record approved and marked ACTIVE');
      setItems((prev) => prev.filter((it) => it.id !== id));
      setCounts((prev) => ({
        ...prev,
        [activeTab]: Math.max(0, prev[activeTab] - 1),
      }));
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const res = await fetch('/api/admin/imports/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', type: activeTab, id }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      showToast('Record rejected and kept in archive');
      setItems((prev) => prev.filter((it) => it.id !== id));
      setCounts((prev) => ({
        ...prev,
        [activeTab]: Math.max(0, prev[activeTab] - 1),
      }));
    } catch (err: any) {
      showToast(err.message || 'Rejection failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editModalItem) return;
    setProcessingId(editModalItem.id);
    try {
      const res = await fetch('/api/admin/imports/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EDIT',
          type: activeTab,
          id: editModalItem.id,
          name: editModalItem.name,
          phone: editModalItem.phone,
        }),
      });
      if (!res.ok) throw new Error('Failed to save edit');
      showToast('Record updated and marked ACTIVE');
      setItems((prev) => prev.filter((it) => it.id !== editModalItem.id));
      setCounts((prev) => ({
        ...prev,
        [activeTab]: Math.max(0, prev[activeTab] - 1),
      }));
      setEditModalItem(null);
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExecuteMerge = async () => {
    if (!mergeModalItem || !selectedSurvivor) return;
    setProcessingId(mergeModalItem.id);
    try {
      const res = await fetch('/api/admin/imports/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MERGE',
          loserId: mergeModalItem.id,
          survivorId: selectedSurvivor.id,
        }),
      });
      if (!res.ok) throw new Error('Merge failed');
      const data = await res.json();
      const moved = data.moved || {};
      showToast(
        `Merged successfully! Relinked ${moved.appointments || 0} appts, ${moved.assessments || 0} assessments.`
      );
      setItems((prev) => prev.filter((it) => it.id !== mergeModalItem.id));
      setCounts((prev) => ({
        ...prev,
        patients: Math.max(0, prev.patients - 1),
      }));
      setMergeModalItem(null);
      setSelectedSurvivor(null);
      setSurvivorQuery('');
    } catch (err: any) {
      showToast(err.message || 'Merge failed', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const name = (item.fullName || item.name || '').toLowerCase();
    const phone = (item.phone || '').toLowerCase();
    const rawName = (item.rawContactName || '').toLowerCase();
    const rawPhone = (item.rawPhone || '').toLowerCase();
    return name.includes(query) || phone.includes(query) || rawName.includes(query) || rawPhone.includes(query);
  });

  return (
    <div className="min-h-screen bg-[#07050C] text-[#F5F3FA] p-6 lg:p-10 transition-colors">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium backdrop-blur-xl ${
              toastMessage.type === 'success'
                ? 'bg-[#121B18]/95 border-[#19E3B1]/40 text-[#19E3B1]'
                : 'bg-[#220F16]/95 border-[#FF5D7A]/40 text-[#FF5D7A]'
            }`}
          >
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6"
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Link
                href="/crm360/patients"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition active:scale-95"
                title="Return to CRM"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-['Clash_Display',sans-serif]">
                Contact Import Review Queue
              </h1>
            </div>
            <p className="text-sm text-white/60">
              Quarantined contacts isolated from active CRM search & booking. Verify, edit, batch approve, or merge relations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={fetchItems}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
            <Link
              href="/crm360/patients"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-white text-black hover:bg-white/90 transition shadow-sm active:scale-95"
            >
              Go to Patient CRM
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* Tab & Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 w-fit backdrop-blur-md relative shadow-lg">
            <button
              onClick={() => {
                setActiveTab('patients');
                setSelectedReason('ALL');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-colors relative cursor-pointer z-10 ${
                activeTab === 'patients' ? 'text-white font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              {activeTab === 'patients' && (
                <motion.div
                  layoutId="adminReviewTabPill"
                  className="absolute inset-0 bg-white/15 rounded-xl border border-white/20 shadow-md backdrop-blur-md"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <Users className="w-3.5 h-3.5" />
              <span>Patients</span>
              <span
                className={`px-2 py-0.5 text-[10px] rounded-full font-mono transition-colors ${
                  activeTab === 'patients' ? 'bg-[#7B5CFF]/40 text-[#C084FC]' : 'bg-white/10 text-white/60'
                }`}
              >
                {counts.patients}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('referrals');
                setSelectedReason('ALL');
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-colors relative cursor-pointer z-10 ${
                activeTab === 'referrals' ? 'text-white font-semibold' : 'text-white/60 hover:text-white'
              }`}
            >
              {activeTab === 'referrals' && (
                <motion.div
                  layoutId="adminReviewTabPill"
                  className="absolute inset-0 bg-white/15 rounded-xl border border-white/20 shadow-md backdrop-blur-md"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <Building2 className="w-3.5 h-3.5" />
              <span>Referral Contacts</span>
              <span
                className={`px-2 py-0.5 text-[10px] rounded-full font-mono transition-colors ${
                  activeTab === 'referrals' ? 'bg-[#7B5CFF]/40 text-[#C084FC]' : 'bg-white/10 text-white/60'
                }`}
              >
                {counts.referrals}
              </span>
            </button>
          </div>

          {/* Search and Reason Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-white/40" />
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-[#120D1F] border border-white/15 text-white/90 focus:outline-none focus:border-white/40 cursor-pointer transition-all shadow-sm"
              >
                <option value="ALL">All Quarantine Reasons ({reasons.length})</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section Table with Smooth Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + '-' + selectedReason}
            initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="border border-white/10 rounded-2xl bg-white/[0.02] backdrop-blur-md overflow-hidden shadow-2xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-white/50 uppercase tracking-wider font-mono text-[10px]">
                    <th className="py-3.5 px-4 font-medium">Cleaned Name</th>
                    <th className="py-3.5 px-4 font-medium">Cleaned Phone</th>
                    <th className="py-3.5 px-4 font-medium">Raw Contact Value</th>
                    <th className="py-3.5 px-4 font-medium">Quarantine Reason</th>
                    <th className="py-3.5 px-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-white/40">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                        Loading quarantined records...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-white/40">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#19E3B1]/60" />
                        No quarantined records found in this view.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => {
                      const isPatient = activeTab === 'patients';
                      const itemName = isPatient ? item.fullName : item.name;
                      const isLinked = item.entryType === 'LINKED_CONTACT';

                      return (
                        <motion.tr
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15, delay: Math.min(index * 0.015, 0.2) }}
                          className="hover:bg-white/[0.03] transition-colors group"
                        >
                          {/* Cleaned Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white/95 text-sm">
                                {itemName || <span className="italic text-white/30">Unnamed</span>}
                              </span>
                              {isLinked && (
                                <span className="px-2 py-0.5 text-[9px] font-semibold tracking-wider rounded bg-[#FFB454]/15 text-[#FFB454] border border-[#FFB454]/30 uppercase">
                                  Linked Contact
                                </span>
                              )}
                              {item.relationNote && (
                                <span className="text-[10px] text-white/40">
                                  ({item.relationNote})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Cleaned Phone */}
                          <td className="py-3.5 px-4 font-['IBM_Plex_Mono',monospace] text-white/80">
                            {item.phone || <span className="text-white/30 italic">None</span>}
                            {item.phoneAlt && (
                              <div className="text-[10px] text-white/40 mt-0.5">
                                Alt: {item.phoneAlt}
                              </div>
                            )}
                          </td>

                          {/* Raw Contact Value */}
                          <td className="py-3.5 px-4 text-white/50 text-[11px]">
                            <div className="font-mono text-white/70">
                              {item.rawContactName}
                            </div>
                            <div className="text-[10px] text-white/40 font-mono">
                              {item.rawPhone}
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] bg-[#FF5D7A]/10 text-[#FF5D7A] border border-[#FF5D7A]/25">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{item.importReason || 'Needs manual inspection'}</span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                              <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleApprove(item.id)}
                                disabled={processingId === item.id}
                                className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-[#19E3B1]/15 text-[#19E3B1] border border-[#19E3B1]/30 hover:bg-[#19E3B1]/25 transition shadow-sm cursor-pointer"
                                title="Mark ACTIVE and move to live CRM"
                              >
                                Approve
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() =>
                                  setEditModalItem({
                                    id: item.id,
                                    name: itemName,
                                    phone: item.phone || '',
                                  })
                                }
                                className="p-1.5 rounded-lg bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                                title="Edit name & phone inline"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </motion.button>

                              {isPatient && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setMergeModalItem(item);
                                    setSelectedSurvivor(null);
                                    setSurvivorQuery('');
                                  }}
                                  className="p-1.5 rounded-lg bg-[#7B5CFF]/15 text-[#C084FC] border border-[#7B5CFF]/30 hover:bg-[#7B5CFF]/25 transition cursor-pointer"
                                  title="Merge into existing patient"
                                >
                                  <GitMerge className="w-3.5 h-3.5" />
                                </motion.button>
                              )}

                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleReject(item.id)}
                                disabled={processingId === item.id}
                                className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:text-[#FF5D7A] hover:bg-[#FF5D7A]/15 border border-white/10 transition cursor-pointer"
                                title="Reject record"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-md bg-[#0F0B1A] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-white font-['Clash_Display',sans-serif]">
                Edit Quarantined Record
              </h3>
              <p className="text-xs text-white/60">
                Update the cleaned attributes. Saving will automatically mark this record as ACTIVE.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1 font-mono">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editModalItem.name}
                    onChange={(e) =>
                      setEditModalItem({ ...editModalItem, name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1 font-mono">
                    Phone (E.164)
                  </label>
                  <input
                    type="text"
                    value={editModalItem.phone}
                    onChange={(e) =>
                      setEditModalItem({ ...editModalItem, phone: e.target.value })
                    }
                    placeholder="+91XXXXXXXXXX"
                    className="w-full px-3 py-2 text-sm font-mono rounded-xl bg-white/5 border border-white/15 text-white focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setEditModalItem(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-white/60 hover:text-white transition"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSaveEdit}
                  disabled={processingId === editModalItem.id}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-white text-black hover:bg-white/90 transition shadow-md"
                >
                  Save & Approve
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Merge Modal */}
      <AnimatePresence>
        {mergeModalItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-xl bg-[#0F0B1A] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div>
                <div className="flex items-center gap-2 text-[#C084FC] text-xs font-semibold uppercase tracking-wider mb-1">
                  <GitMerge className="w-4 h-4" />
                  Relation-Preserving Merge
                </div>
                <h3 className="text-xl font-bold text-white font-['Clash_Display',sans-serif]">
                  Merge Quarantined Patient
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  Move all appointments, clinical assessments, invoices, and treatment plans from this duplicate record into an active target patient.
                </p>
              </div>

              {/* Duplicate Card */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
                <div className="text-[10px] text-white/40 uppercase tracking-wider font-mono">
                  Duplicate Record (Will be Archived / Replaced)
                </div>
                <div className="text-sm font-semibold text-white">
                  {mergeModalItem.fullName}
                </div>
                <div className="text-xs font-mono text-white/60">
                  Phone: {mergeModalItem.phone || 'None'} | Raw: {mergeModalItem.rawContactName}
                </div>
              </div>

              {/* Target Search */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-wider text-white/50 font-mono">
                  Search Target Survivor Patient
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search active patients by name or phone..."
                    value={survivorQuery}
                    onChange={(e) => setSurvivorQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>

                {/* Candidate List */}
                <div className="max-h-44 overflow-y-auto space-y-1.5 pt-1">
                  {searchingSurvivors ? (
                    <div className="text-center py-4 text-xs text-white/40 font-mono">
                      Searching active patients...
                    </div>
                  ) : survivorCandidates.length === 0 && survivorQuery ? (
                    <div className="text-center py-4 text-xs text-white/40">
                      No active patients matched "{survivorQuery}".
                    </div>
                  ) : (
                    survivorCandidates.map((c) => (
                      <motion.div
                        key={c.id}
                        layout
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedSurvivor(c)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          selectedSurvivor?.id === c.id
                            ? 'bg-[#7B5CFF]/20 border-[#7B5CFF] text-white shadow-md'
                            : 'bg-white/[0.02] border-white/10 hover:bg-white/5 text-white/80'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold">{c.fullName}</div>
                          <div className="text-[10px] font-mono text-white/50">
                            {c.phone || 'No phone'} | {c.gender}
                          </div>
                        </div>
                        {selectedSurvivor?.id === c.id && (
                          <CheckCircle2 className="w-4 h-4 text-[#19E3B1]" />
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {selectedSurvivor && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-[#19E3B1]/10 border border-[#19E3B1]/30 text-xs text-[#19E3B1] flex items-start gap-2.5"
                >
                  <UserCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    Merging into <strong className="text-white">{selectedSurvivor.fullName}</strong>.
                    All linked clinical history will be safely preserved under this survivor record.
                  </div>
                </motion.div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setMergeModalItem(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-white/60 hover:text-white transition"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleExecuteMerge}
                  disabled={!selectedSurvivor || processingId === mergeModalItem.id}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#7B5CFF] text-white hover:bg-[#6A4BE8] disabled:opacity-40 transition shadow-lg"
                >
                  Confirm Merge
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
