import { prisma } from '@/lib/db';

export interface MicroContextResult {
  domain: string;
  entities: string[];
  denseChunk: string;
  tokenEstimate: number;
}

/**
 * Intent-Routed Real-Time Semantic Micro-Chunking Engine
 * Pinpoint-extracts ONLY the minimal relevant slice of data for the user's specific query.
 * Keeps input tokens ultra-compact (~30-100 tokens) for lowest API cost and ultra-fast responses.
 */
export async function extractMicroContext(query: string): Promise<MicroContextResult> {
  const q = query.toLowerCase().trim();
  const entities: string[] = [];
  let domain = 'GENERAL';
  let denseChunk = '';

  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

  try {
    // ─── 1. PATIENT SPECIFIC QUERIES ───
    const allPatients = await prisma.patient.findMany({
      select: { id: true, fullName: true },
      take: 100
    });

    const matchedPatient = allPatients.find(p => 
      p.fullName && p.fullName.split(' ').some(part => part.length >= 3 && q.includes(part.toLowerCase()))
    );

    if (matchedPatient) {
      domain = 'PATIENT_PROFILE';
      entities.push(matchedPatient.fullName);

      const p = await prisma.patient.findUnique({
        where: { id: matchedPatient.id },
        select: {
          fullName: true,
          phone: true,
          gender: true,
          dateOfBirth: true,
          treatmentModalityAssigned: true,
          referringDoctor: true,
          notes: true,
          patientPackages: {
            where: { status: 'ACTIVE' },
            include: { plan: { select: { name: true } } },
            take: 1
          },
          invoices: {
            select: { invoiceNumber: true, status: true, totalAmount: true, paidAmount: true },
            orderBy: { createdAt: 'desc' },
            take: 2
          },
          assessments: {
            select: { ptDiagnosis: true, vasRest: true, vasActivity: true, assessmentDate: true },
            orderBy: { assessmentDate: 'desc' },
            take: 1
          }
        }
      });

      if (p) {
        const age = p.dateOfBirth ? `${new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()}y` : 'N/A';
        const pkg = p.patientPackages[0] ? `${p.patientPackages[0].plan?.name || 'Package'}(${p.patientPackages[0].sessionsUsed}/${p.patientPackages[0].daysPurchased} used)` : 'No active package';
        const inv = p.invoices.map(i => `${i.invoiceNumber}:₹${i.totalAmount}(${i.status})`).join('; ') || 'No invoices';
        const assess = p.assessments[0] ? `Diag:${p.assessments[0].ptDiagnosis || 'N/A'},VAS:${p.assessments[0].vasRest ?? '—'}/10` : 'No assessment';

        denseChunk = `[PATIENT: ${p.fullName} | Ph: ${p.phone} | Age: ${age} | Modality: ${p.treatmentModalityAssigned || 'N/A'} | RefDoc: ${p.referringDoctor || 'Self'} | Course: ${pkg} | Clinical: ${assess} | Invoices: ${inv}]`;
      }
    }

    // ─── 2. INVOICE / BILLING SPECIFIC QUERIES ───
    else if (q.includes('invoice') || q.includes('bill') || q.includes('unpaid') || q.includes('paid') || q.includes('outstanding') || q.includes('revenue') || q.includes('collected') || q.includes('balance') || q.includes('pending')) {
      domain = 'BILLING';

      // Check if specific invoice number is mentioned (e.g., INV-2026-0001)
      const invMatch = q.match(/inv-?\d{4}-?\d{3,5}/i);
      if (invMatch) {
        const found = await prisma.invoice.findFirst({
          where: {
            invoiceNumber: { contains: invMatch[0], mode: 'insensitive' }
          },
          include: { patient: { select: { fullName: true, phone: true } } }
        });

        if (found) {
          entities.push(found.invoiceNumber);
          denseChunk = `[INVOICE: ${found.invoiceNumber} | Patient: ${found.patient?.fullName} | Total: ₹${found.totalAmount} | Paid: ₹${found.paidAmount} | Status: ${found.status} | Date: ${new Date(found.createdAt).toLocaleDateString('en-IN')}]`;
        }
      }

      if (!denseChunk) {
        // Aggregate live billing metrics
        const allInvoices = await prisma.invoice.findMany({
          select: { status: true, totalAmount: true, paidAmount: true, invoiceNumber: true, patient: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20
        });

        const pending = allInvoices.filter(i => i.status === 'PENDING' || i.status === 'PARTIALLY_PAID');
        const paid = allInvoices.filter(i => i.status === 'PAID');
        const totalOutstanding = pending.reduce((sum, i) => sum + (Number(i.totalAmount) - Number(i.paidAmount)), 0);
        const totalPaidMonth = paid.reduce((sum, i) => sum + Number(i.paidAmount), 0);

        const unpaidSample = pending.slice(0, 4).map(i => `${i.invoiceNumber}(${i.patient?.fullName}):₹${Number(i.totalAmount) - Number(i.paidAmount)}`).join(', ');

        denseChunk = `[BILLING_SUMMARY | Outstanding: ₹${totalOutstanding} across ${pending.length} invoices | MonthCollected: ₹${totalPaidMonth} | UnpaidInvoices: ${unpaidSample || 'None'}]`;
      }
    }

    // ─── 3. APPOINTMENTS & SCHEDULE QUERIES ───
    else if (q.includes('appointment') || q.includes('schedule') || q.includes('today') || q.includes('next') || q.includes('slot') || q.includes('upcoming') || q.includes('booked') || q.includes('session')) {
      domain = 'APPOINTMENTS';

      const todayApps = await prisma.appointment.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay }
        },
        include: {
          patient: { select: { fullName: true, phone: true } }
        },
        orderBy: { startTime: 'asc' }
      });

      const scheduled = todayApps.filter(a => a.status === 'SCHEDULED');
      const waiting = todayApps.filter(a => a.status === 'WAITING');
      const inProgress = todayApps.filter(a => a.status === 'IN_PROGRESS');
      const completed = todayApps.filter(a => a.status === 'COMPLETED');

      const nextApp = scheduled[0] || inProgress[0];
      const nextStr = nextApp ? `Next: ${nextApp.patient?.fullName} at ${nextApp.startTime} (${nextApp.treatmentType})` : 'No more scheduled sessions today';

      const appList = todayApps.slice(0, 5).map(a => `${a.startTime}-${a.patient?.fullName}(${a.status})`).join(', ');

      denseChunk = `[APPOINTMENTS_TODAY | Total: ${todayApps.length} | Completed: ${completed.length} | InProgress: ${inProgress.length} | Waiting: ${waiting.length} | Scheduled: ${scheduled.length} | ${nextStr} | Slots: ${appList || 'Empty'}]`;
    }

    // ─── 4. WAITLIST QUERIES ───
    else if (q.includes('waitlist') || q.includes('queue') || q.includes('waiting list')) {
      domain = 'WAITLIST';

      const waitlist = await prisma.waitlist.findMany({
        where: { status: 'WAITING' },
        include: { patient: { select: { fullName: true, phone: true } } },
        orderBy: { createdAt: 'asc' }
      });

      const waitListStr = waitlist.map(w => `${w.patient?.fullName || 'Anonymous'}(Modality: ${w.desiredTreatmentType}, Time: ${w.preferredTimeWindow})`).join('; ');

      denseChunk = `[WAITLIST | Count: ${waitlist.length} | Candidates: ${waitListStr || 'None'}]`;
    }

    // ─── 5. STAFF & ATTENDANCE QUERIES ───
    else if (q.includes('staff') || q.includes('attendance') || q.includes('clock') || q.includes('doctor') || q.includes('employee')) {
      domain = 'STAFF';

      const activeAttendance = await prisma.staffAttendance.findMany({
        where: { clockOutAt: null },
        include: { user: { select: { fullName: true, username: true, role: true } } }
      });

      const allStaff = await prisma.user.findMany({
        select: { fullName: true, username: true, role: true, designation: true },
        take: 10
      });

      const clockedIn = activeAttendance.map(a => a.user?.fullName || a.user?.username).filter(Boolean).join(', ');
      const staffList = allStaff.map(s => `${s.fullName || s.username}(${s.designation || s.role})`).join(', ');

      denseChunk = `[STAFF_INFO | ClockedInNow: ${clockedIn || 'None'} | RegisteredStaff: ${staffList}]`;
    }

    // ─── 6. CLINICAL & PHYSIOTHERAPY / BCST QUERIES ───
    else if (q.includes('craniosacral') || q.includes('bcst') || q.includes('cst') || q.includes('pain') || q.includes('stress') || q.includes('physio') || q.includes('exercise') || q.includes('rehab') || q.includes('disc') || q.includes('sciatica') || q.includes('knee') || q.includes('shoulder') || q.includes('spine') || q.includes('posture')) {
      domain = 'CLINICAL_GUIDANCE';
      denseChunk = `[CLINICAL_EXPERT_SYSTEM | Clinic: Health 360 | Specialist: Dr. Rashmita Karvir-Kekre (B.PTh, BCST) | Modalities: Biodynamic Craniosacral Therapy, Orthopedic Physiotherapy, Neuro-Rehab, Myofascial Release, Polyvagal ANS Regulation]`;
    }

    // ─── 7. GENERAL CLINIC OVERVIEW ───
    else {
      domain = 'CLINIC_OVERVIEW';

      const [patientCount, activePackageCount, unpaidInvCount] = await Promise.all([
        prisma.patient.count(),
        prisma.patientPackage.count({ where: { status: 'ACTIVE' } }),
        prisma.invoice.count({ where: { status: 'PENDING' } })
      ]);

      denseChunk = `[CLINIC_SUMMARY | Health 360 Clinic (Dr. Rashmita Karvir Kekre, B.PTh.) | Vasai West | TotalPatients: ${patientCount} | ActiveCourses: ${activePackageCount} | UnpaidInvoices: ${unpaidInvCount} | Phone: 8482812859]`;
    }

  } catch (err: any) {
    console.error('Error generating micro context:', err);
    denseChunk = `[CLINIC_METADATA | Health 360 Physiotherapy Clinic, Vasai West | Dr. Rashmita Karvir Kekre]`;
  }

  const tokenEstimate = Math.ceil(denseChunk.length / 4);

  return {
    domain,
    entities,
    denseChunk,
    tokenEstimate
  };
}

