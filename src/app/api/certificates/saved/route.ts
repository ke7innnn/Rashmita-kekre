import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

export interface SavedLetterheadCert {
  id: string;
  label: string;
  date: string;
  title: string;
  subtitle: string;
  body: string;
  filename: string;
  includeSignature: boolean;
  includeStamp: boolean;
  createdAt: string;
  updatedAt: string;
}

let tableReadyPromise: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReadyPromise) {
    tableReadyPromise = prisma
      .$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "LetterheadCertificate" (
          "id" TEXT PRIMARY KEY,
          "label" TEXT NOT NULL,
          "date" TEXT NOT NULL DEFAULT '',
          "title" TEXT NOT NULL DEFAULT 'CERTIFICATE OF OBSERVERSHIP',
          "subtitle" TEXT NOT NULL DEFAULT 'To Whomsoever It May Concern',
          "body" TEXT NOT NULL DEFAULT '',
          "filename" TEXT NOT NULL DEFAULT '',
          "includeSignature" BOOLEAN NOT NULL DEFAULT true,
          "includeStamp" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `)
      .then(() => undefined)
      .catch((err) => {
        tableReadyPromise = null;
        throw err;
      });
  }
  return tableReadyPromise;
}

function deriveLabel(payload: {
  label?: string;
  filename?: string;
  body?: string;
  title?: string;
  date?: string;
}): string {
  if (payload.label && payload.label.trim()) return payload.label.trim().slice(0, 120);
  if (payload.filename && payload.filename.trim()) {
    return payload.filename.trim().replace(/\.pdf$/i, '').slice(0, 120);
  }
  // Try to extract first bold name (e.g., **Miss. Foram Sanghvi**)
  const boldMatch = (payload.body || '').match(/\*\*(.+?)\*\*/);
  if (boldMatch?.[1]?.trim()) {
    return `${boldMatch[1].trim()}${payload.date ? ` (${payload.date})` : ''}`.slice(0, 120);
  }
  const firstLine = (payload.body || '')
    .replace(/\*\*/g, '')
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean);
  if (firstLine) {
    return firstLine.slice(0, 72) + (firstLine.length > 72 ? '…' : '');
  }
  return `${payload.title?.trim() || 'Certificate'}${payload.date ? ` · ${payload.date}` : ''}`.slice(0, 120);
}

export async function GET() {
  try {
    await ensureTable();
    const rows = await prisma.$queryRaw<SavedLetterheadCert[]>`
      SELECT
        "id",
        "label",
        "date",
        "title",
        "subtitle",
        "body",
        "filename",
        "includeSignature",
        "includeStamp",
        "createdAt",
        "updatedAt"
      FROM "LetterheadCertificate"
      ORDER BY "updatedAt" DESC
      LIMIT 100
    `;
    return NextResponse.json({ certificates: rows });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load saved certificates';
    console.error('[SavedCerts GET] Error:', err);
    return NextResponse.json({ error: message, certificates: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTable();
    const payload = (await req.json()) as {
      id?: string;
      label?: string;
      date?: string;
      title?: string;
      subtitle?: string;
      body?: string;
      filename?: string;
      includeSignature?: boolean;
      includeStamp?: boolean;
    };

    const id = payload.id && payload.id.trim() ? payload.id.trim() : crypto.randomUUID();
    const date = (payload.date ?? '').trim();
    const title = (payload.title ?? 'CERTIFICATE OF OBSERVERSHIP').trim();
    const subtitle = (payload.subtitle ?? 'To Whomsoever It May Concern').trim();
    const body = payload.body ?? '';
    const filename = (payload.filename ?? '').trim();
    const includeSignature = payload.includeSignature !== false;
    const includeStamp = payload.includeStamp !== false;
    const label = deriveLabel({ label: payload.label, filename, body, title, date });

    const rows = await prisma.$queryRaw<SavedLetterheadCert[]>`
      INSERT INTO "LetterheadCertificate" (
        "id", "label", "date", "title", "subtitle", "body", "filename",
        "includeSignature", "includeStamp", "createdAt", "updatedAt"
      )
      VALUES (
        ${id}, ${label}, ${date}, ${title}, ${subtitle}, ${body}, ${filename},
        ${includeSignature}, ${includeStamp}, NOW(), NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "label" = EXCLUDED."label",
        "date" = EXCLUDED."date",
        "title" = EXCLUDED."title",
        "subtitle" = EXCLUDED."subtitle",
        "body" = EXCLUDED."body",
        "filename" = EXCLUDED."filename",
        "includeSignature" = EXCLUDED."includeSignature",
        "includeStamp" = EXCLUDED."includeStamp",
        "updatedAt" = NOW()
      RETURNING
        "id", "label", "date", "title", "subtitle", "body", "filename",
        "includeSignature", "includeStamp", "createdAt", "updatedAt"
    `;

    return NextResponse.json({ certificate: rows[0] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save certificate';
    console.error('[SavedCerts POST] Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await ensureTable();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ error: 'Missing certificate id' }, { status: 400 });
    }

    await prisma.$executeRaw`
      DELETE FROM "LetterheadCertificate" WHERE "id" = ${id}
    `;
    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete certificate';
    console.error('[SavedCerts DELETE] Error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
