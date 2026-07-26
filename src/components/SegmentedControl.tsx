'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SegmentedControlProps {
  options: { label: string; value: string }[];
  activeValue: string;
  onChange: (value: string) => void;
}

export default function SegmentedControl({
  options,
  activeValue,
  onChange,
}: SegmentedControlProps) {
  return (
    <div className="flex bg-white/[0.06] backdrop-blur-2xl border border-white/15 p-1 rounded-2xl relative shadow-lg select-none">
      {options.map((option) => {
        const isActive = option.value === activeValue;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-colors duration-200 relative cursor-pointer focus:outline-none ${
              isActive ? 'text-black font-bold' : 'text-white/60 hover:text-white'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-highlight"
                className="absolute inset-0 bg-white rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{ zIndex: 0 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
