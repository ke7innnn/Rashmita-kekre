'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, UserPlus, Building2, Plus } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';

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

const DEFAULT_DIAGNOSIS_OPTIONS = [
  'Low Back Pain',
  'Knee Osteoarthritis',
  'Cervical Spondylosis',
  'Shoulder Impingement',
  'Frozen Shoulder',
  'Sciatica / Lumbar Radiculopathy',
  'Post-Op Rehabilitation',
  'ACL Reconstruction / Injury',
  'Sports Injury & Recovery',
  'Muscle Strain / Sprain',
  'Ankle Sprain',
  'Tennis Elbow / Golfer\'s Elbow',
  'Stroke Rehabilitation',
  'Bell\'s Palsy / Facial Palsy',
  'General Musculoskeletal Pain',
  'Postural Dysfunction',
  'Ergonomic Strain',
  'Geriatric Care & Mobility'
];

const POPULAR_DIAGNOSES = [
  'Low Back Pain',
  'Knee Osteoarthritis',
  'Cervical Spondylosis',
  'Shoulder Impingement',
  'Post-Op Rehab',
  'Sciatica'
];

const createPatientSchema = z.object({
  fullName: z.string().min(1, 'Patient Name is required'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z.string().optional(),
  phoneCountryCode: z.string().default('+91'),
  phoneLocal: z.string().min(10, 'Valid 10-digit mobile number is required'),
  email: z.string().optional(),
  language: z.string().default('English'),
  address: z.string().optional(),
  referringDoctor: z.string().optional(),
  diagnosisReason: z.string().optional(),
  ageYears: z.any().optional(),
});

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledName?: string;
  prefilledReferringDoctor?: string;
  onSuccess?: () => void;
}

