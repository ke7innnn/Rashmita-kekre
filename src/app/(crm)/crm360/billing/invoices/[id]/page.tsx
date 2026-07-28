'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Printer, CreditCard, XCircle, CheckCircle2, AlertCircle, Phone, Mail, MapPin, Building
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import InvoiceStatusPill from '@/components/billing/InvoiceStatusPill';
import RecordPaymentModal from '@/components/billing/RecordPaymentModal';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/invoices/${id}`);
      if (!res.ok) throw new Error('Invoice not found');
      const data = await res.json();
      setInvoice(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancelInvoice = async () => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      const res = await fetch(`/api/billing/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' })
      });
      if (res.ok) {
        fetchInvoice();
      }
    } catch (e) {
      console.error('Error cancelling invoice:', e);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <div className="h-8 w-40 bg-white/5 animate-pulse rounded-lg" />
        <div className="h-96 bg-white/[0.03] border border-white/10 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm">
          {error || 'Invoice not found'}
        </div>
        <Link href="/crm360/billing/invoices" className="text-xs text-[#12D6C4] underline">
          Return to Invoice Directory
        </Link>
      </div>
    );
  }

  const total = Number(invoice.totalAmount);
  const paid = Number(invoice.paidAmount);
  const balance = Math.max(0, total - paid);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 selection:bg-[#12D6C4]/30 select-none">
      {/* Screen Action Bar (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <Link href="/crm360/billing/invoices" className="hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Invoices
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/crm360/billing/invoices/${id}/print?autoprint=1`}
            target="_blank"
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </Link>

          {balance > 0 && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              <CreditCard className="w-4 h-4" /> Record Payment
            </button>
          )}

          {invoice.status !== 'CANCELLED' && (
            <button
              onClick={handleCancelInvoice}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-[#0B0A10]/90 border border-white/10 print:border-0 print:bg-white print:text-black rounded-2xl p-6 md:p-8 shadow-2xl space-y-8 text-white">
        {/* Clinic Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-white/10 print:border-black/20 pb-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white print:text-black tracking-tight">
              Health 360 Physiotherapy Clinic
            </h1>
            <p className="text-xs text-white/60 print:text-black/70">
              Dr. Rashmita Karvir Kekre, B.P.Th. (M.I.A.P.), BCST
            </p>
            <p className="text-xs text-white/50 print:text-black/60 pt-1">
              Shop No. 4, Sunrise Apartments, Carter Road, Bandra West, Mumbai, MH - 400050
            </p>
            <p className="text-xs text-white/50 print:text-black/60">
              Phone: +91 98200 98200 · Email: info@health360physio.com
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-xs font-bold text-white print:text-black uppercase tracking-widest block">INVOICE</span>
            <div className="text-lg font-bold text-white print:text-black tabular-nums">{invoice.invoiceNumber}</div>
            <div className="text-xs text-white/60 print:text-black/70">
              Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="pt-1 print:hidden">
              <InvoiceStatusPill status={invoice.status} />
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white/[0.03] print:bg-gray-50 border border-white/10 print:border-gray-200 rounded-xl">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 print:text-black/50">Billed To</span>
            <h3 className="text-sm font-bold text-white print:text-black mt-0.5">{invoice.patient?.fullName}</h3>
            <p className="text-xs text-white/60 print:text-black/70">{invoice.patient?.phone}</p>
          </div>
          {invoice.patient?.address && (
            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 print:text-black/50">Address</span>
              <p className="text-xs text-white/60 print:text-black/70 mt-0.5">{invoice.patient.address}</p>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 print:border-black/20 text-[11px] font-bold text-white/50 print:text-black/60 uppercase tracking-wider">
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Price</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-gray-200 text-xs">
              {invoice.lines.map((line: any) => (
                <tr key={line.id}>
                  <td className="py-3 px-3 font-medium text-white print:text-black">
                    {line.description}
                    {line.isCoveredByPackage && (
                      <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 print:text-emerald-700 px-1.5 py-0.5 rounded">
                        Covered by Course
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums text-white/70 print:text-black">
                    {line.quantity}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-white/70 print:text-black">
                    {line.isCoveredByPackage ? '₹0.00' : formatCurrency(line.unitPrice)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums text-white print:text-black">
                    {line.isCoveredByPackage ? '₹0.00' : formatCurrency(line.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-white/10 print:border-black/20">
          <div className="text-xs text-white/50 print:text-black/60 space-y-1">
            {invoice.notes && <p className="italic">Notes: {invoice.notes}</p>}
            {invoice.lines.some((l: any) => l.patientPackageId || l.description?.toLowerCase().includes('course')) && (
              <p className="text-[11px] text-amber-200/90 print:text-black font-medium pt-2 border-t border-white/5 print:border-black/10">
                Terms: Package valid 45 days from date of purchase. Unused sessions are not refundable.
              </p>
            )}
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-amber-300 print:text-amber-800">
                <span>Discount</span>
                <span className="tabular-nums font-semibold">- {formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-white print:text-black pt-1 border-t border-white/10 print:border-black/20">
              <span>Total Amount</span>
              <span className="tabular-nums text-[#12D6C4] print:text-black">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-emerald-400 print:text-emerald-700">
              <span>Paid Amount</span>
              <span className="tabular-nums font-semibold">{formatCurrency(paid)}</span>
            </div>
            <div className="flex justify-between font-bold text-amber-300 print:text-amber-800 pt-1 border-t border-white/10 print:border-black/20">
              <span>Balance Due</span>
              <span className="tabular-nums">{formatCurrency(balance)}</span>
            </div>
          </div>
        </div>

        {/* Payment History Log */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-white/10 print:border-black/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 print:text-black/60">Payment Transactions</h4>
            <div className="space-y-1.5 text-xs">
              {invoice.payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-white/[0.02] print:bg-gray-100 rounded-lg text-white/70 print:text-black">
                  <span>
                    {new Date(p.date).toLocaleDateString('en-IN')} · {p.paymentMode} {p.referenceNumber ? `(Ref: ${p.referenceNumber})` : ''}
                  </span>
                  <span className="font-bold text-emerald-400 print:text-emerald-700 tabular-nums">
                    + {formatCurrency(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        patientName={invoice.patient?.fullName || 'Patient'}
        totalAmount={total}
        paidAmount={paid}
        onPaymentSuccess={fetchInvoice}
      />
    </div>
  );
}
