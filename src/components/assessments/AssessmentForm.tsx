'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, FileText, AlertTriangle, Activity, Dumbbell, ShieldAlert, 
  Target, CheckCircle2, ChevronLeft, ChevronRight, Save, Mic, Lock, ArrowLeft,
  ClipboardList
} from 'lucide-react';
import BodyChartPicker, { SelectedRegion } from './BodyChartPicker';
import RomGrid, { RomItem } from './RomGrid';
import SpecialTestsPicker, { SpecialTestResultItem } from './SpecialTestsPicker';
import AssessmentScales from './AssessmentScales';
import RedFlagBanner from './RedFlagBanner';
import DictationButton from './DictationButton';

interface AssessmentFormProps {
  initialPatientId?: string;
  parentAssessmentId?: string;
  onSuccess?: (assessmentId: string) => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, title: 'Profile', icon: User },
  { id: 2, title: 'Subjective', icon: FileText },
  { id: 3, title: 'Red Flags', icon: AlertTriangle },
  { id: 4, title: 'Objective', icon: Activity },
  { id: 5, title: 'ROM / MMT', icon: Dumbbell },
  { id: 6, title: 'Tests', icon: ShieldAlert },
  { id: 7, title: 'Scales', icon: ClipboardList },
  { id: 8, title: 'Diagnosis', icon: CheckCircle2 },
  { id: 9, title: 'Goals & Review', icon: Target },
];

