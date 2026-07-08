'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Calendar, Clock, Plus, ChevronLeft, ChevronRight, 
  Search, Loader2, RotateCw, Sparkles, AlertCircle, RefreshCw, 
  Check, User as UserIcon, Link, PhoneCall, Trash2, CheckCircle, Bell, X, Edit3, Settings, FileText
} from 'lucide-react';
import QuickActionModal from './QuickActionModal';
import AddAppointmentModal from './AddAppointmentModal';
import SegmentedControl from './SegmentedControl';
import { AppointmentStatus, AppointmentSource } from '@prisma/client';

interface OPDDashboardProps {
  onManageAppointment?: (id: string) => void;
}

export default function OPDDashboard({ onManageAppointment }: OPDDashboardProps = {}) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeSegment, setSelectedTimeSegment] = useState<'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING'>('ALL');
  
  // UI Panels / Modal States
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAdjustTimingsOpen, setIsAdjustTimingsOpen] = useState(false);

  // New bookings markers ("NEW" badge tracking)
  const [boardOpenedTime, setBoardOpenedTime] = useState(() => Date.now());
  const [isRefreshSpinning, setIsRefreshSpinning] = useState(false);

  // Quick settings forms fields
  const [startTimeInput, setStartTimeInput] = useState('09:00');
  const [endTimeInput, setEndTimeInput] = useState('18:00');
  const [durationInput, setDurationInput] = useState(30);

  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    },
  });

  useEffect(() => {
    if (settings) {
      setStartTimeInput(settings.workingHoursStart);
      setEndTimeInput(settings.workingHoursEnd);
      setDurationInput(settings.slotDuration);
    }
  }, [settings]);

  // Adjust timing quick mutation
  const adjustTimingMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          workingHoursStart: payload.startTime,
          workingHoursEnd: payload.endTime,
          slotDuration: Number(payload.slotDuration),
        }),
      });
      if (!res.ok) throw new Error('Failed to update timings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsAdjustTimingsOpen(false);
    },
  });

  // Fetch appointments for selected date
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?date=${selectedDate}`);
      if (!res.ok) throw new Error('Failed to fetch appointments');
      return res.json();
    },
  });

  // Fetch Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (res.ok) return res.json();
      return [];
    },
    refetchInterval: 8000, // Auto-poll notifications every 8 seconds for real-time sync
  });

  // Safe fallback arrays to prevent type crashes
  const appointmentsList = Array.isArray(appointments) ? appointments : [];
  const notificationsList = Array.isArray(notifications) ? notifications : [];

  // Notification action mutations
  const dismissNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isRead: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const dismissAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissAll: true }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Fetch treatment modalities
  const { data: modalities = [] } = useQuery({
    queryKey: ['modalities'],
    queryFn: async () => {
      const res = await fetch('/api/modalities');
      if (!res.ok) throw new Error('Failed to fetch modalities');
      return res.json();
    },
  });

  const modalitiesList = Array.isArray(modalities) ? modalities : [];

  // Manual Force-Refresh Handler
  const handleForceRefresh = async () => {
    setIsRefreshSpinning(true);
    setBoardOpenedTime(Date.now());
    await refetch();
    setTimeout(() => {
      setIsRefreshSpinning(false);
    }, 850);
  };

  // Date Navigation Helpers
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Stats Calculations
  const totalCount = appointmentsList.length;
  const waitingCount = appointmentsList.filter((a: any) => a.status === AppointmentStatus.WAITING).length;
  const doneCount = appointmentsList.filter((a: any) => a.status === AppointmentStatus.COMPLETED).length;

  const waitTimes = appointmentsList
    .filter((a: any) => a.checkInTime && a.seenTime)
    .map((a: any) => {
      const checkIn = new Date(a.checkInTime).getTime();
      const seen = new Date(a.seenTime).getTime();
      return (seen - checkIn) / (1000 * 60); // minutes
    });

  const avgWaitTime = waitTimes.length > 0 
    ? Math.round(waitTimes.reduce((acc: number, val: number) => acc + val, 0) / waitTimes.length) 
    : 0;

  // Filters: Search and Time Segments
  const filteredAppointments = appointmentsList.filter((app: any) => {
    const matchesSearch = app.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.patient.phone.includes(searchQuery);

    if (!matchesSearch) return false;
    if (selectedTimeSegment === 'ALL') return true;

    const [hours] = app.startTime.split(':').map(Number);
    if (selectedTimeSegment === 'MORNING') return hours >= 9 && hours < 12;
    if (selectedTimeSegment === 'AFTERNOON') return hours >= 12 && hours < 15;
    if (selectedTimeSegment === 'EVENING') return hours >= 15 && hours < 18;
    return true;
  });

  // Helper to color-code status pills nicely
  const getStatusStyle = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.COMPLETED:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case AppointmentStatus.IN_PROGRESS:
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      case AppointmentStatus.WAITING:
        return 'bg-orange-50 text-orange-700 border-orange-200/60';
      case AppointmentStatus.SCHEDULED:
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case AppointmentStatus.NO_SHOW:
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
      case AppointmentStatus.CANCELLED:
        return 'bg-gray-50 text-gray-500 border-gray-200/60';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200/60';
    }
  };

  const getSourceIcon = (source: AppointmentSource) => {
    switch (source) {
      case AppointmentSource.WEBSITE:
        return (
          <span title="Website Booking">
            <Link className="h-3.5 w-3.5 text-blue-600 stroke-[1.75]" />
          </span>
        );
      case AppointmentSource.PHONE_AI_AGENT:
        return (
          <span title="AI Voice Agent">
            <PhoneCall className="h-3.5 w-3.5 text-emerald-600 stroke-[1.75]" />
          </span>
        );
      default:
        return (
          <span title="Manual Booking">
            <UserIcon className="h-3.5 w-3.5 text-gray-500 stroke-[1.75]" />
          </span>
        );
    }
  };

  const unreadNotifications = notificationsList.filter((n: any) => !n.isRead);

  const timeSegmentOptions = [
    { label: 'All', value: 'ALL' },
    { label: 'Morning', value: 'MORNING' },
    { label: 'Afternoon', value: 'AFTERNOON' },
    { label: 'Evening', value: 'EVENING' },
  ];

  // Daily Summary Strip Stats
  const stats = [
    { 
      label: 'Total Appointments', 
      value: totalCount, 
      desc: 'Registered today',
      icon: Calendar,
      color: 'text-primary bg-primary/10 border-primary/20',
      borderLeft: 'border-l-4 border-l-primary'
    },
    { 
      label: 'Currently Waiting', 
      value: waitingCount, 
      desc: 'Patients in lounge',
      icon: Clock,
      color: 'text-[#D98353] bg-[#D98353]/10 border-[#D98353]/20',
      borderLeft: 'border-l-4 border-l-[#D98353]'
    },
    { 
      label: 'Completed Sessions', 
      value: doneCount, 
      desc: 'Sessions finished',
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      borderLeft: 'border-l-4 border-l-emerald-500'
    },
    { 
      label: 'Avg Waiting Time', 
      value: `${avgWaitTime}m`, 
      desc: waitTimes.length > 0 ? 'Based on live check-ins' : 'No records yet',
      icon: Activity,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      borderLeft: 'border-l-4 border-l-blue-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Daily Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.05 }}
              className={`bg-[#FFFCF6] p-5 rounded-2xl shadow-[0_4px_20px_rgba(42,38,32,0.015)] border border-[#EADFCA]/50 ${stat.borderLeft} flex items-center justify-between hover:shadow-[0_8px_25px_rgba(42,38,32,0.03)] hover:-translate-y-0.5 transition-all duration-300`}
            >
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/45">{stat.label}</p>
                <p className="text-3xl font-serif text-[#2B2620] font-bold tracking-tight leading-none pt-0.5">{stat.value}</p>
                <p className="text-[10px] text-[#2B2620]/50 font-medium pt-1">{stat.desc}</p>
              </div>
              <div className={`p-2.5 rounded-xl border ${stat.color} shrink-0 shadow-xxs`}>
                <Icon className="h-5 w-5 stroke-[1.75]" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 2. Control Panel & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-[#FFFCF6] p-4 rounded-2xl shadow-[0_8px_30px_rgba(42,38,32,0.02)] border border-[#EADFCA]/45">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => shiftDate(-1)} 
            className="p-2.5 rounded-xl hover:bg-[#FAF6EF] border border-[#EADFCA] text-[#2B2620]/70 hover:text-primary transition-all cursor-pointer focus:outline-hidden"
          >
            <ChevronLeft className="h-4 w-4 stroke-[2]" />
          </motion.button>

          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#FAF6EF]/65 border border-[#EADFCA] rounded-xl hover:border-primary/30 transition-all duration-200 shadow-xxs">
            <Calendar className="h-4 w-4 text-primary stroke-[2]" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-[#2B2620] bg-transparent focus:outline-hidden cursor-pointer"
            />
          </div>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => shiftDate(1)} 
            className="p-2.5 rounded-xl hover:bg-[#FAF6EF] border border-[#EADFCA] text-[#2B2620]/70 hover:text-primary transition-all cursor-pointer focus:outline-hidden"
          >
            <ChevronRight className="h-4 w-4 stroke-[2]" />
          </motion.button>

          {/* Adjust timings quick toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdjustTimingsOpen(true)}
            className="p-2.5 rounded-xl hover:bg-[#FAF6EF] border border-[#EADFCA] text-[#2B2620]/70 hover:text-primary transition-all cursor-pointer focus:outline-hidden flex items-center gap-1.5 text-xs font-semibold shadow-xxs"
            title="Adjust Hours"
          >
            <Settings className="h-4 w-4 stroke-[1.75]" />
            <span className="hidden sm:inline">Adjust Hours</span>
          </motion.button>
        </div>

        {/* Search bar & Refresh triggers */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2B2620]/45 stroke-[2]" />
            <input 
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4.5 py-2.5 w-full md:w-56 text-xs bg-[#FAF6EF]/65 border border-[#EADFCA] rounded-xl hover:border-primary/30 focus:bg-white focus:border-primary focus:outline-hidden text-[#2B2620] placeholder-[#2B2620]/45 font-semibold transition-all duration-200 shadow-xxs"
            />
          </div>

          {/* Force manual refresh */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleForceRefresh}
            className="p-2.5 rounded-xl bg-[#FAF6EF] hover:bg-[#FAF6EF]/80 border border-[#EADFCA]/70 text-primary cursor-pointer focus:outline-hidden shadow-xxs"
          >
            <motion.div animate={{ rotate: isRefreshSpinning ? 360 : 0 }} transition={{ duration: 0.8, ease: 'easeInOut' }}>
              <RotateCw className="h-4 w-4 stroke-[2]" />
            </motion.div>
          </motion.button>

          {/* Notification bell */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsNotificationOpen(true)}
            className="p-2.5 rounded-xl bg-[#FAF6EF] hover:bg-[#FAF6EF]/80 border border-[#EADFCA]/70 text-primary relative cursor-pointer focus:outline-hidden shadow-xxs"
          >
            <Bell className="h-4 w-4 stroke-[2]" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D98353] text-[8px] font-bold text-white shadow-xxs animate-bounce">
                {unreadNotifications.length}
              </span>
            )}
          </motion.button>

          {/* Book Patient */}
          <motion.button 
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-[#3C5040] text-background text-xs font-semibold px-4.5 py-2.5 rounded-xl transition-all cursor-pointer focus:outline-hidden shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[2]" />
            Book Patient
          </motion.button>
        </div>
      </div>

      {/* 3. Time segments control */}
      <div className="flex justify-start">
        <SegmentedControl
          options={timeSegmentOptions}
          activeValue={selectedTimeSegment}
          onChange={(val) => setSelectedTimeSegment(val as any)}
        />
      </div>

      {/* 4. Appointments Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20 bg-[#FFFCF6] border border-[#EADFCA]/50 rounded-2xl">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#FFFCF6] border border-dashed border-[#EADFCA] rounded-2xl p-6">
          <Calendar className="h-10 w-10 text-[#2B2620]/30 stroke-[1.25] mb-2 animate-bounce" />
          <p className="text-sm font-semibold text-foreground/60">No sessions scheduled.</p>
          <p className="text-xxs text-[#2B2620]/45 mt-0.5 font-bold">Try adjusting filters or record a new appointment.</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {[...filteredAppointments]
              .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
              .map((app: any) => {
                const initials = app.patient.fullName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              const statusConfig: Record<string, { gradient: string; border: string; initialsBg: string }> = {
                [AppointmentStatus.COMPLETED]: {
                  gradient: 'from-emerald-500 to-teal-400',
                  border: 'border-emerald-500/10 hover:border-emerald-500/35',
                  initialsBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                },
                [AppointmentStatus.IN_PROGRESS]: {
                  gradient: 'from-amber-500 to-orange-400',
                  border: 'border-amber-500/15 hover:border-amber-500/40',
                  initialsBg: 'bg-amber-50 text-amber-700 border-amber-200/50'
                },
                [AppointmentStatus.WAITING]: {
                  gradient: 'from-orange-500 to-red-400',
                  border: 'border-orange-500/10 hover:border-orange-500/35',
                  initialsBg: 'bg-orange-50 text-orange-700 border-orange-200/50'
                },
                [AppointmentStatus.SCHEDULED]: {
                  gradient: 'from-blue-500 to-indigo-400',
                  border: 'border-blue-500/10 hover:border-blue-500/35',
                  initialsBg: 'bg-blue-50 text-blue-700 border-blue-200/50'
                },
                [AppointmentStatus.NO_SHOW]: {
                  gradient: 'from-rose-500 to-pink-400',
                  border: 'border-rose-500/10 hover:border-rose-500/35',
                  initialsBg: 'bg-rose-50 text-rose-700 border-rose-200/50'
                },
                [AppointmentStatus.CANCELLED]: {
                  gradient: 'from-gray-400 to-slate-300',
                  border: 'border-gray-500/10 hover:border-gray-500/35',
                  initialsBg: 'bg-gray-100 text-gray-600 border-gray-300/50'
                }
              };

              const config = statusConfig[app.status] || {
                gradient: 'from-primary to-[#EADFCA]',
                border: 'border-[#EADFCA]/60 hover:border-primary/30',
                initialsBg: 'bg-primary/10 text-primary border-primary/20'
              };

              return (
                <motion.div
                  layout
                  key={app.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                  className={`bg-[#FFFCF6] hover:bg-white border ${config.border} rounded-2xl shadow-[0_4px_25px_rgba(42,38,32,0.012)] hover:shadow-[0_16px_35px_rgba(42,38,32,0.04)] flex flex-col justify-between group transition-all duration-300 relative overflow-hidden hover:-translate-y-0.5`}
                >
                  {/* Visual Accent Top Bar Gradient */}
                  <div className={`h-1.5 w-full bg-linear-to-r ${config.gradient}`} />

                  {/* Pulsing NEW Badge */}
                  {new Date(app.createdAt).getTime() > boardOpenedTime && (
                    <span className="absolute top-3.5 right-3.5 flex h-5 px-2 items-center justify-center rounded-full bg-[#D98353] text-[8px] font-bold uppercase tracking-wider text-white shadow-xxs animate-pulse z-10">
                      New
                    </span>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3.5">
                      {/* Time Header with soft background block */}
                      <div className="flex justify-between items-center pb-2.5 border-b border-[#EADFCA]/30">
                        <div className="flex items-center gap-1.5 text-xs text-[#2B2620]/80 font-bold bg-[#FAF6EF] px-2.5 py-1 rounded-lg">
                          <Clock className="h-3.5 w-3.5 text-primary stroke-[2]" />
                          <span>{app.startTime} - {app.endTime}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Session-Pack warning badges */}
                          {(() => {
                            const pkgs = app.patient.sessionPackages;
                            if (!pkgs || pkgs.length === 0) return null;
                            const activePkg = pkgs[0];
                            const remaining = activePkg.totalSessions - activePkg.sessionsUsed;
                            if (remaining <= 2 && remaining > 0) {
                              return (
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100/60 rounded-full">
                                  {remaining} Left
                                </span>
                              );
                            }
                            if (remaining <= 0) {
                              return (
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-red-50 text-red-600 border border-red-100/60 rounded-full animate-pulse">
                                  Exhausted
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>

                      {/* Patient Name & Source indicator */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center font-serif text-[10px] font-bold uppercase shrink-0 shadow-xxs border ${config.initialsBg}`}>
                              {initials}
                            </div>
                            <h4 className="text-base font-serif font-bold text-[#2B2620] tracking-wide group-hover:text-primary transition-colors truncate">
                              {app.patient.fullName}
                            </h4>
                          </div>
                          <div className="p-1 bg-[#FAF6EF] rounded-lg border border-[#EADFCA]/40 group-hover:border-primary/20 transition-all shrink-0">
                            {getSourceIcon(app.source)}
                          </div>
                        </div>
                        
                        {/* Demographics details row */}
                        <div className="flex items-center gap-1.5 pl-9 text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/45">
                          <span>{app.patient.gender}</span>
                          <span className="text-[#EADFCA] font-light">•</span>
                          <span>{new Date().getFullYear() - new Date(app.patient.dateOfBirth).getFullYear()} Years</span>
                        </div>
                      </div>

                      {/* Treatment type segment */}
                      <div className="bg-[#FAF6EF]/60 border border-[#EADFCA]/30 px-3.5 py-2.5 rounded-xl ml-9 shadow-inner">
                        <span className="text-[9px] font-bold text-[#2B2620]/40 uppercase tracking-widest block mb-0.5">Assigned Treatment</span>
                        <span className="text-xs font-serif font-bold text-primary block leading-tight">{app.treatmentType}</span>
                      </div>

                      {/* Pills container */}
                      <div className="flex flex-wrap gap-1.5 pl-9 pt-0.5">
                        {app.notes && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md">
                            <FileText className="h-3 w-3 stroke-[2]" />
                            SOAP Attached
                          </span>
                        )}
                        {app.assignedExercises && app.assignedExercises.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-[#FAF6EF] text-[#D98353] border border-[#D98353]/20 rounded-md">
                            <Activity className="h-3 w-3 stroke-[2]" />
                            {app.assignedExercises.length} Home Ex
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Controls with Status Indicators */}
                    <div className="pt-3 border-t border-[#EADFCA]/40 flex items-center justify-between">
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(app.status)}`}>
                        {app.status === AppointmentStatus.COMPLETED && <CheckCircle className="h-3.5 w-3.5 shrink-0" />}
                        {app.status === AppointmentStatus.IN_PROGRESS && <Activity className="h-3.5 w-3.5 shrink-0 animate-pulse" />}
                        {app.status === AppointmentStatus.WAITING && <Clock className="h-3.5 w-3.5 shrink-0" />}
                        {app.status === AppointmentStatus.SCHEDULED && <Calendar className="h-3.5 w-3.5 shrink-0" />}
                        {app.status === AppointmentStatus.NO_SHOW && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                        {app.status === AppointmentStatus.CANCELLED && <X className="h-3.5 w-3.5 shrink-0" />}
                        <span>{app.status}</span>
                      </div>

                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (onManageAppointment) {
                            onManageAppointment(app.id);
                          } else {
                            setActiveAppointmentId(app.id);
                          }
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-primary hover:text-white hover:bg-primary border border-primary/20 px-3.5 py-1.5 rounded-xl shadow-xxs transition-all cursor-pointer focus:outline-hidden"
                      >
                        Manage
                        <ChevronRight className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 5. Dynamic SOAP and checked-in Action sheet drawer overlay */}
      <AnimatePresence>
        {activeAppointmentId && (
          <QuickActionModal 
            appointmentId={activeAppointmentId} 
            onClose={() => setActiveAppointmentId(null)}
            modalities={modalitiesList}
          />
        )}
      </AnimatePresence>

      {/* Add Appointment Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddAppointmentModal 
            onClose={() => setIsAddModalOpen(false)}
            modalities={modalitiesList}
          />
        )}
      </AnimatePresence>

      {/* Notification Center sliding drawer */}
      <AnimatePresence>
        {isNotificationOpen && (
          <div className="fixed inset-0 z-50 flex justify-end select-none">
            <div className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md" onClick={() => setIsNotificationOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-full max-w-md bg-[#FFFCF6] border-l border-[#EADFCA] h-full flex flex-col p-6 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center border-b border-[#EADFCA] pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#2B2620]">Practice Notifications</h3>
                  <p className="text-xxs text-foreground/45 font-bold uppercase tracking-wider mt-0.5">Clinic activity logs</p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadNotifications.length > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => dismissAllNotificationsMutation.mutate()}
                      className="text-[10px] font-bold tracking-wider uppercase text-primary border border-primary/20 px-2 py-1.5 rounded-lg hover:bg-primary/10 cursor-pointer"
                    >
                      Clear All
                    </motion.button>
                  )}
                  <button onClick={() => setIsNotificationOpen(false)} className="p-1 rounded-full hover:bg-[#FAF6EF] text-[#2B2620]/50 hover:text-[#2B2620] cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {notificationsList.length === 0 ? (
                  <p className="text-xs text-foreground/45 italic text-center py-20 font-semibold">No recent alerts recorded.</p>
                ) : (
                  notificationsList.map((n: any) => (
                    <div key={n.id} className={`p-4 rounded-2xl border flex justify-between items-start gap-3 transition-colors ${
                      n.isRead ? 'bg-[#FAF6EF]/40 border-[#EADFCA]/40 opacity-70' : 'bg-[#FAF6EF] border-[#EADFCA]'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            n.type === 'BOOKING' ? 'bg-blue-500' : n.type === 'CANCELLATION' ? 'bg-rose-500' : 'bg-orange-500'
                          }`} />
                          <h4 className="text-xs font-bold text-[#2B2620]">{n.title}</h4>
                        </div>
                        <p className="text-xxs text-[#2B2620]/70 font-semibold leading-relaxed">{n.message}</p>
                        <p className="text-[9px] text-foreground/40 font-bold">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {!n.isRead && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => dismissNotificationMutation.mutate(n.id)}
                          className="p-1 text-primary hover:bg-[#FFFCF6] border border-[#EADFCA] rounded-lg cursor-pointer"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </motion.button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adjust Timings Modal */}
      <AnimatePresence>
        {isAdjustTimingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md" onClick={() => setIsAdjustTimingsOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#FFFCF6] border border-[#EADFCA] rounded-3xl shadow-xl flex flex-col p-6 space-y-4 z-10 select-none"
            >
              <div>
                <h3 className="text-lg font-serif font-bold text-[#2B2620]">Adjust Daily Hours</h3>
                <p className="text-xxs text-[#2B2620]/50 font-bold uppercase">Quick configure boundaries</p>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div>
                  <label className="block text-xxs uppercase tracking-wider text-[#2B2620]/60 mb-1">Opening Hour (HH:MM)</label>
                  <input 
                    type="text" 
                    value={startTimeInput} 
                    onChange={(e) => setStartTimeInput(e.target.value)} 
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xxs uppercase tracking-wider text-[#2B2620]/60 mb-1">Closing Hour (HH:MM)</label>
                  <input 
                    type="text" 
                    value={endTimeInput} 
                    onChange={(e) => setEndTimeInput(e.target.value)} 
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xxs uppercase tracking-wider text-[#2B2620]/60 mb-1">Slot Duration (Minutes)</label>
                  <input 
                    type="number" 
                    value={durationInput} 
                    onChange={(e) => setDurationInput(Number(e.target.value))} 
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EADFCA]/60">
                <button 
                  onClick={() => setIsAdjustTimingsOpen(false)}
                  className="px-4 py-2 border border-[#EADFCA] hover:bg-[#FAF6EF] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => adjustTimingMutation.mutate({ startTime: startTimeInput, endTime: endTimeInput, slotDuration: durationInput })}
                  className="px-4 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  {adjustTimingMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Settings
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
