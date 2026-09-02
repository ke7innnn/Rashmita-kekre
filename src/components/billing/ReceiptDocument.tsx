'use client';

import React from 'react';

/* ============================================================
   TYPES
   ============================================================ */

export interface ReceiptLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ClinicProfile {
  name: string;
  tagline: string;
  doctorName: string;
  credentials: string[];
  address: string;
  phone: string;
  email: string;
  logoUrl?: string | null;
}

export type PaymentMode = 'CASH' | 'UPI' | 'CHEQUE' | 'OTHER';

export interface ReceiptData {
  documentNumber: string;
  issueDate: string;
  patientName: string;
  patientPhone: string;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentMode?: PaymentMode | null;
  notes?: string | null;
  includesCourse: boolean;
}

/* ============================================================
   MONEY FORMATTING — Indian grouping
   ============================================================ */

export const formatINR = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

/* ============================================================
   NUMBER TO WORDS — Indian system (lakh / crore)
   ============================================================ */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty',
  'Ninety',
];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const rest = n % 10;
  return rest ? `${TENS[tens]} ${ONES[rest]}` : TENS[tens];
}

function threeDigitWords(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigitWords(rest));
  return parts.join(' ');
}

export function numberToIndianWords(num: number): string {
  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero';

  const crore = Math.floor(n / 10000000);
  let rem = n % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  const hundreds = rem % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${numberToIndianWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigitWords(thousand)} Thousand`);
  if (hundreds) parts.push(threeDigitWords(hundreds));

  return parts.join(' ');
}

export function amountInWords(value: number): string {
  const rupees = Math.floor(Math.abs(value));
  const paise = Math.round((Math.abs(value) - rupees) * 100);
  const base = `${numberToIndianWords(rupees)} Rupees`;
  if (paise > 0) {
    return `${base} and ${twoDigitWords(paise)} Paise Only`;
  }
  return `${base} Only`;
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function ReceiptDocument({
  clinic,
  data,
  onUpdateData,
  onSelectPaymentMode,
}: {
  clinic: ClinicProfile;
  data: ReceiptData;
  onUpdateData?: (updated: Partial<ReceiptData>) => void;
  onSelectPaymentMode?: (mode: PaymentMode) => void;
}) {
  const isReceipt = data.amountPaid > 0;
  const isPaidFull = data.balanceDue <= 0 && data.amountPaid > 0;
  const docTitle = isReceipt ? 'RECEIPT' : 'INVOICE';

  const handleTextChange = (field: keyof ReceiptData) => (e: React.FocusEvent<HTMLElement>) => {
    if (!onUpdateData) return;
    const text = e.currentTarget.innerText.trim();
    onUpdateData({ [field]: text } as any);
  };

  const handleLineChange = (index: number, field: keyof ReceiptLine) => (e: React.FocusEvent<HTMLElement>) => {
    if (!onUpdateData) return;
    const text = e.currentTarget.innerText.trim();
    const newLines = [...data.lines];
    if (newLines[index]) {
      const current = newLines[index];
      let val: any = text;
      if (field === 'quantity' || field === 'unitPrice' || field === 'lineTotal') {
        val = Number(text.replace(/[^0-9.]/g, '')) || 0;
      }
      newLines[index] = { ...current, [field]: val };
      if (field === 'quantity' || field === 'unitPrice') {
        newLines[index].lineTotal = newLines[index].quantity * newLines[index].unitPrice;
      }
      const newTotal = newLines.reduce((acc, l) => acc + l.lineTotal, 0);
      const newBalance = Math.max(0, newTotal - data.amountPaid);
      onUpdateData({ lines: newLines, total: newTotal, subtotal: newTotal, balanceDue: newBalance });
    }
  };

  const handlePaidChange = (e: React.FocusEvent<HTMLElement>) => {
    if (!onUpdateData) return;
    const val = Number(e.currentTarget.innerText.replace(/[^0-9.]/g, '')) || 0;
    const newBalance = Math.max(0, data.total - val);
    onUpdateData({ amountPaid: val, balanceDue: newBalance });
  };

  return (
    <>
      <style jsx global>{CSS}</style>

      <div className="bill-paper">
        {/* ================= 1. CLINIC LETTERHEAD ================= */}
        <div className="bill-header">
          <div className="bill-header-left">
            <img
              src="/logo/rklogo.png"
              alt="Health 360 Logo"
              className="bill-clinic-logo"
            />
            <div>
              <h1 className="bill-clinic-name">Health 360</h1>
              <p className="bill-clinic-tagline">
                Physiotherapy and Craniosacral Therapy Clinic
              </p>
              <p className="bill-clinic-address">
                Shop No.1, Amardeep Society, Om Nagar, Vasai (West), Dist. Palghar - 401202
              </p>
            </div>
          </div>

          <div className="bill-header-right">
            <h2 className="bill-doctor-name">Dr. Rashmita Karvir Kekre</h2>
            <p className="bill-doctor-credentials">B.PTh. (M.I.A.P.) · BCST</p>
            <p className="bill-doctor-title">Consultant Physiotherapist & Craniosacral Therapist</p>
            <p className="bill-doctor-contact">
              Tel: +91 8482812859 · health360vasai@gmail.com
            </p>
          </div>
        </div>

        {/* ================= 2. TITLE BAR ================= */}
        <div className="bill-title-bar">
          <div className="bill-title-text">
            TAX INVOICE / {docTitle}
          </div>
          <div className="bill-status-badge">
            {isPaidFull ? 'PAID IN FULL' : data.amountPaid > 0 ? 'PARTIAL PAYMENT' : 'PAYMENT DUE'}
          </div>
        </div>

        {/* ================= 3. METADATA 2-COLUMN CARDS ================= */}
        <div className="bill-meta-grid">
          {/* Patient Card (Billed To) */}
          <div className="bill-meta-card">
            <div className="bill-card-header">BILLED TO / PATIENT DETAILS</div>
            <div className="bill-card-content">
              <div className="bill-field-row">
                <span className="bill-field-label">Patient Name:</span>
                <span
                  className="bill-field-val font-bold editable-field"
                  contentEditable={!!onUpdateData}
                  suppressContentEditableWarning
                  onBlur={handleTextChange('patientName')}
                >
                  {data.patientName}
                </span>
              </div>
              <div className="bill-field-row">
                <span className="bill-field-label">Contact Phone:</span>
                <span
                  className="bill-field-val editable-field"
                  contentEditable={!!onUpdateData}
                  suppressContentEditableWarning
                  onBlur={handleTextChange('patientPhone')}
                >
                  {data.patientPhone || 'N/A'}
                </span>
              </div>
              <div className="bill-field-row">
                <span className="bill-field-label">Location:</span>
                <span className="bill-field-val">Vasai / Mumbai, Maharashtra</span>
              </div>
            </div>
          </div>

          {/* Invoice Info Card */}
          <div className="bill-meta-card">
            <div className="bill-card-header">INVOICE & RECEIPT PARTICULARS</div>
            <div className="bill-card-content">
              <div className="bill-field-row">
                <span className="bill-field-label">Receipt / Inv No:</span>
                <span
                  className="bill-field-val font-mono font-bold editable-field"
                  contentEditable={!!onUpdateData}
                  suppressContentEditableWarning
                  onBlur={handleTextChange('documentNumber')}
                >
                  {data.documentNumber}
                </span>
              </div>
              <div className="bill-field-row">
                <span className="bill-field-label">Date of Issue:</span>
                <span
                  className="bill-field-val editable-field"
                  contentEditable={!!onUpdateData}
                  suppressContentEditableWarning
                  onBlur={handleTextChange('issueDate')}
                >
                  {data.issueDate}
                </span>
              </div>
              <div className="bill-field-row">
                <span className="bill-field-label">Payment Mode:</span>
                <span className="bill-field-val font-bold text-slate-800">
                  {data.paymentMode || 'UPI / Cash'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 4. LINE ITEMS TABLE ================= */}
        <div className="bill-table-wrapper">
          <table className="bill-table">
            <thead>
              <tr>
                <th style={{ width: '8%', textAlign: 'center' }}>Sr.</th>
                <th style={{ width: '52%' }}>Particulars / Treatment Service</th>
                <th style={{ width: '12%', textAlign: 'center' }}>Qty / Days</th>
                <th style={{ width: '14%', textAlign: 'right' }}>Rate (₹)</th>
                <th style={{ width: '14%', textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((line, idx) => (
                <tr key={line.id}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <span
                      className="editable-field font-semibold"
                      contentEditable={!!onUpdateData}
                      suppressContentEditableWarning
                      onBlur={handleLineChange(idx, 'description')}
                    >
                      {line.description}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      className="editable-field"
                      contentEditable={!!onUpdateData}
                      suppressContentEditableWarning
                      onBlur={handleLineChange(idx, 'quantity')}
                    >
                      {line.quantity}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span
                      className="editable-field font-mono"
                      contentEditable={!!onUpdateData}
                      suppressContentEditableWarning
                      onBlur={handleLineChange(idx, 'unitPrice')}
                    >
                      {formatINR(line.unitPrice)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    <span
                      className="editable-field font-mono"
                      contentEditable={!!onUpdateData}
                      suppressContentEditableWarning
                      onBlur={handleLineChange(idx, 'lineTotal')}
                    >
                      {formatINR(line.lineTotal)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= 5. AMOUNT IN WORDS RIBBON ================= */}
        <div className="bill-words-ribbon">
          <span className="bill-words-label">Amount in Words:</span>
          <span className="bill-words-val">{amountInWords(data.total)}</span>
        </div>

        {/* ================= 6. PAYMENT SUMMARY & TOTALS ================= */}
        <div className="bill-bottom-grid">
          {/* Left: Payment Modes & Terms */}
          <div className="bill-bottom-left">
            <div className="bill-payment-modes-box">
              <span className="bill-payment-modes-title">Mode of Payment:</span>
              <div className="bill-modes-list">
                {(['UPI', 'CASH', 'CHEQUE', 'OTHER'] as const).map(mode => {
                  const isChecked = data.paymentMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onSelectPaymentMode?.(mode)}
                      className={`bill-mode-chip ${isChecked ? 'active' : ''}`}
                    >
                      <span className="bill-chip-check">{isChecked ? '✓' : ''}</span>
                      <span>{mode === 'OTHER' ? 'Card / Other' : mode}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {data.includesCourse && (
              <div className="bill-terms-box">
                <strong>Package Terms:</strong> Package valid 45 days from date of purchase. Unused sessions are non-refundable and non-transferable.
              </div>
            )}

            <div className="bill-notes-box">
              <span className="font-semibold block mb-0.5">Notes / Remarks:</span>
              <p
                className="editable-field italic text-slate-600"
                contentEditable={!!onUpdateData}
                suppressContentEditableWarning
                onBlur={handleTextChange('notes')}
              >
                {data.notes || (onUpdateData ? 'Click to add notes/remarks...' : 'All clinical services rendered as requested.')}
              </p>
            </div>
          </div>

          {/* Right: Accounting Totals Table */}
          <div className="bill-bottom-right">
            <table className="bill-totals-table">
              <tbody>
                <tr>
                  <td className="bill-tot-label">Subtotal</td>
                  <td className="bill-tot-val font-mono">{formatINR(data.subtotal || data.total)}</td>
                </tr>
                {data.discount > 0 && (
                  <tr>
                    <td className="bill-tot-label text-rose-600">Discount</td>
                    <td className="bill-tot-val font-mono text-rose-600">- {formatINR(data.discount)}</td>
                  </tr>
                )}
                <tr className="bill-tot-final">
                  <td className="bill-tot-label font-bold">Total Amount</td>
                  <td className="bill-tot-val font-bold font-mono text-slate-950">{formatINR(data.total)}</td>
                </tr>
                <tr>
                  <td className="bill-tot-label font-semibold text-emerald-700">Amount Paid</td>
                  <td
                    className="bill-tot-val font-bold font-mono text-emerald-700 editable-field"
                    contentEditable={!!onUpdateData}
                    suppressContentEditableWarning
                    onBlur={handlePaidChange}
                  >
                    {formatINR(data.amountPaid)}
                  </td>
                </tr>
                <tr className="bill-tot-balance">
                  <td className="bill-tot-label font-bold">Balance Due</td>
                  <td className="bill-tot-val font-bold font-mono">
                    {formatINR(data.balanceDue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= 7. SIGNATORY & VERIFICATION ================= */}
        <div className="bill-sign-section">
          <div className="bill-sign-left">
            <p className="bill-disclaimer">
              • This is a computer-generated invoice and official clinic receipt.<br />
              • Thank you for choosing Health 360 for your recovery and wellness.
            </p>
          </div>

          <div className="bill-sign-right">
            <div className="bill-sign-for">For HEALTH 360 CLINIC</div>
            <div className="bill-sign-space">
              <div className="bill-sign-line" />
            </div>
            <div className="bill-sign-name">Dr. Rashmita Karvir Kekre</div>
            <div className="bill-sign-role">Authorized Signatory / Consultant</div>
          </div>
        </div>

        {/* ================= 8. FOOTER ================= */}
        <div className="bill-footer">
          Shop No.1, Amardeep Society, Om Nagar, Vasai (W), Dist. Palghar - 401202 · Tel: +91 8482812859 · Email: health360vasai@gmail.com
        </div>
      </div>
    </>
  );
}

/* ============================================================
   STYLES: CLEAN, STRUCTURED CLINIC BILL (SCREEN & PRINT)
   ============================================================ */

const CSS = `
/* Paper container */
.bill-paper {
  background: #ffffff !important;
  color: #0f172a !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 9.5pt;
  line-height: 1.45;
  width: 210mm;
  min-height: 297mm;
  padding: 12mm 14mm;
  box-sizing: border-box;
  margin: 0 auto;
  border: 1px solid #cbd5e1;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

/* 1. Header */
.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8mm;
  padding-bottom: 4mm;
  border-bottom: 2px solid #0f172a;
}
.bill-header-left {
  display: flex;
  align-items: flex-start;
  gap: 3.5mm;
  max-width: 105mm;
}
.bill-clinic-logo {
  height: 16mm;
  width: auto;
  object-fit: contain;
  display: block;
}
.bill-clinic-name {
  font-size: 15pt;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin: 0;
  line-height: 1.1;
}
.bill-clinic-tagline {
  font-size: 7pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #0284c7;
  margin-top: 1mm;
}
.bill-clinic-address {
  font-size: 7.5pt;
  color: #475569;
  margin-top: 1mm;
  line-height: 1.3;
}

.bill-header-right {
  text-align: right;
  max-width: 85mm;
}
.bill-doctor-name {
  font-size: 11pt;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}
.bill-doctor-credentials {
  font-size: 8pt;
  font-weight: 700;
  color: #0369a1;
  margin-top: 0.5mm;
}
.bill-doctor-title {
  font-size: 7.5pt;
  color: #475569;
  margin-top: 0.5mm;
}
.bill-doctor-contact {
  font-size: 7.5pt;
  color: #334155;
  margin-top: 1mm;
  font-weight: 600;
}

/* 2. Title Bar */
.bill-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-top: 0;
  padding: 2mm 4mm;
  margin-bottom: 3.5mm;
}
.bill-title-text {
  font-size: 10pt;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: #0f172a;
  text-transform: uppercase;
}
.bill-status-badge {
  font-size: 8pt;
  font-weight: 800;
  padding: 0.8mm 3mm;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
  letter-spacing: 0.05em;
}

