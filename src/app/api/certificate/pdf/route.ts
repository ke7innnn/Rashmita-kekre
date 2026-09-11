import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
// @ts-ignore – pdfkit is CJS-only; types are in @types/pdfkit but not ESM-resolvable
const PDFDocument = require('pdfkit');
import path from 'path';
import fs from 'fs';

// ─── Types ────────────────────────────────────────────────────────────────────
type CertificateType = 'treatment_payment' | 'fitness' | 'unfitness' | 'discharge_summary';

interface CertificateData {
  type: CertificateType;
  issueDate?: string;
  patientName?: string;
  age?: string;
  gender?: string;
  diagnosis?: string;
  startDate?: string;
  endDate?: string;
  sessions?: string;
  treatmentProvided?: string;
  chargesPerSession?: string;
  totalAmount?: string;
  assessmentDate?: string;
  symptomsCondition?: string;
  reviewDate?: string;
  reviewWeeks?: string;
  adviceRestrictions?: string;
  remarks?: string;
  complaints?: string;
  findings?: string;
  otherTreatment?: string;
  outcome?: string;
  homeAdvice?: string;
  precautions?: string;
  fitnessOptions?: Record<string, boolean>;
  progressOptions?: Record<string, boolean>;
  followupOptions?: Record<string, boolean>;
  dischargeStatusOptions?: Record<string, boolean>;
}

// ─── Palette (Matching Clinic Identity & Reference Certificate) ───────────────
const PRIMARY_BLUE = '#0284C7';
const DARK_SLATE   = '#0F172A';
const BODY_SLATE   = '#1E293B';
const MUTED_GRAY   = '#64748B';
const LIGHT_BG     = '#F8FAFC';
const BORDER_COLOR = '#CBD5E1';

// Page geometry (A4 is 595.28 x 841.89 pt)
const LEFT_X   = 40;
const PAGE_W   = 595.28;
const PAGE_H   = 841.89;
const USABLE_W = PAGE_W - (LEFT_X * 2); // 515.28 pt

// ─── Shared Layout Primitives ─────────────────────────────────────────────────

function renderHeader(doc: any, logoPath: string | null) {
  // 1. Logo on Left (Clean white letterhead)
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, LEFT_X, 28, { height: 56, fit: [160, 56] });
    } catch {}
  }

  // 2. Doctor credentials on Right
  const rightX = PAGE_W - 250;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK_SLATE)
    .text('Dr. Rashmita Karvir Kekre', rightX, 24, { align: 'right', width: 210 });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(PRIMARY_BLUE)
    .text('B.P.Th. (M.I.A.P.)  |  BCST', rightX, 38, { align: 'right', width: 210 });
  doc.font('Helvetica').fontSize(7.5).fillColor('#334155')
    .text('+91 8071 583 519  ·  8482812859', rightX, 50, { align: 'right', width: 210 })
    .text('health360vasai@gmail.com', rightX, 61, { align: 'right', width: 210 })
    .text('Shop no. 1 & 2, Shree Amardeep Enclave', rightX, 72, { align: 'right', width: 210 })
    .text('Om Nagar, Vasai West', rightX, 83, { align: 'right', width: 210 });

  // 3. Single clean primary blue accent bar
  doc.save();
  doc.moveTo(LEFT_X, 98).lineTo(PAGE_W - LEFT_X, 98)
    .strokeColor(PRIMARY_BLUE).lineWidth(2).stroke();
  doc.restore();

  // Reset text cursor
  doc.x = LEFT_X;
  doc.y = 116;
}

function renderRunningHeader(doc: any, title: string, pageNum: number) {
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PRIMARY_BLUE).text('HEALTH 360  ', LEFT_X, 26, { continued: true });
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED_GRAY).text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', { continued: false });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK_SLATE).text(`${title} · Page ${pageNum}`, LEFT_X, 26, { align: 'right', width: USABLE_W });
  
  doc.save();
  doc.moveTo(LEFT_X, 40).lineTo(PAGE_W - LEFT_X, 40)
    .strokeColor('#CBD5E1').lineWidth(0.8).stroke();
  doc.restore();

  doc.x = LEFT_X;
  doc.y = 54;
}

