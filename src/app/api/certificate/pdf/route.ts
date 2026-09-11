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

// ─── Colour Palette ───────────────────────────────────────────────────────────
const TEAL   = '#0D9488';
const DARK   = '#0F172A';
const GRAY   = '#64748B';
const LIGHT  = '#F8FAFC';
const BLACK  = '#1E293B';

// ─── Helper: draw a divider line ──────────────────────────────────────────────
function divider(doc: any, y?: number) {
  const posY = y ?? doc.y;
  doc.moveTo(40, posY).lineTo(doc.page.width - 40, posY)
    .strokeColor('#E2E8F0').lineWidth(0.5).stroke();
}

// ─── Helper: bullet item ─────────────────────────────────────────────────────
function bullet(doc: any, label: string, value: string) {
  const startY = doc.y;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(BLACK).text(`• ${label}`, 60, startY, { continued: true });
  doc.font('Helvetica').fillColor(GRAY).text(` ${value}`);
  doc.moveDown(0.2);
}

// ─── Helper: section heading ──────────────────────────────────────────────────
function sectionHeading(doc: any, text: string) {
  doc.moveDown(0.35);
  divider(doc);
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(TEAL).text(text, 40);
  doc.moveDown(0.25);
}

// ─── Running Header for Multi-page Documents ─────────────────────────────────
function renderRunningHeader(doc: any, title: string, pageNum: number) {
  const pageW = doc.page.width;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEAL).text('HEALTH 360  ', 40, 25, { continued: true });
  doc.font('Helvetica').fontSize(8).fillColor(GRAY).text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', { continued: false });
  doc.font('Helvetica-Bold').fontSize(8).fillColor(DARK).text(`${title} · Page ${pageNum}`, 40, 25, { align: 'right', width: pageW - 80 });
  divider(doc, 40);
  doc.y = 50;
}

// ─── Footer for all pages ─────────────────────────────────────────────────────
function renderFooter(doc: any, pageNum?: number, totalPages?: number) {
  const pageH = doc.page.height;
  divider(doc, pageH - 38);
  const text =
    'Health 360 Physiotherapy & Craniosacral Therapy Clinic · Shop No. 1 & 2, Shree Amardeep Enclave, Om Nagar, Vasai West · +91 8071 583 519' +
    (pageNum && totalPages ? `  |  Page ${pageNum} of ${totalPages}` : '');
  doc.fontSize(7.5).fillColor('#94A3B8').text(text, 40, pageH - 28, { align: 'center', width: doc.page.width - 80 });
}

// ─── Render clinic header ─────────────────────────────────────────────────────
function renderHeader(doc: any, logoPath: string | null) {
  const pageW = doc.page.width;

  // Teal header bar
  doc.rect(0, 0, pageW, 85).fill(DARK);

  // Logo
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 30, 10, { height: 65, fit: [110, 65] });
    } catch { /* skip if image fails */ }
  }

  // Clinic name + credentials
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(13)
    .text('Dr. Rashmita Karvir Kekre', 155, 12);
  doc.font('Helvetica').fontSize(8.5).fillColor('#94A3B8')
    .text('B.P.Th. (M.I.A.P.)  |  BCST', 155, 29)
    .text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', 155, 41)
    .text('+91 8071 583 519  ·  rashmita.karvir@gmail.com', 155, 53)
    .text('Shop No. 1 & 2, Shree Amardeep Enclave, Om Nagar, Vasai West', 155, 65);

  doc.y = 98;
}

// ─── Signature block ──────────────────────────────────────────────────────────
function renderSignature(doc: any, sigPath: string | null) {
  doc.moveDown(0.8);
  doc.font('Helvetica').fontSize(9).fillColor(BLACK).text('Sincerely,', 40);
  doc.moveDown(0.2);

  if (sigPath && fs.existsSync(sigPath)) {
    try {
      doc.image(sigPath, 40, doc.y, { height: 36, fit: [110, 36] });
      doc.y += 39;
    } catch { doc.moveDown(1.2); }
  } else {
    doc.moveDown(1.2);
  }

  // Signature line
  doc.moveTo(40, doc.y).lineTo(190, doc.y).strokeColor(BLACK).lineWidth(0.8).stroke();
  doc.moveDown(0.2);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(BLACK).text('Dr. Rashmita Karvir-Kekre (PT)', 40);
  doc.font('Helvetica').fontSize(8.5).fillColor(GRAY).text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', 40);
}

