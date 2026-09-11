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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function divider(doc: any, y?: number, color = BORDER_COLOR, lineWidth = 0.5) {
  const posY = y ?? doc.y;
  doc.moveTo(40, posY).lineTo(doc.page.width - 40, posY)
    .strokeColor(color).lineWidth(lineWidth).stroke();
}

function renderHeader(doc: any, logoPath: string | null) {
  const pageW = doc.page.width;

  // Logo on Left
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 40, 24, { height: 56, fit: [160, 56] });
    } catch {}
  }

  // Doctor credentials on Right
  const rightX = pageW - 240;
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(DARK_SLATE)
    .text('Dr. Rashmita Karvir Kekre', rightX, 22, { align: 'right', width: 200 });
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PRIMARY_BLUE)
    .text('B.P.Th. (M.I.A.P.)  |  BCST', rightX, 36, { align: 'right', width: 200 });
  doc.font('Helvetica').fontSize(7).fillColor('#475569')
    .text('+91 8071 583 519', rightX, 48, { align: 'right', width: 200 })
    .text('rashmita.karvir@gmail.com', rightX, 58, { align: 'right', width: 200 })
    .text('Shop no. 1 & 2, Shree Amardeep Enclave', rightX, 68, { align: 'right', width: 200 })
    .text('Om Nagar, Vasai West', rightX, 78, { align: 'right', width: 200 });

  // Blue Divider Bar (matching CertificateDocument.tsx: border-bottom: 2px solid #0284c7)
  divider(doc, 92, PRIMARY_BLUE, 2);
  doc.y = 104;
}

function renderRunningHeader(doc: any, title: string, pageNum: number) {
  const pageW = doc.page.width;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PRIMARY_BLUE).text('HEALTH 360  ', 40, 22, { continued: true });
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED_GRAY).text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', { continued: false });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK_SLATE).text(`${title} · Page ${pageNum}`, 40, 22, { align: 'right', width: pageW - 80 });
  divider(doc, 36, '#CBD5E1', 0.8);
  doc.y = 48;
}

function renderFooter(doc: any, pageNum?: number, totalPages?: number) {
  const pageH = doc.page.height;
  const oldBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0; // Prevent auto-page break

  divider(doc, pageH - 30, BORDER_COLOR, 0.5);
  const text =
    'Health 360 Physiotherapy & Craniosacral Therapy Clinic · Shop No. 1 & 2, Shree Amardeep Enclave, Om Nagar, Vasai West · Tel: +91 8071 583 519' +
    (pageNum && totalPages ? `  |  Page ${pageNum} of ${totalPages}` : '');
  doc.fontSize(7).fillColor('#94A3B8').text(text, 40, pageH - 22, {
    align: 'center',
    width: doc.page.width - 80,
    lineBreak: false,
  });

  doc.page.margins.bottom = oldBottom;
}

function renderSignature(doc: any, sigPath: string | null) {
  doc.moveDown(0.6);
  doc.font('Helvetica').fontSize(9).fillColor(BODY_SLATE).text('Sincerely,', 40);
  doc.moveDown(0.15);

  if (sigPath && fs.existsSync(sigPath)) {
    try {
      doc.image(sigPath, 40, doc.y, { height: 36, fit: [110, 36] });
      doc.y += 38;
    } catch {
      doc.moveDown(1.2);
    }
  } else {
    doc.moveDown(1.2);
  }

  // Signature line
  doc.moveTo(40, doc.y).lineTo(190, doc.y).strokeColor(BODY_SLATE).lineWidth(0.8).stroke();
  doc.moveDown(0.2);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(DARK_SLATE).text('Dr. Rashmita Karvir-Kekre (PT)', 40);
  doc.font('Helvetica').fontSize(8).fillColor(MUTED_GRAY).text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', 40);
}

