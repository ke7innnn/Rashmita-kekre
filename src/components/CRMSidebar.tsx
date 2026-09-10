'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, PhoneCall, Library, Settings, 
  LogOut, Menu, X, User as UserIcon, BarChart3, LayoutGrid, Network, Mail, Clock, Search, Sparkles, CreditCard, FileText, BellRing, AlertTriangle, ExternalLink, ShieldCheck,
  Plus, ChevronRight
} from 'lucide-react';
import AICopilotWidget from './AICopilotWidget';
import AuroraBackground from './AuroraBackground';
import CreatePatientModal from './CreatePatientModal';

interface Props {
  children: React.ReactNode;
}

export default function CRMSidebar({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>({ name: 'Loading', role: 'Staff' });

  // Clock Attendance State
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [clockLoading, setClockLoading] = useState<boolean>(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [elapsedMins, setElapsedMins] = useState<number>(0);
  const [showStaffPopup, setShowStaffPopup] = useState<boolean>(false);
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState<boolean>(false);

  // Smart Staff Members Roster Data
  const staffMembers = [
    { id: '1', name: 'Dr. Rashmita Karvir Kekre', role: 'Lead Physiotherapist', status: 'On Duty', isOnline: true, avatar: 'RK' },
    { id: '2', name: 'Dr. Ananya Verma', role: 'Senior Physiotherapist', status: 'On Duty', isOnline: true, avatar: 'AV' },
    { id: '3', name: 'Priya Sharma', role: 'Clinical Receptionist', status: 'On Duty', isOnline: true, avatar: 'PS' },
    { id: '4', name: 'Rahul Deshmukh', role: 'Physio Assistant', status: 'On Shift', isOnline: true, avatar: 'RD' },
  ];

  // Fetch current attendance status
  const fetchAttendanceStatus = async (username: string) => {
    try {
      const res = await fetch(`/api/attendance?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        setIsClockedIn(!!data.isClockedIn);
        if (data.activeRecord?.clockInAt) {
          setClockInTime(data.activeRecord.clockInAt);
        } else {
          setClockInTime(null);
        }
      }
    } catch (e) {
      console.error('Failed to fetch attendance:', e);
    }
  };

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
      fetchAttendanceStatus(session.user.name || 'rashmita');
    }
  }, [session]);

  // Live timer for elapsed shift duration and auto-sync
  useEffect(() => {
    let interval: any;
    if (isClockedIn && clockInTime) {
      const updateTimer = () => {
        const start = new Date(clockInTime).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 60000));
        setElapsedMins(diff);

        // If elapsed time exceeds 8 hours (480 mins), trigger attendance fetch
        // so backend auto-closes the session immediately
        if (diff >= 480 && user?.username) {
          fetchAttendanceStatus(user.username);
        }
      };
      updateTimer();
      interval = setInterval(updateTimer, 30000);
    } else {
      setElapsedMins(0);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime, user]);

  // Reminder on browser tab close/navigation if still clocked in
  useEffect(() => {
    if (isClockedIn && elapsedMins >= 180) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'You are currently clocked in. Please remember to clock out before leaving!';
        return e.returnValue;
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isClockedIn, elapsedMins]);

  const handleClockToggle = async () => {
    setClockLoading(true);
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

      if (res.ok) {
        setIsClockedIn(!isClockedIn);
        if (!isClockedIn) {
          setClockInTime(new Date().toISOString());
        } else {
          setClockInTime(null);
        }
        await fetchAttendanceStatus(user?.username || 'rashmita');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to toggle clock status');
      }
    } catch (err) {
      console.error('Clock toggle error:', err);
    } finally {
      setClockLoading(false);
    }
  };

  const formatShiftTime = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(hrs).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
  };

  useEffect(() => {
    if (pathname === '/crm360/login' || pathname?.includes('/print')) return;
    
    if (status === 'unauthenticated') {
      router.replace('/crm360/login');
      setIsAuthenticated(false);
    } else if (status === 'authenticated' && session?.user) {
      setIsAuthenticated(true);

      // RBAC: Non-admin users can access Patients Directory, Attendance, Digital Assessments, Billing & Appointments
      const role = (session.user.role || '').toLowerCase();
      const isAdmin = role === 'admin';
      const isAllowedPath = pathname.startsWith('/crm360/patients') || pathname.startsWith('/crm360/attendance') || pathname.startsWith('/crm360/assessments') || pathname.startsWith('/crm360/billing') || pathname.startsWith('/crm360/appointments');

      if (!isAdmin && !isAllowedPath) {
        router.replace('/crm360/patients');
      }
    }
  }, [router, pathname, status, session]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/crm360/login' });
  };

  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';

  const fullNavigation = [
    { href: '/crm360', name: 'Clinic Overview', icon: LayoutGrid, exact: true, category: 'main', roles: ['admin'] },
    { href: '/crm360/patients', name: 'Patients Directory', icon: Users, category: 'main', roles: ['admin', 'physio', 'receptionist', 'staff'] },
    { href: '/crm360/attendance', name: 'Staff Attendance', icon: Clock, category: 'main', roles: ['admin', 'physio', 'receptionist', 'staff'] },
    { href: '/crm360/appointments', name: 'Appointments', icon: Activity, category: 'main', roles: ['admin', 'physio', 'receptionist', 'staff'] },
    { href: '/crm360/billing', name: 'Billing & Packages', icon: CreditCard, category: 'management', roles: ['admin', 'physio', 'receptionist', 'staff'] },
    { href: 'https://health360-nu.vercel.app/', name: 'AI Voice Agent', icon: PhoneCall, category: 'management', roles: ['admin'], external: true },
    { href: '/crm360/inbox', name: 'Unified Inbox', icon: Mail, category: 'management', roles: ['admin'] },
    { href: '/crm360/analytics', name: 'Clinical Analytics', icon: BarChart3, category: 'management', roles: ['admin'] },
    { href: '/crm360/assessments', name: 'Digital Assessments', icon: FileText, category: 'management', roles: ['admin', 'physio', 'receptionist', 'staff'] },
    { href: '/crm360/insights', name: 'Insights & Action Queue', icon: Sparkles, category: 'management', roles: ['admin'] },
    { href: '/admin/imports/review', name: 'Import Review Queue', icon: ShieldCheck, category: 'management', roles: ['admin'] },
    { href: '/crm360/referrals', name: 'Referral Network', icon: Network, category: 'management', roles: ['admin'] },
    { href: '/crm360/settings', name: 'Clinic Settings', icon: Settings, category: 'management', roles: ['admin'] },
  ];

  const navigation = fullNavigation.filter(item => {
    if (!isAdmin) {
      if (item.href === '/crm360') return false;
      return (
        item.href === '/crm360/patients' ||
        item.href === '/crm360/appointments' ||
        item.href === '/crm360/attendance' ||
        item.href === '/crm360/assessments' ||
        item.href === '/crm360/billing'
      );
    }
    return true;
  });

  if (pathname === '/crm360/login' || pathname.endsWith('/print') || pathname.includes('/print')) {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen bg-[#0A0711] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#12D6C4]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-[#0A0711] print:bg-white text-[#F5F3FA] print:text-black font-sans antialiased selection:bg-primary/20 relative">
      <div className="print:hidden"><AuroraBackground /></div>

      {/* Sidebar Navigation (Desktop) */}
      <aside 
        className="hidden lg:flex lg:flex-col lg:w-64 bg-[#0B0A10] border-r border-white/10 p-4 shrink-0 z-20 shadow-[4px_0_30px_rgba(0,0,0,0.5)] select-none print:hidden sticky top-0 h-screen self-start overflow-y-auto"
        style={{ position: 'sticky', top: 0, height: '100vh', alignSelf: 'flex-start' }}
      >
        <div className="space-y-5">
          {/* Logo Branding */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-[var(--primary)] blur-md opacity-30 transition-colors duration-500" />
                <img 
                  src="/logo/rklogo.png" 
                  alt="Health 360 Icon" 
                  className="h-10 w-10 object-contain relative z-10"
                />
              </div>
              <div>
                <h1 className="text-base font-serif font-bold leading-tight text-white">Health 360</h1>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-0.5">Physiotherapy</p>
              </div>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="relative flex items-center bg-white/[0.04] border border-white/10 rounded-2xl px-3 py-2 text-xs text-white/70 focus-within:border-[var(--primary)] transition-all">
            <Search className="h-3.5 w-3.5 text-white/40 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-0 outline-none text-xs text-white placeholder-white/40 w-full font-medium"
            />
            <span className="text-[9px] font-bold font-mono text-white/40 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 ml-1">⌘F</span>
          </div>

          {/* Navigation Links with Category Headers */}
          <nav className="space-y-4">
            <div>
              <p className="text-[9px] font-bold tracking-widest text-white/35 uppercase px-3.5 pb-2">Main Menu</p>
              <div className="space-y-1">
                {navigation.filter(item => item.category === 'main').map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact ? pathname === item.href : (item.href && pathname.startsWith(item.href));

                  return (
                    <Link key={item.href} href={item.href!}>
                      <motion.div
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-colors duration-200 relative cursor-pointer select-none ${
                          isActive 
                            ? 'text-white font-bold' 
                            : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebarActivePill"
                            className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/25 via-[var(--primary)]/10 to-transparent rounded-2xl border-l-2 border-[var(--primary)] shadow-[0_0_20px_var(--primary-glow)]"
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            style={{ zIndex: 0 }}
                          />
                        )}
                        <span className="flex items-center gap-3 z-10 relative">
                          <Icon className={`h-4 w-4 stroke-[1.75] transition-colors duration-200 ${isActive ? 'text-[var(--primary)]' : ''}`} />
                          {item.name}
                        </span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[9px] font-bold tracking-widest text-white/35 uppercase px-3.5 pb-2">Management</p>
              <div className="space-y-1">
                {navigation.filter(item => item.category === 'management').map((item) => {
                  const Icon = item.icon;
                  const isActive = !item.external && (item.exact ? pathname === item.href : (item.href && pathname.startsWith(item.href)));

                  if (item.external) {
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <motion.div
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all duration-150 relative cursor-pointer text-white/60 hover:text-white hover:bg-white/[0.04] group select-none"
                        >
                          <span className="flex items-center gap-3 z-10">
                            <Icon className="h-4 w-4 stroke-[1.75] text-[#12D6C4]" />
                            {item.name}
                          </span>
                          <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-[#12D6C4] transition-colors" />
                        </motion.div>
                      </a>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href!}>
                      <motion.div
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-colors duration-200 relative cursor-pointer select-none ${
                          isActive 
                            ? 'text-white font-bold' 
                            : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="sidebarActivePill"
                            className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/25 via-[var(--primary)]/10 to-transparent rounded-2xl border-l-2 border-[var(--primary)] shadow-[0_0_20px_var(--primary-glow)]"
                            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                            style={{ zIndex: 0 }}
                          />
                        )}
                        <span className="flex items-center gap-3 z-10 relative">
                          <Icon className={`h-4 w-4 stroke-[1.75] transition-colors duration-200 ${isActive ? 'text-[var(--primary)]' : ''}`} />
                          {item.name}
                        </span>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        <div className="space-y-3 pt-6 mt-auto">

          {/* Dedicated Clock In / Clock Out Card */}
          <div className="bg-white/[0.04] border border-white/10 p-3 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">My Shift Status</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isClockedIn 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-white/10 text-white/50'
              }`}>
                {isClockedIn ? `Clocked In • ${formatShiftTime(elapsedMins)}` : 'Clocked Out'}
              </span>
            </div>

            {isClockedIn && (elapsedMins >= 420 || new Date().getHours() >= 19) && (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-2 shadow-inner">
                <BellRing className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                <div className="space-y-0.5 leading-tight">
                  <p className="font-bold text-[10px] text-amber-300">Shift Ending Reminder</p>
                  <p className="text-[10px] text-white/70">Don't forget to Clock Out before leaving! (Auto-caps at 8h)</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleClockToggle}
              disabled={clockLoading}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                isClockedIn 
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]' 
                  : 'bg-[var(--primary)] hover:brightness-110 text-black shadow-[0_0_15px_rgba(18,214,196,0.3)]'
              }`}
            >
              {clockLoading ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isClockedIn ? (
                <>
                  <LogOut className="h-4 w-4 stroke-[2]" />
                  <span>Clock Out Now</span>
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 stroke-[2]" />
                  <span>Clock In Now</span>
                </>
              )}
            </button>
          </div>

          {/* User Profile Footer Card */}
          <div className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/10 rounded-2xl">
            <div className="h-9 w-9 rounded-full bg-white/10 border border-[var(--primary)]/40 flex items-center justify-center font-bold text-white text-xs shrink-0">
              {session?.user?.name ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-white truncate capitalize">{session?.user?.name || 'Loading...'}</p>
              <p className="text-[10px] text-white/50 capitalize font-medium truncate">{session?.user?.role || 'Staff'} Operator</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4 stroke-[1.75]" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 z-10 print:p-0">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[rgba(18,13,31,0.85)] backdrop-blur-2xl border-b border-white/10 sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-2.5">
            <Link href="/crm360/patients" className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-primary blur-md opacity-30" />
                <img 
                  src="/logo/rklogo.png" 
                  alt="Health 360 Icon" 
                  className="h-8 w-8 object-contain relative z-10"
                />
              </div>
              <div>
                <h1 className="text-sm font-serif font-bold text-[#F5F3FA] leading-tight">Health 360</h1>
              </div>
            </Link>

            {/* Quick Interactive Staff Duty Pill */}
            <button
              onClick={() => setShowStaffPopup(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-bold hover:bg-emerald-500/25 transition cursor-pointer"
              title="Click to check staff on duty"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>4 On Duty</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 1-Tap Quick Add Patient from Header */}
            <button
              onClick={() => setIsCreatePatientOpen(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-black flex items-center gap-1 shadow-[0_0_12px_rgba(255,255,255,0.3)] active:scale-95 transition-all cursor-pointer"
              title="Quick Add Patient"
            >
              <Plus size={13} strokeWidth={3} />
              <span className="text-[11px] font-bold hidden xs:inline">Patient</span>
            </button>

            {/* Quick Clock Toggle */}
            <button
              onClick={handleClockToggle}
              disabled={clockLoading}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isClockedIn
                  ? (elapsedMins >= 420 || new Date().getHours() >= 19
                      ? 'bg-amber-400 text-black animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40')
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
              title={isClockedIn ? `Clocked in for ${formatShiftTime(elapsedMins)}` : 'Clock in'}
            >
              {clockLoading ? (
                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isClockedIn ? (
                <>
                  <LogOut size={12} />
                  <span className="text-[10px] font-mono">{formatShiftTime(elapsedMins)}</span>
                </>
              ) : (
                <>
                  <Clock size={12} />
                  <span className="text-[10px]">Clock In</span>
                </>
              )}
            </button>

            {/* Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="lg:hidden bg-[#120D1F] border-b border-[rgba(255,255,255,0.08)] px-6 py-4 space-y-3 shadow-2xl overflow-hidden"
            >
              {/* Quick Actions Strip */}
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-white/10">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsCreatePatientOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white text-black font-bold text-xs shadow-md active:scale-95 transition-transform cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Add Patient</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowStaffPopup(true);
                  }}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs active:scale-95 transition-transform cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Check Staff ({isClockedIn ? 'In' : 'Out'})</span>
                </button>
              </div>

              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = !item.external && (item.exact ? pathname === item.href : (item.href && pathname.startsWith(item.href)));
                  
                  if (item.external) {
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl text-[rgba(245,243,250,0.62)] hover:bg-[rgba(255,255,255,0.04)]">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4.5 w-4.5 stroke-[1.75] text-[#12D6C4]" />
                            {item.name}
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-white/40" />
                        </div>
                      </a>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <div className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl ${
                        isActive 
                          ? 'bg-[rgba(255,255,255,0.06)] text-primary border border-primary/30' 
                          : 'text-[rgba(245,243,250,0.62)] hover:bg-[rgba(255,255,255,0.04)]'
                      }`}>
                        <Icon className="h-4.5 w-4.5 stroke-[1.75]" />
                        {item.name}
                      </div>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-[rgba(255,255,255,0.08)] pt-3 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)] text-primary border border-primary/30 font-bold text-xs">
                    {session?.user?.name ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#F5F3FA] capitalize">{user?.name || session?.user?.name || 'Staff'}</p>
                    <p className="text-[10px] text-[rgba(245,243,250,0.4)] capitalize">{user?.role || session?.user?.role || 'Operator'}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(255,93,122,0.3)] text-[#FF5D7A] hover:bg-[rgba(255,93,122,0.1)] text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 stroke-[1.75]" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content Area with mobile bottom bar clearance */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-transparent print:p-0 print:overflow-visible pb-28 lg:pb-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav 
        aria-label="Mobile Navigation Bar"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0A10]/95 backdrop-blur-2xl border-t border-white/10 px-3 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-[0_-10px_35px_rgba(0,0,0,0.85)] flex items-center justify-around print:hidden select-none"
      >
        {/* Tab 1: Patients */}
        <Link
          href="/crm360/patients"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            pathname.startsWith('/crm360/patients')
              ? 'text-white font-bold'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium">Patients</span>
        </Link>

        {/* Tab 2: Check Staff & Shift */}
        <button
          onClick={() => setShowStaffPopup(true)}
          className="flex flex-col items-center py-1 px-3 rounded-xl text-white/60 hover:text-white transition-all cursor-pointer relative"
        >
          <div className="relative">
            <Clock className="h-5 w-5" />
            <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${isClockedIn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Staff</span>
        </button>

        {/* Center: Quick Add Patient Floating Elevated Button */}
        <button
          onClick={() => setIsCreatePatientOpen(true)}
          className="flex flex-col items-center -mt-6 cursor-pointer group active:scale-95 transition-transform"
          title="Quick Add Patient"
        >
          <div className="h-12 w-12 rounded-full bg-white text-black font-extrabold flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] border-4 border-[#0B0A10] group-hover:brightness-110">
            <Plus className="h-6 w-6 stroke-[3]" />
          </div>
          <span className="text-[9px] font-bold text-white/90 mt-0.5">Add</span>
        </button>

        {/* Tab 4: Appointments */}
        <Link
          href="/crm360/appointments"
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            pathname.startsWith('/crm360/appointments')
              ? 'text-white font-bold'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Activity className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium">Appts</span>
        </Link>

        {/* Tab 5: Menu / More */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            mobileMenuOpen ? 'text-white font-bold' : 'text-white/50 hover:text-white'
          }`}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-medium">More</span>
        </button>
      </nav>

      {/* Quick Staff & Shift Hub (Mobile Bottom Sheet / Modal) */}
      <AnimatePresence>
        {showStaffPopup && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStaffPopup(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="relative w-full max-w-lg bg-[#120D22] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 pb-8 sm:pb-5 shadow-2xl z-10 text-white space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Pull Bar */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto sm:hidden" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-white">Staff & Shift Hub</h3>
                    <p className="text-[10px] text-white/50">Live Clinic Duty & Attendance</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStaffPopup(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Current Shift Status Card */}
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
                      {session?.user?.name ? session.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'DR'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white capitalize">{session?.user?.name || 'Dr. Rashmita'}</p>
                      <p className="text-[10px] text-white/50 capitalize">{session?.user?.role || 'Lead Physio'} Operator</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                    isClockedIn 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-white/10 text-white/50'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isClockedIn ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'}`} />
                    {isClockedIn ? `In • ${formatShiftTime(elapsedMins)}` : 'Clocked Out'}
                  </span>
                </div>

                {/* Clock In / Out Toggle Button */}
                <button
                  onClick={handleClockToggle}
                  disabled={clockLoading}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                    isClockedIn
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      : 'bg-white hover:bg-white/90 text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                  }`}
                >
                  {clockLoading ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isClockedIn ? (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span>Clock Out My Shift</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      <span>Clock In My Shift</span>
                    </>
                  )}
                </button>
              </div>

              {/* Team Members On Duty List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Staff On Duty Today</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">4 Active</span>
                </div>

                <div className="space-y-1.5">
                  {staffMembers.map((staff) => (
                    <div
                      key={staff.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.06] transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-[11px] border border-white/10 shrink-0">
                          {staff.avatar}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{staff.name}</p>
                          <p className="text-[10px] text-white/50">{staff.role}</p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {staff.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
                <Link
                  href="/crm360/attendance"
                  onClick={() => setShowStaffPopup(false)}
                  className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 text-center transition flex flex-col items-center gap-1"
                >
                  <Clock className="h-4 w-4 text-emerald-400" />
                  <span className="text-[11px] font-semibold text-white">Full Attendance Logs</span>
                </Link>

                <button
                  onClick={() => {
                    setShowStaffPopup(false);
                    handleSignOut();
                  }}
                  className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-center transition flex flex-col items-center gap-1 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-rose-400" />
                  <span className="text-[11px] font-semibold text-rose-300">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Create Patient Modal - 1-Tap Trigger from anywhere */}
      <CreatePatientModal 
        isOpen={isCreatePatientOpen}
        onClose={() => setIsCreatePatientOpen(false)}
      />

      <AICopilotWidget />
    </div>
  );
}
