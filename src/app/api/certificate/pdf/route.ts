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

// ─── Colours matching CertificateDocument.tsx ──────────────────────────────────
const PRIMARY_BLUE = '#0284C7';
const DARK_SLATE   = '#0F172A';
const BODY_SLATE   = '#1E293B';
const MUTED_GRAY   = '#64748B';
const LIGHT_BG     = '#F8FAFC';
const BORDER_COLOR = '#E2E8F0';

// Page geometry constants (A4 is 595.28 x 841.89 pt)
const LEFT_X  = 42;
const PAGE_W  = 595.28;
const USABLE_W = PAGE_W - (LEFT_X * 2); // 511.28 pt

// ─── Helpers ──────────────────────────────────────────────────────────────────
function divider(doc: any, y: number, color = BORDER_COLOR, lineWidth = 0.5) {
  doc.save();
  doc.moveTo(LEFT_X, y).lineTo(PAGE_W - LEFT_X, y)
    .strokeColor(color).lineWidth(lineWidth).stroke();
  doc.restore();
}

function renderHeader(doc: any, logoPath: string | null) {
  // Logo on Left (comfortably below top edge, height 50)
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, LEFT_X, 36, { height: 50, fit: [160, 50] });
    } catch {}
  }

  // Doctor credentials on Right
  const rightX = PAGE_W - 250;
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(DARK_SLATE)
    .text('Dr. Rashmita Karvir Kekre', rightX, 32, { align: 'right', width: 208 });
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PRIMARY_BLUE)
    .text('B.P.Th. (M.I.A.P.)  |  BCST', rightX, 46, { align: 'right', width: 208 });
  doc.font('Helvetica').fontSize(7).fillColor('#475569')
    .text('+91 8071 583 519', rightX, 58, { align: 'right', width: 208 })
    .text('rashmita.karvir@gmail.com', rightX, 68, { align: 'right', width: 208 })
    .text('Shop no. 1 & 2, Shree Amardeep Enclave', rightX, 78, { align: 'right', width: 208 })
    .text('Om Nagar, Vasai West', rightX, 88, { align: 'right', width: 208 });

  // Blue Divider Bar across full width (matching CertificateDocument.tsx: border-bottom: 2px solid #0284c7)
  divider(doc, 102, PRIMARY_BLUE, 2);

  // ALWAYS RESET CURSOR TO LEFT MARGIN
  doc.x = LEFT_X;
  doc.y = 114;
}

function renderRunningHeader(doc: any, title: string, pageNum: number) {
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PRIMARY_BLUE).text('HEALTH 360  ', LEFT_X, 26, { continued: true });
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED_GRAY).text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', { continued: false });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK_SLATE).text(`${title} · Page ${pageNum}`, LEFT_X, 26, { align: 'right', width: USABLE_W });
  divider(doc, 40, '#CBD5E1', 0.8);
  doc.x = LEFT_X;
  doc.y = 52;
}

function renderFooter(doc: any, pageNum?: number, totalPages?: number) {
  const pageH = doc.page.height;
  const oldBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0; // Prevent auto-page break

  divider(doc, pageH - 30, BORDER_COLOR, 0.5);
  const text =
    'Health 360 Physiotherapy & Craniosacral Therapy Clinic · Shop No. 1 & 2, Shree Amardeep Enclave, Om Nagar, Vasai West · Tel: +91 8071 583 519' +
    (pageNum && totalPages ? `  |  Page ${pageNum} of ${totalPages}` : '');
  doc.fontSize(7).fillColor('#94A3B8').text(text, LEFT_X, pageH - 22, {
    align: 'center',
    width: USABLE_W,
    lineBreak: false,
  });

  doc.page.margins.bottom = oldBottom;
}

function drawCheckbox(doc: any, x: number, y: number, checked: boolean, label: string) {
  doc.save();
  // Draw box
  doc.roundedRect(x, y + 1, 10.5, 10.5, 1.5)
     .lineWidth(0.8)
     .strokeColor(checked ? PRIMARY_BLUE : '#94A3B8')
     .stroke();

  if (checked) {
    // Sharp checkmark tick
    doc.moveTo(x + 2.5, y + 5.8)
       .lineTo(x + 4.8, y + 9.0)
       .lineTo(x + 9.0, y + 3.0)
       .lineWidth(1.4)
       .strokeColor(PRIMARY_BLUE)
       .stroke();
  }
  doc.restore();

  // Label text
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE)
     .text(label, x + 15, y + 1.5, { lineBreak: false });
}

