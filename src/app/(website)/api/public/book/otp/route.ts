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

    // 1. Send SMS via MSG91 OTP API
    const msg91AuthKey = process.env.MSG91_AUTH_KEY || '552679AiTV4h5NbNZY6a5fb69dP1';
    const msg91TemplateId = process.env.MSG91_TEMPLATE_ID || '6a5f80560094e405d00c3a12';
    
    let smsSent = false;
    let smsProvider = '';
    let smsError: string | null = null;

    try {
      const msg91Url = `https://control.msg91.com/api/v5/otp?template_id=${msg91TemplateId}&mobile=91${cleanPhone}&authkey=${msg91AuthKey}&otp=${otp}`;
      const response = await fetch(msg91Url, { method: 'POST' });
      const data = await response.json();

      console.log('[MSG91 OTP] Response for', cleanPhone, ':', JSON.stringify(data));

      if (data.type === 'success' || data.message === 'OTP sent successfully') {
        smsSent = true;
        smsProvider = 'MSG91';
      } else {
        smsError = JSON.stringify(data);
        console.error('[MSG91 OTP] Rejected:', data);
      }
    } catch (smsErr: any) {
      smsError = smsErr?.message || 'fetch error';
      console.error('[MSG91 OTP] Fetch error:', smsErr);
    }

    // 2. Dual Fallback via Fast2SMS API if MSG91 failed
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    if (!smsSent && fast2smsKey) {
      try {
        console.log('[Fast2SMS] Attempting OTP delivery fallback for', cleanPhone);
        const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&variables_values=${otp}&route=otp&numbers=${cleanPhone}`;
        const f2sRes = await fetch(fast2smsUrl, {
          method: 'GET',
          headers: {
            'cache-control': 'no-cache',
          },
        });
        const f2sData = await f2sRes.json();
        console.log('[Fast2SMS] Response:', f2sData);

        if (f2sData.return === true) {
          smsSent = true;
          smsProvider = 'Fast2SMS';
          smsError = null;
        } else {
          smsError = (smsError ? smsError + ' | ' : '') + JSON.stringify(f2sData);
        }
      } catch (f2sErr: any) {
        console.error('[Fast2SMS] Fetch error:', f2sErr);
        smsError = (smsError ? smsError + ' | ' : '') + f2sErr.message;
      }
    }

    if (!smsSent) {
      console.error(`[OTP] OTP for ${cleanPhone} NOT sent across all gateways. Reason: ${smsError}`);
    }

    return NextResponse.json({
      success: true,
      smsSent,
      smsProvider,
      ...(smsError && { smsError }),
      message: smsSent ? `OTP sent successfully via ${smsProvider}` : `OTP generated in DB: ${smsError}`,
    });

  } catch (error) {
    console.error('[OTP] Server error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
