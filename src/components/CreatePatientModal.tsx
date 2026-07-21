'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';
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

const createPatientSchema = z.object({
  fullName: z.string().min(1, 'Patient Name is required'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z.string().min(1, 'Date of Birth is required'),
  phoneCountryCode: z.string().default('+91'),
  phoneLocal: z.string().min(10, 'Valid 10-digit mobile number is required'),
  email: z.string().optional(),
  language: z.string().default('English'),
  address: z.string().optional(),
  referringDoctor: z.string().optional(),
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
  
  // Custom doctors from localStorage
  const [customDoctors, setCustomDoctors] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const list = localStorage.getItem('custom_referral_doctors');
      if (list) {
        try {
          setCustomDoctors(JSON.parse(list));
        } catch (e) {
          console.error('Error parsing custom doctors list:', e);
        }
      }
    }
  }, [isOpen]);

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
    ...customDoctors.map(d => d.name),
    ...patients.map((p: any) => p.referringDoctor).filter(Boolean),
    'Dr. Amit Sharma', 'Dr. Rajesh Patel', 'Dr. Priya Nair', 'Dr. Vikram Malhotra' // Defaults
  ])).sort();

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<any>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      phoneCountryCode: '+91',
      gender: 'Female',
      language: 'English',
      fullName: prefilledName,
      referringDoctor: prefilledReferringDoctor
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
        referringDoctor: prefilledReferringDoctor
      });
      setShowAddressInput(false);
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

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobVal = e.target.value;
    setValue('dateOfBirth', dobVal);
    if (dobVal) {
      const { years, months } = calculateAgeFromDob(dobVal);
      setValue('ageYears', years);
    } else {
      setValue('ageYears', '');
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

  const handleCreateNewDoctor = (doctorName: string) => {
    const formattedName = doctorName.startsWith('Dr.') ? doctorName.trim() : `Dr. ${doctorName.trim()}`;
    const newDoc = {
      name: formattedName,
      specialty: 'General Practice',
      clinic: 'General Clinic',
      email: `${formattedName.toLowerCase().replace(/[\\s\\.]+/g, '')}@email.com`
    };
    const updated = [...customDoctors.filter(d => d.name !== formattedName), newDoc];
    setCustomDoctors(updated);
    localStorage.setItem('custom_referral_doctors', JSON.stringify(updated));
    localStorage.setItem(`referral_doctor_metadata:${formattedName}`, JSON.stringify(newDoc));
    setValue('referringDoctor', formattedName);
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
            className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md"
          />

          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative bg-[#FFFCF6] border border-[#EADFCA]/40 w-full max-w-3xl rounded-3xl shadow-[0_24px_50px_rgba(42,38,32,0.12)] overflow-visible flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#EADFCA]/60 bg-[#FFFCF6]/50 shrink-0 rounded-t-3xl">
              <h3 className="text-2xl font-serif text-[#2B2620] font-semibold">Add Patient</h3>
              <motion.button 
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="p-1.5 rounded-full hover:bg-[#FAF6EF] text-[#2B2620]/50 hover:text-[#2B2620] cursor-pointer focus:outline-hidden"
              >
                <X className="h-5 w-5 stroke-[1.75]" />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-visible">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-8 overflow-visible max-h-[60vh] overflow-y-auto bg-[#FFFCF6]">
                
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Patient Name"
                      {...register('fullName')}
                      className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3.5 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold shadow-xxs"
                    />
                    {errors.fullName?.message && (
                      <p className="text-[10px] text-red-500 mt-0.5">{errors.fullName.message as string}</p>
                    )}
                  </div>

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

                  {/* Age and DOB */}
                  <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        {...register('dateOfBirth')}
                        onChange={handleDobChange}
                        className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3.5 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold shadow-xxs cursor-text"
                      />
                    </div>
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

                  {/* Referring Doctor Dropdown */}
                  <div className="space-y-1 relative z-50">
                    <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">
                      Referring Doctor
                    </label>
                    <Controller
                      name="referringDoctor"
                      control={control}
                      render={({ field }) => (
                        <SearchableDropdown
                          options={doctorOptions}
                          value={field.value}
                          onChange={field.onChange}
                          onCreateNew={handleCreateNewDoctor}
                          placeholder="Select or add doctor..."
                          createLabel="Create doctor"
                        />
                      )}
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
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#EADFCA]/60 bg-[#FFFCF6]/50 shrink-0 rounded-b-3xl">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
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
  );
}
