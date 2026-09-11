'use client';

import React, { useState } from 'react';
import { Printer, Download, Loader2 } from 'lucide-react';

export default function PrintCertificateButton({ docHeading }: { docHeading: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      // Grab type + encoded state from current URL
      const url = new URL(window.location.href);
      const pathParts = url.pathname.split('/'); // /certificate/[type]/[patientId]
      const type = pathParts[2] || 'treatment_payment';
      const s = url.searchParams.get('s') || '';

      const pdfUrl = `/api/certificate/pdf?type=${encodeURIComponent(type)}&s=${encodeURIComponent(s)}`;

      const res = await fetch(pdfUrl);
      if (!res.ok) throw new Error('PDF generation failed');

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition if available
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] || `Health360_${type}.pdf`;

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      alert('PDF download failed. Please use Print → Save as PDF instead.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Primary: Real PDF download */}
      <button
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(13,148,136,0.5)] cursor-pointer"
      >
        {downloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{downloading ? 'Generating...' : 'Download PDF'}</span>
      </button>

      {/* Secondary: browser print */}
      <button
        onClick={() => window.print()}
        className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
      >
        <Printer className="w-3.5 h-3.5" />
        <span>Print</span>
      </button>
    </div>
  );
}

