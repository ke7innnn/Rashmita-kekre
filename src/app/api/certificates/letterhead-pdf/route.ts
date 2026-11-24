import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

interface LetterheadPayload {
  date?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  includeSignature?: boolean;
  includeStamp?: boolean;
  filename?: string;
}

const TEAL = '#22A6AD';
const DARK_TEXT = '#111827';
const BODY_TEXT = '#1F2937';
const MUTED_TEXT = '#6B7280';
const LINE_GRAY = '#9CA3AF';

// A4 dimensions in points (595.28 x 841.89)
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 42;
const USABLE_W = PAGE_W - MARGIN_X * 2; // 511.28 pt

interface TextSegment {
  text: string;
  bold: boolean;
}

function parseBoldSegments(line: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: line.slice(lastIndex, match.index), bold: false });
    }
    if (match[1]) {
      segments.push({ text: match[1], bold: true });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex), bold: false });
  }

  return segments.length > 0 ? segments : [{ text: line, bold: false }];
}

function drawPhoneIcon(doc: PDFKit.PDFDocument, cx: number, cy: number) {
  doc.save();
  doc.circle(cx, cy, 6.2).fill(TEAL);
  // Subtle white handset shape
  doc.strokeColor('#FFFFFF').lineWidth(1.3).lineCap('round');
  doc.moveTo(cx - 2.3, cy - 2.4)
    .bezierCurveTo(cx - 3.2, cy - 0.5, cx - 1.0, cy + 2.4, cx + 2.2, cy + 2.3)
    .stroke();
  doc.circle(cx - 2.1, cy - 2.2, 0.9).fill('#FFFFFF');
  doc.circle(cx + 2.1, cy + 2.1, 0.9).fill('#FFFFFF');
  doc.restore();
}

function drawEmailIcon(doc: PDFKit.PDFDocument, cx: number, cy: number) {
  const w = 12;
  const h = 8.4;
  const x = cx - w / 2;
  const y = cy - h / 2;
  doc.save();
  doc.roundedRect(x, y, w, h, 1.2).fill(TEAL);
  doc.strokeColor('#FFFFFF').lineWidth(1.05).lineJoin('round');
  doc.moveTo(x + 1, y + 1.1)
    .lineTo(cx, cy + 0.8)
    .lineTo(x + w - 1, y + 1.1)
    .stroke();
  doc.restore();
}

function drawLocationIcon(doc: PDFKit.PDFDocument, cx: number, cy: number) {
  doc.save();
  doc.fillColor(TEAL);
  // Pin teardrop path
  doc.moveTo(cx, cy + 6.4)
    .bezierCurveTo(cx - 5.2, cy + 1.2, cx - 5.2, cy - 5.2, cx, cy - 5.2)
    .bezierCurveTo(cx + 5.2, cy - 5.2, cx + 5.2, cy + 1.2, cx, cy + 6.4)
    .fill();
  doc.circle(cx, cy - 1.1, 2.0).fill('#FFFFFF');
  doc.restore();
}

function renderLetterheadHeader(doc: PDFKit.PDFDocument, logoPath: string | null) {
  // Left: Teal Health 360 Logo
  if (logoPath && fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, MARGIN_X, 34, { fit: [148, 126] });
    } catch {
      // ignore broken image
    }
  }

  // Right: Doctor Name, Credentials & Contact Details
  const iconColX = PAGE_W - MARGIN_X - 7; // Center of right icon column
  const textRightWidth = 240;
  const textBoxX = iconColX - 14 - textRightWidth; // Text ends 14pt left of icon center

  doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK_TEXT)
    .text('Dr. Rashmita Karvir Kekre', textBoxX, 46, { align: 'right', width: textRightWidth });

  doc.font('Helvetica').fontSize(10.5).fillColor(BODY_TEXT)
    .text('B.P.Th. (M.I.A.P.)', textBoxX, 64, { align: 'right', width: textRightWidth })
    .text('BCST', textBoxX, 78, { align: 'right', width: textRightWidth });

  // Contact rows
  const phoneY = 104;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK_TEXT)
    .text('8482812859', textBoxX, phoneY, { align: 'right', width: textRightWidth });
  drawPhoneIcon(doc, iconColX, phoneY + 4.5);

  const emailY = 122;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK_TEXT)
    .text('rashmita.karvir@gmail.com', textBoxX, emailY, { align: 'right', width: textRightWidth });
  drawEmailIcon(doc, iconColX, emailY + 4.5);

  const addrY = 140;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK_TEXT)
    .text('Shop no. 1 & 2, Shree Amardeep Enclave', textBoxX, addrY, { align: 'right', width: textRightWidth })
    .text('Om Nagar, Vasai West', textBoxX, addrY + 14.5, { align: 'right', width: textRightWidth });
  drawLocationIcon(doc, iconColX, addrY + 12);
}

