'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Printer,
  MessageSquare,
  Send,
  ShieldCheck,
  RotateCcw,
  Edit3,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Columns,
  Maximize2,
  Sliders,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
} from 'lucide-react';
import CertificateDocument, { CertificateData, CertificateType } from './CertificateDocument';
import CertificateEditorPanel from './CertificateEditorPanel';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientPhone: string;
  initialData: CertificateData;
  onSuccess?: () => void;
}

export default function CertificateModal({
  isOpen,
  onClose,
  patientId,
  patientPhone,
  initialData,
  onSuccess,
}: CertificateModalProps) {
  const [data, setData] = useState<CertificateData>(initialData);
  const [phone, setPhone] = useState(patientPhone.replace(/\D/g, '').slice(-10));
  const [viewMode, setViewMode] = useState<'split' | 'full'>('split');
  const [previewOnly, setPreviewOnly] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(85);
  const [showMsgPreview, setShowMsgPreview] = useState<boolean>(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setData(initialData);
    setErrorMessage(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate safe state-encoded link for patient public view
  const encodedState = typeof window !== 'undefined' ? btoa(encodeURIComponent(JSON.stringify(data))) : '';
  const publicCertificateUrl = `https://thehealth360.in/certificate/${data.type}/${patientId}?s=${encodedState}`;
  const pdfDownloadUrl = `https://thehealth360.in/api/certificate/pdf?type=${data.type}&s=${encodedState}`;

  // Formatted summary text for WhatsApp
  const generateWhatsAppMessage = () => {
    const pName = data.patientName || 'Patient';
    if (data.type === 'treatment_payment') {
      return `🏥 *Health 360 Physiotherapy Clinic*
*Treatment & Payment Certificate*

Dear ${pName},
Your official Treatment & Payment Certificate has been generated for your records and insurance claim:

• Diagnosis: ${data.diagnosis || 'Rehabilitation'}
• Treatment Period: ${data.startDate || 'Recent'} to ${data.endDate || 'Present'}
• Total Sessions: ${data.sessions || '10 Sessions'}
• Total Amount Paid: ₹${data.totalAmount || '6,500.00'}

📄 *View & Download Official Signed Certificate:*
${publicCertificateUrl}

Warm regards,
*Dr. Rashmita Karvir-Kekre (PT)*
Health 360 Clinic · Vasai West (+91 8071 583 519)`;
    }

    if (data.type === 'fitness') {
      return `🏥 *Health 360 Physiotherapy Clinic*
*Fitness Certificate*

Dear ${pName},
Following your clinical evaluation on ${data.assessmentDate || 'Recent'}, your official Fitness Certificate has been issued:

✅ Certified fit to resume regular activities
• Advice / Remarks: ${data.remarks || 'Maintain daily warmups and prescribed home exercises'}

📄 *View & Download Official Signed Certificate:*
${publicCertificateUrl}

Warm regards,
*Dr. Rashmita Karvir-Kekre (PT)*
Health 360 Clinic · Vasai West (+91 8071 583 519)`;
    }

    if (data.type === 'unfitness') {
      return `🏥 *Health 360 Physiotherapy Clinic*
*Unfitness for Work Certificate (Medical Rest)*

Dear ${pName},
Following your clinical evaluation on ${data.assessmentDate || 'Recent'}, you have been advised medical rest:

• Diagnosis: ${data.symptomsCondition || 'Acute Musculoskeletal Condition'}
• Recommended Rest: ${data.startDate || 'Today'} to ${data.endDate || 'Next Week'}
• Review Assessment: On or after ${data.reviewDate || 'Next Week'}

📄 *View & Download Official Signed Certificate:*
${publicCertificateUrl}

Warm regards,
*Dr. Rashmita Karvir-Kekre (PT)*
Health 360 Clinic · Vasai West (+91 8071 583 519)`;
    }

    // Discharge Summary
    return `🏥 *Health 360 Physiotherapy Clinic*
*Physiotherapy Discharge Summary*

Dear ${pName},
Congratulations on successfully completing your physiotherapy rehabilitation program!

• Treatment Period: ${data.startDate || 'Initial'} to ${data.endDate || 'Discharge'}
• Total Sessions Attended: ${data.sessions || '12 Sessions'}
• Outcome: ${data.outcome || 'Full functional recovery achieved'}

📄 *View & Download Official 2-Page Signed Summary:*
${publicCertificateUrl}

Warm regards,
*Dr. Rashmita Karvir-Kekre (PT)*
Health 360 Clinic · Vasai West (+91 8071 583 519)`;
  };

  const messageText = generateWhatsAppMessage();

  const handleOpenDirectWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const target = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${target}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const handleSendViaMetaApi = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    // Map template name to unique approved names
    const templateMap: Record<string, string> = {
      treatment_payment: 'health360_treatment_certificate',
      fitness: 'health360_fitness_certificate',
      unfitness: 'health360_unfitness_certificate',
      discharge_summary: 'health360_discharge_summary',
    };

    const templateName = templateMap[data.type] || 'welcome_clinic_info';

    // Map params
    let params: string[] = [];
    if (data.type === 'treatment_payment') {
      params = [
        data.patientName || 'Patient',
        data.diagnosis || 'Physiotherapy',
        data.startDate || 'Start',
        data.endDate || 'End',
        data.sessions || '10',
        data.totalAmount || '6500',
      ];
    } else if (data.type === 'fitness') {
      params = [
        data.patientName || 'Patient',
        data.assessmentDate || 'Today',
        'Fit to resume regular activities',
        data.remarks || 'Continue prescribed routine',
      ];
    } else if (data.type === 'unfitness') {
      params = [
        data.patientName || 'Patient',
        data.symptomsCondition || 'Clinical Condition',
        data.startDate || 'Start',
        data.endDate || 'End',
        data.reviewDate || 'Review',
      ];
    } else {
      params = [
        data.patientName || 'Patient',
        data.startDate || 'Start',
        data.endDate || 'End',
        data.sessions || '12',
        data.outcome || 'Recovered',
        data.homeAdvice || 'Daily exercises',
      ];
    }

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          templateName,
          params,
          message: messageText,
          documentUrl: publicCertificateUrl,
          documentFilename: `Health360_${data.type}_${data.patientName?.replace(/\s+/g, '_') || 'Patient'}.pdf`,
          senderPhone: '8482812859',
          patientName: data.patientName,
        }),
      });

      const resData = await res.json();

      if (res.ok && resData.success) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 2500);
      } else {
        const err =
          resData.error ||
          resData.details ||
          'Meta API template is unverified or outside the 24h window. Use Direct WhatsApp Web instead.';
        setErrorMessage(err);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error occurred while connecting to WhatsApp API.');
    } finally {
      setIsSending(false);
    }
  };

  const getDocTitle = () => {
    switch (data.type) {
      case 'treatment_payment':
        return 'Treatment & Payment Certificate';
      case 'fitness':
        return 'Fitness Certificate';
      case 'unfitness':
        return 'Unfitness for Work Certificate';
      case 'discharge_summary':
        return 'Physiotherapy Discharge Summary';
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        className="relative bg-[#0B0F19] border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-[96vw] xl:max-w-7xl flex flex-col z-[100000] text-left h-[94vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================
            1. TOP TOOLBAR WITH MODERN WORKSPACE CONTROLS
           ========================================================= */}
        <div className="no-print bg-[#131B2E] border-b border-slate-800 py-2.5 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Left: Title & Mode Selectors */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">{getDocTitle()}</h2>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Signed
                </span>
              </div>
            </div>

            {/* Split / Full View Switcher */}
            <div className="hidden sm:flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'split'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Split side-by-side editing mode"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'full'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Expanded full document canvas"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Full Canvas</span>
              </button>
            </div>

            {/* Clean Preview Toggle */}
            <button
              type="button"
              onClick={() => setPreviewOnly(!previewOnly)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                previewOnly
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
              title="Toggle between editing cues and final print appearance"
            >
              {previewOnly ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{previewOnly ? 'Final Print Look' : 'Edit Hints On'}</span>
            </button>
          </div>

          {/* Center: Zoom Controls */}
          <div className="hidden lg:flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setZoom(75)}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                zoom === 75 ? 'bg-white/15 text-white font-bold' : 'text-white/50 hover:text-white'
              }`}
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => setZoom(85)}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                zoom === 85 ? 'bg-white/15 text-white font-bold' : 'text-white/50 hover:text-white'
              }`}
            >
              85%
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                zoom === 100 ? 'bg-white/15 text-white font-bold' : 'text-white/50 hover:text-white'
              }`}
            >
              100%
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* WhatsApp Text Preview Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowMsgPreview(!showMsgPreview)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border cursor-pointer ${
                showMsgPreview
                  ? 'bg-[#25D366]/20 border-[#25D366]/40 text-[#25D366]'
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
              }`}
              title="Preview WhatsApp text message"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WA Preview</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
              title="Restore initial values"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================
            2. MAIN DUAL-PANE WORKSPACE
           ========================================================= */}
        <div className="flex-1 overflow-hidden flex flex-row relative">
          {/* Left Pane: Parameters Editor */}
          {viewMode === 'split' && (
            <div className="w-[360px] lg:w-[380px] shrink-0 border-r border-slate-800 h-full overflow-hidden flex flex-col z-20">
              <CertificateEditorPanel
                data={data}
                onChange={setData}
                onReset={handleReset}
              />
            </div>
          )}

          {/* Right Pane: Live Paper Document Canvas */}
          <div className="flex-1 h-full overflow-y-auto bg-[#070A12] p-4 sm:p-8 flex flex-col items-center">
            {/* Context Notice Bar */}
            <div className="no-print w-full max-w-[210mm] mb-3 flex items-center justify-between text-[11px] text-white/50 px-1">
              <span className="flex items-center gap-1.5">
                <Edit3 className="w-3 h-3 text-sky-400" />
                <span>Click directly on paper text to edit inline or use the left parameters panel.</span>
              </span>
              <span className="font-mono text-[10px] text-white/40">A4 Portrait · 210 × 297 mm</span>
            </div>

            {/* Scaled Canvas */}
            <div
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="shadow-[0_20px_60px_rgba(0,0,0,0.9)] rounded-lg"
            >
              <CertificateDocument
                data={data}
                isEditable={true}
                previewOnly={previewOnly}
                onUpdate={setData}
              />
            </div>
          </div>

          {/* Collapsible WhatsApp Message Preview Drawer */}
          <AnimatePresence>
            {showMsgPreview && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute right-0 top-0 bottom-0 w-[380px] bg-[#111827] border-l border-slate-800 shadow-2xl z-30 flex flex-col p-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#25D366]" />
                    <h3 className="text-xs font-bold text-white">WhatsApp Dispatch Preview</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMsgPreview(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-[#0A101D] p-3 rounded-2xl border border-slate-800 text-xs font-sans text-white/90 leading-relaxed whitespace-pre-wrap select-text">
                  {messageText}
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMsg ? 'Copied to Clipboard!' : 'Copy Text'}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* =========================================================
            3. BOTTOM WHATSAPP DISPATCH STRIP
           ========================================================= */}
        <div className="no-print bg-[#131B2E] border-t border-slate-800 p-3 sm:p-4 shrink-0 space-y-2">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px]">{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2 justify-center font-bold"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Certificate Dispatched Successfully from Clinic WhatsApp!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Recipient Phone Input */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-white/60 shrink-0">Recipient WhatsApp:</span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono font-bold text-white/60">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-32 text-xs font-mono font-bold bg-white/5 border border-[#25D366]/40 focus:border-[#25D366] rounded-lg px-2.5 py-1 text-white outline-none"
                  placeholder="10-digit mobile"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Secondary: Meta Cloud API */}
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendViaMetaApi}
                className="py-2 px-3 bg-white/5 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                title="Send official template via Calling Number (+91 8071 583 519)"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Send via Meta API</span>
              </button>

              {/* Primary: Direct 1-Click WhatsApp */}
              <button
                type="button"
                onClick={handleOpenDirectWhatsApp}
                className="py-2 px-4 bg-[#25D366] hover:bg-[#1ebe59] active:scale-[0.99] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-md shadow-[#25D366]/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Directly via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
