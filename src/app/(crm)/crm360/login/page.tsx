'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Lock, User, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import AuroraBackground from '@/components/AuroraBackground';

// Hardcoded credentials & database fallback
const USERS = [
  { username: 'rashmita', password: 'rashmita123', name: 'Dr. Rashmita Karvir Kekre', role: 'admin' },
  { username: 'drgachchami', password: 'physio123', name: 'Dr. Gachchami', role: 'physio' },
  { username: 'drpritee', password: 'physio123', name: 'Dr. Pritee', role: 'physio' },
  { username: 'physio', password: 'physio123', name: 'Physio Practitioner', role: 'physio' },
  { username: 'receptionist', password: 'receptionist123', name: 'Receptionist', role: 'physio' },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        username: username.trim(),
        password: password,
        redirect: false,
      });

      if (res?.error || !res?.ok) {
        setError('Invalid username or password. Please try again.');
        setLoading(false);
        return;
      }

      const userMatch = USERS.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );

      const name = userMatch?.name || username.trim();
      const role = userMatch?.role || (username.trim().toLowerCase() === 'rashmita' ? 'admin' : 'physio');

      localStorage.setItem('h360_session', JSON.stringify({ name, role, username: username.trim() }));
      
      if (role.toLowerCase() !== 'admin') {
        router.push('/crm360/patients');
      } else {
        router.push('/crm360');
      }
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="relative min-h-screen bg-[#0A0711] text-[#F5F3FA] font-sans antialiased flex items-center justify-center p-4 selection:bg-primary/20 overflow-hidden">
      {/* Dynamic Aurora Ambient Background */}
      <AuroraBackground />

      {/* Glassmorphism Login Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md bg-white/[0.04] backdrop-blur-2xl border border-white/12 p-8 sm:p-10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] space-y-8"
      >
        {/* Top Header & Logo Badge */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="relative shrink-0 mb-1">
            <div className="absolute inset-0 rounded-full bg-[var(--primary)] blur-lg opacity-40 animate-pulse" />
            <div className="relative z-10 h-16 w-16 rounded-2xl bg-white/5 border border-white/15 p-2.5 shadow-inner flex items-center justify-center backdrop-blur-md">
              <img
                src="/logo/rklogo.png"
                alt="Health 360 Logo"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center justify-center gap-2">
              Health 360
            </h1>
            <p className="text-xs font-semibold text-[var(--primary)] tracking-widest uppercase mt-0.5">
              Physiotherapy Clinic CRM
            </p>
          </div>

          <p className="text-xs text-white/60 max-w-xs leading-relaxed font-medium">
            Sign in to manage patient records, appointments & clinical workflows.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-xl text-center font-semibold backdrop-blur-md shadow-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Login Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[var(--primary)]" /> Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/35 focus:border-[var(--primary)] focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
                placeholder="e.g. rashmita"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-white/70 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[var(--primary)]" /> Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/35 focus:border-[var(--primary)] focus:bg-white/[0.08] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[var(--primary)] to-cyan-400 text-black font-bold text-sm shadow-[0_0_25px_rgba(18,214,196,0.4)] hover:brightness-110 focus:outline-none disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign in to CRM</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Pills for Fast Access */}
        <div className="pt-2 border-t border-white/10 space-y-2.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-white/40">
            <span>Quick Demo Logins</span>
            <ShieldCheck className="w-3 h-3 text-[var(--primary)]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('rashmita', 'rashmita123')}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 hover:text-white transition text-left truncate"
            >
              👑 Dr. Rashmita (Admin)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('drgachchami', 'physio123')}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 hover:text-white transition text-left truncate"
            >
              🩺 Dr. Gachchami
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('drpritee', 'physio123')}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 hover:text-white transition text-left truncate"
            >
              🩺 Dr. Pritee
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('receptionist', 'receptionist123')}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-white/80 hover:text-white transition text-left truncate"
            >
              📋 Receptionist
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
