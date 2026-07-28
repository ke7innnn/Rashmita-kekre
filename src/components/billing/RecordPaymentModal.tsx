'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Check, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  totalAmount: number;
  paidAmount: number;
  onPaymentSuccess: () => void;
}

import CountUpNumber from './CountUpNumber';

export default function RecordPaymentModal({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
  patientName,
  totalAmount,
  paidAmount,
  onPaymentSuccess
}: RecordPaymentModalProps) {
  const balance = Math.max(0, totalAmount - paidAmount);
  const [amount, setAmount] = useState<string>(balance.toString());
  const [paymentMode, setPaymentMode] = useState<string>('UPI');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleQuickFill = (type: 'full' | 'half') => {
    if (type === 'full') {
      setAmount(balance.toString());
    } else {
      setAmount((balance / 2).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }
    if (parsedAmount > balance + 0.01) {
      setError(`Payment amount cannot exceed outstanding balance (${formatCurrency(balance)})`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          amount: parsedAmount,
          paymentMode,
          referenceNumber,
          paymentDate: date
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to record payment');
      }

      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error recording payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0F0D16] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-white" />
                Record Payment
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                {invoiceNumber} · {patientName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Outstanding Balance Banner */}
            <div className="flex items-center justify-between p-3.5 bg-white/[0.04] border border-white/10 rounded-xl">
              <span className="text-xs text-white/60 font-medium">Outstanding Balance</span>
              <span className="text-lg font-bold tabular-nums text-white">
                <CountUpNumber value={balance} currency duration={500} />
              </span>
            </div>

            {/* Payment Amount Field & Quick Fills */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/70">Payment Amount (₹)</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('full')}
                    className="text-[11px] font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/30 px-2 py-0.5 rounded-lg transition"
                  >
                    Full ({formatCurrency(balance)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('half')}
                    className="text-[11px] font-semibold text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-0.5 rounded-lg transition"
                  >
                    Half ({formatCurrency(balance / 2)})
                  </button>
                </div>
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-white/[0.04] border border-white/10 focus:border-white rounded-xl px-3.5 py-2.5 text-base font-bold tabular-nums text-white outline-none transition"
              />
            </div>

            {/* Payment Mode Selector */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">Payment Mode</label>
              <div className="grid grid-cols-4 gap-2">
                {['UPI', 'Cash', 'Card', 'Bank transfer'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border transition text-center ${
                      paymentMode === mode
                        ? 'bg-white/20 border-white text-white'
                        : 'bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.08]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Reference Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-white rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1.5">Reference # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Cheque #"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-white rounded-xl px-3 py-2 text-xs text-white outline-none transition"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
