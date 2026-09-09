'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, CheckCircle, AlertTriangle, 
  Loader2, X, Phone, Copy, Check, ShieldCheck, ExternalLink 
} from 'lucide-react';
import { generateBillWhatsAppText } from '@/lib/whatsappTemplates';

export interface SendWhatsAppBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientPhone: string;
  invoiceNumber: string;
  issueDate?: string;
  lines?: { description: string; quantity?: number; lineTotal?: number }[];
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentMode?: string | null;
  onSuccess?: () => void;
}

export default function SendWhatsAppBillModal({
  isOpen,
  onClose,
  patientName,
  patientPhone,
  invoiceNumber,
  issueDate,
  lines,
  total,
  amountPaid,
  balanceDue,
  paymentMode,
  onSuccess,
}: SendWhatsAppBillModalProps) {
  const [phone, setPhone] = useState(patientPhone || '');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (patientPhone) {
      setPhone(patientPhone.replace(/\D/g, '').slice(-10));
    }
  }, [patientPhone, isOpen]);

  if (!isOpen) return null;

  const billMessageText = generateBillWhatsAppText({
    patientName,
    invoiceNumber,
    issueDate,
    lines,
    total,
    amountPaid,
    balanceDue,
    paymentMode,
  });

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(billMessageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendViaCallingNumber = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          message: billMessageText,
          senderPhone: '8482812859',
          invoiceNumber,
          patientName,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 2500);
      } else {
        setErrorMessage(data.error || 'Failed to dispatch via calling number. Please check connection.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error dispatching WhatsApp bill.');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenFallbackWhatsAppWeb = () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const target = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${target}?text=${encodeURIComponent(billMessageText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 select-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative bg-gradient-to-b from-[#161322] to-[#0D0B14] border border-white/20 p-5 sm:p-6 rounded-3xl shadow-2xl w-full max-w-xl flex flex-col z-[100000] text-left space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl shrink-0 shadow-lg shadow-emerald-500/10">
              <MessageSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white leading-tight">
                  Send Bill on WhatsApp
                </h2>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Clinic Line
                </span>
              </div>
              <p className="text-xs text-white/50 font-medium mt-0.5">
                Dispatches via Health 360 Official Calling Number (+91 8482812859)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender Privacy Guarantee Banner */}
        <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="text-[11px] leading-relaxed">
            <strong className="text-emerald-200">Official Sender: +91 8482812859</strong>. Dispatched directly from the clinic's calling number — your personal WhatsApp is never opened or exposed to patients.
          </div>
        </div>

        {/* Recipient Details */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60 font-medium">Billed To:</span>
            <span className="text-white font-bold">{patientName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60 font-medium">Invoice Number:</span>
            <span className="font-mono text-emerald-400 font-bold">{invoiceNumber}</span>
          </div>
          <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Patient WhatsApp Mobile:
            </label>
            <div className="flex items-center gap-1.5 bg-black/40 border border-white/15 rounded-xl px-2.5 py-1.5 focus-within:border-emerald-500 transition">
              <span className="text-xs font-bold text-emerald-400">+91</span>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="bg-transparent text-xs text-white outline-none w-28 font-mono tracking-wider"
                placeholder="9876543210"
              />
            </div>
          </div>
        </div>

        {/* Message Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
              Official WhatsApp Message Preview
            </label>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer font-semibold"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied to Clipboard' : 'Copy Text'}
            </button>
          </div>
          <div className="bg-[#0c1410] border border-emerald-500/20 rounded-2xl p-3.5 max-h-48 overflow-y-auto font-mono text-[11px] text-emerald-200/90 whitespace-pre-wrap leading-relaxed shadow-inner selection:bg-emerald-500/30">
            {billMessageText}
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Success Confirmation Screen */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-center space-y-1.5"
            >
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-sm font-bold text-white">
                Official Bill Sent Successfully!
              </h3>
              <p className="text-xs text-emerald-300">
                Dispatched to {patientName} (+91 {phone}) from Health 360 Calling Number (+91 8482812859).
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        {!isSuccess && (
          <div className="space-y-2 pt-1 border-t border-white/10">
            <button
              type="button"
              disabled={isSending}
              onClick={handleSendViaCallingNumber}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white text-xs font-bold rounded-2xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching from Calling Number (+91 8482812859)...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send via Clinic Calling Number (+91 8482812859)</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOpenFallbackWhatsAppWeb}
                className="hover:text-white/70 flex items-center gap-1 transition cursor-pointer text-[10px]"
                title="Only use if you wish to send via manual WhatsApp Web"
              >
                <span>Manual Web Fallback</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
