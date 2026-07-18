import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: protocols, error } = await supabase
      .from('TreatmentProtocol')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }
    return NextResponse.json(protocols);
  } catch (error: any) {
    console.error('Error fetching protocols:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
