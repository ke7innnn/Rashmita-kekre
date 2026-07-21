import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  try {
    const https = require('https');
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const cleanKey = supabaseKey?.replace(/['"]/g, '');

    const downloadPath = `/storage/v1/object/public/health360_documents/${encodeURI(path)}`;

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

    const fileData = await new Promise<{ buffer: Buffer; contentType: string; statusCode: number }>((resolve, reject) => {
      const reqConfig = https.request({
        hostname: ipAddress,
        port: 443,
        path: downloadPath,
        method: 'GET',
        servername: 'cqisdrbprijcwbybsllq.supabase.co', // Force SNI certificate matching
        headers: {
          'Host': 'cqisdrbprijcwbybsllq.supabase.co',
          'Authorization': `Bearer ${cleanKey}`,
          'apikey': cleanKey
        }
      }, (res: any) => {
        const chunks: any[] = [];
        res.on('data', (chunk: any) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: res.headers['content-type'] || 'application/octet-stream',
            statusCode: res.statusCode
          });
        });
      });
      reqConfig.on('error', (err: any) => reject(err));
      reqConfig.end();
    });

    if (fileData.statusCode < 200 || fileData.statusCode >= 300) {
      return NextResponse.json({ error: `Supabase download failed with status ${fileData.statusCode}` }, { status: fileData.statusCode });
    }

    return new Response(new Uint8Array(fileData.buffer), {
      headers: {
        'Content-Type': fileData.contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': 'inline'
      }
    });
  } catch (error: any) {
    console.error('File view API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