function renderSignature(doc: any, sigPath: string | null) {
  doc.moveDown(0.6);
  doc.font('Helvetica').fontSize(9).fillColor(BODY_SLATE).text('Sincerely,', LEFT_X);
  doc.moveDown(0.15);

  if (sigPath && fs.existsSync(sigPath)) {
    try {
      doc.image(sigPath, LEFT_X, doc.y, { height: 36, fit: [110, 36] });
      doc.y += 38;
    } catch {
      doc.moveDown(1.2);
    }
  } else {
    doc.moveDown(1.2);
  }

  // Signature line
  doc.moveTo(LEFT_X, doc.y).lineTo(LEFT_X + 150, doc.y).strokeColor(BODY_SLATE).lineWidth(0.8).stroke();
  doc.moveDown(0.2);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Dr. Rashmita Karvir-Kekre (PT)', LEFT_X);
  doc.font('Helvetica').fontSize(8).fillColor(MUTED_GRAY).text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', LEFT_X);
}

// ─── 1. Treatment & Payment Certificate ─────────────────────────────────────────
function buildTreatmentPayment(doc: any, d: CertificateData, sigPath: string | null) {
  // Date on Left
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE).text('Date: ', LEFT_X, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(BODY_SLATE).text(d.issueDate || new Date().toLocaleDateString('en-IN'));
  doc.moveDown(0.4);

  // Title Block
  doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK_SLATE)
    .text('TREATMENT & PAYMENT CERTIFICATE', LEFT_X, doc.y, { align: 'center', width: USABLE_W });
  doc.moveDown(0.15);
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED_GRAY)
    .text('To Whomsoever It May Concern', LEFT_X, doc.y, { align: 'center', width: USABLE_W });
  doc.moveDown(0.7);

  // Body Paragraphs across full width
  const pName = d.patientName || 'Patient Name';
  const ageStr = d.age ? `, aged ${d.age} years,` : '';
  const diagStr = d.diagnosis || 'Cervical Spondylosis / Musculoskeletal Pain';

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE)
    .text(`This is to certify that Mr./Ms. `, LEFT_X, doc.y, { continued: true, width: USABLE_W })
    .font('Helvetica-Bold').text(pName, { continued: true })
    .font('Helvetica').text(`${ageStr} was treated at Health 360 Physiotherapy & Craniosacral Therapy Clinic, Vasai West for `)
    .font('Helvetica-Bold').text(diagStr, { continued: true })
    .font('Helvetica').text('.');
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE)
    .text(`The patient underwent physiotherapy treatment from ${d.startDate || '1 Aug 2026'} to ${d.endDate || '10 Sept 2026'}.`, LEFT_X, doc.y, { width: USABLE_W });
  doc.moveDown(0.6);

  // Details Box
  const boxY = doc.y;
  doc.roundedRect(LEFT_X, boxY, USABLE_W, 108, 4).fillAndStroke(LIGHT_BG, BORDER_COLOR);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE)
    .text('Treatment details are as follows:', LEFT_X + 12, boxY + 8);

  const bulletItem = (label: string, val: string, yPos: number, isBoldVal = false) => {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BODY_SLATE).text(`• ${label}`, LEFT_X + 12, yPos, { continued: true });
    if (isBoldVal) {
      doc.font('Helvetica-Bold').fillColor(DARK_SLATE).text(`  ${val}`);
    } else {
      doc.font('Helvetica').fillColor(BODY_SLATE).text(`  ${val}`);
    }
  };

  bulletItem('Diagnosis / Condition:', d.diagnosis || 'Cervical Spine Rehabilitation', boxY + 24);
  bulletItem('Treatment Period:', `${d.startDate || '1 Aug 2026'} to ${d.endDate || '10 Sept 2026'}`, boxY + 38);
  bulletItem('Number of Sessions Attended:', `${d.sessions || '10 Sessions'}`, boxY + 52);
  bulletItem('Treatment Provided:', d.treatmentProvided || 'Manual Therapy, Spinal Mobilization, Postural Ergonomics & Strengthening', boxY + 66);
  bulletItem('Consultation & Physiotherapy Charges per Session:', `₹ ${d.chargesPerSession || '650.00'}`, boxY + 80);
  bulletItem('Total Amount Paid:', `₹ ${d.totalAmount || '6,500.00'}`, boxY + 94, true);

  doc.y = boxY + 118;
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED_GRAY).text(
    'The above treatment was medically necessary and was provided under the supervision of a qualified physiotherapist for the management and rehabilitation of the condition.',
    LEFT_X, doc.y, { width: USABLE_W }
  );

  renderSignature(doc, sigPath);
  renderFooter(doc, 1, 1);
}

