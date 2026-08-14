'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, PhoneCall, Library, Settings, 
  LogOut, Menu, X, User as UserIcon, BarChart3, LayoutGrid, Network, Mail, Clock, Search, Sparkles, CreditCard, FileText
} from 'lucide-react';
import AICopilotWidget from './AICopilotWidget';
import AuroraBackground from './AuroraBackground';

interface Props {
  children: React.ReactNode;
}

export default function CRMSidebar({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>({ name: 'Loading', role: 'Staff' });

  // Clock Attendance State
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [clockLoading, setClockLoading] = useState<boolean>(false);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [elapsedMins, setElapsedMins] = useState<number>(0);
  const [showStaffPopup, setShowStaffPopup] = useState<boolean>(false);

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
    if (user?.username || user?.name) {
      fetchAttendanceStatus(user.username || 'rashmita');
    }
  }, [user]);

  // Live timer for elapsed shift duration
  useEffect(() => {
    let interval: any;
    if (isClockedIn && clockInTime) {
      const updateTimer = () => {
        const start = new Date(clockInTime).getTime();
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - start) / 60000));
        setElapsedMins(diff);
      };
      updateTimer();
      interval = setInterval(updateTimer, 30000);
    } else {
      setElapsedMins(0);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

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
    if (pathname === '/crm360/login') return;
    const session = localStorage.getItem('h360_session');
    if (!session) {
      router.replace('/crm360/login');
      setIsAuthenticated(false);
    } else {
      try {
        const parsed = JSON.parse(session);
        setUser(parsed);
        setIsAuthenticated(true);

        // RBAC: Non-admin users can access Patients Directory, Attendance, Digital Assessments, Billing & Appointments
        const role = (parsed.role || '').toLowerCase();
        const isAdmin = role === 'admin';
        const isAllowedPath = pathname.startsWith('/crm360/patients') || pathname.startsWith('/crm360/attendance') || pathname.startsWith('/crm360/assessments') || pathname.startsWith('/crm360/billing') || pathname.startsWith('/crm360/appointments');

        if (!isAdmin && !isAllowedPath) {
          router.replace('/crm360/patients');
        }
      } catch (e) {
        localStorage.removeItem('h360_session');
        router.replace('/crm360/login');
        setIsAuthenticated(false);
      }
    }
  }, [router, pathname]);

  const handleSignOut = () => {
    localStorage.removeItem('h360_session');
    router.replace('/crm360/login');
  };

  const handleConfirmRedirect = () => {
    setShowRedirectModal(false);
    window.open('https://health360-nu.vercel.app', '_blank');
  };

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';

  const fullNavigation = [
    { href: '/crm360', name: 'Clinic Overview', icon: LayoutGrid, exact: true, category: 'main', roles: ['admin', 'physio', 'receptionist', 'staff'] },
    { href: '/crm360/patients', name: 'Patients Directory', icon: Users, category: 'main', roles: ['admin', 'physio', 'receptionist', 'staff'] },
    { href: '/crm360/attendance', name: 'Staff Attendance', icon: Clock, category: 'main', roles: ['admin', 'physio', 'receptionist', 'staff'] },
    { href: '/crm360/appointments', name: 'Appointments', icon: Activity, category: 'main', roles: ['admin', 'physio', 'receptionist', 'staff'] },
    { href: '/crm360/billing', name: 'Billing & Packages', icon: CreditCard, category: 'management', roles: ['admin', 'physio', 'receptionist', 'staff'] },
    { id: 'calls', name: 'AI Voice Agent', icon: PhoneCall, category: 'management', roles: ['admin'] },
    { href: '/crm360/inbox', name: 'Unified Inbox', icon: Mail, category: 'management', roles: ['admin'] },
    { href: '/crm360/analytics', name: 'Clinical Analytics', icon: BarChart3, category: 'management', roles: ['admin'] },
    { href: '/crm360/assessments', name: 'Digital Assessments', icon: FileText, category: 'management', roles: ['admin', 'physio', 'receptionist', 'staff'] },
    { href: '/crm360/insights', name: 'Insights & Action Queue', icon: Sparkles, category: 'management', roles: ['admin'] },
    { href: '/crm360/referrals', name: 'Referral Network', icon: Network, category: 'management', roles: ['admin'] },
    { href: '/crm360/settings', name: 'Clinic Settings', icon: Settings, category: 'management', roles: ['admin'] },
  ];

  const navigation = fullNavigation.filter(item => {
    if (!isAdmin) {
      return item.href === '/crm360' || item.href === '/crm360/patients' || item.href === '/crm360/attendance' || item.href === '/crm360/assessments' || item.href === '/crm360/billing' || item.href === '/crm360/appointments';
    }
    return true;
  });

  if (pathname === '/crm360/login') {
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
    <div className="flex min-h-screen bg-[#0A0711] text-[#F5F3FA] font-sans antialiased selection:bg-primary/20 relative">
      <AuroraBackground />

      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#0B0A10] border-r border-white/10 p-4 justify-between shrink-0 z-20 shadow-[4px_0_30px_rgba(0,0,0,0.5)] select-none">
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
                {navigation.slice(0, 4).map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact ? pathname === item.href : (item.href && pathname.startsWith(item.href));

                  return (
                    <Link key={item.href} href={item.href!}>
                      <motion.div
                        whileTap={{ scale: 0.97 }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all duration-150 relative cursor-pointer ${
                          isActive 
                            ? 'text-white bg-gradient-to-r from-[var(--primary)]/30 via-[var(--primary)]/15 to-transparent border-r-2 border-[var(--primary)] shadow-[0_0_20px_var(--primary-glow)] font-bold' 
                            : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className="flex items-center gap-3 z-10">
                          <Icon className={`h-4 w-4 stroke-[1.75] ${isActive ? 'text-[var(--primary)]' : ''}`} />
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
                {navigation.slice(4).map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact ? pathname === item.href : (item.href && pathname.startsWith(item.href));

                  if (item.id === 'calls') {
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => setShowRedirectModal(true)}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all duration-150 relative cursor-pointer text-white/60 hover:text-white hover:bg-white/[0.04]"
                      >
                        <Icon className="h-4 w-4 stroke-[1.75]" />
                        <span>{item.name}</span>
                      </motion.button>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href!}>
                      <motion.div
                        whileTap={{ scale: 0.97 }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-2xl transition-all duration-150 relative cursor-pointer ${
                          isActive 
                            ? 'text-white bg-gradient-to-r from-[var(--primary)]/30 via-[var(--primary)]/15 to-transparent border-r-2 border-[var(--primary)] shadow-[0_0_20px_var(--primary-glow)] font-bold' 
                            : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className="flex items-center gap-3 z-10">
                          <Icon className={`h-4 w-4 stroke-[1.75] ${isActive ? 'text-[var(--primary)]' : ''}`} />
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

        <div className="space-y-3 pt-3">

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
              {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-white truncate capitalize">{user.name}</p>
              <p className="text-[10px] text-white/50 capitalize font-medium truncate">{user.role} Operator</p>
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
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Mobile Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-[rgba(18,13,31,0.8)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.08)] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-primary blur-md opacity-30" />
              <img 
                src="/logo/rklogo.png" 
                alt="Health 360 Icon" 
                className="h-9 w-9 object-contain relative z-10"
              />
            </div>
            <div>
              <h1 className="text-base font-serif font-semibold text-[#F5F3FA]">Health 360</h1>
              <p className="text-[9px] text-white/40">4 Staff On Duty</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Clock Out Button for Mobile */}
            <button
              onClick={handleClockToggle}
              disabled={clockLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                isClockedIn
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-[var(--primary)] text-black'
              }`}
            >
              {isClockedIn ? <LogOut size={13} /> : <Clock size={13} />}
              <span>{isClockedIn ? 'Clock Out' : 'Clock In'}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#F5F3FA] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact ? pathname === item.href : (item.href && pathname.startsWith(item.href));
                  
                  if (item.id === 'calls') {
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setShowRedirectModal(true);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-xl text-[rgba(245,243,250,0.62)] hover:bg-[rgba(255,255,255,0.04)]"
                      >
                        <Icon className="h-4.5 w-4.5 stroke-[1.75]" />
                        {item.name}
                      </button>
                    );
                  }

                  return (
                    <Link key={item.href} href={item.href!} onClick={() => setMobileMenuOpen(false)}>
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
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(255,255,255,0.04)] text-primary border border-primary/30">
                    <UserIcon className="h-4 w-4 stroke-[1.75]" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#F5F3FA] capitalize">{user.name}</p>
                    <p className="text-[10px] text-[rgba(245,243,250,0.4)] capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(255,93,122,0.3)] text-[#FF5D7A] hover:bg-[rgba(255,93,122,0.1)] text-xs font-semibold rounded-xl transition-all"
                >
                  <LogOut className="h-3.5 w-3.5 stroke-[1.75]" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* External Voice Agent Redirect Modal */}
      <AnimatePresence>
        {showRedirectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRedirectModal(false)}
              className="absolute inset-0 backdrop-blur-md bg-black/60"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative bg-[#120D1F] border border-[rgba(255,255,255,0.12)] p-6 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.5)] w-full max-w-sm z-10 flex flex-col items-center text-center space-y-4"
            >
              <button 
                onClick={() => setShowRedirectModal(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-[rgba(255,255,255,0.08)] text-[rgba(245,243,250,0.4)] hover:text-[#F5F3FA] cursor-pointer"
              >
                <X className="h-4.5 w-4.5 stroke-[1.75]" />
              </button>
              <div className="h-12 w-12 rounded-full bg-[rgba(255,255,255,0.04)] border border-primary/30 flex items-center justify-center text-primary">
                <PhoneCall className="h-5.5 w-5.5 stroke-[1.75]" />
              </div>
              <div className="space-y-1.5 px-2">
                <h3 className="text-xl font-serif font-bold text-[#F5F3FA]">
                  Redirect to Voice App?
                </h3>
                <p className="text-xs text-[rgba(245,243,250,0.62)] leading-relaxed font-medium">
                  Would you like to open the external Health 360 AI Voice Agent application?
                </p>
              </div>
              <div className="flex w-full gap-3 pt-2">
                <button
                  onClick={() => setShowRedirectModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)] text-xs font-bold rounded-xl transition-colors text-[rgba(245,243,250,0.8)]"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleConfirmRedirect}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-[#0FBDAE] text-[#06231D] text-xs font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(18,214,196,0.4)]"
                >
                  Yes, Redirect
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AICopilotWidget />
    </div>
  );
}
