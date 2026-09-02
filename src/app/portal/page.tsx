'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Dumbbell, Calendar, Clock, Check, X, ArrowLeft, 
  RotateCcw, Sparkles, Smartphone, Monitor, ChevronRight,
  ShieldCheck, Award, Zap, Bell, Pause, Play, ChevronDown, ChevronUp
} from 'lucide-react';

export default function MemberPortalPage() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'today' | 'membership' | 'workout'>('today');
  const [desktopLayoutMode, setDesktopLayoutMode] = useState<'frames' | 'dashboard'>('frames');
  
  // Interactive Workout Session State
  const [elapsedSeconds, setElapsedSeconds] = useState(1458); // 24:18
  const [restSeconds, setRestSeconds] = useState(47);
  const [isRestActive, setIsRestActive] = useState(true);
  const [completedSets, setCompletedSets] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: false,
    4: false,
  });

  // Freeze / Upgrade Modal State
  const [modalType, setModalType] = useState<'freeze' | 'upgrade' | null>(null);
  const [whatsIncludedOpen, setWhatsIncludedOpen] = useState(true);

  // Timer interval for elapsed workout
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Timer interval for rest countdown
  useEffect(() => {
    let timer: any;
    if (isRestActive && restSeconds > 0) {
      timer = setInterval(() => {
        setRestSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRestActive, restSeconds]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const toggleSetCompletion = (setNum: number) => {
    const nextState = !completedSets[setNum];
    setCompletedSets(prev => ({ ...prev, [setNum]: nextState }));
    if (nextState) {
      setRestSeconds(90);
      setIsRestActive(true);
    }
  };

  return (
    <>
      {/* External Design Fonts */}
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link 
        href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@400,500,700&display=swap" 
        rel="stylesheet" 
      />
      <link 
        href="https://fonts.googleapis.com/css2?family=Martian+Mono:wght@400;500&display=swap" 
        rel="stylesheet" 
      />

      <style jsx global>{`
        :root {
          --portal-base: #08090C;
          --portal-surface: #111318;
          --portal-surface-2: #1A1D25;
          --portal-line: rgba(255,255,255,.07);
          --portal-line-strong: rgba(255,255,255,.13);
          --portal-ink: #F2F3F5;
          --portal-ink-2: #9DA3AE;
          --portal-ink-3: #646A75;
          --portal-accent: #FF5C7A;
          --portal-accent-soft: rgba(255,92,122,.14);
          --portal-ok: #4ADE80;
          --portal-warn: #FFC24B;

          --display-font: 'Clash Display', 'Satoshi', system-ui, sans-serif;
          --body-font: 'Satoshi', system-ui, -apple-system, sans-serif;
          --data-font: 'Martian Mono', ui-monospace, monospace;
        }

        .portal-display { font-family: var(--display-font); }
        .portal-body { font-family: var(--body-font); }
        .portal-data { font-family: var(--data-font); }

        .phone-mockup {
          width: 352px;
          height: 720px;
          background: var(--portal-base);
          border-radius: 38px;
          border: 1px solid var(--portal-line-strong);
          box-shadow: 0 40px 80px -20px rgba(0,0,0,.9);
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .phone-mockup::before {
          content: '';
          position: absolute;
          left: -20%;
          bottom: -30%;
          width: 140%;
          height: 60%;
          background: radial-gradient(ellipse at 50% 100%, rgba(255,92,122,.13), rgba(120,90,220,.07) 45%, transparent 70%);
          pointer-events: none;
        }

        .screen-scroll {
          position: relative;
          flex: 1;
          overflow-y: auto;
          padding: 0 18px 24px;
        }
        .screen-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="min-h-screen bg-[#050609] text-[#F2F3F5] portal-body antialiased selection:bg-[#FF5C7A]/20 pb-16">
        {/* Top Floating Control Bar (for desktop switching & back navigation) */}
        <header className="sticky top-0 z-40 bg-[#050609]/90 backdrop-blur-md border-b border-white/[0.08] px-4 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/crm360"
                className="flex items-center gap-1.5 text-xs text-[#9DA3AE] hover:text-white transition px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>CRM Overview</span>
              </Link>
              <div className="hidden sm:flex items-center gap-2 pl-2">
                <span className="h-2 w-2 rounded-full bg-[#FF5C7A]" />
                <span className="portal-display text-sm font-semibold tracking-tight text-white">
                  DNA 360 Member Portal
                </span>
                <span className="text-[10px] portal-data text-[#646A75] bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  v2.4
                </span>
              </div>
            </div>

            {/* Viewport & Tab Switchers */}
            <div className="flex items-center gap-2">
              {/* Desktop Mode Toggle (Visible on LG screens) */}
              <div className="hidden lg:flex items-center bg-[#111318] border border-white/10 p-1 rounded-xl gap-1 text-xs">
                <button
                  onClick={() => setDesktopLayoutMode('frames')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    desktopLayoutMode === 'frames' 
                      ? 'bg-[#FF5C7A] text-[#12040A] font-bold shadow-sm' 
                      : 'text-[#9DA3AE] hover:text-white'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>3-Screen Canvas</span>
                </button>
                <button
                  onClick={() => setDesktopLayoutMode('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    desktopLayoutMode === 'dashboard' 
                      ? 'bg-[#FF5C7A] text-[#12040A] font-bold shadow-sm' 
                      : 'text-[#9DA3AE] hover:text-white'
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  <span>Desktop View</span>
                </button>
              </div>

              {/* Screen Tab Switcher (Used on mobile and in single screen mode) */}
              <div className="flex items-center bg-[#111318] border border-white/10 p-1 rounded-xl gap-1 text-xs">
                <button
                  onClick={() => setActiveTab('today')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeTab === 'today' 
                      ? 'bg-white text-black font-bold' 
                      : 'text-[#9DA3AE] hover:text-white'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveTab('membership')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    activeTab === 'membership' 
                      ? 'bg-white text-black font-bold' 
                      : 'text-[#9DA3AE] hover:text-white'
                  }`}
                >
                  Membership
                </button>
                <button
                  onClick={() => setActiveTab('workout')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'workout' 
                      ? 'bg-[#FF5C7A] text-[#12040A] font-bold' 
                      : 'text-[#9DA3AE] hover:text-white'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                  <span>Workout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ========================================================
            PC 3-SCREEN CANVAS VIEW (Visible when desktop layout = 'frames')
           ======================================================== */}
        <main className="max-w-7xl mx-auto px-4 pt-8">
          <div className="text-center max-w-xl mx-auto mb-8 hidden lg:block">
            <h1 className="portal-display text-2xl font-semibold tracking-tight text-white">
              DNA 360 — Member Portal Direction
            </h1>
            <p className="text-xs text-[#9DA3AE] mt-2 leading-relaxed">
              The structural discipline of the reference screens, in DNA 360's own identity. Three screens: daily home, membership, and live workout logging.
            </p>
          </div>

          {/* DESKTOP SIDE-BY-SIDE FRAMES VIEW */}
          <div className={`hidden lg:${desktopLayoutMode === 'frames' ? 'flex' : 'hidden'} justify-center gap-8 items-start flex-wrap`}>
            
            {/* FRAME 1: TODAY */}
            <div className="flex flex-col items-center gap-3">
              <div className="phone-mockup">
                <StatusBar />
                <div className="screen-scroll">
                  <TodayScreenContent onStartWorkout={() => setActiveTab('workout')} />
                </div>
              </div>
              <span className="portal-data text-[10px] text-[#646A75] tracking-widest uppercase">
                01 — TODAY
              </span>
            </div>

            {/* FRAME 2: MEMBERSHIP */}
            <div className="flex flex-col items-center gap-3">
              <div className="phone-mockup">
                <StatusBar />
                <div className="screen-scroll">
                  <MembershipScreenContent 
                    whatsIncludedOpen={whatsIncludedOpen}
                    setWhatsIncludedOpen={setWhatsIncludedOpen}
                    onOpenModal={(type) => setModalType(type)}
                  />
                </div>
              </div>
              <span className="portal-data text-[10px] text-[#646A75] tracking-widest uppercase">
                02 — MEMBERSHIP
              </span>
            </div>

            {/* FRAME 3: ACTIVE WORKOUT */}
            <div className="flex flex-col items-center gap-3">
              <div className="phone-mockup">
                <StatusBar />
                <div className="screen-scroll">
                  <ActiveWorkoutScreenContent
                    elapsedSeconds={elapsedSeconds}
                    formatTimer={formatTimer}
                    restSeconds={restSeconds}
                    isRestActive={isRestActive}
                    setIsRestActive={setIsRestActive}
                    completedSets={completedSets}
                    toggleSetCompletion={toggleSetCompletion}
                    setRestSeconds={setRestSeconds}
                  />
                </div>
              </div>
              <span className="portal-data text-[10px] text-[#646A75] tracking-widest uppercase">
                03 — ACTIVE WORKOUT
              </span>
            </div>

          </div>

          {/* DESKTOP COMMAND-CENTER DASHBOARD VIEW */}
          <div className={`hidden lg:${desktopLayoutMode === 'dashboard' ? 'grid' : 'hidden'} grid-cols-3 gap-6 items-start`}>
            {/* Column 1: Today */}
            <div className="bg-[#111318] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
                <span className="portal-data text-xs text-[#FF5C7A] font-semibold tracking-wider uppercase">01 • Today</span>
                <span className="portal-data text-xs text-[#9DA3AE]">TUE, 1 SEP</span>
              </div>
              <TodayScreenContent onStartWorkout={() => {
                setDesktopLayoutMode('dashboard');
                // Scroll to column 3 or highlight
              }} />
            </div>

            {/* Column 2: Membership */}
            <div className="bg-[#111318] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
                <span className="portal-data text-xs text-[#4ADE80] font-semibold tracking-wider uppercase">02 • Membership</span>
                <span className="portal-data text-xs text-[#9DA3AE]">Annual Plan</span>
              </div>
              <MembershipScreenContent 
                whatsIncludedOpen={whatsIncludedOpen}
                setWhatsIncludedOpen={setWhatsIncludedOpen}
                onOpenModal={(type) => setModalType(type)}
              />
            </div>

            {/* Column 3: Active Workout */}
            <div className="bg-[#111318] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-5">
                <span className="portal-data text-xs text-[#FF5C7A] font-semibold tracking-wider uppercase">03 • Active Workout</span>
                <span className="portal-data text-xs text-[#4ADE80] font-mono">LIVE • {formatTimer(elapsedSeconds)}</span>
              </div>
              <ActiveWorkoutScreenContent
                elapsedSeconds={elapsedSeconds}
                formatTimer={formatTimer}
                restSeconds={restSeconds}
                isRestActive={isRestActive}
                setIsRestActive={setIsRestActive}
                completedSets={completedSets}
                toggleSetCompletion={toggleSetCompletion}
                setRestSeconds={setRestSeconds}
              />
            </div>
          </div>

          {/* MOBILE FULLSCREEN EXPERIENCE (Visible on small & medium viewports) */}
          <div className="lg:hidden max-w-md mx-auto">
            <div className="bg-[#08090C] rounded-3xl border border-white/[0.12] p-5 shadow-2xl relative overflow-hidden min-h-[680px]">
              {/* Ambient Wash Background */}
              <div className="absolute left-0 bottom-0 w-full h-80 bg-radial from-[#FF5C7A]/10 via-[#785ADC]/5 to-transparent pointer-events-none" />

              {activeTab === 'today' && (
                <TodayScreenContent onStartWorkout={() => setActiveTab('workout')} />
              )}

              {activeTab === 'membership' && (
                <MembershipScreenContent 
                  whatsIncludedOpen={whatsIncludedOpen}
                  setWhatsIncludedOpen={setWhatsIncludedOpen}
                  onOpenModal={(type) => setModalType(type)}
                />
              )}

              {activeTab === 'workout' && (
                <ActiveWorkoutScreenContent
                  elapsedSeconds={elapsedSeconds}
                  formatTimer={formatTimer}
                  restSeconds={restSeconds}
                  isRestActive={isRestActive}
                  setIsRestActive={setIsRestActive}
                  completedSets={completedSets}
                  toggleSetCompletion={toggleSetCompletion}
                  setRestSeconds={setRestSeconds}
                />
              )}
            </div>

            {/* Native Mobile Bottom Navigation Bar */}
            <div className="fixed bottom-4 left-4 right-4 z-40 bg-[#111318]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2 flex items-center justify-around shadow-2xl">
              <button
                onClick={() => setActiveTab('today')}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                  activeTab === 'today' ? 'text-white font-bold bg-white/10' : 'text-[#9DA3AE]'
                }`}
              >
                <span className="text-xs font-semibold">Today</span>
              </button>
              <button
                onClick={() => setActiveTab('membership')}
                className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                  activeTab === 'membership' ? 'text-white font-bold bg-white/10' : 'text-[#9DA3AE]'
                }`}
              >
                <span className="text-xs font-semibold">Membership</span>
              </button>
              <button
                onClick={() => setActiveTab('workout')}
                className={`flex items-center gap-1.5 py-1 px-3.5 rounded-xl transition ${
                  activeTab === 'workout' 
                    ? 'bg-[#FF5C7A] text-[#12040A] font-bold' 
                    : 'text-[#9DA3AE]'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-[#4ADE80] animate-pulse" />
                <span className="text-xs font-semibold">Workout</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Interactive Freeze / Upgrade Modal Dialog */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111318] border border-white/15 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="portal-display text-lg font-bold text-white">
                {modalType === 'freeze' ? 'Freeze Membership' : 'Upgrade Membership'}
              </h3>
              <button 
                onClick={() => setModalType(null)}
                className="p-1 text-[#9DA3AE] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalType === 'freeze' ? (
              <div className="space-y-3 text-xs text-[#9DA3AE]">
                <p>You have <strong className="text-white">18 of 30 freeze days left</strong> for this billing cycle.</p>
                <p>Freezing will pause your membership validity and push your renewal date forward accordingly.</p>
                <button
                  onClick={() => {
                    alert('Freeze request submitted successfully.');
                    setModalType(null);
                  }}
                  className="w-full mt-4 py-3 rounded-full bg-[#FF5C7A] text-[#12040A] font-bold text-sm cursor-pointer"
                >
                  Confirm 14-Day Freeze
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-[#9DA3AE]">
                <p>Current plan: <strong className="text-white">12 months Premium Annual</strong>.</p>
                <p>Upgrade to <strong className="text-white">VIP Diamond Elite</strong> to unlock unlimited 1-on-1 personal training sessions and concierge recovery lounge access.</p>
                <button
                  onClick={() => {
                    alert('Upgrade inquiry logged. Our concierge will contact you.');
                    setModalType(null);
                  }}
                  className="w-full mt-4 py-3 rounded-full bg-[#4ADE80] text-[#12040A] font-bold text-sm cursor-pointer"
                >
                  Request Tier Upgrade
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ----------------------------------------------------
   SUBCOMPONENTS: STATUS BAR
---------------------------------------------------- */
function StatusBar() {
  return (
    <div className="flex justify-between items-center px-5 pt-3.5 pb-1 portal-data text-[10px] text-[#9DA3AE] shrink-0">
      <span>9:41</span>
      <span className="tracking-widest">▪▪▪ ◗</span>
    </div>
  );
}

/* ----------------------------------------------------
   SCREEN 1: TODAY CONTENT
---------------------------------------------------- */
function TodayScreenContent({ onStartWorkout }: { onStartWorkout: () => void }) {
  return (
    <div>
      {/* Nav */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          {/* DNA 360 Capsule Logo */}
          <div className="flex items-end gap-[2.5px]">
            <i style={{ height: '9px', width: '3px', background: '#FF5C7A', borderRadius: '2px', display: 'block' }} />
            <i style={{ height: '13px', width: '3px', background: '#F0699C', borderRadius: '2px', display: 'block' }} />
            <i style={{ height: '17px', width: '3px', background: '#C86DD7', borderRadius: '2px', display: 'block' }} />
            <i style={{ height: '13px', width: '3px', background: '#9B7BE8', borderRadius: '2px', display: 'block' }} />
            <i style={{ height: '9px', width: '3px', background: '#6E8CF0', borderRadius: '2px', display: 'block' }} />
          </div>
          <span className="portal-display text-sm font-semibold tracking-wide text-white">
            DNA 360
          </span>
        </div>
        <button className="text-white/80 hover:text-white p-1">
          <Bell className="h-4 w-4" />
        </button>
      </div>

      {/* Greeting */}
      <div className="mt-2">
        <p className="portal-data text-[9.5px] text-[#646A75] tracking-[0.06em] uppercase">TUE, 1 SEPTEMBER</p>
        <h2 className="portal-display text-2xl font-semibold tracking-tight leading-snug mt-1 text-white">
          Good evening, Aditi
        </h2>
      </div>

      {/* Strand Meter */}
      <div className="flex items-center gap-5 my-5">
        <div className="relative w-[118px] h-[118px] shrink-0">
          <svg viewBox="0 0 120 120" width="118" height="118">
            <defs>
              <linearGradient id="strand" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF5C7A" />
                <stop offset="50%" stopColor="#C86DD7" />
                <stop offset="100%" stopColor="#6E8CF0" />
              </linearGradient>
            </defs>
            <g transform="rotate(-90 60 60)">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="9" strokeLinecap="round" strokeDasharray="57.4 8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="url(#strand)" strokeWidth="9" strokeLinecap="round" strokeDasharray="57.4 8" strokeDashoffset="0" pathLength="326.7" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#08090C" strokeWidth="11" strokeDasharray="130.7 196" strokeDashoffset="-196" />
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="portal-display text-3xl font-semibold leading-none text-white">3</span>
            <span className="text-[10.5px] text-[#646A75] mt-1">of 5 this week</span>
          </div>
        </div>
        <div className="text-[13px] text-[#9DA3AE] leading-relaxed">
          <p>Two sessions left to close the week. Your last one was <strong className="text-white">Saturday</strong>.</p>
        </div>
      </div>

      {/* Today's Workout Card */}
      <div className="bg-[#111318] border border-white/[0.07] rounded-[20px] p-4.5 mb-3 shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <p className="portal-data text-[9.5px] text-[#646A75] tracking-wider uppercase">TODAY · WEEK 3, DAY 1</p>
            <h3 className="portal-display text-xl font-semibold text-white mt-1">Push</h3>
            <p className="text-xs text-[#9DA3AE] mt-1">6 exercises · about 52 min</p>
          </div>
          <span className="portal-data text-[9.5px] tracking-wider px-2 py-1 rounded-full bg-emerald-400/15 text-[#4ADE80]">
            SCHEDULED
          </span>
        </div>
        <div className="mt-4">
          <button 
            onClick={onStartWorkout}
            className="w-full py-3 px-4 rounded-full bg-[#FF5C7A] hover:bg-[#FF5C7A]/90 text-[#12040A] font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,92,122,0.35)] cursor-pointer"
          >
            Start workout
          </button>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <div 
          onClick={onStartWorkout}
          className="bg-[#111318] border border-white/[0.07] rounded-[14px] p-3.5 flex flex-col gap-2.5 cursor-pointer hover:border-white/20 transition"
        >
          <Dumbbell className="h-4 w-4 text-[#9DA3AE]" />
          <span className="text-xs font-semibold text-white">Log a workout</span>
        </div>
        <div className="bg-[#111318] border border-white/[0.07] rounded-[14px] p-3.5 flex flex-col gap-2.5 cursor-pointer hover:border-white/20 transition">
          <Calendar className="h-4 w-4 text-[#9DA3AE]" />
          <span className="text-xs font-semibold text-white">Book a class</span>
        </div>
      </div>

      {/* Streak Section */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[13px] font-bold text-white">Your streak</h4>
        <span className="portal-data text-[11px] text-[#646A75]">12 days</span>
      </div>
      <div className="flex gap-1.5 mb-5">
        <i className="flex-1 h-6 rounded-md bg-[#FF5C7A]/15 border border-[#FF5C7A]/30" />
        <i className="flex-1 h-6 rounded-md bg-[#FF5C7A]/15 border border-[#FF5C7A]/30" />
        <i className="flex-1 h-6 rounded-md bg-white/[0.05]" />
        <i className="flex-1 h-6 rounded-md bg-[#FF5C7A]/15 border border-[#FF5C7A]/30" />
        <i className="flex-1 h-6 rounded-md bg-[#FF5C7A]/15 border border-[#FF5C7A]/30" />
        <i className="flex-1 h-6 rounded-md bg-[#FF5C7A]/15 border border-[#FF5C7A]/30" />
        <i className="flex-1 h-6 rounded-md bg-[#FF5C7A]" />
      </div>

      {/* Plan Validity Banner */}
      <div className="bg-[#111318] border border-white/[0.07] rounded-[20px] p-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-[#1A1D25] flex items-center justify-center shrink-0">
          <Clock className="h-4 w-4 text-[#FF5C7A]" />
        </div>
        <div className="text-xs">
          <b className="block text-white font-medium">47 days left on your plan</b>
          <span className="block text-[11px] text-[#646A75] mt-0.5">Renew before 11 Oct to keep your rate</span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   SCREEN 2: MEMBERSHIP CONTENT
---------------------------------------------------- */
function MembershipScreenContent({
  whatsIncludedOpen,
  setWhatsIncludedOpen,
  onOpenModal,
}: {
  whatsIncludedOpen: boolean;
  setWhatsIncludedOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  onOpenModal: (type: 'freeze' | 'upgrade') => void;
}) {
  return (
    <div>
      {/* Nav */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Membership</span>
        </div>
        <span className="text-[11px] text-[#9DA3AE] font-medium">Help</span>
      </div>

      {/* Main Tier Card */}
      <div className="bg-[#111318] border border-white/[0.07] rounded-[20px] p-4.5 mb-3">
        <span className="portal-data text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-400/15 text-[#4ADE80] font-semibold tracking-wider">
          ACTIVE
        </span>

        <div className="flex justify-between items-start mt-3">
          <h3 className="portal-display text-xl font-semibold text-white leading-snug max-w-[190px]">
            12 months<br />Premium Annual
          </h3>
          {/* Logo capsules indicator */}
          <div className="flex items-end gap-1">
            <i style={{ height: '14px', width: '3px', background: 'rgba(255,92,122,.5)', borderRadius: '2px', display: 'block' }} />
            <i style={{ height: '20px', width: '3px', background: 'rgba(240,105,156,.6)', borderRadius: '2px', display: 'block' }} />
            <i style={{ height: '26px', width: '3px', background: 'rgba(200,109,215,.7)', borderRadius: '2px', display: 'block' }} />
            <i style={{ height: '20px', width: '3px', background: 'rgba(155,123,232,.6)', borderRadius: '2px', display: 'block' }} />
            <i style={{ height: '14px', width: '3px', background: 'rgba(110,140,240,.5)', borderRadius: '2px', display: 'block' }} />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 rounded-full bg-white/[0.09] overflow-hidden my-4">
          <div className="h-full rounded-full bg-gradient-to-r from-[#FF5C7A] to-[#C86DD7]" style={{ width: '71%' }} />
        </div>
        <div className="flex justify-between portal-data text-[9.5px] text-[#646A75]">
          <span>STARTS 12 OCT &apos;25</span>
          <span>ENDS 11 OCT &apos;26</span>
        </div>

        {/* Split Action Buttons */}
        <div className="border-t border-white/[0.07] -mx-4.5 mt-4 pt-3 px-4.5 flex">
          <button 
            onClick={() => onOpenModal('freeze')}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white hover:text-[#FF5C7A] transition cursor-pointer"
          >
            <Pause className="h-3 w-3" />
            <span>Freeze</span>
          </button>
          <div className="w-[1px] bg-white/[0.07]" />
          <button 
            onClick={() => onOpenModal('upgrade')}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs text-[#646A75] hover:text-white transition cursor-pointer"
          >
            <Zap className="h-3 w-3" />
            <span>Upgrade</span>
          </button>
        </div>
      </div>

      {/* Usage Rows */}
      <div className="bg-[#111318] border border-white/[0.07] rounded-[20px] overflow-hidden mb-5 divide-y divide-white/[0.07]">
        <div className="flex items-center gap-3 p-3.5">
          <div className="h-8 w-8 rounded-xl bg-[#1A1D25] flex items-center justify-center shrink-0">
            <Award className="h-4 w-4 text-[#FF5C7A]" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <b className="block text-white font-medium">6 of 12 PT sessions left</b>
            <span className="block text-[11px] text-[#646A75] mt-0.5">Elite tier · with Rohan</span>
          </div>
          <ChevronRight className="h-4 w-4 text-[#646A75]" />
        </div>

        <div className="flex items-center gap-3 p-3.5">
          <div className="h-8 w-8 rounded-xl bg-[#1A1D25] flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-[#FF5C7A]" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <b className="block text-white font-medium">18 of 30 freeze days left</b>
            <span className="block text-[11px] text-[#646A75] mt-0.5">Resets on renewal</span>
          </div>
          <ChevronRight className="h-4 w-4 text-[#646A75]" />
        </div>

        <div className="flex items-center gap-3 p-3.5">
          <div className="h-8 w-8 rounded-xl bg-[#1A1D25] flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-[#FF5C7A]" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <b className="block text-white font-medium">Invoices</b>
            <span className="block text-[11px] text-[#646A75] mt-0.5">11 receipts</span>
          </div>
          <ChevronRight className="h-4 w-4 text-[#646A75]" />
        </div>
      </div>

      {/* What's Included Drawer */}
      <div className="mb-5">
        <div 
          onClick={() => setWhatsIncludedOpen(prev => !prev)}
          className="flex items-center justify-between py-2 cursor-pointer"
        >
          <h4 className="text-[13px] font-bold text-white">What&apos;s included</h4>
          {whatsIncludedOpen ? (
            <ChevronUp className="h-4 w-4 text-[#646A75]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#646A75]" />
          )}
        </div>

        {whatsIncludedOpen && (
          <div className="bg-[#111318] border border-white/[0.07] rounded-[20px] overflow-hidden divide-y divide-white/[0.07] mt-2">
            <div className="flex items-center gap-3 p-3.5">
              <div className="h-8 w-8 rounded-xl bg-[#1A1D25] flex items-center justify-center shrink-0">
                <Dumbbell className="h-4 w-4 text-[#FF5C7A]" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <b className="block text-white font-medium">Unlimited gym floor access</b>
                <span className="block text-[11px] text-[#646A75] mt-0.5">6 am to 11 pm, all days</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5">
              <div className="h-8 w-8 rounded-xl bg-[#1A1D25] flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-[#FF5C7A]" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <b className="block text-white font-medium">4 group classes a week</b>
                <span className="block text-[11px] text-[#646A75] mt-0.5">Yoga, HIIT, Zumba, spin</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5">
              <div className="h-8 w-8 rounded-xl bg-[#1A1D25] flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-[#FF5C7A]" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <b className="block text-white font-medium">2 Reformer Pilates sessions</b>
                <span className="block text-[11px] text-[#646A75] mt-0.5">Per month, booking required</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Renew early CTA */}
      <button 
        onClick={() => alert('Early renewal discount applied: ₹4,000 off.')}
        className="w-full py-3.5 rounded-full border border-white/20 text-white font-bold text-xs hover:bg-white/5 transition cursor-pointer"
      >
        Renew early · save ₹4,000
      </button>
    </div>
  );
}

/* ----------------------------------------------------
   SCREEN 3: ACTIVE WORKOUT CONTENT
---------------------------------------------------- */
function ActiveWorkoutScreenContent({
  elapsedSeconds,
  formatTimer,
  restSeconds,
  isRestActive,
  setIsRestActive,
  completedSets,
  toggleSetCompletion,
  setRestSeconds,
}: {
  elapsedSeconds: number;
  formatTimer: (sec: number) => string;
  restSeconds: number;
  isRestActive: boolean;
  setIsRestActive: (val: boolean) => void;
  completedSets: Record<number, boolean>;
  toggleSetCompletion: (setNum: number) => void;
  setRestSeconds: (sec: number) => void;
}) {
  return (
    <div>
      {/* Nav */}
      <div className="flex items-center justify-between py-3">
        <X className="h-4 w-4 text-white/80 cursor-pointer" />
        <span className="text-sm font-bold text-white">Push · W3 D1</span>
        <span className="portal-data text-xs text-[#FF5C7A] font-semibold">
          {formatTimer(elapsedSeconds)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1 rounded-full bg-white/[0.09] overflow-hidden my-2">
        <div className="h-full rounded-full bg-gradient-to-r from-[#FF5C7A] to-[#C86DD7]" style={{ width: '33%' }} />
      </div>
      <div className="flex justify-between portal-data text-[9.5px] text-[#646A75] mb-4">
        <span>EXERCISE 2 OF 6</span>
        <span>PRESCRIBED BY ROHAN</span>
      </div>

      {/* Exercise Card */}
      <div className="bg-[#111318] border border-white/[0.07] rounded-[20px] p-4.5 mb-3">
        <h3 className="portal-display text-lg font-semibold text-white">Barbell bench press</h3>
        <p className="text-xs text-[#9DA3AE] mt-0.5">4 sets · 8 reps · 60 kg · 90 s rest</p>

        {/* Set Header Labels */}
        <div className="grid grid-cols-[26px_1fr_1fr_34px] gap-2 portal-data text-[9px] text-[#646A75] text-center mt-4 mb-2">
          <span>SET</span>
          <span>KG</span>
          <span>REPS</span>
          <span></span>
        </div>

        {/* Set Rows */}
        <div className="space-y-3">
          {[
            { set: 1, kg: 60, reps: 8, last: 'Last: 57.5 kg × 8' },
            { set: 2, kg: 60, reps: 8, last: 'Last: 57.5 kg × 8' },
            { set: 3, kg: 60, reps: 8, last: 'Last: 57.5 kg × 7' },
            { set: 4, kg: 60, reps: 8, last: 'Last: 55 kg × 8' },
          ].map((item) => {
            const isDone = completedSets[item.set];
            return (
              <div key={item.set} className="space-y-1">
                <div className="grid grid-cols-[26px_1fr_1fr_34px] gap-2 items-center">
                  <span className="portal-data text-xs text-[#646A75] text-center font-medium">
                    {item.set}
                  </span>
                  <div className={`py-2 text-center rounded-lg portal-data text-xs font-medium border ${
                    isDone 
                      ? 'bg-[#1A1D25] border-white/10 text-white' 
                      : 'bg-[#1A1D25]/50 border-white/5 text-[#646A75]'
                  }`}>
                    {item.kg}
                  </div>
                  <div className={`py-2 text-center rounded-lg portal-data text-xs font-medium border ${
                    isDone 
                      ? 'bg-[#1A1D25] border-white/10 text-white' 
                      : 'bg-[#1A1D25]/50 border-white/5 text-[#646A75]'
                  }`}>
                    {item.reps}
                  </div>

                  {/* Tick Checkbox */}
                  <button
                    onClick={() => toggleSetCompletion(item.set)}
                    className={`h-[34px] w-[34px] rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                      isDone 
                        ? 'bg-[#FF5C7A] border-[#FF5C7A] text-[#12040A]' 
                        : 'border-white/15 text-[#646A75] hover:border-white/30'
                    }`}
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
                <div className="pl-9 portal-data text-[9.5px] text-[#646A75]">
                  {item.last}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest Timer HUD */}
        <div className="mt-4 p-3 rounded-full bg-[#1A1D25] border border-white/[0.08] flex items-center justify-between px-4">
          <span className="text-xs text-[#646A75]">Rest</span>
          <b className="portal-data text-base font-bold text-[#FF5C7A]">
            0:{String(restSeconds).padStart(2, '0')}
          </b>
          <button 
            onClick={() => setRestSeconds(0)}
            className="text-xs text-[#646A75] hover:text-white transition cursor-pointer"
          >
            Skip
          </button>
        </div>
      </div>

      {/* Nav Controls */}
      <div className="flex gap-2 mb-5">
        <button 
          onClick={() => alert('Smart substitution: Incline Smith Machine Press or Dumbbell Bench Press.')}
          className="flex-1 py-2.5 rounded-full bg-[#111318] border border-white/[0.08] text-xs text-[#9DA3AE] hover:text-white transition cursor-pointer font-medium"
        >
          Swap exercise
        </button>
        <button 
          onClick={() => alert('Additional set added.')}
          className="flex-1 py-2.5 rounded-full bg-[#111318] border border-white/[0.08] text-xs text-[#9DA3AE] hover:text-white transition cursor-pointer font-medium"
        >
          Add set
        </button>
      </div>

      {/* Up Next Queue */}
      <div>
        <h4 className="text-[13px] font-bold text-white mb-2">Up next</h4>
        <div className="bg-[#111318] border border-white/[0.07] rounded-[20px] overflow-hidden divide-y divide-white/[0.07]">
          <div className="flex items-center gap-3 p-3.5">
            <div className="h-8 w-8 rounded-xl bg-[#1A1D25] flex items-center justify-center shrink-0">
              <Dumbbell className="h-4 w-4 text-[#FF5C7A]" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <b className="block text-white font-medium">Incline dumbbell press</b>
              <span className="block text-[11px] text-[#646A75] mt-0.5">3 × 10 · 22.5 kg</span>
            </div>
            <span className="portal-data text-xs text-[#9DA3AE]">03</span>
          </div>

          <div className="flex items-center gap-3 p-3.5">
            <div className="h-8 w-8 rounded-xl bg-[#1A1D25] flex items-center justify-center shrink-0">
              <Dumbbell className="h-4 w-4 text-[#FF5C7A]" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <b className="block text-white font-medium">Cable fly</b>
              <span className="block text-[11px] text-[#646A75] mt-0.5">3 × 12 · RPE 8</span>
            </div>
            <span className="portal-data text-xs text-[#9DA3AE]">04</span>
          </div>
        </div>
      </div>
    </div>
  );
}
