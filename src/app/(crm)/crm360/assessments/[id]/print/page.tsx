'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, Loader2, RotateCcw, AlertCircle } from 'lucide-react';

function AssessmentPrintContent() {
  const router = useRouter();
  const routeParams = useParams();
  const searchParams = useSearchParams();
  const id = (routeParams?.id as string) || '';
  const autoprint = searchParams.get('autoprint');

  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const printTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchAssessment();
    }
  }, [id]);

  const fetchAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${id}`);
      if (!res.ok) {
        throw new Error(`Unable to load assessment (HTTP ${res.status}). Please check credentials.`);
      }
      const data = await res.json();
      setAssessment(data);
    } catch (e: any) {
      console.error('Error loading assessment for print:', e);
      setError(e.message || 'Failed to load assessment details.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-print effect when ready
  useEffect(() => {
    if (!loading && assessment && !printTriggeredRef.current) {
      // If autoprint query is provided or directly loaded in print view
      const shouldAutoPrint = autoprint === '1' || autoprint === 'true' || autoprint === null;
      if (shouldAutoPrint) {
        printTriggeredRef.current = true;
        const timer = setTimeout(() => {
          window.print();
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, assessment, autoprint]);

  // Loading state (hidden when printing)
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 print:hidden">
        <Loader2 className="w-9 h-9 text-emerald-400 animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Preparing official clinical assessment...</p>
        <p className="text-xs text-neutral-400 mt-1">Formatting clinical charts, letterhead, and credentials</p>
      </div>
    );
  }

  // Error state (hidden when printing)
  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 print:hidden">
        <div className="bg-neutral-800/90 border border-rose-500/30 p-6 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Assessment Record Error</h3>
          <p className="text-xs text-neutral-300">{error || 'Assessment record could not be loaded.'}</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => fetchAssessment()}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safe data extraction
  let narrative: any = {};
  try {
    if (assessment.narrativeJson) {
      narrative = typeof assessment.narrativeJson === 'string'
        ? JSON.parse(assessment.narrativeJson)
        : assessment.narrativeJson;
    }
  } catch (e) {}

  let pmhData: any = {};
  try {
    if (assessment.pmh) {
      if (typeof assessment.pmh === 'string' && (assessment.pmh.startsWith('{') || assessment.pmh.startsWith('['))) {
        pmhData = JSON.parse(assessment.pmh);
      } else if (typeof assessment.pmh === 'object') {
        pmhData = assessment.pmh;
      } else {
        pmhData = { medicalHistory: assessment.pmh };
      }
    }
  } catch (e) {}

  const hpi = narrative.historyOfPresentIllness || '';
  const medHistory = narrative.medicalHistory ||
    (typeof pmhData.medicalHistory === 'string' ? pmhData.medicalHistory : '') ||
    (typeof assessment.pmh === 'string' && !assessment.pmh.startsWith('[') && !assessment.pmh.startsWith('{') ? assessment.pmh : '');

  const medTags: string[] = Array.isArray(narrative.medicalHistoryTags)
    ? narrative.medicalHistoryTags
    : (Array.isArray(pmhData.conditions) ? pmhData.conditions : (Array.isArray(pmhData) ? pmhData : []));

  const surgHistory = narrative.surgicalHistory || pmhData.surgicalHistory || '';
  const medRxHistory = narrative.medicineHistory || pmhData.medicineHistory || '';

  let painRegions: any[] = [];
  try {
    if (assessment.painSiteRegions) {
      const parsed = typeof assessment.painSiteRegions === 'string'
        ? JSON.parse(assessment.painSiteRegions)
        : assessment.painSiteRegions;
      if (Array.isArray(parsed)) painRegions = parsed;
    }
  } catch (e) {}

  const romList: any[] = Array.isArray(assessment.romMeasurements) ? assessment.romMeasurements : [];
  const specialTestsList: any[] = Array.isArray(assessment.specialTestResults)
    ? assessment.specialTestResults
    : (Array.isArray(assessment.specialTests) ? assessment.specialTests : []);
  const goalsList: any[] = Array.isArray(assessment.goals) ? assessment.goals : [];

  // Safe Chief Complaint & PT Diagnosis fallbacks
  const chiefComplaint = assessment.chiefComplaint || assessment.patient?.presentingComplaint || 'None recorded';
  const ptDiagnosis = assessment.ptDiagnosis || assessment.provisionalDiagnosis || assessment.patient?.diagnosis || 'Clinical evaluation pending';

  // Pain score calculation
  const painRest = assessment.vasRest ?? assessment.painScoreRest ?? '0';
  const painActivity = assessment.vasActivity ?? assessment.painScoreCurrent ?? '—';
  const painWorst = assessment.vasWorst ?? assessment.painScoreWorst ?? '—';

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white py-6 print:py-0 text-black font-sans">
      {/* Action Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-4 px-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-600 font-medium">Health 360 Official Digital Assessment</span>
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="p-8 max-w-4xl mx-auto bg-white text-black font-sans selection:bg-gray-200 print:p-0 shadow-lg print:shadow-none">
        
        {/* Clinic Letterhead with Official Health 360 Logo */}
        <div className="flex justify-between items-start border-b-2 border-black pb-5 mb-6">
          <div className="flex items-center gap-4">
            <img
              src="/logo/rklogo.png"
              alt="Health 360 Clinic Logo"
              className="w-16 h-16 object-contain shrink-0"
            />
            <div>
              <h1 className="text-2xl font-black text-black tracking-tight uppercase">Health 360</h1>
              <p className="text-xs font-bold text-black/80">Physiotherapy and Craniosacral Therapy Clinic</p>
              <p className="text-xs text-black/70 pt-0.5 font-medium">
                Dr. Rashmita Karvir Kekre · B.PTh.(M.I.A.P.) · BCST
              </p>
              <p className="text-[11px] text-black/60 font-medium">
                Shop No.1 &amp; 2, Amardeep Society, Om Nagar, Vasai (West) · Phone: +91 8482812859
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black uppercase tracking-widest block text-black">
              {assessment.type || 'CLINICAL'} ASSESSMENT
            </span>
            <span className="text-xs font-mono text-black/60 block pt-0.5">
              Ref: {(assessment.id || '').slice(0, 10)}
            </span>
            <span className="text-xs text-black/70 block pt-1 font-semibold">
              Date: {assessment.assessmentDate ? new Date(assessment.assessmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>

        {/* Section 1: Patient Demographics */}
        <div className="border border-black/30 rounded-lg p-3.5 mb-5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-neutral-50/50 print:bg-white print:border-black/50">
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-bold">Patient Name</span>
            <strong className="text-sm text-black">{assessment.patient?.fullName || 'N/A'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-bold">Gender / Age</span>
            <strong className="text-black">
              {assessment.patient?.gender || '—'} / {assessment.patient?.dateOfBirth ? `${new Date().getFullYear() - new Date(assessment.patient.dateOfBirth).getFullYear()} Yrs` : '—'}
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-bold">Contact Phone</span>
            <strong className="text-black">{assessment.patient?.phone || '—'}</strong>
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-bold">Occupation</span>
            <strong className="text-black">{assessment.occupation || 'Not specified'}</strong>
          </div>
        </div>

        {/* Section 2: Subjective Profile */}
        <div className="border border-black/20 rounded-lg p-4 mb-5 space-y-2.5 text-xs print:border-black/40">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black/20 pb-1 flex justify-between items-center">
            <span>1. Subjective Profile</span>
          </h2>
          <p>
            <strong className="text-black">Chief Complaint:</strong> "{chiefComplaint}"
          </p>
          
          {hpi && (
            <p><strong className="text-black">History of Present Illness (HPI):</strong> {hpi}</p>
          )}

          {medHistory && (
            <p><strong className="text-black">Past Medical History:</strong> {medHistory}</p>
          )}

          {medTags && medTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="font-bold text-black mr-1">Medical Conditions:</span>
              {medTags.map((t: any, idx: number) => (
                <span key={idx} className="bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded text-[10px] font-medium">
                  {typeof t === 'string' ? t : JSON.stringify(t)}
                </span>
              ))}
            </div>
          )}

          {surgHistory && (
            <p><strong className="text-black">Past Surgical History:</strong> {surgHistory}</p>
          )}

          {medRxHistory && (
            <p><strong className="text-black">Current Medications:</strong> {medRxHistory}</p>
          )}

          <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-neutral-200">
            <div>
              <strong className="text-black">Onset Date / Mechanism:</strong>{' '}
              {assessment.onsetDate ? new Date(assessment.onsetDate).toLocaleDateString('en-IN') : 'Gradual'}{' '}
              ({assessment.mechanismOfInjury || 'Not specified'})
            </div>
            <div>
              <strong className="text-black">Aggravating / Relieving:</strong>{' '}
              {assessment.aggravatingFactors || 'None specified'} / {assessment.easingFactors || 'Rest'}
            </div>
          </div>
        </div>

        {/* Section 3: Objective Assessment */}
        <div className="border border-black/20 rounded-lg p-4 mb-5 space-y-2.5 text-xs print:border-black/40">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black/20 pb-1">
            2. Objective Assessment
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <strong className="text-black">Pain Score (VAS / NPRS):</strong>{' '}
              Activity: {painActivity}/10 (Worst: {painWorst}/10, Rest: {painRest}/10)
            </div>
            <div>
              <strong className="text-black">Blood Pressure:</strong>{' '}
              {assessment.bpSystolic ? `${assessment.bpSystolic}/${assessment.bpDiastolic} mmHg` : 'Not recorded'}
            </div>
            <div>
              <strong className="text-black">Heart Rate / SpO2:</strong>{' '}
              {assessment.heartRate ? `${assessment.heartRate} bpm` : '—'} / {assessment.spo2 ? `${assessment.spo2}%` : '—'}
            </div>
          </div>
          <div>
            <strong className="text-black">Pain Nature &amp; Location:</strong>{' '}
            {assessment.painNature || 'N/A'} (Site: {assessment.painSite || 'N/A'})
          </div>
          {painRegions.length > 0 && (
            <div>
              <strong className="text-black">Mapped Pain Regions:</strong>{' '}
              {painRegions.map((r: any) => r.name || r.id || r).join(', ')}
            </div>
          )}
        </div>

        {/* Section 4: ROM & Special Orthopedic Tests */}
        <div className="border border-black/20 rounded-lg p-4 mb-5 space-y-3 text-xs print:border-black/40">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black/20 pb-1">
            3. Range of Motion &amp; Special Tests
          </h2>
          <div>
            <span className="font-bold text-black block pb-1">Range of Motion (ROM):</span>
            {romList.length === 0 ? (
              <p className="text-neutral-500 italic">No specific ROM measurements recorded</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {romList.map((m: any) => (
                  <div key={m.id || `${m.joint}-${m.movement}`} className="border-b border-neutral-200 py-1">
                    <strong>{m.joint} {m.movement} ({m.side}):</strong> {m.activeRomDegrees}° (Normal: {m.normalDegrees}°)
                    {m.painWithMovement && <span className="text-rose-600 font-bold ml-1">(!Pain)</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-neutral-200">
            <span className="font-bold text-black block pb-1">Special Clinical Orthopedic Tests:</span>
            {specialTestsList.length === 0 ? (
              <p className="text-neutral-500 italic">No special tests recorded</p>
            ) : (
              <div className="space-y-1">
                {specialTestsList.map((t: any) => (
                  <div key={t.id || t.testName} className="py-0.5 flex items-baseline justify-between border-b border-neutral-100">
                    <div>
                      <strong>{t.testName} ({t.side}):</strong> {t.note ? <span className="text-neutral-600 ml-1 italic">{t.note}</span> : ''}
                    </div>
                    <span className={`font-mono font-bold ${t.result === 'POSITIVE' ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {t.result}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Standardized Assessment Scales */}
        {assessment.scalesJson && (() => {
          let scalesList: any[] = [];
          try {
            const parsed = JSON.parse(assessment.scalesJson);
            if (Array.isArray(parsed)) scalesList = parsed;
          } catch (e) {}

          if (!scalesList || scalesList.length === 0) return null;

          return (
            <div className="border border-black/20 rounded-lg p-4 mb-5 space-y-2 text-xs print:border-black/40">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black/20 pb-1">
                4. Standardized Clinical Assessment Scales
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {scalesList.map((scale: any) => (
                  <div key={scale.scaleId || scale.name} className="border-b border-neutral-200 py-1 space-y-0.5">
                    <div>
                      <strong>{scale.name}:</strong>{' '}
                      <span className="font-bold text-black">
                        {scale.score}{scale.maxScore ? `/${scale.maxScore}` : ''}{scale.percent !== undefined ? ` (${scale.percent}%)` : ''}
                      </span>
                    </div>
                    {scale.interpretation && (
                      <div className="text-[10px] text-neutral-600">Interpretation: {scale.interpretation}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Section 6: PT Diagnosis & Goals */}
        <div className="border border-black/20 rounded-lg p-4 mb-6 space-y-2.5 text-xs print:border-black/40">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-black/20 pb-1">
            5. Clinical Assessment &amp; Treatment Goals
          </h2>
          <p><strong className="text-black">Clinical PT Diagnosis:</strong> {ptDiagnosis}</p>
          <p><strong className="text-black">Clinical Prognosis:</strong> {assessment.prognosis || 'GOOD'}</p>
          <div className="pt-2 border-t border-neutral-200">
            <strong className="text-black block mb-1">Functional Treatment Goals:</strong>
            {goalsList.length === 0 ? (
              <p className="text-neutral-500 italic">No specific goals recorded</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {goalsList.map((g: any) => (
                  <li key={g.id || g.text}>
                    <span className="font-semibold text-black">{g.text}</span>
                    {g.targetValue && <span className="text-neutral-600 ml-1">· Target: {g.targetValue}</span>}
                    {g.targetDate && (
                      <span className="text-neutral-500 ml-1">
                        · Target Date: {new Date(g.targetDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Doctor Signature Block */}
        <div className="flex justify-end pt-6 pb-2 text-xs">
          <div className="text-right space-y-1 inline-flex flex-col items-end">
            <img
              src="/signatures/dr-rashmita-signature.png"
              alt="Dr. Rashmita Karvir-Kekre Signature"
              className="h-16 w-auto object-contain max-w-[180px] -mb-1"
            />
            <div className="border-t-2 border-black pt-1.5 min-w-[240px] text-right">
              <p className="font-bold text-sm text-black">Dr. Rashmita Karvir-Kekre (PT)</p>
              <p className="text-[11px] text-black font-semibold">B.PTh.(M.I.A.P.) · BCST</p>
              <p className="text-[10px] text-black/70">Consultant Physiotherapist &amp; Craniosacral Therapist</p>
              <p className="text-[9px] text-black/50">Health 360 Clinic · Vasai (West)</p>
            </div>
          </div>
        </div>

      </div>

      {/* Print-specific style rules */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm 10mm 12mm;
        }
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function AssessmentPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 print:hidden">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
          <p className="text-xs text-neutral-400">Loading document...</p>
        </div>
      }
    >
      <AssessmentPrintContent />
    </Suspense>
  );
}
