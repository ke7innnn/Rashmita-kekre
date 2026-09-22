'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  Calendar, 
  Phone, 
  MessageSquare, 
  Globe, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function MobileAppHomePage() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone PWA
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);
  }, []);

  return (
    <div className="min-h-screen bg-[#07060A] text-white flex flex-col justify-between selection:bg-[#12D6C4]/30">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#0284c7]/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#12D6C4]/15 rounded-full blur-[100px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <img 
            src="/icons/icon-192x192.png" 
            alt="Health 360 Logo" 
            className="w-9 h-9 rounded-xl shadow-lg border border-white/10 object-contain bg-white"
          />
          <div>
            <span className="font-extrabold text-sm tracking-wider uppercase block bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Health 360
            </span>
            <span className="text-[10px] text-[#12D6C4] font-medium tracking-tight block">
              Physiotherapy Clinic
            </span>
          </div>
        </Link>

        {isStandalone ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> App Mode
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#12D6C4]/10 text-[#12D6C4] border border-[#12D6C4]/20">
            <Sparkles className="w-3 h-3" /> Mobile Preview
          </span>
        )}
      </header>

      {/* Main Hero Card */}
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-6 py-8 flex flex-col justify-center items-center text-center">
        {/* App Icon with Pulsing Halo */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#0284c7] to-[#12D6C4] blur-xl opacity-60 animate-pulse" />
          <div className="relative w-28 h-28 rounded-3xl bg-white p-3 shadow-2xl border-2 border-white/20 flex items-center justify-center">
            <img 
              src="/icons/icon-512x512.png" 
              alt="Health 360 App Icon" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-white/90">
            {isStandalone ? 'Installed on Home Screen' : 'Health 360 Mobile Web App'}
          </span>
        </div>

        <h1 className="text-2xl font-black tracking-tight mb-2">
          Health 360 Clinic
        </h1>
        <p className="text-xs text-white/60 max-w-xs leading-relaxed mb-8">
          Physiotherapy &amp; Craniosacral Therapy Clinic. You have successfully opened the Health 360 standalone app.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <a
            href="/#book"
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:from-[#0369a1] hover:to-[#0284c7] text-white font-bold text-xs shadow-lg shadow-[#0284c7]/25 flex items-center justify-between transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Book Appointment</div>
                <div className="text-[10px] text-white/70">Select date &amp; time slot</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/80" />
          </a>

          <a
            href="tel:+918071583519"
            className="w-full py-3 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs flex items-center justify-between transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm">Call Clinic</div>
                <div className="text-[10px] text-white/50">+91 8071 583 519</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40" />
          </a>

          <a
            href="https://wa.me/918482812859?text=Hello%20Health%20360,%20I%20am%20messaging%20from%20the%20mobile%20app."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-semibold text-xs flex items-center justify-between transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#25D366]/20 flex items-center justify-center text-[#25D366]">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-sm text-white">WhatsApp Chat</div>
                <div className="text-[10px] text-white/50">+91 8482812859</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#25D366]/60" />
          </a>

          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl text-white/50 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition"
          >
            <Globe className="w-3.5 h-3.5" /> Back to Main Website
          </Link>
        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 px-6 py-4 text-center border-t border-white/5 text-[10px] text-white/40">
        <p className="flex items-center justify-center gap-1.5 mb-1">
          <MapPin className="w-3 h-3 text-[#12D6C4]" />
          Shop 1 &amp; 2, Shree Amardeep Enclave, Om Nagar, Vasai West
        </p>
        <p>© {new Date().getFullYear()} Health 360 · All rights reserved</p>
      </footer>
    </div>
  );
}
