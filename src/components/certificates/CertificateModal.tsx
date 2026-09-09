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
} from 'lucide-react';
import CertificateDocument, { CertificateData } from './CertificateDocument';

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

  // Formatted summary text for WhatsApp
  const generateWhatsAppMessage = () => {
    const pName = data.patientName || 'Patient';
    if (data.type === 'treatment_payment') {
      return `🏥 *Health 360 Physiotherapy Clinic*
*Treatment & Payment Certificate*

Dear ${pName},
Your official Treatment & Payment Certificate has been generated for your records and mediclaim reimbursement:

• Diagnosis: ${data.diagnosis || 'Rehabilitation'}
• Treatment Period: ${data.startDate || 'Recent'} to ${data.endDate || 'Present'}
• Total Sessions: ${data.sessions || '10 Sessions'}
• Total Amount Paid: ₹${data.totalAmount || '6,500.00'}

📄 *View & Download Official Signed Certificate:*
${publicCertificateUrl}

Warm regards,
*Dr. Rashmita Karvir-Kekre (PT)*
Health 360 Clinic · Vasai West (+91 8482812859)`;
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
Health 360 Clinic · Vasai West (+91 8482812859)`;
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
Health 360 Clinic · Vasai West (+91 8482812859)`;
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
Health 360 Clinic · Vasai West (+91 8482812859)`;
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

  const handleSendViaMetaApi = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    // Map template name
    const templateMap: Record<string, string> = {
      treatment_payment: 'mediclaim_certificate_notice',
      fitness: 'fitness_certificate_notice',
      unfitness: 'medical_rest_notice',
      discharge_summary: 'patient_discharge_summary',
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
        // Fallback: Open WhatsApp Web directly with everything pre-filled
        const cleanTarget = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const webUrl = `https://wa.me/${cleanTarget}?text=${encodeURIComponent(messageText)}`;
        window.open(webUrl, '_blank');

        setErrorMessage(
          'Meta API rejected payload or template is unverified. We opened WhatsApp Web with the signed certificate link pre-filled so you can send it directly!'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error dispatching WhatsApp certificate.');
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
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative bg-[#0F172A] border border-white/20 rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col z-[100000] text-left max-h-[96vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Screen Toolbar */}
        <div className="no-print bg-[#1E293B] border-b border-slate-700 py-3 px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>{getDocTitle()}</span>
              <span className="text-[10px] font-bold text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Official Signed PDF
              </span>
            </h2>
            <span className="text-white/30 hidden md:inline">|</span>
            <span className="text-[11px] text-amber-300 font-medium hidden md:flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              <Edit3 className="w-3 h-3 text-amber-400" /> Interactive Edit Mode (Click text to edit)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 border border-white/15 cursor-pointer"
              title="Reset modifications"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
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

        {/* Scrollable Document Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0B0F19]">
          <div className="max-w-[210mm] mx-auto">
            <CertificateDocument
              data={data}
              isEditable={true}
              onUpdate={setData}
            />
          </div>
        </div>

        {/* Bottom WhatsApp Dispatch Strip */}
        <div className="no-print bg-[#1E293B] border-t border-slate-700 p-3 sm:p-4 shrink-0 space-y-2">
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

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Secondary: Meta Cloud API */}
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendViaMetaApi}
                className="py-2 px-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                title="Send official template via Calling Number (+91 8482812859)"
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
