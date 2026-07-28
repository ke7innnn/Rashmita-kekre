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

const PAPER: 'a4' | 'a5-landscape' = 'a4';

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

/** 0–99 */
function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const rest = n % 10;
  return rest ? `${TENS[tens]} ${ONES[rest]}` : TENS[tens];
}

/** 0–999 */
function threeDigitWords(n: number): string {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigitWords(rest));
  return parts.join(' ');
}

/** Whole rupees to Indian-system words. */
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
  // Crore can exceed 99, so recurse for that segment.
  if (crore) parts.push(`${numberToIndianWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigitWords(thousand)} Thousand`);
  if (hundreds) parts.push(threeDigitWords(hundreds));

  return parts.join(' ');
}

/** Full "… Rupees Only" phrase, with paise when present. */
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
   TICK BOX
   ============================================================ */

function TickBox({ 
  label, 
  checked, 
  onClick 
}: { 
  label: string; 
  checked: boolean; 
  onClick?: () => void;
}) {
  return (
    <span 
      className={`tickbox ${onClick ? 'cursor-pointer hover:opacity-75 transition-opacity select-none' : ''}`} 
      onClick={onClick}
      title={onClick ? `Click to select ${label}` : undefined}
    >
      <span className="tickbox__square">{checked ? '\u2713' : ''}</span>
      <span className="tickbox__label">{label}</span>
    </span>
  );
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
  // Paper reads RECEIPT once money has been taken, INVOICE before that.
  const isReceipt = data.amountPaid > 0;
  const heading = isReceipt ? 'RECEIPT' : 'INVOICE';
  const numberLabel = isReceipt ? 'Receipt No.' : 'Invoice No.';

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

      <div className={`doc doc--${PAPER}`}>
        {/* ---------- HEADER ---------- */}
        <header className="doc__header">
          <div className="doc__brand">
            {clinic.logoUrl ? (
              <img
                src={clinic.logoUrl}
                alt={clinic.name}
                className="doc__logo"
              />
            ) : (
              <div className="doc__wordmark">{clinic.name}</div>
            )}
            <div className="doc__tagline">{clinic.tagline}</div>
          </div>

          <div className="doc__doctor">
            <div className="doc__doctorName">{clinic.doctorName}</div>
            {clinic.credentials.map((line) => (
              <div key={line} className="doc__credential">
                {line}
              </div>
            ))}
          </div>
        </header>

        <hr className="rule rule--heavy" />

        {/* ---------- META ---------- */}
        <div className="doc__meta">
          <div>
            <span className="meta__label">{numberLabel}:</span>{' '}
            <span 
              className="meta__value editable-field"
              contentEditable={!!onUpdateData}
              suppressContentEditableWarning
              onBlur={handleTextChange('documentNumber')}
            >
              {data.documentNumber}
            </span>
          </div>
          <div className="doc__headingWord">{heading}</div>
          <div className="doc__metaRight">
            <span className="meta__label">Date:</span>{' '}
            <span 
              className="meta__value editable-field"
              contentEditable={!!onUpdateData}
              suppressContentEditableWarning
              onBlur={handleTextChange('issueDate')}
            >
              {data.issueDate}
            </span>
          </div>
        </div>

        {/* ---------- RECEIVED FROM ---------- */}
        <section className="doc__from">
          <div className="field__label">{isReceipt ? 'Received From' : 'Billed To'}</div>
          <div 
            className="field__value editable-field"
            contentEditable={!!onUpdateData}
            suppressContentEditableWarning
            onBlur={handleTextChange('patientName')}
          >
            {data.patientName}
          </div>
          <div 
            className="field__sub editable-field"
            contentEditable={!!onUpdateData}
            suppressContentEditableWarning
            onBlur={handleTextChange('patientPhone')}
          >
            {data.patientPhone}
          </div>
        </section>

        {/* ---------- LINE ITEMS ---------- */}
        <table className="items">
          <thead>
            <tr>
              <th className="items__desc">Description</th>
              <th className="items__qty">Qty</th>
              <th className="items__rate">Unit Price</th>
              <th className="items__amt">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, idx) => (
              <tr key={line.id}>
                <td 
                  className="items__desc editable-field"
                  contentEditable={!!onUpdateData}
                  suppressContentEditableWarning
                  onBlur={handleLineChange(idx, 'description')}
                >
                  {line.description}
                </td>
                <td 
                  className="items__qty editable-field"
                  contentEditable={!!onUpdateData}
                  suppressContentEditableWarning
                  onBlur={handleLineChange(idx, 'quantity')}
                >
                  {line.quantity}
                </td>
                <td 
                  className="items__rate num editable-field"
                  contentEditable={!!onUpdateData}
                  suppressContentEditableWarning
                  onBlur={handleLineChange(idx, 'unitPrice')}
                >
                  {formatINR(line.unitPrice)}
                </td>
                <td className="items__amt num">{formatINR(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ---------- AMOUNT IN WORDS ---------- */}
        <section className="doc__words">
          <span className="field__label">Amount</span>{' '}
          <span className="words__value">{amountInWords(data.total)}</span>
        </section>

        {/* ---------- BOTTOM BAND ---------- */}
        <section className="doc__bottom">
          <div className="doc__bottomLeft">
            <div className="modes">
              <TickBox label="Cash" checked={data.paymentMode === 'CASH'} onClick={onSelectPaymentMode ? () => onSelectPaymentMode('CASH') : undefined} />
              <TickBox label="UPI" checked={data.paymentMode === 'UPI'} onClick={onSelectPaymentMode ? () => onSelectPaymentMode('UPI') : undefined} />
              <TickBox label="Cheque" checked={data.paymentMode === 'CHEQUE'} onClick={onSelectPaymentMode ? () => onSelectPaymentMode('CHEQUE') : undefined} />
              <TickBox label="Other" checked={data.paymentMode === 'OTHER'} onClick={onSelectPaymentMode ? () => onSelectPaymentMode('OTHER') : undefined} />
            </div>

            {data.includesCourse && (
              <p className="terms">
                Package valid 45 days from date of purchase. Unused sessions are
                not refundable.
              </p>
            )}

            <p 
              className="notes editable-field"
              contentEditable={!!onUpdateData}
              suppressContentEditableWarning
              onBlur={handleTextChange('notes')}
            >
              {data.notes || (onUpdateData ? 'Click to add notes...' : '')}
            </p>
          </div>

          <div className="doc__bottomRight">
            <table className="totals">
              <tbody>
                <tr>
                  <td className="totals__label">Total</td>
                  <td className="totals__value num">
                    {formatINR(data.total)}
                  </td>
                </tr>
                <tr>
                  <td className="totals__label">Paid</td>
                  <td 
                    className="totals__value num editable-field"
                    contentEditable={!!onUpdateData}
                    suppressContentEditableWarning
                    onBlur={handlePaidChange}
                  >
                    {formatINR(data.amountPaid)}
                  </td>
                </tr>
                <tr className="totals__balance">
                  <td className="totals__label">Balance</td>
                  <td className="totals__value num">
                    {formatINR(data.balanceDue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------- SIGNATURE ---------- */}
        <section className="doc__sign">
          <div className="sign__rule" />
          <div className="sign__label">By</div>
        </section>

        <div className="doc__thanks">Thank You</div>

        {/* ---------- FOOTER ---------- */}
        <footer className="doc__footer">
          <hr className="rule" />
          <div className="footer__row">
            <span>{clinic.address}</span>
            <span className="footer__dot">·</span>
            <span>{clinic.phone}</span>
            <span className="footer__dot">·</span>
            <span>{clinic.email}</span>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ============================================================
   STYLES
   All print dimensions in mm / pt. Never px.
   ============================================================ */

const CSS = `
.doc {
  background: #fff;
  color: #111;
  font-family: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 10pt;
  line-height: 1.45;
  box-sizing: border-box;
}
.doc *, .doc *::before, .doc *::after { box-sizing: inherit; }

.doc--a4 { width: 210mm; min-height: 297mm; padding: 14mm; }
.doc--a5-landscape { width: 210mm; min-height: 148mm; padding: 10mm; }

.num { font-variant-numeric: tabular-nums; }

/* header */
.doc__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10mm;
}
.doc__logo { max-height: 20mm; width: auto; display: block; }
.doc__wordmark { font-size: 17pt; font-weight: 700; letter-spacing: -0.01em; }
.doc__tagline {
  margin-top: 1.5mm;
  font-size: 7pt;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #555;
  max-width: 70mm;
}
.doc__doctor { text-align: right; }
.doc__doctorName { font-size: 11.5pt; font-weight: 600; }
.doc__credential { font-size: 8.5pt; color: #444; }

/* rules */
.rule { border: 0; border-top: 0.3mm solid #ddd; margin: 4mm 0; }
.rule--heavy { border-top: 0.4mm solid #333; margin: 4mm 0 3mm; }

/* meta */
.doc__meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6mm;
}
.doc__headingWord {
  font-size: 9pt;
  letter-spacing: 0.18em;
  color: #777;
  font-weight: 600;
}
.doc__metaRight { text-align: right; }
.meta__label { font-size: 8.5pt; color: #666; }
.meta__value { font-size: 11pt; font-weight: 600; white-space: nowrap; }

/* received from */
.doc__from { margin-top: 6mm; }
.field__label {
  font-size: 8pt;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #666;
}
.field__value { font-size: 11.5pt; font-weight: 600; margin-top: 1mm; }
.field__sub { font-size: 9pt; color: #444; }

/* items */
.items {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  margin-top: 6mm;
}
.items thead th {
  font-size: 8pt;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #666;
  font-weight: 600;
  border-bottom: 0.3mm solid #333;
  padding-bottom: 2mm;
}
.items tbody td {
  padding: 2.6mm 0;
  border-bottom: 0.2mm solid #eee;
  vertical-align: top;
  font-size: 9.5pt;
}
.items__desc { width: 55%; text-align: left; }
.items__qty  { width: 10%; text-align: center; }
.items__rate { width: 15%; text-align: right; }
.items__amt  { width: 20%; text-align: right; font-weight: 600; }
.items tbody tr { page-break-inside: avoid; }

/* amount in words */
.doc__words {
  margin-top: 5mm;
  padding-bottom: 2mm;
  border-bottom: 0.3mm solid #ddd;
}
.words__value { font-size: 9.5pt; font-style: italic; }

/* bottom band */
.doc__bottom {
  display: flex;
  justify-content: space-between;
  gap: 10mm;
  margin-top: 6mm;
  page-break-inside: avoid;
}
.doc__bottomLeft { flex: 1 1 auto; }
.doc__bottomRight { flex: 0 0 65mm; }

.modes { display: flex; gap: 6mm; flex-wrap: wrap; }
.tickbox { display: inline-flex; align-items: center; gap: 1.6mm; }
.tickbox__square {
  width: 3.6mm;
  height: 3.6mm;
  border: 0.3mm solid #333;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 8pt;
  line-height: 1;
}
.tickbox__label { font-size: 9pt; }

.terms { margin-top: 4mm; font-size: 8pt; color: #444; max-width: 90mm; }
.notes { margin-top: 2mm; font-size: 8pt; font-style: italic; color: #444; }

/* totals */
.totals {
  width: 100%;
  border-collapse: collapse;
  border: 0.3mm solid #333;
}
.totals td { padding: 2.4mm 3mm; border-bottom: 0.2mm solid #ccc; }
.totals tr:last-child td { border-bottom: 0; }
.totals__label { font-size: 9.5pt; }
.totals__value { text-align: right; font-size: 10pt; }
.totals__balance .totals__label,
.totals__balance .totals__value {
  font-weight: 700;
  font-size: 11.5pt;
  border-top: 0.4mm solid #333;
}

/* signature */
.doc__sign {
  margin-top: 14mm;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  page-break-inside: avoid;
}
.sign__rule { width: 45mm; border-top: 0.3mm solid #333; }
.sign__label { font-size: 8pt; color: #555; margin-top: 1mm; }

.doc__thanks {
  margin-top: 6mm;
  text-align: center;
  font-size: 9pt;
  font-style: italic;
  color: #555;
}

/* footer */
.doc__footer { margin-top: 8mm; }
.footer__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2mm;
  font-size: 8.5pt;
  color: #444;
  text-align: center;
}
.footer__dot { color: #aaa; }

/* editable fields */
.editable-field[contenteditable="true"] {
  outline: none;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  border-radius: 2px;
}
.editable-field[contenteditable="true"]:hover {
  background-color: rgba(59, 130, 246, 0.08);
  outline: 1px dashed rgba(59, 130, 246, 0.4);
}
.editable-field[contenteditable="true"]:focus {
  background-color: rgba(59, 130, 246, 0.12);
  outline: 1.5px solid #2563eb;
}

/* ---------- PRINT ---------- */
@page { size: A4 portrait; margin: 14mm; }

@media print {
  .editable-field {
    outline: none !important;
    background: transparent !important;
  }
  .doc {
    width: auto;
    min-height: 0;
    padding: 0;
    box-shadow: none;
    border-radius: 0;
  }
  .doc thead { display: table-header-group; }
  .doc__bottom,
  .doc__sign,
  .totals,
  .items tbody tr { page-break-inside: avoid; }
}
`;
