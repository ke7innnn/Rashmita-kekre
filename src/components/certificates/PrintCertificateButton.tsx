'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintCertificateButton({ docHeading }: { docHeading: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(255,255,255,0.4)] cursor-pointer"
    >
      <Printer className="w-3.5 h-3.5" />
      <span>Print / Save PDF</span>
    </button>
  );
}
