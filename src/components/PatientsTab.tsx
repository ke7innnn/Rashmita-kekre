'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, User, Phone, MapPin, Tag, FileText, 
  Calendar, Check, AlertCircle, X, Loader2, ChevronRight, ChevronLeft,
  Table as TableIcon, LayoutGrid, Edit2, PhoneCall, PhoneOutgoing,
  CheckSquare, Square, ArrowRight, Sparkles, Ban
} from 'lucide-react';
import PatientTimeline from './PatientTimeline';
import CreatePatientModal from './CreatePatientModal';
import EditPatientModal from './EditPatientModal';
import QuickCallModal from './QuickCallModal';
import GlassPanel from './GlassPanel';

interface PatientsTabProps {
  selectedPatientId?: string | null;
  setSelectedPatientId?: (id: string | null) => void;
}

export default function PatientsTab({
  selectedPatientId: propSelectedPatientId,
  setSelectedPatientId: propSetSelectedPatientId
}: PatientsTabProps = {}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  const [localSelectedPatientId, localSetSelectedPatientId] = useState<string | null>(null);
  const selectedPatientId = propSelectedPatientId !== undefined ? propSelectedPatientId : localSelectedPatientId;
  const setSelectedPatientId = propSetSelectedPatientId !== undefined ? propSetSelectedPatientId : localSetSelectedPatientId;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any | null>(null);
  const [quickCallPatient, setQuickCallPatient] = useState<any | null>(null);

  // Multi-Patient Selection State
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(new Set());
  const [isBatchTransferring, setIsBatchTransferring] = useState(false);
  const [transferToast, setTransferToast] = useState<{ count: number; message: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'needs_review' | 'linked_contact'>('all');

  // Pagination State (Default 50 per page, option to view all or customize)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);

  // 1. Fetch Patients (fetch all to enable quick filtering and count badges)
  const { data: allPatients = [], isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: async () => {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(search)}&status=all`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    },
  });

  const counts = React.useMemo(() => {
    return {
      all: allPatients.length,
      active: allPatients.filter((p: any) => p.importStatus === 'ACTIVE').length,
      needsReview: allPatients.filter((p: any) => p.importStatus === 'NEEDS_REVIEW').length,
      linkedContact: allPatients.filter((p: any) => p.entryType === 'LINKED_CONTACT').length,
    };
  }, [allPatients]);

  const patients = React.useMemo(() => {
    if (statusFilter === 'active') {
      return allPatients.filter((p: any) => p.importStatus === 'ACTIVE');
    }
    if (statusFilter === 'needs_review') {
      return allPatients.filter((p: any) => p.importStatus === 'NEEDS_REVIEW');
    }
    if (statusFilter === 'linked_contact') {
      return allPatients.filter((p: any) => p.entryType === 'LINKED_CONTACT');
    }
    return allPatients;
  }, [allPatients, statusFilter]);

  // Reset to page 1 whenever search, filter, or page size changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  // Pagination derived calculations
  const totalItems = patients.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / (pageSize as number)));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedPatients = React.useMemo(() => {
    if (pageSize === 'all') return patients;
    const start = (safeCurrentPage - 1) * (pageSize as number);
    return patients.slice(start, start + (pageSize as number));
  }, [patients, safeCurrentPage, pageSize]);

  const startItemIndex = totalItems === 0 ? 0 : pageSize === 'all' ? 1 : (safeCurrentPage - 1) * (pageSize as number) + 1;
  const endItemIndex = pageSize === 'all' ? totalItems : Math.min(safeCurrentPage * (pageSize as number), totalItems);

  const handlePageChange = (page: number) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(clamped);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
  };

  const computeAge = (dob: any) => {
    if (!dob) return '—';
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '—';
    const diff = new Date().getFullYear() - d.getFullYear();
    return diff > 0 && diff < 125 ? diff : '—';
  };

  const toggleSelectPatient = (id: string) => {
    setSelectedPatientIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (paginatedPatients.length === 0) return;
    const allPageSelected = paginatedPatients.every((p: any) => selectedPatientIds.has(p.id));
    if (allPageSelected) {
      setSelectedPatientIds(prev => {
        const next = new Set(prev);
        paginatedPatients.forEach((p: any) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedPatientIds(prev => {
        const next = new Set(prev);
        paginatedPatients.forEach((p: any) => next.add(p.id));
        return next;
      });
    }
  };

  const selectAllInDirectory = () => {
    setSelectedPatientIds(new Set(patients.map((p: any) => p.id)));
  };

  const handleBatchTransferToCallList = async () => {
    if (selectedPatientIds.size === 0) return;
    setIsBatchTransferring(true);

    try {
      const res = await fetch('/api/call-logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientIds: Array.from(selectedPatientIds),
          reason: 'Transferred from Patient Directory multi-selection',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        queryClient.invalidateQueries({ queryKey: ['call-logs'] });
        const count = data.count || selectedPatientIds.size;
        setTransferToast({
          count,
          message: `Successfully transferred ${count} patient${count > 1 ? 's' : ''} to Call List`,
        });
        setSelectedPatientIds(new Set());
        setTimeout(() => setTransferToast(null), 7000);
      }
    } catch (err) {
      console.error('Failed to transfer patients to call list:', err);
    } finally {
      setIsBatchTransferring(false);
    }
  };

  return (
    <div className="space-y-6 select-none relative pb-16">
      <AnimatePresence mode="wait" initial={false}>
        {selectedPatientId ? (
          <motion.div
            key={`patient-detail-${selectedPatientId}`}
            initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassPanel className="p-6 min-h-[calc(100vh-140px)] flex flex-col">
              <PatientTimeline 
                patientId={selectedPatientId} 
                onBack={() => setSelectedPatientId(null)}
              />
            </GlassPanel>
          </motion.div>
        ) : (
          <motion.div
            key="patients-directory-main"
            initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Search & Actions Header */}
            <GlassPanel className="p-5 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                <div>
                  <h3 className="text-2xl font-serif text-[#F5F3FA] font-bold">Patients Directory</h3>
                  <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium mt-0.5">Manage details, case sheets, and history logs of registered patients.</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* View Switcher: Table vs Grid */}
                  <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-xl gap-1 relative shadow-inner">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setViewMode('table')}
                      title="Tabular View"
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer relative z-10 select-none ${
                        viewMode === 'table' 
                          ? 'text-black font-bold' 
                          : 'text-[rgba(245,243,250,0.6)] hover:text-white'
                      }`}
                    >
                      {viewMode === 'table' && (
                        <motion.div
                          layoutId="patientsViewModePill"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          style={{ zIndex: -1 }}
                        />
                      )}
                      <TableIcon className="h-4 w-4 stroke-[2]" />
                      <span className="hidden sm:inline text-[11px]">Table</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                      className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer relative z-10 select-none ${
                        viewMode === 'grid' 
                          ? 'text-black font-bold' 
                          : 'text-[rgba(245,243,250,0.6)] hover:text-white'
                      }`}
                    >
                      {viewMode === 'grid' && (
                        <motion.div
                          layoutId="patientsViewModePill"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          style={{ zIndex: -1 }}
                        />
                      )}
                      <LayoutGrid className="h-4 w-4 stroke-[2]" />
                      <span className="hidden sm:inline text-[11px]">Grid</span>
                    </motion.button>
                  </div>

                  <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(245,243,250,0.4)] stroke-[2]" />
                    <input
                      type="text"
                      placeholder="Search directory..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 pr-4.5 py-2.5 w-full md:w-60 text-xs glass-input font-medium placeholder-[rgba(245,243,250,0.4)]"
                    />
                  </div>

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-white hover:bg-white/90 text-black text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.25)] border-0"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    Add Patient
                  </motion.button>
                </div>
              </div>

              {/* Status Filter Tabs & Per-Page Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/[0.08]">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { key: 'all', label: 'All Patients', count: counts.all },
                    { key: 'active', label: 'Active', count: counts.active },
                    { key: 'needs_review', label: 'Needs Review', count: counts.needsReview },
                    { key: 'linked_contact', label: 'Linked Contacts', count: counts.linkedContact },
                  ].map((tab) => {
                    const isActive = statusFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-2 select-none ${
                          isActive
                            ? 'bg-white text-black font-bold shadow-sm'
                            : 'bg-white/[0.04] hover:bg-white/[0.08] text-[rgba(245,243,250,0.7)] hover:text-white border border-white/10'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
                          isActive
                            ? 'bg-black/15 text-black font-bold'
                            : 'bg-white/10 text-white/60'
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Per-Page / View All Toggle */}
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span className="text-[11px] font-medium text-white/40 hidden sm:inline">Rows per page:</span>
                  <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-0.5 shadow-inner">
                    {([25, 50, 100] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setPageSize(sz)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer select-none ${
                          pageSize === sz 
                            ? 'bg-white text-black font-bold shadow-sm' 
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                    <button
                      onClick={() => setPageSize('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 select-none ${
                        pageSize === 'all' 
                          ? 'bg-emerald-400 text-black font-bold shadow-sm' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                      title="View all contacts in a single view"
                    >
                      <span>View All</span>
                      {pageSize === 'all' && <Check className="h-3 w-3 stroke-[2.5]" />}
                    </button>
                  </div>
                </div>
              </div>
            </GlassPanel>

            {/* Banner when all on active page are selected */}
            {paginatedPatients.length > 0 &&
              paginatedPatients.every((p: any) => selectedPatientIds.has(p.id)) &&
              selectedPatientIds.size < patients.length && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl px-4 py-2.5 text-xs flex items-center justify-between text-emerald-200"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-emerald-400" />
                    All <strong>{paginatedPatients.length}</strong> patients on page <strong>{safeCurrentPage}</strong> are selected.
                  </span>
                  <button
                    onClick={selectAllInDirectory}
                    className="underline hover:text-white font-bold cursor-pointer transition-colors text-xs"
                  >
                    Select all {patients.length} patients in this list
                  </button>
                </motion.div>
              )}

          {/* Directory Content */}
          {isLoading ? (
            <div className="flex justify-center py-20 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-2xl">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          ) : patients.length === 0 ? (
            <GlassPanel className="flex flex-col items-center justify-center py-20 text-center p-6 border-dashed">
              <User className="h-10 w-10 text-white/40 mx-auto stroke-[1.25] mb-2 animate-bounce" />
              <h4 className="text-sm font-semibold text-[rgba(245,243,250,0.62)]">No patients found.</h4>
              <p className="text-xs text-[rgba(245,243,250,0.4)] mt-1 font-medium">Try adjusting your search criteria or register a new patient.</p>
            </GlassPanel>
          ) : (
            <>
              <AnimatePresence mode="wait" initial={false}>
              {viewMode === 'table' ? (
                <motion.div
                  key="tabular-view"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* TABULAR FORMAT VIEW */}
                  <GlassPanel className="overflow-hidden p-0 border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-[#0B0A10]/95 backdrop-blur-md shadow-sm">
                    <tr className="border-b border-white/10 text-[rgba(245,243,250,0.5)] font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-3.5 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={paginatedPatients.length > 0 && paginatedPatients.every((p: any) => selectedPatientIds.has(p.id))}
                          onChange={toggleSelectAll}
                          aria-label="Select all patients on this page"
                          className="rounded border-white/20 bg-white/10 text-emerald-400 focus:ring-0 cursor-pointer h-4 w-4 accent-emerald-500"
                        />
                      </th>
                      <th className="py-3.5 px-3 font-semibold text-center w-12">SR. No.</th>
                      <th className="py-3.5 px-4 font-semibold">Registered On</th>
                      <th className="py-3.5 px-5 font-semibold">Name</th>
                      <th className="py-3.5 px-4 font-semibold text-center">Age</th>
                      <th className="py-3.5 px-4 font-semibold">Gender</th>
                      <th className="py-3.5 px-4 font-semibold">Cont No.</th>
                      <th className="py-3.5 px-4 font-semibold">Referring Doctor</th>
                      <th className="py-3.5 px-4 font-semibold">Diagnosis</th>
                      <th className="py-3.5 px-5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] font-medium text-[rgba(245,243,250,0.85)]">
                    {paginatedPatients.map((p: any, index: number) => {
                      const isSelected = selectedPatientIds.has(p.id);
                      const initials = (p.fullName || 'PT').split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'PT';
                      const age = computeAge(p.dateOfBirth);
                      const regDate = p.createdAt 
                        ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—';
                      const diagnosis = p.diagnosis || p.presentingComplaint || p.treatmentModalityAssigned || '—';
                      const srNo = pageSize === 'all' 
                        ? index + 1 
                        : (safeCurrentPage - 1) * (pageSize as number) + index + 1;

                      return (
                        <tr 
                          key={p.id}
                          onClick={() => setSelectedPatientId(p.id)}
                          className={`hover:bg-white/[0.04] transition-colors cursor-pointer group ${
                            isSelected ? 'bg-emerald-500/[0.07] hover:bg-emerald-500/[0.1]' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectPatient(p.id)}
                              aria-label={`Select ${p.fullName}`}
                              className="rounded border-white/20 bg-white/10 text-emerald-400 focus:ring-0 cursor-pointer h-4 w-4 accent-emerald-500"
                            />
                          </td>

                          {/* SR. No. */}
                          <td className="py-3.5 px-3 text-center font-mono text-xs text-[rgba(245,243,250,0.5)]">
                            {srNo}
                          </td>

                          {/* Registered On */}
                          <td className="py-3.5 px-4 text-xs font-mono text-[rgba(245,243,250,0.7)] whitespace-nowrap">
                            {regDate}
                          </td>

                          {/* Name */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center font-serif text-xs font-bold border border-white/20 shrink-0">
                                {initials}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-serif font-bold text-sm text-[#F5F3FA] group-hover:text-white transition-colors block">
                                    {p.fullName}
                                  </span>
                                  {p.importStatus === 'NEEDS_REVIEW' && (
                                    <span 
                                      className="inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded"
                                      title={p.importReason || 'Flagged for review'}
                                    >
                                      <AlertCircle className="h-2.5 w-2.5" />
                                      Review
                                    </span>
                                  )}
                                  {p.entryType === 'LINKED_CONTACT' && (
                                    <span 
                                      className="inline-flex items-center gap-1 text-[9px] font-mono font-medium px-1.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded"
                                      title={p.relationNote || 'Linked Contact'}
                                    >
                                      Linked Contact
                                    </span>
                                  )}
                                  {((p.tags || []).includes('blocked') || (typeof p.tags === 'string' && p.tags.includes('blocked'))) && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded shadow-xxs">
                                      <Ban className="h-2.5 w-2.5" />
                                      BLOCKED
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Age */}
                          <td className="py-3.5 px-4 text-center font-mono text-xs">
                            {age !== '—' ? (
                              <span className="font-mono text-xs text-[rgba(245,243,250,0.85)] whitespace-nowrap">{age} Yrs</span>
                            ) : (
                              <span className="text-white/30 font-mono text-xs">—</span>
                            )}
                          </td>

                          {/* Gender */}
                          <td className="py-3.5 px-4 text-xs">
                            {p.gender && p.gender.trim() ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[11px] font-mono text-[rgba(245,243,250,0.85)]">
                                {p.gender}
                              </span>
                            ) : (
                              <span className="text-white/30 font-mono text-xs">—</span>
                            )}
                          </td>

                          {/* Cont No. */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-xs text-[rgba(245,243,250,0.7)]">
                              <Phone className="h-3.5 w-3.5 text-white/60 shrink-0 stroke-[1.75]" />
                              <span className="num-tabular font-mono text-xs">{p.phone}</span>
                            </div>
                          </td>

                          {/* Referring Doctor */}
                          <td className="py-3.5 px-4 text-xs text-[rgba(245,243,250,0.75)]">
                            {p.referringDoctor || 'Direct'}
                          </td>

                          {/* Diagnosis */}
                          <td className="py-3.5 px-4 text-xs text-[rgba(245,243,250,0.75)] max-w-[180px] truncate">
                            {diagnosis}
                          </td>

                          {/* Actions: Quick Call, Quick Edit, Case File */}
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {/* Quick Call Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickCallPatient(p);
                                }}
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 hover:text-emerald-100 bg-emerald-500/15 hover:bg-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-all border border-emerald-500/40 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                                title="Quick Call Patient"
                              >
                                <PhoneOutgoing className="h-3 w-3 stroke-[2.5]" />
                                <span>Call</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPatient(p);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/15 px-2.5 py-1.5 rounded-lg transition-all border border-white/10 cursor-pointer"
                                title="Quick Edit Patient Details"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPatientId(p.id);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/70 group-hover:text-white bg-white/5 group-hover:bg-white/15 px-3 py-1.5 rounded-lg transition-all border border-white/10 cursor-pointer"
                              >
                                <span>Case File</span>
                                <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          </motion.div>
        ) : (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
              {paginatedPatients.map((p: any) => {
                const isSelected = selectedPatientIds.has(p.id);
                const initials = (p.fullName || 'PT').split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'PT';
                const age = computeAge(p.dateOfBirth);
                
                return (
                  <GlassPanel
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    accent="none"
                    className={`p-6 flex flex-col justify-between group transition-all duration-200 cursor-pointer relative overflow-hidden ${
                      isSelected ? 'border-emerald-500/50 ring-1 ring-emerald-500/40 bg-emerald-500/[0.04]' : ''
                    }`}
                  >
                    {/* Checkbox in top left */}
                    <div 
                      className="absolute top-4 left-4 z-10" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectPatient(p.id)}
                        aria-label={`Select ${p.fullName}`}
                        className="rounded border-white/30 bg-white/10 text-emerald-400 focus:ring-0 cursor-pointer h-4 w-4 accent-emerald-500"
                      />
                    </div>

                    <div className="space-y-4 pt-3">
                      {/* Name and avatar header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 truncate pl-4">
                          <div className="p-[1.5px] rounded-full border border-white/30 shrink-0">
                            <div className="h-11 w-11 rounded-full bg-white/10 text-white flex items-center justify-center font-serif text-sm font-bold">
                              {initials}
                            </div>
                          </div>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 truncate flex-wrap">
                              <h4 className="text-base font-serif font-bold text-[#F5F3FA] tracking-wide truncate group-hover:text-white transition-colors leading-snug">
                                {p.fullName}
                              </h4>
                              {p.importStatus === 'NEEDS_REVIEW' && (
                                <span 
                                  className="inline-flex items-center gap-0.5 text-[8px] font-mono font-medium px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded shrink-0"
                                  title={p.importReason || 'Flagged for review'}
                                >
                                  Review
                                </span>
                              )}
                              {p.entryType === 'LINKED_CONTACT' && (
                                <span 
                                  className="inline-flex items-center gap-0.5 text-[8px] font-mono font-medium px-1.5 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded shrink-0"
                                  title={p.relationNote || 'Linked Contact'}
                                >
                                  Linked
                                </span>
                              )}
                              {((p.tags || []).includes('blocked') || (typeof p.tags === 'string' && p.tags.includes('blocked'))) && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded shrink-0">
                                  BLOCKED
                                </span>
                              )}
                            </div>
                            <p className="eyebrow text-[9px] mt-0.5 text-white/60">
                              {[p.gender && p.gender.trim() ? p.gender : null, age !== '—' ? `${age} Yrs` : null].filter(Boolean).join(' • ') || '—'}
                            </p>
                          </div>
                        </div>

                        {/* Top corner actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Quick Call Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickCallPatient(p);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-emerald-200 transition border border-emerald-500/30 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            title="Quick Call Patient"
                          >
                            <PhoneOutgoing className="h-3.5 w-3.5 stroke-[2.2]" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPatient(p);
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-white/70 hover:text-white transition border border-white/10"
                            title="Quick Edit Patient Details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Modality segment */}
                      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] px-3.5 py-2.5 rounded-xl">
                        <span className="eyebrow text-[8px] block mb-1">Assigned Modality</span>
                        <span className="text-xs font-serif font-bold text-white block leading-tight truncate">
                          {p.treatmentModalityAssigned || 'None assigned'}
                        </span>
                      </div>

                      {/* Phone contact */}
                      <div className="flex items-center justify-between text-xs font-medium text-[rgba(245,243,250,0.62)] pl-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-white/80 shrink-0 stroke-[1.75]" />
                          <span className="num-tabular">{p.phone}</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickCallPatient(p);
                          }}
                          className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Direct Call</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Footer link indicator */}
                    <div className="mt-5 pt-3 border-t border-[rgba(255,255,255,0.08)] flex justify-between items-center text-[10px] text-[rgba(245,243,250,0.4)] group-hover:text-white transition-colors pl-1">
                      <span>View Case File</span>
                      <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform stroke-[2]" />
                    </div>
                  </GlassPanel>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination Controls Footer */}
        {totalItems > 0 && (
          <GlassPanel className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/10 mt-6 shadow-lg">
            {/* Left: Range and Total Count */}
            <div className="text-xs text-[rgba(245,243,250,0.7)]">
              Showing <span className="font-mono font-bold text-white">{startItemIndex}–{endItemIndex}</span> of <span className="font-mono font-bold text-white">{totalItems}</span> patients
              {pageSize === 'all' && (
                <span className="ml-2 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium text-[10px]">
                  View All Mode
                </span>
              )}
            </div>

            {/* Center: Interactive Page Numbers (Only if paginated & > 1 page) */}
            {pageSize !== 'all' && totalPages > 1 ? (
              <div className="flex items-center gap-1.5 select-none">
                <button
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage <= 1}
                  aria-label="Previous Page"
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 font-medium cursor-pointer text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((item, idx) => {
                    if (item === '...') {
                      return (
                        <span key={`dots-${idx}`} className="px-1.5 py-1 text-white/30 font-mono text-xs select-none">
                          …
                        </span>
                      );
                    }
                    const pageNum = item as number;
                    const isActive = pageNum === safeCurrentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`h-8 min-w-8 px-2 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                          isActive
                            ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                            : 'border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                  aria-label="Next Page"
                  className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 font-medium cursor-pointer text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="text-xs text-white/40">
                {pageSize === 'all' ? 'All contacts displayed on single page' : 'Single page view'}
              </div>
            )}

            {/* Right: Quick View All / Paginated Mode Switcher */}
            <div className="flex items-center gap-2">
              {pageSize === 'all' ? (
                <button
                  onClick={() => setPageSize(50)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/12 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition cursor-pointer"
                >
                  Switch to Pages (50/page)
                </button>
              ) : (
                <button
                  onClick={() => setPageSize('all')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/12 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition cursor-pointer"
                >
                  View All ({totalItems})
                </button>
              )}
            </div>
          </GlassPanel>
        )}
      </>
    )}
  </motion.div>
)}
</AnimatePresence>

      {/* FLOATING ACTION BAR FOR MULTI-PATIENT SELECTION */}
      <AnimatePresence>
        {selectedPatientIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#120D22]/95 backdrop-blur-xl border border-emerald-500/30 px-5 py-3.5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex items-center gap-4 text-xs select-none max-w-[95vw]"
          >
            <div className="flex items-center gap-2.5 text-white font-semibold pr-3 border-r border-white/15">
              <div className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-xs">
                {selectedPatientIds.size}
              </div>
              <div>
                <span className="block font-bold leading-tight">
                  {selectedPatientIds.size} {selectedPatientIds.size === 1 ? 'Patient' : 'Patients'} Selected
                </span>
                <span className="text-[10px] text-white/50">Ready for bulk actions</span>
              </div>
            </div>

            {/* Transfer to Call List Action */}
            <button
              onClick={handleBatchTransferToCallList}
              disabled={isBatchTransferring}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold px-4 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer disabled:opacity-50"
            >
              {isBatchTransferring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PhoneCall className="h-4 w-4 stroke-[2.5]" />
              )}
              <span>Transfer to Call List</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={() => setSelectedPatientIds(new Set())}
              className="text-white/60 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer font-medium"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST FEEDBACK UPON TRANSFER WITH DIRECT LINK TO CALLS ROUTE */}
      <AnimatePresence>
        {transferToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-[#0E1B17] border border-emerald-500/40 text-white px-5 py-4 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.7)] flex items-center gap-4 text-xs"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Check className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-300">{transferToast.message}</p>
              <p className="text-[11px] text-white/70 mt-0.5">Added to the Outbound Follow-up Queue.</p>
            </div>
            <Link
              href="/crm360/calls"
              className="ml-2 inline-flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold px-3 py-1.5 rounded-xl transition border border-emerald-500/40"
            >
              <span>View Call List</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              onClick={() => setTransferToast(null)}
              className="text-white/50 hover:text-white p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CreatePatientModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      <EditPatientModal
        isOpen={!!editingPatient}
        patient={editingPatient}
        onClose={() => setEditingPatient(null)}
      />

      <QuickCallModal
        isOpen={!!quickCallPatient}
        patient={quickCallPatient}
        onClose={() => setQuickCallPatient(null)}
        onTransferredToCallList={() => {
          setTransferToast({
            count: 1,
            message: `${quickCallPatient.fullName} transferred to Call List`,
          });
          setTimeout(() => setTransferToast(null), 7000);
        }}
      />
    </div>
  );
}
