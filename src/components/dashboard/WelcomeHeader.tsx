'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkle } from 'lucide-react';
import { Fraunces } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-greeting',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
});

export interface UserSession {
  title?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: 'ADMIN' | 'PHYSIO' | string;
}

export interface WelcomeHeaderProps {
  user?: UserSession;
  contextLine?: string;
  hourOverride?: number; // For testing or SSR sync
}

export default function WelcomeHeader({ user, contextLine, hourOverride }: WelcomeHeaderProps) {
  // Determine time-of-day greeting (client or server override)
  const currentHour = typeof hourOverride === 'number' ? hourOverride : new Date().getHours();

  let salutation = 'Good morning';
  if (currentHour >= 5 && currentHour < 12) {
    salutation = 'Good morning';
  } else if (currentHour >= 12 && currentHour < 17) {
    salutation = 'Good afternoon';
  } else if (currentHour >= 17 && currentHour < 22) {
    salutation = 'Good evening';
  } else {
    salutation = 'Working late';
  }

  // Name construction using First Name (e.g. Dr. Rashmita)
  const title = user?.title || 'Dr.';
  const nameToUse = user?.firstName || (user?.name ? user.name.split(' ')[0] : 'Rashmita');
  const formattedName = `${title} ${nameToUse}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`${fraunces.variable} font-sans flex flex-col items-start space-y-1 py-2 px-1 select-none`}
    >
      {/* Primary Greeting Line */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        {/* Accent Sparkle Icon with Aurora Gradient */}
        <motion.div
          initial={{ scale: 0.5, rotate: -25, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="shrink-0 text-[#19E3B1] p-1 rounded-lg bg-white/5 border border-white/10 shadow-sm"
        >
          <Sparkle className="w-5 h-5 sm:w-6 sm:h-6 text-[#19E3B1]" />
        </motion.div>

        {/* Elegant Serif Greeting */}
        <h1 
          className="text-2xl sm:text-3xl md:text-4xl text-[#F5F3FA] tracking-tight font-normal"
          style={{ fontFamily: 'var(--font-greeting), serif' }}
        >
          {salutation},{' '}
          <span className="italic font-light text-[#FFFFFF] drop-shadow-[0_2px_12px_rgba(255,255,255,0.15)]">
            {formattedName}
          </span>
        </h1>
      </div>

      {/* Dynamic Mono Subtext Line */}
      {contextLine && (
        <p className="font-mono text-xs sm:text-sm text-[#F5F3FA]/50 tracking-wide pl-8 sm:pl-9 pt-0.5">
          {contextLine}
        </p>
      )}
    </motion.div>
  );
}
