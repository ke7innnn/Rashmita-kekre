'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, User, Phone, MapPin, Tag, FileText, 
  Calendar, Check, AlertCircle, X, Loader2, ChevronRight,
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

  // 1. Fetch Patients
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: async () => {
      const res = await fetch(`/api/patients?q=${search}`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    },
  });

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
    if (patients.length === 0) return;
    const allSelected = patients.every((p: any) => selectedPatientIds.has(p.id));
    if (allSelected) {
      setSelectedPatientIds(new Set());
    } else {
      setSelectedPatientIds(new Set(patients.map((p: any) => p.id)));
    }
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
      {selectedPatientId ? (
        <GlassPanel className="p-6 min-h-[calc(100vh-140px)] flex flex-col">
          <PatientTimeline 
            patientId={selectedPatientId} 
            onBack={() => setSelectedPatientId(null)}
          />
        </GlassPanel>
      ) : (
        <>
          {/* Search & Actions Header */}
          <GlassPanel className="p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            <div>
              <h3 className="text-2xl font-serif text-[#F5F3FA] font-bold">Patients Directory</h3>
              <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium mt-0.5">Manage details, case sheets, and history logs of registered patients.</p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Switcher: Table vs Grid */}
              <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setViewMode('table')}
                  title="Tabular View"
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'table' 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-[rgba(245,243,250,0.6)] hover:text-white'
                  }`}
                >
                  <TableIcon className="h-4 w-4 stroke-[2]" />
                  <span className="hidden sm:inline text-[11px]">Table</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'grid' 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-[rgba(245,243,250,0.6)] hover:text-white'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4 stroke-[2]" />
                  <span className="hidden sm:inline text-[11px]">Grid</span>
                </button>
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
          </GlassPanel>

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
          ) : viewMode === 'table' ? (
            /* TABULAR FORMAT VIEW */
            <GlassPanel className="overflow-hidden p-0 border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-[rgba(245,243,250,0.5)] font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-3.5 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={patients.length > 0 && patients.every((p: any) => selectedPatientIds.has(p.id))}
                          onChange={toggleSelectAll}
                          aria-label="Select all patients"
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
                    {patients.map((p: any, index: number) => {
                      const isSelected = selectedPatientIds.has(p.id);
                      const initials = (p.fullName || 'PT').split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'PT';
                      const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : '—';
                      const regDate = p.createdAt 
                        ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—';
                      const diagnosis = p.diagnosis || p.presentingComplaint || p.treatmentModalityAssigned || '—';

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
                            {index + 1}
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
                                <div className="flex items-center gap-2">
                                  <span className="font-serif font-bold text-sm text-[#F5F3FA] group-hover:text-white transition-colors block">
                                    {p.fullName}
                                  </span>
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
                          <td className="py-3.5 px-4 text-center font-mono text-xs text-[rgba(245,243,250,0.85)]">
                            {age} Yrs
                          </td>

                          {/* Gender */}
                          <td className="py-3.5 px-4 text-xs text-[rgba(245,243,250,0.75)]">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[11px] font-mono">
                              {p.gender}
                            </span>
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
          ) : (
            /* GRID FORMAT VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {patients.map((p: any) => {
                const isSelected = selectedPatientIds.has(p.id);
                const initials = (p.fullName || 'PT').split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'PT';
                const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : '—';
                
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
                            <div className="flex items-center gap-1.5 truncate">
                              <h4 className="text-base font-serif font-bold text-[#F5F3FA] tracking-wide truncate group-hover:text-white transition-colors leading-snug">
                                {p.fullName}
                              </h4>
                              {((p.tags || []).includes('blocked') || (typeof p.tags === 'string' && p.tags.includes('blocked'))) && (
                                <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded shrink-0">
                                  BLOCKED
                                </span>
                              )}
                            </div>
                            <p className="eyebrow text-[9px] mt-0.5">{p.gender} • {age} Yrs</p>
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
            </div>
          )}
        </>
      )}

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
