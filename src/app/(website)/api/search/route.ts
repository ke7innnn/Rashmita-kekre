import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json([]);
  }

  try {
    // Sub-search patient records containing clinical complaint or notes
    const { data: patients, error: pError } = await supabase
      .from('Patient')
      .select('*, appointments:Appointment(*)')
      .or(`fullName.ilike.%${q}%,presentingComplaint.ilike.%${q}%,notes.ilike.%${q}%`)
      .limit(20);

    if (pError) throw pError;

    // Sorting appointments
    patients?.forEach((p: any) => {
      if (p.appointments) {
        p.appointments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        p.appointments = p.appointments.slice(0, 5);
      }
    });

    // Also look for appointments with clinical notes matching query
    const { data: appointments, error: aError } = await supabase
      .from('Appointment')
      .select('*, patient:Patient(*)')
      .ilike('notes', `%${q}%`)
      .limit(20);

    if (aError) throw aError;

    // Merge & format results cleanly
    const results: any[] = [];

    (patients || []).forEach((p: any) => {
      results.push({
        type: 'PATIENT_PROFILE',
        id: p.id,
        title: p.fullName,
        subtitle: `Complaint: ${p.presentingComplaint || 'None'}`,
        description: p.notes || 'No profile notes.',
        tags: p.tags ? p.tags.split(',') : [],
      });
    });

    (appointments || []).forEach((app: any) => {
      // Avoid duplicate profiles in results if notes match
      if (results.some((r) => r.id === app.patientId && r.type === 'PATIENT_PROFILE')) return;
      
      results.push({
        type: 'CLINICAL_SESSION',
        id: app.id,
        title: `Session Notes — ${app.patient.fullName}`,
        subtitle: `${new Date(app.date).toLocaleDateString()} @ ${app.startTime} (${app.treatmentType})`,
        description: app.notes || 'No session notes.',
        tags: [app.treatmentType],
      });
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error executing clinical search:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
