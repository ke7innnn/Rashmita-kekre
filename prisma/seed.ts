import 'dotenv/config';
import { PrismaClient, AppointmentStatus, AppointmentSource, CallDirection, CallOutcome } from '@prisma/client';
import crypto from 'crypto';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: './dev.db' });
const prisma = new PrismaClient({ adapter });

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const treatmentModalities = [
  // Orthopedic Physiotherapy
  { name: 'Manual Therapy & Joint Mobilization', category: 'Orthopedic Physiotherapy', defaultDuration: 30, description: 'Hands-on techniques to restore joint range of motion and reduce pain.' },
  { name: 'Dry Needling', category: 'Orthopedic Physiotherapy', defaultDuration: 30, description: 'Targeting trigger points to relieve deep muscle tension and spasm.' },
  { name: 'Kinesiology Taping', category: 'Orthopedic Physiotherapy', defaultDuration: 15, description: 'Elastic therapeutic tape to support muscles and joints, and reduce swelling.' },
  
  // Neurological Rehabilitation
  { name: 'Gait Training', category: 'Neurological Rehabilitation', defaultDuration: 45, description: 'Helping patients improve their walking pattern and independence after neurological events.' },
  { name: 'Balance & Vestibular Therapy', category: 'Neurological Rehabilitation', defaultDuration: 45, description: 'Exercises to improve stability and manage dizziness or vertigo.' },
  { name: 'Neuro-developmental Therapy (NDT)', category: 'Neurological Rehabilitation', defaultDuration: 60, description: 'Therapy focusing on sensory-motor recovery for stroke and brain injury patients.' },

  // Sports Physical Therapy
  { name: 'Sports Massage & Soft Tissue Release', category: 'Sports Physical Therapy', defaultDuration: 30, description: 'Manual release of muscle tightness to enhance athletic recovery.' },
  { name: 'Electrotherapy (IFT / TENS)', category: 'Sports Physical Therapy', defaultDuration: 20, description: 'Electrical stimulation to relieve localized pain and reduce muscle spasms.' },
  { name: 'Class IV Laser Therapy', category: 'Sports Physical Therapy', defaultDuration: 15, description: 'Advanced light-based therapy to accelerate cellular healing and tissue repair.' },

  // Pediatric Physical Therapy
  { name: 'Sensory Integration Therapy', category: 'Pediatric Physical Therapy', defaultDuration: 45, description: 'Helping children organize and respond to sensory information effectively.' },
  { name: 'Developmental Milestones Training', category: 'Pediatric Physical Therapy', defaultDuration: 45, description: 'Guiding infants and children through normal motor skill development.' },

  // Geriatric Physical Therapy
  { name: 'Fall Prevention & Balance Training', category: 'Geriatric Physical Therapy', defaultDuration: 30, description: 'Assessing risk factors and building strength/coordination for senior safety.' },
  { name: 'Strength & Conditioning for Seniors', category: 'Geriatric Physical Therapy', defaultDuration: 45, description: 'Tailored resistance exercises to combat muscle loss and maintain autonomy.' },

  // Cardiopulmonary Physical Therapy
  { name: 'Chest Physiotherapy & Drainage', category: 'Cardiopulmonary Physical Therapy', defaultDuration: 30, description: 'Techniques to clear secretions from airways and improve respiratory efficiency.' },
  { name: 'Breathing Retraining & Post-COVID Recovery', category: 'Cardiopulmonary Physical Therapy', defaultDuration: 30, description: 'Exercises to expand lung capacity and optimize breathing mechanics.' }
];