/* 3. Metadata Grid */
.bill-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3.5mm;
  margin-bottom: 3.5mm;
}
.bill-meta-card {
  border: 1px solid #cbd5e1;
  border-radius: 2px;
  overflow: hidden;
  background: #ffffff;
}
.bill-card-header {
  background: #f1f5f9;
  border-bottom: 1px solid #cbd5e1;
  font-size: 7.5pt;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #334155;
  padding: 1.5mm 3mm;
  text-transform: uppercase;
}
.bill-card-content {
  padding: 2.5mm 3mm;
}
.bill-field-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.8mm 0;
  border-bottom: 1px dashed #f1f5f9;
}
.bill-field-row:last-child {
  border-bottom: 0;
}
.bill-field-label {
  font-size: 8pt;
  color: #64748b;
  font-weight: 600;
}
.bill-field-val {
  font-size: 8.5pt;
  color: #0f172a;
  text-align: right;
}

/* 4. Table */
.bill-table-wrapper {
  margin-bottom: 3.5mm;
  border: 1px solid #cbd5e1;
}
.bill-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
}
.bill-table thead th {
  background: #f1f5f9;
  border-bottom: 1.5px solid #0f172a;
  color: #1e293b;
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2.5mm 3mm;
}
.bill-table tbody td {
  padding: 2.8mm 3mm;
  border-bottom: 1px solid #e2e8f0;
  color: #1e293b;
  vertical-align: top;
}
.bill-table tbody tr:last-child td {
  border-bottom: 0;
}
.bill-table tbody tr:nth-child(even) {
  background: #fafafa;
}

