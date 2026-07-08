'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save } from 'lucide-react';
import { AppointmentStatus } from '@prisma/client';

const schema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  treatmentType: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  appointmentId: string;
  onClose: () => void;
  modalities: any[];
}

export default function QuickActionModal({ appointmentId, onClose, modalities }: Props) {
  const queryClient = useQueryClient();
  const [matchingWaitlistEntry, setMatchingWaitlistEntry] = useState<any | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  // 1. Fetch appointment details
  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const res = await fetch(`/api/appointments`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      return data.find((a: any) => a.id === appointmentId);
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (appointment) {
      reset({
        status: appointment.status,
        treatmentType: appointment.treatmentType,
        notes: appointment.notes || '',
      });
    }
  }, [appointment, reset]);

  // 2. Mutation to update appointment
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: async (data: any) => {
      // Check if status was updated to CANCELLED
      if (data.status === AppointmentStatus.CANCELLED) {
        try {
          const res = await fetch('/api/waitlist');
          if (res.ok) {
            const list = await res.json();
            const match = list.find(
              (w: any) => w.desiredTreatmentType === data.treatmentType && w.status === 'WAITING'
            );
            if (match) {
              setMatchingWaitlistEntry({ match, app: data });
              return; // Do not close yet; show the promotion card!
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (isLoading || !appointment) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B2620]/30 backdrop-blur-md">
        <div className="bg-[#FFFCF6] p-8 rounded-2xl shadow-[0_24px_50px_rgba(42,38,32,0.06)] border border-[#EADFCA] flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
          <span className="text-sm font-semibold text-[#2B2620]/75">Loading details...</span>
        </div>
      </div>
    );
  }

  // Render Waitlist promotion panel
  if (matchingWaitlistEntry) {
    const { match, app } = matchingWaitlistEntry;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
        {/* Frosted Glass Overlay */}
        <div className="absolute inset-0 bg-[#2B2620]/35 backdrop-blur-md" onClick={onClose} />
        
        {/* Promotion Dialogue */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-3xl shadow-[0_24px_50px_rgba(42,38,32,0.15)] w-full max-w-md z-10 space-y-4"
        >
          <h3 className="text-xl font-serif font-bold text-primary">Slot Promotion Opportunity</h3>
          <p className="text-xs text-[#2B2620]/70 leading-relaxed font-semibold">
            An appointment slot for <strong className="text-primary">{app.treatmentType}</strong> on <strong>{new Date(app.date).toLocaleDateString()}</strong> at <strong>{app.startTime}</strong> has been cancelled.
          </p>
          <div className="bg-[#FAF6EF] border border-[#EADFCA] p-4 rounded-2xl space-y-1 shadow-inner">
            <p className="text-[10px] font-bold text-[#2B2620]/45 uppercase tracking-wider">Top Waitlist Match</p>
            <p className="text-base font-serif font-bold text-[#2B2620]">{match.patient.fullName}</p>
            <p className="text-xs text-[#2B2620]/60 font-semibold">{match.patient.phone} • Preferred: {match.preferredTimeWindow}</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['appointments'] });
                onClose();
              }}
              className="px-4 py-2 border border-[#EADFCA] hover:bg-[#FAF6EF] text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden"
            >
              Skip
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                setIsPromoting(true);
                try {
                  const res = await fetch('/api/waitlist/promote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      waitlistId: match.id,
                      date: app.date,
                      startTime: app.startTime,
                      endTime: app.endTime,
                      treatmentType: app.treatmentType,
                      assignedSlotDuration: app.assignedSlotDuration,
                    }),
                  });
                  if (res.ok) {
                    queryClient.invalidateQueries({ queryKey: ['appointments'] });
                    onClose();
                  }
                } catch (err) {
                  console.error(err);
                } finally {
                  setIsPromoting(false);
                }
              }}
              disabled={isPromoting}
              className="px-4 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden flex items-center gap-2"
            >
              {isPromoting && <Loader2 className="h-3 w-3 animate-spin" />}
              {isPromoting ? 'Promoting...' : 'Promote Patient'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

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
          <div>
            <h3 className="text-2xl font-serif text-[#2B2620] font-semibold">Quick Status Update</h3>
            <p className="text-xs text-[#2B2620]/50 mt-0.5 font-bold">Patient: {appointment.patient.fullName}</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-[#FAF6EF] text-[#2B2620]/50 hover:text-[#2B2620] cursor-pointer focus:outline-hidden"
          >
            <X className="h-5 w-5 stroke-[1.75]" />
          </motion.button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 flex-1">
          {/* Status Selection */}
          <div>
            <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1">
              Appointment Status
            </label>
            <select
              {...register('status')}
              className="block w-full text-sm rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
            >
              <option value={AppointmentStatus.SCHEDULED}>Scheduled (Upcoming)</option>
              <option value={AppointmentStatus.WAITING}>Waiting (Checked-in)</option>
              <option value={AppointmentStatus.IN_PROGRESS}>In Progress (With Doctor)</option>
              <option value={AppointmentStatus.COMPLETED}>Completed</option>
              <option value={AppointmentStatus.NO_SHOW}>No Show</option>
              <option value={AppointmentStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>

          {/* Treatment Type Dropdown */}
          <div>
            <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1">
              Assigned Modality
            </label>
            <select
              {...register('treatmentType')}
              className="block w-full text-sm rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
            >
              {modalities.map((m: any) => (
                <option key={m.id} value={m.name}>
                  {m.category} — {m.name}
                </option>
              ))}
            </select>
            {errors.treatmentType && (
              <p className="text-xs text-red-500 mt-1">{errors.treatmentType.message}</p>
            )}
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1">
              Clinical Session Notes
            </label>
            <textarea
              {...register('notes')}
              rows={4}
              placeholder="Enter details on treatment progression, complaints, or homework assigned..."
              className="block w-full text-sm rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] placeholder-[#2B2620]/30 focus:border-primary focus:outline-hidden font-medium"
            />
          </div>

          {/* Save Action */}
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
              Save Updates
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
