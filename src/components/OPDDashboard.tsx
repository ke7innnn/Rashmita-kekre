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
import GlassPanel from './GlassPanel';

const AppointmentStatus = {
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SCHEDULED: 'SCHEDULED',
  NO_SHOW: 'NO_SHOW',
  CANCELLED: 'CANCELLED',
} as const;
type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

const AppointmentSource = {
  MANUAL: 'MANUAL',
  MANUAL_ADMIN: 'MANUAL_ADMIN',
  WEBSITE: 'WEBSITE',
  PHONE_AI_AGENT: 'PHONE_AI_AGENT',
} as const;
type AppointmentSource = typeof AppointmentSource[keyof typeof AppointmentSource];

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

  // New bookings markers
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
    refetchInterval: 8000,
  });

  const appointmentsList = Array.isArray(appointments) ? appointments : [];
  const notificationsList = Array.isArray(notifications) ? notifications : [];

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

  const { data: modalities = [] } = useQuery({
    queryKey: ['modalities'],
    queryFn: async () => {
      const res = await fetch('/api/modalities');
      if (!res.ok) throw new Error('Failed to fetch modalities');
      return res.json();
    },
  });

  const modalitiesList = Array.isArray(modalities) ? modalities : [];

  const handleForceRefresh = async () => {
    setIsRefreshSpinning(true);
    setBoardOpenedTime(Date.now());
    await refetch();
    setTimeout(() => {
      setIsRefreshSpinning(false);
    }, 850);
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const totalCount = appointmentsList.length;
  const waitingCount = appointmentsList.filter((a: any) => a.status === AppointmentStatus.WAITING).length;
  const doneCount = appointmentsList.filter((a: any) => a.status === AppointmentStatus.COMPLETED).length;

  const waitTimes = appointmentsList
    .filter((a: any) => a.checkInTime && a.seenTime)
    .map((a: any) => {
      const checkIn = new Date(a.checkInTime).getTime();
      const seen = new Date(a.seenTime).getTime();
      return (seen - checkIn) / (1000 * 60);
    });

  const avgWaitTime = waitTimes.length > 0 
    ? Math.round(waitTimes.reduce((acc: number, val: number) => acc + val, 0) / waitTimes.length) 
    : 0;

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

  const getStatusStyle = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.COMPLETED:
        return 'bg-[rgba(25,227,177,0.12)] text-[#19E3B1] border-[rgba(25,227,177,0.3)]';
      case AppointmentStatus.IN_PROGRESS:
        return 'bg-[rgba(255,180,84,0.12)] text-[#FFB454] border-[rgba(255,180,84,0.3)]';
      case AppointmentStatus.WAITING:
        return 'bg-[rgba(255,180,84,0.12)] text-[#FFB454] border-[rgba(255,180,84,0.3)]';
      case AppointmentStatus.SCHEDULED:
        return 'bg-[rgba(18,214,196,0.12)] text-[#12D6C4] border-[rgba(18,214,196,0.3)]';
      case AppointmentStatus.NO_SHOW:
        return 'bg-[rgba(255,93,122,0.12)] text-[#FF5D7A] border-[rgba(255,93,122,0.3)]';
      case AppointmentStatus.CANCELLED:
        return 'bg-[rgba(255,255,255,0.04)] text-[rgba(245,243,250,0.5)] border-[rgba(255,255,255,0.08)]';
      default:
        return 'bg-[rgba(255,255,255,0.04)] text-[rgba(245,243,250,0.7)] border-[rgba(255,255,255,0.08)]';
    }
  };

  const getSourceIcon = (source: AppointmentSource) => {
    switch (source) {
      case AppointmentSource.WEBSITE:
        return (
          <span title="Website Booking">
            <Link className="h-3.5 w-3.5 text-[#22B8FF] stroke-[1.75]" />
          </span>
        );
      case AppointmentSource.PHONE_AI_AGENT:
        return (
          <span title="AI Voice Agent">
            <PhoneCall className="h-3.5 w-3.5 text-[#12D6C4] stroke-[1.75]" />
          </span>
        );
      default:
        return (
          <span title="Manual Booking">
            <UserIcon className="h-3.5 w-3.5 text-[rgba(245,243,250,0.5)] stroke-[1.75]" />
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

  const stats = [
    { 
      label: 'Total Appointments', 
      value: totalCount, 
      desc: 'Registered today',
      icon: Calendar,
      accent: 'teal' as const,
      color: 'text-[#12D6C4]',
    },
    { 
      label: 'Currently Waiting', 
      value: waitingCount, 
      desc: 'Patients in lounge',
      icon: Clock,
      accent: 'magenta' as const,
      color: 'text-[#FFB454]',
    },
    { 
      label: 'Completed Sessions', 
      value: doneCount, 
      desc: 'Sessions finished',
      icon: CheckCircle,
      accent: 'teal' as const,
      color: 'text-[#19E3B1]',
    },
    { 
      label: 'Avg Waiting Time', 
      value: `${avgWaitTime}m`, 
      desc: waitTimes.length > 0 ? 'Based on live check-ins' : 'No records yet',
      icon: Activity,
      accent: 'violet' as const,
      color: 'text-[#22B8FF]',
    }
  ];

  return (
    <div className="space-y-6 select-none">
      {/* 1. Daily Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <GlassPanel key={i} accent={stat.accent} className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="eyebrow text-[9px] text-[rgba(245,243,250,0.45)]">{stat.label}</p>
                <p className="text-3xl font-serif num-tabular text-[#F5F3FA] font-bold tracking-tight leading-none pt-0.5">{stat.value}</p>
                <p className="text-[10px] text-[rgba(245,243,250,0.45)] font-medium pt-1">{stat.desc}</p>
              </div>
              <div className={`p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] ${stat.color} shrink-0`}>
                <Icon className="h-5 w-5 stroke-[1.75]" />
              </div>
            </GlassPanel>
          );
        })}
      </div>

      {/* 2. Control Panel & Filters */}
      <GlassPanel className="p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => shiftDate(-1)} 
            className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[#F5F3FA] cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 stroke-[2]" />
          </motion.button>

          <div className="flex items-center gap-2.5 px-4 py-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl">
            <Calendar className="h-4 w-4 text-[#12D6C4] stroke-[2]" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-[#F5F3FA] bg-transparent focus:outline-hidden cursor-pointer num-tabular"
            />
          </div>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => shiftDate(1)} 
            className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[#F5F3FA] cursor-pointer"
          >
            <ChevronRight className="h-4 w-4 stroke-[2]" />
          </motion.button>

          {/* Adjust timings quick toggle */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdjustTimingsOpen(true)}
            className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[rgba(245,243,250,0.8)] cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Adjust Hours"
          >
            <Settings className="h-4 w-4 stroke-[1.75]" />
            <span className="hidden sm:inline">Adjust Hours</span>
          </motion.button>
        </div>

        {/* Search bar & Refresh triggers */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(245,243,250,0.4)] stroke-[2]" />
            <input 
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-full md:w-56 text-xs glass-input font-medium placeholder-[rgba(245,243,250,0.4)]"
            />
          </div>

          {/* Force manual refresh */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleForceRefresh}
            className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[#12D6C4] cursor-pointer"
          >
            <motion.div animate={{ rotate: isRefreshSpinning ? 360 : 0 }} transition={{ duration: 0.8, ease: 'easeInOut' }}>
              <RotateCw className="h-4 w-4 stroke-[2]" />
            </motion.div>
          </motion.button>

          {/* Notification bell */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsNotificationOpen(true)}
            className="p-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[#12D6C4] relative cursor-pointer"
          >
            <Bell className="h-4 w-4 stroke-[2]" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5D7A] text-[8px] font-bold text-white shadow-[0_0_8px_#FF5D7A] animate-bounce">
                {unreadNotifications.length}
              </span>
            )}
          </motion.button>

          {/* Book Patient */}
          <motion.button 
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#12D6C4] hover:bg-[#0FBDAE] text-[#06231D] text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(18,214,196,0.3)] border-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Book Patient
          </motion.button>
        </div>
      </GlassPanel>

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
        <div className="flex justify-center py-20 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <Loader2 className="h-8 w-8 text-[#12D6C4] animate-spin" />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center py-20 text-center p-6 border-dashed">
          <Calendar className="h-10 w-10 text-[rgba(18,214,196,0.4)] stroke-[1.25] mb-2 animate-bounce" />
          <p className="text-sm font-semibold text-[rgba(245,243,250,0.62)]">No sessions scheduled.</p>
          <p className="text-xs text-[rgba(245,243,250,0.4)] mt-1 font-medium">Try adjusting filters or record a new appointment.</p>
        </GlassPanel>
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

              const statusConfig: Record<string, { gradient: string; initialsBg: string }> = {
                [AppointmentStatus.COMPLETED]: {
                  gradient: 'from-[#19E3B1] to-[#12D6C4]',
                  initialsBg: 'bg-[rgba(25,227,177,0.12)] text-[#19E3B1] border-[rgba(25,227,177,0.3)]'
                },
                [AppointmentStatus.IN_PROGRESS]: {
                  gradient: 'from-[#FFB454] to-[#E23FA6]',
                  initialsBg: 'bg-[rgba(255,180,84,0.12)] text-[#FFB454] border-[rgba(255,180,84,0.3)]'
                },
                [AppointmentStatus.WAITING]: {
                  gradient: 'from-[#FFB454] to-[#FF5D7A]',
                  initialsBg: 'bg-[rgba(255,180,84,0.12)] text-[#FFB454] border-[rgba(255,180,84,0.3)]'
                },
                [AppointmentStatus.SCHEDULED]: {
                  gradient: 'from-[#12D6C4] to-[#7B5CFF]',
                  initialsBg: 'bg-[rgba(18,214,196,0.12)] text-[#12D6C4] border-[rgba(18,214,196,0.3)]'
                },
                [AppointmentStatus.NO_SHOW]: {
                  gradient: 'from-[#FF5D7A] to-[#E23FA6]',
                  initialsBg: 'bg-[rgba(255,93,122,0.12)] text-[#FF5D7A] border-[rgba(255,93,122,0.3)]'
                },
                [AppointmentStatus.CANCELLED]: {
                  gradient: 'from-[rgba(255,255,255,0.2)] to-[rgba(255,255,255,0.05)]',
                  initialsBg: 'bg-[rgba(255,255,255,0.04)] text-[rgba(245,243,250,0.4)] border-[rgba(255,255,255,0.08)]'
                }
              };

              const config = statusConfig[app.status] || {
                gradient: 'from-[#12D6C4] to-[#7B5CFF]',
                initialsBg: 'bg-[rgba(18,214,196,0.12)] text-[#12D6C4] border-[rgba(18,214,196,0.3)]'
              };

              return (
                <GlassPanel
                  key={app.id}
                  accent="teal"
                  className="flex flex-col justify-between group transition-all duration-200 relative overflow-hidden"
                >
                  {/* Soft Colored Top Glow Accent */}
                  <div className={`h-1 w-full bg-gradient-to-r ${config.gradient}`} />

                  {/* Pulsing NEW Badge */}
                  {new Date(app.createdAt).getTime() > boardOpenedTime && (
                    <span className="absolute top-3.5 right-3.5 flex h-5 px-2 items-center justify-center rounded-full bg-[#12D6C4] text-[8px] font-bold uppercase tracking-wider text-[#06231D] shadow-[0_0_10px_#12D6C4] animate-pulse z-10">
                      New
                    </span>
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3.5">
                      {/* Time Header with soft background block */}
                      <div className="flex justify-between items-center pb-2.5 border-b border-[rgba(255,255,255,0.08)]">
                        <div className="flex items-center gap-1.5 text-xs text-[#12D6C4] font-bold bg-[rgba(18,214,196,0.12)] border border-[rgba(18,214,196,0.3)] px-2.5 py-1 rounded-lg num-tabular">
                          <Clock className="h-3.5 w-3.5 stroke-[2]" />
                          <span>{app.startTime} - {app.endTime}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {(() => {
                            const pkgs = app.patient.sessionPackages;
                            if (!pkgs || pkgs.length === 0) return null;
                            const activePkg = pkgs[0];
                            const remaining = activePkg.totalSessions - activePkg.sessionsUsed;
                            if (remaining <= 2 && remaining > 0) {
                              return (
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-[rgba(255,180,84,0.12)] text-[#FFB454] border border-[rgba(255,180,84,0.3)] rounded-full num-tabular">
                                  {remaining} Left
                                </span>
                              );
                            }
                            if (remaining <= 0) {
                              return (
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-[rgba(255,93,122,0.12)] text-[#FF5D7A] border border-[rgba(255,93,122,0.3)] rounded-full animate-pulse">
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
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center font-serif text-[10px] font-bold uppercase shrink-0 border ${config.initialsBg}`}>
                              {initials}
                            </div>
                            <h4 className="text-base font-serif font-bold text-[#F5F3FA] tracking-wide group-hover:text-[#12D6C4] transition-colors truncate">
                              {app.patient.fullName}
                            </h4>
                          </div>
                          <div className="p-1.5 bg-[rgba(255,255,255,0.04)] rounded-lg border border-[rgba(255,255,255,0.08)] shrink-0">
                            {getSourceIcon(app.source)}
                          </div>
                        </div>
                        
                        {/* Demographics details row */}
                        <div className="flex items-center gap-1.5 pl-9 eyebrow text-[9px]">
                          <span>{app.patient.gender}</span>
                          <span>•</span>
                          <span className="num-tabular">{new Date().getFullYear() - new Date(app.patient.dateOfBirth).getFullYear()} Years</span>
                        </div>
                      </div>

                      {/* Treatment type segment */}
                      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] px-3.5 py-2.5 rounded-xl ml-9">
                        <span className="eyebrow text-[8px] block mb-0.5">Assigned Treatment</span>
                        <span className="text-xs font-serif font-bold text-[#12D6C4] block leading-tight">{app.treatmentType}</span>
                      </div>

                      {/* Pills container */}
                      <div className="flex flex-wrap gap-1.5 pl-9 pt-0.5">
                        {app.notes && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-[rgba(18,214,196,0.12)] text-[#12D6C4] border border-[rgba(18,214,196,0.3)] rounded-md">
                            <FileText className="h-3 w-3 stroke-[2]" />
                            SOAP Attached
                          </span>
                        )}
                        {app.assignedExercises && app.assignedExercises.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 bg-[rgba(255,180,84,0.12)] text-[#FFB454] border border-[rgba(255,180,84,0.3)] rounded-md num-tabular">
                            <Activity className="h-3 w-3 stroke-[2]" />
                            {app.assignedExercises.length} Home Ex
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Controls with Status Indicators */}
                    <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getStatusStyle(app.status)}`}>
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
                        className="flex items-center gap-1 text-xs font-bold text-[#12D6C4] hover:text-[#06231D] hover:bg-[#12D6C4] border border-[rgba(18,214,196,0.3)] px-3.5 py-1.5 rounded-xl transition-all cursor-pointer focus:outline-hidden"
                      >
                        Manage
                        <ChevronRight className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </GlassPanel>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Dynamic SOAP and checked-in Action sheet drawer overlay */}
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsNotificationOpen(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-full max-w-md bg-[#120D1F] border-l border-[rgba(255,255,255,0.12)] h-full flex flex-col p-6 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#F5F3FA]">Practice Notifications</h3>
                  <p className="eyebrow text-[9px] mt-0.5">Clinic activity logs</p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadNotifications.length > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => dismissAllNotificationsMutation.mutate()}
                      className="eyebrow text-[9px] text-[#12D6C4] border border-[rgba(18,214,196,0.3)] px-2.5 py-1 rounded-lg hover:bg-[rgba(18,214,196,0.1)] cursor-pointer"
                    >
                      Clear All
                    </motion.button>
                  )}
                  <button onClick={() => setIsNotificationOpen(false)} className="p-1 rounded-full text-[rgba(245,243,250,0.4)] hover:text-[#F5F3FA] cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {notificationsList.length === 0 ? (
                  <p className="text-xs text-[rgba(245,243,250,0.4)] italic text-center py-20 font-medium">No recent alerts recorded.</p>
                ) : (
                  notificationsList.map((n: any) => (
                    <div key={n.id} className={`p-4 rounded-2xl border flex justify-between items-start gap-3 transition-colors ${
                      n.isRead ? 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] opacity-60' : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.12)]'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            n.type === 'BOOKING' ? 'bg-[#12D6C4]' : n.type === 'CANCELLATION' ? 'bg-[#FF5D7A]' : 'bg-[#FFB454]'
                          }`} />
                          <h4 className="text-xs font-bold text-[#F5F3FA]">{n.title}</h4>
                        </div>
                        <p className="text-xs text-[rgba(245,243,250,0.7)] font-medium leading-relaxed">{n.message}</p>
                        <p className="eyebrow text-[9px] num-tabular">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {!n.isRead && (
                        <button
                          onClick={() => dismissNotificationMutation.mutate(n.id)}
                          className="p-1 text-[#12D6C4] hover:bg-[rgba(18,214,196,0.12)] border border-[rgba(18,214,196,0.3)] rounded-lg cursor-pointer"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsAdjustTimingsOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#120D1F] border border-[rgba(255,255,255,0.12)] rounded-3xl shadow-2xl flex flex-col p-6 space-y-4 z-10 select-none"
            >
              <div>
                <h3 className="text-lg font-serif font-bold text-[#F5F3FA]">Adjust Daily Hours</h3>
                <p className="eyebrow text-[9px]">Quick configure boundaries</p>
              </div>

              <div className="space-y-3 text-xs font-medium">
                <div>
                  <label className="eyebrow text-[9px] block mb-1">Opening Hour (HH:MM)</label>
                  <input 
                    type="text" 
                    value={startTimeInput} 
                    onChange={(e) => setStartTimeInput(e.target.value)} 
                    className="block w-full text-xs glass-input p-2.5 font-medium num-tabular"
                  />
                </div>

                <div>
                  <label className="eyebrow text-[9px] block mb-1">Closing Hour (HH:MM)</label>
                  <input 
                    type="text" 
                    value={endTimeInput} 
                    onChange={(e) => setEndTimeInput(e.target.value)} 
                    className="block w-full text-xs glass-input p-2.5 font-medium num-tabular"
                  />
                </div>

                <div>
                  <label className="eyebrow text-[9px] block mb-1">Slot Duration (Minutes)</label>
                  <input 
                    type="number" 
                    value={durationInput} 
                    onChange={(e) => setDurationInput(Number(e.target.value))} 
                    className="block w-full text-xs glass-input p-2.5 font-medium num-tabular"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
                <button 
                  onClick={() => setIsAdjustTimingsOpen(false)}
                  className="px-4 py-2 border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)] text-xs font-bold rounded-xl cursor-pointer text-[rgba(245,243,250,0.8)]"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => adjustTimingMutation.mutate({ startTime: startTimeInput, endTime: endTimeInput, slotDuration: durationInput })}
                  className="px-4 py-2 bg-[#12D6C4] hover:bg-[#0FBDAE] text-[#06231D] text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(18,214,196,0.3)] border-0"
                >
                  {adjustTimingMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
