'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  Apple, 
  Smartphone, 
  Share2, 
  PlusSquare, 
  X, 
  CheckCircle2, 
  Sparkles, 
  MoreVertical,
  Download,
  HelpCircle
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
  const [isAndroid, setIsAndroid] = useState(false);
  const [modalPlatform, setModalPlatform] = useState<'ios' | 'android'>('ios');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }

    // 2. Detect OS accurately
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = 
        /iphone|ipad|ipod/.test(userAgent) || 
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroidDevice = /android/.test(userAgent);
      
      setIsIOS(isIosDevice);
      setIsAndroid(isAndroidDevice);
      if (isAndroidDevice) {
        setModalPlatform('android');
      } else {
        setModalPlatform('ios');
      }

      // Check if already running in standalone PWA app mode
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);

      // 3. Listen to beforeinstallprompt (Android / Chrome native 1-tap)
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

  // Android-specific installation trigger
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
    // If native prompt is not available (e.g. webview, already prompted, or non-Chrome), open the guided modal
    setModalPlatform('android');
    setShowModal(true);
  };

  // iOS-specific installation trigger (Always opens guided 2-tap modal since Apple does not permit JS install prompt)
  const installIOS = () => {
    setModalPlatform('ios');
    setShowModal(true);
  };

  // Universal auto-installer (detects OS and routes appropriately)
  const installApp = async () => {
    if (isAndroid || deferredPrompt) {
      await installAndroid();
    } else {
      installIOS();
    }
  };

  const openInstallGuide = (platform?: 'ios' | 'android') => {
    if (platform) {
      setModalPlatform(platform);
    } else {
      setModalPlatform(isAndroid ? 'android' : 'ios');
    }
    setShowModal(true);
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIOS,
        isAndroid,
        installApp,
        installAndroid,
        installIOS,
        openInstallGuide,
      }}
    >
      {children}

      {/* Guided Install Modal with Tabs for iOS & Android */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-md bg-[#0F0E17] border border-white/10 rounded-3xl p-6 sm:p-7 text-white shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0284c7]/20 rounded-full blur-[80px] pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with App Icon */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-13 h-13 rounded-2xl bg-white p-1 shadow-lg border border-white/20 flex items-center justify-center shrink-0">
                <img 
                  src="/icons/icon-192x192.png" 
                  alt="Health 360 App Icon" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-1.5">
                  Install Health 360 App
                </h3>
                <p className="text-xs text-[#12D6C4] font-medium">
                  Direct Home Screen App · No App Store / APK needed
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
                  Apple requires installing from <strong>Safari</strong> using 2 simple taps:
                </p>

                {/* Step 1 */}
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
                      Located in the Safari toolbar at the bottom of your iPhone.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
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
                  On Android, install instantly in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong>:
                </p>

                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="w-7 h-7 rounded-xl bg-[#0284c7]/20 text-[#0284c7] font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                      Tap the Menu (3 dots)
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 text-[11px] font-mono">
                        <MoreVertical className="w-3 h-3 text-[#0284c7] inline mr-0.5" /> Menu
                      </span>
                    </div>
                    <p className="text-white/60">
                      Located in the top-right corner of Google Chrome.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
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
                      The Health 360 icon will be placed directly in your app drawer &amp; home screen!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dismiss CTA */}
            <button
              onClick={() => setShowModal(false)}
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
