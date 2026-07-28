'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Printer, Download, ArrowLeft, Loader2, MapPin, Phone, Mail } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { amountInWords } from '@/lib/amountInWords';

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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-black font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500 mb-3" />
        <p className="text-sm font-medium text-gray-600">Preparing receipt for print...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-black font-sans">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mb-4">
          {error || 'Invoice not found'}
        </div>
        <Link href="/crm360/billing/invoices" className="text-xs text-blue-600 underline">
          Return to Invoice Directory
        </Link>
      </div>
    );
  }

  const total = Number(invoice.totalAmount || 0);
  const paid = Number(invoice.paidAmount || 0);
  const balance = Math.max(0, total - paid);
  const isPaid = paid > 0 || invoice.status === 'PAID' || invoice.status === 'PARTIALLY_PAID';
  const docHeading = isPaid ? 'RECEIPT' : 'INVOICE';
  const numberLabel = isPaid ? 'Receipt No.:' : 'Invoice No.:';
  const patientLabel = isPaid ? 'Received From' : 'Billed To';

  const hasCourse = invoice.lines.some((l: any) => l.patientPackageId || l.description?.toLowerCase().includes('course') || l.description?.toLowerCase().includes('package'));

  // Payment Mode Detection
  const primaryPaymentMode = invoice.payments?.[0]?.paymentMode || (paid > 0 ? 'UPI' : '');
  const paymentModes = ['Cash', 'UPI', 'Cheque', 'Other'];

  const clinicName = settings?.name || 'Health360';
  const tagline = settings?.tagline || 'Physiotherapy and Craniosacral Therapy Clinic';
  const clinicAddress = settings?.address || 'Shop No.1, Amardeep Society, Om Nagar, Vasai (W).';
  const clinicPhone = settings?.phone || '8482812859';
  const clinicEmail = settings?.email || 'health360vasai@gmail.com';
  const logoUrl = settings?.logoUrl;

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

      {/* Embedded Print CSS */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            transform: none !important;
            animation: none !important;
          }
          .page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Physical Receipt A4 Paper Preview Container */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="print-container relative z-10 max-w-[210mm] mx-auto my-10 print:my-0 bg-white p-[15mm] shadow-[0_25px_70px_rgba(0,0,0,0.85)] print:shadow-none border border-black/10 print:border-0 rounded-[2px] print:rounded-none text-black flex flex-col justify-between min-h-[270mm]"
      >
        <div>
          {/* 1. HEADER BAND (Two Columns) */}
          <div className="flex justify-between items-start gap-4">
            {/* LEFT: Logo / Clinic Name & Tagline */}
            <div className="space-y-1">
              {logoUrl ? (
                <img src={logoUrl} alt={clinicName} className="max-h-[20mm] object-contain mb-1" />
              ) : (
                <h1 className="text-[16pt] font-semibold tracking-tight text-black leading-tight">
                  {clinicName}
                </h1>
              )}
              <p className="text-[7.5pt] font-semibold uppercase tracking-wider text-black/70">
                {tagline}
              </p>
            </div>

            {/* RIGHT: Doctor Credentials on TWO lines */}
            <div className="text-right shrink-0 leading-snug">
              <h2 className="text-[11pt] font-semibold text-black">
                Dr. Rashmita Karvir Kekre
              </h2>
              <p className="text-[9pt] text-black/90 font-medium">
                B.PTh.(M.I.A.P.)
              </p>
              <p className="text-[9pt] text-black/90 font-medium">
                BCST
              </p>
            </div>
          </div>

          {/* Thin Horizontal Rule */}
          <div className="border-b border-black/20 my-3" />

          {/* 2. META ROW & RECEIPT / INVOICE HEADING */}
          <div className="flex justify-between items-baseline mb-4 text-[11pt]">
            <div className="font-semibold text-black flex items-baseline gap-2">
              <span className="text-[12pt] font-bold text-black">{docHeading}</span>
              <span>{numberLabel} <strong className="font-bold">{invoice.invoiceNumber}</strong></span>
            </div>
            <div className="text-[10pt] text-black/80 font-medium">
              Date: <span className="font-semibold">{new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* 3. RECEIVED FROM / BILLED TO */}
          <div className="mb-4 text-[9.5pt]">
            <span className="text-[8.5pt] font-bold uppercase tracking-wider text-black/50 block mb-0.5">
              {patientLabel}
            </span>
            <div className="text-[11pt] font-semibold text-black">{invoice.patient?.fullName}</div>
            {invoice.patient?.phone && (
              <div className="text-[9pt] text-black/70 font-medium">{invoice.patient.phone}</div>
            )}
          </div>

          {/* 4. LINE ITEMS TABLE */}
          <div className="my-4">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-black/30 text-[8.5pt] font-bold text-black/60 uppercase tracking-wider">
                  <th className="py-2 pr-2 text-left" style={{ width: '55%' }}>Description</th>
                  <th className="py-2 px-2 text-center" style={{ width: '10%' }}>Qty</th>
                  <th className="py-2 px-2 text-right" style={{ width: '15%' }}>Unit Price</th>
                  <th className="py-2 pl-2 text-right" style={{ width: '20%' }}>Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 text-[9.5pt]">
                {invoice.lines.map((line: any) => (
                  <tr key={line.id} className="page-break-avoid">
                    <td className="py-[3mm] pr-2 font-medium text-black align-top break-words">
                      {line.description}
                      {line.isCoveredByPackage && (
                        <span className="block text-[8pt] text-black/50 font-normal italic">
                          (Covered by Course)
                        </span>
                      )}
                    </td>
                    <td className="py-[3mm] px-2 text-center tabular-nums text-black/80 align-top">
                      {line.quantity}
                    </td>
                    <td className="py-[3mm] px-2 text-right tabular-nums text-black/80 align-top">
                      {line.isCoveredByPackage ? '₹0.00' : formatCurrency(line.unitPrice)}
                    </td>
                    <td className="py-[3mm] pl-2 text-right font-bold tabular-nums text-black align-top">
                      {line.isCoveredByPackage ? '₹0.00' : formatCurrency(line.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 5. AMOUNT IN WORDS */}
          <div className="border-b border-black/20 pb-2.5 my-3 text-[9.5pt] italic text-black font-medium">
            Amount: <span className="font-semibold text-black">{amountInWords(total)}</span>
          </div>

          {/* 6. BOTTOM BAND (Payment Mode & Terms Left | Total/Paid/Balance Box Right) */}
          <div className="flex justify-between items-start gap-6 pt-2 page-break-avoid">
            {/* LEFT: Payment Mode Tick Boxes & Course Expiry Terms */}
            <div className="space-y-4 max-w-[55%]">
              <div>
                <span className="text-[8pt] font-bold uppercase tracking-wider text-black/50 block mb-1.5">
                  Payment Mode
                </span>
                <div className="flex flex-wrap items-center gap-3 text-[9pt]">
                  {paymentModes.map((mode) => {
                    const isTicked = primaryPaymentMode.toLowerCase() === mode.toLowerCase() || (paid > 0 && mode === 'UPI' && !primaryPaymentMode);
                    return (
                      <div key={mode} className="flex items-center gap-1.5 font-medium text-black">
                        <span className="w-3.5 h-3.5 border border-black/60 inline-flex items-center justify-center text-[9px] font-bold">
                          {isTicked ? '✓' : ''}
                        </span>
                        <span>{mode}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {hasCourse && (
                <div className="text-[8.5pt] text-black/80 leading-snug font-medium pt-1 border-t border-black/10">
                  Package valid 45 days from date of purchase. Unused sessions are not refundable.
                </div>
              )}
            </div>

            {/* RIGHT: Bordered Box (3 Rows - Monochrome Weight Only) */}
            <div className="w-[42%] border border-black/40 text-[9.5pt] divide-y divide-black/30">
              <div className="flex justify-between px-3 py-1.5 text-black">
                <span className="font-medium">Total</span>
                <span className="tabular-nums font-semibold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between px-3 py-1.5 text-black">
                <span className="font-medium">Paid</span>
                <span className="tabular-nums font-semibold">{formatCurrency(paid)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-black bg-black/[0.03]">
                <span className="font-bold">Balance</span>
                <span className="tabular-nums font-extrabold text-[11pt]">{formatCurrency(balance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7. SIGNATURE ROW & FOOTER BAND */}
        <div className="mt-8 pt-4 page-break-avoid space-y-4">
          {/* Signature Row */}
          <div className="text-right">
            <div className="w-[45mm] border-t border-black/60 ml-auto pt-1 text-center">
              <span className="text-[8pt] font-medium text-black">By</span>
            </div>
          </div>

          {/* Thank You Note */}
          <div className="text-center text-[9pt] italic text-black/70 font-medium">
            Thank You
          </div>

          {/* Footer Band with Middots & Inline Icons */}
          <div className="border-t border-black/20 pt-3 text-[8.5pt] text-black/80 text-center flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-black/60 shrink-0" />
              {clinicAddress}
            </span>
            <span className="text-black/40">·</span>
            <span className="flex items-center gap-1 font-medium">
              <Phone className="w-3 h-3 text-black/60 shrink-0" />
              {clinicPhone}
            </span>
            <span className="text-black/40">·</span>
            <span className="flex items-center gap-1 font-medium">
              <Mail className="w-3 h-3 text-black/60 shrink-0" />
              {clinicEmail}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
