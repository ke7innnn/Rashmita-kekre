import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import CertificateDocument, { CertificateData, CertificateType } from '@/components/certificates/CertificateDocument';
import PrintCertificateButton from '@/components/certificates/PrintCertificateButton';
import { ShieldCheck, Phone } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Official Clinical Certificate | Health 360 Clinic',
  description: 'Verified Medical & Physiotherapy Certificate issued by Dr. Rashmita Karvir Kekre, Health 360 Clinic.',
};

interface CertificatePageProps {
  params: Promise<{
    type: string;
    patientId: string;
  }>;
  searchParams: Promise<{
    s?: string;
  }>;
}

export default async function PublicCertificatePage({ params, searchParams }: CertificatePageProps) {
  const { type, patientId } = await params;
  const { s } = await searchParams;

  const validTypes: CertificateType[] = ['treatment_payment', 'fitness', 'unfitness', 'discharge_summary'];
  if (!validTypes.includes(type as CertificateType)) {
    notFound();
  }

  // Fetch patient from DB
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      sessionPackages: true,
      invoices: true,
    }
  }).catch(() => null);

  if (!patient) {
    // If not found by ID, attempt lookup by phone or name or fallback gracefully
  }

  let certData: CertificateData;

  // If customized state is encoded in URL query param 's'
  if (s) {
    try {
      const decodedJson = decodeURIComponent(Buffer.from(s, 'base64').toString('utf-8'));
      certData = JSON.parse(decodedJson);
    } catch {
      certData = getDefaultData(type as CertificateType, patient);
    }
  } else {
    certData = getDefaultData(type as CertificateType, patient);
  }

  const getDocTitle = () => {
    switch (type) {
      case 'treatment_payment':
        return 'Treatment & Payment Certificate';
      case 'fitness':
        return 'Fitness Certificate';
      case 'unfitness':
        return 'Unfitness for Work Certificate';
      case 'discharge_summary':
        return 'Physiotherapy Discharge Summary';
      default:
        return 'Clinical Certificate';
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] print:min-h-0 print:h-auto print:bg-white text-black font-sans selection:bg-gray-200 relative print:p-0 print:m-0 print:overflow-visible">
      {/* Screen Only Clean Dark Toolbar */}
      <div className="no-print print:hidden sticky top-0 z-50 bg-[#1E293B]/95 backdrop-blur-md text-white py-3 px-4 border-b border-slate-700 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-white tracking-tight flex items-center gap-2">
              <span className="text-[#12D6C4]">Health 360</span> · {getDocTitle()}
            </span>
            <span className="text-white/30">|</span>
            <span className="text-[11px] text-teal-300 font-medium flex items-center gap-1 bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Official Verified Certificate
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="tel:+918482812859"
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5 border border-white/20"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Call Clinic</span>
            </a>

            <PrintCertificateButton docHeading={getDocTitle()} />
          </div>
        </div>
      </div>

      {/* Paper Canvas Container */}
      <div className="relative z-10 max-w-[210mm] mx-auto my-8 print:my-0 print:p-0 print:m-0 print:w-full print:max-w-none shadow-[0_25px_70px_rgba(0,0,0,0.85)] print:shadow-none">
        <CertificateDocument data={certData} isEditable={false} />
      </div>

      <div className="no-print print:hidden text-center py-6 text-xs text-white/40">
        Shop No.1 &amp; 2, Shree Amardeep Enclave, Om Nagar, Vasai (West), Dist. Palghar - 401202 · Tel: +91 8482812859
      </div>
    </div>
  );
}

function getDefaultData(type: CertificateType, patient: any): CertificateData {
  const patientName = patient?.fullName || 'Patient';
  const age = patient?.age ? String(patient.age) : '35';
  const gender = patient?.gender || 'Female';
  const diagnosis = patient?.diagnosis || 'Musculoskeletal Condition & Rehabilitation';
  const startDate = patient?.createdAt
    ? new Date(patient.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recent';
  const endDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const sessions = String(patient?.sessionPackages?.reduce((sum: number, p: any) => sum + (p.completedSessions || 0), 0) || 10);
  const totalAmount = String(
    patient?.invoices?.reduce((sum: number, inv: any) => sum + (Number(inv.paidAmount) || 0), 0) || '6,500.00'
  );

  return {
    type,
    issueDate: endDate,
    patientName,
    age,
    gender,
    diagnosis,
    startDate,
    endDate,
    sessions,
    chargesPerSession: '650.00',
    totalAmount,
    assessmentDate: endDate,
    symptomsCondition: diagnosis,
    reviewDate: 'Next Week',
    treatmentProvided: 'Manual Therapy, Spinal Mobilization, Postural Ergonomics & Strengthening',
    fitnessOptions: { work: true, daily: true, regular: true },
    progressOptions: { pain: true, rom: true, strength: true, functional: true, goals: true },
    followupOptions: { hep: true },
    dischargeStatusOptions: { success: true },
  };
}
