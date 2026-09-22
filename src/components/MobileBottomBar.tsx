'use client';

import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, Calendar, ArrowRight, Smartphone } from 'lucide-react';

export default function MobileBottomBar() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show bottom bar after scrolling past 150px of the hero section
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const scrolled = window.scrollY > 150;
        // Also check if user is at the very bottom (footer) to prevent covering footer credits
        const nearBottom = 
          window.innerHeight + window.scrollY >= document.body.offsetHeight - 120;
        setIsVisible(scrolled && !nearBottom);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[45] p-3 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div 
        className="max-w-md mx-auto pointer-events-auto bg-[#0F0E17]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex items-center justify-between gap-2"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Quick Contact Chips */}
        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href="tel:+918071583519"
            aria-label="Call Health 360 Clinic"
            className="w-10 h-10 rounded-xl bg-white/10 active:bg-white/20 text-white flex items-center justify-center transition active:scale-90"
            title="Call Clinic"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
          </a>

          <a
            href="https://wa.me/918482812859?text=Hello%20Health%20360,%20I%20would%20like%20to%20book%20a%20physiotherapy%20assessment."
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp Health 360"
            className="w-10 h-10 rounded-xl bg-[#25D366]/15 active:bg-[#25D366]/30 text-[#25D366] flex items-center justify-center transition active:scale-90"
            title="WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>

          <a
            href="/#download-app"
            aria-label="Download Health 360 App"
            className="w-10 h-10 rounded-xl bg-[#0284c7]/15 active:bg-[#0284c7]/30 text-[#0284c7] flex items-center justify-center transition active:scale-90"
            title="Install App"
          >
            <Smartphone className="w-4 h-4" />
          </a>
        </div>

        {/* Primary Action Button: Book Appointment */}
        <a
          href="/#book"
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0284c7] to-[#12D6C4] text-white font-extrabold text-xs tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg shadow-[#0284c7]/30 active:scale-[0.98] transition"
        >
          <Calendar className="w-4 h-4" />
          <span>Book Assessment</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>
    </div>
  );
}