/**
 * Fallback deterministic synthesis when OpenRouter is unreachable or API key not configured
 */
export function generateDeterministicResponse(query: string, microContext: MicroContextResult): string {
  const { domain, denseChunk } = microContext;
  const raw = denseChunk.replace(/[\[\]]/g, '');
  const parts = raw.split(' | ');
  const q = query.toLowerCase();

  if (domain === 'CLINICAL_GUIDANCE' || q.includes('craniosacral') || q.includes('bcst') || q.includes('cst') || q.includes('pain') || q.includes('stress')) {
    if (q.includes('craniosacral') || q.includes('bcst') || q.includes('cst') || q.includes('stress')) {
      return `### Biodynamic Craniosacral Therapy (BCST) for Stress & Chronic Pain\n\n` +
             `Biodynamic Craniosacral Therapy (BCST) is a gentle, non-invasive hands-on therapy practiced at **Health 360 Clinic** by **Dr. Rashmita Karvir-Kekre** that works directly with the central nervous system and the body's natural self-regulatory mechanisms.\n\n` +
             `• **Autonomic Nervous System Regulation (Polyvagal Theory):**\n` +
             `  BCST helps downregulate a hyper-aroused sympathetic nervous system (fight-or-flight) and promotes ventral vagal parasympathetic activation, calming physiological stress, anxiety, and systemic inflammation.\n\n` +
             `• **Primary Respiration & Fascial Unwinding:**\n` +
             `  By tuning into the *Tide* and rhythmic micro-motion of cerebrospinal fluid and dural membranes, BCST releases deep seated myofascial tension and emotional strain held in tissues.\n\n` +
             `• **Breaking the Chronic Pain Cycle:**\n` +
             `  Chronic pain often involves central sensitization where pain pathways remain overactive. BCST creates a state of deep stillness (dynamic stillness), allowing neural pathways to reset and pain threshold to normalize.\n\n` +
             `• **Clinical Indications at Health 360:**\n` +
             `  - Chronic Neck & Lower Back Pain\n` +
             `  - Stress, Anxiety & Sleep Disturbances\n` +
             `  - Fibromyalgia & Myofascial Pain Syndrome\n` +
             `  - Migraines & TMJ Dysfunction\n` +
             `  - Post-traumatic strain & recovery`;
    }
  }

  if (domain === 'PATIENT_PROFILE') {
    return `Patient Summary:\n\n` +
           parts.map(item => `• **${item.split(': ')[0]}**: ${item.split(': ').slice(1).join(': ') || item}`).join('\n');
  }

  if (domain === 'BILLING') {
    return `Billing Overview:\n\n` +
           parts.map(item => `• ${item}`).join('\n');
  }

  if (domain === 'APPOINTMENTS') {
    return `Today's Appointments:\n\n` +
           parts.map(item => `• ${item}`).join('\n');
  }

  if (domain === 'WAITLIST') {
    return `Active Waitlist:\n\n` +
           parts.map(item => `• ${item}`).join('\n');
  }

  if (domain === 'STAFF') {
    return `Staff & Attendance:\n\n` +
           parts.map(item => `• ${item}`).join('\n');
  }

  return `Health 360 Assistant (Dr. Rashmita Karvir Kekre Clinic)\n\n` +
         `You can ask me about:\n` +
         `• **Clinical Physiotherapy & BCST**: Treatment protocols, exercise prescriptions, chronic pain & CST mechanisms\n` +
         `• **Patients**: Search case files, contact numbers, active courses\n` +
         `• **Appointments**: Today's live slots and next check-ins\n` +
         `• **Billing**: Invoices, pending balances, recorded payments`;
}