// ─── Certificate builders ─────────────────────────────────────────────────────
function buildTreatmentPayment(doc: any, d: CertificateData, sigPath: string | null) {
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(9).fillColor(GRAY)
    .text(`Date: ${d.issueDate || new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(0.5);

  // Title
  doc.font('Helvetica-Bold').fontSize(16).fillColor(DARK)
    .text('TREATMENT & PAYMENT CERTIFICATE', { align: 'center' });
  doc.font('Helvetica').fontSize(10).fillColor(GRAY)
    .text('To Whomsoever It May Concern', { align: 'center' });
  doc.moveDown(0.8);
  divider(doc);
  doc.moveDown(0.6);

  // Opening paragraph
  doc.font('Helvetica').fontSize(10).fillColor(BLACK)
    .text(
      `This is to certify that Mr./Ms. `,
      40, doc.y, { continued: true }
    )
    .font('Helvetica-Bold').text(`${d.patientName || 'Patient'}`, { continued: true })
    .font('Helvetica').text(`, aged ${d.age || '—'} years, was treated at Health 360 Physiotherapy & Craniosacral Therapy Clinic, Vasai West for `)
    .font('Helvetica-Bold').fillColor(TEAL).text(d.diagnosis || 'Musculoskeletal Condition', { continued: true })
    .font('Helvetica').fillColor(BLACK).text('.');
  doc.moveDown(0.5);
  doc.text(
    `The patient underwent physiotherapy treatment from ${d.startDate || '—'} to ${d.endDate || '—'}.`
  );

  sectionHeading(doc, 'Treatment Details');
  bullet(doc, 'Diagnosis / Condition:', d.diagnosis || '—');
  bullet(doc, 'Treatment Period:', `${d.startDate || '—'} to ${d.endDate || '—'}`);
  bullet(doc, 'Number of Sessions Attended:', `${d.sessions || '—'} Sessions`);
  bullet(doc, 'Treatment Provided:', d.treatmentProvided || 'Manual Therapy, Physiotherapy');
  bullet(doc, 'Consultation & Physiotherapy Charges per Session:', `₹ ${d.chargesPerSession || '650.00'}`);
  bullet(doc, 'Total Amount Paid:', `₹ ${d.totalAmount || '—'}`);

  doc.moveDown(0.8);
  divider(doc);
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(9.5).fillColor(BLACK)
    .text(
      'The above treatment was medically necessary and was provided under the supervision of a qualified physiotherapist for the management and rehabilitation of the condition.',
      40, doc.y, { width: doc.page.width - 80 }
    );

  renderSignature(doc, sigPath);
  renderFooter(doc, 1, 1);
}

function buildFitness(doc: any, d: CertificateData, sigPath: string | null) {
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(9).fillColor(GRAY)
    .text(`Date: ${d.issueDate || new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(16).fillColor(DARK)
    .text('FITNESS CERTIFICATE', { align: 'center' });
  doc.font('Helvetica').fontSize(10).fillColor(GRAY)
    .text('To Whomsoever It May Concern', { align: 'center' });
  doc.moveDown(0.8);
  divider(doc);
  doc.moveDown(0.6);

  doc.font('Helvetica').fontSize(10).fillColor(BLACK)
    .text(
      `This is to certify that Mr./Ms. `,
      40, doc.y, { continued: true }
    )
    .font('Helvetica-Bold').text(`${d.patientName || 'Patient'}`, { continued: true })
    .font('Helvetica').text(`, aged ${d.age || '—'} years, has been examined on ${d.assessmentDate || d.issueDate || '—'} and is found to be:`);

  sectionHeading(doc, 'Fitness Assessment');
  const fo = d.fitnessOptions || {};
  if (fo.work)    bullet(doc, 'Fit to resume work / duties', '✓');
  if (fo.daily)   bullet(doc, 'Fit for daily activities', '✓');
  if (fo.regular) bullet(doc, 'Fit for regular exercises / activities', '✓');
  if (!fo.work && !fo.daily && !fo.regular)
    doc.font('Helvetica').fontSize(10).fillColor(BLACK).text('Fit to resume normal activities.', 60);

  if (d.remarks) {
    sectionHeading(doc, 'Advice / Remarks');
    doc.font('Helvetica').fontSize(10).fillColor(BLACK).text(d.remarks, 60, doc.y, { width: doc.page.width - 100 });
  }

  renderSignature(doc, sigPath);
  renderFooter(doc, 1, 1);
}

function buildUnfitness(doc: any, d: CertificateData, sigPath: string | null) {
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(9).fillColor(GRAY)
    .text(`Date: ${d.issueDate || new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(16).fillColor(DARK)
    .text('UNFITNESS FOR WORK CERTIFICATE', { align: 'center' });
  doc.font('Helvetica').fontSize(10).fillColor(GRAY)
    .text('(Medical Rest Certificate)', { align: 'center' });
  doc.moveDown(0.8);
  divider(doc);
  doc.moveDown(0.6);

  doc.font('Helvetica').fontSize(10).fillColor(BLACK)
    .text(`This is to certify that Mr./Ms. `, 40, doc.y, { continued: true })
    .font('Helvetica-Bold').text(`${d.patientName || 'Patient'}`, { continued: true })
    .font('Helvetica').text(`, aged ${d.age || '—'} years, has been examined and is advised to take medical rest.`);

  sectionHeading(doc, 'Clinical Details');
  bullet(doc, 'Diagnosis / Condition:', d.symptomsCondition || d.diagnosis || '—');
  bullet(doc, 'Recommended Rest Period:', `${d.startDate || '—'} to ${d.endDate || '—'}`);
  bullet(doc, 'Review Assessment On or After:', d.reviewDate || '—');

  if (d.adviceRestrictions) {
    sectionHeading(doc, 'Advice & Restrictions');
    doc.font('Helvetica').fontSize(10).fillColor(BLACK).text(d.adviceRestrictions, 60, doc.y, { width: doc.page.width - 100 });
  }

  renderSignature(doc, sigPath);
  renderFooter(doc, 1, 1);
}

function buildDischargeSummary(doc: any, d: CertificateData, sigPath: string | null) {
  // ─── PAGE 1 ─────────────────────────────────────────────────────────────
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(8.5).fillColor(GRAY)
    .text(`Date: ${d.issueDate || new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(0.25);

  doc.font('Helvetica-Bold').fontSize(14).fillColor(DARK)
    .text('PHYSIOTHERAPY DISCHARGE SUMMARY', { align: 'center' });
  doc.moveDown(0.4);
  divider(doc);
  doc.moveDown(0.3);

  sectionHeading(doc, 'Patient Information');
  bullet(doc, 'Patient Name:', d.patientName || 'Patient Name');
  bullet(doc, 'Age / Gender:', `${d.age ? `${d.age} Yrs` : '—'} / ${d.gender || '—'}`);
  bullet(doc, 'Diagnosis:', d.diagnosis || 'Frozen Shoulder (Adhesive Capsulitis)');
  bullet(doc, 'Date of Initial Assessment:', d.startDate || '—');
  bullet(doc, 'Date of Discharge:', d.endDate || '—');
  bullet(doc, 'Total Sessions Attended:', d.sessions ? (d.sessions.toLowerCase().includes('session') ? d.sessions : `${d.sessions} Sessions`) : '—');

  sectionHeading(doc, 'Presenting Complaints');
  doc.font('Helvetica').fontSize(8.5).fillColor(BLACK).text(
    d.complaints || 'Severe shoulder pain (VAS 8/10), sleep disturbance, restricted overhead reach, inability to perform self-care.',
    60, doc.y, { width: doc.page.width - 100 }
  );

  sectionHeading(doc, 'Assessment Findings');
  doc.font('Helvetica').fontSize(8.5).fillColor(BLACK).text(
    d.findings || 'Initial assessment revealed significant capsular restriction, active abduction limited to 70°, external rotation limited to 20°.',
    60, doc.y, { width: doc.page.width - 100 }
  );

  sectionHeading(doc, 'Treatment Provided');
  const defaultTreatments = [
    'Physiotherapy Assessment & Functional Evaluation',
    'Manual Therapy & Soft Tissue Mobilization',
    'Therapeutic Exercise Prescription & Rehabilitation',
    'Electrotherapy Modalities (if applicable)',
    'Patient Education & Ergonomic Postural Advice',
    `Other: ${d.otherTreatment || d.treatmentProvided || 'Craniosacral therapy balancing & myofascial trigger release'}`
  ];
  defaultTreatments.forEach((t) => {
    doc.font('Helvetica').fontSize(8).fillColor(BLACK).text(`•  ${t}`, 60);
    doc.moveDown(0.12);
  });

  renderFooter(doc, 1, 2);

  // ─── PAGE 2 ─────────────────────────────────────────────────────────────
  doc.addPage({ size: 'A4', margin: 40 });
  renderRunningHeader(doc, 'PHYSIOTHERAPY DISCHARGE SUMMARY', 2);

  sectionHeading(doc, 'Progress Achieved');
  const progressList = [
    { key: 'pain', label: 'Pain Reduced' },
    { key: 'rom', label: 'Range of Motion Improved' },
    { key: 'strength', label: 'Strength Improved' },
    { key: 'functional', label: 'Functional Activities Improved' },
    { key: 'posture', label: 'Posture Improved' },
    { key: 'balance', label: 'Balance / Coordination Improved' },
    { key: 'goals', label: 'Goals Achieved' },
  ];

  const startY = doc.y;
  progressList.forEach((item, idx) => {
    const checked = d.progressOptions ? d.progressOptions[item.key] !== false : true;
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = col === 0 ? 60 : 300;
    const y = startY + row * 14;
    doc.rect(x, y + 1, 7.5, 7.5).lineWidth(0.8).strokeColor(checked ? TEAL : '#CBD5E1').stroke();
    if (checked) {
      doc.fillColor(TEAL).rect(x + 1.5, y + 2.5, 4.5, 4.5).fill();
    }
    doc.font('Helvetica').fontSize(8).fillColor(BLACK).text(item.label, x + 12, y);
  });
  doc.y = startY + Math.ceil(progressList.length / 2) * 14 + 4;

  sectionHeading(doc, 'Outcome at Discharge');
  doc.font('Helvetica').fontSize(8.5).fillColor(BLACK).text(
    d.outcome || 'Full active range of motion restored, pain decreased significantly. Functional independence achieved.',
    60, doc.y, { width: doc.page.width - 100 }
  );

  sectionHeading(doc, 'Home Exercise Program / Advice');
  doc.font('Helvetica').fontSize(8.5).fillColor(BLACK).text(
    d.homeAdvice || 'Continue prescribed stretches, mobility drills, and rotator cuff strengthening exercises with resistance band 3 times per week.',
    60, doc.y, { width: doc.page.width - 100 }
  );

  sectionHeading(doc, 'Precautions / Restrictions (if any)');
  doc.font('Helvetica').fontSize(8.5).fillColor(BLACK).text(
    d.precautions || 'Avoid sudden jerky overhead jerks or lifting weights exceeding 12 kg without adequate warm-up.',
    60, doc.y, { width: doc.page.width - 100 }
  );

  sectionHeading(doc, 'Follow-up & Discharge Status');
  const followupText = d.followupOptions?.review
    ? `Review after ${d.reviewWeeks || '4 weeks'} if needed · Continue Home Exercise Program`
    : 'Follow-up only if symptoms recur · Continue Home Exercise Program';
  const statusLabel = d.dischargeStatusOptions?.request
    ? 'Discharged on Patient Request'
    : d.dischargeStatusOptions?.referred
    ? 'Referred to Another Specialist'
    : d.dischargeStatusOptions?.discontinued
    ? 'Treatment Discontinued'
    : 'Successfully Discharged';

  bullet(doc, 'Follow-up Recommendation:', followupText);
  bullet(doc, 'Discharge Status:', statusLabel);

  sectionHeading(doc, 'Remarks');
  doc.font('Helvetica').fontSize(8.5).fillColor(BLACK).text(
    d.remarks || 'Patient was compliant with therapy sessions and achieved excellent functional recovery. Advised to maintain active lifestyle.',
    60, doc.y, { width: doc.page.width - 100 }
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

    // Build PDF in memory
    const doc = new PDFDocument({ size: 'A4', margin: 40, compress: true });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const pdfDone = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Render header
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
