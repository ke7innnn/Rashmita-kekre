'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, User, Phone, MapPin, Tag, FileText, 
  Calendar, Check, AlertCircle, X, Loader2, ChevronRight 
} from 'lucide-react';
import PatientTimeline from './PatientTimeline';
import CreatePatientModal from './CreatePatientModal';



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
  const [showAddressInput, setShowAddressInput] = useState(false);

  // 1. Fetch Patients
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: async () => {
      const res = await fetch(`/api/patients?q=${search}`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    },
  });

  // 2. Fetch Treatment Modalities for dropdown
  const { data: modalities = [] } = useQuery({
    queryKey: ['modalities'],
    queryFn: async () => {
      return [
        { id: 'm1', name: 'Manual Therapy' },
        { id: 'm2', name: 'Electrotherapy' },
        { id: 'm3', name: 'Sports Rehabilitation' }
      ];
    },
  });



  return (
    <div className="space-y-6 select-none">
      {selectedPatientId ? (
        <div className="bg-[#FFFCF6] border border-[#EADFCA] rounded-2xl p-6 shadow-[0_8px_30px_rgb(42,38,32,0.02)] min-h-[calc(100vh-140px)] flex flex-col">
          <PatientTimeline 
            patientId={selectedPatientId} 
            onBack={() => setSelectedPatientId(null)}
          />
        </div>
      ) : (
        <>
          {/* Search & Actions Header */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-[#FFFCF6] p-5 rounded-2xl shadow-[0_8px_30px_rgba(42,38,32,0.02)] border border-[#EADFCA]/45">
            <div>
              <h3 className="text-2xl font-serif text-[#2B2620] font-bold">Patients Directory</h3>
              <p className="text-xs text-[#2B2620]/45 font-bold mt-0.5">Manage details, case sheets, and history logs of registered patients.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2B2620]/45 stroke-[2]" />
                <input
                  type="text"
                  placeholder="Search directory..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4.5 py-2.5 w-full md:w-56 text-xs bg-[#FAF6EF]/65 border border-[#EADFCA] rounded-xl hover:border-primary/30 focus:bg-white focus:border-primary focus:outline-hidden text-[#2B2620] placeholder-[#2B2620]/45 font-semibold transition-all duration-200 shadow-xxs"
                />
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 bg-primary hover:bg-[#3C5040] text-background text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-all cursor-pointer focus:outline-hidden shadow-xs"
              >
                <Plus className="h-4 w-4 stroke-[2]" />
                Add Patient
              </motion.button>
            </div>
          </div>

          {/* Grid view of Patient Cards */}
          {isLoading ? (
            <div className="flex justify-center py-20 bg-[#FFFCF6] border border-[#EADFCA]/50 rounded-2xl">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-[#FFFCF6] border border-dashed border-[#EADFCA] rounded-2xl p-6">
              <User className="h-10 w-10 text-primary/30 mx-auto stroke-[1.25] mb-2 animate-bounce" />
              <h4 className="text-sm font-semibold text-foreground/60">No patients found.</h4>
              <p className="text-xxs text-[#2B2620]/45 mt-0.5 font-bold">Try adjusting your search criteria or register a new patient.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {patients.map((p: any) => {
                const initials = p.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                const age = p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : '—';
                
                return (
                  <motion.div
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#FFFCF6] hover:bg-white border border-[#EADFCA]/60 hover:border-primary/45 p-6 rounded-2xl shadow-[0_4px_20px_rgba(42,38,32,0.012)] hover:shadow-[0_16px_35px_rgba(42,38,32,0.04)] flex flex-col justify-between group transition-all duration-300 cursor-pointer relative overflow-hidden"
                  >
                    {/* Visual Accent Top Bar */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-primary/20 group-hover:bg-primary/50 transition-colors" />

                    <div className="space-y-4">
                      {/* Name and avatar header */}
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-serif text-sm font-bold shadow-xxs shrink-0 group-hover:bg-primary group-hover:text-background group-hover:border-transparent transition-all">
                          {initials}
                        </div>
                        <div className="truncate">
                          <h4 className="text-base font-serif font-bold text-[#2B2620] tracking-wide truncate group-hover:text-primary transition-colors leading-snug">
                            {p.fullName}
                          </h4>
                          <p className="text-[10px] text-[#2B2620]/45 font-bold uppercase tracking-wider mt-0.5">{p.gender} • {age} Yrs</p>
                        </div>
                      </div>

                      {/* Modality segment */}
                      <div className="bg-[#FAF6EF]/60 border border-[#EADFCA]/30 px-3.5 py-2.5 rounded-xl shadow-inner">
                        <span className="text-[9px] font-bold text-[#2B2620]/40 uppercase tracking-widest block mb-0.5">Assigned Modality</span>
                        <span className="text-xs font-serif font-bold text-primary block leading-tight truncate">
                          {p.treatmentModalityAssigned || 'None assigned'}
                        </span>
                      </div>

                      {/* Phone contact */}
                      <div className="flex items-center gap-2 text-xxs font-bold text-[#2B2620]/60 pl-1">
                        <Phone className="h-3.5 w-3.5 text-primary/75 shrink-0 stroke-[1.75]" />
                        <span>{p.phone}</span>
                      </div>
                    </div>

                    {/* Footer link indicator */}
                    <div className="mt-5 pt-3 border-t border-[#EADFCA]/40 flex justify-between items-center text-xxs font-bold uppercase text-[#2B2620]/45 group-hover:text-primary transition-colors pl-1">
                      <span>View Case File</span>
                      <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform stroke-[2]" />
                    </div>
                  </motion.div>
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