async function main() {
  console.log('Start seeding...');

  // 1. Clean database
  await prisma.user.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.waitlist.deleteMany();
  await prisma.sessionPackage.deleteMany();
  await prisma.treatmentProtocol.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.treatmentModality.deleteMany();
  await prisma.clinicSettings.deleteMany();

  // 2. Create Users
  const adminPassword = hashPassword('rashmita123');
  const receptionistPassword = hashPassword('receptionist123');

  await prisma.user.createMany({
    data: [
      { username: 'rashmita', password: adminPassword, role: 'admin' },
      { username: 'receptionist', password: receptionistPassword, role: 'receptionist' }
    ]
  });

  // 3. Create Clinic Settings
  await prisma.clinicSettings.create({
    data: {
      id: 'clinic_settings',
      name: 'Health 360 Physiotherapy Clinic',
      phone: '+919820098200',
      email: 'contact@health360physio.com',
      address: 'Shop No. 4, Sunrise Apartments, Carter Road, Bandra West, Mumbai, MH - 400050',
      primaryDoctor: 'Dr. Rashmita Karvir Kekre',
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
      slotDuration: 30,
      holidays: '2026-08-15, 2026-10-02, 2026-12-25'
    }
  });

  // 4. Create Treatment Modalities
  await prisma.treatmentModality.createMany({
    data: treatmentModalities
  });

  // 5. Create Treatment Protocols
  const protocol1 = await prisma.treatmentProtocol.create({
    data: {
      name: 'Frozen Shoulder Protocol',
      associatedDiagnosisTag: 'frozen shoulder',
      steps: 'Manual Therapy & Joint Mobilization, Electrotherapy (IFT / TENS), Class IV Laser Therapy',
      description: 'Standard 3-stage recovery protocol for adhesive capsulitis targeting pain relief, active mobilization, and home exercises.'
    }
  });

  const protocol2 = await prisma.treatmentProtocol.create({
    data: {
      name: 'Post-ACL Rehab Protocol',
      associatedDiagnosisTag: 'post-surgical',
      steps: 'Class IV Laser Therapy, Gait Training, Strength & Conditioning for Seniors',
      description: 'Multi-phased rehabilitation protocol to restore joint extension, improve quad activation, and gait stability.'
    }
  });

  // 6. Create Patients
  const patient1 = await prisma.patient.create({
    data: {
      fullName: 'Aarav Mehta',
      gender: 'Male',
      dateOfBirth: new Date('1992-04-12'),
      phone: '+919819198191',
      secondaryPhone: '+919819198192',
      address: 'Apt 402, Sea Breeze, Bandra West, Mumbai',
      referringDoctor: 'Dr. Nitin Shah (Orthopedic)',
      presentingComplaint: 'ACL Reconstruction rehab, post-surgery 4 weeks. Limited knee flexion (85 degrees), quad atrophy.',
      treatmentModalityAssigned: 'Class IV Laser Therapy',
      tags: 'post-surgical, sports injury',
      notes: 'Patient is highly motivated. Focus on improving knee extension and passive range of motion. Quad activation exercises daily.',
      expectedCadence: 'weekly',
      assignedProtocolId: protocol2.id,
      currentProtocolStep: 1,
      attachments: {
        create: [
          { name: 'MRI_Knee_Aarav.pdf', url: 'https://placeholder.com/mri_knee.pdf', fileType: 'pdf' },
          { name: 'discharge_summary.pdf', url: 'https://placeholder.com/discharge.pdf', fileType: 'pdf' }
        ]
      }
    }
  });

  const patient2 = await prisma.patient.create({
    data: {
      fullName: 'Meera Deshmukh',
      gender: 'Female',
      dateOfBirth: new Date('1958-09-24'),
      phone: '+919822298222',
      address: 'Flat 5, Rosewood CHS, Khar West, Mumbai',
      presentingComplaint: 'Chronic low back pain radiating to left leg (Sciatica L4-L5). Aggravated by prolonged sitting.',
      treatmentModalityAssigned: 'Manual Therapy & Joint Mobilization',
      tags: 'chronic',
      expectedCadence: 'biweekly',
      notes: 'Initial evaluation showed core instability and tight hamstrings. Spinal mobilization L3-L5 provides immediate relief. Core strengthening plan assigned.'
    }
  });

  const patient3 = await prisma.patient.create({
    data: {
      fullName: 'Rohan Joshi',
      gender: 'Male',
      dateOfBirth: new Date('2001-11-03'),
      phone: '+919833398333',
      address: '12, Juhu Tara Road, Juhu, Mumbai',
      referringDoctor: 'Self',
      presentingComplaint: 'Right shoulder impingement syndrome. Pain during overhead movements (abduction > 90 degrees).',
      treatmentModalityAssigned: 'Dry Needling',
      tags: 'sports injury',
      notes: 'Pain rating 7/10 initially. Dry needling applied to infraspinatus and supraspinatus. Scapular stabilization introduced.'
    }
  });

  const patient4 = await prisma.patient.create({
    data: {
      fullName: 'Kalyani Sen',
      gender: 'Female',
      dateOfBirth: new Date('1945-05-18'),
      phone: '+919844498444',
      address: '22 Ocean Drive, Bandra West, Mumbai',
      presentingComplaint: 'Post-stroke hemiparesis (left side), gait instability. High risk of falls.',
      treatmentModalityAssigned: 'Gait Training',
      tags: 'neurological, high fall risk',
      notes: 'Walks with a quad cane. Focus on weight-bearing on the left lower limb, increasing stance phase duration.'
    }
  });

  // 7. Seed Session Packages
  await prisma.sessionPackage.createMany({
    data: [
      {
        patientId: patient1.id,
        packageName: 'ACL Recovery Block',
        totalSessions: 10,
        sessionsUsed: 9, // Trigger warnings (9 >= 10 - 2)
        purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        patientId: patient2.id,
        packageName: 'Sciatica Core Package',
        totalSessions: 12,
        sessionsUsed: 4,
        purchaseDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  // 8. Create Appointments for Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatTodayDate = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const app1 = await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      date: formatTodayDate(today),
      startTime: '09:00',
      endTime: '09:30',
      status: AppointmentStatus.COMPLETED,
      treatmentType: 'Class IV Laser Therapy',
      assignedSlotDuration: 30,
      source: AppointmentSource.MANUAL_ADMIN,
      notes: 'Laser therapy session completed. Knee flexion improved to 90 degrees.',
      checkInTime: new Date(today.getTime() + 8 * 60 * 60 * 1000 + 45 * 60 * 1000), // 8:45 AM
      seenTime: new Date(today.getTime() + 9 * 60 * 60 * 1000) // 9:00 AM (15 min wait)
    }
  });

  const app2 = await prisma.appointment.create({
    data: {
      patientId: patient2.id,
      date: formatTodayDate(today),
      startTime: '09:30',
      endTime: '10:00',
      status: AppointmentStatus.IN_PROGRESS,
      treatmentType: 'Manual Therapy & Joint Mobilization',
      assignedSlotDuration: 30,
      source: AppointmentSource.WEBSITE,
      notes: 'Slightly delayed. Patient arrived at 9:35 AM.',
      checkInTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 35 * 60 * 1000), // 9:35 AM
      seenTime: new Date(today.getTime() + 9 * 60 * 60 * 1000 + 50 * 60 * 1000) // 9:50 AM (15 min wait)
    }
  });

  const app3 = await prisma.appointment.create({
    data: {
      patientId: patient3.id,
      date: formatTodayDate(today),
      startTime: '10:30',
      endTime: '11:00',
      status: AppointmentStatus.WAITING,
      treatmentType: 'Dry Needling',
      assignedSlotDuration: 30,
      source: AppointmentSource.PHONE_AI_AGENT,
      notes: 'Arrived early.',
      checkInTime: new Date(today.getTime() + 10 * 60 * 60 * 1000 + 15 * 60 * 1000) // 10:15 AM (currently waiting)
    }
  });

  const app4 = await prisma.appointment.create({
    data: {
      patientId: patient4.id,
      date: formatTodayDate(today),
      startTime: '11:30',
      endTime: '12:15',
      status: AppointmentStatus.SCHEDULED,
      treatmentType: 'Gait Training',
      assignedSlotDuration: 45,
      source: AppointmentSource.MANUAL_ADMIN,
      notes: 'Requires assistance getting out of the car.'
    }
  });

  // 9. Seed Feedback
  await prisma.feedback.create({
    data: {
      appointmentId: app1.id,
      patientId: patient1.id,
      rating: 5,
      comment: 'Dr. Rashmita is excellent! The knee laser therapy worked wonders and my pain is noticeably reduced.',
      submittedAt: new Date()
    }
  });

  // 10. Seed Waitlist
  await prisma.waitlist.createMany({
    data: [
      {
        patientId: patient4.id,
        desiredTreatmentType: 'Gait Training',
        preferredTimeWindow: 'MORNING',
        status: 'WAITING'
      },
      {
        patientId: patient3.id,
        desiredTreatmentType: 'Dry Needling',
        preferredTimeWindow: 'AFTERNOON',
        status: 'WAITING'
      }
    ]
  });

  // 11. Create Call Logs
  await prisma.callLog.createMany({
    data: [
      {
        patientId: patient3.id,
        direction: CallDirection.INBOUND,
        phoneNumber: '+919833398333',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        duration: 125,
        transcript: 'Agent: Hello, welcome to Health 360. How can I help you today? \n Rohan: Hi, I want to book an appointment with Dr. Rashmita. I have shoulder pain. \n Agent: Sure, we have a slot available today at 10:30 AM. Would you like to book that? \n Rohan: Yes, that works for me. \n Agent: Great, I have booked you for Dry Needling at 10:30 AM today.',
        summary: 'Patient Rohan Joshi called to book an appointment for shoulder pain. Booked for 10:30 AM today.',
        outcome: CallOutcome.BOOKED
      },
      {
        patientId: patient2.id,
        direction: CallDirection.OUTBOUND,
        phoneNumber: '+919822298222',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        duration: 84,
        transcript: 'Agent: Hello, Meera. I am calling from Health 360 to confirm your appointment scheduled for tomorrow at 9:30 AM. \n Meera: Yes, I will be there. Thank you. \n Agent: Excellent, we look forward to seeing you tomorrow at 9:30 AM.',
        summary: 'Outbound confirmation call. Patient confirmed attendance for tomorrow at 9:30 AM.',
        outcome: CallOutcome.FOLLOW_UP_NEEDED
      },
      {
        patientId: null,
        direction: CallDirection.INBOUND,
        phoneNumber: '+919999988888',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        duration: 210,
        transcript: 'Agent: Hello, welcome to Health 360. How can I help you today? \n Caller: Hi, do you offer treatment for pediatric cerebral palsy? \n Agent: Yes, we do offer Neuro-developmental Therapy and Pediatric physical therapy. However, Dr. Rashmita needs to evaluate the child first. \n Caller: Okay, how much does the initial evaluation cost? \n Agent: It is 1500 Rupees. I can check slots for you. \n Caller: I will discuss with my husband and call you back. \n Agent: No problem. Have a great day.',
        summary: 'Inquiry about pediatric physical therapy for cerebral palsy. Caller asked about pricing and evaluation process. Declined booking immediately, will consult family.',
        outcome: CallOutcome.FOLLOW_UP_NEEDED
      }
    ]
  });

  // 12. Seed Exercise Templates
  await prisma.exerciseTemplate.createMany({
    data: [
      { name: 'Scapular Wall Slides', defaultSets: '3', defaultReps: '10', defaultHoldTime: '3s', defaultFrequency: 'Twice daily' },
      { name: 'Knee Extension Quads Sets', defaultSets: '4', defaultReps: '12', defaultHoldTime: '5s', defaultFrequency: 'Three times daily' },
      { name: 'McKenzie Lumbar Extensions', defaultSets: '3', defaultReps: '10', defaultHoldTime: '2s', defaultFrequency: 'Every 2 hours' },
      { name: 'Cervical Isometrics', defaultSets: '3', defaultReps: '10', defaultHoldTime: '5s', defaultFrequency: 'Twice daily' }
    ]
  });

  // 13. Seed Handouts
  await prisma.handout.createMany({
    data: [
      { title: 'Frozen Shoulder Exercises PDF', url: 'https://www.health360.com/handouts/frozen_shoulder.pdf', fileType: 'pdf', category: 'Shoulder' },
      { title: 'ACL Rehab Protocols Video', url: 'https://www.health360.com/handouts/acl_rehab.mp4', fileType: 'video', category: 'Knee' },
      { title: 'McKenzie Back Care Guide', url: 'https://www.health360.com/handouts/back_pain.pdf', fileType: 'pdf', category: 'Spine' }
    ]
  });

  // 14. Seed Notifications
  await prisma.notification.createMany({
    data: [
      { title: 'New Web Booking', message: 'Karan Malhotra booked Dry Needling tomorrow at 2:30 PM.', type: 'BOOKING', isRead: false },
      { title: 'Appointment Cancelled', message: 'Meera Patel cancelled Knee Assessment for today.', type: 'CANCELLATION', isRead: false },
      { title: 'Rebooking Call Alert', message: 'Aarav Mehta flagged by AI Agent for outbound follow-up.', type: 'CALL_FOLLOWUP', isRead: false }
    ]
  });

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