function renderDateRow(doc: any, dateStr: string, yPos: number) {
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Date: ', LEFT_X, yPos, { continued: true });
  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE).text(dateStr);
}

function renderTitleBlock(doc: any, title: string, subtitle = 'To Whomsoever It May Concern', yPos: number) {
  doc.font('Helvetica-Bold').fontSize(13.5).fillColor(DARK_SLATE)
    .text(title, LEFT_X, yPos, { align: 'center', width: USABLE_W, characterSpacing: 0.5 });
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED_GRAY)
    .text(subtitle, LEFT_X, yPos + 18, { align: 'center', width: USABLE_W });
}

function drawCheckbox(doc: any, x: number, y: number, checked: boolean, label: string) {
  doc.save();
  if (checked) {
    doc.roundedRect(x, y, 13, 13, 2.5).fillAndStroke('#E0F2FE', PRIMARY_BLUE);
    doc.moveTo(x + 2.8, y + 6.8)
       .lineTo(x + 5.3, y + 10.3)
       .lineTo(x + 10.3, y + 3.4)
       .lineWidth(1.6)
       .strokeColor(PRIMARY_BLUE)
       .stroke();
  } else {
    doc.roundedRect(x, y, 13, 13, 2.5).strokeColor('#94A3B8').lineWidth(1).stroke();
  }
  doc.restore();

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE)
    .text(label, x + 20, y + 1.5, { lineBreak: false });
}

function renderDashedBox(doc: any, x: number, y: number, w: number, h: number, title: string | null, content: string | null) {
  doc.save();
  doc.roundedRect(x, y, w, h, 4).fill(LIGHT_BG);
  doc.dash(4, { space: 3 });
  doc.roundedRect(x, y, w, h, 4).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
  doc.restore();

  let curY = y + 8;
  if (title) {
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE)
      .text(title, x + 12, curY, { width: w - 24 });
    curY += 14;
  }
  if (content) {
    doc.font('Helvetica').fontSize(9).fillColor(BODY_SLATE)
      .text(content, x + 12, curY, { width: w - 24, lineGap: 2.5 });
  }
}

function renderSignature(doc: any, sigPath: string | null, yPos: number) {
  doc.font('Helvetica').fontSize(9.5).fillColor('#475569').text('Sincerely,', LEFT_X, yPos);

  const sigImgY = yPos + 12;
  if (sigPath && fs.existsSync(sigPath)) {
    try {
      doc.image(sigPath, LEFT_X, sigImgY, { height: 44, fit: [140, 44] });
    } catch {}
  }

  const lineY = sigImgY + 46;
  doc.save();
  doc.moveTo(LEFT_X, lineY).lineTo(LEFT_X + 175, lineY)
    .strokeColor(DARK_SLATE).lineWidth(1.2).stroke();
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK_SLATE)
    .text('Dr. Rashmita Karvir-Kekre (PT)', LEFT_X, lineY + 6);
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED_GRAY)
    .text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', LEFT_X, lineY + 19);
}

function renderFooter(doc: any, pageNum?: number, totalPages?: number) {
  const oldBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0; // Prevent auto-page break

  doc.save();
  doc.moveTo(LEFT_X, PAGE_H - 32).lineTo(PAGE_W - LEFT_X, PAGE_H - 32)
    .strokeColor(BORDER_COLOR).lineWidth(0.5).stroke();
  doc.restore();

  const text =
    'Health 360 Physiotherapy & Craniosacral Therapy Clinic · Shop No. 1 & 2, Shree Amardeep Enclave, Om Nagar, Vasai West · Tel: +91 8071 583 519' +
    (pageNum && totalPages ? `  |  Page ${pageNum} of ${totalPages}` : '');
  doc.fontSize(7).fillColor('#94A3B8').text(text, LEFT_X, PAGE_H - 24, {
    align: 'center',
    width: USABLE_W,
    lineBreak: false,
  });

  doc.page.margins.bottom = oldBottom;
}

