'use client';
 
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Save, Loader2, ShieldAlert, Eye, EyeOff, Building, Clock, MessageSquare, X, CalendarX, Palette, Check } from 'lucide-react';
import GlassPanel from './GlassPanel';
 
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

const themesList = [
  {
    id: 'aurora',
    name: 'Aurora Triage',
    desc: 'Signature Teal, Violet & Magenta',
    gradient: 'from-[#12D6C4] via-[#7B5CFF] to-[#E23FA6]',
    colors: ['#12D6C4', '#7B5CFF', '#E23FA6'],
  },
  {
    id: 'violet',
    name: 'Cyber Violet',
    desc: 'Vivid Purple, Lavender & Pink',
    gradient: 'from-[#A855F7] via-[#7C3AED] to-[#EC4899]',
    colors: ['#A855F7', '#7C3AED', '#EC4899'],
  },
  {
    id: 'emerald',
    name: 'Emerald Mint',
    desc: 'Deep Emerald, Cyan & Mint',
    gradient: 'from-[#10B981] via-[#06B6D4] to-[#34D399]',
    colors: ['#10B981', '#06B6D4', '#34D399'],
  },
  {
    id: 'sunset',
    name: 'Sunset Flare',
    desc: 'Coral Rose, Warm Orange & Gold',
    gradient: 'from-[#FF5D7A] via-[#FF8C42] to-[#FFB454]',
    colors: ['#FF5D7A', '#FF8C42', '#FFB454'],
  },
  {
    id: 'sapphire',
    name: 'Electric Sapphire',
    desc: 'Royal Blue, Cyan & Neon Purple',
    gradient: 'from-[#3B82F6] via-[#06B6D4] to-[#8B5CF6]',
    colors: ['#3B82F6', '#06B6D4', '#8B5CF6'],
  },
];
 
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
  const [activeTheme, setActiveTheme] = useState<string>('aurora');

  useEffect(() => {
    const saved = localStorage.getItem('h360_theme') || 'aurora';
    setActiveTheme(saved);
  }, []);

  const handleSelectTheme = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem('h360_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };
 
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
        <Loader2 className="h-8 w-8 text-[#12D6C4] animate-spin" />
      </div>
    );
  }
 
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 select-none animate-fadeIn">
      {/* Title Header with Save Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-3xl font-serif text-[#F5F3FA] font-bold">Clinic Configurations</h3>
          <p className="text-xs text-[rgba(245,243,250,0.62)] mt-0.5 font-medium">
            Configure working hours, color theme palette, message reminders, and public widget visibilities.
          </p>
        </div>
 
        {isAdmin && (
          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-[#0FBDAE] text-[#06231D] text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer focus:outline-hidden shadow-[0_0_20px_rgba(18,214,196,0.3)] border-0 shrink-0"
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
        <div className="p-4 bg-[rgba(255,180,84,0.12)] border border-[rgba(255,180,84,0.3)] rounded-2xl flex gap-3 text-sm text-[#FFB454]">
          <ShieldAlert className="h-5 w-5 text-[#FFB454] shrink-0 stroke-[1.75]" />
          <div>
            <p className="font-bold">Access Restricted</p>
            <p className="text-xs mt-0.5 text-[rgba(245,243,250,0.7)] font-medium leading-relaxed">
              Only Dr. Rashmita (Admin role) can update the clinic profile, reminder templates and visibility settings.
            </p>
          </div>
        </div>
      )}
 
      {/* Bento-style 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Clinic Profile & Theme Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Theme Selector Card */}
          <GlassPanel className="p-6 space-y-5">
            <h4 className="text-xl font-serif text-[#F5F3FA] pb-3 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between font-bold">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-primary border border-[rgba(255,255,255,0.08)]">
                  <Palette className="h-4 w-4 stroke-[1.75]" />
                </div>
                <span>Theme Palette Selector</span>
              </div>
              <span className="eyebrow text-[9px] text-[rgba(245,243,250,0.4)]">Live Accent Switching</span>
            </h4>

            <p className="text-xs text-[rgba(245,243,250,0.6)] font-medium leading-relaxed">
              Choose your preferred color theme. The layout, glassmorphism, and gradient structure remain identical while the accent spectrum transforms app-wide.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themesList.map((t) => {
                const isSelected = activeTheme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTheme(t.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-3 group ${
                      isSelected
                        ? 'bg-[rgba(255,255,255,0.06)] border-primary shadow-[0_0_25px_rgba(18,214,196,0.15)]'
                        : 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.04)]'
                    }`}
                  >
                    {/* Top gradient preview line */}
                    <div className={`h-1 w-full bg-gradient-to-r ${t.gradient} rounded-full`} />

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="text-xs font-serif font-bold text-[#F5F3FA] group-hover:text-primary transition-colors">
                          {t.name}
                        </h5>
                        <p className="text-[10px] text-[rgba(245,243,250,0.5)] font-medium mt-0.5 leading-snug">
                          {t.desc}
                        </p>
                      </div>

                      {isSelected && (
                        <span className="h-5 w-5 rounded-full bg-primary text-[#06231D] flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {t.colors.map((c, idx) => (
                        <span
                          key={idx}
                          className="h-3 w-3 rounded-full border border-[rgba(255,255,255,0.2)] shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          {/* Profile Details Card */}
          <GlassPanel className="p-6 space-y-5">
            <h4 className="text-xl font-serif text-[#F5F3FA] pb-3 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-2.5 font-bold">
              <div className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-primary border border-[rgba(255,255,255,0.08)]">
                <Building className="h-4 w-4 stroke-[1.75]" />
              </div>
              Profile Details
            </h4>
 
            {/* Visibility Box */}
            <div className="p-4 border border-[rgba(255,255,255,0.08)] rounded-2xl bg-[rgba(255,255,255,0.02)] flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h5 className="text-xs font-serif font-bold text-[#F5F3FA] flex items-center gap-1.5">
                  {settings?.isPubliclyVisible ? (
                    <>
                      <Eye className="h-4 w-4 text-[#19E3B1]" />
                      Website Booking Widget: Active
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-[#FF5D7A]" />
                      Website Booking Widget: Offline
                    </>
                  )}
                </h5>
                <p className="text-[10px] text-[rgba(245,243,250,0.6)] font-medium leading-relaxed">
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
                <div className="w-11 h-6 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[rgba(245,243,250,0.4)] peer-checked:after:bg-primary after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[rgba(18,214,196,0.2)]" />
              </label>
            </div>
 
            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow text-[9px] block mb-1.5">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    {...register('name')}
                    className="block w-full text-xs glass-input p-2.5 font-medium"
                  />
                  {errors.name?.message && <p className="text-xs text-[#FF5D7A] mt-1">{errors.name.message as string}</p>}
                </div>
 
                <div>
                  <label className="eyebrow text-[9px] block mb-1.5">
                    Primary Practitioner
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    {...register('primaryDoctor')}
                    className="block w-full text-xs glass-input p-2.5 font-medium"
                  />
                  {errors.primaryDoctor?.message && <p className="text-xs text-[#FF5D7A] mt-1">{errors.primaryDoctor.message as string}</p>}
                </div>
              </div>
 
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow text-[9px] block mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    disabled={!isAdmin}
                    {...register('email')}
                    className="block w-full text-xs glass-input p-2.5 font-medium"
                  />
                  {errors.email?.message && <p className="text-xs text-[#FF5D7A] mt-1">{errors.email.message as string}</p>}
                </div>
 
                <div>
                  <label className="eyebrow text-[9px] block mb-1.5">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    {...register('phone')}
                    className="block w-full text-xs glass-input p-2.5 font-medium num-tabular"
                  />
                  {errors.phone?.message && <p className="text-xs text-[#FF5D7A] mt-1">{errors.phone.message as string}</p>}
                </div>
              </div>
 
              <div>
                <label className="eyebrow text-[9px] block mb-1.5">
                  Clinic Address
                </label>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  {...register('address')}
                  className="block w-full text-xs glass-input p-2.5 font-medium leading-relaxed"
                />
                {errors.address?.message && <p className="text-xs text-[#FF5D7A] mt-1">{errors.address.message as string}</p>}
              </div>
            </div>
          </GlassPanel>
        </div>
 
        {/* Right Column: Scheduling & Reminders (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Working Hours Card */}
          <GlassPanel className="p-6 space-y-5">
            <h4 className="text-xl font-serif text-[#F5F3FA] pb-3 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-2.5 font-bold">
              <div className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-primary border border-[rgba(255,255,255,0.08)]">
                <Clock className="h-4 w-4 stroke-[1.75]" />
              </div>
              Operational Hours
            </h4>
 
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="eyebrow text-[9px] block mb-1.5">
                    Opening Time
                  </label>
                  <input
                    type="text"
                    placeholder="HH:MM"
                    disabled={!isAdmin}
                    {...register('workingHoursStart')}
                    className="block w-full text-xs glass-input p-2.5 font-medium num-tabular"
                  />
                  {errors.workingHoursStart?.message && <p className="text-xs text-[#FF5D7A] mt-1">{errors.workingHoursStart.message as string}</p>}
                </div>
 
                <div>
                  <label className="eyebrow text-[9px] block mb-1.5">
                    Closing Time
                  </label>
                  <input
                    type="text"
                    placeholder="HH:MM"
                    disabled={!isAdmin}
                    {...register('workingHoursEnd')}
                    className="block w-full text-xs glass-input p-2.5 font-medium num-tabular"
                  />
                  {errors.workingHoursEnd?.message && <p className="text-xs text-[#FF5D7A] mt-1">{errors.workingHoursEnd.message as string}</p>}
                </div>
              </div>
 
              <div>
                <label className="eyebrow text-[9px] block mb-1.5">
                  Slot Granularity
                </label>
                <select
                  disabled={!isAdmin}
                  {...register('slotDuration', { valueAsNumber: true })}
                  className="block w-full text-xs glass-input p-2.5 font-bold bg-[#120D1F] text-[#F5F3FA] cursor-pointer"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
 
              <div>
                <label className="eyebrow text-[9px] block mb-1.5">
                  Holidays & Blocked Dates <span className="text-[rgba(18,214,196,0.7)] lowercase normal-case">(Sundays are always closed)</span>
                </label>
                
                {/* Current holiday list */}
                {holidayDates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {holidayDates.map(date => (
                      <span key={date} className="inline-flex items-center gap-1.5 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#F5F3FA] text-[10px] font-medium px-2.5 py-1 rounded-lg">
                        <CalendarX className="h-3 w-3 text-primary shrink-0" />
                        {formatDateDisplay(date)}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => removeHolidayDate(date)}
                            className="ml-0.5 text-[rgba(245,243,250,0.4)] hover:text-[#FF5D7A] cursor-pointer"
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
                      className="block flex-1 text-xs glass-input p-2.5 font-medium cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={addHolidayDate}
                      disabled={!newHolidayDate}
                      className="px-3.5 py-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-primary text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 focus:outline-hidden whitespace-nowrap"
                    >
                      + Add Date
                    </button>
                  </div>
                )}
              </div>
            </div>
          </GlassPanel>
 
          {/* Reminder Templates Card */}
          <GlassPanel className="p-6 space-y-5">
            <h4 className="text-xl font-serif text-[#F5F3FA] pb-3 border-b border-[rgba(255,255,255,0.08)] flex items-center gap-2.5 font-bold">
              <div className="p-1.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-primary border border-[rgba(255,255,255,0.08)]">
                <MessageSquare className="h-4 w-4 stroke-[1.75]" />
              </div>
              WhatsApp Notifications
            </h4>
 
            <div className="space-y-4">
              <div>
                <label className="eyebrow text-[9px] block mb-1.5">
                  24-Hour Reminder Copy
                </label>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  {...register('reminder24hTemplate')}
                  className="block w-full text-xs glass-input p-2.5 font-medium leading-relaxed"
                  placeholder="Hi {patient}, this is a reminder for your session tomorrow at {time}."
                />
              </div>
 
              <div>
                <label className="eyebrow text-[9px] block mb-1.5">
                  2-Hour Reminder Copy
                </label>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  {...register('reminder2hTemplate')}
                  className="block w-full text-xs glass-input p-2.5 font-medium leading-relaxed"
                  placeholder="Hi {patient}, you have an appointment in 2 hours at {time}."
                />
              </div>
            </div>
          </GlassPanel>
          
        </div>
      </div>
    </form>
  );
}
