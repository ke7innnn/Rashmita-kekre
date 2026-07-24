'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, PhoneCall, Library, Settings, 
  LogOut, Menu, X, User as UserIcon, BarChart3, LayoutGrid, Network, Mail
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

  const navigation = [
    { href: '/crm360', name: 'Clinic Overview', icon: LayoutGrid, exact: true },
    { href: '/crm360/appointments', name: 'Appointments', icon: Activity },
    { href: '/crm360/patients', name: 'Patients Directory', icon: Users },
    { id: 'calls', name: 'AI Voice Agent', icon: PhoneCall },
    { href: '/crm360/inbox', name: 'Unified Inbox', icon: Mail },
    { href: '/crm360/treatments', name: 'Modalities Reference', icon: Library },
    { href: '/crm360/analytics', name: 'Clinical Analytics', icon: BarChart3 },
    { href: '/crm360/referrals', name: 'Referral Network', icon: Network },
    { href: '/crm360/settings', name: 'Clinic Settings', icon: Settings },
  ];

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
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[rgba(18,13,31,0.75)] backdrop-blur-2xl border-r border-[rgba(255,255,255,0.08)] p-4 justify-between shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.3)]">
        <div className="space-y-6">
          {/* Logo Branding */}
          <div className="flex items-center gap-3.5 border-b border-[rgba(255,255,255,0.08)] pb-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-primary blur-md opacity-40 animate-pulse transition-colors duration-500" />
              <img 
                src="/logo/rklogo.png" 
                alt="Health 360 Icon" 
                className="h-12 w-12 object-contain relative z-10"
              />
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold leading-tight text-[#F5F3FA]">Health 360</h1>
              <p className="text-[10px] font-semibold text-[rgba(245,243,250,0.4)] uppercase tracking-widest mt-0.5">Physiotherapy</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 relative">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : (item.href && pathname.startsWith(item.href));
              
              if (item.id === 'calls') {
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setShowRedirectModal(true)}
                    whileTap={{ scale: 0.97 }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 relative cursor-pointer focus:outline-none text-[rgba(245,243,250,0.62)] hover:text-[#F5F3FA] hover:bg-[rgba(255,255,255,0.04)]"
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
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150 relative cursor-pointer focus:outline-none ${
                      isActive 
                        ? 'text-[#F5F3FA] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' 
                        : 'text-[rgba(245,243,250,0.62)] hover:text-[#F5F3FA] hover:bg-[rgba(255,255,255,0.04)]'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full shadow-[0_0_12px_var(--primary)] transition-colors duration-300" />
                    )}
                    <span className="flex items-center gap-3 z-10">
                      <Icon className={`h-4 w-4 stroke-[1.75] ${isActive ? 'text-primary' : ''}`} />
                      {item.name}
                    </span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)] z-10 transition-colors duration-300" />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile / Log Out */}
        <div className="border-t border-[rgba(255,255,255,0.08)] pt-4 space-y-3">
          <div className="flex items-center gap-3 p-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-inner">
            <div className="h-9 w-9 rounded-full bg-[rgba(255,255,255,0.04)] border border-primary/30 flex items-center justify-center font-serif text-primary font-bold text-sm shrink-0 transition-colors">
              {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-[#F5F3FA] truncate capitalize">{user.name}</p>
              <p className="text-[10px] text-[rgba(245,243,250,0.4)] capitalize font-semibold truncate">{user.role} Operator</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg hover:bg-[rgba(255,93,122,0.12)] text-[rgba(245,243,250,0.4)] hover:text-[#FF5D7A] transition-colors cursor-pointer"
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
              <div className="absolute inset-0 rounded-full bg-primary blur-md opacity-40 animate-pulse" />
              <img 
                src="/logo/rklogo.png" 
                alt="Health 360 Icon" 
                className="h-9 w-9 object-contain relative z-10"
              />
            </div>
            <h1 className="text-lg font-serif font-semibold text-[#F5F3FA]">Health 360</h1>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[#F5F3FA] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
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
