'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, PhoneCall, Library, Settings, 
  LogOut, Menu, X, User as UserIcon, BarChart3, LayoutGrid, Network
} from 'lucide-react';
import OverviewTab from './OverviewTab';
import OPDDashboard from './OPDDashboard';
import PatientsTab from './PatientsTab';
import VoiceAgentTab from './VoiceAgentTab';
import TreatmentsTab from './TreatmentsTab';
import AnalyticsTab from './AnalyticsTab';
import ReferralsTab from './ReferralsTab';
import SettingsTab from './SettingsTab';
import ManageAppointmentPage from './ManageAppointmentPage';
import AICopilotWidget from './AICopilotWidget';

interface Props {
  user: {
    name: string;
    role: string;
  };
  initialSettings?: any;
}

type TabType = 'overview' | 'dashboard' | 'patients' | 'calls' | 'treatments' | 'analytics' | 'referrals' | 'settings' | 'manage-appointment';

export default function DashboardShell({ user }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  const handleConfirmRedirect = () => {
    setShowRedirectModal(false);
    window.open('https://health360-nu.vercel.app', '_blank');
  };

  const handleCancelRedirect = () => {
    setShowRedirectModal(false);
  };

  const navigation = [
    { id: 'overview', name: 'Clinic Overview', icon: LayoutGrid },
    { id: 'dashboard', name: 'Appointments', icon: Activity },
    { id: 'patients', name: 'Patients Directory', icon: Users },
    { id: 'calls', name: 'AI Voice Agent', icon: PhoneCall },
    { id: 'treatments', name: 'Modalities Reference', icon: Library },
    { id: 'analytics', name: 'Clinical Analytics', icon: BarChart3 },
    { id: 'referrals', name: 'Referral Network', icon: Network },
    { id: 'settings', name: 'Clinic Settings', icon: Settings },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/10">
      {/* 1. Sidebar Navigation (Desktop) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-[#FFFCF6]/85 backdrop-blur-md border-r border-[#EADFCA] p-4 justify-between shrink-0 shadow-[2px_0_18px_rgba(42,38,32,0.01)]">
        <div className="space-y-5">
          {/* Logo Branding */}
          <div className="flex items-center gap-3.5 border-b border-[#EADFCA]/45 pb-3">
            <img 
              src="/logo/rklogo.png" 
              alt="Health 360 Icon" 
              className="h-16 w-16 object-contain shrink-0"
            />
            <div>
              <h1 className="text-xl font-serif font-bold leading-tight text-[#2B2620]">Health 360</h1>
              <p className="text-[9px] font-bold text-foreground/45 uppercase tracking-widest mt-0.5">Physiotherapy</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-0.5 relative">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'calls') {
                      setShowRedirectModal(true);
                    } else {
                      setActiveTab(item.id as TabType);
                    }
                  }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors duration-150 relative cursor-pointer focus:outline-hidden ${
                    isActive 
                      ? 'text-background' 
                      : 'text-[#2B2620]/60 hover:text-[#2B2620] hover:bg-[#FAF6EF]/50'
                  }`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      className="absolute inset-0 bg-primary rounded-lg shadow-xxs"
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      style={{ zIndex: 0 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5 w-full">
                    <Icon className="h-4 w-4 stroke-[1.75]" />
                    {item.name}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* User profile / Log Out */}
        <div className="border-t border-[#EADFCA] pt-3 space-y-3">
          <div className="flex flex-col items-center text-center gap-1.5 p-3 bg-[#FAF6EF]/60 border border-[#EADFCA] rounded-xl shadow-xxs">
            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-serif text-primary font-bold text-base">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="truncate w-full">
              <p className="text-xs font-bold text-[#2B2620] truncate capitalize">{user.name}</p>
              <p className="text-[9px] text-foreground/45 capitalize font-bold tracking-wider mt-0.5">Authorized Operator</p>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 bg-primary text-background rounded-full">
              {user.role} Status
            </span>
          </div>

          <motion.button
            onClick={handleSignOut}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5 stroke-[1.75]" />
            Sign Out
          </motion.button>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-[#FFFCF6]/90 backdrop-blur-md border-b border-[#EADFCA] shadow-xs">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo/rklogo.png" 
              alt="Health 360 Icon" 
              className="h-14 w-14 object-contain shrink-0"
            />
            <h1 className="text-xl font-serif font-semibold text-[#2B2620]">Health 360</h1>
          </div>
          <motion.button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.95 }}
            className="p-1 rounded-lg hover:bg-background border border-[#EADFCA] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 stroke-[1.75]" /> : <Menu className="h-5 w-5 stroke-[1.75]" />}
          </motion.button>
        </header>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="lg:hidden bg-[#FFFCF6] border-b border-[#EADFCA] px-6 py-4 space-y-3 shadow-md overflow-hidden"
            >
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'calls') {
                          setShowRedirectModal(true);
                        } else {
                          setActiveTab(item.id as TabType);
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg ${
                        isActive 
                          ? 'bg-primary text-background shadow-xs' 
                          : 'text-[#2B2620]/60 hover:bg-background'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 stroke-[1.75]" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
              <div className="border-t border-[#EADFCA] pt-3 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <UserIcon className="h-4 w-4 stroke-[1.75]" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#2B2620] capitalize">{user.name}</p>
                    <p className="text-xxs text-foreground/45 capitalize">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-all"
                >
                  <LogOut className="h-3.5 w-3.5 stroke-[1.75]" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FAF6EF]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="h-full"
            >
              {activeTab === 'overview' && (
                <OverviewTab onVoiceAgentClick={() => setShowRedirectModal(true)} />
              )}
              {activeTab === 'dashboard' && (
                <OPDDashboard 
                  onManageAppointment={(id) => {
                    setSelectedAppointmentId(id);
                    setActiveTab('manage-appointment');
                  }} 
                />
              )}
              {activeTab === 'patients' && (
                <PatientsTab 
                  selectedPatientId={selectedPatientId} 
                  setSelectedPatientId={setSelectedPatientId} 
                />
              )}
              {activeTab === 'calls' && <VoiceAgentTab />}
              {activeTab === 'treatments' && <TreatmentsTab />}
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'referrals' && (
                <ReferralsTab 
                  onViewPatient={(id) => {
                    setSelectedPatientId(id);
                    setActiveTab('patients');
                  }} 
                />
              )}
              {activeTab === 'settings' && <SettingsTab user={user} />}
              {activeTab === 'manage-appointment' && (
                <ManageAppointmentPage 
                  appointmentId={selectedAppointmentId!} 
                  onBack={() => {
                    setActiveTab('dashboard');
                    setSelectedAppointmentId(null);
                  }} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* External Voice Agent Redirect Modal */}
      <AnimatePresence>
        {showRedirectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            {/* Frosted Glass Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRedirectModal(false)}
              className="absolute inset-0 backdrop-blur-md"
              style={{ backgroundColor: 'rgba(43, 38, 32, 0.3)' }}
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative bg-card border border-border p-6 rounded-3xl shadow-[0_24px_50px_rgba(42,38,32,0.15)] w-full max-w-sm z-10 flex flex-col items-center text-center space-y-4"
              style={{ backgroundColor: '#FFFCF6', borderColor: '#EADFCA' }}
            >
              {/* Close Button */}
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowRedirectModal(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-background text-[#2B2620]/45 hover:text-[#2B2620] cursor-pointer focus:outline-hidden"
              >
                <X className="h-4.5 w-4.5 stroke-[1.75]" />
              </motion.button>

              {/* Icon Accent */}
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <PhoneCall className="h-5.5 w-5.5 stroke-[1.75]" />
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5 px-2">
                <h3 className="text-xl font-serif font-bold text-[#2B2620]">
                  Redirect to Voice App?
                </h3>
                <p className="text-xs text-[#2B2620]/65 leading-relaxed font-semibold">
                  Would you like to open the external Health 360 AI Voice Agent application?
                </p>
              </div>

              {/* Buttons */}
              <div className="flex w-full gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleCancelRedirect}
                  className="flex-1 px-4 py-2.5 border border-border hover:bg-background text-xs font-bold rounded-xl transition-colors cursor-pointer text-[#2B2620]/80 focus:outline-hidden"
                  style={{ borderColor: '#EADFCA' }}
                >
                  No, Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleConfirmRedirect}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-card text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden"
                >
                  Yes, Redirect
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating AI CRM Assistant */}
      <AICopilotWidget />
    </div>
  );
}
