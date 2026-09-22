'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  X, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  HardDrive
} from 'lucide-react';

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  installApp: () => Promise<void>;
  openInstallGuide: () => void;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  isAndroid: false,
  installApp: async () => {},
  openInstallGuide: () => {},
});

export const usePWAInstall = () => useContext(PWAContext);

export function PWAInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }

    // 2. Detect OS
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      const isAndroidDevice = /android/.test(userAgent);
      setIsIOS(isIosDevice);
      setIsAndroid(isAndroidDevice);

      // Check if already in standalone app mode
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);

      // 3. Listen to beforeinstallprompt (Android / Chrome)
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

  const installApp = async () => {
    // A) Android / Chrome with native 1-click beforeinstallprompt
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('Native prompt error:', err);
      }
      return;
    }

    // B) iOS (iPhone / iPad) - open the smart guided modal
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // C) Fallback (Chrome desktop or other browser without deferredPrompt)
    setShowIOSModal(true);
  };

  const openInstallGuide = () => {
    setShowIOSModal(true);
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIOS,
        isAndroid,
        installApp,
        openInstallGuide,
      }}
    >
      {children}

      {/* iOS Guided Install Modal (2-Tap Install Guide) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#0F0E17] border border-white/10 rounded-3xl p-6 sm:p-7 text-white shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0284c7]/20 rounded-full blur-[80px] pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with App Icon */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg border border-white/20 flex items-center justify-center shrink-0">
                <img 
                  src="/icons/icon-192x192.png" 
                  alt="Health 360 App Icon" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Install Health 360 App
                </h3>
                <p className="text-xs text-[#12D6C4] font-medium">
                  {isIOS ? '2 Taps on iPhone · No App Store needed' : 'Add to Mobile Home Screen'}
                </p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed mb-6">
              Install the official Health 360 app directly onto your home screen for instant 1-tap appointments, receipt tracking, and clinic updates.
            </p>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3 mb-6">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-[#0284c7]/20 text-[#0284c7] font-bold text-xs flex items-center justify-center shrink-0">
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
                    Located in the Safari toolbar at the bottom of your iPhone screen.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-xl bg-[#12D6C4]/20 text-[#12D6C4] font-bold text-xs flex items-center justify-center shrink-0">
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
                    Scroll down the options menu and select &quot;Add to Home Screen&quot;.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Button */}
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#12D6C4] hover:opacity-95 text-white font-bold text-xs transition shadow-lg shadow-[#0284c7]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Got It, Show Me
            </button>
          </div>
        </div>
      )}
    </PWAContext.Provider>
  );
}
