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

    // Bypass buggy Node 18 fetch (which causes 'fetch failed' on Vercel)
    // by using native Node.js https to upload directly to Supabase Storage REST API
    const https = require('https');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/['"]/g, '');
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const uploadPath = `/storage/v1/object/health360_documents/${encodeURI(fileName)}`;
    
    // DNS bypass logic: If Vercel fails to resolve the Supabase host (getaddrinfo ENOTFOUND),
    // fallback to a stable Cloudflare IP address and route via SNI headers.
    let ipAddress = 'cqisdrbprijcwbybsllq.supabase.co';
    try {
      const dns = require('dns').promises;
      const ips = await dns.resolve4('cqisdrbprijcwbybsllq.supabase.co').catch(() => []);
      if (ips && ips.length > 0) {
        ipAddress = ips[0];
      } else {
        ipAddress = '172.64.149.246'; // Fallback Cloudflare IP
      }
    } catch (e) {
      ipAddress = '172.64.149.246';
    }

    const uploadError = await new Promise<any>((resolve) => {
      const reqConfig = https.request({
        hostname: ipAddress,
        port: 443,
        path: uploadPath,
        method: 'POST',
        servername: 'cqisdrbprijcwbybsllq.supabase.co', // Force SNI certificate matching
        headers: {
          'Host': 'cqisdrbprijcwbybsllq.supabase.co',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': file.type || 'application/octet-stream',
          'Content-Length': buffer.length
        }
      }, (res: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(null);
        else resolve(new Error(`HTTP ${res.statusCode}`));
      });
      reqConfig.on('error', (err: any) => resolve(err));
      reqConfig.write(buffer);
      reqConfig.end();
    });

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