function renderSignatory(
  doc: PDFKit.PDFDocument,
  startY: number,
  sigPath: string | null,
  stampPath: string | null,
  includeSignature: boolean,
  includeStamp: boolean
) {
  let y = startY;

  // Ensure enough vertical room for signatory + stamp (~175pt); otherwise move cleanly to next page
  if (y + 170 > PAGE_H - 36) {
    doc.addPage({ size: 'A4', margins: { top: 44, bottom: 36, left: MARGIN_X, right: MARGIN_X } });
    y = 60;
  }

  doc.font('Helvetica').fontSize(10.5).fillColor(DARK_TEXT)
    .text('Sincerely,', MARGIN_X, y);

  const sigImgY = y + 20;
  if (includeSignature && sigPath && fs.existsSync(sigPath)) {
    try {
      doc.image(sigPath, MARGIN_X + 2, sigImgY, { fit: [120, 52] });
    } catch {
      // ignore
    }
  }

  const lineY = sigImgY + 54;
  doc.save();
  doc.moveTo(MARGIN_X, lineY).lineTo(MARGIN_X + 178, lineY)
    .strokeColor('#374151').lineWidth(0.9).stroke();
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK_TEXT)
    .text('Dr. Rashmita Karvir-Kekre (PT)', MARGIN_X, lineY + 7);

  doc.font('Helvetica').fontSize(9.5).fillColor(BODY_TEXT)
    .text('Health 360 Physiotherapy & Craniosacral Therapy Clinic', MARGIN_X, lineY + 21);

  if (includeStamp && stampPath && fs.existsSync(stampPath)) {
    try {
      doc.image(stampPath, MARGIN_X + 2, lineY + 42, { fit: [148, 42] });
    } catch {
      // ignore
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as LetterheadPayload;

    const dateStr = (payload.date ?? '').trim();
    const title = (payload.title ?? 'CERTIFICATE OF OBSERVERSHIP').trim();
    const subtitle = (payload.subtitle ?? 'To Whomsoever It May Concern').trim();
    const body = payload.body ?? '';
    const includeSignature = payload.includeSignature !== false;
    const includeStamp = payload.includeStamp !== false;

    const publicDir = path.join(process.cwd(), 'public');
    const logoNewPath = path.join(publicDir, 'logo-new.png');
    const logoFallbackPath = path.join(publicDir, 'logo', 'rklogo.png');
    const logoPath = fs.existsSync(logoNewPath) ? logoNewPath : logoFallbackPath;
    const sigPath = path.join(publicDir, 'signatures', 'dr-rashmita-signature.png');
    const stampPath = path.join(publicDir, 'signatures', 'dr-rashmita-stamp.png');

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 34, bottom: 36, left: MARGIN_X, right: MARGIN_X },
      compress: true,
      autoFirstPage: true,
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const pdfDone = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // 1. Fixed Official Letterhead Header
    renderLetterheadHeader(doc, fs.existsSync(logoPath) ? logoPath : null);

    // 2. Date Row with subtle underline
    const dateY = 184;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK_TEXT)
      .text('Date:', MARGIN_X, dateY, { lineBreak: false });
    if (dateStr) {
      doc.font('Helvetica').fontSize(10).fillColor(BODY_TEXT)
        .text(dateStr, MARGIN_X + 36, dateY, { lineBreak: false });
    }
    doc.save();
    doc.moveTo(MARGIN_X + 31, dateY + 13).lineTo(MARGIN_X + 158, dateY + 13)
      .strokeColor(LINE_GRAY).lineWidth(0.75).stroke();
    doc.restore();

    // 3. Title & Teal Rule & Subtitle
    let curY = 224;
    if (title) {
      doc.font('Helvetica-Bold').fontSize(13).fillColor(DARK_TEXT)
        .text(title.toUpperCase(), MARGIN_X, curY, {
          align: 'center',
          width: USABLE_W,
          characterSpacing: 2.0,
        });
      curY = doc.y + 5;

      // Centered teal divider line matching the reference PDF
      const ruleW = 290;
      const ruleX = (PAGE_W - ruleW) / 2;
      doc.save();
      doc.moveTo(ruleX, curY).lineTo(ruleX + ruleW, curY)
        .strokeColor(TEAL).lineWidth(0.9).stroke();
      doc.restore();
      curY += 8;
    }

    if (subtitle) {
      doc.font('Helvetica').fontSize(9.5).fillColor(MUTED_TEXT)
        .text(subtitle, MARGIN_X, curY, {
          align: 'center',
          width: USABLE_W,
        });
      curY = doc.y + 28;
    } else {
      curY += 20;
    }

    // 4. Editable Middle Content (blank if user left it blank, or formatted paragraphs)
    doc.x = MARGIN_X;
    doc.y = Math.max(curY, 292);

    const normalizedBody = body.replace(/\r\n/g, '\n');
    if (normalizedBody.trim().length > 0) {
      const lines = normalizedBody.split('\n');
      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        if (line.trim() === '') {
          doc.y += 10;
          continue;
        }

        const segments = parseBoldSegments(line);
        for (let sIdx = 0; sIdx < segments.length; sIdx++) {
          const seg = segments[sIdx];
          const isFirst = sIdx === 0;
          const isLast = sIdx === segments.length - 1;

          doc
            .font(seg.bold ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(10.5)
            .fillColor(DARK_TEXT);

          if (isFirst) {
            doc.text(seg.text, MARGIN_X, doc.y, {
              width: USABLE_W,
              lineGap: 4.5,
              align: 'left',
              continued: !isLast,
            });
          } else {
            doc.text(seg.text, {
              width: USABLE_W,
              lineGap: 4.5,
              align: 'left',
              continued: !isLast,
            });
          }
        }
        doc.y += 4;
      }
    } else {
      // Leave generous blank writing space if downloaded completely blank
      doc.y = 430;
    }

    // 5. Fixed Signatory & Stamp Block
    const signatoryY = Math.max(doc.y + 32, 385);
    renderSignatory(
      doc,
      signatoryY,
      fs.existsSync(sigPath) ? sigPath : null,
      fs.existsSync(stampPath) ? stampPath : null,
      includeSignature,
      includeStamp
    );

    doc.end();
    const pdfBuffer = await pdfDone;

    const rawName = (payload.filename || '').trim() || `health360-certificate-${dateStr || 'signed'}`;
    const safeFilename = rawName
      .replace(/\.pdf$/i, '')
      .replace(/[^a-z0-9._-]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'health360-certificate';

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate certificate PDF';
    console.error('[LetterheadPDF] Error:', err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

