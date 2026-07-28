'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

interface CourseMeterProps {
  daysPurchased: number;
  sessionsUsed: number;
  expiryDate?: string | Date | null;
  planName?: string;
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

export default function CourseMeter({
  daysPurchased,
  sessionsUsed,
  expiryDate,
  planName = 'Treatment Course',
  compact = false,
  showDetails = true,
  className = ''
}: CourseMeterProps) {
  const total = Math.max(1, daysPurchased);
  const used = Math.min(total, Math.max(0, sessionsUsed));
  const remaining = Math.max(0, total - used);
  const isLastSession = remaining === 1;
  const isExhausted = remaining === 0;

  // Check expiry countdown (warning at 14 days, escalating at 7)
  let daysToExpiry: number | null = null;
  let isExpiringWarning = false;
  let isExpiringCritical = false;

  if (expiryDate && remaining > 0) {
    const exp = new Date(expiryDate);
    const now = new Date();
    daysToExpiry = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    if (daysToExpiry > 0 && daysToExpiry <= 7) {
      isExpiringCritical = true;
    } else if (daysToExpiry > 0 && daysToExpiry <= 14) {
      isExpiringWarning = true;
    }
  }

  // Motion duration standard
  const transitionDuration = 0.5; // ~500ms

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header Info */}
      {showDetails && (
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
              {planName}
            </span>
            {isLastSession && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" /> Final Session Remaining
              </span>
            )}
            {isExpiringCritical && daysToExpiry !== null && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse">
                <Clock className="w-3 h-3" /> {remaining} {remaining === 1 ? 'day' : 'days'} unused, expires in {daysToExpiry} {daysToExpiry === 1 ? 'day' : 'days'}
              </span>
            )}
            {isExpiringWarning && !isExpiringCritical && daysToExpiry !== null && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" /> {remaining} {remaining === 1 ? 'day' : 'days'} unused, expires in {daysToExpiry} {daysToExpiry === 1 ? 'day' : 'days'}
              </span>
            )}
            {isExhausted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/60 border border-white/20 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Course Completed
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-sm font-bold tabular-nums text-white">
              {used} <span className="text-white/40 font-normal">/ {total} days</span>
            </span>
          </div>
        </div>
      )}

      {/* Segmented Bar */}
      <div className={`grid gap-1.5 w-full ${compact ? 'h-2' : 'h-3'}`} style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {Array.from({ length: total }).map((_, index) => {
          const isFilled = index < used;
          const isCurrentSegment = index === used - 1;

          let segmentBg = 'bg-white/10 border-white/10';
          if (isFilled) {
            if (isLastSession && isCurrentSegment) {
              segmentBg = 'bg-amber-400 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.5)]';
            } else {
              segmentBg = 'bg-white border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]';
            }
          }

          return (
            <motion.div
              key={index}
              className={`rounded-md border ${segmentBg} transition-colors duration-300`}
              initial={{ scaleY: 0.8, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{
                delay: isFilled ? index * 0.03 : 0,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
