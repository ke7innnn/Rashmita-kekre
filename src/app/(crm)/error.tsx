'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Copy, Check, ArrowLeft, Home, ChevronDown, ChevronUp } from 'lucide-react';

export default function CRMErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  useEffect(() => {
    console.error('[CRM Runtime Error Caught by Boundary]:', error);
  }, [error]);

  const copyErrorDetails = () => {
    const errorText = `Health 360 CRM Error Report:
------------------------------------
Time: ${new Date().toISOString()}
Message: ${error?.message || 'Unknown Error'}
Digest: ${error?.digest || 'N/A'}
Stack: ${error?.stack || 'N/A'}
Location: ${typeof window !== 'undefined' ? window.location.href : 'Unknown'}
`;
    navigator.clipboard.writeText(errorText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto my-8 space-y-6 select-none print:hidden">
      <div className="bg-[#120D1F]/90 backdrop-blur-2xl border border-rose-500/30 rounded-3xl p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)] space-y-6">
        {/* Error Header */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-400" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Something Went Wrong</h2>
              <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Application Error
              </span>
            </div>
            <p className="text-xs text-white/60">
              The page encountered an error during rendering. You can review the exact diagnostic details below to report or resolve it.
            </p>
          </div>
        </div>

        {/* Highlighted Error Message Box */}
        <div className="p-4 bg-rose-950/30 border border-rose-500/20 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-rose-300 font-semibold">
            <span>Error Cause</span>
            {error?.digest && (
              <span className="font-mono text-[10px] text-white/40">ID: {error.digest}</span>
            )}
          </div>
          <p className="text-sm font-mono text-rose-200 break-words leading-relaxed">
            {error?.message || 'An unexpected rendering error occurred in this module.'}
          </p>
        </div>

        {/* Collapsible Technical Details for Debugging */}
        <div className="border border-white/10 rounded-2xl bg-black/40 overflow-hidden">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-white/70 hover:text-white transition bg-white/[0.02]"
          >
            <span>Technical Diagnostic Information</span>
            <div className="flex items-center gap-1 text-[11px] text-white/40">
              <span>{showDetails ? 'Hide' : 'Show'} details</span>
              {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showDetails && (
            <div className="p-4 border-t border-white/10 space-y-3 font-mono text-[11px] text-white/70 bg-[#07050C]">
              <div>
                <span className="text-white/40 block text-[10px] uppercase font-sans font-bold">Error Name:</span>
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
                  <pre className="mt-1 p-3 bg-black/60 rounded-xl text-[10px] text-white/60 overflow-x-auto max-h-48 leading-normal border border-white/5">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => reset()}
              className="px-4 py-2.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-white/90 transition flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.25)] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <button
              onClick={copyErrorDetails}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl border border-white/10 transition flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Error Copied!' : 'Copy Error Details'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium rounded-xl transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <Link
              href="/crm360"
              className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium rounded-xl transition flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>CRM Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
