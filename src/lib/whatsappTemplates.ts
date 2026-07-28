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
};

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
    return await res.json();
  } catch (err: any) {
    console.error('Failed to send WhatsApp notification:', err);
    return { success: false, error: err.message };
  }
}
