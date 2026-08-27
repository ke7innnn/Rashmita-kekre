'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

export default function AssessmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('[Assessment Error Boundary]', error);
  }, [error]);

  return (
    <div className="p-12 text-center text-white/70 space-y-4 max-w-md mx-auto my-12 bg-white/5 border border-white/10 rounded-2xl">
      <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
      <h3 className="text-base font-bold text-white">Assessment Page Error</h3>
      <p className="text-xs text-white/50">{error?.message || 'An unexpected error occurred.'}</p>
      {error?.digest && (
        <p className="text-[10px] font-mono text-white/30">Digest: {error.digest}</p>
      )}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={reset}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Try Again
        </button>
        <Link href="/crm360/assessments" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs transition">
          <span className="flex items-center gap-1.5"><ArrowLeft className="w-3.5 h-3.5" /> Back to List</span>
        </Link>
      </div>
    </div>
  );
}
