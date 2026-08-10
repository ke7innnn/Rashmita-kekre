'use client';

import React, { useEffect, useState, use } from 'react';

export default function AssessmentPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [assessment, setAssessment] = useState<any>(null);

  useEffect(() => {
    fetchAssessment();
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

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white text-black font-sans selection:bg-gray-200">
      {/* Clinic Letterhead */}
      <div className="flex justify-between items-start border-b border-black/20 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">Health 360</h1>
          <p className="text-xs text-black/70">Physiotherapy and Craniosacral Therapy Clinic</p>
          <p className="text-xs text-black/60 pt-1">
            Dr. Rashmita Karvir Kekre · B.PTh.(M.I.A.P.) · BCST
          </p>
          <p className="text-xs text-black/60">
            Shop No.1, Amardeep Society, Om Nagar, Vasai (W). Phone: 8482812859
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-widest block text-black/60">
            {assessment.type} ASSESSMENT
          </span>
          <div className="text-sm font-bold text-black font-mono">
            Date: {new Date(assessment.assessmentDate).toLocaleDateString()}
          </div>
          <div className="text-xs text-black/60 font-mono">Status: {assessment.status}</div>
        </div>
      </div>

      {/* Patient Profile */}
      <div className="border border-gray-300 rounded-lg p-4 mb-6 space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-1">
          1. Patient Profile
        </h2>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div><strong>Name:</strong> {assessment.patient?.fullName}</div>
          <div><strong>Phone:</strong> {assessment.patient?.phone}</div>
          <div><strong>Occupation:</strong> {assessment.occupation || 'N/A'}</div>
          <div><strong>DOB / Gender:</strong> {new Date(assessment.patient?.dateOfBirth).toLocaleDateString()} ({assessment.patient?.gender})</div>
          <div><strong>Provisional Diagnosis:</strong> {assessment.provisionalDiagnosis || 'N/A'}</div>
          <div><strong>Referral Source:</strong> {assessment.referralSource?.name || 'Self / Direct'}</div>
        </div>
      </div>

      {/* Subjective */}
      <div className="border border-gray-300 rounded-lg p-4 mb-6 space-y-2 text-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-1">
          2. Subjective Profile
        </h2>
        <p><strong>Chief Complaint:</strong> "{assessment.chiefComplaint || 'None'}"</p>
        <div className="grid grid-cols-4 gap-2 pt-1 font-mono">
          <div>Rest VAS: {assessment.vasRest ?? '—'}/10</div>
          <div>Activity VAS: {assessment.vasActivity ?? '—'}/10</div>
          <div>Best VAS: {assessment.vasBest ?? '—'}/10</div>
          <div>Worst VAS: {assessment.vasWorst ?? '—'}/10</div>
        </div>
      </div>

      {/* Objective Mobility & Strength */}
      <div className="border border-gray-300 rounded-lg p-4 mb-6 space-y-2 text-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-1">
          3. Mobility & Strength (ROM / MMT)
        </h2>
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="py-1">Movement</th>
              <th className="py-1">AROM R / L</th>
              <th className="py-1">PROM R / L</th>
              <th className="py-1">MMT R / L</th>
            </tr>
          </thead>
          <tbody>
            {assessment.romMeasurements.map((r: any) => (
              <tr key={r.id} className="border-b border-gray-100">
                <td className="py-1 font-sans font-semibold">{r.region} - {r.movement}</td>
                <td className="py-1">{r.aromRight ?? '—'}° / {r.aromLeft ?? '—'}°</td>
                <td className="py-1">{r.promRight ?? '—'}° / {r.promLeft ?? '—'}°</td>
                <td className="py-1">{r.mmtRight ?? '—'} / {r.mmtLeft ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Special Tests */}
      <div className="border border-gray-300 rounded-lg p-4 mb-6 space-y-2 text-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-1">
          4. Special Tests
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {assessment.specialTestResults.map((t: any) => (
            <div key={t.id} className="border-b border-gray-100 py-1">
              <strong>{t.testName} ({t.side}):</strong> {t.result} {t.note ? `— ${t.note}` : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Assessment Scales */}
      {assessment.scalesJson && (() => {
        let scalesList: any[] = [];
        try {
          scalesList = JSON.parse(assessment.scalesJson);
        } catch(e) {}

        if (scalesList.length === 0) return null;

        return (
          <div className="border border-gray-300 rounded-lg p-4 mb-6 space-y-2 text-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-gray-200 pb-1">
              5. Standardized Assessment Scales
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {scalesList.map((scale: any) => (
                <div key={scale.scaleId} className="border-b border-gray-100 py-1 space-y-0.5">
                  <div><strong>{scale.name}:</strong> <span className="font-mono font-bold text-gray-800">{scale.score}{scale.maxScore ? `/${scale.maxScore}` : ''}{scale.percent !== undefined ? ` (${scale.percent}%)` : ''}</span></div>
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

      {/* Signature line */}
      <div className="flex justify-between items-end pt-12 text-xs">
        <div>
          <p className="text-gray-500">Patient Signature: _______________________</p>
        </div>
        <div className="text-right space-y-1">
          <p className="font-bold">Dr. Rashmita Karvir-Kekre (PT)</p>
          <p className="text-gray-500">Physiotherapist Signature & Stamp</p>
        </div>
      </div>
    </div>
  );
}