// ─── 1. Fitness Certificate (Full, Majestic, Balanced) ─────────────────────────
function buildFitness(doc: any, d: CertificateData, sigPath: string | null) {
  renderDateRow(doc, d.issueDate || '10 Sept 2026', 122);
  renderTitleBlock(doc, 'FITNESS CERTIFICATE', 'To Whomsoever It May Concern', 154);

  const pName = d.patientName || 'Malin Fernandes';
  const ageStr = d.age ? `, aged ${d.age} years,` : ', aged 30 years,';

  doc.y = 208;
  doc.x = LEFT_X;
  doc.font('Helvetica').fontSize(10).fillColor(BODY_SLATE)
    .text('This is to certify that Mr./Ms. ', LEFT_X, doc.y, { continued: true, width: USABLE_W, lineGap: 3.5 })
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text(pName, { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text(`${ageStr} has undergone physiotherapy assessment and/or treatment at Health 360 Physiotherapy & Craniosacral Therapy Clinic.`);
  doc.moveDown(0.8);

  doc.font('Helvetica').fontSize(10).fillColor(BODY_SLATE)
    .text(`Upon assessment on ${d.assessmentDate || d.issueDate || '10 Sept 2026'}, the individual is found to be:`, LEFT_X, doc.y, { width: USABLE_W });
  doc.moveDown(0.8);

  const fitnessItems = [
    { key: 'work', label: 'Fit for Work Duties' },
    { key: 'sports', label: 'Fit for Sports Participation' },
    { key: 'gym', label: 'Fit for Gym / Fitness Activities' },
    { key: 'school', label: 'Fit for School / College Activities' },
    { key: 'travel', label: 'Fit for Travel' },
    { key: 'daily', label: 'Fit for Daily Activities' },
    { key: 'regular', label: 'Fit to Resume Regular Activities' },
  ];

  const fo = d.fitnessOptions || { work: true, sports: true, gym: true, school: true, travel: true, daily: true, regular: true, advice: true };

  fitnessItems.forEach((item) => {
    const checked = fo[item.key] !== false;
    const yPos = doc.y;
    drawCheckbox(doc, LEFT_X + 4, yPos, checked, item.label);
    doc.y = yPos + 20;
  });

  const adviceChecked = fo['advice'] !== false || !!d.adviceRestrictions;
  const advY = doc.y;
  drawCheckbox(doc, LEFT_X + 4, advY, adviceChecked, 'Fit with the Following Advice / Restrictions:');
  doc.y = advY + 18;

  const adviceText = d.adviceRestrictions || 'Perform active warmup, avoid lifting > 15kg without lumbar support for 2 weeks';
  if (adviceText) {
    doc.font('Helvetica').fontSize(9).fillColor(BODY_SLATE)
      .text(adviceText, LEFT_X + 24, doc.y, { width: USABLE_W - 24 });
    doc.moveDown(0.7);
  }

  // Remarks Box
  doc.moveDown(0.4);
  const remBoxY = doc.y;
  const remH = 48;
  renderDashedBox(doc, LEFT_X, remBoxY, USABLE_W, remH, 'Remarks:', d.remarks || 'Patient demonstrates full pain-free functional range of motion and normal muscle power.');
  doc.y = remBoxY + remH + 16;

  // Disclaimer
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED_GRAY).text(
    "This certificate is issued based on the individual's current functional status and assessment findings and is valid as of the date of examination.",
    LEFT_X, doc.y, { width: USABLE_W }
  );

  renderSignature(doc, sigPath, Math.max(doc.y + 28, 560));
  renderFooter(doc, 1, 1);
}

// ─── 2. Treatment & Payment Certificate (Spacious & Boxed) ────────────────────
function buildTreatmentPayment(doc: any, d: CertificateData, sigPath: string | null) {
  renderDateRow(doc, d.issueDate || '10 Sept 2026', 122);
  renderTitleBlock(doc, 'TREATMENT & PAYMENT CERTIFICATE', 'To Whomsoever It May Concern', 154);

  const pName = d.patientName || 'Malin Fernandes';
  const ageStr = d.age ? `, aged ${d.age} years,` : ', aged 35 years,';
  const diagStr = d.diagnosis || 'Cervical Spondylosis / Musculoskeletal Pain';

  doc.y = 208;
  doc.x = LEFT_X;
  doc.font('Helvetica').fontSize(10).fillColor(BODY_SLATE)
    .text('This is to certify that Mr./Ms. ', LEFT_X, doc.y, { continued: true, width: USABLE_W, lineGap: 3.5 })
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text(pName, { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text(`${ageStr} was treated at Health 360 Physiotherapy & Craniosacral Therapy Clinic, Vasai West for `)
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text(diagStr, { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text('.');
  doc.moveDown(0.9);

  doc.font('Helvetica').fontSize(10).fillColor(BODY_SLATE)
    .text('The patient underwent physiotherapy treatment from ', LEFT_X, doc.y, { continued: true, width: USABLE_W })
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text(d.startDate || '1 Aug 2026', { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text(' to ')
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text(d.endDate || '10 Sept 2026', { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text('.');
  doc.moveDown(1.0);

  // Treatment details rounded box
  const boxY = doc.y;
  const boxH = 160;
  doc.save();
  doc.roundedRect(LEFT_X, boxY, USABLE_W, boxH, 6).fillAndStroke(LIGHT_BG, BORDER_COLOR);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK_SLATE)
    .text('Treatment details are as follows:', LEFT_X + 16, boxY + 12);

  const bulletRow = (label: string, val: string, yPos: number, isBoldVal = false) => {
    doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE).text(`• ${label}`, LEFT_X + 16, yPos, { lineBreak: false });
    const valX = LEFT_X + 270;
    const cleanVal = String(val).replace(/₹/g, 'Rs. ');
    if (isBoldVal) {
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text(cleanVal, valX, yPos, { width: USABLE_W - 286 });
    } else {
      doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE).text(cleanVal, valX, yPos, { width: USABLE_W - 286 });
    }
  };

  bulletRow('Diagnosis / Condition:', d.diagnosis || 'Cervical Spine Rehabilitation', boxY + 34);
  bulletRow('Treatment Period:', `${d.startDate || '1 Aug 2026'} to ${d.endDate || '10 Sept 2026'}`, boxY + 54);
  bulletRow('Number of Sessions Attended:', `${d.sessions || '10 Sessions'}`, boxY + 74);
  bulletRow('Treatment Provided:', d.treatmentProvided || 'Manual Therapy, Spinal Mobilization, Postural Ergonomics & Strengthening', boxY + 94);
  bulletRow('Consultation & Physiotherapy Charges per Session:', `Rs. ${d.chargesPerSession || '650.00'}`, boxY + 116);
  bulletRow('Total Amount Paid:', `Rs. ${d.totalAmount || '6,500.00'}`, boxY + 136, true);

  doc.y = boxY + boxH + 18;
  doc.font('Helvetica-Oblique').fontSize(9).fillColor(MUTED_GRAY).text(
    'The above treatment was medically necessary and was provided under the supervision of a qualified physiotherapist for the management and rehabilitation of the condition.',
    LEFT_X, doc.y, { width: USABLE_W, lineGap: 2.5 }
  );

  renderSignature(doc, sigPath, Math.max(doc.y + 28, 550));
  renderFooter(doc, 1, 1);
}

// ─── 3. Unfitness for Work Certificate (Exact Match with Reference) ───────────
function buildUnfitness(doc: any, d: CertificateData, sigPath: string | null) {
  renderDateRow(doc, d.issueDate || '10 Sept 2026', 122);
  renderTitleBlock(doc, 'UNFITNESS FOR WORK CERTIFICATE', 'To Whomsoever It May Concern', 154);

  const pName = d.patientName || 'Malin Fernandes';
  const ageStr = d.age ? `, aged ${d.age} years,` : ', aged 35 years,';

  doc.y = 208;
  doc.x = LEFT_X;
  doc.font('Helvetica').fontSize(10).fillColor(BODY_SLATE)
    .text('This is to certify that Mr./Ms. ', LEFT_X, doc.y, { continued: true, width: USABLE_W, lineGap: 3.5 })
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text(pName, { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text(`${ageStr} has undergone physiotherapy assessment and/or treatment at Health 360 Physiotherapy & Craniosacral Therapy Clinic.`);
  doc.moveDown(0.9);

  doc.font('Helvetica').fontSize(10).fillColor(BODY_SLATE)
    .text(`Upon assessment on `, LEFT_X, doc.y, { continued: true, width: USABLE_W, lineGap: 3.5 })
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text(d.assessmentDate || d.issueDate || '10 Sept 2026', { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text(', the individual is currently experiencing ')
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text(d.symptomsCondition || d.diagnosis || 'Acute Lumbar Radiculopathy with Severe Muscle Spasms', { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text(' and is ')
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text('NOT FIT TO PERFORM REGULAR WORK DUTIES', { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text(' from ')
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text(d.startDate || '10 Sept 2026', { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text(' to ')
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text(d.endDate || '17 Sept 2026', { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text('.');
  doc.moveDown(0.9);

  doc.font('Helvetica').fontSize(10).fillColor(BODY_SLATE)
    .text('The patient has been advised to rest and continue the prescribed treatment program during this period to facilitate recovery and prevent aggravation of the condition.', LEFT_X, doc.y, { width: USABLE_W, lineGap: 3.5 });
  doc.moveDown(0.9);

  // Remarks Box
  const remBoxY = doc.y;
  const remH = 54;
  renderDashedBox(doc, LEFT_X, remBoxY, USABLE_W, remH, 'Remarks:', d.remarks || 'Patient advised complete spinal offloading, modalities treatment daily, and avoidance of prolonged sitting or lifting.');
  doc.y = remBoxY + remH + 16;

  // Review assessment advice
  doc.font('Helvetica').fontSize(10).fillColor(BODY_SLATE)
    .text('A review assessment is advised on or after ', LEFT_X, doc.y, { continued: true, width: USABLE_W, lineGap: 3 })
    .font('Helvetica-Bold').fillColor(DARK_SLATE).text(d.reviewDate || '18 Sept 2026', { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text(' to determine fitness for return to work.');
  doc.moveDown(0.8);

  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED_GRAY).text(
    "This certificate is issued based on the individual's current functional status and assessment findings.",
    LEFT_X, doc.y, { width: USABLE_W }
  );

  renderSignature(doc, sigPath, Math.max(doc.y + 28, 550));
  renderFooter(doc, 1, 1);
}

// ─── 4. Physiotherapy Discharge Summary (2 Complete Pages) ─────────────────────
function buildDischargeSummary(doc: any, d: CertificateData, sigPath: string | null) {
  // ─── PAGE 1 ─────────────────────────────────────────────────────────────
  renderDateRow(doc, d.issueDate || '10 Sept 2026', 122);
  renderTitleBlock(doc, 'PHYSIOTHERAPY DISCHARGE SUMMARY', 'To Whomsoever It May Concern', 154);

  // Meta Table
  const metaBoxY = 194;
  const metaBoxH = 130;
  doc.save();
  doc.roundedRect(LEFT_X, metaBoxY, USABLE_W, metaBoxH, 4).strokeColor(BORDER_COLOR).lineWidth(1).stroke();
  for (let i = 1; i < 6; i++) {
    const lineY = metaBoxY + i * 21.6;
    doc.moveTo(LEFT_X, lineY).lineTo(PAGE_W - LEFT_X, lineY).strokeColor('#E2E8F0').lineWidth(0.8).stroke();
  }
  doc.restore();

  const metaRow = (label: string, val: string, idx: number) => {
    const rowY = metaBoxY + idx * 21.6 + 6;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text(label, LEFT_X + 12, rowY, { width: 160 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE).text(val, LEFT_X + 180, rowY, { width: USABLE_W - 192 });
  };

  metaRow('Patient Name:', d.patientName || 'Malin Fernandes', 0);
  metaRow('Age / Gender:', `${d.age ? `${d.age} Yrs` : '38 Yrs'} / ${d.gender || 'Female'}`, 1);
  metaRow('Diagnosis:', d.diagnosis || 'Frozen Shoulder (Adhesive Capsulitis)', 2);
  metaRow('Date of Initial Assessment:', d.startDate || '10 Aug 2026', 3);
  metaRow('Date of Discharge:', d.endDate || '10 Sept 2026', 4);
  metaRow('Total Sessions Attended:', d.sessions || '12 Sessions', 5);

  doc.y = metaBoxY + metaBoxH + 16;

  // Presenting Complaints
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Presenting Complaints', LEFT_X, doc.y);
  doc.moveDown(0.3);
  const compBoxY = doc.y;
  renderDashedBox(doc, LEFT_X, compBoxY, USABLE_W, 36, null, d.complaints || 'Severe shoulder pain (VAS 8/10), sleep disturbance, restricted overhead reach, inability to perform self-care.');
  doc.y = compBoxY + 48;

  // Assessment Findings
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Assessment Findings', LEFT_X, doc.y);
  doc.moveDown(0.3);
  const findBoxY = doc.y;
  renderDashedBox(doc, LEFT_X, findBoxY, USABLE_W, 36, null, d.findings || 'Initial assessment revealed significant capsular restriction, active abduction limited to 70°, external rotation limited to 20°.');
  doc.y = findBoxY + 48;

  // Treatment Provided
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Treatment Provided', LEFT_X, doc.y);
  doc.moveDown(0.3);
  const treatments = [
    '• Physiotherapy Assessment',
    '• Manual Therapy',
    '• Therapeutic Exercises',
    '• Electrotherapy Modalities (if applicable)',
    '• Patient Education & Home Exercise Program',
    `• Other: ${d.otherTreatment || 'Craniosacral therapy balancing & myofascial trigger release'}`
  ];
  treatments.forEach((t) => {
    doc.font('Helvetica').fontSize(9).fillColor(BODY_SLATE).text(t, LEFT_X + 8);
    doc.moveDown(0.2);
  });

  // Page 1 ends with treatment list and footer; signature is placed only on Page 2
  renderFooter(doc, 1, 2);

  // ─── PAGE 2 ─────────────────────────────────────────────────────────────
  doc.addPage({ size: 'A4', margins: { top: 32, bottom: 20, left: LEFT_X, right: LEFT_X } });
  renderRunningHeader(doc, 'PHYSIOTHERAPY DISCHARGE SUMMARY', 2);

  doc.y = 66;
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Progress Achieved', LEFT_X, doc.y);
  doc.moveDown(0.4);

  const progressItems = [
    { key: 'pain', label: 'Pain Reduced' },
    { key: 'rom', label: 'Range of Motion Improved' },
    { key: 'strength', label: 'Strength Improved' },
    { key: 'functional', label: 'Functional Activities Improved' },
    { key: 'posture', label: 'Posture Improved' },
    { key: 'balance', label: 'Balance / Coordination Improved' },
    { key: 'goals', label: 'Goals Achieved' },
  ];

  const gridStartY = doc.y;
  progressItems.forEach((item, idx) => {
    const col = idx % 2;
    const r = Math.floor(idx / 2);
    const x = col === 0 ? LEFT_X + 4 : LEFT_X + 260;
    const y = gridStartY + r * 20;
    drawCheckbox(doc, x, y, true, item.label);
  });
  doc.y = gridStartY + Math.ceil(progressItems.length / 2) * 20 + 12;

  // Outcome
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Outcome at Discharge', LEFT_X, doc.y);
  doc.moveDown(0.3);
  const outBoxY = doc.y;
  renderDashedBox(doc, LEFT_X, outBoxY, USABLE_W, 36, null, d.outcome || 'Full active range of motion restored (Abduction 170°, ER 75°), pain decreased from VAS 8/10 to 1/10. Functional independence achieved.');
  doc.y = outBoxY + 48;

  // HEP
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Home Exercise Program / Advice', LEFT_X, doc.y);
  doc.moveDown(0.3);
  const hepBoxY = doc.y;
  renderDashedBox(doc, LEFT_X, hepBoxY, USABLE_W, 36, null, d.homeAdvice || 'Continue shoulder pendular swings, wand stretches, and rotator cuff strengthening exercises with light band 3 times per week.');
  doc.y = hepBoxY + 48;

  // Follow-up Recommendations
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Follow-up Recommendations', LEFT_X, doc.y);
  doc.moveDown(0.3);
  const fUpY = doc.y;
  drawCheckbox(doc, LEFT_X + 4, fUpY, true, 'Follow-up only if symptoms recur');
  drawCheckbox(doc, LEFT_X + 4, fUpY + 18, true, 'Review after 4 weeks if needed');
  drawCheckbox(doc, LEFT_X + 4, fUpY + 36, true, 'Continue Home Exercise Program');
  doc.y = fUpY + 58;

  // Discharge Status
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Discharge Status', LEFT_X, doc.y);
  doc.moveDown(0.3);
  const dsY = doc.y;
  drawCheckbox(doc, LEFT_X + 4, dsY, true, 'Successfully Discharged');
  doc.y = dsY + 22;

  // Remarks
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Remarks:', LEFT_X, doc.y);
  doc.moveDown(0.3);
  const rem2Y = doc.y;
  renderDashedBox(doc, LEFT_X, rem2Y, USABLE_W, 34, null, d.remarks || 'Patient was compliant with therapy sessions and achieved excellent functional recovery. Advised to maintain active lifestyle.');
  doc.y = rem2Y + 46;

  renderSignature(doc, sigPath, Math.max(doc.y + 14, 680));
  renderFooter(doc, 2, 2);
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type  = (searchParams.get('type') || 'treatment_payment') as CertificateType;
    let s       = searchParams.get('s') || '';
    const name  = searchParams.get('name') || 'Patient';

    // Decode state safely (restore '+' if query parser turned them to spaces)
    let data: CertificateData = { type };
    if (s) {
      try {
        s = s.replace(/ /g, '+');
        const decoded = decodeURIComponent(Buffer.from(s, 'base64').toString('utf-8'));
        data = { ...JSON.parse(decoded), type };
      } catch { /* use defaults */ }
    }

    // Asset paths (relative to /public)
    const publicDir = path.join(process.cwd(), 'public');
    const logoPath  = path.join(publicDir, 'logo', 'rklogo.png');
    const sigPath   = path.join(publicDir, 'signatures', 'dr-rashmita-signature.png');

    // Build PDF in memory with safe margins
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 32, bottom: 20, left: LEFT_X, right: LEFT_X },
      compress: true,
      autoFirstPage: true,
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const pdfDone = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Render White Official Letterhead (NO dark background bar!)
    renderHeader(doc, fs.existsSync(logoPath) ? logoPath : null);

    // Render body by type
    switch (type) {
      case 'fitness':
        buildFitness(doc, data, fs.existsSync(sigPath) ? sigPath : null);
        break;
      case 'unfitness':
        buildUnfitness(doc, data, fs.existsSync(sigPath) ? sigPath : null);
        break;
      case 'discharge_summary':
        buildDischargeSummary(doc, data, fs.existsSync(sigPath) ? sigPath : null);
        break;
      default:
        buildTreatmentPayment(doc, data, fs.existsSync(sigPath) ? sigPath : null);
    }

    doc.end();
    const pdf = await pdfDone;

    // Sanitize filename
    const safeName = (data.patientName || name).replace(/[^a-z0-9]/gi, '_');
    const typeLabel: Record<string, string> = {
      treatment_payment: 'Treatment_Payment',
      fitness: 'Fitness',
      unfitness: 'Unfitness',
      discharge_summary: 'Discharge_Summary',
    };
    const filename = `Health360_${typeLabel[type] || type}_${safeName}.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });

  } catch (err: any) {
    console.error('[CertPDF] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