// ─── 2. Fitness Certificate ───────────────────────────────────────────────────
function buildFitness(doc: any, d: CertificateData, sigPath: string | null) {
  // Date on Left (matching preview)
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE).text('Date: ', LEFT_X, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(BODY_SLATE).text(d.issueDate || new Date().toLocaleDateString('en-IN'));
  doc.moveDown(0.4);

  // Title Block
  doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK_SLATE)
    .text('FITNESS CERTIFICATE', LEFT_X, doc.y, { align: 'center', width: USABLE_W });
  doc.moveDown(0.15);
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED_GRAY)
    .text('To Whomsoever It May Concern', LEFT_X, doc.y, { align: 'center', width: USABLE_W });
  doc.moveDown(0.6);

  // Intro Paragraphs across full width
  const pName = d.patientName || 'Patient Name';
  const ageStr = d.age ? `, aged ${d.age} years,` : '';

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE)
    .text(`This is to certify that Mr./Ms. `, LEFT_X, doc.y, { continued: true, width: USABLE_W })
    .font('Helvetica-Bold').text(pName, { continued: true })
    .font('Helvetica').text(`${ageStr} has undergone physiotherapy assessment and/or treatment at Health 360 Physiotherapy & Craniosacral Therapy Clinic.`);
  doc.moveDown(0.4);

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE)
    .text(`Upon assessment on ${d.assessmentDate || d.issueDate || 'Today'}, the individual is found to be:`, LEFT_X, doc.y, { width: USABLE_W });
  doc.moveDown(0.5);

  // All 7 Clearances with sharp vector checkmarks
  const fitnessItems = [
    { key: 'work', label: 'Fit for Work Duties' },
    { key: 'sports', label: 'Fit for Sports Participation' },
    { key: 'gym', label: 'Fit for Gym / Fitness Activities' },
    { key: 'school', label: 'Fit for School / College Activities' },
    { key: 'travel', label: 'Fit for Travel' },
    { key: 'daily', label: 'Fit for Daily Activities' },
    { key: 'regular', label: 'Fit to Resume Regular Activities' },
  ];

  const fo = d.fitnessOptions || { work: true, sports: true, gym: true, daily: true, regular: true };

  fitnessItems.forEach((item) => {
    const checked = !!fo[item.key];
    const yPos = doc.y;
    drawCheckbox(doc, LEFT_X + 6, yPos, checked, item.label);
    doc.y = yPos + 15;
  });

  // Advice & Restrictions Item
  const adviceChecked = !!fo['advice'] || !!d.adviceRestrictions;
  const advY = doc.y;
  drawCheckbox(doc, LEFT_X + 6, advY, adviceChecked, 'Fit with the Following Advice / Restrictions:');
  doc.y = advY + 15;

  if (d.adviceRestrictions) {
    const boxY = doc.y;
    doc.roundedRect(LEFT_X + 22, boxY, USABLE_W - 22, 22, 3).fillAndStroke('#F0F9FF', '#BAE6FD');
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#0369A1')
      .text(d.adviceRestrictions, LEFT_X + 28, boxY + 6, { width: USABLE_W - 34, lineBreak: false });
    doc.y = boxY + 28;
  }

  // Remarks Box
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE).text('Remarks:', LEFT_X, doc.y);
  doc.moveDown(0.15);

  const remY = doc.y;
  doc.roundedRect(LEFT_X, remY, USABLE_W, 26, 3).fillAndStroke(LIGHT_BG, BORDER_COLOR);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE)
    .text(d.remarks || 'Patient demonstrates full pain-free functional range of motion and normal muscle power. Fit to resume duties.', LEFT_X + 8, remY + 7, { width: USABLE_W - 16 });
  doc.y = remY + 34;

  // Disclaimer
  doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED_GRAY).text(
    "This certificate is issued based on the individual's current functional status and assessment findings and is valid as of the date of examination.",
    LEFT_X, doc.y, { width: USABLE_W }
  );

  renderSignature(doc, sigPath);
  renderFooter(doc, 1, 1);
}

