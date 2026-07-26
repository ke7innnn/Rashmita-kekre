'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PackageMeterProps {
  packageName?: string;
  totalSessions: number;
  sessionsUsed: number;
  expiryDate?: Date | string | null;
  compact?: boolean;
  onConsumeSession?: () => void;
}

export default function PackageMeter({
  packageName = 'Treatment Package',
  totalSessions,
  sessionsUsed,
  expiryDate,
  compact = false,
  onConsumeSession,
}: PackageMeterProps) {
  const remaining = Math.max(0, totalSessions - sessionsUsed);
  const isWarning = remaining === 1;
  const isExhausted = remaining === 0;

  // Check expiry within 7 days
  let daysUntilExpiry: number | null = null;
  if (expiryDate) {
    const exp = new Date(expiryDate);
    const now = new Date();
    const diff = exp.getTime() - now.getTime();
    if (!isNaN(diff)) {
      daysUntilExpiry = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
  }

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;

  if (compact) {
    return (
      <div className="flex items-center gap-2 select-none">
        <div className="flex items-center gap-1">
          {Array.from({ length: totalSessions }).map((_, idx) => {
            const isFilled = idx < sessionsUsed;
            const isLastAvailable = idx === sessionsUsed && isWarning;
            return (
              <motion.div
                key={idx}
                initial={false}
                animate={{
                  backgroundColor: isFilled
                    ? '#12D6C4'
                    : isLastAvailable
                    ? '#FFB454'
                    : 'rgba(255, 255, 255, 0.1)',
                  scale: isFilled ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`h-2.5 w-2.5 rounded-full border ${
                  isFilled
                    ? 'border-[#12D6C4] shadow-[0_0_8px_rgba(18,214,196,0.4)]'
                    : isLastAvailable
                    ? 'border-[#FFB454] shadow-[0_0_8px_rgba(255,180,84,0.4)]'
                    : 'border-white/20'
                }`}
              />
            );
          })}
        </div>
        <span className="text-[10px] font-bold num-tabular text-white/70">
          {remaining} Left
        </span>
      </div>
    );
  }

  return (
    <div className="bg-[#0F0F14] border border-white/12 p-5 rounded-2xl space-y-3.5 select-none relative overflow-hidden">
      {/* Background Ambient Glow for Warning/Status */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none ${
          isExhausted
            ? 'bg-rose-500'
            : isWarning
            ? 'bg-amber-400'
            : 'bg-[#12D6C4]'
        }`}
      />

      <div className="flex justify-between items-start relative z-10">
        <div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 block">
            Prepaid Package Meter
          </span>
          <h4 className="text-sm font-bold text-white mt-0.5">{packageName}</h4>
        </div>

        {/* Counter Badge */}
        <div className="text-right">
          <div className="text-xs font-bold num-tabular text-white">
            <span className="text-[#12D6C4] text-base">{sessionsUsed}</span>
            <span className="text-white/40"> / {totalSessions} Sessions</span>
          </div>
          {isExpiringSoon && (
            <span className="text-[9px] font-semibold text-amber-300 block mt-0.5 num-tabular">
              Expires in {daysUntilExpiry} days
            </span>
          )}
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="grid gap-1.5 pt-1" style={{ gridTemplateColumns: `repeat(${totalSessions}, minmax(0, 1fr))` }}>
        {Array.from({ length: totalSessions }).map((_, idx) => {
          const isFilled = idx < sessionsUsed;
          const isNextWarning = idx === sessionsUsed && isWarning;
          return (
            <div key={idx} className="relative group">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isFilled
                    ? '#12D6C4'
                    : isNextWarning
                    ? '#FFB454'
                    : 'rgba(255, 255, 255, 0.08)',
                  scaleY: isFilled ? 1 : 0.85,
                }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`h-3.5 rounded-md border transition-all ${
                  isFilled
                    ? 'border-[#12D6C4] shadow-[0_0_10px_rgba(18,214,196,0.3)]'
                    : isNextWarning
                    ? 'border-[#FFB454] shadow-[0_0_10px_rgba(255,180,84,0.3)]'
                    : 'border-white/10'
                }`}
              />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold num-tabular bg-black/80 px-1 rounded text-white pointer-events-none">
                #{idx + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status Warning Banner */}
      <div className="flex items-center justify-between pt-1">
        {isExhausted ? (
          <span className="text-[10px] font-bold text-rose-400">
            Package Exhausted • Renewal Recommended
          </span>
        ) : isWarning ? (
          <span className="text-[10px] font-bold text-amber-300 animate-pulse">
            ⚠️ Final Session Remaining
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-white/50 num-tabular">
            {remaining} session{remaining > 1 ? 's' : ''} available
          </span>
        )}

        {onConsumeSession && !isExhausted && (
          <button
            type="button"
            onClick={onConsumeSession}
            className="text-[10px] font-bold text-[#12D6C4] hover:underline cursor-pointer focus:outline-none"
          >
            + Consume Session
          </button>
        )}
      </div>
    </div>
  );
}