export default function AssessmentForm({
  initialPatientId,
  parentAssessmentId,
  onSuccess,
  onCancel
}: AssessmentFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [patients, setPatients] = useState<any[]>([]);
  const [referralSources, setReferralSources] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [interlockError, setInterlockError] = useState<string | null>(null);

  // Form State
  const [patientId, setPatientId] = useState(initialPatientId || '');
  const [type, setType] = useState<'INITIAL' | 'REASSESSMENT' | 'DISCHARGE'>(parentAssessmentId ? 'REASSESSMENT' : 'INITIAL');
  const [occupation, setOccupation] = useState('');
  const [occupationCategory, setOccupationCategory] = useState<string>('SEDENTARY_DESK');
  const [referralSourceId, setReferralSourceId] = useState('');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('');
  
  // Subjective
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [medicalHistoryTags, setMedicalHistoryTags] = useState<string[]>([]);
  const [surgicalHistory, setSurgicalHistory] = useState('');
  const [medicineHistory, setMedicineHistory] = useState('');
  const [onset, setOnset] = useState<'ACUTE' | 'SUB_ACUTE' | 'CHRONIC'>('ACUTE');
  const [onsetDate, setOnsetDate] = useState('');
  const [mechanismOfInjury, setMechanismOfInjury] = useState('');
  const [painSiteRegions, setPainSiteRegions] = useState<SelectedRegion[]>([]);
  const [painTypes, setPainTypes] = useState<string[]>(['SHARP']);
  const [vasRest, setVasRest] = useState<number>(0);
  const [vasActivity, setVasActivity] = useState<number>(5);
  const [vasBest, setVasBest] = useState<number>(0);
  const [vasWorst, setVasWorst] = useState<number>(8);
  const [aggravatingFactors, setAggravatingFactors] = useState('');
  const [easingFactors, setEasingFactors] = useState('');
  const [diurnalVariation, setDiurnalVariation] = useState<string>('VARIABLE');
  const [pmh, setPmh] = useState<string[]>([]);
  const [investigations, setInvestigations] = useState<string[]>([]);

  // Red Flags
  const [redFlagWeightLoss, setRedFlagWeightLoss] = useState<boolean | null>(null);
  const [redFlagBowelBladder, setRedFlagBowelBladder] = useState<boolean | null>(null);
  const [redFlagSaddleAnaesthesia, setRedFlagSaddleAnaesthesia] = useState<boolean | null>(null);
  const [redFlagNightPain, setRedFlagNightPain] = useState<boolean | null>(null);
  const [isRedFlagAcknowledged, setIsRedFlagAcknowledged] = useState(false);
  const [redFlagDecisionNote, setRedFlagDecisionNote] = useState('');

  // Objective
  const [posture, setPosture] = useState<'NORMAL' | 'ALTERED'>('NORMAL');
  const [postureNotes, setPostureNotes] = useState('');
  const [postureExtraNotes, setPostureExtraNotes] = useState('');
  const [gait, setGait] = useState<'NORMAL' | 'ANTALGIC' | 'DEVIATED' | 'NON_AMBULATORY'>('NORMAL');
  const [gaitNotes, setGaitNotes] = useState('');
  const [localInspection, setLocalInspection] = useState<string[]>([]);
  const [tendernessGrade, setTendernessGrade] = useState<string>('NONE');
  const [tendernessSiteRegions, setTendernessSiteRegions] = useState<SelectedRegion[]>([]);
  const [spasm, setSpasm] = useState(false);
  const [spasmSite, setSpasmSite] = useState('');

  // Mobility & Tests
  const [romMeasurements, setRomMeasurements] = useState<RomItem[]>([]);
  const [specialTestResults, setSpecialTestResults] = useState<SpecialTestResultItem[]>([]);
  const [functionalLimitations, setFunctionalLimitations] = useState<string[]>([]);

  // Assessment & Goals
  const [ptDiagnosis, setPtDiagnosis] = useState('');
  const [prognosis, setPrognosis] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'>('GOOD');
  const [scalesJson, setScalesJson] = useState<string | null>(null);
  const [pastAssessments, setPastAssessments] = useState<any[]>([]);
  const [shortGoals, setShortGoals] = useState<Array<{ text: string; targetValue: string; targetDate: string }>>([
    { text: 'Reduce Activity VAS pain score below 3/10', targetValue: '<3 VAS', targetDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().slice(0, 10) }
  ]);
  const [longGoals, setLongGoals] = useState<Array<{ text: string; targetValue: string; targetDate: string }>>([
    { text: 'Restore full AROM and return to daily activity', targetValue: 'Full AROM', targetDate: new Date(Date.now() + 42 * 24 * 3600 * 1000).toISOString().slice(0, 10) }
  ]);

  useEffect(() => {
    fetchPatientsAndReferrals();
    restoreDraft();
  }, []);

  useEffect(() => {
    if (patientId) {
      fetchPastAssessments(patientId);
    }
  }, [patientId]);

  const fetchPastAssessments = async (pid: string) => {
    try {
      const res = await fetch(`/api/assessments?patientId=${pid}`);
      if (res.ok) {
        const data = await res.json();
        setPastAssessments(data);
      }
    } catch (e) {
      console.error('Failed to fetch past assessments:', e);
    }
  };

  // Autosave every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      saveDraftToLocalStorage();
    }, 5000);
    return () => clearInterval(timer);
  }, [patientId, chiefComplaint, painSiteRegions, romMeasurements, redFlagDecisionNote]);

  const fetchPatientsAndReferrals = async () => {
    try {
      const pRes = await fetch('/api/patients');
      if (pRes.ok) {
        const pData = await pRes.json();
        setPatients(pData);
        if (!patientId && pData.length > 0) setPatientId(pData[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveDraftToLocalStorage = () => {
    const draftData = {
      patientId, type, occupation, occupationCategory, provisionalDiagnosis,
      chiefComplaint, historyOfPresentIllness, medicalHistory, medicalHistoryTags,
      surgicalHistory, medicineHistory,
      onset, onsetDate, mechanismOfInjury, painSiteRegions,
      vasRest, vasActivity, vasBest, vasWorst, redFlagWeightLoss, redFlagBowelBladder,
      redFlagSaddleAnaesthesia, redFlagNightPain, redFlagDecisionNote, ptDiagnosis, prognosis,
      scalesJson
    };
    localStorage.setItem('h360_assessment_draft', JSON.stringify(draftData));
    setLastSavedTime(new Date().toLocaleTimeString());
  };

  const restoreDraft = () => {
    const saved = localStorage.getItem('h360_assessment_draft');
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d && typeof d === 'object') {
          if (d.chiefComplaint) setChiefComplaint(d.chiefComplaint);
          if (d.historyOfPresentIllness) setHistoryOfPresentIllness(d.historyOfPresentIllness);
          if (d.medicalHistory) setMedicalHistory(d.medicalHistory);
          if (Array.isArray(d.medicalHistoryTags)) setMedicalHistoryTags(d.medicalHistoryTags);
          if (d.surgicalHistory) setSurgicalHistory(d.surgicalHistory);
          if (d.medicineHistory) setMedicineHistory(d.medicineHistory);
          if (d.mechanismOfInjury) setMechanismOfInjury(d.mechanismOfInjury);
          if (d.ptDiagnosis) setPtDiagnosis(d.ptDiagnosis);
          if (d.scalesJson) setScalesJson(d.scalesJson);
        }
      } catch (e) {}
    }
  };

  const handleSaveAssessment = async (statusToSet: 'DRAFT' | 'COMPLETED' | 'SIGNED') => {
    setSaving(true);
    setInterlockError(null);

    const hasPositiveRedFlag = Boolean(
      redFlagWeightLoss === true ||
      redFlagBowelBladder === true ||
      redFlagSaddleAnaesthesia === true ||
      redFlagNightPain === true
    );

    // INTERLOCK VALIDATION
    if (hasPositiveRedFlag && (statusToSet === 'COMPLETED' || statusToSet === 'SIGNED')) {
      if (!isRedFlagAcknowledged || !redFlagDecisionNote.trim()) {
        setInterlockError('Red flag response recorded. Document your clinical decision note before completing this assessment.');
        setSaving(false);
        setCurrentStep(3); // Jump to Red Flags step
        return;
      }
    }

    const payload = {
      patientId,
      type,
      status: statusToSet,
      parentAssessmentId,
      occupation,
      occupationCategory,
      referralSourceId: referralSourceId || null,
      provisionalDiagnosis,
      chiefComplaint,
      onset,
      onsetDate: onsetDate || null,
      mechanismOfInjury,
      painSiteRegions,
      painTypes,
      vasRest,
      vasActivity,
      vasBest,
      vasWorst,
      aggravatingFactors,
      easingFactors,
      diurnalVariation,
      pmh: JSON.stringify({
        medicalHistory,
        conditions: medicalHistoryTags,
        surgicalHistory,
        medicineHistory,
      }),
      narrativeJson: JSON.stringify({
        historyOfPresentIllness,
        medicalHistory,
        medicalHistoryTags,
        surgicalHistory,
        medicineHistory,
      }),
      investigations,
      redFlagWeightLoss: Boolean(redFlagWeightLoss),
      redFlagBowelBladder: Boolean(redFlagBowelBladder),
      redFlagSaddleAnaesthesia: Boolean(redFlagSaddleAnaesthesia),
      redFlagNightPain: Boolean(redFlagNightPain),
      redFlagAcknowledgedAt: isRedFlagAcknowledged ? new Date() : null,
      redFlagDecisionNote,
      posture,
      postureNotes,
      postureExtraNotes,
      gait,
      gaitNotes,
      localInspection,
      tendernessGrade,
      tendernessSiteRegions,
      spasm,
      spasmSite,
      functionalLimitations,
      ptDiagnosis,
      prognosis,
      scalesJson,
      romMeasurements,
      specialTestResults,
      goals: [
        ...shortGoals.map(g => ({ horizon: 'SHORT', text: g.text, targetValue: g.targetValue, targetDate: g.targetDate })),
        ...longGoals.map(g => ({ horizon: 'LONG', text: g.text, targetValue: g.targetValue, targetDate: g.targetDate }))
      ]
    };

    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        setInterlockError(err.error || 'Failed to save assessment');
      } else {
        const created = await res.json();
        localStorage.removeItem('h360_assessment_draft');
        if (onSuccess) onSuccess(created.id);
      }
    } catch (err: any) {
      setInterlockError('Network error saving assessment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 select-none font-sans text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          {onCancel && (
            <button onClick={onCancel} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-serif font-bold text-white">
              {parentAssessmentId ? 'New Reassessment' : 'Digital Initial Assessment'}
            </h2>
            <span className="text-[10px] text-white/50 font-mono">
              {lastSavedTime ? `Autosaved at ${lastSavedTime}` : 'Autosave active (5s)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSaveAssessment('DRAFT')}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/15"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSaveAssessment('SIGNED')}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500/60 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm backdrop-blur-md"
          >
            <Lock className="w-3.5 h-3.5" /> Complete & Sign
          </button>
        </div>
      </div>

      {/* Step Navigation Wizard Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 bg-white/5 p-1.5 border border-white/10 rounded-2xl">
        {STEPS.map(s => {
          const Icon = s.icon;
          const isActive = currentStep === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setCurrentStep(s.id)}
              className={`p-2 rounded-xl text-center flex flex-col items-center gap-1 transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs backdrop-blur-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] truncate">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="p-6 bg-white/[0.03] border border-white/10 rounded-3xl space-y-6 backdrop-blur-xl">
        {/* STEP 1: Patient Profile */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-white border-b border-white/10 pb-2">1. Patient Profile & Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Select Patient *</label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#0B0A10]">
                      {p.fullName} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Assessment Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold"
                >
                  <option value="INITIAL" className="bg-[#0B0A10]">Initial Assessment</option>
                  <option value="REASSESSMENT" className="bg-[#0B0A10]">Reassessment</option>
                  <option value="DISCHARGE" className="bg-[#0B0A10]">Discharge Assessment</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Occupation Load Category</label>
                <select
                  value={occupationCategory}
                  onChange={(e) => setOccupationCategory(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold"
                >
                  <option value="SEDENTARY_DESK" className="bg-[#0B0A10]">Sedentary / Desk Role</option>
                  <option value="MANUAL_LABOUR" className="bg-[#0B0A10]">Manual Labour</option>
                  <option value="STANDING_ROLE" className="bg-[#0B0A10]">Standing Role</option>
                  <option value="ATHLETE" className="bg-[#0B0A10]">Athlete / Sports</option>
                  <option value="HOMEMAKER" className="bg-[#0B0A10]">Homemaker</option>
                  <option value="STUDENT" className="bg-[#0B0A10]">Student</option>
                  <option value="RETIRED" className="bg-[#0B0A10]">Retired</option>
                  <option value="OTHER" className="bg-[#0B0A10]">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Occupation Details</label>
                <input
                  type="text"
                  placeholder="e.g. IT Software Engineer (10 hrs sitting)"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Provisional Diagnosis</label>
                <input
                  type="text"
                  placeholder="e.g. Left Shoulder Subacromial Impingement"
                  value={provisionalDiagnosis}
                  onChange={(e) => setProvisionalDiagnosis(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Subjective */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-base font-serif font-bold text-white">2. Subjective Assessment</h3>
              <DictationButton onTranscript={(txt) => setChiefComplaint(chiefComplaint ? `${chiefComplaint} ${txt}` : txt)} />
            </div>

            <div className="space-y-4 text-xs">
              {/* Chief Complaint */}
              <div>
                <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Chief Complaint *</label>
                <textarea
                  rows={2}
                  placeholder="Describe patient's chief complaint in their own words (e.g. 'Severe lower back pain radiating to left leg for 2 weeks')..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* 1. History of Present Illness (HPI) */}
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      1. History of Present Illness (HPI)
                    </label>
                    <p className="text-[10px] text-white/50 mt-0.5">
                      Chronological progression, pain characteristics, mechanical triggers, and prior episodes.
                    </p>
                  </div>
                  <DictationButton onTranscript={(txt) => setHistoryOfPresentIllness(historyOfPresentIllness ? `${historyOfPresentIllness} ${txt}` : txt)} />
                </div>

                <textarea
                  rows={3}
                  placeholder="Detail the chronological course of symptoms, exact onset circumstances, progression over days/weeks, mechanical triggers, aggravating and relieving positions, radiating pain/paraesthesia, previous episodes, and past treatments attempted..."
                  value={historyOfPresentIllness}
                  onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/15 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-400 leading-relaxed"
                />

                {/* Quick Suggestion Chips for HPI */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 mr-1">Quick Add:</span>
                  {[
                    'Gradual insidious onset',
                    'Sudden traumatic onset',
                    'Progressive worsening',
                    'Intermittent shooting pain',
                    'Radiating to lower extremity',
                    'Radiating to upper extremity',
                    'Paraesthesia / Numbness reported',
                    'Aggravated by forward flexion',
                    'Aggravated by prolonged sitting',
                    'Relieved by supine lying / rest',
                    'Past similar episode 6 months ago',
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => {
                        setHistoryOfPresentIllness((prev) =>
                          prev ? `${prev}. ${phrase}` : phrase
                        );
                      }}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-white/70 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 transition cursor-pointer"
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Onset Type, Mechanism of Injury & Diurnal Variation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Onset Type</label>
                  <div className="flex gap-2">
                    {(['ACUTE', 'SUB_ACUTE', 'CHRONIC'] as const).map(o => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setOnset(o)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          onset === o ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-white/10 text-white/60 border-white/15 hover:bg-white/15'
                        }`}
                      >
                        {o.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Mechanism of Injury</label>
                  <input
                    type="text"
                    placeholder="e.g. Heavy lifting, slip/fall, sports injury, desk posture..."
                    value={mechanismOfInjury}
                    onChange={(e) => setMechanismOfInjury(e.target.value)}
                    className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Diurnal Variation</label>
                  <select
                    value={diurnalVariation}
                    onChange={(e) => setDiurnalVariation(e.target.value)}
                    className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-bold"
                  >
                    <option value="WORSE_MORNING" className="bg-[#0B0A10]">Worse in Morning</option>
                    <option value="WORSE_NIGHT" className="bg-[#0B0A10]">Worse at Night</option>
                    <option value="CONSTANT" className="bg-[#0B0A10]">Constant Pain</option>
                    <option value="VARIABLE" className="bg-[#0B0A10]">Variable / Activity Dependent</option>
                  </select>
                </div>
              </div>

              {/* 2. Medical History / Surgical History / Medicine History Card */}
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl space-y-4">
                <div className="border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    2. Medical History / Surgical History / Medicine History
                  </span>
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Essential systemic conditions, prior surgical procedures, and current medication regimen.
                  </p>
                </div>

                {/* A. Medical History & Comorbidities */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-white/60 block">
                    A. Medical History & Systemic Conditions
                  </label>
                  
                  {/* Comorbidity Condition Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Diabetes Mellitus',
                      'Hypertension',
                      'Cardiac Disease',
                      'Thyroid Disorder',
                      'Asthma / Respiratory',
                      'Osteoarthritis',
                      'Osteoporosis',
                      'Rheumatoid / Autoimmune',
                      'Spinal Pathology',
                      'Neuropathy',
                      'No Known Comorbidities',
                    ].map((tag) => {
                      const isSelected = medicalHistoryTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (tag === 'No Known Comorbidities') {
                              setMedicalHistoryTags(isSelected ? [] : ['No Known Comorbidities']);
                            } else {
                              const filtered = medicalHistoryTags.filter(t => t !== 'No Known Comorbidities');
                              if (isSelected) {
                                setMedicalHistoryTags(filtered.filter(t => t !== tag));
                              } else {
                                setMedicalHistoryTags([...filtered, tag]);
                              }
                            }
                          }}
                          className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{tag}
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    placeholder="Additional medical history details (e.g. Duration of diabetes, BP control, renal, gastrointestinal)..."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/15 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* B. Surgical History */}
                <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-white/60 block">
                      B. Surgical History (Procedures, Dates & Implants)
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        'No Prior Surgeries',
                        'Spine Discectomy',
                        'Spine Fusion',
                        'Knee Arthroscopy',
                        'Total Knee Replacement',
                        'Total Hip Replacement',
                        'ORIF / Fixation',
                      ].map((surg) => (
                        <button
                          key={surg}
                          type="button"
                          onClick={() => {
                            setSurgicalHistory((prev) => prev ? `${prev}, ${surg}` : surg);
                          }}
                          className="text-[9px] font-semibold px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition cursor-pointer"
                        >
                          + {surg}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Prior surgical history, orthopedic procedures, spinal surgeries, arthroscopy, joint replacements with approximate year/implants..."
                    value={surgicalHistory}
                    onChange={(e) => setSurgicalHistory(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/15 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* C. Medicine History */}
                <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-white/60 block">
                      C. Medicine / Drug History & Allergies
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        'No Regular Medications',
                        'Analgesics / NSAIDs',
                        'Muscle Relaxants',
                        'Anticoagulants / Blood Thinners',
                        'Neuropathic Agents',
                        'Steroids / Injections',
                        'Calcium & Vit D3',
                        'Drug Allergy Noted',
                      ].map((med) => (
                        <button
                          key={med}
                          type="button"
                          onClick={() => {
                            setMedicineHistory((prev) => prev ? `${prev}, ${med}` : med);
                          }}
                          className="text-[9px] font-semibold px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition cursor-pointer"
                        >
                          + {med}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Current prescribed medications, dosages, OTC pain medications, blood thinners, calcium/supplements, and known drug allergies..."
                    value={medicineHistory}
                    onChange={(e) => setMedicineHistory(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/15 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Tap Scale for VAS Scores (0-10) */}
              <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Visual Analog Scale (VAS 0–10) Pain Profile:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-white/60 block mb-1">Activity VAS: {vasActivity}/10</span>
                    <div className="flex gap-1 overflow-x-auto">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVasActivity(v)}
                          className={`h-7 w-7 rounded-lg text-xs font-mono font-bold transition ${
                            vasActivity === v ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-white/60 block mb-1">Rest VAS: {vasRest}/10</span>
                    <div className="flex gap-1 overflow-x-auto">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVasRest(v)}
                          className={`h-7 w-7 rounded-lg text-xs font-mono font-bold transition ${
                            vasRest === v ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive SVG Body Diagram */}
              <BodyChartPicker
                selectedRegions={painSiteRegions}
                onChange={setPainSiteRegions}
                title="Pain Site & Radiation Regions"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Red Flags */}
        {currentStep === 3 && (
          <RedFlagBanner
            unexplainedWeightLoss={redFlagWeightLoss}
            bowelBladderDysfunction={redFlagBowelBladder}
            saddleAnaesthesia={redFlagSaddleAnaesthesia}
            nightPain={redFlagNightPain}
            onFlagChange={(k, v) => {
              if (k === 'unexplainedWeightLoss') setRedFlagWeightLoss(v);
              if (k === 'bowelBladderDysfunction') setRedFlagBowelBladder(v);
              if (k === 'saddleAnaesthesia') setRedFlagSaddleAnaesthesia(v);
              if (k === 'nightPain') setRedFlagNightPain(v);
            }}
            isAcknowledged={isRedFlagAcknowledged}
            onAcknowledgeChange={setIsRedFlagAcknowledged}
            decisionNote={redFlagDecisionNote}
            onDecisionNoteChange={setRedFlagDecisionNote}
            interlockError={interlockError}
          />
        )}

        {/* STEP 4: Objective - Observation & Palpation */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-white border-b border-white/10 pb-2">4. Objective — Observation & Palpation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Posture / Alignment</label>
                <div className="flex gap-2 mb-3">
                  {(['NORMAL', 'ALTERED'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPosture(p)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        posture === p ? 'bg-white text-black border-white shadow-md' : 'bg-white/10 text-white/60 border-white/15 hover:bg-white/15'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Always-visible Posture Writing & Observations Section */}
                <div className="space-y-3">
                  {/* Quick-insert tags */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/60 block mb-1.5">
                      Posture Presets (Click to insert)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Forward Head Posture',
                        'Elevated Right Shoulder',
                        'Elevated Left Shoulder',
                        'Thoracic Kyphosis',
                        'Lumbar Hyperlordosis',
                        'Anterior Pelvic Tilt',
                        'Posterior Pelvic Tilt',
                        'Scoliotic Deviation',
                        'Genu Valgum',
                        'Genu Varum'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setPostureNotes(prev => prev ? `${prev}, ${preset}` : preset);
                          }}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-white/80 border border-white/10 transition cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/60 block mb-1">
                      Posture & Alignment Writing / Observations
                    </label>
                    <textarea
                      value={postureNotes}
                      onChange={(e) => setPostureNotes(e.target.value)}
                      placeholder="Write posture observations here (e.g. Forward head posture, right scapular winging, pelvic asymmetry...)"
                      rows={3}
                      className="w-full p-2.5 bg-white/[0.04] border border-white/15 rounded-xl text-white text-xs placeholder-white/30 resize-none focus:outline-none focus:border-[#12D6C4] transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-white/60 block mb-1">
                      Additional Clinical Remarks & Compensatory Findings
                    </label>
                    <textarea
                      value={postureExtraNotes}
                      onChange={(e) => setPostureExtraNotes(e.target.value)}
                      placeholder="Describe compensatory movement strategies, muscle imbalance findings, spinal curvature notes..."
                      rows={3}
                      className="w-full p-2.5 bg-white/[0.04] border border-white/15 rounded-xl text-white text-xs placeholder-white/30 resize-none focus:outline-none focus:border-[#12D6C4] transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Gait Pattern</label>
                <select
                  value={gait}
                  onChange={(e) => setGait(e.target.value as any)}
                  className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-bold"
                >
                  <option value="NORMAL" className="bg-[#0B0A10]">Normal</option>
                  <option value="ANTALGIC" className="bg-[#0B0A10]">Antalgic</option>
                  <option value="DEVIATED" className="bg-[#0B0A10]">Deviated</option>
                  <option value="NON_AMBULATORY" className="bg-[#0B0A10]">Non-Ambulatory</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">Tenderness Grade</label>
                <select
                  value={tendernessGrade}
                  onChange={(e) => setTendernessGrade(e.target.value)}
                  className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-bold"
                >
                  <option value="NONE" className="bg-[#0B0A10]">None</option>
                  <option value="GRADE_I" className="bg-[#0B0A10]">Grade I (Complaints of pain)</option>
                  <option value="GRADE_II" className="bg-[#0B0A10]">Grade II (Complaints & winces)</option>
                  <option value="GRADE_III" className="bg-[#0B0A10]">Grade III (Winces & withdraws)</option>
                  <option value="GRADE_IV" className="bg-[#0B0A10]">Grade IV (Withdraws & resists touch)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="spasmCheck"
                  checked={spasm}
                  onChange={(e) => setSpasm(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-500"
                />
                <label htmlFor="spasmCheck" className="text-xs font-bold text-white cursor-pointer">
                  Muscle Spasm Present
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Objective - ROM / MMT Grid */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-white border-b border-white/10 pb-2">5. Mobility & Strength (AROM / PROM / MMT)</h3>
            <RomGrid items={romMeasurements} onChange={setRomMeasurements} />
          </div>
        )}

        {/* STEP 6: Special Tests */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-white border-b border-white/10 pb-2">6. Special Orthopedic Tests</h3>
            <SpecialTestsPicker items={specialTestResults} onChange={setSpecialTestResults} />
          </div>
        )}

        {/* STEP 7: Scales */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-white border-b border-white/10 pb-2">7. Standardized Assessment Scales</h3>
            <AssessmentScales
              value={scalesJson}
              onChange={setScalesJson}
              previousAssessments={pastAssessments}
            />
          </div>
        )}

        {/* STEP 8: Assessment & Prognosis */}
        {currentStep === 8 && (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-base font-serif font-bold text-white">8. Physiotherapy Diagnosis & Impairments</h3>
              <DictationButton onTranscript={(txt) => setPtDiagnosis(ptDiagnosis ? `${ptDiagnosis} ${txt}` : txt)} />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-white/50 block mb-1">PT Clinical Diagnosis *</label>
              <textarea
                rows={4}
                placeholder="Formulate functional physical therapy diagnosis and primary impairment list..."
                value={ptDiagnosis}
                onChange={(e) => setPtDiagnosis(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold"
              />
            </div>


          </div>
        )}

        {/* STEP 9: Goals & Review */}
        {currentStep === 9 && (
          <div className="space-y-6 text-xs">
            <h3 className="text-base font-serif font-bold text-white border-b border-white/10 pb-2">9. Treatment Goals & Final Review</h3>

            {/* Short-Term Goals (1-2 weeks) */}
            <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-emerald-400 block">Short-Term Goals (1–2 Weeks):</span>
              {shortGoals.map((g, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Goal description..."
                    value={g.text}
                    onChange={(e) => {
                      const next = [...shortGoals];
                      next[i].text = e.target.value;
                      setShortGoals(next);
                    }}
                    className="sm:col-span-2 p-2.5 bg-white/10 border border-white/20 rounded-xl text-white"
                  />
                  <input
                    type="text"
                    placeholder="Target metric (e.g. VAS <3)"
                    value={g.targetValue}
                    onChange={(e) => {
                      const next = [...shortGoals];
                      next[i].targetValue = e.target.value;
                      setShortGoals(next);
                    }}
                    className="p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-mono"
                  />
                </div>
              ))}
            </div>

            {/* Long-Term Goals (4-6 weeks) */}
            <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-emerald-400 block">Long-Term Goals (4–6 Weeks):</span>
              {longGoals.map((g, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Goal description..."
                    value={g.text}
                    onChange={(e) => {
                      const next = [...longGoals];
                      next[i].text = e.target.value;
                      setLongGoals(next);
                    }}
                    className="sm:col-span-2 p-2.5 bg-white/10 border border-white/20 rounded-xl text-white"
                  />
                  <input
                    type="text"
                    placeholder="Target metric (e.g. Full AROM)"
                    value={g.targetValue}
                    onChange={(e) => {
                      const next = [...longGoals];
                      next[i].targetValue = e.target.value;
                      setLongGoals(next);
                    }}
                    className="p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-mono"
                  />
                </div>
              ))}
            </div>

            {/* Final Action Bar */}
            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(8)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-bold"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => handleSaveAssessment('SIGNED')}
                disabled={saving}
                className="px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500/60 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer backdrop-blur-md shadow-sm"
              >
                <Lock className="w-4 h-4" /> Sign & Complete Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
