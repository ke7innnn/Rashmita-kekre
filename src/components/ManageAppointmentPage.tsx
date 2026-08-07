'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Loader2, Save, User, Calendar, Clock, Activity, 
  FileText, CheckCircle, AlertCircle, X, ShieldAlert, ArrowRight, 
  Phone, Mail, FileDigit, CalendarCheck
} from 'lucide-react';
const AppointmentStatus = { WAITING: 'WAITING', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', SCHEDULED: 'SCHEDULED', NO_SHOW: 'NO_SHOW', CANCELLED: 'CANCELLED' } as const;
type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

const schema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  treatmentType: z.string().min(1),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  appointmentId: string;
  onBack: () => void;
}

export default function ManageAppointmentPage({ appointmentId, onBack }: Props) {
  const queryClient = useQueryClient();
  const [matchingWaitlistEntry, setMatchingWaitlistEntry] = useState<any | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  // 1. Fetch appointment details
  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: async () => {
      const res = await fetch(`/api/appointments/${appointmentId}`);
      if (!res.ok) throw new Error('Failed to fetch appointment details');
      return res.json();
    },
  });

  // Fetch modalities list for the dropdown selection
  const { data: modalities = [] } = useQuery({
    queryKey: ['modalities'],
    queryFn: async () => {
      const res = await fetch('/api/modalities');
      if (!res.ok) throw new Error('Failed to fetch modalities');
      return res.json();
    },
  });

  const modalitiesList = Array.isArray(modalities) ? modalities : [];

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
              return; // Stay on the page to display slot promotion
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onBack();
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (isLoading || !appointment) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center bg-[#FFFCF6] border border-[#EADFCA]/60 rounded-2xl p-6">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
        <p className="text-sm font-semibold text-[#2B2620]/75">Retrieving active session credentials...</p>
      </div>
    );
  }

  const patient = appointment.patient;
  const initials = patient.fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    [AppointmentStatus.COMPLETED]: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/60' },
    [AppointmentStatus.IN_PROGRESS]: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/60' },
    [AppointmentStatus.WAITING]: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200/60' },
    [AppointmentStatus.SCHEDULED]: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/60' },
    [AppointmentStatus.NO_SHOW]: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/60' },
    [AppointmentStatus.CANCELLED]: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200/60' }
  };

  const currentTheme = statusColors[appointment.status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200/60' };

  return (
    <div className="space-y-6">
      {/* Back button and page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer shadow-xs focus:outline-hidden"
          >
            <ChevronLeft className="h-4.5 w-4.5 stroke-[2]" />
          </motion.button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-serif font-bold text-white">Manage Session</h2>
              <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full border uppercase tracking-wider ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border}`}>
                {appointment.status}
              </span>
            </div>
            <p className="text-xs text-white/60 font-bold mt-0.5">Edit status, notes, and waitlist allocations for this patient.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              window.location.href = `/crm360/assessments/new?patientId=${patient.id}`;
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <FileText className="h-4 w-4 stroke-[2]" />
            + Live Assessment
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              window.location.href = `/crm360/billing/invoices/new?patientId=${patient.id}&appointmentId=${appointment.id}`;
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <FileText className="h-4 w-4 stroke-[2]" />
            + Generate Invoice
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Update Action Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Action Sheet Form */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-serif font-bold text-white mb-4 pb-2 border-b border-white/15">Update Session Credentials</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status selector */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-white/70 mb-1.5 pl-1">
                    Session Status
                  </label>
                  <select
                    {...register('status')}
                    className="block w-full text-xs rounded-xl border border-white/20 bg-[#12101B] px-3 py-2.5 text-white focus:border-white/50 focus:outline-hidden font-semibold transition-all cursor-pointer"
                  >
                    <option value={AppointmentStatus.SCHEDULED} className="bg-[#12101B] text-white">Scheduled (Upcoming)</option>
                    <option value={AppointmentStatus.WAITING} className="bg-[#12101B] text-white">Waiting (Checked-in)</option>
                    <option value={AppointmentStatus.IN_PROGRESS} className="bg-[#12101B] text-white">In Progress (With Doctor)</option>
                    <option value={AppointmentStatus.COMPLETED} className="bg-[#12101B] text-white">Completed</option>
                    <option value={AppointmentStatus.NO_SHOW} className="bg-[#12101B] text-white">No Show</option>
                    <option value={AppointmentStatus.CANCELLED} className="bg-[#12101B] text-white">Cancelled</option>
                  </select>
                </div>

                {/* Modality selector */}
                <div>
                  <label className="block text-xxs font-bold uppercase tracking-wider text-white/70 mb-1.5 pl-1">
                    Assigned Modality
                  </label>
                  <select
                    {...register('treatmentType')}
                    className="block w-full text-xs rounded-xl border border-white/20 bg-[#12101B] px-3 py-2.5 text-white focus:border-white/50 focus:outline-hidden font-semibold transition-all cursor-pointer"
                  >
                    <optgroup label="Craniosacral Therapy" className="bg-[#12101B] text-white font-bold">
                      <option value="Craniosacral Therapy (CST / BCST)" className="bg-[#12101B] text-white">Craniosacral Therapy — CST / BCST</option>
                      <option value="CST — SomatoEmotional Release" className="bg-[#12101B] text-white">Craniosacral Therapy — SomatoEmotional Release</option>
                    </optgroup>
                    {modalitiesList.length > 0 && (
                      <optgroup label="Clinical Physical Therapy Modalities" className="bg-[#12101B] text-white font-bold">
                        {modalitiesList.map((m: any) => (
                          <option key={m.id} value={m.name} className="bg-[#12101B] text-white">
                            {m.category} — {m.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {errors.treatmentType && (
                    <p className="text-xs text-rose-400 mt-1">{errors.treatmentType.message}</p>
                  )}
                </div>
              </div>

              {/* Clinical SOAP Notes */}
              <div>
                <label className="block text-xxs font-bold uppercase tracking-wider text-white/70 mb-1.5 pl-1">
                  Clinical Session Notes (SOAP)
                </label>
                <textarea
                  {...register('notes')}
                  rows={6}
                  placeholder="Enter details on treatment progression, complaints, or homework assigned..."
                  className="block w-full text-xs rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-white/50 focus:bg-white/15 focus:outline-hidden font-medium transition-all"
                />
              </div>

              {/* Form buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-white/15">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="px-4 py-2 text-xs font-bold text-white/80 hover:bg-white/10 border border-white/20 rounded-xl transition-all cursor-pointer focus:outline-hidden"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.95 }}
                  disabled={mutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-[#3C5040] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer focus:outline-hidden shadow-xs"
                >
                  {mutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 stroke-[2]" />
                  )}
                  Save Session Details
                </motion.button>
              </div>
            </form>
          </div>

          {/* Inline Waitlist promotion slot opportunity */}
          <AnimatePresence>
            {matchingWaitlistEntry && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="bg-[#FFFCF6] border-2 border-primary/20 p-6 rounded-2xl shadow-[0_8px_30px_rgba(42,38,32,0.03)] space-y-4"
              >
                <div className="flex items-center gap-2 text-primary">
                  <ShieldAlert className="h-5 w-5 stroke-[2]" />
                  <h3 className="text-lg font-serif font-bold">Slot Promotion Opportunity</h3>
                </div>
                <p className="text-xs text-[#2B2620]/75 leading-relaxed font-semibold">
                  This appointment has been marked as <strong>Cancelled</strong>. We found an active waitlist candidate looking for <strong className="text-primary">{matchingWaitlistEntry.app.treatmentType}</strong> on this date:
                </p>

                <div className="bg-[#FAF6EF]/80 border border-[#EADFCA]/60 p-4 rounded-xl space-y-2.5 shadow-inner">
                  <div>
                    <span className="text-[9px] font-bold text-[#2B2620]/45 uppercase tracking-wider block">Candidate Match</span>
                    <strong className="text-base font-serif font-bold text-[#2B2620] block">{matchingWaitlistEntry.match.patient.fullName}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xxs font-bold uppercase text-[#2B2620]/60">
                    <div>
                      <span className="text-[#2B2620]/40 block mb-0.5">Phone Contact</span>
                      <span>{matchingWaitlistEntry.match.patient.phone}</span>
                    </div>
                    <div>
                      <span className="text-[#2B2620]/40 block mb-0.5">Preferred Window</span>
                      <span>{matchingWaitlistEntry.match.preferredTimeWindow}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['appointments'] });
                      onBack();
                    }}
                    className="px-4 py-2 border border-[#EADFCA] hover:bg-[#FAF6EF] text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden"
                  >
                    Keep Slot Empty
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    disabled={isPromoting}
                    onClick={async () => {
                      setIsPromoting(true);
                      try {
                        const res = await fetch('/api/waitlist/promote', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            waitlistId: matchingWaitlistEntry.match.id,
                            date: matchingWaitlistEntry.app.date,
                            startTime: matchingWaitlistEntry.app.startTime,
                            endTime: matchingWaitlistEntry.app.endTime,
                            treatmentType: matchingWaitlistEntry.app.treatmentType,
                            assignedSlotDuration: matchingWaitlistEntry.app.assignedSlotDuration,
                          }),
                        });
                        if (res.ok) {
                          queryClient.invalidateQueries({ queryKey: ['appointments'] });
                          onBack();
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsPromoting(false);
                      }
                    }}
                    className="px-5 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl transition-all cursor-pointer focus:outline-hidden flex items-center gap-1.5 shadow-xs"
                  >
                    {isPromoting && <Loader2 className="h-3 w-3 animate-spin" />}
                    Promote Candidate
                    <ArrowRight className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Patient Credentials Sidebar */}
        <div className="space-y-6">
          {/* Patient Card profile panel */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-primary/40" />
            
            <div className="flex flex-col items-center pt-2">
              <div className="h-16 w-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-serif text-white font-bold text-2xl shadow-xs">
                {initials}
              </div>
              <h3 className="text-xl font-serif font-bold text-white mt-3 leading-tight">{patient.fullName}</h3>
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">{patient.gender} • {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} Years</span>
            </div>

            <div className="border-t border-white/15 pt-4 text-left space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-white/80">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2.5 text-xs text-white/80 truncate">
                  <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold truncate">{patient.email}</span>
                </div>
              )}
              {patient.uid && (
                <div className="flex items-center gap-2.5 text-xs text-white/80">
                  <FileDigit className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[8px] font-bold uppercase text-white/40 block leading-none">Third Party UID</span>
                    <span className="font-mono font-bold text-[10px] text-white mt-0.5 block">{patient.uid}</span>
                  </div>
                </div>
              )}
              {patient.dateOfMarriage && (
                <div className="flex items-center gap-2.5 text-xs text-white/80">
                  <CalendarCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[8px] font-bold uppercase text-white/40 block leading-none">Anniversary / Marriage Date</span>
                    <span className="font-bold text-[10px] text-white mt-0.5 block">{new Date(patient.dateOfMarriage).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Session Packages summary panel */}
          {patient.sessionPackages && patient.sessionPackages.length > 0 && (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 pl-0.5">Active Session Modality Package</h4>
              
              {patient.sessionPackages.map((pkg: any) => {
                const percent = Math.min(100, Math.round((pkg.sessionsUsed / pkg.totalSessions) * 100));
                return (
                  <div key={pkg.id} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-white">{pkg.packageName || 'Treatment Pack'}</span>
                      <span className="text-emerald-400">{pkg.sessionsUsed} / {pkg.totalSessions} Used</span>
                    </div>
                    {/* Progress slider bar */}
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/15 shadow-inner">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-white/50 font-semibold">
                      {pkg.totalSessions - pkg.sessionsUsed} therapeutic sessions remaining in package.
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Clinical Assessment Form Attachments Panel */}
          <PatientAttachmentsSection patientId={patient.id} />
        </div>
      </div>
    </div>
  );
}

function PatientAttachmentsSection({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [fileType, setFileType] = useState('Assessment Form (PDF)');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: attachments = [] } = useQuery({
    queryKey: ['patient-attachments', patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/attachments`);
      if (!res.ok) throw new Error('Failed to fetch attachments');
      return res.json();
    },
  });

  const addAttachmentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/patients/${patientId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save attachment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-attachments', patientId] });
      setAttachmentName('');
      setAttachmentUrl('');
      setIsUploading(false);
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.message || 'Error saving attachment');
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      const res = await fetch(`/api/patients/${patientId}/attachments?attachmentId=${attachmentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete attachment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-attachments', patientId] });
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!attachmentName) {
        setAttachmentName(file.name);
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachmentUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 pl-0.5">
          Clinical Assessment Attachments ({attachments.length})
        </h4>
        <button
          type="button"
          onClick={() => setIsUploading(!isUploading)}
          className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer focus:outline-none"
        >
          {isUploading ? 'Cancel' : '+ Attach Form'}
        </button>
      </div>

      {isUploading && (
        <div className="p-4 bg-white/10 border border-white/20 rounded-xl space-y-3">
          <p className="text-xs font-bold text-white">Attach Assessment Document</p>
          <div>
            <input
              type="text"
              placeholder="Form Title / Document Name *"
              value={attachmentName}
              onChange={(e) => setAttachmentName(e.target.value)}
              className="w-full text-xs bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-white font-semibold focus:outline-none focus:border-white/50 mb-2 placeholder-white/40"
            />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="text-xs bg-[#12101B] border border-white/20 px-3 py-2 rounded-xl text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Assessment Form (PDF)" className="bg-[#12101B] text-white">Assessment Form (PDF)</option>
                <option value="Intake Form" className="bg-[#12101B] text-white">Intake Form</option>
                <option value="Imaging / X-Ray" className="bg-[#12101B] text-white">Imaging / X-Ray</option>
                <option value="Referral Letter" className="bg-[#12101B] text-white">Referral Letter</option>
              </select>
              <label className="cursor-pointer bg-white/10 border border-white/20 text-xs font-bold text-white/80 px-3 py-2 rounded-xl flex items-center justify-center hover:bg-white/20">
                <span>{attachmentUrl ? '✓ File Uploaded' : 'Upload File'}</span>
                <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
              </label>
            </div>
            {!attachmentUrl && (
              <input
                type="text"
                placeholder="Or paste File / Document Web URL *"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="w-full text-xs bg-white/10 border border-white/20 px-3 py-2 rounded-xl text-white font-semibold focus:outline-none focus:border-white/50 placeholder-white/40"
              />
            )}
          </div>

          {uploadError && <p className="text-xs text-rose-400 font-medium">{uploadError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={addAttachmentMutation.isPending || !attachmentName || !attachmentUrl}
              onClick={() => addAttachmentMutation.mutate({ name: attachmentName, url: attachmentUrl, fileType })}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
            >
              {addAttachmentMutation.isPending && <Loader2 size={13} className="animate-spin" />}
              Save Attachment
            </button>
          </div>
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="text-xs text-white/45 font-medium italic">No assessment forms attached yet.</p>
      ) : (
        <div className="space-y-2 divide-y divide-white/10">
          {attachments.map((att: any) => (
            <div key={att.id} className="pt-2 flex items-center justify-between text-xs">
              <div>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-400 hover:underline block"
                >
                  📄 {att.name}
                </a>
                <span className="text-[10px] text-white/45 font-semibold">
                  {att.fileType} • {new Date(att.uploadedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => deleteAttachmentMutation.mutate(att.id)}
                className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
