'use client';

import React from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  Zap, 
  HardDrive,
  Sparkles,
  ArrowRight,
  Apple
} from 'lucide-react';
import { usePWAInstall, AndroidIcon } from './PWAInstallProvider';

export default function DownloadAppSection() {
  const { installAndroid, installIOS, installApp, isInstalled, isIOS, isIOSSafari, isAndroid } = usePWAInstall();

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
              No APK files to download, no storage clutter, and no App Store search. Install the official Health 360 app icon directly to your mobile home screen in seconds.
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
                  <Apple className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-xs text-white">Visual Arrow Guide</div>
                <div className="text-[11px] text-white/50">Follow the arrow on iOS</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xs text-left col-span-2 sm:col-span-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-xs text-white">&lt; 1 MB Size</div>
                <div className="text-[11px] text-white/50">Zero storage lag</div>
              </div>
            </div>

            {/* Detected Device Status Pill */}
            <div className="pt-2 flex items-center justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.05] border border-white/10 text-white/80">
                <span className="w-2 h-2 rounded-full bg-[#12D6C4] animate-pulse" />
                <span>
                  {isIOSSafari && '📱 Detected: Apple iPhone (Safari)'}
                  {isIOS && !isIOSSafari && '📱 Detected: iPhone (Chrome / In-App)'}
                  {isAndroid && '🤖 Detected: Android Phone'}
                  {!isIOS && !isAndroid && '💻 Detected: Desktop / Laptop Browser'}
                </span>
                {isInstalled && (
                  <span className="text-emerald-400 font-bold ml-1">· Installed ✓</span>
                )}
              </div>
            </div>

            {/* Both Action Buttons (Android & iOS Side-by-Side) */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 justify-center lg:justify-start">
              
              {/* Android Button */}
              <button
                onClick={installAndroid}
                className={`group relative px-6 py-4 rounded-2xl font-extrabold text-sm flex items-center justify-between sm:justify-center gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                  isAndroid 
                    ? 'bg-gradient-to-r from-[#0284c7] to-[#12D6C4] text-white shadow-xl shadow-[#0284c7]/30 border-none' 
                    : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isAndroid ? 'bg-white/20 text-white' : 'bg-[#12D6C4]/20 text-[#12D6C4]'}`}>
                    <AndroidIcon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                      Install on Android
                      {isAndroid && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20 font-bold uppercase tracking-wider">
                          For You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-white/60 font-normal">1-Tap Direct Install</div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-white/70 group-hover:translate-y-0.5 transition" />
              </button>

              {/* iPhone / iOS Button */}
              <button
                onClick={installIOS}
                className={`group relative px-6 py-4 rounded-2xl font-extrabold text-sm flex items-center justify-between sm:justify-center gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                  isIOS 
                    ? 'bg-gradient-to-r from-[#0284c7] to-[#12D6C4] text-white shadow-xl shadow-[#0284c7]/30 border-none' 
                    : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/15'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isIOS ? 'bg-white/20 text-white' : 'bg-white/10 text-white'}`}>
                    <Apple className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                      Install on iPhone
                      {isIOS && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/20 font-bold uppercase tracking-wider">
                          For You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-white/60 font-normal">
                      {isIOSSafari ? 'Tap for Arrow Guide' : (isIOS ? '1-Tap Switch to Safari' : 'Safari Visual Guide')}
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-white/70 group-hover:translate-y-0.5 transition" />
              </button>

            </div>

            {/* Secondary App Preview Link */}
            <div className="flex items-center justify-center lg:justify-start gap-4 pt-1">
              <a
                href="/app"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-[#12D6C4] transition font-semibold"
              >
                <span>Preview standalone app shell</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Zero storage clutter (&lt; 1MB)
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
