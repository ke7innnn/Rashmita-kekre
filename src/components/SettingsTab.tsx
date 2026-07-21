'use client';
 
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Save, Loader2, ShieldAlert, Eye, EyeOff, Building, Clock, MessageSquare, X, CalendarX } from 'lucide-react';
 
const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid contact phone required'),
  email: z.string().email('Valid email required'),
  address: z.string().min(1, 'Address is required'),
  primaryDoctor: z.string().min(1, 'Doctor name required'),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format'),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format'),
  slotDuration: z.number().int().positive().default(30),
  isPubliclyVisible: z.boolean().default(true),
  reminder24hTemplate: z.string().optional(),
  reminder2hTemplate: z.string().optional(),
});
 
interface Props {
  user: {
    name: string;
    role: string;
  };
}
 
export default function SettingsTab({ user }: Props) {
  const queryClient = useQueryClient();
  const isAdmin = user.role === 'admin';
  const [holidayDates, setHolidayDates] = useState<string[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
 
  // 1. Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
  });
 
  const { register, handleSubmit, reset, formState: { errors } } = useForm<any>({
    resolver: zodResolver(settingsSchema),
  });
 
  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        primaryDoctor: settings.primaryDoctor,
        workingHoursStart: settings.workingHoursStart,
        workingHoursEnd: settings.workingHoursEnd,
        slotDuration: settings.slotDuration,
        isPubliclyVisible: settings.isPubliclyVisible,
        reminder24hTemplate: settings.reminder24hTemplate || '',
        reminder2hTemplate: settings.reminder2hTemplate || '',
      });
      setHolidayDates(settings.holidays || []);
    }
  }, [settings, reset]);

  const addHolidayDate = () => {
    if (!newHolidayDate) return;
    if (holidayDates.includes(newHolidayDate)) return;
    setHolidayDates(prev => [...prev, newHolidayDate].sort());
    setNewHolidayDate('');
  };

  const removeHolidayDate = (date: string) => {
    setHolidayDates(prev => prev.filter(d => d !== date));
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
 
  // 2. Update settings mutation
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        holidays: holidayDates,
      };
 
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
 
      if (!res.ok) throw new Error('Failed to save settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      alert('Settings updated successfully.');
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });
 
  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };
 
  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }
 
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 select-none animate-fadeIn">
      {/* Title Header with Save Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-3xl font-serif text-[#2B2620] font-semibold">Clinic Configurations</h3>
          <p className="text-xs text-[#2B2620]/50 mt-0.5 font-bold">
            Configure working hours, message reminders, and public widget visibilities.
          </p>
        </div>
 
        {isAdmin && (
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={mutation.isPending}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer focus:outline-hidden shadow-xs shrink-0"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 stroke-[1.75]" />
            )}
            Save Configurations
          </motion.button>
        )}
      </div>
 
      {!isAdmin && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex gap-3 text-sm text-orange-850 shadow-xxs">
          <ShieldAlert className="h-5 w-5 text-orange-600 shrink-0 stroke-[1.75]" />
          <div>
            <p className="font-bold">Access Restricted</p>
            <p className="text-xs mt-0.5 text-orange-700 font-semibold leading-relaxed">
              Only Dr. Rashmita (Admin role) can update the clinic profile, reminder templates and visibility settings.
            </p>
          </div>
        </div>
      )}
 
      {/* Bento-style 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Clinic Profile Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.015)] space-y-5">
            <h4 className="text-xl font-serif text-[#2B2620] pb-2 border-b border-[#EADFCA] flex items-center gap-2.5 font-bold">
              <div className="p-1.5 rounded-lg bg-[#FAF6EF] border border-[#EADFCA] text-primary">
                <Building className="h-4 w-4 stroke-[1.75]" />
              </div>
              Profile Details
            </h4>
 
            {/* Visibility Box */}
            <div className="p-4 border border-[#EADFCA] rounded-2xl bg-[#FAF6EF]/60 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h5 className="text-xs font-serif font-bold text-[#2B2620] flex items-center gap-1.5">
                  {settings?.isPubliclyVisible ? (
                    <>
                      <Eye className="h-4 w-4 text-emerald-600" />
                      Website Booking Widget: Active
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-rose-500" />
                      Website Booking Widget: Offline
                    </>
                  )}
                </h5>
                <p className="text-[10px] text-[#2B2620]/60 font-semibold leading-relaxed">
                  Toggle whether the practice appears on the public scheduling portal.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  {...register('isPubliclyVisible')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#FAF6EF] border border-[#EADFCA] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#2B2620]/25 peer-checked:after:bg-primary after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary/20" />
              </label>
            </div>
 
            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1.5">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    {...register('name')}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3.5 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden disabled:opacity-60 font-semibold shadow-xxs"
                  />
                  {errors.name?.message && <p className="text-xs text-red-500 mt-1">{errors.name.message as string}</p>}
                </div>
 
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1.5">
                    Primary Practitioner
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    {...register('primaryDoctor')}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3.5 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden disabled:opacity-60 font-semibold shadow-xxs"
                  />
                  {errors.primaryDoctor?.message && <p className="text-xs text-red-500 mt-1">{errors.primaryDoctor.message as string}</p>}
                </div>
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    disabled={!isAdmin}
                    {...register('email')}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3.5 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden disabled:opacity-60 font-semibold shadow-xxs"
                  />
                  {errors.email?.message && <p className="text-xs text-red-500 mt-1">{errors.email.message as string}</p>}
                </div>
 
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1.5">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    {...register('phone')}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3.5 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden disabled:opacity-60 font-semibold shadow-xxs"
                  />
                  {errors.phone?.message && <p className="text-xs text-red-500 mt-1">{errors.phone.message as string}</p>}
                </div>
              </div>
 
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1.5">
                  Clinic Address
                </label>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  {...register('address')}
                  className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] p-3.5 text-[#2B2620] focus:border-primary focus:outline-hidden disabled:opacity-60 font-semibold shadow-xxs leading-relaxed"
                />
                {errors.address?.message && <p className="text-xs text-red-500 mt-1">{errors.address.message as string}</p>}
              </div>
            </div>
          </div>
        </div>
 
        {/* Right Column: Scheduling & Reminders (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Working Hours Card */}
          <div className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.015)] space-y-5">
            <h4 className="text-xl font-serif text-[#2B2620] pb-2 border-b border-[#EADFCA] flex items-center gap-2.5 font-bold">
              <div className="p-1.5 rounded-lg bg-[#FAF6EF] border border-[#EADFCA] text-primary">
                <Clock className="h-4 w-4 stroke-[1.75]" />
              </div>
              Operational Hours
            </h4>
 
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1.5">
                    Opening Time
                  </label>
                  <input
                    type="text"
                    placeholder="HH:MM"
                    disabled={!isAdmin}
                    {...register('workingHoursStart')}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3.5 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden disabled:opacity-60 font-semibold shadow-xxs"
                  />
                  {errors.workingHoursStart?.message && <p className="text-xs text-red-500 mt-1">{errors.workingHoursStart.message as string}</p>}
                </div>
 
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1.5">
                    Closing Time
                  </label>
                  <input
                    type="text"
                    placeholder="HH:MM"
                    disabled={!isAdmin}
                    {...register('workingHoursEnd')}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3.5 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden disabled:opacity-60 font-semibold shadow-xxs"
                  />
                  {errors.workingHoursEnd?.message && <p className="text-xs text-red-500 mt-1">{errors.workingHoursEnd.message as string}</p>}
                </div>
              </div>
 
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1.5">
                  Slot Granularity
                </label>
                <select
                  disabled={!isAdmin}
                  {...register('slotDuration', { valueAsNumber: true })}
                  className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3.5 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden disabled:opacity-60 font-semibold shadow-xxs cursor-pointer"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
              </select>
              </div>
 
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1.5">
                  Holidays & Blocked Dates <span className="text-primary/60 lowercase normal-case">(Sundays are always closed)</span>
                </label>
                
                {/* Current holiday list */}
                {holidayDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {holidayDates.map(date => (
                      <span key={date} className="inline-flex items-center gap-1.5 bg-[#FAF6EF] border border-[#EADFCA] text-[#2B2620] text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        <CalendarX className="h-3 w-3 text-primary shrink-0" />
                        {formatDateDisplay(date)}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => removeHolidayDate(date)}
                            className="ml-0.5 text-[#2B2620]/40 hover:text-red-500 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Add new holiday date */}
                {isAdmin && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className="block flex-1 text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3.5 py-2.5 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold shadow-xxs cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={addHolidayDate}
                      disabled={!newHolidayDate}
                      className="px-3.5 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 focus:outline-hidden whitespace-nowrap"
                    >
                      + Add Date
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
 
          {/* Reminder Templates Card */}
          <div className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.015)] space-y-5">
            <h4 className="text-xl font-serif text-[#2B2620] pb-2 border-b border-[#EADFCA] flex items-center gap-2.5 font-bold">
              <div className="p-1.5 rounded-lg bg-[#FAF6EF] border border-[#EADFCA] text-primary">
                <MessageSquare className="h-4 w-4 stroke-[1.75]" />
              </div>
              WhatsApp Notifications
            </h4>
 
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1.5">
                  24-Hour Reminder Copy
                </label>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  {...register('reminder24hTemplate')}
                  className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] p-3 text-[#2B2620] focus:border-primary focus:outline-hidden disabled:opacity-60 font-semibold shadow-xxs leading-relaxed"
                  placeholder="Hi {patient}, this is a reminder for your session tomorrow at {time}."
                />
              </div>
 
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/65 mb-1.5">
                  2-Hour Reminder Copy
                </label>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  {...register('reminder2hTemplate')}
                  className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] p-3 text-[#2B2620] focus:border-primary focus:outline-hidden disabled:opacity-60 font-semibold shadow-xxs leading-relaxed"
                  placeholder="Hi {patient}, you have an appointment in 2 hours at {time}."
                />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </form>
  );
}