// ─── 3. Unfitness for Work Certificate ─────────────────────────────────────────
function buildUnfitness(doc: any, d: CertificateData, sigPath: string | null) {
  // Date on Left
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE).text('Date: ', LEFT_X, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(BODY_SLATE).text(d.issueDate || new Date().toLocaleDateString('en-IN'));
  doc.moveDown(0.4);

  // Title Block
  doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK_SLATE)
    .text('UNFITNESS FOR WORK CERTIFICATE', LEFT_X, doc.y, { align: 'center', width: USABLE_W });
  doc.moveDown(0.15);
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED_GRAY)
    .text('(Medical Rest Certificate)', LEFT_X, doc.y, { align: 'center', width: USABLE_W });
  doc.moveDown(0.6);

  const pName = d.patientName || 'Patient Name';
  const ageStr = d.age ? `, aged ${d.age} years,` : '';

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE)
    .text(`This is to certify that Mr./Ms. `, LEFT_X, doc.y, { continued: true, width: USABLE_W })
    .font('Helvetica-Bold').text(pName, { continued: true })
    .font('Helvetica').text(`${ageStr} has undergone physiotherapy assessment and/or treatment at Health 360 Physiotherapy & Craniosacral Therapy Clinic.`);
  doc.moveDown(0.4);

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE)
    .text(`Upon assessment on ${d.assessmentDate || d.issueDate || 'Today'}, the individual is currently experiencing `, LEFT_X, doc.y, { continued: true, width: USABLE_W })
    .font('Helvetica-Bold').text(d.symptomsCondition || d.diagnosis || 'Acute Lumbar Radiculopathy with Severe Muscle Spasms', { continued: true })
    .font('Helvetica').text(' and is ')
    .font('Helvetica-Bold').fillColor('#DC2626').text('NOT FIT TO PERFORM REGULAR WORK DUTIES', { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text(` from ${d.startDate || 'Today'} to ${d.endDate || 'Next Week'}.`);
  doc.moveDown(0.4);

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE)
    .text('The patient has been advised to rest and continue the prescribed treatment program during this period to facilitate recovery and prevent aggravation of the condition.', LEFT_X, doc.y, { width: USABLE_W });
  doc.moveDown(0.5);

  // Remarks box
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE).text('Remarks:', LEFT_X, doc.y);
  doc.moveDown(0.15);
  const remY = doc.y;
  doc.roundedRect(LEFT_X, remY, USABLE_W, 30, 3).fillAndStroke(LIGHT_BG, BORDER_COLOR);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.remarks || 'Patient advised complete spinal offloading, modalities treatment daily, and avoidance of prolonged sitting or lifting.',
    LEFT_X + 8, remY + 7, { width: USABLE_W - 16 }
  );
  doc.y = remY + 38;

  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE).text(
    `A review assessment is advised on or after ${d.reviewDate || 'Next Week'} to determine fitness for return to work.`,
    LEFT_X, doc.y, { width: USABLE_W }
  );
  doc.moveDown(0.4);

  doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED_GRAY).text(
    "This certificate is issued based on the individual's current functional status and assessment findings.",
    LEFT_X, doc.y, { width: USABLE_W }
  );

  renderSignature(doc, sigPath);
  renderFooter(doc, 1, 1);
}

