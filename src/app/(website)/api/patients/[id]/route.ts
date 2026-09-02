import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { date: 'desc' },
        },
        callLogs: {
          orderBy: { timestamp: 'desc' },
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' },
        },
        sessionPackages: {
          orderBy: { purchaseDate: 'desc' },
        },
        feedback: {
          orderBy: { submittedAt: 'desc' },
        },
        waitlists: {
          orderBy: { createdAt: 'desc' },
        },
        sentHandouts: {
          include: { handout: true },
          orderBy: { sentAt: 'desc' },
        },
        invoices: {
          include: {
            lines: true,
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const parsedPatient = {
      ...patient,
      tags: patient.tags ? patient.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };

    return NextResponse.json(parsedPatient);
  } catch (error: any) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await req.json();

    const dataToUpdate: any = {};
    if (json.fullName !== undefined) dataToUpdate.fullName = json.fullName;
    if (json.gender !== undefined) dataToUpdate.gender = json.gender;
    if (json.dateOfBirth !== undefined) {
      dataToUpdate.dateOfBirth = json.dateOfBirth ? new Date(json.dateOfBirth) : new Date('1990-01-01');
    }
    if (json.phone !== undefined) dataToUpdate.phone = json.phone;
    if (json.secondaryPhone !== undefined) dataToUpdate.secondaryPhone = json.secondaryPhone;
    if (json.email !== undefined) dataToUpdate.email = json.email;
    if (json.thirdPartyUid !== undefined) dataToUpdate.thirdPartyUid = json.thirdPartyUid;
    if (json.bloodGroup !== undefined) dataToUpdate.bloodGroup = json.bloodGroup;
    if (json.parentSpouseCaretakerName !== undefined) dataToUpdate.parentSpouseCaretakerName = json.parentSpouseCaretakerName;
    if (json.dateOfMarriage !== undefined) {
      dataToUpdate.dateOfMarriage = json.dateOfMarriage ? new Date(json.dateOfMarriage) : null;
    }
    if (json.address !== undefined) dataToUpdate.address = json.address;
    if (json.referringDoctor !== undefined) dataToUpdate.referringDoctor = json.referringDoctor;
    if (json.presentingComplaint !== undefined) dataToUpdate.presentingComplaint = json.presentingComplaint;
    if (json.diagnosis !== undefined) dataToUpdate.diagnosis = json.diagnosis;
    if (json.treatmentModalityAssigned !== undefined) dataToUpdate.treatmentModalityAssigned = json.treatmentModalityAssigned;
    if (json.notes !== undefined) dataToUpdate.notes = json.notes;
    if (json.assignedProtocolId !== undefined) dataToUpdate.assignedProtocolId = json.assignedProtocolId;
    if (json.currentProtocolStep !== undefined) dataToUpdate.currentProtocolStep = json.currentProtocolStep;
    if (json.expectedCadence !== undefined) dataToUpdate.expectedCadence = json.expectedCadence;
    if (json.tags !== undefined) {
      dataToUpdate.tags = Array.isArray(json.tags) ? json.tags.join(', ') : (json.tags || '');
    }

    // Attachments support (single or multiple batch upload)
    if (json.attachments && Array.isArray(json.attachments) && json.attachments.length > 0) {
      dataToUpdate.attachments = {
        create: json.attachments.map((att: any) => ({
          name: att.name,
          url: att.url,
          fileType: att.fileType || 'PDF',
        }))
      };
    } else if (json.attachment) {
      dataToUpdate.attachments = {
        create: {
          name: json.attachment.name,
          url: json.attachment.url,
          fileType: json.attachment.fileType || 'PDF',
        }
      };
    }

    if (json.deleteAttachmentId) {
      await prisma.attachment.delete({
        where: { id: json.deleteAttachmentId }
      });
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating patient details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