// ─── 1. Treatment & Payment Certificate ─────────────────────────────────────────
function buildTreatmentPayment(doc: any, d: CertificateData, sigPath: string | null) {
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED_GRAY)
    .text(`Date: ${d.issueDate || new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(0.4);

  // Title Block
  doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK_SLATE)
    .text('TREATMENT & PAYMENT CERTIFICATE', { align: 'center' });
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED_GRAY)
    .text('To Whomsoever It May Concern', { align: 'center' });
  doc.moveDown(0.8);

  // Body Paragraphs
  const pName = d.patientName || 'Patient Name';
  const ageStr = d.age ? `, aged ${d.age} years,` : '';
  const diagStr = d.diagnosis || 'Cervical Spondylosis / Musculoskeletal Pain';

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE)
    .text(`This is to certify that Mr./Ms. `, { continued: true })
    .font('Helvetica-Bold').text(pName, { continued: true })
    .font('Helvetica').text(`${ageStr} was treated at Health 360 Physiotherapy & Craniosacral Therapy Clinic, Vasai West for `)
    .font('Helvetica-Bold').text(diagStr, { continued: true })
    .font('Helvetica').text('.');
  doc.moveDown(0.5);

  doc.text(`The patient underwent physiotherapy treatment from ${d.startDate || 'Recent'} to ${d.endDate || 'Present'}.`);
  doc.moveDown(0.6);

  // Details Box
  const boxY = doc.y;
  doc.roundedRect(40, boxY, doc.page.width - 80, 106, 4).fillAndStroke(LIGHT_BG, BORDER_COLOR);
  doc.y = boxY + 8;

  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE)
    .text('Treatment details are as follows:', 52);
  doc.moveDown(0.3);

  const bulletItem = (label: string, val: string, isBoldVal = false) => {
    const yPos = doc.y;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BODY_SLATE).text(`• ${label}`, 52, yPos, { continued: true });
    if (isBoldVal) {
      doc.font('Helvetica-Bold').fillColor(DARK_SLATE).text(`  ${val}`);
    } else {
      doc.font('Helvetica').fillColor(BODY_SLATE).text(`  ${val}`);
    }
    doc.moveDown(0.15);
  };

  bulletItem('Diagnosis / Condition:', d.diagnosis || 'Cervical Spine Rehabilitation');
  bulletItem('Treatment Period:', `${d.startDate || '1 Aug 2026'} to ${d.endDate || '10 Sept 2026'}`);
  bulletItem('Number of Sessions Attended:', `${d.sessions || '10 Sessions'}`);
  bulletItem('Treatment Provided:', d.treatmentProvided || 'Manual Therapy, Spinal Mobilization, Postural Ergonomics & Strengthening');
  bulletItem('Consultation & Physiotherapy Charges per Session:', `₹ ${d.chargesPerSession || '650.00'}`);
  bulletItem('Total Amount Paid:', `₹ ${d.totalAmount || '6,500.00'}`, true);

  doc.y = boxY + 118;
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED_GRAY).text(
    'The above treatment was medically necessary and was provided under the supervision of a qualified physiotherapist for the management and rehabilitation of the condition.',
    40, doc.y, { width: doc.page.width - 80 }
  );

  renderSignature(doc, sigPath);
  renderFooter(doc, 1, 1);
}

// ─── 2. Fitness Certificate ───────────────────────────────────────────────────
function buildFitness(doc: any, d: CertificateData, sigPath: string | null) {
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED_GRAY)
    .text(`Date: ${d.issueDate || new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(0.35);

  // Title Block
  doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK_SLATE)
    .text('FITNESS CERTIFICATE', { align: 'center' });
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED_GRAY)
    .text('To Whomsoever It May Concern', { align: 'center' });
  doc.moveDown(0.7);

  // Intro Paragraph
  const pName = d.patientName || 'Patient Name';
  const ageStr = d.age ? `, aged ${d.age} years,` : '';

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE)
    .text(`This is to certify that Mr./Ms. `, { continued: true })
    .font('Helvetica-Bold').text(pName, { continued: true })
    .font('Helvetica').text(`${ageStr} has undergone physiotherapy assessment and/or treatment at Health 360 Physiotherapy & Craniosacral Therapy Clinic.`);
  doc.moveDown(0.4);

  doc.text(`Upon assessment on ${d.assessmentDate || d.issueDate || 'Today'}, the individual is found to be:`);
  doc.moveDown(0.5);

  // All 8 Fitness Clearance Checkboxes matching preview exactly
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

    // Checkbox square
    doc.rect(48, yPos + 1, 8.5, 8.5).lineWidth(0.8).strokeColor(checked ? PRIMARY_BLUE : '#CBD5E1').stroke();
    if (checked) {
      doc.fillColor(PRIMARY_BLUE).rect(48 + 1.5, yPos + 2.5, 5.5, 5.5).fill();
    }

    doc.font('Helvetica').fontSize(9).fillColor(BODY_SLATE).text(item.label, 62, yPos);
    doc.moveDown(0.2);
  });

  // Advice & Restrictions Item
  const adviceChecked = !!fo['advice'] || !!d.adviceRestrictions;
  const advY = doc.y;
  doc.rect(48, advY + 1, 8.5, 8.5).lineWidth(0.8).strokeColor(adviceChecked ? PRIMARY_BLUE : '#CBD5E1').stroke();
  if (adviceChecked) {
    doc.fillColor(PRIMARY_BLUE).rect(48 + 1.5, advY + 2.5, 5.5, 5.5).fill();
  }
  doc.font('Helvetica').fontSize(9).fillColor(BODY_SLATE).text('Fit with the Following Advice / Restrictions:', 62, advY);
  doc.moveDown(0.15);

  if (d.adviceRestrictions) {
    doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#0369A1').text(
      d.adviceRestrictions,
      62, doc.y, { width: doc.page.width - 110 }
    );
    doc.moveDown(0.2);
  }

  // Remarks
  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE).text('Remarks:', 40);
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.remarks || 'Patient demonstrates full pain-free functional range of motion and normal muscle power. Fit to resume duties.',
    40, doc.y, { width: doc.page.width - 80 }
  );

  doc.moveDown(0.4);
  doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED_GRAY).text(
    "This certificate is issued based on the individual's current functional status and assessment findings and is valid as of the date of examination.",
    40, doc.y, { width: doc.page.width - 80 }
  );

  renderSignature(doc, sigPath);
  renderFooter(doc, 1, 1);
}

