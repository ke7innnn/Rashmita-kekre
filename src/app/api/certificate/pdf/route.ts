import { NextRequest, NextResponse } from 'next/server';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');
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
function divider(doc: InstanceType<typeof PDFDocument>, y?: number) {
  const posY = y ?? doc.y;
  doc.moveTo(40, posY).lineTo(doc.page.width - 40, posY)
    .strokeColor('#E2E8F0').lineWidth(0.5).stroke();
}

// ─── Helper: bullet item ─────────────────────────────────────────────────────
function bullet(doc: InstanceType<typeof PDFDocument>, label: string, value: string) {
  const startY = doc.y;
  doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK).text(`• ${label}`, 60, startY, { continued: true });
  doc.font('Helvetica').fillColor(GRAY).text(` ${value}`);
  doc.moveDown(0.25);
}

// ─── Helper: section heading ──────────────────────────────────────────────────
function sectionHeading(doc: InstanceType<typeof PDFDocument>, text: string) {
  doc.moveDown(0.5);
  divider(doc);
  doc.moveDown(0.4);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(TEAL).text(text, 40);
  doc.moveDown(0.4);
}

// ─── Render clinic header ─────────────────────────────────────────────────────
function renderHeader(doc: InstanceType<typeof PDFDocument>, logoPath: string | null) {
  const pageW = doc.page.width;

  // Teal header bar
  doc.rect(0, 0, pageW, 90).fill(DARK);

  // Logo
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 30, 10, { height: 70, fit: [120, 70] });
    } catch { /* skip if image fails */ }
  }

  // Clinic name + credentials
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(13)
    .text('Dr. Rashmita Karvir Kekre', 160, 14);
  doc.font('Helvetica').fontSize(9).fillColor('#94A3B8')
    .text('B.P.Th. (M.I.A.P.)  |  BCST', 160, 32)
    .text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', 160, 45)
    .text('+91 8071 583 519  ·  rashmita.karvir@gmail.com', 160, 58)
    .text('Shop No. 1 & 2, Shree Amardeep Enclave, Om Nagar, Vasai West', 160, 71);

  doc.y = 105;
}

// ─── Signature block ──────────────────────────────────────────────────────────
function renderSignature(doc: InstanceType<typeof PDFDocument>, sigPath: string | null) {
  doc.moveDown(1.2);
  doc.font('Helvetica').fontSize(10).fillColor(BLACK).text('Sincerely,', 40);
  doc.moveDown(0.4);

  if (sigPath && fs.existsSync(sigPath)) {
    try {
      doc.image(sigPath, 40, doc.y, { height: 40, fit: [120, 40] });
      doc.y += 44;
    } catch { doc.moveDown(1.5); }
  } else {
    doc.moveDown(1.5);
  }

  // Signature line
  doc.moveTo(40, doc.y).lineTo(200, doc.y).strokeColor(BLACK).lineWidth(0.8).stroke();
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK).text('Dr. Rashmita Karvir-Kekre (PT)', 40);
  doc.font('Helvetica').fontSize(9).fillColor(GRAY).text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', 40);
}

// ─── Certificate builders ─────────────────────────────────────────────────────
function buildTreatmentPayment(doc: InstanceType<typeof PDFDocument>, d: CertificateData, sigPath: string | null) {
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
}

function buildFitness(doc: InstanceType<typeof PDFDocument>, d: CertificateData, sigPath: string | null) {
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
}

function buildUnfitness(doc: InstanceType<typeof PDFDocument>, d: CertificateData, sigPath: string | null) {
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
}

function buildDischargeSummary(doc: InstanceType<typeof PDFDocument>, d: CertificateData, sigPath: string | null) {
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(9).fillColor(GRAY)
    .text(`Date: ${d.issueDate || new Date().toLocaleDateString('en-IN')}`, { align: 'right' });
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(16).fillColor(DARK)
    .text('PHYSIOTHERAPY DISCHARGE SUMMARY', { align: 'center' });
  doc.moveDown(0.8);
  divider(doc);
  doc.moveDown(0.6);

  sectionHeading(doc, 'Patient Information');
  bullet(doc, 'Patient Name:', d.patientName || '—');
  bullet(doc, 'Age / Gender:', `${d.age || '—'} / ${d.gender || '—'}`);
  bullet(doc, 'Diagnosis:', d.diagnosis || '—');
  bullet(doc, 'Treatment Period:', `${d.startDate || '—'} to ${d.endDate || '—'}`);
  bullet(doc, 'Sessions Completed:', `${d.sessions || '—'}`);

  if (d.complaints) {
    sectionHeading(doc, 'Presenting Complaints');
    doc.font('Helvetica').fontSize(10).fillColor(BLACK).text(d.complaints, 60, doc.y, { width: doc.page.width - 100 });
  }
  if (d.treatmentProvided) {
    sectionHeading(doc, 'Treatment Provided');
    doc.font('Helvetica').fontSize(10).fillColor(BLACK).text(d.treatmentProvided, 60, doc.y, { width: doc.page.width - 100 });
  }
  if (d.outcome) {
    sectionHeading(doc, 'Outcome');
    doc.font('Helvetica').fontSize(10).fillColor(BLACK).text(d.outcome, 60, doc.y, { width: doc.page.width - 100 });
  }
  if (d.homeAdvice) {
    sectionHeading(doc, 'Home Exercise & Advice');
    doc.font('Helvetica').fontSize(10).fillColor(BLACK).text(d.homeAdvice, 60, doc.y, { width: doc.page.width - 100 });
  }

  renderSignature(doc, sigPath);
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

    // Footer
    const pageH = doc.page.height;
    doc.fontSize(7.5).fillColor('#94A3B8')
      .text(
        'Health 360 Physiotherapy & Craniosacral Therapy Clinic · Shop No. 1 & 2, Shree Amardeep Enclave, Om Nagar, Vasai West · +91 8071 583 519',
        40, pageH - 35, { align: 'center', width: doc.page.width - 80 }
      );

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
