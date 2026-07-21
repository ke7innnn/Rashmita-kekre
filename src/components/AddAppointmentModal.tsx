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
  treatmentType: z.string().min(1, 'Modality is required'),
  assignedSlotDuration: z.number().int().positive().default(30),
  notes: z.string().optional(),
});

interface Props {
  onClose: () => void;
  modalities: any[];
}

export default function AddAppointmentModal({ onClose, modalities }: Props) {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);

  // Form setup
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      assignedSlotDuration: 30,
    },
  });

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
      {/* Frosted Glass Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md"
      />

      {/* Modal Content Sheet */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative bg-[#FFFCF6]/90 backdrop-blur-lg border border-[#EADFCA]/40 w-full max-w-lg rounded-3xl shadow-[0_24px_50px_rgba(42,38,32,0.12)] overflow-hidden flex flex-col z-10"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#EADFCA]/60 bg-[#FFFCF6]/50">
          <h3 className="text-2xl font-serif text-[#2B2620] font-semibold">Book Appointment</h3>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-[#FAF6EF] text-[#2B2620]/50 hover:text-[#2B2620] cursor-pointer focus:outline-hidden"
          >
            <X className="h-5 w-5 stroke-[1.75]" />
          </motion.button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <input type="hidden" {...register('patientId')} />
          {/* Patient Selection Search */}
          <div className="space-y-2">
            <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1">
              Select Patient
            </label>
            {selectedPatientName ? (
              <div className="flex justify-between items-center bg-[#FAF6EF] border border-[#EADFCA] px-3.5 py-2.5 rounded-xl">
                <span className="text-sm font-semibold text-primary">{selectedPatientName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatientName(null);
                    setValue('patientId', '');
                  }}
                  className="text-xs font-bold text-red-500 hover:underline cursor-pointer focus:outline-hidden"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#2B2620]/30 stroke-[1.75]" />
                <input
                  type="text"
                  placeholder="Type name or phone to search..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-sm bg-[#FAF6EF] border border-[#EADFCA] rounded-xl focus:border-primary focus:outline-hidden text-[#2B2620] placeholder-[#2B2620]/45 font-semibold"
                />

                {/* Dropdown Results */}
                {patients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1.5 bg-[#FFFCF6] border border-[#EADFCA] rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-[#EADFCA]/40">
                    {patients.map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientName(p.fullName);
                          setValue('patientId', p.id);
                          setPatientSearch('');
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#FAF6EF]/70 transition-colors cursor-pointer focus:outline-hidden"
                      >
                        <p className="font-semibold text-[#2B2620]">{p.fullName}</p>
                        <p className="text-xs text-[#2B2620]/50 font-semibold">{p.phone} • {p.gender}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.patientId?.message && (
              <p className="text-xs text-red-500">{errors.patientId.message as string}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1">
                Date
              </label>
              <input
                type="date"
                {...register('date')}
                className="block w-full text-sm rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
              />
              {errors.date?.message && <p className="text-xs text-red-500 mt-1">{errors.date.message as string}</p>}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1">
                Start Time
              </label>
              <input
                type="time"
                {...register('startTime')}
                className="block w-full text-sm rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
              />
              {errors.startTime?.message && <p className="text-xs text-red-500 mt-1">{errors.startTime.message as string}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Modality */}
            <div>
              <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1">
                Modality
              </label>
              <input
                type="text"
                placeholder="E.g., Laser Therapy"
                {...register('treatmentType')}
                className="block w-full text-sm rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
              />
              {errors.treatmentType?.message && <p className="text-xs text-red-500 mt-1">{errors.treatmentType.message as string}</p>}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1">
                Duration (min)
              </label>
              <select
                {...register('assignedSlotDuration', { valueAsNumber: true })}
                className="block w-full text-sm rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
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
            <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1">
              Booking Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="E.g., referral letter attached, patient requests window seat, etc."
              className="block w-full text-sm rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] placeholder-[#2B2620]/30 focus:border-primary focus:outline-hidden font-medium"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#EADFCA]/60">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-4 py-2 border border-[#EADFCA] hover:bg-[#FAF6EF] text-sm font-semibold rounded-xl transition-all cursor-pointer focus:outline-hidden"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.95 }}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-[#3C5040] text-background text-sm font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer focus:outline-hidden"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4 stroke-[1.75]" />
              )}
              Confirm Booking
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
