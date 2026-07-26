'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save, Search, Plus } from 'lucide-react';
const AppointmentSource = { MANUAL_ADMIN: 'MANUAL_ADMIN', WEBSITE: 'WEBSITE', PHONE_AI_AGENT: 'PHONE_AI_AGENT' } as const;
type AppointmentSource = typeof AppointmentSource[keyof typeof AppointmentSource];

const schema = z.object({
  patientId: z.string().min(1, 'Please select or add a patient'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid start time'),
  treatmentType: z.string().default('Physiotherapy Consultation'),
  assignedSlotDuration: z.number().int().positive().default(30),
  notes: z.string().optional(),
});

interface Props {
  onClose: () => void;
  modalities?: any[];
}

export default function AddAppointmentModal({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);

  // New Patient Inline Creation State
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientGender, setNewPatientGender] = useState('Female');
  const [newPatientDob, setNewPatientDob] = useState('1990-01-01');
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [createPatientError, setCreatePatientError] = useState<string | null>(null);

  // Form setup
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      treatmentType: 'Physiotherapy Consultation',
      assignedSlotDuration: 30,
    },
  });

  const handleCreatePatient = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientPhone.trim()) {
      setCreatePatientError('Full name and contact number are required.');
      return;
    }
    setIsCreatingPatient(true);
    setCreatePatientError(null);

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newPatientName.trim(),
          phone: newPatientPhone.trim(),
          gender: newPatientGender,
          dateOfBirth: newPatientDob || '1990-01-01',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create patient.');
      }

      // Automatically select new patient
      setSelectedPatientName(data.fullName);
      setValue('patientId', data.id);
      setShowAddPatient(false);
      setPatientSearch('');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    } catch (err: any) {
      setCreatePatientError(err.message || 'Error creating patient.');
    } finally {
      setIsCreatingPatient(false);
    }
  };

  // Search patients query
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: async () => {
      if (!patientSearch) return [];
      const res = await fetch(`/api/patients?q=${patientSearch}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: patientSearch.length >= 2,
  });

  // Create appointment mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Calculate end time
      const [hours, minutes] = data.startTime.split(':').map(Number);
      const endMinutes = minutes + data.assignedSlotDuration;
      const endHours = hours + Math.floor(endMinutes / 60);
      const finalMinutes = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;

      const payload = {
        ...data,
        endTime,
        source: AppointmentSource.MANUAL_ADMIN,
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Booking failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (err: any) => {
      alert(err.message);
    },
  } as any);

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      {/* Modal Content Sheet */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative bg-[#0F0B1E]/90 backdrop-blur-2xl border border-white/10 w-full max-w-lg rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col z-10 text-white"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/5">
          <div>
            <h3 className="text-xl font-bold text-white font-sans">Book Appointment</h3>
            <p className="text-xs text-white/50">Schedule patient clinical assessment</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white cursor-pointer focus:outline-none transition-colors"
          >
            <X className="h-5 w-5 stroke-[1.75]" />
          </motion.button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <input type="hidden" {...register('patientId')} />
          {/* Patient Selection Search & Quick Add */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70">
                Select Patient
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowAddPatient(!showAddPatient);
                  if (!showAddPatient && patientSearch) {
                    setNewPatientName(patientSearch);
                  }
                }}
                className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                <Plus size={13} /> {showAddPatient ? 'Back to Search' : 'Add New Patient'}
              </button>
            </div>

            {showAddPatient ? (
              /* Inline Add New Patient Card */
              <div className="p-4 bg-white/5 border border-white/15 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-white">New Patient Registration</p>
                
                <div>
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="w-full text-xs bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-white font-semibold placeholder-white/40 focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="w-full text-xs bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-white font-semibold placeholder-white/40 focus:outline-none focus:border-[var(--primary)]"
                  />
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value)}
                    className="w-full text-xs bg-[#161226] border border-white/10 px-3 py-2 rounded-xl text-white font-semibold focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/60 mb-0.5">Date of Birth</label>
                  <input
                    type="date"
                    value={newPatientDob}
                    onChange={(e) => setNewPatientDob(e.target.value)}
                    className="w-full text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-white font-semibold focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                {createPatientError && (
                  <p className="text-xs text-rose-400 font-medium">{createPatientError}</p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddPatient(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white/70 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isCreatingPatient}
                    onClick={handleCreatePatient}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--primary)] text-black hover:opacity-90 flex items-center gap-1"
                  >
                    {isCreatingPatient ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Save & Select Patient
                  </button>
                </div>
              </div>
            ) : selectedPatientName ? (
              <div className="flex justify-between items-center bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-xl">
                <span className="text-sm font-semibold text-[var(--primary)]">{selectedPatientName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientName(null);
                    setValue('patientId', '');
                  }}
                  className="text-xs font-bold text-rose-400 hover:underline cursor-pointer focus:outline-none"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40 stroke-[1.75]" />
                <input
                  type="text"
                  placeholder="Type name or phone to search..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 w-full text-sm bg-white/5 border border-white/10 rounded-xl focus:border-[var(--primary)] focus:outline-none text-white placeholder-white/40 font-semibold"
                />

                {/* Dropdown Results */}
                {patients.length > 0 && (
                  <div className="absolute z-20 w-full mt-1.5 bg-[#161226] border border-white/15 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-white/10">
                    {patients.map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientName(p.fullName);
                          setValue('patientId', p.id);
                          setPatientSearch('');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/10 transition-colors cursor-pointer focus:outline-none"
                      >
                        <p className="font-semibold text-white">{p.fullName}</p>
                        <p className="text-xs text-white/50 font-semibold">{p.phone} • {p.gender}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.patientId?.message && !selectedPatientName && !showAddPatient && (
              <p className="text-xs text-rose-400">{errors.patientId.message as string}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Date
              </label>
              <input
                type="date"
                {...register('date')}
                className="block w-full text-sm rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[var(--primary)] focus:outline-none font-semibold"
              />
              {errors.date?.message && <p className="text-xs text-rose-400 mt-1">{errors.date.message as string}</p>}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Start Time
              </label>
              <input
                type="time"
                {...register('startTime')}
                className="block w-full text-sm rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-[var(--primary)] focus:outline-none font-semibold"
              />
              {errors.startTime?.message && <p className="text-xs text-rose-400 mt-1">{errors.startTime.message as string}</p>}
            </div>
          </div>

          <div>
            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Duration (min)
              </label>
              <select
                {...register('assignedSlotDuration', { valueAsNumber: true })}
                className="block w-full text-sm rounded-xl border border-white/10 bg-[#161226] px-3 py-2.5 text-white focus:border-[var(--primary)] focus:outline-none font-semibold"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          {/* Booking Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
              Booking Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="E.g., referral letter attached, patient requests window seat, etc."
              className="block w-full text-sm rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 focus:border-[var(--primary)] focus:outline-none font-medium"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-4 py-2 border border-white/10 hover:bg-white/10 text-white/80 text-sm font-semibold rounded-xl transition-all cursor-pointer focus:outline-none"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-black text-sm font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer focus:outline-none"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Confirm Booking
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
