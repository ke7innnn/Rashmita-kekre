'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

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
    document.title = `Invoice-${invNum}-${patientName}.pdf`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-black">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500 mb-3" />
        <p className="text-sm font-medium text-gray-600">Preparing invoice for print...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-black">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mb-4">
          {error || 'Invoice not found'}
        </div>
        <Link href="/crm360/billing/invoices" className="text-xs text-blue-600 underline">
          Return to Invoice Directory
        </Link>
      </div>
    );
  }

  const total = Number(invoice.totalAmount);
  const paid = Number(invoice.paidAmount);
  const balance = Math.max(0, total - paid);
  const hasCourse = invoice.lines.some((l: any) => l.patientPackageId || l.description?.toLowerCase().includes('course') || l.description?.toLowerCase().includes('package'));

  const clinicName = settings?.name || 'Health 360 Physiotherapy Clinic';
  const doctorCredentials = settings?.doctorNameCredentials || 'Dr. Rashmita Karvir Kekre, B.P.Th. (M.I.A.P.), BCST';
  const clinicAddress = settings?.address || 'Shop No. 4, Sunrise Apartments, Carter Road, Bandra West, Mumbai, MH - 400050';
  const clinicPhone = settings?.phone || '+91 98200 98200';
  const clinicEmail = settings?.email || 'info@health360physio.com';
  const logoUrl = settings?.logoUrl;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A162B] via-[#0E0C1A] to-[#161226] print:bg-white text-black font-sans selection:bg-gray-200 relative overflow-hidden">
      {/* Ambient Luminous Glass Bubble Orbs (Screen Only) */}
      <div className="no-print fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Glass Bubble 1: Top Left Vibrant Indigo/Purple Glass Sphere */}
        <div className="absolute -top-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-gradient-to-br from-indigo-500/35 via-purple-600/30 to-pink-500/20 blur-[100px] animate-pulse" />
        {/* Glass Bubble 2: Bottom Right Fuchsia/Violet/Cyan Glass Sphere */}
        <div className="absolute -bottom-48 -right-48 w-[42rem] h-[42rem] rounded-full bg-gradient-to-tl from-fuchsia-600/35 via-purple-700/30 to-teal-400/20 blur-[120px]" />
        {/* Glass Bubble 3: Center Ambient Violet Glass Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55rem] h-[55rem] rounded-full bg-gradient-to-r from-violet-600/25 via-pink-600/20 to-indigo-500/20 blur-[140px]" />
        {/* Glass Overlay Frosted Backdrop */}
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
              <Printer className="w-3.5 h-3.5" /> Print Invoice
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

      {/* A4 Paper Screen Preview Container with Entrance Animation */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="print-container relative z-10 max-w-[210mm] mx-auto my-10 print:my-0 bg-white p-[15mm] shadow-[0_25px_70px_rgba(0,0,0,0.85)] print:shadow-none border border-black/10 print:border-0 rounded-[2px] print:rounded-none text-black"
      >
        {/* Top Header Band */}
        <div className="flex justify-between items-start gap-6 pb-4 border-b border-black/20">
          {/* LEFT: Logo / Clinic Info */}
          <div className="space-y-1 max-w-[65%]">
            {logoUrl ? (
              <img src={logoUrl} alt={clinicName} className="max-h-[18mm] object-contain mb-1" />
            ) : (
              <h1 className="text-[16pt] font-semibold tracking-tight text-black leading-tight">
                {clinicName}
              </h1>
            )}
            {logoUrl && (
              <h2 className="text-[12pt] font-semibold text-black leading-snug">
                {clinicName}
              </h2>
            )}
            <p className="text-[10pt] font-medium text-gray-800">
              {doctorCredentials}
            </p>
            <p className="text-[9pt] text-gray-600 leading-snug pt-0.5">
              {clinicAddress}
            </p>
            <p className="text-[9pt] text-gray-600">
              Phone: {clinicPhone} · Email: {clinicEmail}
            </p>
          </div>

          {/* RIGHT: Invoice Meta */}
          <div className="text-right space-y-1 shrink-0">
            <span className="text-[9pt] font-bold text-gray-500 uppercase tracking-widest block">
              INVOICE
            </span>
            <div className="text-[14pt] font-semibold text-black whitespace-nowrap leading-none pt-0.5">
              {invoice.invoiceNumber}
            </div>
            <div className="text-[9.5pt] text-gray-700 pt-1">
              Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            {invoice.dueDate && (
              <div className="text-[9pt] text-gray-600">
                Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>

        {/* Billed To Section */}
        <div className="grid grid-cols-2 gap-6 my-5 text-[9.5pt]">
          <div>
            <span className="text-[8.5pt] font-bold uppercase tracking-wider text-gray-500 block mb-0.5">
              Billed To
            </span>
            <div className="text-[11pt] font-bold text-black">{invoice.patient?.fullName}</div>
            <div className="text-gray-700">{invoice.patient?.phone}</div>
          </div>
          {invoice.patient?.address && (
            <div className="text-right">
              <span className="text-[8.5pt] font-bold uppercase tracking-wider text-gray-500 block mb-0.5">
                Address
              </span>
              <div className="text-gray-700 whitespace-pre-line">{invoice.patient.address}</div>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="my-6">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="border-b border-black/30 text-[8.5pt] font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-2 pr-2 text-left" style={{ width: '55%' }}>Description</th>
                <th className="py-2 px-2 text-center" style={{ width: '10%' }}>Qty</th>
                <th className="py-2 px-2 text-right" style={{ width: '15%' }}>Unit Price</th>
                <th className="py-2 pl-2 text-right" style={{ width: '20%' }}>Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-[9.5pt]">
              {invoice.lines.map((line: any) => (
                <tr key={line.id} className="page-break-avoid">
                  <td className="py-[3mm] pr-2 font-medium text-black align-top break-words">
                    {line.description}
                    {line.isCoveredByPackage && (
                      <span className="block text-[8pt] text-gray-500 font-normal italic">
                        (Covered by Course)
                      </span>
                    )}
                  </td>
                  <td className="py-[3mm] px-2 text-center tabular-nums text-gray-800 align-top">
                    {line.quantity}
                  </td>
                  <td className="py-[3mm] px-2 text-right tabular-nums text-gray-800 align-top">
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

        {/* Totals & Notes Section */}
        <div className="flex justify-between items-start gap-8 pt-4 border-t border-black/20 page-break-avoid">
          {/* Left: Notes & Expiry Terms */}
          <div className="space-y-2 max-w-[50%] text-[8.5pt] text-gray-700">
            {hasCourse && (
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded font-medium text-black">
                Package valid 45 days from date of purchase. Unused sessions are not refundable.
              </div>
            )}
            {invoice.notes && (
              <p className="italic text-gray-600">
                Notes: {invoice.notes}
              </p>
            )}
            {settings?.upiId && (
              <p className="text-gray-600 pt-1">
                UPI Payment ID: <span className="font-semibold text-black">{settings.upiId}</span>
              </p>
            )}
          </div>

          {/* Right: Totals Block (Dominant Balance Due) */}
          <div className="w-[45%] space-y-1.5 text-[9.5pt]">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium">{formatCurrency(invoice.subtotalAmount)}</span>
            </div>
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-gray-700">
                <span>Discount</span>
                <span className="tabular-nums font-medium">- {formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[10.5pt] text-black pt-1.5 border-t border-black/20">
              <span>Total Amount</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Paid Amount</span>
              <span className="tabular-nums font-medium">{formatCurrency(paid)}</span>
            </div>
            {/* Balance Due (Strong Monochrome Dominance) */}
            <div className="flex justify-between font-extrabold text-[12pt] text-black pt-2 pb-1 border-t-2 border-b-4 border-black my-1">
              <span>BALANCE DUE</span>
              <span className="tabular-nums">{formatCurrency(balance)}</span>
            </div>
          </div>
        </div>

        {/* Footer: Signature & Thank You */}
        <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-end page-break-avoid">
          <div className="text-[8.5pt] text-gray-500 italic">
            Thank you for trusting Health 360 with your care.
          </div>
          <div className="text-center w-[40mm]">
            <div className="border-t border-black pt-1 text-[8pt] font-semibold text-gray-800 uppercase tracking-wider">
              Authorised Signatory
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
