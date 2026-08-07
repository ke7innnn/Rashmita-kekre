'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, User, Phone, MapPin, Tag, FileText, 
  Calendar, Check, AlertCircle, X, Loader2, ChevronRight,
  Table as TableIcon, LayoutGrid
} from 'lucide-react';
import PatientTimeline from './PatientTimeline';
import CreatePatientModal from './CreatePatientModal';
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

  // 1. Fetch Patients
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: async () => {
      const res = await fetch(`/api/patients?q=${search}`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    },
  });

  return (
    <div className="space-y-6 select-none">
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
            /* TABULAR FORMAT VIEW - MATCHING EXACT SKETCH LAYOUT */
            <GlassPanel className="overflow-hidden p-0 border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-[rgba(245,243,250,0.5)] font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-semibold text-center w-12">SR. No.</th>
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
                      const initials = p.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                      const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : '—';
                      const regDate = p.createdAt 
                        ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—';
                      const diagnosis = p.diagnosis || p.presentingComplaint || p.treatmentModalityAssigned || '—';

                      return (
                        <tr 
                          key={p.id}
                          onClick={() => setSelectedPatientId(p.id)}
                          className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                        >
                          {/* SR. No. */}
                          <td className="py-3.5 px-4 text-center font-mono text-xs text-[rgba(245,243,250,0.5)]">
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
                                <span className="font-serif font-bold text-sm text-[#F5F3FA] group-hover:text-white transition-colors block">
                                  {p.fullName}
                                </span>
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
                          <td className="py-3.5 px-4 text-xs text-[rgba(245,243,250,0.75)] max-w-[200px] truncate">
                            {diagnosis}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPatientId(p.id);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/70 group-hover:text-white bg-white/5 group-hover:bg-white/15 px-3 py-1.5 rounded-lg transition-all border border-white/10"
                            >
                              <span>Case File</span>
                              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
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
                const initials = p.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : '—';
                
                return (
                  <GlassPanel
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    accent="none"
                    className="p-6 flex flex-col justify-between group transition-all duration-200 cursor-pointer relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      {/* Name and avatar header */}
                      <div className="flex items-center gap-3">
                        <div className="p-[1.5px] rounded-full border border-white/30 shrink-0">
                          <div className="h-11 w-11 rounded-full bg-white/10 text-white flex items-center justify-center font-serif text-sm font-bold">
                            {initials}
                          </div>
                        </div>
                        <div className="truncate">
                          <h4 className="text-base font-serif font-bold text-[#F5F3FA] tracking-wide truncate group-hover:text-white transition-colors leading-snug">
                            {p.fullName}
                          </h4>
                          <p className="eyebrow text-[9px] mt-0.5">{p.gender} • {age} Yrs</p>
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
                      <div className="flex items-center gap-2 text-xs font-medium text-[rgba(245,243,250,0.62)] pl-1">
                        <Phone className="h-3.5 w-3.5 text-white/80 shrink-0 stroke-[1.75]" />
                        <span className="num-tabular">{p.phone}</span>
                      </div>
                    </div>

                    {/* Footer link indicator */}
                    <div className="mt-5 pt-3 border-t border-[rgba(255,255,255,0.08)] flex justify-between items-center eyebrow text-[10px] text-[rgba(245,243,250,0.4)] group-hover:text-white transition-colors pl-1">
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

      <CreatePatientModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}

