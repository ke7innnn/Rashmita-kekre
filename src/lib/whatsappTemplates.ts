export const WHATSAPP_TEMPLATES = {
  REFERRAL_THANKYOU_LONG: {
    name: 'referral_thankyou_long',
    formatText: (doctorName: string, patientName: string) => `Dear Dr. ${doctorName},

Thank you for referring Mr./Ms. ${patientName} to Health 360 Physiotherapy & Craniosacral Therapy Clinic.

We appreciate your trust and confidence in our services. The patient has been assessed, and an individualized treatment plan has been initiated to address their condition and support optimal recovery.

We will keep you updated on the patient's progress whenever required. Thank you once again for your valuable referral and continued support.

Warm regards,

Dr. Rashmita Karvir-Kekre (PT)
Health 360 Physiotherapy & Craniosacral Therapy Clinic
Vasai West`,
  },

  REFERRAL_THANKYOU_SHORT: {
    name: 'referral_thankyou_short',
    formatText: (doctorName: string, patientName: string) => `Dear Dr. ${doctorName},

Thank you for referring ${patientName} to us. We sincerely appreciate your trust and support. The patient has been evaluated, and treatment has been started. We look forward to working together to achieve the best outcome for the patient.

Warm regards,
Dr. Rashmita Karvir-Kekre (PT)
Health 360 Physiotherapy & Craniosacral Therapy Clinic`,
  },

  APPOINTMENT_BOOKING_CONFIRMATION: {
    name: 'appointment_booking_confirmation',
    formatText: (patientName: string, date: string, time: string) => `Hello ${patientName},

Thank you for booking your appointment with Health 360 Physiotherapy & Craniosacral Therapy Clinic. Your session is confirmed for:

📅 ${date}
⏰ ${time}

📍 Address: Shop no.1 & 2, Amardeep society, Om Nagar, Vasai West.
📍 Google Maps: https://maps.app.goo.gl/VpvTzGtZy3kCZZWGA

We look forward to seeing you. Please reply to this message if you need any assistance or need to reschedule.

Warm regards,
Team Health 360`,
  },

  NEXT_APPOINTMENT: {
    name: 'next_appointment_reminder',
    formatText: (patientName: string, date: string, time: string) => `Hello ${patientName},

Thank you for your visit today. Your next physiotherapy session is scheduled for:

📅 ${date}
⏰ ${time}

We look forward to seeing you. Please reply to this message if you need to reschedule.

Team Health 360`,
  },

  MISSED_APPOINTMENT: {
    name: 'missed_appointment_notice',
    formatText: (patientName: string) => `Hello ${patientName},

We missed seeing you at your appointment today. To continue your recovery and maintain your progress, please let us know a suitable time to reschedule your session.

We look forward to assisting you.

Team Health 360`,
  },

  GOOGLE_REVIEW: {
    name: 'google_review_request',
    formatText: (patientName: string, reviewUrl: string = 'https://g.page/r/CSdQGRuzUnLrEAE/review') => `Hello ${patientName},

Thank you for visiting Health 360 Physiotherapy & Craniosacral Therapy Clinic.

We would love to know about your recovery journey! Please take a quick moment to share your review on our Google profile:
${reviewUrl}

Your feedback helps others find the right care.

Warm regards,
Dr. Rashmita Karvir-Kekre (PT)
Health 360 Clinic`,
  },

  MEDICLAIM_CERTIFICATE: {
    name: 'mediclaim_certificate_notice',
    formatText: (patientName: string, diagnosis: string, startDate: string, endDate: string, sessions: string, totalAmount: string) => `Hello ${patientName},

Your Physiotherapy Treatment & Mediclaim Certificate from Health 360 Clinic is ready:

• Diagnosis: ${diagnosis}
• Treatment Period: ${startDate} to ${endDate}
• Total Sessions Attended: ${sessions}
• Total Amount Paid: ₹${totalAmount}

Please let us know if you or your insurance provider need any additional details.

Warm regards,
Dr. Rashmita Karvir-Kekre (PT)
Health 360 Clinic`,
  },

  FITNESS_CERTIFICATE: {
    name: 'fitness_certificate_notice',
    formatText: (patientName: string, assessmentDate: string, fitnessStatus: string, remarks: string) => `Hello ${patientName},

Based on your clinical evaluation at Health 360 Clinic on ${assessmentDate}, you are certified:

✅ ${fitnessStatus}

Physiotherapist Advice:
${remarks}

Keep up the great progress and continue your home routine!

Warm regards,
Dr. Rashmita Karvir-Kekre (PT)
Health 360 Clinic`,
  },

  MEDICAL_REST: {
    name: 'medical_rest_notice',
    formatText: (patientName: string, diagnosis: string, startDate: string, endDate: string, reviewDate: string) => `Hello ${patientName},

Following your clinical assessment at Health 360 Clinic, you have been advised medical rest to support your recovery for ${diagnosis}.

• Recommended Rest: ${startDate} to ${endDate}
• Next Review Date: ${reviewDate}

Please avoid strenuous activities and continue your prescribed rehabilitation.

Wishing you a speedy recovery,
Dr. Rashmita Karvir-Kekre (PT)
Health 360 Clinic`,
  },

  DISCHARGE_SUMMARY: {
    name: 'patient_discharge_summary',
    formatText: (patientName: string, startDate: string, endDate: string, sessions: string, outcome: string, homeAdvice: string) => `Congratulations ${patientName}! 🎉

You have successfully completed your physiotherapy program at Health 360 Clinic.

• Treatment Period: ${startDate} to ${endDate}
• Total Sessions: ${sessions}
• Recovery Outcome: ${outcome}
• Home Exercise Advice: ${homeAdvice}

Thank you for trusting us with your recovery. Feel free to reach out whenever you need guidance!

Warm regards,
Dr. Rashmita Karvir-Kekre (PT)
Health 360 Clinic`,
  },

  CLINIC_WELCOME: {
    name: 'welcome_clinic_info',
    formatText: (patientName: string) => `🌿 Welcome to Health360 Physiotherapy & Craniosacral Therapy Clinic! 🌿

Dear ${patientName},

Thank you for choosing Health360 Physiotherapy & Craniosacral Therapy Clinic. We are committed to helping you recover, move better, and live pain-free.

📍 Address:
Health360 Physiotherapy & Craniosacral Therapy Clinic, Shop no.1 & 2, Amardeep society, 
Om Nagar, Vasai West. 

🕙 Clinic Timings:
Morning: 10:00 AM – 2:00 PM
Evening: 5:00 PM – 9:00 PM

📍 Google Location:
https://maps.app.goo.gl/VpvTzGtZy3kCZZWGA?g_st=iw

For appointments or any assistance, feel free to contact us. We look forward to being a part of your recovery journey.
☎️: 8482812859 / 9834848981
✉️: health360vasai@gmail.com

Wishing you good health! 🌸
Team Health360 Physiotherapy & Craniosacral Therapy Clinic`,
  },
};

