import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const patientId = formData.get('patientId') as string | null;
    const fileName = formData.get('fileName') as string | null;

    if (!file || !patientId || !fileName) {
      return NextResponse.json({ error: 'Missing file, patientId, or fileName' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload using backend service role supabase client (bypasses RLS)
    const { error: uploadError } = await supabase.storage
      .from('health360_documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        duplex: 'half'
      } as any);

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('health360_documents')
      .getPublicUrl(fileName);

    return NextResponse.json({ publicUrl });
  } catch (error: any) {
    console.error('File upload API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
