'use client';

import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  accent?: 'teal' | 'violet' | 'magenta' | 'none';
  className?: string;
}

export default function GlassPanel({
  children,
  hoverable = true,
  accent = 'none',
  className = '',
  ...props
}: GlassPanelProps) {
  const getAccentGlow = () => {
    switch (accent) {
      case 'violet':
        return 'hover:border-[rgba(123,92,255,0.3)] hover:shadow-[0_8px_32px_-8px_rgba(123,92,255,0.2)]';
      case 'magenta':
        return 'hover:border-[rgba(226,63,166,0.3)] hover:shadow-[0_8px_32px_-8px_rgba(226,63,166,0.2)]';
      case 'teal':
        return 'hover:border-[rgba(18,214,196,0.3)] hover:shadow-[0_8px_32px_-8px_rgba(18,214,196,0.2)]';
      case 'none':
      default:
        return 'hover:border-[rgba(255,255,255,0.16)] hover:shadow-[0_8px_32px_-8px_rgba(18,214,196,0.15)]';
    }
  };

  const hoverClasses = hoverable
    ? `transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.05)] ${getAccentGlow()}`
    : '';

  return (
    <div
      className={`relative rounded-[18px] bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.25)] text-[#F5F3FA] ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
