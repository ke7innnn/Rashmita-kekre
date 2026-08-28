'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, Printer, CreditCard, XCircle, CheckCircle2, AlertCircle, Phone, Mail, MapPin, Building, Edit3, Save, Plus, Loader2, RotateCcw
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import InvoiceStatusPill from '@/components/billing/InvoiceStatusPill';
import RecordPaymentModal from '@/components/billing/RecordPaymentModal';

export default function InvoiceDetailPage() {
  const routeParams = useParams();
  const id = (routeParams?.id as string) || '';
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Quick Edit States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editStatus, setEditStatus] = useState<string>('PENDING');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editLines, setEditLines] = useState<any[]>([]);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  useEffect(() => {
    if (invoice) {
      setEditStatus(invoice.rawStatus || invoice.status || 'PENDING');
      setEditNotes(invoice.notes || '');
      setEditLines(invoice.lines ? invoice.lines.map((l: any) => ({ ...l })) : []);
    }
  }, [invoice, isEditing]);

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

  const handleUpdateStatusDirect = async (newStatus: 'PAID' | 'PENDING' | 'CANCELLED') => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/billing/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update invoice status');
      const updated = await res.json();
      setInvoice(updated);
      setEditStatus(updated.status);
    } catch (e: any) {
      alert(e.message || 'Error updating status');
    } finally {
      setActionLoading(false);
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
        const updated = await res.json();
        setInvoice(updated);
      }
    } catch (e) {
      console.error('Error cancelling invoice:', e);
    }
  };

  const handleSaveQuickEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/billing/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
          lines: editLines,
        }),
      });
      if (!res.ok) throw new Error('Failed to save changes');
      const updated = await res.json();
      setInvoice(updated);
      setIsEditing(false);
    } catch (err: any) {
      alert(err.message || 'Error saving invoice changes');
    } finally {
      setSavingEdit(false);
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
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Mark Paid / Unpaid buttons */}
          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => handleUpdateStatusDirect('PAID')}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Mark as Paid
            </button>
          )}

          {invoice.status === 'PAID' && (
            <button
              onClick={() => handleUpdateStatusDirect('PENDING')}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Mark as Unpaid
            </button>
          )}

          {invoice.status === 'CANCELLED' && (
            <button
              onClick={() => handleUpdateStatusDirect('PENDING')}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Reactivate Invoice
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${isEditing ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/10 hover:bg-white/20 text-white border-white/20'}`}
          >
            <Edit3 className="w-4 h-4" /> {isEditing ? 'Cancel Edit' : 'Quick Edit'}
          </button>

          {isEditing && (
            <button
              onClick={handleSaveQuickEdit}
              disabled={savingEdit}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          )}

          <Link
            href={`/crm360/billing/invoices/${id}/print?autoprint=1`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print / PDF
          </Link>

          {balance > 0 && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,255,255,0.3)] cursor-pointer"
            >
              <CreditCard className="w-4 h-4" /> Record Payment
            </button>
          )}

          {invoice.status !== 'CANCELLED' && (
            <button
              onClick={handleCancelInvoice}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" /> Cancel
            </button>
          )}

          <Link
            href={invoice.patientId ? `/crm360/billing/invoices/new?patientId=${invoice.patientId}` : `/crm360/billing/invoices/new`}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold transition flex items-center gap-1.5 border border-white/10"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </Link>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-[#0B0A10]/90 border border-white/10 print:border-0 print:bg-white print:text-black rounded-2xl p-6 md:p-8 shadow-2xl space-y-8 text-white">
        {/* Clinic Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-white/10 print:border-black/20 pb-6">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white print:text-black tracking-tight">
              Health360
            </h1>
            <p className="text-xs text-white/60 print:text-black/70">
              Physiotherapy and Craniosacral Therapy Clinic
            </p>
            <p className="text-xs text-white/60 print:text-black/70 pt-0.5 whitespace-pre-line font-medium">
              Dr. Rashmita Karvir Kekre
              <br />
              B.PTh.(M.I.A.P.)
              <br />
              BCST
            </p>
            <p className="text-xs text-white/50 print:text-black/60 pt-1">
              Shop No.1, Amardeep Society, Om Nagar, Vasai (W).
            </p>
            <p className="text-xs text-white/50 print:text-black/60">
              Phone: 8482812859 · Email: health360vasai@gmail.com
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-xs font-bold text-white print:text-black uppercase tracking-widest block">INVOICE</span>
            <div className="text-lg font-bold text-white print:text-black tabular-nums">{invoice.invoiceNumber}</div>
            <div className="text-xs text-white/60 print:text-black/70">
              Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="pt-1 print:hidden">
              {isEditing ? (
                <div className="flex items-center justify-end gap-2">
                  <span className="text-[10px] font-bold text-amber-300 uppercase">Status:</span>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="text-xs bg-[#12101B] border border-white/20 text-white rounded-lg px-2 py-1 font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="PENDING">PENDING / UNPAID</option>
                    <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                    <option value="PAID">PAID</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              ) : (
                <InvoiceStatusPill status={invoice.status} />
              )}
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
              {(isEditing ? editLines : (invoice.lines || [])).map((line: any, idx: number) => (
                <tr key={line.id || idx}>
                  <td className="py-3 px-3 font-medium text-white print:text-black">
                    {isEditing ? (
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => {
                          const updated = [...editLines];
                          updated[idx].description = e.target.value;
                          setEditLines(updated);
                        }}
                        className="w-full text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none"
                      />
                    ) : (
                      <>
                        {line.description}
                        {line.isCoveredByPackage && (
                          <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-300 print:text-emerald-700 px-1.5 py-0.5 rounded">
                            Covered by Course
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums text-white/70 print:text-black">
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => {
                          const updated = [...editLines];
                          updated[idx].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setEditLines(updated);
                        }}
                        className="w-16 text-center text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none"
                      />
                    ) : (
                      line.quantity
                    )}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-white/70 print:text-black">
                    {isEditing ? (
                      <input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => {
                          const updated = [...editLines];
                          updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                          setEditLines(updated);
                        }}
                        className="w-24 text-right text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none"
                      />
                    ) : (
                      line.isCoveredByPackage ? '₹0.00' : formatCurrency(line.unitPrice)
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums text-white print:text-black">
                    {formatCurrency(Number(line.quantity || 1) * Number(line.unitPrice || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4 border-t border-white/10 print:border-black/20">
          <div className="text-xs text-white/50 print:text-black/60 space-y-1 w-full sm:max-w-md">
            {isEditing ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-white/60">Invoice Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs bg-white/10 border border-white/20 rounded-xl p-2 text-white focus:outline-none"
                />
              </div>
            ) : (
              invoice.notes && <p className="italic">Notes: {invoice.notes}</p>
            )}
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
