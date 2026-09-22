'use client';

import React from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  HardDrive,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from './PWAInstallProvider';

export default function DownloadAppSection() {
  const { installApp, isInstalled, isIOS, isAndroid } = usePWAInstall();

  return (
    <section id="download-app" className="relative py-24 px-6 overflow-hidden bg-[#0A0910] text-white">
      {/* Background Lighting Accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#0284c7]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-[#12D6C4]/15 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Information & Install Trigger */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#12D6C4]" />
              <span className="text-xs font-semibold text-white/90">
                Official Mobile Web App · Android &amp; iOS
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.15]">
              Get Health 360 <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#12D6C4] via-[#0284c7] to-[#38bdf8] bg-clip-text text-transparent">
                Directly on Your Phone
              </span>
            </h2>

            <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              No APK files to download, no storage clutter, and no App Store search. Install the official Health 360 app icon directly to your home screen with a single tap.
            </p>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xs text-left">
                <div className="w-7 h-7 rounded-lg bg-[#0284c7]/20 text-[#0284c7] flex items-center justify-center mb-2">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-xs text-white">1-Tap Install</div>
                <div className="text-[11px] text-white/50">Instant on Android</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xs text-left">
                <div className="w-7 h-7 rounded-lg bg-[#12D6C4]/20 text-[#12D6C4] flex items-center justify-center mb-2">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-xs text-white">2-Tap on iOS</div>
                <div className="text-[11px] text-white/50">Via Safari Share</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xs text-left col-span-2 sm:col-span-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-xs text-white">&lt; 1 MB Size</div>
                <div className="text-[11px] text-white/50">Zero storage lag</div>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <button
                onClick={installApp}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0284c7] to-[#12D6C4] hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-[#0284c7]/30 flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-5 h-5" />
                {isInstalled ? 'App Already Installed ✓' : (isIOS ? 'Install on iPhone' : (isAndroid ? 'Install on Android' : 'Download Mobile App'))}
              </button>

              <a
                href="/app"
                target="_blank"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <span>Launch App Preview</span>
                <ArrowRight className="w-4 h-4 text-white/50" />
              </a>
            </div>

            <p className="text-[11px] text-white/40">
              * Supports iOS 14+ (Safari) and all modern Android versions (Chrome, Edge, Samsung Internet).
            </p>
          </div>

          {/* Right Column: Visual Mockup of App on Home Screen */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[320px]">
              
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0284c7]/20 to-[#12D6C4]/20 rounded-[48px] blur-2xl -z-10" />

              {/* Phone Frame */}
              <div className="relative rounded-[44px] p-3.5 bg-gradient-to-b from-white/20 via-white/5 to-white/10 border border-white/20 shadow-2xl backdrop-blur-xl">
                
                {/* Phone Screen */}
                <div className="rounded-[36px] bg-[#07060A] overflow-hidden border border-black/40 p-5 flex flex-col justify-between aspect-[9/18.5] shadow-inner">
                  
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/60 mb-6">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                      <div className="w-4 h-2.5 rounded-sm border border-white/40" />
                    </div>
                  </div>

                  {/* App Icon Highlight on Simulated Home Screen */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    
                    {/* Pulsing Icon */}
                    <div className="relative group cursor-pointer" onClick={installApp}>
                      <div className="absolute inset-0 rounded-2xl bg-[#0284c7] blur-md opacity-40 group-hover:opacity-75 transition" />
                      <div className="relative w-20 h-20 rounded-2xl bg-white p-2 shadow-2xl border border-white/40 flex items-center justify-center transform group-hover:scale-105 transition duration-200">
                        <img 
                          src="/icons/icon-192x192.png" 
                          alt="Health 360 App Icon" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="font-extrabold text-sm text-white tracking-wide">
                        Health 360
                      </div>
                      <div className="text-[11px] text-[#12D6C4] font-medium">
                        Physiotherapy &amp; Rehab
                      </div>
                    </div>

                    <div className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-left space-y-1.5">
                      <div className="text-[10px] text-white/40 font-mono uppercase tracking-wider">
                        Installed App Features
                      </div>
                      <div className="text-xs text-white/90 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Full-screen standalone mode
                      </div>
                      <div className="text-xs text-white/90 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Offline cache &amp; fast launch
                      </div>
                      <div className="text-xs text-white/90 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> No browser address bar
                      </div>
                    </div>
                  </div>

                  {/* Bottom Dock simulation */}
                  <div className="pt-4 border-t border-white/5 flex items-center justify-center">
                    <div className="w-32 h-1 bg-white/30 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
