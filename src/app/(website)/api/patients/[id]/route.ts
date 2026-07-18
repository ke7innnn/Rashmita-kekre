import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: patient, error } = await supabase
      .from('Patient')
      .select('*, appointments:Appointment(*), callLogs:CallLog(*), attachments:Attachment(*), sessionPackages:SessionPackage(*), feedback:Feedback(*), waitlists:Waitlist(*), sentHandouts:SentHandout(*, handout:Handout(*))')
      .eq('id', id)
      .single();

    if (error || !patient) {
      console.error('Supabase error fetching patient profile:', error);
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Sort related records since Supabase JS SDK doesn't natively support nested orderings cleanly in all versions
    if (patient.appointments) patient.appointments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (patient.callLogs) patient.callLogs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (patient.attachments) patient.attachments.sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    if (patient.sessionPackages) patient.sessionPackages.sort((a: any, b: any) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    if (patient.feedback) patient.feedback.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    if (patient.waitlists) patient.waitlists.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (patient.sentHandouts) patient.sentHandouts.sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    const parsedPatient = {
      ...patient,
      tags: patient.tags ? patient.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    };

    return NextResponse.json(parsedPatient);
  } catch (error: any) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
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

    // Attachments simulation support
    if (json.attachment) {
      await supabase.from('Attachment').insert({
        patientId: id,
        name: json.attachment.name,
        url: json.attachment.url,
        fileType: json.attachment.fileType,
      });
    }

    const { data: updated, error } = await supabase
      .from('Patient')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating patient:', error);
      throw error;
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating patient details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
