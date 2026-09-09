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
  invoiceId?: string;
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
  invoiceId,
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
    invoiceId,
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

  const handleOpenDirectWhatsApp = () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const target = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${target}?text=${encodeURIComponent(billMessageText)}`;
    window.open(url, '_blank');
    if (onSuccess) onSuccess();
    onClose();
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
      const formattedAmt = (amountPaid > 0 ? amountPaid : total).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          templateName: 'invoice_bill_receipt',
          params: [patientName, invoiceNumber, formattedAmt],
          documentUrl: `https://thehealth360.in/receipt/${invoiceId || invoiceNumber}`,
          documentFilename: `Health360_Receipt_${invoiceNumber}.pdf`,
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
        // If Meta blocked outside 24-hr window, automatically open WhatsApp Web so it delivers!
        const cleanTarget = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        const webUrl = `https://wa.me/${cleanTarget}?text=${encodeURIComponent(billMessageText)}`;
        window.open(webUrl, '_blank');
        
        setErrorMessage(
          'Meta Cloud API blocks freeform text outside the 24-hour reply window. We opened WhatsApp Web for you so you can hit Send directly!'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error dispatching WhatsApp bill.');
    } finally {
      setIsSending(false);
    }
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
                  Send Invoice &amp; Receipt on WhatsApp
                </h2>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Official Receipt
                </span>
              </div>
              <p className="text-xs text-white/50 font-medium mt-0.5">
                Sends itemized invoice #{invoiceNumber} with direct link to view &amp; download official PDF
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

        {/* Recipient Details */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50 font-medium">Billed Patient:</span>
            <span className="text-white font-bold">{patientName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50 font-medium">Invoice Number:</span>
            <span className="font-mono text-emerald-400 font-bold">{invoiceNumber}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/50 font-medium">Total / Paid / Due:</span>
            <span className="text-white font-semibold">
              ₹{total.toLocaleString('en-IN')} / <span className="text-emerald-400">₹{amountPaid.toLocaleString('en-IN')}</span> / <span className={balanceDue > 0 ? "text-amber-400" : "text-white/40"}>₹{balanceDue.toLocaleString('en-IN')}</span>
            </span>
          </div>

          <div className="pt-2 border-t border-white/[0.08] flex items-center gap-2">
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#25D366]" />
              Target WhatsApp:
            </label>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-mono font-bold text-white/60">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full text-xs font-mono font-bold bg-white/5 border border-[#25D366]/40 focus:border-[#25D366] rounded-lg px-2.5 py-1 text-white outline-none"
                placeholder="10-digit mobile"
              />
            </div>
          </div>
        </div>

        {/* Message Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              WhatsApp Message Preview (Includes PDF Link):
            </span>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="p-3 bg-[#0B141A] border border-emerald-500/20 rounded-2xl shadow-inner max-h-52 overflow-y-auto font-mono text-[11px] text-white/90 whitespace-pre-wrap leading-relaxed">
            {billMessageText}
          </div>
        </div>

        {/* Error / Alert Banner */}
        {errorMessage && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-[11px] leading-relaxed">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Success Confirmation */}
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

        {/* Action Buttons */}
        {!isSuccess && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            {/* PRIMARY: Direct 1-Click WhatsApp Dispatch */}
            <button
              type="button"
              onClick={handleOpenDirectWhatsApp}
              className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#1ebe59] active:scale-[0.99] text-white text-xs font-bold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/25"
            >
              <Send className="w-4 h-4 stroke-[2.2]" />
              <span>Send Directly via WhatsApp to +91 {phone || '...'}</span>
            </button>

            {/* SECONDARY: Meta Cloud API Dispatch */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendViaCallingNumber}
                className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-[11px] font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                title="Attempts automated Meta Cloud API dispatch"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Send via Meta API (+91 8482812859)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 text-white/50 hover:text-white text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
