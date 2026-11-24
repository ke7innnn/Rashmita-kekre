'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Save,
  Check,
  Cloud,
  FolderOpen,
  Plus,
  Clock,
} from 'lucide-react';

interface SavedCertificateRecord {
  id: string;
  label: string;
  date: string;
  title: string;
  subtitle: string;
  body: string;
  filename: string;
  includeSignature: boolean;
  includeStamp: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DraftState {
  activeId: string | null;
  label: string;
  date: string;
  title: string;
  subtitle: string;
  body: string;
  filename: string;
  includeSignature: boolean;
  includeStamp: boolean;
  savedAt: number;
}

const DRAFT_STORAGE_KEY = 'health360_letterhead_cert_draft_v1';
const SAVED_CACHE_KEY = 'health360_letterhead_cert_saved_v1';

// A4 dimensions at 96dpi (210mm x 297mm)
const A4_WIDTH_PX = 794;
const A4_MIN_HEIGHT_PX = 1123;

function getTodayFormatted(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

const OBSERVERSHIP_SAMPLE_TEMPLATE = `This is to certify that **Miss. [Student Name]** has successfully completed her Physiotherapy observership from **[Start Date] - [End Date]** at Health 360 Physiotherapy and Craniosacral Therapy Clinic.

She is sincere in her duties and able to carry out her responsibilities.`;

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [label, setLabel] = useState<string>('');
  const [date, setDate] = useState<string>(() => getTodayFormatted());
  const [title, setTitle] = useState<string>('CERTIFICATE OF OBSERVERSHIP');
  const [subtitle, setSubtitle] = useState<string>('To Whomsoever It May Concern');
  // Middle body starts completely BLANK unless restored from saved draft
  const [body, setBody] = useState<string>('');
  const [filename, setFilename] = useState<string>('');
  const [includeSignature, setIncludeSignature] = useState<boolean>(true);
  const [includeStamp, setIncludeStamp] = useState<boolean>(true);

  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [inlineEditing, setInlineEditing] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [savingToCloud, setSavingToCloud] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Mobile view switcher ('edit' | 'preview' | 'saved') & desktop left tab ('edit' | 'saved')
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview' | 'saved'>('edit');
  const [desktopSideTab, setDesktopSideTab] = useState<'edit' | 'saved'>('edit');

  // Saved certificates history
  const [savedList, setSavedList] = useState<SavedCertificateRecord[]>([]);
  const [loadingSaved, setLoadingSaved] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Responsive A4 scaling
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(794);
  const [pageNaturalHeight, setPageNaturalHeight] = useState<number>(A4_MIN_HEIGHT_PX);
  const [zoomMode, setZoomMode] = useState<'fit' | number>('fit');

  const sidebarTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hydratedRef = useRef<boolean>(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Hydrate active draft & cached saved list on mount
  useEffect(() => {
    try {
      const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft) as DraftState;
        if (parsed && typeof parsed === 'object') {
          setActiveId(parsed.activeId ?? null);
          setLabel(parsed.label ?? '');
          setDate(parsed.date ?? getTodayFormatted());
          setTitle(parsed.title ?? 'CERTIFICATE OF OBSERVERSHIP');
          setSubtitle(parsed.subtitle ?? 'To Whomsoever It May Concern');
          setBody(parsed.body ?? '');
          setFilename(parsed.filename ?? '');
          setIncludeSignature(parsed.includeSignature !== false);
          setIncludeStamp(parsed.includeStamp !== false);
        }
      }
      const rawSaved = localStorage.getItem(SAVED_CACHE_KEY);
      if (rawSaved) {
        const cached = JSON.parse(rawSaved) as SavedCertificateRecord[];
        if (Array.isArray(cached)) {
          setSavedList(cached);
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      hydratedRef.current = true;
    }
  }, []);

  // 2. Fetch cloud-saved certificates from DB
  const fetchSavedCertificates = useCallback(async () => {
    try {
      setLoadingSaved(true);
      const res = await fetch('/api/certificates/saved', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.certificates)) {
          setSavedList(data.certificates);
          try {
            localStorage.setItem(SAVED_CACHE_KEY, JSON.stringify(data.certificates));
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // fallback to localStorage cache
    } finally {
      setLoadingSaved(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedCertificates();
  }, [fetchSavedCertificates]);

  // 3. Auto-save active draft to localStorage (debounced 400ms)
  useEffect(() => {
    if (!hydratedRef.current) return;
    setDraftStatus('saving');
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);

    draftTimerRef.current = setTimeout(() => {
      try {
        const draft: DraftState = {
          activeId,
          label,
          date,
          title,
          subtitle,
          body,
          filename,
          includeSignature,
          includeStamp,
          savedAt: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setDraftStatus('saved');
      } catch {
        setDraftStatus('idle');
      }
    }, 400);

    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [activeId, label, date, title, subtitle, body, filename, includeSignature, includeStamp]);

  // 4. Observe preview container width & A4 sheet height for responsive scaling without overflow
  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const w = container.clientWidth;
      if (w > 0) setContainerWidth(w);
    };
    updateWidth();

    const ro = new ResizeObserver(updateWidth);
    ro.observe(container);
    return () => ro.disconnect();
  }, [mobileTab]);

  useEffect(() => {
    const pageEl = pageRef.current;
    if (!pageEl) return;

    const updateHeight = () => {
      const h = pageEl.scrollHeight;
      if (h > 0) setPageNaturalHeight(Math.max(A4_MIN_HEIGHT_PX, h));
    };
    updateHeight();

    const ro = new ResizeObserver(updateHeight);
    ro.observe(pageEl);
    return () => ro.disconnect();
  }, [body, title, subtitle, includeSignature, includeStamp, mobileTab]);

  const fitScale = Math.min(1, Math.max(0.32, (containerWidth - 8) / A4_WIDTH_PX));
  const effectiveScale = zoomMode === 'fit' ? fitScale : zoomMode / 100;
  const scaledWidthPx = Math.round(A4_WIDTH_PX * effectiveScale);
  const scaledHeightPx = Math.round(pageNaturalHeight * effectiveScale);

  const flashToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 2600);
  };

  // Save to cloud DB (+ mirror in localStorage cache)
  const saveCertificateToLibrary = async (silent = false): Promise<SavedCertificateRecord | null> => {
    try {
      setSavingToCloud(true);
      setError(null);

      const res = await fetch('/api/certificates/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeId || undefined,
          label: label.trim() || undefined,
          date,
          title,
          subtitle,
          body,
          filename,
          includeSignature,
          includeStamp,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const saved = data.certificate as SavedCertificateRecord;
        if (saved) {
          setActiveId(saved.id);
          setLabel(saved.label);
          setSavedList((prev) => {
            const next = [saved, ...prev.filter((item) => item.id !== saved.id)];
            try {
              localStorage.setItem(SAVED_CACHE_KEY, JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });
          if (!silent) flashToast(activeId ? 'Saved changes updated' : 'Certificate saved to CRM');
          return saved;
        }
      }
      throw new Error('Could not save to server');
    } catch {
      // Offline / DB fallback: persist cleanly in localStorage saved list
      const fallbackId = activeId || `local-${Date.now()}`;
      const nowIso = new Date().toISOString();
      const derivedLabel =
        label.trim() ||
        filename.trim() ||
        body.replace(/\*\*/g, '').trim().split('\n')[0]?.slice(0, 60) ||
        `${title || 'Certificate'} · ${date}`;

      const localRec: SavedCertificateRecord = {
        id: fallbackId,
        label: derivedLabel,
        date,
        title,
        subtitle,
        body,
        filename,
        includeSignature,
        includeStamp,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setActiveId(fallbackId);
      setLabel(derivedLabel);
      setSavedList((prev) => {
        const next = [localRec, ...prev.filter((item) => item.id !== fallbackId)];
        try {
          localStorage.setItem(SAVED_CACHE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      if (!silent) flashToast('Saved locally on this device');
      return localRec;
    } finally {
      setSavingToCloud(false);
    }
  };

  const handleLoadSaved = (rec: SavedCertificateRecord) => {
    setActiveId(rec.id);
    setLabel(rec.label || '');
    setDate(rec.date || getTodayFormatted());
    setTitle(rec.title || 'CERTIFICATE OF OBSERVERSHIP');
    setSubtitle(rec.subtitle || 'To Whomsoever It May Concern');
    setBody(rec.body || '');
    setFilename(rec.filename || '');
    setIncludeSignature(rec.includeSignature !== false);
    setIncludeStamp(rec.includeStamp !== false);
    setError(null);
    setMobileTab('edit');
    setDesktopSideTab('edit');
    flashToast(`Loaded "${rec.label}"`);
  };

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      if (!id.startsWith('local-')) {
        await fetch(`/api/certificates/saved?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      }
      setSavedList((prev) => {
        const next = prev.filter((item) => item.id !== id);
        try {
          localStorage.setItem(SAVED_CACHE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      if (activeId === id) {
        setActiveId(null);
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleStartNewBlank = () => {
    setActiveId(null);
    setLabel('');
    setDate(getTodayFormatted());
    setTitle('CERTIFICATE OF OBSERVERSHIP');
    setSubtitle('To Whomsoever It May Concern');
    setBody('');
    setFilename('');
    setIncludeSignature(true);
    setIncludeStamp(true);
    setError(null);
    setMobileTab('edit');
    setDesktopSideTab('edit');
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
    flashToast('Started new blank certificate');
  };

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
      const cursorStart = start + 2;
      const cursorEnd = selected ? end + 2 : start + 11;
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      setError(null);

      // Automatically save filled certificate to CRM history on download
      if (body.trim().length > 0) {
        await saveCertificateToLibrary(true);
      }

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
          filename: filename.trim() || label.trim() || `health360-certificate-${date || 'signed'}`,
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

      if (body.trim().length > 0) {
        flashToast('Saved & downloaded PDF');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'PDF download failed. Please try Print -> Save as PDF.';
      console.error('Certificate download failed:', err);
      setError(message);
    } finally {
      setDownloading(false);
    }
  };

  const bodyLines = body.replace(/\r\n/g, '\n').split('\n');

  // Reusable Saved List panel (used on both mobile 'saved' tab and desktop left panel)
  const renderSavedLibrary = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white/80">
          Saved Certificates ({savedList.length})
        </span>
        <button
          type="button"
          onClick={handleStartNewBlank}
          className="px-2.5 py-1.5 rounded-xl bg-[#22A6AD]/15 hover:bg-[#22A6AD]/25 border border-[#22A6AD]/35 text-[#22A6AD] text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Blank
        </button>
      </div>

      {loadingSaved && savedList.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-white/45 gap-2 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-[#22A6AD]" />
          <span>Loading saved certificates...</span>
        </div>
      ) : savedList.length === 0 ? (
        <div className="py-10 px-4 text-center rounded-2xl bg-black/25 border border-dashed border-white/10 space-y-2">
          <FolderOpen className="w-7 h-7 text-white/25 mx-auto" />
          <p className="text-xs font-semibold text-white/70">No saved certificates yet</p>
          <p className="text-[11px] text-white/45 leading-relaxed">
            Fill the middle section and tap <strong>Save</strong> or <strong>Download PDF</strong> — it will be stored here and synced across mobile &amp; PC.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[55vh] lg:max-h-[60vh] overflow-y-auto pr-0.5">
          {savedList.map((rec) => {
            const isSelected = activeId === rec.id;
            const snippet = rec.body.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
            return (
              <div
                key={rec.id}
                onClick={() => handleLoadSaved(rec)}
                className={`p-3 rounded-2xl border transition cursor-pointer group ${
                  isSelected
                    ? 'bg-[#22A6AD]/15 border-[#22A6AD]/45'
                    : 'bg-black/25 border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white truncate">{rec.label}</p>
                      {isSelected && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#22A6AD]/25 text-[#22A6AD] shrink-0">
                          Editing
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/45 mt-0.5 flex items-center gap-1.5">
                      <span>{rec.title || 'Certificate'}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {rec.date || formatShortDate(rec.updatedAt)}
                      </span>
                    </p>
                    {snippet && (
                      <p className="text-[11px] text-white/60 mt-1.5 line-clamp-2 leading-relaxed">
                        {snippet}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSaved(rec.id, e)}
                    disabled={deletingId === rec.id}
                    className="p-1.5 rounded-lg text-white/35 hover:text-rose-400 hover:bg-rose-500/15 transition shrink-0 cursor-pointer"
                    title="Delete saved certificate"
                  >
                    {deletingId === rec.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Reusable Editor Form
  const renderEditorForm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-[#22A6AD] shrink-0" />
          <h2 className="text-sm font-bold text-white truncate">
            {activeId ? 'Editing Saved Certificate' : 'New Blank Certificate'}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {draftStatus === 'saved' && (
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Cloud className="w-2.5 h-2.5" /> Auto-saved
            </span>
          )}
          <button
            type="button"
            onClick={handleStartNewBlank}
            className="text-[11px] font-semibold text-white/60 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1 transition cursor-pointer"
            title="Start a fresh blank certificate"
          >
            <RotateCcw className="w-3 h-3" />
            New
          </button>
        </div>
      </div>

      {/* Primary Editable Section: Middle Body */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-bold text-[#22A6AD] uppercase tracking-wider">
            Certificate Body (Fillable)
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyBoldToSelection(sidebarTextareaRef)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.15] border border-white/12 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Wrap selected text in **bold**"
            >
              <Bold className="w-3 h-3" />
              Bold
            </button>
            {body.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setBody('')}
                className="px-2 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
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
          rows={7}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type your certificate text here...&#10;&#10;Tip: Wrap words in **double asterisks** for bold (e.g., **Miss. Foram Sanghvi** or **20.03.2026 - 01.06.2026**)."
          className="w-full rounded-2xl bg-black/35 border border-white/15 focus:border-[#22A6AD] focus:ring-1 focus:ring-[#22A6AD]/50 px-3.5 py-3 text-sm sm:text-xs text-white placeholder-white/30 leading-relaxed outline-none transition resize-y"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
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

      {/* Document Details */}
      <div className="space-y-3 pt-3 border-t border-white/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Document Header &amp; Save Name
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
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
              className="w-full rounded-xl bg-black/30 border border-white/12 focus:border-[#22A6AD] px-3 py-2.5 sm:py-2 text-sm sm:text-xs text-white placeholder-white/30 outline-none transition font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] text-white/65 block mb-1">
              Save As / Recipient Name <span className="text-white/35">(optional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Foram Sanghvi - Observership"
              className="w-full rounded-xl bg-black/30 border border-white/12 focus:border-[#22A6AD] px-3 py-2.5 sm:py-2 text-sm sm:text-xs text-white placeholder-white/30 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-white/65 block mb-1">Certificate Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="CERTIFICATE OF OBSERVERSHIP"
            className="w-full rounded-xl bg-black/30 border border-white/12 focus:border-[#22A6AD] px-3 py-2.5 sm:py-2 text-sm sm:text-xs text-white placeholder-white/30 outline-none transition"
          />
        </div>

        <div>
          <label className="text-[11px] text-white/65 block mb-1">Subtitle</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="To Whomsoever It May Concern"
            className="w-full rounded-xl bg-black/30 border border-white/12 focus:border-[#22A6AD] px-3 py-2.5 sm:py-2 text-sm sm:text-xs text-white placeholder-white/30 outline-none transition"
          />
        </div>

        <div>
          <label className="text-[11px] text-white/65 block mb-1">
            PDF Filename <span className="text-white/35">(optional)</span>
          </label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="e.g. observership-certificate-foram"
            className="w-full rounded-xl bg-black/30 border border-white/12 focus:border-[#22A6AD] px-3 py-2.5 sm:py-2 text-sm sm:text-xs text-white placeholder-white/30 outline-none transition"
          />
        </div>
      </div>

      {/* Signature & Stamp Toggles */}
      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer select-none py-1">
          <input
            type="checkbox"
            checked={includeSignature}
            onChange={(e) => setIncludeSignature(e.target.checked)}
            className="accent-[#22A6AD] w-4 h-4 rounded cursor-pointer"
          />
          <span>Doctor Signature</span>
        </label>

        <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer select-none py-1">
          <input
            type="checkbox"
            checked={includeStamp}
            onChange={(e) => setIncludeStamp(e.target.checked)}
            className="accent-[#22A6AD] w-4 h-4 rounded cursor-pointer"
          />
          <span>Clinic Stamp</span>
        </label>
      </div>

      {/* Quick Mobile Save + Preview + Download Buttons inside editor */}
      <div className="lg:hidden pt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => saveCertificateToLibrary(false)}
          disabled={savingToCloud}
          className="py-2.5 px-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {savingToCloud ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-[#22A6AD]" />}
          <span>{activeId ? 'Update Saved' : 'Save'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className="py-2.5 px-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>Preview PDF</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-5 min-h-[calc(100vh-4rem)] print:min-h-0 print:gap-0">
      <style jsx global>{letterheadStyles}</style>

      {/* Top Page Header Bar (hidden on print) */}
      <div className="print:hidden flex flex-col gap-3 pb-3.5 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-[#22A6AD]/15 border border-[#22A6AD]/35 flex items-center justify-center text-[#22A6AD] shrink-0">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
                  Certificates Studio
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Signed
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/55 mt-0.5 line-clamp-1">
                Fill the blank middle section, auto-saves &amp; syncs across mobile and PC.
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Desktop Zoom Controls */}
            <div className="hidden xl:flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setZoomMode('fit')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  zoomMode === 'fit' ? 'bg-white/15 text-white' : 'text-white/55 hover:text-white'
                }`}
              >
                Fit
              </button>
              <button
                type="button"
                onClick={() =>
                  setZoomMode((z) => {
                    const cur = z === 'fit' ? Math.round(fitScale * 100) : z;
                    return Math.max(55, cur - 10);
                  })
                }
                className="p-1.5 text-white/60 hover:text-white rounded-lg cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-[11px] text-white/80 min-w-[40px] text-center">
                {Math.round(effectiveScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoomMode((z) => {
                    const cur = z === 'fit' ? Math.round(fitScale * 100) : z;
                    return Math.min(115, cur + 10);
                  })
                }
                className="p-1.5 text-white/60 hover:text-white rounded-lg cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => saveCertificateToLibrary(false)}
              disabled={savingToCloud}
              className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Save certificate to CRM library (syncs across devices)"
            >
              {savingToCloud ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-[#22A6AD]" />
              )}
              <span>{activeId ? 'Update' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPreviewMode(!previewMode);
                setInlineEditing(false);
              }}
              className={`hidden sm:inline-flex px-3 py-2 rounded-xl text-xs font-semibold border transition items-center gap-1.5 cursor-pointer ${
                previewMode
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/[0.04] border-white/10 text-white/75 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {previewMode ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{previewMode ? 'Clean Look' : 'Edit Hints'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInlineEditing(false);
                setTimeout(() => window.print(), 50);
              }}
              className="hidden sm:inline-flex px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-semibold transition items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-[#22A6AD] hover:bg-[#1d939a] disabled:opacity-60 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-[0_0_22px_rgba(34,166,173,0.4)] cursor-pointer active:scale-[0.98]"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{downloading ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher Tabs (< lg) */}
        <div className="lg:hidden grid grid-cols-3 gap-1.5 bg-white/[0.04] border border-white/10 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setMobileTab('edit')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mobileTab === 'edit'
                ? 'bg-[#22A6AD] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Fill</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mobileTab === 'preview'
                ? 'bg-[#22A6AD] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('saved')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              mobileTab === 'saved'
                ? 'bg-[#22A6AD] text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Saved ({savedList.length})</span>
          </button>
        </div>
      </div>

      {/* Status / Error Banners */}
      {saveToast && (
        <div className="print:hidden px-3.5 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {error && (
        <div className="print:hidden p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Main Responsive Split Workspace */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 items-start print:block">
        {/* LEFT PANE: Editor + Saved History */}
        <div
          className={`print:hidden w-full lg:w-[375px] xl:w-[405px] shrink-0 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 space-y-4 lg:sticky lg:top-6 ${
            mobileTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Desktop Left Pane Switcher (Editor vs Saved Library) */}
          <div className="hidden lg:grid grid-cols-2 gap-1.5 bg-black/30 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setDesktopSideTab('edit')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                desktopSideTab === 'edit'
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setDesktopSideTab('saved')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                desktopSideTab === 'saved'
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Saved ({savedList.length})</span>
            </button>
          </div>

          {/* Show Saved Library or Editor based on active mobile/desktop tab */}
          <div className="lg:hidden">
            {mobileTab === 'saved' ? renderSavedLibrary() : renderEditorForm()}
          </div>
          <div className="hidden lg:block">
            {desktopSideTab === 'saved' ? renderSavedLibrary() : renderEditorForm()}
          </div>
        </div>

        {/* RIGHT PANE: Auto-Fit Responsive A4 Letterhead Paper Preview */}
        <div
          ref={previewContainerRef}
          className={`flex-1 w-full min-w-0 flex flex-col items-center pb-6 print:block print:pb-0 ${
            mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="print:hidden w-full flex items-center justify-between text-[11px] text-white/45 px-1 mb-2.5">
            <span className="truncate">
              Tap/click the blank middle area to type directly, or use the editor.
            </span>
            <span className="font-mono text-[10px] text-white/35 shrink-0 ml-2">
              A4 · {Math.round(effectiveScale * 100)}%
            </span>
          </div>

          {/* Exact-height wrapper prevents dead space below scaled sheet and eliminates horizontal overflow */}
          <div
            className="print:!w-auto print:!h-auto relative overflow-hidden rounded-md shadow-[0_20px_60px_rgba(0,0,0,0.75)] print:shadow-none print:overflow-visible"
            style={{
              width: `${scaledWidthPx}px`,
              height: `${scaledHeightPx}px`,
            }}
          >
            <div
              className="origin-top-left transition-transform duration-150 print:!transform-none"
              style={{
                width: `${A4_WIDTH_PX}px`,
                transform: `scale(${effectiveScale})`,
              }}
            >
              {/* OFFICIAL A4 LETTERHEAD SHEET */}
              <div ref={pageRef} className="lh-page">
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
                          Blank fillable area — tap here or use the editor to add certificate text...
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

          {/* Mobile Quick Action Footer under preview */}
          <div className="print:hidden lg:hidden w-full mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileTab('edit')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.07] border border-white/15 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Text</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#22A6AD] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(34,166,173,0.4)] cursor-pointer"
            >
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloading ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const letterheadStyles = `
.lh-page {
  width: 794px;
  min-height: 1123px;
  background: #ffffff !important;
  color: #111827 !important;
  padding: 49px 56px 60px 56px;
  box-sizing: border-box;
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
  gap: 44px;
}

.lh-logo-col {
  flex-shrink: 0;
  padding-top: 4px;
}

.lh-logo-img {
  width: 196px;
  height: auto;
  object-fit: contain;
  display: block;
}

.lh-doctor-col {
  text-align: right;
  flex: 1;
  padding-top: 11px;
}

.lh-doc-name {
  font-size: 17.3px;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
  padding-right: 26px;
}

.lh-doc-cred {
  font-size: 14px;
  font-weight: 400;
  color: #1f2937;
  line-height: 1.35;
  padding-right: 26px;
}

.lh-contact-list {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lh-contact-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
  font-size: 13.3px;
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
  width: 17px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lh-date-row {
  margin-top: 34px;
  display: flex;
  align-items: baseline;
  gap: 9px;
  font-size: 13.3px;
}

.lh-date-label {
  font-weight: 700;
  color: #111827;
}

.lh-date-value {
  display: inline-block;
  min-width: 166px;
  padding: 0 8px 3px 6px;
  border-bottom: 1px solid #9ca3af;
  color: #1f2937;
  font-weight: 400;
}

.lh-title-block {
  margin-top: 38px;
  text-align: center;
}

.lh-title {
  font-size: 17.3px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #111827;
  margin: 0;
  text-transform: uppercase;
}

.lh-title-rule {
  width: 386px;
  height: 1.2px;
  background: #22a6ad;
  margin: 9px auto 9px auto;
}

.lh-subtitle {
  font-size: 12.6px;
  font-weight: 400;
  color: #6b7280;
  margin: 0;
}

.lh-body-zone {
  margin-top: 40px;
  min-height: 136px;
  position: relative;
}

.lh-body-zone-editable {
  border-radius: 6px;
  padding: 11px 13px;
  margin-left: -13px;
  margin-right: -13px;
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
  min-height: 128px;
  background: transparent;
  border: none;
  outline: none;
  resize: vertical;
  font-size: 14px;
  line-height: 1.65;
  color: #111827;
}

.lh-rendered-body {
  font-size: 14px;
  line-height: 1.65;
  color: #111827;
  white-space: pre-wrap;
}

.lh-body-para {
  margin: 0 0 8px 0;
}

.lh-blank-placeholder {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 12.6px;
  color: #94a3b8;
  font-style: italic;
  padding: 15px;
}

.lh-signatory {
  margin-top: 44px;
}

.lh-sincerely {
  font-size: 14px;
  color: #111827;
  margin-bottom: 15px;
}

.lh-sig-area {
  width: 234px;
  min-height: 72px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.lh-sig-img {
  height: 68px;
  width: auto;
  max-width: 174px;
  object-fit: contain;
  margin-bottom: -6px;
  display: block;
}

.lh-sig-line {
  width: 234px;
  height: 1.2px;
  background: #374151;
}

.lh-sig-name {
  margin-top: 8px;
  font-size: 13.3px;
  font-weight: 700;
  color: #111827;
}

.lh-sig-clinic {
  margin-top: 2px;
  font-size: 12.6px;
  font-weight: 400;
  color: #374151;
}

.lh-stamp-wrap {
  margin-top: 19px;
}

.lh-stamp-img {
  width: 196px;
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
