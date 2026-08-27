'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Clock, LogIn, LogOut, Calendar, CheckCircle2, UserCheck, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import GlassPanel from '@/components/GlassPanel';

export default function AttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [activeRecord, setActiveRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    }
  }, [session]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const username = user?.username || 'rashmita';
      const res = await fetch(`/api/attendance?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (res.ok) {
        setIsClockedIn(data.isClockedIn);
        setActiveRecord(data.activeRecord);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [user]);

  // Live Clock & Elapsed Shift Duration Timer
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDateStr(now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

      if (isClockedIn && activeRecord?.clockInAt) {
        const start = new Date(activeRecord.clockInAt).getTime();
        const diffMs = now.getTime() - start;
        setElapsedMinutes(Math.max(0, Math.floor(diffMs / (1000 * 60))));
      } else {
        setElapsedMinutes(0);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, activeRecord]);

  const handleClockToggle = async () => {
    setActionLoading(true);
    try {
      const action = isClockedIn ? 'clockOut' : 'clockIn';
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          username: user?.username || 'rashmita',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update attendance status.');
      } else {
        await fetchAttendance();
      }
    } catch (err) {
      console.error('Error toggling clock:', err);
      alert('Error updating attendance status.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatHours = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hrs}h ${m}m`;
  };

  const calculateShiftDuration = (startIso: string, endIso?: string) => {
    if (!startIso) return '—';
    const start = new Date(startIso).getTime();
    const end = endIso ? new Date(endIso).getTime() : new Date().getTime();
    const mins = Math.floor((end - start) / (1000 * 60));
    return formatHours(mins);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-0.5 rounded-full border border-[var(--primary)]/20">
              Staff Attendance Portal
            </span>
            <span className="text-xs text-foreground/50">• Vasai Clinic Desk</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
            Staff Time & Attendance
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Log shift clock-ins, track session hours, and monitor staff coverage in real time.
          </p>
        </div>

        <button
          onClick={fetchAttendance}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-foreground/80 transition-all self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Status
        </button>
      </div>

      {/* Main Clock-In Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Clock In / Clock Out Main Action */}
        <GlassPanel className="lg:col-span-1 p-6 relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[380px] border border-white/10">
          
          {/* Status Badge */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isClockedIn ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="text-xs font-medium text-foreground/70">
                {isClockedIn ? 'ACTIVE SHIFT' : 'OFF CLOCK'}
              </span>
            </div>
            <span className="text-xs text-foreground/40 font-mono">{currentDateStr}</span>
          </div>

          {/* Clock Display */}
          <div className="my-6">
            <div className="text-4xl lg:text-5xl font-mono font-bold tracking-wider text-foreground">
              {currentTime || '00:00:00 AM'}
            </div>
            <p className="text-xs text-foreground/50 mt-1">Local Clinic Time (IST)</p>
          </div>

          {/* Action Button */}
          <div className="w-full space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={actionLoading}
              onClick={handleClockToggle}
              className={`w-full py-4 rounded-2xl font-bold text-base shadow-xl flex items-center justify-center gap-3 transition-all ${
                isClockedIn
                  ? 'bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white border border-rose-400/30'
                  : 'bg-gradient-to-r from-[var(--primary)] to-emerald-500 hover:opacity-95 text-black font-semibold border border-emerald-400/40'
              }`}
            >
              {actionLoading ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : isClockedIn ? (
                <>
                  <LogOut size={20} />
                  Clock Out of Shift
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Clock In Now
                </>
              )}
            </motion.button>

            {isClockedIn && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-center gap-2">
                <CheckCircle2 size={15} />
                <span>Shift Duration: <strong className="font-mono text-white">{formatHours(elapsedMinutes)}</strong></span>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Right Cards: Attendance Summary Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          <GlassPanel className="p-6 flex flex-col justify-between border border-white/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Active Staff Member</span>
                <ShieldCheck size={18} className="text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-bold text-foreground font-sans">
                {user?.name || 'Dr. Rashmita Karvir Kekre'}
              </h3>
              <p className="text-xs text-foreground/60 mt-1 capitalize">
                Role: <strong className="text-foreground">{user?.role || 'Admin'}</strong>
              </p>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-foreground/50">Today's Clock In:</span>
                <span className="font-mono text-foreground">
                  {activeRecord?.clockInAt
                    ? new Date(activeRecord.clockInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : 'Not Clocked In'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-foreground/50">Status:</span>
                <span className={isClockedIn ? 'text-emerald-400 font-medium' : 'text-foreground/40'}>
                  {isClockedIn ? 'In Session / On Duty' : 'Completed / Off'}
                </span>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6 flex flex-col justify-between border border-white/10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Clinic Attendance Overview</span>
                <UserCheck size={18} className="text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-foreground font-mono">
                {history.filter(h => !h.clockOutAt).length} <span className="text-sm font-normal text-foreground/50 font-sans">Staff Currently In</span>
              </div>
              <p className="text-xs text-foreground/60 mt-2">
                {isAdmin ? 'Full clinic oversight enabled.' : 'Your personal shift records are updated live.'}
              </p>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4 flex items-center gap-2 text-xs text-foreground/50">
              <AlertCircle size={14} className="text-amber-400" />
              <span>Shift records are synced directly with clinic compliance logs.</span>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Attendance History Table */}
      <GlassPanel className="p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground font-sans flex items-center gap-2">
              <Calendar size={18} className="text-[var(--primary)]" />
              {isAdmin ? 'All Staff Attendance History' : 'Your Attendance Log'}
            </h3>
            <p className="text-xs text-foreground/50">
              Complete timeline of recorded clock-in and clock-out timestamps.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-foreground/50">Loading attendance records...</div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-xs text-foreground/40 bg-white/5 rounded-xl border border-white/5">
            No attendance records found yet. Click "Clock In Now" to log your first shift.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-foreground/50 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Clock In</th>
                  <th className="py-3 px-4">Clock Out</th>
                  <th className="py-3 px-4">Total Duration</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((record) => {
                  const inTime = new Date(record.clockInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                  const outTime = record.clockOutAt
                    ? new Date(record.clockOutAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : 'Active';
                  const dateDisplay = new Date(record.date || record.clockInAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-foreground/80">{dateDisplay}</td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {record.user?.username || 'Staff User'}
                      </td>
                      <td className="py-3.5 px-4 text-foreground/60 capitalize">
                        {record.user?.role || 'Physio'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400">{inTime}</td>
                      <td className="py-3.5 px-4 font-mono text-rose-300">{outTime}</td>
                      <td className="py-3.5 px-4 font-mono font-medium text-foreground">
                        {calculateShiftDuration(record.clockInAt, record.clockOutAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        {record.clockOutAt ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/30">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> On Duty
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
