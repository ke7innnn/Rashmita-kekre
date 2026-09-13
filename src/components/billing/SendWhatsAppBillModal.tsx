'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Send, X, Phone, Copy, Check, ExternalLink, AlertCircle
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
  const [copied, setCopied] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

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

  const handleOpenWhatsAppWeb = () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setPhoneError(null);

    const target = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${target}?text=${encodeURIComponent(billMessageText)}`;
    window.open(url, '_blank');
    if (onSuccess) onSuccess();
    onClose();
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
                  Send Invoice via WhatsApp Web
                </h2>
                <span className="text-[10px] font-bold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/30 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  WhatsApp Web
                </span>
              </div>
              <p className="text-xs text-white/50 font-medium mt-0.5">
                Opens WhatsApp Web with pre-formatted invoice #{invoiceNumber} and direct PDF receipt link
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
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  if (phoneError) setPhoneError(null);
                }}
                className="w-full text-xs font-mono font-bold bg-white/5 border border-[#25D366]/40 focus:border-[#25D366] rounded-lg px-2.5 py-1 text-white outline-none"
                placeholder="10-digit mobile"
              />
            </div>
          </div>
          {phoneError && (
            <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-medium pt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{phoneError}</span>
            </div>
          )}
        </div>

        {/* Message Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
              WhatsApp Message Preview:
            </span>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="p-3 bg-[#0B141A] border border-emerald-500/20 rounded-2xl shadow-inner max-h-52 overflow-y-auto font-mono text-[11px] text-white/90 whitespace-pre-wrap leading-relaxed">
            {billMessageText}
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleOpenWhatsAppWeb}
            className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#1ebe59] active:scale-[0.99] text-white text-xs font-bold rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/25"
          >
            <Send className="w-4 h-4 stroke-[2.2]" />
            <span>Open in WhatsApp Web (+91 {phone || '...'})</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-white/40">
              Opens WhatsApp Web with the message pre-filled. Just tap Send.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 text-white/50 hover:text-white text-xs transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
