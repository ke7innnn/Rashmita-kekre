'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Copy, Check, Home, ChevronDown, ChevronUp } from 'lucide-react';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    console.error('[Global Error Boundary]:', error);
  }, [error]);

  const copyErrorDetails = () => {
    const errorText = `Health 360 System Error:
-------------------------
Time: ${new Date().toISOString()}
Message: ${error?.message || 'Unknown Error'}
Digest: ${error?.digest || 'N/A'}
Stack: ${error?.stack || 'N/A'}
Location: ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}
`;
    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#07050C] text-white flex items-center justify-center p-6">
      <div className="bg-[#120D1F] border border-rose-500/30 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-[0_10px_50px_rgba(0,0,0,0.8)] space-y-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">System Notice</h2>
              <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Error Caught
              </span>
            </div>
            <p className="text-xs text-white/60">
              An unexpected error occurred while loading this page. Technical diagnostics are provided below.
            </p>
          </div>
        </div>

        {/* Error message box */}
        <div className="p-4 bg-rose-950/40 border border-rose-500/20 rounded-2xl space-y-1.5">
          <span className="text-[11px] font-semibold text-rose-300 block">Error Message:</span>
          <p className="text-sm font-mono text-rose-100 break-words leading-relaxed">
            {error?.message || 'An unexpected error occurred.'}
          </p>
        </div>

        {/* Diagnostic details */}
        <div className="border border-white/10 rounded-2xl bg-black/50 overflow-hidden">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-white/70 hover:text-white transition bg-white/[0.02]"
          >
            <span>Diagnostics & Stack Trace</span>
            <div className="flex items-center gap-1 text-[11px] text-white/40">
              <span>{showDetails ? 'Hide' : 'Show'}</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showDetails && (
            <div className="p-4 border-t border-white/10 space-y-3 font-mono text-[11px] text-white/70 bg-[#07050C]">
              <div>
                <span className="text-white/40 block text-[10px] uppercase font-sans font-bold">Name:</span>
                <span className="text-amber-300">{error?.name || 'Error'}</span>
              </div>
              {error?.digest && (
                <div>
                  <span className="text-white/40 block text-[10px] uppercase font-sans font-bold">Next.js Digest:</span>
                  <span className="text-sky-300">{error.digest}</span>
                </div>
              )}
              {error?.stack && (
                <div>
                  <span className="text-white/40 block text-[10px] uppercase font-sans font-bold">Stack Trace:</span>
                  <pre className="mt-1 p-3 bg-black/70 rounded-xl text-[10px] text-white/60 overflow-x-auto max-h-48 leading-normal border border-white/5">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => reset()}
              className="px-4 py-2.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-white/90 transition flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.25)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Page</span>
            </button>
            <button
              onClick={copyErrorDetails}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl border border-white/10 transition flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Diagnostics'}</span>
            </button>
          </div>

          <Link
            href="/crm360"
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-xl transition flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
