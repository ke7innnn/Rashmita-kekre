'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Printer, CreditCard, Check, AlertCircle, X, Slash, Loader2 } from 'lucide-react';
import { formatINR, formatDateIN } from '@/lib/formatters';
import InvoiceStatusPill from '@/components/billing/InvoiceStatusPill';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const queryClient = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card' | 'Bank transfer'>('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Unwrap params using React.use
  const { id } = React.use(params);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice-detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/billing/invoices/${id}`);
      if (!res.ok) throw new Error('Failed to fetch invoice details');
      return res.json();
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['billing-overview'] });
      setShowPaymentModal(false);
      setPaymentError(null);
    },
    onError: (err: any) => {
      setPaymentError(err.message || 'Error recording payment');
    },
  });

  const cancelInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/billing/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (!res.ok) throw new Error('Failed to cancel invoice');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-detail', id] });
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-white/50">Loading invoice details...</div>;
  }

  if (!invoice) {
    return <div className="p-8 text-center text-xs text-rose-400 font-bold">Invoice not found.</div>;
  }

  const balance = Math.max(0, invoice.totalAmount - invoice.paidAmount);

  const handleOpenPaymentModal = () => {
    setPaymentAmount(balance);
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto select-none">
      {/* Screen Header Bar (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/crm360/billing/invoices" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
              Invoice #{invoice.invoiceNumber}
            </h1>
            <p className="text-xs text-white/50 font-medium mt-0.5">Issued on {formatDateIN(invoice.date)}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {balance > 0 && invoice.status !== 'CANCELLED' && (
            <button
              type="button"
              onClick={handleOpenPaymentModal}
              className="px-4 py-2 rounded-xl bg-[#12D6C4] hover:bg-[#0FBDAE] text-[#06231D] text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard size={15} />
              Record Payment
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={15} />
            Print Receipt
          </button>

          {invoice.status !== 'CANCELLED' && (
            <button
              type="button"
              onClick={() => cancelInvoiceMutation.mutate()}
              className="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-[#0F0F14] print:bg-white print:text-black border border-white/15 print:border-none p-8 rounded-3xl print:p-0 space-y-6 shadow-2xl print:shadow-none font-sans">
        {/* Clinic Header (Print & Screen) */}
        <div className="flex justify-between items-start border-b border-white/10 print:border-black/15 pb-6">
          <div>
            <h2 className="text-2xl font-serif font-bold text-white print:text-black">Health 360 Physiotherapy Clinic</h2>
            <p className="text-xs text-white/60 print:text-black/70 mt-1">123 Clinic Street, Mumbai, India</p>
            <p className="text-xs text-white/60 print:text-black/70">Phone: +91 98765 43210 • Email: info@health360.com</p>
          </div>

          <div className="text-right">
            <h3 className="text-xl font-mono font-bold text-white print:text-black">{invoice.invoiceNumber}</h3>
            <div className="mt-2 flex justify-end print:hidden">
              <InvoiceStatusPill status={invoice.status} dueDate={invoice.dueDate} />
            </div>
            <p className="text-xs text-white/50 print:text-black/60 mt-1">Date: {formatDateIN(invoice.date)}</p>
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-white/5 print:bg-gray-50 border border-white/10 print:border-gray-200 p-4 rounded-2xl">
          <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 print:text-black/50 block">Billed Patient</span>
          <h4 className="text-base font-bold text-white print:text-black mt-0.5">{invoice.patient?.fullName}</h4>
          <p className="text-xs text-white/60 print:text-black/70 font-mono">Contact: {invoice.patient?.phone}</p>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/15 print:border-black/20 text-[10px] uppercase font-bold text-white/40 print:text-black/50 tracking-wider">
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3 text-center">Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Price</th>
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 print:divide-black/10 text-white/90 print:text-black">
            {invoice.lines.map((line: any) => (
              <tr key={line.id}>
                <td className="py-3 px-3">
                  <p className="font-bold">{line.description}</p>
                  {line.isCoveredByPackage && (
                    <span className="text-[9px] font-bold text-emerald-400 print:text-emerald-700 block mt-0.5">
                      ✓ Covered by prepaid package
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-center num-tabular">{line.quantity}</td>
                <td className="py-3 px-3 text-right num-tabular">{formatINR(line.unitPrice)}</td>
                <td className="py-3 px-3 text-right font-bold num-tabular">
                  {line.isCoveredByPackage ? 'Covered' : formatINR(line.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary & Totals Block */}
        <div className="flex justify-end pt-4 border-t border-white/10 print:border-black/15">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-white/60 print:text-black/70">
              <span>Subtotal</span>
              <span className="num-tabular font-bold">{formatINR(invoice.totalAmount + invoice.discountAmount)}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-amber-300 print:text-amber-700">
                <span>Discount</span>
                <span className="num-tabular font-bold">- {formatINR(invoice.discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm font-bold text-white print:text-black border-t border-white/15 print:border-black/15 pt-2">
              <span>Payable Total</span>
              <span className="num-tabular text-base">{formatINR(invoice.totalAmount)}</span>
            </div>

            <div className="flex justify-between text-emerald-400 print:text-emerald-700 font-semibold">
              <span>Amount Paid</span>
              <span className="num-tabular">{formatINR(invoice.paidAmount)}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-amber-300 print:text-black border-t border-white/10 print:border-black/10 pt-2">
              <span>Balance Due</span>
              <span className="num-tabular text-sm">{formatINR(balance)}</span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="pt-4 border-t border-white/10 print:border-black/15 space-y-2">
            <span className="text-[9px] uppercase font-bold tracking-wider text-white/40 print:text-black/50 block">Payment History</span>
            <div className="space-y-1.5 text-xs">
              {invoice.payments.map((pmt: any) => (
                <div key={pmt.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5 print:bg-gray-50 text-white/80 print:text-black">
                  <div>
                    <span className="font-bold">{pmt.paymentMode}</span>
                    {pmt.referenceNumber && <span className="text-[10px] text-white/40 print:text-black/50 ml-2 font-mono">Ref: {pmt.referenceNumber}</span>}
                  </div>
                  <div className="text-right">
                    <span className="font-bold num-tabular text-emerald-400 print:text-emerald-700">{formatINR(pmt.amount)}</span>
                    <span className="text-[10px] text-white/40 print:text-black/50 block num-tabular">{formatDateIN(pmt.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#120D1F] border border-white/20 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl select-none"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-lg font-serif font-bold text-white">Record Payment</h3>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="text-white/40 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Payment Amount (₹)</label>
                  <input
                    type="number"
                    min={1}
                    max={balance}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 px-3 text-white font-mono font-bold text-sm focus:outline-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(balance)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white"
                    >
                      Full ({formatINR(balance)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(Math.round(balance / 2))}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white"
                    >
                      Half ({formatINR(Math.round(balance / 2))})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Payment Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Cash', 'UPI', 'Card', 'Bank transfer'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPaymentMode(mode)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          paymentMode === mode
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-white/50 uppercase block mb-1">Reference Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI Txn ID / Cheque No"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 rounded-xl py-2 px-3 text-white font-mono focus:outline-none"
                  />
                </div>

                {paymentError && (
                  <p className="text-xs text-rose-400 font-medium">{paymentError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-white hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={recordPaymentMutation.isPending || paymentAmount <= 0}
                  onClick={() => recordPaymentMutation.mutate({
                    invoiceId: id,
                    amount: paymentAmount,
                    paymentMode,
                    referenceNumber,
                  })}
                  className="px-5 py-2 rounded-xl bg-emerald-400 text-black text-xs font-bold hover:bg-emerald-300 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {recordPaymentMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  Confirm Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
