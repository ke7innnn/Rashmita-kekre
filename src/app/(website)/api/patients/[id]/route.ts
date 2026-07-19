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
    if (json.notes !== undefined) dataToUpdate.notes = json.notes;
    if (json.assignedProtocolId !== undefined) dataToUpdate.assignedProtocolId = json.assignedProtocolId;
    if (json.currentProtocolStep !== undefined) dataToUpdate.currentProtocolStep = json.currentProtocolStep;
    if (json.treatmentModalityAssigned !== undefined) dataToUpdate.treatmentModalityAssigned = json.treatmentModalityAssigned;
    if (json.referringDoctor !== undefined) dataToUpdate.referringDoctor = json.referringDoctor;

    // Attachments simulation support
    if (json.attachment) {
      dataToUpdate.attachments = {
        create: {
          name: json.attachment.name,
          url: json.attachment.url,
          fileType: json.attachment.fileType,
        }
      };
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