/* 5. Words Ribbon */
.bill-words-ribbon {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 2mm 3.5mm;
  font-size: 8pt;
  display: flex;
  gap: 2mm;
  align-items: baseline;
  margin-bottom: 4mm;
}
.bill-words-label {
  font-weight: 700;
  color: #475569;
  white-space: nowrap;
}
.bill-words-val {
  font-style: italic;
  font-weight: 600;
  color: #0f172a;
}

/* 6. Bottom Summary Grid */
.bill-bottom-grid {
  display: grid;
  grid-template-columns: 1fr 78mm;
  gap: 4mm;
  margin-bottom: 5mm;
  align-items: start;
}
.bill-payment-modes-box {
  border: 1px solid #cbd5e1;
  padding: 2mm 3mm;
  border-radius: 2px;
  background: #ffffff;
  margin-bottom: 2.5mm;
}
.bill-payment-modes-title {
  font-size: 7.5pt;
  font-weight: 700;
  text-transform: uppercase;
  color: #475569;
  display: block;
  margin-bottom: 1.5mm;
}
.bill-modes-list {
  display: flex;
  gap: 2mm;
  flex-wrap: wrap;
}
.bill-mode-chip {
  display: inline-flex;
  align-items: center;
  gap: 1.5mm;
  font-size: 7.5pt;
  font-weight: 600;
  padding: 1mm 2.5mm;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
}
.bill-mode-chip.active {
  background: #e0f2fe;
  border-color: #0284c7;
  color: #0369a1;
  font-weight: 700;
}
.bill-chip-check {
  display: inline-block;
  width: 3mm;
  font-weight: 800;
}

