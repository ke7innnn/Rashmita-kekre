import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, templateName, params = [], message } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1264792810055065';
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'WHATSAPP_ACCESS_TOKEN is not configured' }, { status: 500 });
    }

    // Format destination number (Meta requires country code without '+', default to 91 for India)
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const destination = `91${cleanPhone}`;

    let payload: any;

    if (templateName) {
      // Send Template Message
      const components = params.length > 0 ? [
        {
          type: 'body',
          parameters: params.map((param: string) => ({
            type: 'text',
            text: param || ' ',
          })),
        },
      ] : [];

      payload = {
        messaging_product: 'whatsapp',
        to: destination,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components,
        },
      };
    } else if (message) {
      // Send Direct Text Message (if inside 24h customer service window)
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: destination,
        type: 'text',
        text: { body: message },
      };
    } else {
      return NextResponse.json({ success: false, error: 'Either templateName or message must be provided' }, { status: 400 });
    }

    console.log(`[WhatsApp API] Sending payload to ${destination}:`, JSON.stringify(payload));

    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log('[WhatsApp API] Response:', data);

    if (!res.ok) {
      return NextResponse.json({ success: false, error: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[WhatsApp API] Server error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
