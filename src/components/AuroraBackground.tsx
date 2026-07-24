'use client';

import React from 'react';

interface AuroraBackgroundProps {
  className?: string;
}

export default function AuroraBackground({ className = '' }: AuroraBackgroundProps) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[#0A0711]" />

      {/* Aurora drifting blobs with dynamic theme colors */}
      <div 
        className="aurora-drift absolute -top-[20%] -left-[10%] w-[65vw] h-[65vw] max-w-[800px] max-h-[800px] rounded-full blur-[100px] opacity-45 transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, var(--aurora-teal) 0%, rgba(10, 7, 17, 0) 70%)`,
        }}
      />
      <div 
        className="aurora-drift absolute top-[10%] -right-[15%] w-[60vw] h-[60vw] max-w-[750px] max-h-[750px] rounded-full blur-[110px] opacity-35 transition-colors duration-700"
        style={{
          animationDelay: '-8s',
          background: `radial-gradient(circle, var(--aurora-violet) 0%, rgba(10, 7, 17, 0) 70%)`,
        }}
      />
      <div 
        className="aurora-drift absolute -bottom-[20%] left-[20%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full blur-[120px] opacity-30 transition-colors duration-700"
        style={{
          animationDelay: '-16s',
          background: `radial-gradient(circle, var(--aurora-cyan) 0%, rgba(10, 7, 17, 0) 70%)`,
        }}
      />
    </div>
  );
}
