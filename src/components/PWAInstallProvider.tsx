'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  Apple, 
  Share2, 
  PlusSquare, 
  X, 
  CheckCircle2, 
  MoreVertical,
  Download,
  ArrowDown,
  ExternalLink,
  Copy,
  Sparkles
} from 'lucide-react';

export const AndroidIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4566a.416.416 0 00-.1523-.5676.416.416 0 00-.5682.1523l-2.0223 3.503C15.5842 8.4116 13.849 8.1132 12 8.1132c-1.849 0-3.5842.2984-5.1307.8394L4.847 5.4495a.4161.4161 0 00-.5682-.1523.4163.4163 0 00-.1523.5676l1.996 3.4566C2.6884 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6884-7.5743-6.1185-9.4396"/>
  </svg>
);

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isIOSSafari: boolean;
  isAndroid: boolean;
  installApp: () => Promise<void>;
  installAndroid: () => Promise<void>;
  installIOS: () => void;
  openInstallGuide: (platform?: 'ios' | 'android') => void;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  isIOSSafari: false,
  isAndroid: false,
  installApp: async () => {},
  installAndroid: async () => {},
  installIOS: () => {},
  openInstallGuide: () => {},
});

export const usePWAInstall = () => useContext(PWAContext);

export function PWAInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  // Overlays state
  const [showSafariArrowGuide, setShowSafariArrowGuide] = useState(false);
  const [showChromeSwitchModal, setShowChromeSwitchModal] = useState(false);
  const [showGeneralModal, setShowGeneralModal] = useState(false);
  const [modalPlatform, setModalPlatform] = useState<'ios' | 'android'>('ios');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }

    // 2. Accurate Browser & OS Detection
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = 
        /iphone|ipad|ipod/.test(userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Check if true Apple Safari vs Chrome/Instagram/WhatsApp webview
      const isTrueSafari = 
        isIosDevice && 
        /safari/.test(userAgent) && 
        !/crios|fxios|edgios|instagram|fban|fbav|whatsapp|line|micromessenger/.test(userAgent);
      
      const isAndroidDevice = /android/.test(userAgent);

      setIsIOS(isIosDevice);
      setIsIOSSafari(isTrueSafari);
      setIsAndroid(isAndroidDevice);
      setModalPlatform(isAndroidDevice ? 'android' : 'ios');

      // Check if running in standalone PWA app mode
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);

      // Automatic trigger if user just arrived in Safari from Chrome / WhatsApp redirect (?install=ios)
      if (window.location.search.includes('install=ios') && isTrueSafari) {
        setShowSafariArrowGuide(true);
      }

      // 3. Android beforeinstallprompt listener
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  // Android installation
  const installAndroid = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.warn('Native prompt error:', err);
      }
    }
    setModalPlatform('android');
    setShowGeneralModal(true);
  };

  // iOS installation with automated Chrome-to-Safari prompt & bouncing arrow
  const installIOS = () => {
    if (isIOSSafari) {
      // Already in Safari! Show the animated bouncing arrow pointing right to the Share button
      setShowSafariArrowGuide(true);
    } else if (isIOS) {
      // User is on iPhone in Chrome, WhatsApp, or Instagram!
      // Trigger Apple's special x-safari-https:// URL scheme to trigger "Open in Safari?" system dialog
      const host = window.location.host;
      const safariUrl = `x-safari-https://${host}/?install=ios#download-app`;
      setShowChromeSwitchModal(true);
      
      // Trigger the prompt
      try {
        window.location.href = safariUrl;
      } catch (e) {
        console.warn('Error launching safari url:', e);
      }
    } else {
      // Desktop Mac/PC or other browser
      setModalPlatform('ios');
      setShowGeneralModal(true);
    }
  };

  // Universal installer
  const installApp = async () => {
    if (isAndroid) {
      await installAndroid();
    } else if (isIOS) {
      installIOS();
    } else {
      setShowGeneralModal(true);
    }
  };

  const openInstallGuide = (platform?: 'ios' | 'android') => {
    if (platform) {
      setModalPlatform(platform);
    } else {
      setModalPlatform(isAndroid ? 'android' : 'ios');
    }
    setShowGeneralModal(true);
  };

  const copyClinicUrl = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText('https://www.thehealth360.in');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIOS,
        isIOSSafari,
        isAndroid,
        installApp,
        installAndroid,
        installIOS,
        openInstallGuide,
      }}
    >
      {children}

      {/* ========================================================================= */}
      {/* 1. SAFARI ANIMATED BOUNCING ARROW OVERLAY (POINTING AT BOTTOM BAR)        */}
      {/* ========================================================================= */}
      {showSafariArrowGuide && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex flex-col justify-end items-center pb-6 sm:pb-8 px-4 animate-in fade-in duration-300"
          onClick={() => setShowSafariArrowGuide(false)}
        >
          {/* Card Above Arrow */}
          <div 
            className="w-full max-w-sm bg-[#0F0E17] border-2 border-[#12D6C4]/50 rounded-3xl p-5 text-white shadow-2xl shadow-[#12D6C4]/30 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Radial Glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-[#0284c7]/25 rounded-full blur-[60px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-white/20">
                  <img src="/icons/icon-192x192.png" alt="Health 360" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white leading-tight">
                    Add to iPhone Screen
                  </h4>
                  <p className="text-[11px] text-[#12D6C4] font-semibold">
                    Follow the arrow below
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSafariArrowGuide(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
                aria-label="Close guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1 Highlight */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#0284c7]/25 to-[#12D6C4]/25 border border-[#12D6C4]/40 mb-2.5">
              <div className="text-[10px] font-black tracking-wider text-[#12D6C4] uppercase mb-1">
                Step 1: Tap Share Icon Below
              </div>
              <p className="text-xs text-white/95 font-medium leading-relaxed">
                Tap the <Share2 className="w-4 h-4 text-[#38bdf8] inline mx-1 align-sub" /> <strong>Share button</strong> in the middle of your Safari bottom bar.
              </p>
            </div>

            {/* Step 2 Highlight */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <div className="text-[10px] font-bold tracking-wider text-white/60 uppercase mb-1">
                Step 2: Add to Home Screen
              </div>
              <p className="text-xs text-white/80 font-medium leading-relaxed">
                Scroll down the menu list and tap <PlusSquare className="w-4 h-4 text-emerald-400 inline mx-1 align-sub" /> <strong>&quot;Add to Home Screen&quot;</strong>.
              </p>
            </div>

            {/* Close / Got it button */}
            <button
              onClick={() => setShowSafariArrowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#12D6C4]" /> Got It, I See The Button
            </button>
          </div>

          {/* Giant Animated Bouncing Arrow directly pointing to the Safari bottom toolbar center */}
          <div className="mt-3 flex flex-col items-center animate-bounce text-[#12D6C4] drop-shadow-[0_0_16px_rgba(18,214,196,0.9)] pointer-events-none">
            <span className="text-[11px] font-black uppercase tracking-widest text-white bg-black/90 px-3.5 py-1.5 rounded-full border border-[#12D6C4] shadow-lg mb-1.5 flex items-center gap-1">
              Tap Share Button Below 👇
            </span>
            <ArrowDown className="w-10 h-10 stroke-[3.5] text-[#12D6C4]" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CHROME-ON-IPHONE SWITCH MODAL (AUTOMATED PROMPT FALLBACK)             */}
      {/* ========================================================================= */}
      {showChromeSwitchModal && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowChromeSwitchModal(false)}
        >
          <div 
            className="w-full max-w-md bg-[#0F0E17] border border-white/10 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-[#0284c7]/20 rounded-full blur-[80px] pointer-events-none" />

            <button
              onClick={() => setShowChromeSwitchModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-lg border border-white/20 flex items-center justify-center shrink-0">
                <img src="/icons/icon-192x192.png" alt="Health 360" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Switching to Safari...
                </h3>
                <p className="text-xs text-[#12D6C4] font-medium">
                  Apple requires Safari to install Home Screen apps
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 leading-relaxed mb-5 space-y-2">
              <p className="flex items-center gap-2 font-bold text-white">
                <Sparkles className="w-4 h-4 text-[#12D6C4]" /> Look for Apple’s prompt on your screen:
              </p>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-center font-semibold text-white/90">
                &ldquo;Open in Safari?&rdquo; &rarr; Tap <span className="text-[#38bdf8] font-bold">&ldquo;Open&rdquo;</span>
              </div>
              <p className="text-white/60 text-[11px]">
                Once Safari opens, an animated arrow will show you exactly where to tap.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <a
                href={typeof window !== 'undefined' ? `x-safari-https://${window.location.host}/?install=ios#download-app` : '#'}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#12D6C4] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-[#0284c7]/25 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> Open in Safari Now
              </a>

              <button
                type="button"
                onClick={copyClinicUrl}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Website Link Copied! Paste in Safari' : 'Or Copy Link to Paste in Safari'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GENERAL MODAL (WITH TABS FOR DESKTOP / MANUAL BROWSING)               */}
      {/* ========================================================================= */}
      {showGeneralModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowGeneralModal(false)}
        >
          <div 
            className="w-full max-w-md bg-[#0F0E17] border border-white/10 rounded-3xl p-6 sm:p-7 text-white shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0284c7]/20 rounded-full blur-[80px] pointer-events-none" />

            <button
              onClick={() => setShowGeneralModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-13 h-13 rounded-2xl bg-white p-1 shadow-lg border border-white/20 flex items-center justify-center shrink-0">
                <img src="/icons/icon-192x192.png" alt="Health 360" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Install Health 360 App
                </h3>
                <p className="text-xs text-[#12D6C4] font-medium">
                  Direct Home Screen App · No Store / APK needed
                </p>
              </div>
            </div>

            {/* Platform Selector Switcher (Tabs) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => setModalPlatform('ios')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  modalPlatform === 'ios'
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Apple className="w-4 h-4" /> iPhone (iOS)
              </button>

              <button
                type="button"
                onClick={() => setModalPlatform('android')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  modalPlatform === 'android'
                    ? 'bg-[#12D6C4]/20 text-[#12D6C4] border border-[#12D6C4]/30 shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <AndroidIcon className="w-3.5 h-3.5" /> Android
              </button>
            </div>

            {/* iOS Instructions */}
            {modalPlatform === 'ios' ? (
              <div className="space-y-3 mb-6">
                <p className="text-xs text-white/70 leading-relaxed">
                  On iPhone, install using <strong>Safari</strong>:
                </p>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-7 h-7 rounded-xl bg-[#0284c7]/20 text-[#0284c7] font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                      Tap the Share button
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-[11px] font-mono">
                        <Share2 className="w-3 h-3 text-[#0284c7] inline mr-1" /> Share
                      </span>
                    </div>
                    <p className="text-white/60">
                      Located in the Safari toolbar at the bottom of your screen.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-7 h-7 rounded-xl bg-[#12D6C4]/20 text-[#12D6C4] font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                      Tap &quot;Add to Home Screen&quot;
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-[11px]">
                        <PlusSquare className="w-3 h-3 text-[#12D6C4] inline mr-1" /> Add
                      </span>
                    </div>
                    <p className="text-white/60">
                      Scroll down the options menu and tap &quot;Add to Home Screen&quot;.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Android Instructions */
              <div className="space-y-3 mb-6">
                <p className="text-xs text-white/70 leading-relaxed">
                  On Android, install in <strong>Google Chrome</strong>:
                </p>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-7 h-7 rounded-xl bg-[#0284c7]/20 text-[#0284c7] font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                      Tap Menu (3 dots)
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-[11px] font-mono">
                        <MoreVertical className="w-3 h-3 text-[#0284c7] inline mr-0.5" /> Menu
                      </span>
                    </div>
                    <p className="text-white/60">
                      Top-right corner of Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-7 h-7 rounded-xl bg-[#12D6C4]/20 text-[#12D6C4] font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                      Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-[11px]">
                        <Download className="w-3 h-3 text-[#12D6C4] inline mr-1" /> Install
                      </span>
                    </div>
                    <p className="text-white/60">
                      The Health 360 icon will be placed directly on your home screen!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGeneralModal(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#12D6C4] hover:opacity-95 text-white font-bold text-xs transition shadow-lg shadow-[#0284c7]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Got It
            </button>
          </div>
        </div>
      )}
    </PWAContext.Provider>
  );
}
