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

    // Send SMS via Fast2SMS
    const fast2SmsKey = process.env.FAST2SMS_API_KEY;
    let smsSent = false;
    let smsError: string | null = null;

    if (!fast2SmsKey) {
      console.error('[OTP] FAST2SMS_API_KEY is NOT set in environment variables!');
      smsError = 'SMS service not configured (missing API key)';
    } else {
      const message = `Your HEALTH 360 booking OTP is ${otp}. It is valid for 10 minutes.`;

      try {
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': fast2SmsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'q',
            message,
            flash: 0,
            numbers: cleanPhone,
          }),
        });

        const data = await response.json();
        console.log('[OTP] Fast2SMS response for', cleanPhone, ':', JSON.stringify(data));

        if (data.return === true) {
          smsSent = true;
        } else {
          smsError = JSON.stringify(data);
          console.error('[OTP] Fast2SMS rejected:', data);
        }
      } catch (smsErr: any) {
        smsError = smsErr?.message || 'fetch error';
        console.error('[OTP] Fast2SMS fetch error:', smsErr);
      }
    }

    if (!smsSent) {
      console.error(`[OTP] OTP for ${cleanPhone} NOT sent. Reason: ${smsError}`);
    }

    return NextResponse.json({
      success: true,
      smsSent,
      ...(smsError && { smsError }),
      message: smsSent ? 'OTP sent successfully' : `OTP generated but SMS failed: ${smsError}`,
    });

  } catch (error) {
    console.error('[OTP] Server error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