// ─── 4. Physiotherapy Discharge Summary (2 Pages) ──────────────────────────────
function buildDischargeSummary(doc: any, d: CertificateData, sigPath: string | null) {
  // ─── PAGE 1 ─────────────────────────────────────────────────────────────
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE).text('Date: ', LEFT_X, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(BODY_SLATE).text(d.issueDate || new Date().toLocaleDateString('en-IN'));
  doc.moveDown(0.3);

  doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK_SLATE)
    .text('PHYSIOTHERAPY DISCHARGE SUMMARY', LEFT_X, doc.y, { align: 'center', width: USABLE_W });
  doc.moveDown(0.5);

  // Meta table with neat borders
  const metaBoxY = doc.y;
  doc.roundedRect(LEFT_X, metaBoxY, USABLE_W, 84, 4).fillAndStroke(LIGHT_BG, BORDER_COLOR);

  const row = (label: string, val: string, yOff: number) => {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED_GRAY).text(label, LEFT_X + 12, metaBoxY + yOff, { width: 170 });
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK_SLATE).text(val, LEFT_X + 185, metaBoxY + yOff, { width: 310 });
  };

  row('Patient Name:', d.patientName || 'Patient Name', 8);
  row('Age / Gender:', `${d.age ? `${d.age} Yrs` : '—'} / ${d.gender || '—'}`, 21);
  row('Diagnosis:', d.diagnosis || 'Frozen Shoulder (Adhesive Capsulitis)', 34);
  row('Date of Initial Assessment:', d.startDate || '10 Aug 2026', 47);
  row('Date of Discharge:', d.endDate || '10 Sept 2026', 60);
  row('Total Sessions Attended:', d.sessions ? (d.sessions.toLowerCase().includes('session') ? d.sessions : `${d.sessions} Sessions`) : '12 Sessions', 73);

  doc.y = metaBoxY + 94;

  // Presenting Complaints
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Presenting Complaints', LEFT_X, doc.y);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.complaints || 'Severe shoulder pain (VAS 8/10), sleep disturbance, restricted overhead reach, inability to perform self-care.',
    LEFT_X, doc.y, { width: USABLE_W }
  );
  doc.moveDown(0.4);

  // Assessment Findings
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Assessment Findings', LEFT_X, doc.y);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.findings || 'Initial assessment revealed significant capsular restriction, active abduction limited to 70°, external rotation limited to 20°.',
    LEFT_X, doc.y, { width: USABLE_W }
  );
  doc.moveDown(0.4);

  // Treatment Provided
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Treatment Provided', LEFT_X, doc.y);
  doc.moveDown(0.2);
  const defaultTreatments = [
    '• Physiotherapy Assessment',
    '• Manual Therapy',
    '• Therapeutic Exercises',
    '• Electrotherapy Modalities (if applicable)',
    '• Patient Education & Home Exercise Program',
    `• Other: ${d.otherTreatment || d.treatmentProvided || 'Craniosacral therapy balancing & myofascial trigger release'}`
  ];
  defaultTreatments.forEach((t) => {
    doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(t, LEFT_X + 8);
    doc.moveDown(0.12);
  });

  renderFooter(doc, 1, 2);

  // ─── PAGE 2 ─────────────────────────────────────────────────────────────
  doc.addPage({ size: 'A4', margins: { top: 30, bottom: 20, left: LEFT_X, right: LEFT_X } });
  renderRunningHeader(doc, 'PHYSIOTHERAPY DISCHARGE SUMMARY', 2);

  // Progress Achieved
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Progress Achieved', LEFT_X, doc.y);
  doc.moveDown(0.2);

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
    const checked = d.progressOptions ? d.progressOptions[item.key] !== false : true;
    const col = idx % 2;
    const r = Math.floor(idx / 2);
    const x = col === 0 ? LEFT_X + 8 : LEFT_X + 260;
    const y = gridStartY + r * 15;
    drawCheckbox(doc, x, y, checked, item.label);
  });
  doc.y = gridStartY + Math.ceil(progressItems.length / 2) * 15 + 4;

  // Outcome at Discharge
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Outcome at Discharge', LEFT_X, doc.y);
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.outcome || 'Full active range of motion restored (Abduction 170°, ER 75°), pain decreased from VAS 8/10 to 1/10. Functional independence achieved.',
    LEFT_X, doc.y, { width: USABLE_W }
  );
  doc.moveDown(0.4);

  // Home Exercise Program / Advice
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Home Exercise Program / Advice', LEFT_X, doc.y);
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.homeAdvice || 'Continue shoulder pendular swings, wand stretches, and rotator cuff strengthening exercises with light band 3 times per week.',
    LEFT_X, doc.y, { width: USABLE_W }
  );
  doc.moveDown(0.4);

  // Precautions / Restrictions
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Precautions / Restrictions (if any)', LEFT_X, doc.y);
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.precautions || 'Avoid sudden jerky overhead jerks or lifting weights exceeding 12 kg without adequate warm-up.',
    LEFT_X, doc.y, { width: USABLE_W }
  );
  doc.moveDown(0.4);

  // Follow-up Recommendations & Discharge Status
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Follow-up Recommendations & Discharge Status', LEFT_X, doc.y);
  doc.moveDown(0.15);

  const followupText = d.followupOptions?.review
    ? `Review after ${d.reviewWeeks || '4 weeks'} if needed · Continue Home Exercise Program`
    : 'Follow-up only if symptoms recur · Continue Home Exercise Program';
  const statusLabel = d.dischargeStatusOptions?.request
    ? 'Discharged on Patient Request'
    : d.dischargeStatusOptions?.referred
    ? 'Referred to Another Healthcare Professional'
    : d.dischargeStatusOptions?.discontinued
    ? 'Treatment Discontinued'
    : 'Successfully Discharged';

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BODY_SLATE).text('• Follow-up Recommendation: ', LEFT_X + 8, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(BODY_SLATE).text(followupText);
  doc.moveDown(0.15);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BODY_SLATE).text('• Discharge Status: ', LEFT_X + 8, doc.y, { continued: true });
  doc.font('Helvetica-Bold').fillColor(PRIMARY_BLUE).text(statusLabel);
  doc.moveDown(0.4);

  // Remarks
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Remarks:', LEFT_X, doc.y);
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.remarks || 'Patient was compliant with therapy sessions and achieved excellent functional recovery. Advised to maintain active lifestyle.',
    LEFT_X, doc.y, { width: USABLE_W }
  );

  renderSignature(doc, sigPath);
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

    // Render White Official Letterhead
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
        'Cache-Control': 'no-store',
      },
    });

  } catch (err: any) {
    console.error('[CertPDF] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
