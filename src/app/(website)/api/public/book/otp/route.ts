import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10); // Extract last 10 digits

    // Generate a secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Expire in 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Store in database
    await prisma.otpRequest.create({
      data: {
        phone: cleanPhone,
        otp,
        expiresAt,
      },
    });

    // Send SMS via MSG91 OTP API
    const msg91AuthKey = process.env.MSG91_AUTH_KEY || '552679AiTV4h5NbNZY6a5fb69dP1';
    const msg91TemplateId = process.env.MSG91_TEMPLATE_ID || '6a5f80560094e405d00c3a12';
    
    let smsSent = false;
    let smsError: string | null = null;

    try {
      const msg91Url = `https://control.msg91.com/api/v5/otp?template_id=${msg91TemplateId}&mobile=91${cleanPhone}&authkey=${msg91AuthKey}&otp=${otp}`;
      const response = await fetch(msg91Url, { method: 'POST' });
      const data = await response.json();

      console.log('[MSG91 OTP] Response for', cleanPhone, ':', JSON.stringify(data));

      if (data.type === 'success') {
        smsSent = true;
      } else {
        smsError = JSON.stringify(data);
        console.error('[MSG91 OTP] Rejected:', data);
      }
    } catch (smsErr: any) {
      smsError = smsErr?.message || 'fetch error';
      console.error('[MSG91 OTP] Fetch error:', smsErr);
    }

    if (!smsSent) {
      console.error(`[OTP] OTP for ${cleanPhone} NOT sent. Reason: ${smsError}`);
    }

    return NextResponse.json({
      success: true,
      smsSent,
      ...(smsError && { smsError }),
      message: smsSent ? 'OTP sent successfully via MSG91' : `OTP generated but SMS failed: ${smsError}`,
    });

  } catch (error) {
    console.error('[OTP] Server error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