.bill-terms-box {
  font-size: 7.5pt;
  color: #475569;
  line-height: 1.35;
  padding: 2mm 3mm;
  background: #fefce8;
  border: 1px solid #fef08a;
  border-radius: 2px;
  margin-bottom: 2.5mm;
}
.bill-notes-box {
  font-size: 7.5pt;
  color: #475569;
  padding: 2mm 3mm;
  border: 1px dashed #cbd5e1;
  border-radius: 2px;
}

/* Totals table */
.bill-totals-table {
  width: 100%;
  border-collapse: collapse;
  border: 1.5px solid #0f172a;
  font-size: 8.5pt;
}
.bill-totals-table td {
  padding: 2.2mm 3.5mm;
  border-bottom: 1px solid #cbd5e1;
}
.bill-tot-label {
  color: #475569;
}
.bill-tot-val {
  text-align: right;
  color: #0f172a;
}
.bill-tot-final {
  background: #f8fafc;
  border-top: 1.5px solid #0f172a;
}
.bill-tot-final .bill-tot-label,
.bill-tot-final .bill-tot-val {
  font-size: 9.5pt;
  color: #0f172a;
}
.bill-tot-balance {
  background: #f1f5f9;
  border-top: 1.5px solid #0f172a;
}
.bill-tot-balance .bill-tot-label,
.bill-tot-balance .bill-tot-val {
  font-size: 10pt;
  color: #0f172a;
}

