'use client';

import React, { useState, useRef } from 'react';
import {
  Download,
  Printer,
  Bold,
  RotateCcw,
  Trash2,
  Sparkles,
  FileCheck2,
  Calendar,
  ZoomIn,
  ZoomOut,
  Eye,
  Edit3,
  Loader2,
  ShieldCheck,
  FileText,
} from 'lucide-react';

function getTodayFormatted(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

const OBSERVERSHIP_SAMPLE_TEMPLATE = `This is to certify that **Miss. [Student Name]** has successfully completed her Physiotherapy observership from **[Start Date] - [End Date]** at Health 360 Physiotherapy and Craniosacral Therapy Clinic.

She is sincere in her duties and able to carry out her responsibilities.`;

function renderFormattedLine(line: string, lineIndex: number) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <React.Fragment key={`t-${lineIndex}-${keyIdx++}`}>
          {line.slice(lastIndex, match.index)}
        </React.Fragment>
      );
    }
    parts.push(
      <strong key={`b-${lineIndex}-${keyIdx++}`} className="font-bold text-[#111827]">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    parts.push(
      <React.Fragment key={`t-${lineIndex}-${keyIdx++}`}>
        {line.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return parts.length > 0 ? parts : line;
}

export default function CustomCertificateStudio() {
  const [date, setDate] = useState<string>(() => getTodayFormatted());
  const [title, setTitle] = useState<string>('CERTIFICATE OF OBSERVERSHIP');
  const [subtitle, setSubtitle] = useState<string>('To Whomsoever It May Concern');
  // Middle body starts completely BLANK as requested
  const [body, setBody] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [includeSignature, setIncludeSignature] = useState<boolean>(true);
  const [includeStamp, setIncludeStamp] = useState<boolean>(true);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(85);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inlineEditing, setInlineEditing] = useState<boolean>(false);

  const sidebarTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const applyBoldToSelection = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const selected = body.slice(start, end);
    const wrapped = selected ? `**${selected}**` : '**bold text**';
    const next = body.slice(0, start) + wrapped + body.slice(end);
    setBody(next);

    requestAnimationFrame(() => {
      el.focus();
      const cursorStart = selected ? start + 2 : start + 2;
      const cursorEnd = selected ? end + 2 : start + 11;
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      setError(null);

      const res = await fetch('/api/certificates/letterhead-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          title,
          subtitle,
          body,
          includeSignature,
          includeStamp,
          filename: filename.trim() || `health360-certificate-${date || 'signed'}`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate PDF');
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const downloadName = match?.[1] || 'health360-certificate.pdf';

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PDF download failed. Please try Print -> Save as PDF.';
      console.error('Certificate download failed:', err);
      setError(message);
    } finally {
      setDownloading(false);
    }
  };

  const handleResetAll = () => {
    setDate(getTodayFormatted());
    setTitle('CERTIFICATE OF OBSERVERSHIP');
    setSubtitle('To Whomsoever It May Concern');
    setBody('');
    setFilename('');
    setIncludeSignature(true);
    setIncludeStamp(true);
    setError(null);
  };

  const bodyLines = body.replace(/\r\n/g, '\n').split('\n');

  return (
    <div className="flex flex-col gap-5 min-h-[calc(100vh-4rem)] print:min-h-0 print:gap-0">
      <style jsx global>{letterheadStyles}</style>

      {/* Top Page Header Bar (hidden on print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-[#22A6AD]/15 border border-[#22A6AD]/35 flex items-center justify-center text-[#22A6AD] shrink-0">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Certificates &amp; Letterhead Studio
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Official Signed
              </span>
            </div>
            <p className="text-xs text-white/55 mt-0.5">
              Fill the blank middle section on the Health 360 signed letterhead and download as a ready-to-share PDF.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom switcher */}
          <div className="hidden xl:flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(60, z - 10))}
              className="p-1.5 text-white/60 hover:text-white rounded-lg cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-white/80 min-w-[44px] text-center">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(115, z + 10))}
              className="p-1.5 text-white/60 hover:text-white rounded-lg cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setPreviewMode(!previewMode);
              setInlineEditing(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
              previewMode
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-white/[0.04] border-white/10 text-white/75 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {previewMode ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{previewMode ? 'Final Preview' : 'Edit Mode'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInlineEditing(false);
              setTimeout(() => window.print(), 50);
            }}
            className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="px-4 py-2 rounded-xl bg-[#22A6AD] hover:bg-[#1d939a] disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_24px_rgba(34,166,173,0.4)] cursor-pointer active:scale-[0.98]"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="print:hidden p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 items-start print:block">
        {/* LEFT PANE: Editor Controls (hidden on print) */}
        <div className="print:hidden w-full lg:w-[370px] xl:w-[400px] shrink-0 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-5 space-y-5 lg:sticky lg:top-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#22A6AD]" />
              <h2 className="text-sm font-bold text-white">Fill Certificate Content</h2>
            </div>
            <button
              type="button"
              onClick={handleResetAll}
              className="text-[11px] font-semibold text-white/55 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 transition cursor-pointer"
              title="Reset to blank certificate"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Primary Editable Section: Middle Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#22A6AD] uppercase tracking-wider">
                Certificate Body (Fillable)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => applyBoldToSelection(sidebarTextareaRef)}
                  className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Wrap selected text in **bold**"
                >
                  <Bold className="w-3 h-3" />
                  Bold
                </button>
                {body.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setBody('')}
                    className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                    title="Clear body text"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              ref={sidebarTextareaRef}
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your certificate text here...&#10;&#10;Tip: Wrap words in **double asterisks** to make them bold (e.g., **Miss. Foram Sanghvi** or **20.03.2026 - 01.06.2026**)."
              className="w-full rounded-2xl bg-black/35 border border-white/15 focus:border-[#22A6AD] focus:ring-1 focus:ring-[#22A6AD]/50 px-3.5 py-3 text-xs text-white placeholder-white/30 leading-relaxed outline-none transition resize-y"
            />

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setBody(OBSERVERSHIP_SAMPLE_TEMPLATE)}
                className="text-[11px] font-semibold text-[#22A6AD] hover:text-[#2ec4cc] bg-[#22A6AD]/10 hover:bg-[#22A6AD]/15 border border-[#22A6AD]/25 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Insert Observership Wording
              </button>
              <span className="text-[10px] text-white/40 font-mono">
                {body.length} chars
              </span>
            </div>
          </div>

          {/* Date & Heading Settings */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Document Header Fields
            </p>

            <div>
              <label className="text-[11px] text-white/65 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#22A6AD]" /> Date
                </span>
                <button
                  type="button"
                  onClick={() => setDate(getTodayFormatted())}
                  className="text-[10px] text-[#22A6AD] hover:underline cursor-pointer"
                >
                  Set Today
                </button>
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="DD.MM.YYYY"
                className="w-full rounded-xl bg-black/30 border border-white/12 focus:border-[#22A6AD] px-3 py-2 text-xs text-white placeholder-white/30 outline-none transition font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/65 block mb-1">Certificate Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="CERTIFICATE OF OBSERVERSHIP"
                className="w-full rounded-xl bg-black/30 border border-white/12 focus:border-[#22A6AD] px-3 py-2 text-xs text-white placeholder-white/30 outline-none transition"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/65 block mb-1">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="To Whomsoever It May Concern"
                className="w-full rounded-xl bg-black/30 border border-white/12 focus:border-[#22A6AD] px-3 py-2 text-xs text-white placeholder-white/30 outline-none transition"
              />
            </div>

            <div>
              <label className="text-[11px] text-white/65 block mb-1">
                Download Filename <span className="text-white/35">(optional)</span>
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g. observership-certificate-name"
                className="w-full rounded-xl bg-black/30 border border-white/12 focus:border-[#22A6AD] px-3 py-2 text-xs text-white placeholder-white/30 outline-none transition"
              />
            </div>
          </div>

          {/* Signature & Stamp Toggles */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSignature}
                onChange={(e) => setIncludeSignature(e.target.checked)}
                className="accent-[#22A6AD] w-3.5 h-3.5 rounded cursor-pointer"
              />
              <span>Doctor Signature</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeStamp}
                onChange={(e) => setIncludeStamp(e.target.checked)}
                className="accent-[#22A6AD] w-3.5 h-3.5 rounded cursor-pointer"
              />
              <span>Clinic Stamp</span>
            </label>
          </div>
        </div>

        {/* RIGHT PANE: Live A4 Letterhead Paper Preview */}
        <div className="flex-1 w-full flex flex-col items-center overflow-x-auto pb-8 print:overflow-visible print:pb-0">
          <div className="print:hidden w-full max-w-[210mm] mb-2.5 flex items-center justify-between text-[11px] text-white/45 px-1">
            <span>
              Click directly on the blank middle area on the sheet or type in the left editor.
            </span>
            <span className="font-mono text-[10px] text-white/35">A4 · 210 × 297 mm</span>
          </div>

          <div
            className="lh-scale-wrapper origin-top transition-transform duration-150 print:!transform-none"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            {/* OFFICIAL A4 LETTERHEAD SHEET */}
            <div className="lh-page">
              {/* 1. FIXED HEADER (Exact replica of Health 360 signed letterhead) */}
              <div className="lh-header">
                <div className="lh-logo-col">
                  <img
                    src="/logo-new.png"
                    alt="Health 360 Physiotherapy and Craniosacral Therapy Clinic"
                    className="lh-logo-img"
                  />
                </div>

                <div className="lh-doctor-col">
                  <div className="lh-doc-name">Dr. Rashmita Karvir Kekre</div>
                  <div className="lh-doc-cred">B.P.Th. (M.I.A.P.)</div>
                  <div className="lh-doc-cred">BCST</div>

                  <div className="lh-contact-list">
                    <div className="lh-contact-row">
                      <span>8482812859</span>
                      <span className="lh-icon-cell" aria-hidden="true">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="11" fill="#22A6AD" />
                          <path
                            d="M8.8 7.6c.4-.4 1-.4 1.4 0l1.2 1.2c.3.3.4.8.2 1.2l-.7 1.3c.6 1 1.4 1.8 2.4 2.4l1.3-.7c.4-.2.9-.1 1.2.2l1.2 1.2c.4.4.4 1 0 1.4l-.8.8c-.7.7-1.7.9-2.6.6-2.9-1-5.8-3.9-6.8-6.8-.3-.9-.1-1.9.6-2.6l.4-.2z"
                            fill="#FFFFFF"
                          />
                        </svg>
                      </span>
                    </div>

                    <div className="lh-contact-row">
                      <span>rashmita.karvir@gmail.com</span>
                      <span className="lh-icon-cell" aria-hidden="true">
                        <svg width="15" height="12" viewBox="0 0 24 18" fill="none">
                          <rect x="1" y="1" width="22" height="16" rx="2.5" fill="#22A6AD" />
                          <path
                            d="M2.5 3L12 10.2L21.5 3"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>

                    <div className="lh-contact-row lh-address-row">
                      <div className="lh-address-lines">
                        <div>Shop no. 1 &amp; 2, Shree Amardeep Enclave</div>
                        <div>Om Nagar, Vasai West</div>
                      </div>
                      <span className="lh-icon-cell" aria-hidden="true">
                        <svg width="15" height="17" viewBox="0 0 24 28" fill="none">
                          <path
                            d="M12 1C6.5 1 2 5.5 2 11c0 7.2 10 16 10 16s10-8.8 10-16c0-5.5-4.5-10-10-10z"
                            fill="#22A6AD"
                          />
                          <circle cx="12" cy="10.5" r="3.6" fill="#FFFFFF" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DATE ROW */}
              <div className="lh-date-row">
                <span className="lh-date-label">Date:</span>
                <span className="lh-date-value">{date}</span>
              </div>

              {/* 3. TITLE & SUBTITLE */}
              <div className="lh-title-block">
                {title.trim() && (
                  <>
                    <h1 className="lh-title">{title.toUpperCase()}</h1>
                    <div className="lh-title-rule" />
                  </>
                )}
                {subtitle.trim() && <p className="lh-subtitle">{subtitle}</p>}
              </div>

              {/* 4. EDITABLE MIDDLE CONTENT AREA (Blank by default!) */}
              <div
                className={`lh-body-zone ${
                  !previewMode ? 'lh-body-zone-editable' : ''
                }`}
                onClick={() => {
                  if (!previewMode && !inlineEditing) {
                    setInlineEditing(true);
                    requestAnimationFrame(() => inlineTextareaRef.current?.focus());
                  }
                }}
              >
                {!previewMode && inlineEditing ? (
                  <textarea
                    ref={inlineTextareaRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onBlur={() => setInlineEditing(false)}
                    rows={Math.max(6, bodyLines.length + 1)}
                    placeholder="Type certificate content here... Use **word** for bold."
                    className="lh-inline-textarea"
                  />
                ) : body.trim().length > 0 ? (
                  <div className="lh-rendered-body">
                    {bodyLines.map((line, idx) =>
                      line.trim() === '' ? (
                        <div key={idx} className="h-3.5" />
                      ) : (
                        <p key={idx} className="lh-body-para">
                          {renderFormattedLine(line, idx)}
                        </p>
                      )
                    )}
                  </div>
                ) : (
                  <div className="lh-blank-placeholder print:hidden">
                    {!previewMode ? (
                      <span>
                        Blank fillable area — click here or type in the left panel to add certificate text...
                      </span>
                    ) : (
                      <span className="opacity-0">.</span>
                    )}
                  </div>
                )}
              </div>

              {/* 5. FIXED SIGNATORY & STAMP BLOCK */}
              <div className="lh-signatory">
                <div className="lh-sincerely">Sincerely,</div>

                <div className="lh-sig-area">
                  {includeSignature && (
                    <img
                      src="/signatures/dr-rashmita-signature.png"
                      alt="Dr. Rashmita Karvir-Kekre Signature"
                      className="lh-sig-img"
                    />
                  )}
                  <div className="lh-sig-line" />
                </div>

                <div className="lh-sig-name">Dr. Rashmita Karvir-Kekre (PT)</div>
                <div className="lh-sig-clinic">
                  Health 360 Physiotherapy &amp; Craniosacral Therapy Clinic
                </div>

                {includeStamp && (
                  <div className="lh-stamp-wrap">
                    <img
                      src="/signatures/dr-rashmita-stamp.png"
                      alt="Dr. Rashmita Karvir-Kekre Registration Stamp"
                      className="lh-stamp-img"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const letterheadStyles = `
.lh-page {
  width: 210mm;
  min-height: 297mm;
  background: #ffffff !important;
  color: #111827 !important;
  padding: 13mm 15mm 16mm 15mm;
  box-sizing: border-box;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.75);
  border-radius: 4px;
  font-family: Helvetica, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
  position: relative;
}

.lh-page * {
  font-family: Helvetica, Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
}

.lh-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12mm;
}

.lh-logo-col {
  flex-shrink: 0;
  padding-top: 1mm;
}

.lh-logo-img {
  width: 52mm;
  height: auto;
  object-fit: contain;
  display: block;
}

.lh-doctor-col {
  text-align: right;
  flex: 1;
  padding-top: 3mm;
}

.lh-doc-name {
  font-size: 13pt;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
  padding-right: 7mm;
}

.lh-doc-cred {
  font-size: 10.5pt;
  font-weight: 400;
  color: #1f2937;
  line-height: 1.35;
  padding-right: 7mm;
}

.lh-contact-list {
  margin-top: 4mm;
  display: flex;
  flex-direction: column;
  gap: 1.6mm;
}

.lh-contact-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2.5mm;
  font-size: 10pt;
  font-weight: 700;
  color: #111827;
  line-height: 1.35;
}

.lh-address-row {
  align-items: center;
}

.lh-address-lines {
  text-align: right;
  line-height: 1.4;
}

.lh-icon-cell {
  width: 4.5mm;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lh-date-row {
  margin-top: 9mm;
  display: flex;
  align-items: baseline;
  gap: 2.5mm;
  font-size: 10pt;
}

.lh-date-label {
  font-weight: 700;
  color: #111827;
}

.lh-date-value {
  display: inline-block;
  min-width: 44mm;
  padding: 0 2mm 0.8mm 1.5mm;
  border-bottom: 0.75pt solid #9ca3af;
  color: #1f2937;
  font-weight: 400;
}

.lh-title-block {
  margin-top: 10mm;
  text-align: center;
}

.lh-title {
  font-size: 13pt;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #111827;
  margin: 0;
  text-transform: uppercase;
}

.lh-title-rule {
  width: 102mm;
  height: 0.9pt;
  background: #22a6ad;
  margin: 2.5mm auto 2.5mm auto;
}

.lh-subtitle {
  font-size: 9.5pt;
  font-weight: 400;
  color: #6b7280;
  margin: 0;
}

.lh-body-zone {
  margin-top: 11mm;
  min-height: 36mm;
  position: relative;
}

.lh-body-zone-editable {
  border-radius: 6px;
  padding: 3mm 3.5mm;
  margin-left: -3.5mm;
  margin-right: -3.5mm;
  border: 1.5px dashed rgba(34, 166, 173, 0.35);
  background: rgba(34, 166, 173, 0.03);
  cursor: text;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.lh-body-zone-editable:hover {
  border-color: rgba(34, 166, 173, 0.75);
  background: rgba(34, 166, 173, 0.06);
}

.lh-inline-textarea {
  width: 100%;
  min-height: 34mm;
  background: transparent;
  border: none;
  outline: none;
  resize: vertical;
  font-size: 10.5pt;
  line-height: 1.65;
  color: #111827;
}

.lh-rendered-body {
  font-size: 10.5pt;
  line-height: 1.65;
  color: #111827;
  white-space: pre-wrap;
}

.lh-body-para {
  margin: 0 0 2mm 0;
}

.lh-blank-placeholder {
  min-height: 32mm;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 9.5pt;
  color: #94a3b8;
  font-style: italic;
  padding: 4mm;
}

.lh-signatory {
  margin-top: 12mm;
}

.lh-sincerely {
  font-size: 10.5pt;
  color: #111827;
  margin-bottom: 4mm;
}

.lh-sig-area {
  width: 62mm;
  min-height: 19mm;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.lh-sig-img {
  height: 18mm;
  width: auto;
  max-width: 46mm;
  object-fit: contain;
  margin-bottom: -1.5mm;
  display: block;
}

.lh-sig-line {
  width: 62mm;
  height: 0.9pt;
  background: #374151;
}

.lh-sig-name {
  margin-top: 2mm;
  font-size: 10pt;
  font-weight: 700;
  color: #111827;
}

.lh-sig-clinic {
  margin-top: 0.6mm;
  font-size: 9.5pt;
  font-weight: 400;
  color: #374151;
}

.lh-stamp-wrap {
  margin-top: 5mm;
}

.lh-stamp-img {
  width: 52mm;
  height: auto;
  object-fit: contain;
  display: block;
}

@media print {
  @page {
    size: A4 portrait;
    margin: 0;
  }
  .lh-page {
    box-shadow: none !important;
    border-radius: 0 !important;
    margin: 0 !important;
    width: 210mm !important;
    min-height: 297mm !important;
    page-break-after: avoid;
  }
  .lh-body-zone-editable {
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}
`;

