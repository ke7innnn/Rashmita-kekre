import { NextResponse } from 'next/server';

const WHATSAPP_TEMPLATES: Record<string, Function> = {
  referral_thankyou_long: (doc: string, pat: string) => 
    `Dear Dr. ${doc},\n\nThank you for referring ${pat} to Health 360 Physiotherapy & Craniosacral Therapy Clinic.\n\nWe appreciate your trust. The patient has been evaluated and treatment initiated.\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`,
  
  referral_thankyou_short: (doc: string, pat: string) => 
    `Dear Dr. ${doc},\n\nThank you for referring ${pat} to us. We sincerely appreciate your trust and support. The patient has been evaluated, and treatment has been started. We look forward to working together to achieve the best outcome.\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Physiotherapy & Craniosacral Therapy Clinic`,
  
  next_appointment_reminder: (pat: string, date: string, time: string) => 
    `Hello ${pat},\n\nThank you for your visit today. Your next physiotherapy session is scheduled for:\n\n📅 ${date}\n⏰ ${time}\n\nWe look forward to seeing you. Please reply if you need to reschedule.\n\nTeam Health 360`,
  
  missed_appointment_notice: (pat: string) => 
    `Hello ${pat},\n\nWe missed seeing you at your appointment today. To continue your recovery and maintain your progress, please let us know a suitable time to reschedule your session.\n\nWe look forward to assisting you.\n\nTeam Health 360`,

  google_review_request: (pat: string, url: string = 'https://g.page/r/CSdQGRuzUnLrEAE/review') =>
    `Hello ${pat},\n\nThank you for visiting Health 360 Physiotherapy & Craniosacral Therapy Clinic.\n\nWe would love to know about your recovery journey! Please take a quick moment to share your review on our Google profile:\n${url}\n\nYour feedback helps others find the right care.\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`,

  mediclaim_certificate_notice: (pat: string, diagnosis: string, startDate: string, endDate: string, sessions: string, totalAmount: string) =>
    `Hello ${pat},\n\nYour Physiotherapy Treatment & Mediclaim Certificate from Health 360 Clinic is ready:\n\n• Diagnosis: ${diagnosis}\n• Treatment Period: ${startDate} to ${endDate}\n• Total Sessions Attended: ${sessions}\n• Total Amount Paid: ₹${totalAmount}\n\nPlease let us know if you or your insurance provider need any additional details.\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`,

  fitness_certificate_notice: (pat: string, assessmentDate: string, fitnessStatus: string, remarks: string) =>
    `Hello ${pat},\n\nBased on your clinical evaluation at Health 360 Clinic on ${assessmentDate}, you are certified:\n\n✅ ${fitnessStatus}\n\nPhysiotherapist Advice:\n${remarks}\n\nKeep up the great progress and continue your home routine!\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`,

  medical_rest_notice: (pat: string, diagnosis: string, startDate: string, endDate: string, reviewDate: string) =>
    `Hello ${pat},\n\nFollowing your clinical assessment at Health 360 Clinic, you have been advised medical rest to support your recovery for ${diagnosis}.\n\n• Recommended Rest: ${startDate} to ${endDate}\n• Next Review Date: ${reviewDate}\n\nPlease avoid strenuous activities and continue your prescribed rehabilitation.\n\nWishing you a speedy recovery,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`,

  patient_discharge_summary: (pat: string, startDate: string, endDate: string, sessions: string, outcome: string, homeAdvice: string) =>
    `Congratulations ${pat}! 🎉\n\nYou have successfully completed your physiotherapy program at Health 360 Clinic.\n\n• Treatment Period: ${startDate} to ${endDate}\n• Total Sessions: ${sessions}\n• Recovery Outcome: ${outcome}\n• Home Exercise Advice: ${homeAdvice}\n\nThank you for trusting us with your recovery. Feel free to reach out whenever you need guidance!\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`,

  welcome_clinic_info: (pat: string) =>
    `🌿 Welcome to Health360 Physiotherapy & Craniosacral Therapy Clinic! 🌿\n\nDear ${pat},\n\nThank you for choosing Health360 Physiotherapy & Craniosacral Therapy Clinic. We are committed to helping you recover, move better, and live pain-free.\n\n📍 Address:\nHealth360 Physiotherapy & Craniosacral Therapy Clinic, Shop no.1 & 2, Amardeep society,\nOm Nagar, Vasai West.\n\n🕙 Clinic Timings:\nMorning: 10:00 AM – 2:00 PM\nEvening: 5:00 PM – 9:00 PM\n\n📍 Google Location:\nhttps://maps.app.goo.gl/VpvTzGtZy3kCZZWGA?g_st=iw\n\nFor appointments or any assistance, feel free to contact us. We look forward to being a part of your recovery journey.\n☎️: 8482812859 / 9834848981\n✉️: health360vasai@gmail.com\n\nWishing you good health! 🌸\nTeam Health360 Physiotherapy & Craniosacral Therapy Clinic`,
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
