'use client';

import React, { useEffect } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';

export default function CallsRoute() {
  useEffect(() => {
    window.location.replace('https://health360-nu.vercel.app/');
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 select-none">
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[#25D366]">
        <Loader2 className="h-8 w-8 animate-spin text-[#12D6C4]" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold font-serif text-white">Redirecting to Health 360 AI Voice Agent...</h2>
        <p className="text-xs text-white/50">Taking you to https://health360-nu.vercel.app/</p>
      </div>
      <a 
        href="https://health360-nu.vercel.app/" 
        className="px-5 py-2.5 bg-[#12D6C4] hover:bg-[#0FBDAE] text-black font-bold text-xs rounded-xl transition shadow-[0_0_20px_rgba(18,214,196,0.3)] inline-flex items-center gap-2 cursor-pointer"
      >
        <span>Open AI Voice Agent</span>
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
