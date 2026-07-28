'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react';
import ReceiptDocument, { ClinicProfile, ReceiptData, PaymentMode } from '@/components/billing/ReceiptDocument';

export default function InvoicePrintPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ autoprint?: string }>;
}) {
  const { id } = use(params);
  const { autoprint } = use(searchParams);
  const [invoice, setInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoiceAndSettings();
  }, [id]);

  const fetchInvoiceAndSettings = async () => {
    setLoading(true);
    try {
      const [invRes, setRes] = await Promise.all([
        fetch(`/api/billing/invoices/${id}`),
        fetch('/api/settings')
      ]);

      if (!invRes.ok) throw new Error('Invoice not found');
      const invData = await invRes.json();
      setInvoice(invData);

      if (setRes.ok) {
        const setMode = await setRes.json();
        setSettings(setMode);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && invoice && autoprint === '1') {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, invoice, autoprint]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const patientName = (invoice?.patient?.fullName || 'Patient').replace(/\s+/g, '-');
    const invNum = (invoice?.invoiceNumber || 'Invoice').replace(/\s+/g, '-');
    const originalTitle = document.title;
    document.title = `Receipt-${invNum}-${patientName}.pdf`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0711] flex flex-col items-center justify-center p-8 text-white font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mb-3" />
        <p className="text-sm font-medium text-white/70">Preparing receipt document...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#0A0711] flex flex-col items-center justify-center p-8 text-white font-sans">
        <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-sm mb-4">
          {error || 'Invoice not found'}
        </div>
        <Link href="/crm360/billing/invoices" className="text-xs text-[var(--primary)] underline">
          Return to Invoice Directory
        </Link>
      </div>
    );
  }

  // Clinic Profile Wiring
  const clinic: ClinicProfile = {
    name: 'Health360',
    tagline: settings?.tagline || 'Physiotherapy and Craniosacral Therapy Clinic',
    doctorName: 'Dr. Rashmita Karvir Kekre',
    credentials: ['B.PTh.(M.I.A.P.)', 'BCST'],
    address: 'Shop No.1, Amardeep Society, Om Nagar, Vasai (W).',
    phone: '8482812859',
    email: 'health360vasai@gmail.com',
    logoUrl: settings?.logoUrl || null,
  };

  // Receipt Data Mapping
  const subtotal = Number(invoice.subtotalAmount || 0);
  const total = Number(invoice.totalAmount || 0);
  const discount = Number(invoice.discountAmount || 0);
  const amountPaid = Number(invoice.paidAmount || 0);
  const balanceDue = Math.max(0, total - amountPaid);

  const rawMode = invoice.payments?.[0]?.paymentMode || (amountPaid > 0 ? 'UPI' : '');
  const paymentModeMap: Record<string, PaymentMode> = {
    cash: 'CASH',
    upi: 'UPI',
    cheque: 'CHEQUE',
    other: 'OTHER',
  };
  const paymentMode: PaymentMode | null = paymentModeMap[rawMode.toLowerCase()] || null;

  const includesCourse = invoice.lines.some((l: any) =>
    l.patientPackageId ||
    l.description?.toLowerCase().includes('course') ||
    l.description?.toLowerCase().includes('package')
  );

  const receiptData: ReceiptData = {
    documentNumber: invoice.invoiceNumber,
    issueDate: new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    patientName: invoice.patient?.fullName || 'Patient',
    patientPhone: invoice.patient?.phone || '',
    lines: invoice.lines.map((l: any) => ({
      id: l.id,
      description: l.description,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice || 0),
      lineTotal: Number(l.totalPrice || 0),
    })),
    subtotal,
    discount,
    total,
    amountPaid,
    balanceDue,
    paymentMode,
    notes: invoice.notes || null,
    includesCourse,
  };

  const isReceipt = amountPaid > 0;
  const docHeading = isReceipt ? 'Receipt' : 'Invoice';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A162B] via-[#0E0C1A] to-[#161226] print:bg-white text-black font-sans selection:bg-gray-200 relative overflow-hidden">
      {/* Ambient Luminous Glass Bubble Orbs (Screen Only) */}
      <div className="no-print fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-gradient-to-br from-indigo-500/35 via-purple-600/30 to-pink-500/20 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-48 -right-48 w-[42rem] h-[42rem] rounded-full bg-gradient-to-tl from-fuchsia-600/35 via-purple-700/30 to-teal-400/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55rem] h-[55rem] rounded-full bg-gradient-to-r from-violet-600/25 via-pink-600/20 to-indigo-500/20 blur-[140px]" />
        <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[60px]" />
      </div>

      {/* Screen Only Floating Glass Toolbar */}
      <div className="no-print sticky top-0 z-50 bg-white/[0.06] backdrop-blur-2xl text-white py-3.5 px-4 border-b border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link
            href={`/crm360/billing/invoices/${id}`}
            className="text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Invoice
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-2 border border-white/20 backdrop-blur-md shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4.5 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold transition flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            >
              <Printer className="w-3.5 h-3.5" /> Print {docHeading}
            </button>
          </div>
        </div>
      </div>

      {/* Paper Canvas Container */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-[210mm] mx-auto my-10 print:my-0 shadow-[0_25px_70px_rgba(0,0,0,0.85)] print:shadow-none"
      >
        <ReceiptDocument clinic={clinic} data={receiptData} />
      </motion.div>
    </div>
  );
}
