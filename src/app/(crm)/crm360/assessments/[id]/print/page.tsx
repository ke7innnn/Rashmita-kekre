'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function AssessmentPrintPage() {
  const routeParams = useParams();
  const id = (routeParams?.id as string) || '';
  const [assessment, setAssessment] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchAssessment();
    }
  }, [id]);

  const fetchAssessment = async () => {
    try {
      const res = await fetch(`/api/assessments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
        setTimeout(() => window.print(), 500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!assessment) return null;

  let narrative: any = {};
  try {
    if (assessment.narrativeJson) {
      narrative = typeof assessment.narrativeJson === 'string' ? JSON.parse(assessment.narrativeJson) : assessment.narrativeJson;
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
  const medHistory = narrative.medicalHistory || pmhData.medicalHistory || (typeof assessment.pmh === 'string' && !assessment.pmh.startsWith('{') ? assessment.pmh : '');
  const medTags: string[] = Array.isArray(narrative.medicalHistoryTags) ? narrative.medicalHistoryTags : (Array.isArray(pmhData.conditions) ? pmhData.conditions : []);
  const surgHistory = narrative.surgicalHistory || pmhData.surgicalHistory || '';
  const medRxHistory = narrative.medicineHistory || pmhData.medicineHistory || '';

  let painRegions: any[] = [];
  try {
    if (assessment.painSiteRegions) {
      const parsed = typeof assessment.painSiteRegions === 'string' ? JSON.parse(assessment.painSiteRegions) : assessment.painSiteRegions;
      if (Array.isArray(parsed)) painRegions = parsed;
    }
  } catch (e) {}

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white py-6 print:py-0">
      {/* Action Bar (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-4 px-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => window.history.back()}
          className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 font-medium">Official Digital Clinical Assessment</span>
          <button
            onClick={() => window.print()}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto bg-white text-black font-sans selection:bg-gray-200 print:p-0 shadow-lg print:shadow-none">
        {/* Clinic Letterhead with Official Health 360 Logo */}
        <div className="flex justify-between items-start border-b border-black/20 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <img
              src="/logo/rklogo.png"
              alt="Health 360 Logo"
              className="w-16 h-16 object-contain shrink-0"
            />
            <div>
              <h1 className="text-2xl font-bold text-black tracking-tight">Health 360</h1>
              <p className="text-xs text-black/70 font-medium">Physiotherapy and Craniosacral Therapy Clinic</p>
              <p className="text-xs text-black/60 pt-0.5">
                Dr. Rashmita Karvir Kekre · B.PTh.(M.I.A.P.) · BCST
              </p>
              <p className="text-xs text-black/60">
                Shop No.1, Amardeep Society, Om Nagar, Vasai (W). Phone: 8482812859
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-widest block text-black/60">
              {assessment.type} ASSESSMENT
            </span>
            <span className="text-xs font-mono text-black/50 block">ID: {assessment.id.slice(0, 10)}</span>
            <span className="text-xs text-black/60 block pt-1">Date: {new Date(assessment.assessmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Patient demographics */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 text-xs grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] text-gray-500 uppercase block">Patient Name</span>
            <strong className="text-sm">{assessment.patient?.fullName}</strong>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase block">Gender / Age</span>
            <strong>{assessment.patient?.gender} / {assessment.patient?.dateOfBirth ? new Date().getFullYear() - new Date(assessment.patient.dateOfBirth).getFullYear() : '—'} Yrs</strong>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase block">Contact Phone</span>
            <strong>{assessment.patient?.phone}</strong>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase block">Occupation</span>
            <strong>{assessment.occupation || 'N/A'}</strong>
          </div>
        </div>

        {/* Subjective */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 space-y-3 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-1">
            2. Subjective Profile
          </h2>
          <p><strong>Chief Complaint:</strong> "{assessment.chiefComplaint || 'None'}"</p>
          
          {hpi && (
            <p><strong>History of Present Illness (HPI):</strong> {hpi}</p>
          )}

          {medHistory && (
            <p><strong>Past Medical History:</strong> {medHistory}</p>
          )}

          {medTags && medTags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="font-bold mr-1">Medical Conditions:</span>
              {medTags.map((t, idx) => (
                <span key={idx} className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[10px]">
                  {t}
                </span>
              ))}
            </div>
          )}

          {surgHistory && (
            <p><strong>Past Surgical History:</strong> {surgHistory}</p>
          )}

          {medRxHistory && (
            <p><strong>Current Medications:</strong> {medRxHistory}</p>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <strong>Onset Date / Mechanism:</strong> {assessment.onsetDate ? new Date(assessment.onsetDate).toLocaleDateString() : 'N/A'} ({assessment.mechanismOfInjury || 'Gradual'})
            </div>
            <div>
              <strong>Aggravating / Relieving:</strong> {assessment.aggravatingFactors || 'None'} / {assessment.easingFactors || 'Rest'}
            </div>
          </div>
        </div>

        {/* Objective: Pain & Vitals */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 space-y-3 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-1">
            3. Objective Assessment
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div><strong>Pain Score (NPRS):</strong> {assessment.painScoreCurrent}/10 (Worst: {assessment.painScoreWorst}/10)</div>
            <div><strong>Blood Pressure:</strong> {assessment.bpSystolic ? `${assessment.bpSystolic}/${assessment.bpDiastolic} mmHg` : 'Not recorded'}</div>
            <div><strong>Heart Rate / SpO2:</strong> {assessment.heartRate ? `${assessment.heartRate} bpm` : '—'} / {assessment.spo2 ? `${assessment.spo2}%` : '—'}</div>
          </div>
          <div>
            <strong>Pain Description:</strong> {assessment.painNature || 'N/A'} (Location: {assessment.painSite || 'N/A'})
          </div>
          {painRegions.length > 0 && (
            <div>
              <strong>Mapped Pain Regions:</strong> {painRegions.map(r => r.name || r.id).join(', ')}
            </div>
          )}
        </div>

        {/* ROM & Special Tests */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 space-y-3 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-1">
            4. ROM & Special Tests
          </h2>
          <div>
            <span className="font-bold block pb-1">Range of Motion:</span>
            {assessment.romMeasurements.length === 0 ? (
              <p className="text-gray-500 italic">No specific ROM recorded</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {assessment.romMeasurements.map((m: any) => (
                  <div key={m.id} className="border-b border-gray-100 py-1">
                    <strong>{m.joint} {m.movement} ({m.side}):</strong> {m.activeRomDegrees}° (Normal: {m.normalDegrees}°)
                    {m.painWithMovement && <span className="text-red-500 ml-1">(!Pain)</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <span className="font-bold block pb-1">Special Clinical Tests:</span>
            {assessment.specialTests.length === 0 ? (
              <p className="text-gray-500 italic">No special tests recorded</p>
            ) : (
              assessment.specialTests.map((t: any) => (
                <div key={t.id} className="py-0.5">
                  <strong>{t.testName} ({t.side}):</strong> {t.result} {t.note ? `— ${t.note}` : ''}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assessment Scales */}
        {assessment.scalesJson && (() => {
          let scalesList: any[] = [];
          try {
            const parsed = JSON.parse(assessment.scalesJson);
            if (Array.isArray(parsed)) scalesList = parsed;
          } catch(e) {}

          if (!scalesList || scalesList.length === 0) return null;

          return (
            <div className="border border-gray-300 rounded-lg p-4 mb-6 space-y-2 text-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-1">
                5. Standardized Assessment Scales
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {scalesList.map((scale: any) => (
                  <div key={scale.scaleId} className="border-b border-gray-100 py-1 space-y-0.5">
                    <div><strong>{scale.name}:</strong> <span className="font-serif font-bold text-gray-800">{scale.score}{scale.maxScore ? `/${scale.maxScore}` : ''}{scale.percent !== undefined ? ` (${scale.percent}%)` : ''}</span></div>
                    <div className="text-[10px] text-gray-500">Interpretation: {scale.interpretation}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* PT Diagnosis & Goals */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 space-y-2 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-1">
            6. Assessment & Goals
          </h2>
          <p><strong>PT Diagnosis:</strong> {assessment.ptDiagnosis || 'N/A'}</p>
          <p><strong>Prognosis:</strong> {assessment.prognosis || 'GOOD'}</p>
          <div className="pt-2">
            <strong>Treatment Goals:</strong>
            <ul className="list-disc pl-5 pt-1 space-y-1">
              {assessment.goals.map((g: any) => (
                <li key={g.id}>{g.text} (Target: {g.targetValue || 'Met'}, Date: {new Date(g.targetDate).toLocaleDateString()})</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Doctor Signature line */}
        <div className="flex justify-end pt-8 pb-4 text-xs">
          <div className="text-right space-y-1 inline-flex flex-col items-end">
            <img
              src="/signatures/dr-rashmita-signature.png"
              alt="Dr. Rashmita Karvir-Kekre Signature"
              className="h-16 w-auto object-contain max-w-[180px] -mb-1"
            />
            <div className="border-t border-black/40 pt-1.5 min-w-[220px] text-right">
              <p className="font-bold text-sm text-black">Dr. Rashmita Karvir-Kekre (PT)</p>
              <p className="text-[11px] text-black/75 font-medium">B.PTh.(M.I.A.P.) · BCST</p>
              <p className="text-[10px] text-black/50">Consultant Physiotherapist &amp; Craniosacral Therapist</p>
              <p className="text-[9px] text-black/40">Health 360 Clinic · Vasai (West)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
