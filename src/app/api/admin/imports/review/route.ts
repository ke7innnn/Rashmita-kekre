import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole } from '@/lib/roleGate';
import { Role, ImportStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'patients';
  const reason = searchParams.get('reason') || '';
  const searchSurvivor = searchParams.get('searchSurvivor') || '';

  try {
    // Survivor search mode (for merge candidate lookup)
    if (searchSurvivor.trim()) {
      const candidates = await prisma.patient.findMany({
        where: {
          importStatus: ImportStatus.ACTIVE,
          OR: [
            { fullName: { contains: searchSurvivor.trim(), mode: 'insensitive' } },
            { phone: { contains: searchSurvivor.trim(), mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          fullName: true,
          phone: true,
          gender: true,
          dateOfBirth: true,
          createdAt: true,
        },
        take: 10,
      });
      return NextResponse.json({ candidates });
    }

    if (type === 'patients') {
      const whereClause: any = {
        importStatus: ImportStatus.NEEDS_REVIEW,
      };

      if (reason && reason !== 'ALL') {
        if (reason === 'LINKED_CONTACT') {
          whereClause.entryType = 'LINKED_CONTACT';
        } else {
          whereClause.importReason = { contains: reason, mode: 'insensitive' };
        }
      }

      const [items, allReasonsRaw, totalCount, referralsCount] = await Promise.all([
        prisma.patient.findMany({
          where: whereClause,
          select: {
            id: true,
            fullName: true,
            phone: true,
            phoneAlt: true,
            entryType: true,
            relationNote: true,
            importStatus: true,
            importReason: true,
            rawContactName: true,
            rawPhone: true,
            createdAt: true,
          },
          orderBy: { fullName: 'asc' },
        }),
        prisma.patient.findMany({
          where: { importStatus: ImportStatus.NEEDS_REVIEW },
          select: { importReason: true, entryType: true },
        }),
        prisma.patient.count({ where: { importStatus: ImportStatus.NEEDS_REVIEW } }),
        prisma.referralContact.count({ where: { importStatus: ImportStatus.NEEDS_REVIEW } }),
      ]);

      // Extract unique reason tags for filtering
      const reasonSet = new Set<string>();
      if (allReasonsRaw.some((p) => p.entryType === 'LINKED_CONTACT')) {
        reasonSet.add('LINKED_CONTACT');
      }
      for (const p of allReasonsRaw) {
        if (p.importReason) {
          p.importReason.split(';').forEach((r) => {
            const trimmed = r.trim();
            if (trimmed) reasonSet.add(trimmed);
          });
        }
      }

      return NextResponse.json({
        items,
        reasons: Array.from(reasonSet),
        counts: {
          patients: totalCount,
          referrals: referralsCount,
        },
      });
    } else {
      // Referrals review queue
      const whereClause: any = {
        importStatus: ImportStatus.NEEDS_REVIEW,
      };

      if (reason && reason !== 'ALL') {
        whereClause.importReason = { contains: reason, mode: 'insensitive' };
      }

      const [items, allReasonsRaw, totalCount, patientsCount] = await Promise.all([
        prisma.referralContact.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            phone: true,
            phoneAlt: true,
            category: true,
            specialty: true,
            location: true,
            organisation: true,
            importStatus: true,
            importReason: true,
            rawContactName: true,
            rawPhone: true,
            createdAt: true,
          },
          orderBy: { name: 'asc' },
        }),
        prisma.referralContact.findMany({
          where: { importStatus: ImportStatus.NEEDS_REVIEW },
          select: { importReason: true },
        }),
        prisma.referralContact.count({ where: { importStatus: ImportStatus.NEEDS_REVIEW } }),
        prisma.patient.count({ where: { importStatus: ImportStatus.NEEDS_REVIEW } }),
      ]);

      const reasonSet = new Set<string>();
      for (const r of allReasonsRaw) {
        if (r.importReason) {
          r.importReason.split(';').forEach((res) => {
            const trimmed = res.trim();
            if (trimmed) reasonSet.add(trimmed);
          });
        }
      }

      return NextResponse.json({
        items,
        reasons: Array.from(reasonSet),
        counts: {
          patients: patientsCount,
          referrals: totalCount,
        },
      });
    }
  } catch (error: any) {
    console.error('Error fetching review queue items:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireRole([Role.ADMIN]);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { action, type, id, name, phone, loserId, survivorId } = body;

    if (action === 'APPROVE') {
      if (type === 'patients') {
        const updated = await prisma.patient.update({
          where: { id },
          data: { importStatus: ImportStatus.ACTIVE },
        });
        return NextResponse.json({ success: true, item: updated });
      } else {
        const updated = await prisma.referralContact.update({
          where: { id },
          data: { importStatus: ImportStatus.ACTIVE },
        });
        return NextResponse.json({ success: true, item: updated });
      }
    }

    if (action === 'REJECT') {
      if (type === 'patients') {
        const updated = await prisma.patient.update({
          where: { id },
          data: { importStatus: ImportStatus.REJECTED },
        });
        return NextResponse.json({ success: true, item: updated });
      } else {
        const updated = await prisma.referralContact.update({
          where: { id },
          data: { importStatus: ImportStatus.REJECTED },
        });
        return NextResponse.json({ success: true, item: updated });
      }
    }

    if (action === 'EDIT') {
      if (type === 'patients') {
        const updated = await prisma.patient.update({
          where: { id },
          data: {
            fullName: name,
            ...(phone !== undefined ? { phone: phone ? phone.trim() : null } : {}),
            importStatus: ImportStatus.ACTIVE,
          },
        });
        return NextResponse.json({ success: true, item: updated });
      } else {
        const updated = await prisma.referralContact.update({
          where: { id },
          data: {
            name,
            ...(phone !== undefined ? { phone: phone ? phone.trim() : null } : {}),
            importStatus: ImportStatus.ACTIVE,
          },
        });
        return NextResponse.json({ success: true, item: updated });
      }
    }

    if (action === 'MERGE') {
      if (!loserId || !survivorId || loserId === survivorId) {
        return NextResponse.json(
          { error: 'Invalid merge parameters: loserId and survivorId must be valid and distinct.' },
          { status: 400 }
        );
      }

      const [loser, survivor] = await Promise.all([
        prisma.patient.findUnique({ where: { id: loserId } }),
        prisma.patient.findUnique({ where: { id: survivorId } }),
      ]);

      if (!loser || !survivor) {
        return NextResponse.json({ error: 'One or both patient records could not be found.' }, { status: 404 });
      }

      // Move relations in a transaction
      const moved = await prisma.$transaction(async (tx) => {
        const [appts, assessments, invoices, packages, sessionPkgs, calls, attachments, feedback, waitlists, handouts] =
          await Promise.all([
            tx.appointment.updateMany({ where: { patientId: loserId }, data: { patientId: survivorId } }),
            tx.assessment.updateMany({ where: { patientId: loserId }, data: { patientId: survivorId } }),
            tx.invoice.updateMany({ where: { patientId: loserId }, data: { patientId: survivorId } }),
            tx.patientPackage.updateMany({ where: { patientId: loserId }, data: { patientId: survivorId } }),
            tx.sessionPackage.updateMany({ where: { patientId: loserId }, data: { patientId: survivorId } }),
            tx.callLog.updateMany({ where: { patientId: loserId }, data: { patientId: survivorId } }),
            tx.attachment.updateMany({ where: { patientId: loserId }, data: { patientId: survivorId } }),
            tx.feedback.updateMany({ where: { patientId: loserId }, data: { patientId: survivorId } }),
            tx.waitlist.updateMany({ where: { patientId: loserId }, data: { patientId: survivorId } }),
            tx.sentHandout.updateMany({ where: { patientId: loserId }, data: { patientId: survivorId } }),
          ]);

        // Null loser phone and set mergedIntoId
        await tx.patient.update({
          where: { id: loserId },
          data: {
            phone: null,
            importStatus: ImportStatus.REJECTED,
            mergedIntoId: survivorId,
            importReason: `Merged into ${survivor.fullName} (${survivor.id})`,
          },
        });

        return {
          appointments: appts.count,
          assessments: assessments.count,
          invoices: invoices.count,
          packages: packages.count,
          sessionPackages: sessionPkgs.count,
          calls: calls.count,
          attachments: attachments.count,
          feedback: feedback.count,
          waitlists: waitlists.count,
          handouts: handouts.count,
        };
      });

      return NextResponse.json({ success: true, moved });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing review action:', error);
    return NextResponse.json({ error: error.message || 'Action processing failed' }, { status: 500 });
  }
}