/**
 * Client-side WhatsApp sender that dispatches via CRM /api/whatsapp route
 */
export async function sendWhatsAppNotification({
  phone,
  templateName,
  params = [],
  message,
}: {
  phone: string;
  templateName?: string;
  params?: string[];
  message?: string;
}) {
  try {
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, templateName, params, message }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Failed to send WhatsApp notification:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Server-side direct dispatcher using Meta Cloud API with fallback
 */
export async function sendWhatsAppMessageDirect({
  phone,
  templateName,
  params = [],
  message,
}: {
  phone: string;
  templateName?: string;
  params?: string[];
  message?: string;
}) {
  try {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

    const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      console.warn('WhatsApp API credentials missing in environment.');
      return { success: false, error: 'Missing WhatsApp credentials' };
    }

    let payload: any;
    if (templateName) {
      payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: params.length > 0 ? [
            {
              type: 'body',
              parameters: params.map((p: any) => ({ type: 'text', text: String(p) }))
            }
          ] : []
        }
      };
    } else {
      payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: message || 'Hello from Health 360 Clinic.' }
      };
    }

    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    return { success: res.ok, data };
  } catch (err: any) {
    console.error('Direct WhatsApp dispatch error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate formatted text for a clinical bill / invoice receipt
 */
export function generateBillWhatsAppText({
  patientName,
  invoiceNumber,
  issueDate,
  lines,
  total,
  amountPaid,
  balanceDue,
  paymentMode,
}: {
  patientName: string;
  invoiceNumber: string;
  issueDate?: string;
  lines?: { description: string; quantity?: number; lineTotal?: number }[];
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentMode?: string | null;
}) {
  const itemsText = lines && lines.length > 0
    ? lines.map(l => `• ${l.description}${l.quantity && l.quantity > 1 ? ` (${l.quantity}x)` : ''}`).join('\n')
    : '• Physiotherapy Clinical Services';

  const isPaid = balanceDue <= 0 && amountPaid > 0;
  const statusStr = isPaid ? '✅ Paid in Full' : amountPaid > 0 ? '⚠️ Partial Payment' : '⏳ Payment Due';

  return `🏥 *Health 360 Physiotherapy & Craniosacral Clinic*
*Official Payment Receipt & Bill*

Dear *${patientName}*,

Thank you for choosing Health 360 Clinic. Here are your official billing details:

📄 *Receipt / Invoice No:* ${invoiceNumber}
📅 *Date:* ${issueDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
💳 *Payment Mode:* ${paymentMode || 'UPI / Online'}
📊 *Status:* ${statusStr}

🩺 *Services & Treatments:*
${itemsText}

💰 *Total Amount:* ₹${total.toLocaleString('en-IN')}
💵 *Amount Paid:* ₹${amountPaid.toLocaleString('en-IN')}
${balanceDue > 0 ? `⚠️ *Balance Due:* ₹${balanceDue.toLocaleString('en-IN')}\n` : ''}
📍 *Clinic Address:*
Shop No.1 & 2, Amardeep Society, Om Nagar, Vasai (West), Dist. Palghar - 401202
☎️ *Contact:* +91 8482812859 / 9834848981
✉️ *Email:* health360vasai@gmail.com

Wishing you a speedy, healthy, and pain-free recovery!
*Dr. Rashmita Karvir-Kekre (PT)*
Team Health 360`;
}

/**
 * Quick send bill / invoice receipt to patient on WhatsApp
 */
export function openWhatsAppBill({
  phone,
  ...details
}: {
  phone: string;
  patientName: string;
  invoiceNumber: string;
  issueDate?: string;
  lines?: { description: string; quantity?: number; lineTotal?: number }[];
  total: number;
  amountPaid: number;
  balanceDue: number;
  paymentMode?: string | null;
}) {
  const text = generateBillWhatsAppText(details);
  
  // Try sending via background CRM API as well
  try {
    fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message: text }),
    }).catch(() => {});
  } catch (e) {}

  // Format phone with India 91 prefix
  const cleanDigits = (phone || '').replace(/\D/g, '');
  const targetPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;

  const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