// ─── 3. Unfitness for Work Certificate ─────────────────────────────────────────
function buildUnfitness(doc: any, d: CertificateData, sigPath: string | null) {
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED_GRAY)
    .text(`Date: ${d.issueDate || new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(0.35);

  // Title Block
  doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK_SLATE)
    .text('UNFITNESS FOR WORK CERTIFICATE', { align: 'center' });
  doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED_GRAY)
    .text('(Medical Rest Certificate)', { align: 'center' });
  doc.moveDown(0.7);

  const pName = d.patientName || 'Patient Name';
  const ageStr = d.age ? `, aged ${d.age} years,` : '';

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_SLATE)
    .text(`This is to certify that Mr./Ms. `, { continued: true })
    .font('Helvetica-Bold').text(pName, { continued: true })
    .font('Helvetica').text(`${ageStr} has undergone physiotherapy assessment and/or treatment at Health 360 Physiotherapy & Craniosacral Therapy Clinic.`);
  doc.moveDown(0.4);

  doc.text(`Upon assessment on ${d.assessmentDate || d.issueDate || 'Today'}, the individual is currently experiencing `)
    .font('Helvetica-Bold').text(d.symptomsCondition || d.diagnosis || 'Acute Lumbar Radiculopathy with Severe Muscle Spasms', { continued: true })
    .font('Helvetica').text(' and is ')
    .font('Helvetica-Bold').fillColor('#DC2626').text('NOT FIT TO PERFORM REGULAR WORK DUTIES', { continued: true })
    .font('Helvetica').fillColor(BODY_SLATE).text(` from ${d.startDate || 'Today'} to ${d.endDate || 'Next Week'}.`);
  doc.moveDown(0.4);

  doc.text('The patient has been advised to rest and continue the prescribed treatment program during this period to facilitate recovery and prevent aggravation of the condition.');
  doc.moveDown(0.5);

  // Remarks box
  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE).text('Remarks:', 40);
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.remarks || 'Patient advised complete spinal offloading, modalities treatment daily, and avoidance of prolonged sitting or lifting.',
    40, doc.y, { width: doc.page.width - 80 }
  );
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK_SLATE).text(
    `A review assessment is advised on or after ${d.reviewDate || 'Next Week'} to determine fitness for return to work.`,
    40, doc.y, { width: doc.page.width - 80 }
  );

  doc.moveDown(0.4);
  doc.font('Helvetica-Oblique').fontSize(8).fillColor(MUTED_GRAY).text(
    "This certificate is issued based on the individual's current functional status and assessment findings.",
    40, doc.y, { width: doc.page.width - 80 }
  );

  renderSignature(doc, sigPath);
  renderFooter(doc, 1, 1);
}

// ─── 4. Physiotherapy Discharge Summary (2 Pages) ──────────────────────────────
function buildDischargeSummary(doc: any, d: CertificateData, sigPath: string | null) {
  // ─── PAGE 1 ─────────────────────────────────────────────────────────────
  doc.font('Helvetica').fontSize(8.5).fillColor(MUTED_GRAY)
    .text(`Date: ${d.issueDate || new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(0.3);

  doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK_SLATE)
    .text('PHYSIOTHERAPY DISCHARGE SUMMARY', { align: 'center' });
  doc.moveDown(0.6);

  // Meta table with neat borders
  const metaBoxY = doc.y;
  doc.roundedRect(40, metaBoxY, doc.page.width - 80, 84, 4).fillAndStroke(LIGHT_BG, BORDER_COLOR);

  const row = (label: string, val: string, yOff: number) => {
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(MUTED_GRAY).text(label, 52, metaBoxY + yOff, { width: 170 });
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(DARK_SLATE).text(val, 225, metaBoxY + yOff, { width: 320 });
  };

  row('Patient Name:', d.patientName || 'Patient Name', 8);
  row('Age / Gender:', `${d.age ? `${d.age} Yrs` : '—'} / ${d.gender || '—'}`, 21);
  row('Diagnosis:', d.diagnosis || 'Frozen Shoulder (Adhesive Capsulitis)', 34);
  row('Date of Initial Assessment:', d.startDate || '10 Aug 2026', 47);
  row('Date of Discharge:', d.endDate || '10 Sept 2026', 60);
  row('Total Sessions Attended:', d.sessions ? (d.sessions.toLowerCase().includes('session') ? d.sessions : `${d.sessions} Sessions`) : '12 Sessions', 73);

  doc.y = metaBoxY + 94;

  // Presenting Complaints
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Presenting Complaints', 40);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.complaints || 'Severe shoulder pain (VAS 8/10), sleep disturbance, restricted overhead reach, inability to perform self-care.',
    40, doc.y, { width: doc.page.width - 80 }
  );
  doc.moveDown(0.5);

  // Assessment Findings
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Assessment Findings', 40);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.findings || 'Initial assessment revealed significant capsular restriction, active abduction limited to 70°, external rotation limited to 20°.',
    40, doc.y, { width: doc.page.width - 80 }
  );
  doc.moveDown(0.5);

  // Treatment Provided
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Treatment Provided', 40);
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
    doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(t, 48);
    doc.moveDown(0.12);
  });

  renderFooter(doc, 1, 2);

  // ─── PAGE 2 ─────────────────────────────────────────────────────────────
  doc.addPage({ size: 'A4', margins: { top: 30, bottom: 20, left: 40, right: 40 } });
  renderRunningHeader(doc, 'PHYSIOTHERAPY DISCHARGE SUMMARY', 2);

  // Progress Achieved
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Progress Achieved', 40);
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
    const x = col === 0 ? 48 : 290;
    const y = gridStartY + r * 13.5;

    doc.rect(x, y + 1, 7.5, 7.5).lineWidth(0.8).strokeColor(checked ? PRIMARY_BLUE : '#CBD5E1').stroke();
    if (checked) {
      doc.fillColor(PRIMARY_BLUE).rect(x + 1.5, y + 2.5, 4.5, 4.5).fill();
    }
    doc.font('Helvetica').fontSize(8).fillColor(BODY_SLATE).text(item.label, x + 12, y);
  });
  doc.y = gridStartY + Math.ceil(progressItems.length / 2) * 13.5 + 4;

  // Outcome at Discharge
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Outcome at Discharge', 40);
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.outcome || 'Full active range of motion restored (Abduction 170°, ER 75°), pain decreased from VAS 8/10 to 1/10. Functional independence achieved.',
    40, doc.y, { width: doc.page.width - 80 }
  );
  doc.moveDown(0.4);

  // Home Exercise Program / Advice
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Home Exercise Program / Advice', 40);
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.homeAdvice || 'Continue shoulder pendular swings, wand stretches, and rotator cuff strengthening exercises with light band 3 times per week.',
    40, doc.y, { width: doc.page.width - 80 }
  );
  doc.moveDown(0.4);

  // Precautions / Restrictions
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Precautions / Restrictions (if any)', 40);
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.precautions || 'Avoid sudden jerky overhead jerks or lifting weights exceeding 12 kg without adequate warm-up.',
    40, doc.y, { width: doc.page.width - 80 }
  );
  doc.moveDown(0.4);

  // Follow-up Recommendations & Discharge Status
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Follow-up Recommendations & Discharge Status', 40);
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

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BODY_SLATE).text('• Follow-up Recommendation: ', 48, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(BODY_SLATE).text(followupText);
  doc.moveDown(0.15);
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BODY_SLATE).text('• Discharge Status: ', 48, doc.y, { continued: true });
  doc.font('Helvetica-Bold').fillColor(PRIMARY_BLUE).text(statusLabel);
  doc.moveDown(0.4);

  // Remarks
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY_BLUE).text('Remarks:', 40);
  doc.moveDown(0.15);
  doc.font('Helvetica').fontSize(8.5).fillColor(BODY_SLATE).text(
    d.remarks || 'Patient was compliant with therapy sessions and achieved excellent functional recovery. Advised to maintain active lifestyle.',
    40, doc.y, { width: doc.page.width - 80 }
  );

  renderSignature(doc, sigPath);
  renderFooter(doc, 2, 2);
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type  = (searchParams.get('type') || 'treatment_payment') as CertificateType;
    const s     = searchParams.get('s') || '';
    const name  = searchParams.get('name') || 'Patient';

    // Decode state
    let data: CertificateData = { type };
    if (s) {
      try {
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
      margins: { top: 30, bottom: 20, left: 40, right: 40 },
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
