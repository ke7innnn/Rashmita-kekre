'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, User, Phone, MapPin, Tag, FileText, 
  Calendar, Check, AlertCircle, X, Loader2, ChevronRight 
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
                className="flex items-center gap-2 bg-[#12D6C4] hover:bg-[#0FBDAE] text-[#06231D] text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(18,214,196,0.3)] border-0"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                Add Patient
              </motion.button>
            </div>
          </GlassPanel>

          {/* Grid view of Patient Cards */}
          {isLoading ? (
            <div className="flex justify-center py-20 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-2xl">
              <Loader2 className="h-8 w-8 text-[#12D6C4] animate-spin" />
            </div>
          ) : patients.length === 0 ? (
            <GlassPanel className="flex flex-col items-center justify-center py-20 text-center p-6 border-dashed">
              <User className="h-10 w-10 text-[rgba(18,214,196,0.4)] mx-auto stroke-[1.25] mb-2 animate-bounce" />
              <h4 className="text-sm font-semibold text-[rgba(245,243,250,0.62)]">No patients found.</h4>
              <p className="text-xs text-[rgba(245,243,250,0.4)] mt-1 font-medium">Try adjusting your search criteria or register a new patient.</p>
            </GlassPanel>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {patients.map((p: any) => {
                const initials = p.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : '—';
                
                return (
                  <GlassPanel
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    accent="teal"
                    className="p-6 flex flex-col justify-between group transition-all duration-200 cursor-pointer relative overflow-hidden"
                  >
                    {/* Visual Accent Top Bar */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#12D6C4] to-[#7B5CFF] opacity-50 group-hover:opacity-100 transition-opacity" />

                    <div className="space-y-4">
                      {/* Name and avatar header with gradient ring */}
                      <div className="flex items-center gap-3">
                        <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-[#12D6C4] to-[#7B5CFF] shrink-0">
                          <div className="h-11 w-11 rounded-full bg-[#120D1F] text-[#12D6C4] flex items-center justify-center font-serif text-sm font-bold">
                            {initials}
                          </div>
                        </div>
                        <div className="truncate">
                          <h4 className="text-base font-serif font-bold text-[#F5F3FA] tracking-wide truncate group-hover:text-[#12D6C4] transition-colors leading-snug">
                            {p.fullName}
                          </h4>
                          <p className="eyebrow text-[9px] mt-0.5">{p.gender} • {age} Yrs</p>
                        </div>
                      </div>

                      {/* Modality segment */}
                      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] px-3.5 py-2.5 rounded-xl">
                        <span className="eyebrow text-[8px] block mb-1">Assigned Modality</span>
                        <span className="text-xs font-serif font-bold text-[#12D6C4] block leading-tight truncate">
                          {p.treatmentModalityAssigned || 'None assigned'}
                        </span>
                      </div>

                      {/* Phone contact */}
                      <div className="flex items-center gap-2 text-xs font-medium text-[rgba(245,243,250,0.62)] pl-1">
                        <Phone className="h-3.5 w-3.5 text-[#12D6C4] shrink-0 stroke-[1.75]" />
                        <span className="num-tabular">{p.phone}</span>
                      </div>
                    </div>

                    {/* Footer link indicator */}
                    <div className="mt-5 pt-3 border-t border-[rgba(255,255,255,0.08)] flex justify-between items-center eyebrow text-[10px] text-[rgba(245,243,250,0.4)] group-hover:text-[#12D6C4] transition-colors pl-1">
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