/* 7. Sign section */
.bill-sign-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-top: 3mm;
  margin-top: 4mm;
}
.bill-sign-left {
  max-width: 105mm;
}
.bill-disclaimer {
  font-size: 7.5pt;
  color: #64748b;
  line-height: 1.4;
  margin: 0;
}
.bill-sign-right {
  text-align: right;
  min-width: 60mm;
}
.bill-sign-for {
  font-size: 8pt;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
}
.bill-sign-space {
  height: 12mm;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}
.bill-sign-line {
  width: 50mm;
  border-top: 1px solid #0f172a;
}
.bill-sign-name {
  font-size: 8.5pt;
  font-weight: 700;
  color: #0f172a;
  margin-top: 1mm;
}
.bill-sign-role {
  font-size: 7.5pt;
  color: #64748b;
}

/* 8. Footer */
.bill-footer {
  margin-top: 6mm;
  padding-top: 2.5mm;
  border-top: 1px solid #cbd5e1;
  text-align: center;
  font-size: 7pt;
  color: #64748b;
  letter-spacing: 0.02em;
}

/* Editable fields in preview */
.editable-field[contenteditable="true"] {
  outline: none;
  border-radius: 2px;
  transition: background 0.15s ease;
}
.editable-field[contenteditable="true"]:hover {
  background: rgba(14, 165, 233, 0.1);
  outline: 1px dashed rgba(14, 165, 233, 0.4);
}
.editable-field[contenteditable="true"]:focus {
  background: rgba(14, 165, 233, 0.15);
  outline: 1.5px solid #0284c7;
}

/* ================= PRINT RULES ================= */
@page {
  size: A4 portrait;
  margin: 10mm;
}

@media print {
  body {
    background: #ffffff !important;
    color: #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .no-print,
  .no-print * {
    display: none !important;
  }
  .bill-paper {
    width: 100% !important;
    min-height: auto !important;
    padding: 0 !important;
    border: 1.5px solid #0f172a !important;
    box-shadow: none !important;
    margin: 0 !important;
  }
  .editable-field {
    outline: none !important;
    background: transparent !important;
  }
}
`;
