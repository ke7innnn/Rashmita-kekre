'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, Printer, Lock, ShieldAlert, Plus, Calendar, User, 
  Dumbbell, Target, CheckCircle2, History, Edit3, RefreshCw
} from 'lucide-react';

interface SelectedRegion {
  id: string;
  name: string;
  region: string;
  side: 'LEFT' | 'RIGHT' | 'BILATERAL';
}

export default function AssessmentDetailPage() {
  const routeParams = useParams();
  const id = (routeParams?.id as string) || '';
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [amendmentReason, setAmendmentReason] = useState('');
  const [amendmentText, setAmendmentText] = useState('');
  const [isAmending, setIsAmending] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAssessmentDetail();
    }
  }, [id]);

  const fetchAssessmentDetail = async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/assessments/${id}`);
      if (res.ok) {
        const data = await res.json();
        setAssessment(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || `Failed to load assessment (${res.status})`);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message || 'Network error while loading assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAmendment = async () => {
    if (!amendmentReason.trim()) return;
    try {
      const res = await fetch(`/api/assessments/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: amendmentReason,
          changesJson: { amendmentNote: amendmentText }
        })
      });
      if (res.ok) {
        setAmendmentReason('');
        setAmendmentText('');
        setIsAmending(false);
        fetchAssessmentDetail();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-white/5 animate-pulse rounded-lg" />
        <div className="h-96 bg-white/10 border border-white/20 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-12 text-center text-white/70 space-y-4 max-w-md mx-auto my-12 bg-white/5 border border-white/10 rounded-2xl">
        <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Assessment Record Not Found</h3>
        <p className="text-xs text-white/50">{errorMsg || 'The requested clinical assessment could not be retrieved from the database.'}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={fetchAssessmentDetail}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
          <Link href="/crm360/assessments" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-xl text-xs transition">
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const hasRedFlag = Boolean(
    assessment.redFlagWeightLoss || assessment.redFlagBowelBladder ||
    assessment.redFlagSaddleAnaesthesia || assessment.redFlagNightPain
  );

  let painRegions: SelectedRegion[] = [];
  try {
    if (assessment.painSiteRegions) {
      const parsed = JSON.parse(assessment.painSiteRegions);
      if (Array.isArray(parsed)) painRegions = parsed;
    }
  } catch (e) {}

  const isSigned = assessment.status === 'SIGNED' || assessment.status === 'AMENDED';
  const baselineRom = assessment.parentAssessment?.romMeasurements || [];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 select-none font-sans text-white">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/crm360/assessments" className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                {assessment.type}
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/10 text-white/70 border border-white/20 rounded-md">
                {assessment.status}
              </span>
              {hasRedFlag && (
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Red Flag Logged
                </span>
              )}
            </div>
            <h1 className="text-xl font-serif font-bold text-white mt-1">
              Assessment: {assessment.patient?.fullName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/crm360/assessments/new?patientId=${assessment.patientId}&parentAssessmentId=${assessment.id}`}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" /> New Reassessment
          </Link>

          <Link
            href={`/crm360/assessments/${id}/print`}
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/15"
          >
            <Printer className="w-4 h-4" /> Export PDF
          </Link>
        </div>
      </div>

      {/* Main Record Body */}
      <div className="bg-[#0B0A10]/90 border border-white/20 rounded-3xl p-6 md:p-8 space-y-8 shadow-2xl backdrop-blur-xl">
        {/* Red Flag Warning Box if Present */}
        {hasRedFlag && (
          <div className="p-5 bg-rose-950/60 border border-rose-500/50 rounded-2xl space-y-2">
            <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Positive Red Flag Safety Interlock Record
            </h4>
            <p className="text-xs text-rose-100/80 leading-relaxed font-medium">
              Clinician Rationale Note: "{assessment.redFlagDecisionNote || 'No decision note recorded.'}"
            </p>
            <span className="text-[10px] text-rose-300/60 font-mono block pt-1">
              Acknowledged at {assessment.redFlagAcknowledgedAt ? new Date(assessment.redFlagAcknowledgedAt).toLocaleString() : 'N/A'}
            </span>
          </div>
        )}

        {/* Section 1: Demographics & Diagnosis */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-white/10 pb-1">
            1. Profile & Diagnosis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-white/50 uppercase block">Patient</span>
              <span className="font-bold text-white block">{assessment.patient?.fullName}</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-white/50 uppercase block">Assessment Date</span>
              <span className="font-bold text-white block">{new Date(assessment.assessmentDate).toLocaleDateString()}</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-white/50 uppercase block">Occupation</span>
              <span className="font-bold text-white block">{assessment.occupation || 'N/A'}</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-white/50 uppercase block">Prognosis</span>
              <span className="font-bold text-emerald-400 block">{assessment.prognosis || 'GOOD'}</span>
            </div>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">PT Clinical Diagnosis:</span>
            <p className="text-xs text-white/90 font-bold leading-relaxed">{assessment.ptDiagnosis || 'No diagnosis recorded.'}</p>
          </div>
        </div>

        {/* Section 2: Subjective Findings */}
        <div className="space-y-3 border-t border-white/10 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-white/10 pb-1">
            2. Subjective Profile
          </h3>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-2">
            <span className="text-[10px] font-bold text-white/50 uppercase block">Chief Complaint:</span>
            <p className="text-white/80 font-medium italic">"{assessment.chiefComplaint || 'None'}"</p>
          </div>

          {/* Pain VAS Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs font-mono font-bold">
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-[9px] font-sans font-bold uppercase text-white/50 block">Activity VAS</span>
              <span className="text-base text-rose-400">{assessment.vasActivity ?? '—'}/10</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-[9px] font-sans font-bold uppercase text-white/50 block">Rest VAS</span>
              <span className="text-base text-amber-400">{assessment.vasRest ?? '—'}/10</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-[9px] font-sans font-bold uppercase text-white/50 block">Best VAS</span>
              <span className="text-base text-emerald-400">{assessment.vasBest ?? '—'}/10</span>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <span className="text-[9px] font-sans font-bold uppercase text-white/50 block">Worst VAS</span>
              <span className="text-base text-rose-500">{assessment.vasWorst ?? '—'}/10</span>
            </div>
          </div>
        </div>

        {/* Section 3: ROM / MMT Comparison Table */}
        <div className="space-y-3 border-t border-white/10 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-white/10 pb-1 flex items-center gap-2">
            <Dumbbell className="w-4 h-4" /> 3. Mobility & Strength Measurements
            {baselineRom.length > 0 && <span className="text-[10px] text-emerald-300 font-mono">(Side-by-side Baseline Comparison Active)</span>}
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/10 text-[10px] uppercase font-bold text-white/60">
                <tr>
                  <th className="p-3">Region & Movement</th>
                  <th className="p-3">AROM R / L</th>
                  <th className="p-3">PROM R / L</th>
                  <th className="p-3">MMT R / L</th>
                  {baselineRom.length > 0 && <th className="p-3 text-emerald-400">Baseline Delta</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {(assessment.romMeasurements || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-white/40 font-sans">No ROM measurements recorded.</td>
                  </tr>
                ) : (
                  (assessment.romMeasurements || []).map((r: any) => {
                    const b = baselineRom.find((x: any) => x.region === r.region && x.movement === r.movement);
                    return (
                      <tr key={r.id} className="hover:bg-white/5">
                        <td className="p-3 font-sans">
                          <span className="text-[9px] uppercase font-bold text-emerald-400 block">{r.region}</span>
                          <span className="font-bold text-white block">{r.movement}</span>
                        </td>
                        <td className="p-3 text-white">{r.aromRight ?? '—'}° / {r.aromLeft ?? '—'}°</td>
                        <td className="p-3 text-white/80">{r.promRight ?? '—'}° / {r.promLeft ?? '—'}°</td>
                        <td className="p-3 text-white/80">{r.mmtRight ?? '—'} / {r.mmtLeft ?? '—'}</td>
                        {baselineRom.length > 0 && (
                          <td className="p-3 text-emerald-300 font-bold">
                            {b ? `R: ${b.aromRight ?? '—'}° → ${r.aromRight ?? '—'}°` : 'New'}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Special Tests */}
        <div className="space-y-3 border-t border-white/10 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-white/10 pb-1">
            4. Special Orthopedic Tests
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(assessment.specialTestResults || []).length === 0 ? (
              <p className="text-xs text-white/40 italic p-3">No special tests recorded.</p>
            ) : (
              (assessment.specialTestResults || []).map((t: any) => (
                <div key={t.id} className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-white">{t.testName} ({t.side})</span>
                    <span className={t.result === 'POSITIVE' ? 'text-rose-400 font-mono font-bold' : 'text-emerald-400 font-mono font-bold'}>
                      {t.result}
                    </span>
                  </div>
                  {t.note && <p className="text-[11px] text-white/60 italic">"{t.note}"</p>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 5: Assessment Scales */}
        {assessment.scalesJson && (() => {
          let scalesList: any[] = [];
          try {
            const parsed = JSON.parse(assessment.scalesJson);
            if (Array.isArray(parsed)) scalesList = parsed;
          } catch(e) {}

          if (!scalesList || scalesList.length === 0) return null;

          let parentScales: any[] = [];
          try {
            if (assessment.parentAssessment?.scalesJson) {
              const parsedParent = JSON.parse(assessment.parentAssessment.scalesJson);
              if (Array.isArray(parsedParent)) parentScales = parsedParent;
            }
          } catch(e) {}

          return (
            <div className="space-y-3 border-t border-white/10 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-white/10 pb-1">
                5. Standardized Assessment Scales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scalesList.map((scale: any) => {
                  const prev = parentScales.find(p => p.scaleId === scale.scaleId);
                  return (
                    <div key={scale.scaleId} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">{scale.name}</span>
                        <span className="text-emerald-400 font-serif">
                          {scale.score}
                          {scale.maxScore ? ` / ${scale.maxScore}` : ''}
                          {scale.percent !== undefined ? ` (${scale.percent}%)` : ''}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/50">
                        Interpretation: <span className="font-semibold text-white/80">{scale.interpretation}</span>
                      </div>

                      {prev && (
                        <div className="pt-2 border-t border-white/5 space-y-1 text-[10px] font-serif">
                          <div className="flex justify-between text-white/40">
                            <span>Previous Score:</span>
                            <span>{prev.score}{prev.maxScore ? `/${prev.maxScore}` : ''}</span>
                          </div>
                          {typeof scale.score === 'number' && typeof prev.score === 'number' && (
                            <div className="flex justify-between">
                              <span>Change:</span>
                              <span className={scale.score < prev.score ? 'text-emerald-400 font-bold' : scale.score > prev.score ? 'text-rose-400' : 'text-white/60'}>
                                {scale.score - prev.score > 0 ? '+' : ''}
                                {scale.score - prev.score} points ({scale.score < prev.score ? 'Improved' : scale.score > prev.score ? 'Worse' : 'No change'})
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Section 6: Amendments Audit Trail */}
        {isSigned && (
          <div className="space-y-4 border-t border-white/10 pt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Record Amendments & Audit Trail
              </h3>
              <button
                type="button"
                onClick={() => setIsAmending(!isAmending)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" /> Add Amendment Addendum
              </button>
            </div>

            {isAmending && (
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3 text-xs">
                <input
                  type="text"
                  placeholder="Reason for amendment (e.g. Patient clarified past MRI findings)..."
                  value={amendmentReason}
                  onChange={(e) => setAmendmentReason(e.target.value)}
                  className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-bold"
                />
                <textarea
                  rows={2}
                  placeholder="Amendment details..."
                  value={amendmentText}
                  onChange={(e) => setAmendmentText(e.target.value)}
                  className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white"
                />
                <button
                  type="button"
                  onClick={handleAddAmendment}
                  className="px-4 py-2 bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  Submit Amendment
                </button>
              </div>
            )}

            <div className="space-y-2">
              {(assessment.amendments || []).map((a: any) => (
                <div key={a.id} className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-white/50 text-[10px] font-mono">
                    <span>Amended by {a.userId}</span>
                    <span>{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="font-bold text-white">Reason: {a.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
