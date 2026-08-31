import { NextResponse } from 'next/server';

const WHATSAPP_TEMPLATES: Record<string, Function> = {
  referral_thankyou_long: (doc: string, pat: string) => 
    `Dear Dr. ${doc},\n\nThank you for referring ${pat} to Health 360 Physiotherapy & Craniosacral Therapy Clinic.\n\nWe appreciate your trust. The patient has been evaluated and treatment initiated.\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`,
  
  referral_thankyou_short: (doc: string, pat: string) => 
    `Dear Dr. ${doc},\n\nThank you for referring ${pat} to us. We appreciate your support!\n\nDr. Rashmita Karvir-Kekre (PT)`,
  
  next_appointment_reminder: (pat: string, date: string, time: string) => 
    `Hello ${pat},\n\nYour next physiotherapy session at Health 360 Clinic is scheduled for:\n📅 ${date}\n⏰ ${time}\n\nPlease reply if you need to reschedule.\n\nTeam Health 360`,
  
  missed_appointment_notice: (pat: string) => 
    `Hello ${pat},\n\nWe missed seeing you at your appointment today at Health 360 Clinic. Please reply to reschedule your session.\n\nTeam Health 360`,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, templateName, params = [], message } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Clean phone number (defaulting to India +91 if 10 digits)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    // Resolve message text
    let textMessage = message;
    if (!textMessage && templateName && WHATSAPP_TEMPLATES[templateName]) {
      textMessage = WHATSAPP_TEMPLATES[templateName](...params);
    }
    if (!textMessage) {
      textMessage = `Hello from Health 360 Physiotherapy Clinic.`;
    }

    const encodedText = encodeURIComponent(textMessage);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

    // Meta Cloud API integration if env token configured
    const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (token && phoneId) {
      try {
        let metaPayload: any;

        if (templateName) {
          metaPayload = {
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en' },
              components: params.length > 0 ? [
                {
                  type: 'body',
                  parameters: params.map((p: any) => ({
                    type: 'text',
                    text: String(p)
                  }))
                }
              ] : []
            }
          };
        } else {
          metaPayload = {
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: textMessage }
          };
        }

        const metaRes = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metaPayload)
        });

        const metaData = await metaRes.json();
        if (metaRes.ok && metaData.messages?.[0]?.id) {
          return NextResponse.json({ 
            success: true, 
            method: 'meta_api', 
            messageId: metaData.messages[0].id,
            waUrl 
          });
        } else {
          console.warn('Meta WhatsApp API rejected payload, falling back to wa_me:', metaData);
        }
      } catch (err) {
        console.warn('Meta WhatsApp API error, falling back to wa.me URL:', err);
      }
    }

    // Fallback to direct wa.me link for immediate client dispatch
    return NextResponse.json({
      success: true,
      method: 'wa_me',
      waUrl,
      messageText: textMessage
    });
  } catch (error: any) {
    console.error('WhatsApp API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
