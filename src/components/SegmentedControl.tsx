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
    <div className="flex bg-[#EADFCA] p-1 rounded-xl relative shadow-inner select-none">
      {options.map((option) => {
        const isActive = option.value === activeValue;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 relative cursor-pointer focus:outline-hidden ${
              isActive ? 'text-[#2B2620]' : 'text-[#2B2620]/60 hover:text-[#2B2620]'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-highlight"
                className="absolute inset-0 bg-[#FFFCF6] rounded-lg shadow-sm"
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
