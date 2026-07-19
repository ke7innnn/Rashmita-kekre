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
    
    if (fast2SmsKey) {
      const message = `Your HEALTH 360 booking OTP is ${otp}. It is valid for 10 minutes.`;
      
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2SmsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: message,
          flash: 0,
          numbers: cleanPhone,
        }),
      });

      const data = await response.json();
      if (!data.return) {
        console.error('Fast2SMS Error:', data);
      }
    } else {
      console.warn('FAST2SMS_API_KEY is not set. OTP generated but not sent:', otp);
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });

  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
