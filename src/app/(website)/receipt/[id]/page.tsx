'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer, Download, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import ReceiptDocument, { ClinicProfile, ReceiptData, PaymentMode } from '@/components/billing/ReceiptDocument';

export default function PublicReceiptPage() {
  const params = useParams();
  const id = (params?.id as string) || '';

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchReceipt();
    }
  }, [id]);

  const fetchReceipt = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/receipts/${id}`);
      if (!res.ok) throw new Error('Receipt not found or invalid link');
      const data = await res.json();
      setReceipt(data);
    } catch (e: any) {
      setError(e.message || 'Unable to load invoice receipt.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-white font-sans">
        <Loader2 className="w-9 h-9 text-[#12D6C4] animate-spin mb-3" />
        <p className="text-sm font-semibold tracking-wide">Loading Official Invoice Receipt...</p>
        <p className="text-xs text-white/40 mt-1">Health 360 Physiotherapy &amp; Craniosacral Clinic</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl max-w-md text-center space-y-3">
          <p className="text-sm font-bold text-rose-300">{error || 'Invoice record not found'}</p>
          <p className="text-xs text-white/50">Please contact Health 360 Clinic at +91 8482812859 if you need assistance.</p>
        </div>
      </div>
    );
  }

  const clinic: ClinicProfile = receipt.clinic;
  const receiptData: ReceiptData = {
    documentNumber: receipt.invoiceNumber,
    issueDate: new Date(receipt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    patientName: receipt.patientName,
    patientPhone: receipt.patientPhone,
    lines: receipt.lines,
    subtotal: receipt.subtotal,
    discount: receipt.discount,
    total: receipt.total,
    amountPaid: receipt.amountPaid,
    balanceDue: receipt.balanceDue,
    paymentMode: (receipt.paymentMode || 'UPI') as PaymentMode,
    notes: receipt.notes,
    includesCourse: false,
  };

  return (
    <div className="min-h-screen bg-[#0F172A] print:bg-white text-black font-sans relative py-6 px-3 sm:px-6">
      {/* Top Banner for Patient */}
      <div className="max-w-[210mm] mx-auto mb-4 bg-[#1E293B] border border-slate-700 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-white print:hidden shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Official Tax Invoice &amp; Payment Receipt</h1>
            <p className="text-[11px] text-white/50">Receipt #{receipt.invoiceNumber} • Issued to {receipt.patientName}</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-4 py-2 bg-[#12D6C4] hover:bg-[#0FBDAE] text-black font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save / Print PDF</span>
        </button>
      </div>

      {/* Actual Paper Canvas Receipt */}
      <div className="max-w-[210mm] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
        <ReceiptDocument 
          clinic={clinic}
          data={receiptData}
        />
      </div>

      <div className="max-w-[210mm] mx-auto mt-6 text-center text-xs text-white/40 print:hidden">
        <p>Health 360 Physiotherapy &amp; Craniosacral Therapy Clinic • Shop No.1 &amp; 2, Amardeep Society, Om Nagar, Vasai West</p>
        <p className="mt-1">Tel: +91 8482812859 • Email: health360vasai@gmail.com</p>
      </div>
    </div>
  );
}