export default function CreatePatientModal({ 
  isOpen, 
  onClose, 
  prefilledName = '', 
  prefilledReferringDoctor = '',
  onSuccess 
}: CreatePatientModalProps) {
  const queryClient = useQueryClient();
  const [showAddressInput, setShowAddressInput] = useState(false);
  
  // Custom doctors from API
  const { data: customDoctors = [], refetch: refetchDoctors } = useQuery({
    queryKey: ['referring-doctors'],
    queryFn: async () => {
      const res = await fetch('/api/referring-doctors');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Quick Add Referral Doctor Sub-form State
  const [showQuickAddDoctor, setShowQuickAddDoctor] = useState(false);
  const [quickDocName, setQuickDocName] = useState('');
  const [quickDocPhone, setQuickDocPhone] = useState('');
  const [quickDocSpecialty, setQuickDocSpecialty] = useState('Orthopedics');
  const [quickDocClinic, setQuickDocClinic] = useState('');
  const [quickDocEmail, setQuickDocEmail] = useState('');

  // Fetch all patients to extract referring doctors
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-all-referrers'],
    queryFn: async () => {
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    },
    enabled: isOpen
  });

  // Compile list of unique referring doctors
  const doctorOptions = Array.from(new Set([
    ...customDoctors.map((d: any) => d.name),
    ...patients.map((p: any) => p.referringDoctor).filter(Boolean)
  ])).sort();

  const { register, handleSubmit, reset, setValue, control, watch, formState: { errors } } = useForm<any>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      phoneCountryCode: '+91',
      gender: 'Female',
      language: 'English',
      fullName: prefilledName,
      referringDoctor: prefilledReferringDoctor,
      diagnosisReason: ''
    }
  });

  // Update default values when props change and modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        phoneCountryCode: '+91',
        gender: 'Female',
        language: 'English',
        fullName: prefilledName,
        referringDoctor: prefilledReferringDoctor,
        diagnosisReason: ''
      });
      setShowAddressInput(false);
      setShowQuickAddDoctor(false);
      setQuickDocName('');
      setQuickDocPhone('');
      setQuickDocClinic('');
      setQuickDocEmail('');
    }
  }, [isOpen, prefilledName, prefilledReferringDoctor, reset]);

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
      queryClient.invalidateQueries({ queryKey: ['patients-all'] });
      onClose();
      if (onSuccess) onSuccess();
    },
  });

  // Sync Age with Date of Birth
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ageValue = e.target.value;
    const years = parseInt(ageValue, 10);
    if (!isNaN(years) && years >= 0 && years <= 120) {
      const calculatedDob = calculateDobFromAge(years, 0);
      setValue('dateOfBirth', calculatedDob);
    } else {
      setValue('dateOfBirth', '');
    }
  };

  const saveNewReferringDoctor = async (name: string, phone?: string, specialty?: string, clinic?: string, email?: string) => {
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    const formattedName = cleanName.startsWith('Dr.') || cleanName.toLowerCase().includes('clinic') || cleanName.toLowerCase().includes('hospital') || cleanName.toLowerCase().includes('direct')
      ? cleanName
      : `Dr. ${cleanName}`;
      
    await fetch('/api/referring-doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formattedName,
        phone: phone ? phone.replace(/\D/g, '').slice(-10) : undefined,
        specialty: specialty || 'General Practice',
        clinic: clinic || 'General Clinic',
        email: email?.trim() || `${formattedName.toLowerCase().replace(/[\s\.]+/g, '')}@email.com`
      })
    });
    
    await refetchDoctors();
    window.dispatchEvent(new Event('custom-doctors-updated'));
    setValue('referringDoctor', formattedName);
    setShowQuickAddDoctor(false);
    setQuickDocName('');
    setQuickDocPhone('');
    setQuickDocClinic('');
    setQuickDocEmail('');
  };

  const handleCreateNewDoctor = (doctorName: string) => {
    setQuickDocName(doctorName);
    setShowQuickAddDoctor(true);
  };

  const onSubmit = (data: any) => {
    const payload = {
      fullName: data.fullName,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date(),
      phone: `${data.phoneCountryCode}${data.phoneLocal}`,
      address: data.address || '',
      referringDoctor: data.referringDoctor || '',
      presentingComplaint: data.diagnosisReason || 'Detailed patient intake form',
      diagnosis: data.diagnosisReason || '',
      treatmentModalityAssigned: '',
      tags: [],
      notes: '',
      email: data.email || '',
      language: data.language || 'English',
    };
    createPatientMutation.mutate(payload);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 select-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative bg-[#0F0D16] border border-white/20 w-full max-w-3xl rounded-3xl shadow-2xl overflow-visible flex flex-col z-10 text-white"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 shrink-0 rounded-t-3xl">
              <h3 className="text-2xl font-serif text-white font-semibold">Add Patient</h3>
              <motion.button 
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white cursor-pointer focus:outline-hidden"
              >
                <X className="h-5 w-5 stroke-[1.75]" />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-visible">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-8 overflow-visible max-h-[60vh] overflow-y-auto bg-[#0F0D16]">
                
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-bold uppercase tracking-wider text-white/60">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Patient Name"
                      {...register('fullName')}
                      className="block w-full text-xs rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold shadow-xs"
                    />
                    {errors.fullName?.message && (
                      <p className="text-[10px] text-rose-400 mt-0.5">{errors.fullName.message as string}</p>
                    )}
                  </div>

                  {/* Mobile No. */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-bold uppercase tracking-wider text-white/60">
                      Mobile No.
                    </label>
                    <div className="flex gap-2">
                      <select
                        {...register('phoneCountryCode')}
                        className="w-24 text-xs rounded-xl border border-white/15 bg-[#0B0A10] px-2 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold shadow-xs cursor-pointer"
                      >
                        <option value="+91">IN (+91)</option>
                        <option value="+1">US (+1)</option>
                        <option value="+44">UK (+44)</option>
                        <option value="+971">AE (+971)</option>
                      </select>
                      <input
                        type="text"
                        {...register('phoneLocal')}
                        className="flex-1 text-xs rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold shadow-xs"
                      />
                    </div>
                    {errors.phoneLocal?.message && (
                      <p className="text-[10px] text-rose-400 mt-0.5">{errors.phoneLocal.message as string}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-bold uppercase tracking-wider text-white/60">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="block w-full text-xs rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold shadow-xs"
                    />
                  </div>

                  {/* Age */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-bold uppercase tracking-wider text-white/60">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      placeholder="E.g., 35"
                      {...register('ageYears')}
                      onChange={handleAgeChange}
                      className="block w-full text-xs rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold shadow-xs"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-bold uppercase tracking-wider text-white/60">
                      Gender
                    </label>
                    <select
                      {...register('gender')}
                      className="block w-full text-xs rounded-xl border border-white/15 bg-[#0B0A10] px-3 py-2.5 text-white focus:border-[#12D6C4] outline-none font-semibold shadow-xs cursor-pointer"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-bold uppercase tracking-wider text-white/60">
                      Language
                    </label>
                    <select
                      {...register('language')}
                      className="block w-full text-xs rounded-xl border border-white/15 bg-[#0B0A10] px-3 py-2.5 text-white focus:border-[#12D6C4] outline-none font-semibold shadow-xs cursor-pointer"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Marathi">Marathi</option>
                      <option value="Gujarati">Gujarati</option>
                      <option value="Tamil">Tamil</option>
                      <option value="Telugu">Telugu</option>
                    </select>
                  </div>

                  {/* Referred By Section */}
                  <div className="space-y-2 relative z-50">
                    <div className="flex justify-between items-center">
                      <label className="block text-xxs font-bold uppercase tracking-wider text-white/60 flex items-center gap-1">
                        <UserPlus className="h-3 w-3 text-[#12D6C4] stroke-[2]" />
                        Referred By (Referral Source)
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddDoctor(!showQuickAddDoctor)}
                        className="text-[10px] font-bold text-[#12D6C4] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                        {showQuickAddDoctor ? 'Cancel' : 'Quick Add Referrer'}
                      </button>
                    </div>

                    <Controller
                      name="referringDoctor"
                      control={control}
                      render={({ field }) => (
                        <SearchableDropdown
                          options={doctorOptions}
                          value={field.value}
                          onChange={field.onChange}
                          onCreateNew={handleCreateNewDoctor}
                          placeholder="Select or search referral doctor/source..."
                          createLabel="Add referral doctor"
                        />
                      )}
                    />

                    {/* Quick Add Referral Sub-Form */}
                    <AnimatePresence>
                      {showQuickAddDoctor && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-2.5 shadow-sm mt-2"
                        >
                          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-[#12D6C4]" /> Quick Add Referral Partner
                            </span>
                            <span className="text-[10px] text-white/50 font-medium">Appears in Referrals Tab</span>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-white/70 mb-0.5">Doctor / Partner Name *</label>
                              <input
                                type="text"
                                placeholder="E.g. Dr. Ramesh Gupta"
                                value={quickDocName}
                                onChange={(e) => setQuickDocName(e.target.value)}
                                className="w-full text-xs rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-white font-semibold focus:border-[#12D6C4] outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-white/70 mb-0.5">Specialty</label>
                                <select
                                  value={quickDocSpecialty}
                                  onChange={(e) => setQuickDocSpecialty(e.target.value)}
                                  className="w-full text-xs rounded-xl border border-white/15 bg-[#0B0A10] px-2 py-1.5 text-white font-semibold focus:border-[#12D6C4] outline-none cursor-pointer"
                                >
                                  <option value="Orthopedics & Joint Care">Orthopedics</option>
                                  <option value="Neurology & Rehabilitation">Neurology</option>
                                  <option value="Rheumatology Specialists">Rheumatology</option>
                                  <option value="Sports Medicine & Rehab">Sports Medicine</option>
                                  <option value="General Practice">General Practice</option>
                                  <option value="Cardiology">Cardiology</option>
                                  <option value="Clinic / Hospital Direct">Clinic / Direct</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold text-white/70 mb-0.5">Clinic / Hospital</label>
                                <input
                                  type="text"
                                  placeholder="E.g. City Ortho Centre"
                                  value={quickDocClinic}
                                  onChange={(e) => setQuickDocClinic(e.target.value)}
                                  className="w-full text-xs rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-white font-semibold focus:border-[#12D6C4] outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-white/70 mb-0.5">WhatsApp Phone (10 Digits)</label>
                                <input
                                  type="tel"
                                  placeholder="e.g. 9833333333"
                                  value={quickDocPhone}
                                  onChange={(e) => setQuickDocPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                  className="w-full text-xs rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-white font-semibold focus:border-[#12D6C4] outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold text-white/70 mb-0.5">Email (Optional)</label>
                                <input
                                  type="email"
                                  placeholder="e.g. dr.ramesh@clinic.com"
                                  value={quickDocEmail}
                                  onChange={(e) => setQuickDocEmail(e.target.value)}
                                  className="w-full text-xs rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-white font-semibold focus:border-[#12D6C4] outline-none"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setShowQuickAddDoctor(false)}
                                className="px-3 py-1 text-xs font-semibold text-white/60 hover:bg-white/10 rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveNewReferringDoctor(quickDocName, quickDocPhone, quickDocSpecialty, quickDocClinic, quickDocEmail)}
                                className="px-3 py-1 text-xs font-bold bg-white hover:bg-white/90 text-black rounded-lg shadow-md cursor-pointer"
                              >
                                Save & Select Referrer
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Diagnosis Reason Selection */}
                  <div className="space-y-1 relative z-40">
                    <label className="block text-xxs font-bold uppercase tracking-wider text-white/60">
                      Diagnosis / Reason for Visit
                    </label>
                    <Controller
                      name="diagnosisReason"
                      control={control}
                      render={({ field }) => (
                        <SearchableDropdown
                          options={DEFAULT_DIAGNOSIS_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          onCreateNew={(customVal) => field.onChange(customVal)}
                          placeholder="Select or search diagnosis..."
                          createLabel="Use custom diagnosis"
                        />
                      )}
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {POPULAR_DIAGNOSES.map((diag) => (
                        <button
                          key={diag}
                          type="button"
                          onClick={() => setValue('diagnosisReason', diag)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer font-medium ${
                            watch('diagnosisReason') === diag
                              ? 'bg-white text-black border-white shadow-md font-bold'
                              : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:border-white/30'
                          }`}
                        >
                          {diag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address Accordion Bar */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddressInput(!showAddressInput)}
                      className="w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-white/20 shadow-xs cursor-pointer"
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
                            className="block w-full text-xs rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2.5 text-white focus:border-[#12D6C4] outline-none font-medium mt-2 shadow-xs"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#0F0D16] shrink-0 rounded-b-3xl">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-5 py-2 bg-transparent hover:bg-white/10 text-white/70 border border-white/15 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer focus:outline-hidden"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.95 }}
                  disabled={createPatientMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer focus:outline-hidden"
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
  );
}
