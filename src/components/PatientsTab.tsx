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

function calculateAgeFromDob(dobString: string) {
  if (!dobString) return { years: '', months: '' };
  const dob = new Date(dobString);
  const today = new Date();
  if (isNaN(dob.getTime())) return { years: '', months: '' };
  
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  
  if (today.getDate() < dob.getDate()) {
    months--;
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years: years >= 0 ? years : 0, months: months >= 0 ? months : 0 };
}

function calculateDobFromAge(years: number, months: number) {
  const today = new Date();
  let dobYear = today.getFullYear() - years;
  let dobMonth = today.getMonth() - months;
  let dobDay = today.getDate();
  
  while (dobMonth < 0) {
    dobYear--;
    dobMonth += 12;
  }
  
  const calculatedDate = new Date(dobYear, dobMonth, dobDay);
  const yyyy = calculatedDate.getFullYear();
  const mm = String(calculatedDate.getMonth() + 1).padStart(2, '0');
  const dd = String(calculatedDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const createPatientSchema = z.object({
  fullName: z.string().min(1, 'Patient Name is required'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z.string().min(1, 'Date of Birth is required'),
  phoneCountryCode: z.string().default('+91'),
  phoneLocal: z.string().min(10, 'Valid 10-digit mobile number is required'),
  email: z.string().optional(),
  language: z.string().default('English'),
  address: z.string().optional(),
  ageYears: z.any().optional(),
});

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

  // 3. Form config for patient registration
  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm<any>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      phoneCountryCode: '+91',
      gender: 'Female',
      language: 'English',
      bloodGroup: '',
    }
  });

  const createPatientMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Creation failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsCreateModalOpen(false);
      reset();
      setShowAddressInput(false);
    },
  });

  // Bidirectional calculations handlers
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobVal = e.target.value;
    setValue('dateOfBirth', dobVal);
    if (dobVal) {
      const { years, months } = calculateAgeFromDob(dobVal);
      setValue('ageYears', years);
      setValue('ageMonths', months);
    } else {
      setValue('ageYears', '');
      setValue('ageMonths', '');
    }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const years = parseInt(e.target.value || '0', 10);
    if (years > 0) {
      const calculatedDob = calculateDobFromAge(years, 0);
      setValue('dateOfBirth', calculatedDob);
    } else {
      setValue('dateOfBirth', '');
    }
  };

  const onSubmit = (data: any) => {
    const payload = {
      fullName: data.fullName,
      gender: data.gender,
      dateOfBirth: new Date(data.dateOfBirth),
      phone: `${data.phoneCountryCode}${data.phoneLocal}`,
      address: data.address || '',
      referringDoctor: data.referringDoctor || '',
      presentingComplaint: 'Created via detailed patient intake form',
      treatmentModalityAssigned: '',
      tags: [],
      notes: '',
      // Frontend-only payload fields for preparing future database/supabase migration
      email: data.email || '',
      language: data.language || 'English',
    };
    createPatientMutation.mutate(payload);
  };

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

      {/* Create Patient Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            {/* Frosted Glass Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCreateModalOpen(false);
                reset();
                setShowAddressInput(false);
              }}
              className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md"
            />

            {/* Modal Content Sheet */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative bg-[#FFFCF6] border border-[#EADFCA]/40 w-full max-w-3xl rounded-3xl shadow-[0_24px_50px_rgba(42,38,32,0.12)] overflow-hidden flex flex-col z-10"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#EADFCA]/60 bg-[#FFFCF6]/50 shrink-0">
                <h3 className="text-2xl font-serif text-[#2B2620] font-semibold">Add Patient</h3>
                <motion.button 
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    reset();
                    setShowAddressInput(false);
                  }} 
                  className="p-1.5 rounded-full hover:bg-[#FAF6EF] text-[#2B2620]/50 hover:text-[#2B2620] cursor-pointer focus:outline-hidden"
                >
                  <X className="h-5 w-5 stroke-[1.75]" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
                
                {/* Form Content Body: Two Columns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-8 overflow-y-auto max-h-[60vh] bg-[#FFFCF6]">
                  
                  {/* Left Column */}
                  <div className="space-y-4">
                    
                    {/* Mobile No. */}
                    <div className="space-y-1">
                      <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">
                        Mobile No.
                      </label>
                      <div className="flex gap-2">
                        <select
                          {...register('phoneCountryCode')}
                          className="w-24 text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/60 px-2 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold shadow-xxs cursor-pointer"
                        >
                          <option value="+91">IN (+91)</option>
                          <option value="+1">US (+1)</option>
                          <option value="+44">UK (+44)</option>
                          <option value="+971">AE (+971)</option>
                        </select>
                        <input
                          type="text"
                          {...register('phoneLocal')}
                          className="flex-1 text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3.5 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold shadow-xxs"
                        />
                      </div>
                      {errors.phoneLocal?.message && (
                        <p className="text-[10px] text-red-500 mt-0.5">{errors.phoneLocal.message as string}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">
                        Email
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3.5 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold shadow-xxs"
                      />
                    </div>

                    {/* Age */}
                    <div className="space-y-1">
                      <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">
                        Age
                      </label>
                      <input
                        type="number"
                        placeholder="E.g., 35"
                        {...register('ageYears')}
                        onChange={handleAgeChange}
                        className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3.5 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold shadow-xxs"
                      />
                      {errors.dateOfBirth?.message && (
                        <p className="text-[10px] text-red-500 mt-0.5">{errors.dateOfBirth.message as string}</p>
                      )}
                    </div>

                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    
                    {/* Gender */}
                    <div className="space-y-1">
                      <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">
                        Gender
                      </label>
                      <select
                        {...register('gender')}
                        className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold shadow-xxs cursor-pointer"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div className="space-y-1">
                      <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">
                        Language
                      </label>
                      <select
                        {...register('language')}
                        className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold shadow-xxs cursor-pointer"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Marathi">Marathi</option>
                        <option value="Gujarati">Gujarati</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Telugu">Telugu</option>
                      </select>
                    </div>

                    {/* Referring Doctor */}
                    <div className="space-y-1">
                      <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">
                        Referring Doctor
                      </label>
                      <input
                        type="text"
                        placeholder="E.g., Dr. Amit Sharma"
                        {...register('referringDoctor')}
                        className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold placeholder-[#2B2620]/35 shadow-xxs"
                      />
                    </div>

                    {/* Address Accordion Bar */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddressInput(!showAddressInput)}
                        className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-primary/20 shadow-xxs cursor-pointer"
                      >
                        Address Details
                      </button>
                      <AnimatePresence>
                        {showAddressInput && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <textarea
                              {...register('address')}
                              placeholder="Enter full address here..."
                              rows={3}
                              className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3.5 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden font-medium mt-2 shadow-xxs"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>

                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#EADFCA]/60 bg-[#FFFCF6]/50 shrink-0">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      reset();
                      setShowAddressInput(false);
                    }}
                    className="px-5 py-2 bg-transparent hover:bg-[#FAF6EF] text-[#2B2620]/75 border border-[#EADFCA] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer focus:outline-hidden"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.95 }}
                    disabled={createPatientMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer focus:outline-hidden"
                  >
                    {createPatientMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 stroke-[1.75]" />
                    )}
                    Add Patient
                  </motion.button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

