'use client';

import React from 'react';
import {
  Calendar,
  User,
  Activity,
  FileText,
  CheckSquare,
  Square,
  Clock,
  IndianRupee,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CertificateData, CertificateType } from './CertificateDocument';

interface CertificateEditorPanelProps {
  data: CertificateData;
  onChange: (updated: CertificateData) => void;
  onReset: () => void;
}

export default function CertificateEditorPanel({
  data,
  onChange,
  onReset,
}: CertificateEditorPanelProps) {
  const updateField = (field: keyof CertificateData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const toggleCheckbox = (
    category: 'fitnessOptions' | 'progressOptions' | 'followupOptions' | 'dischargeStatusOptions',
    key: string
  ) => {
    const current = data[category] || {};
    const updated = { ...current, [key]: !current[key] };
    updateField(category, updated);
  };

  const setAllCheckboxes = (
    category: 'fitnessOptions' | 'progressOptions',
    keys: string[],
    val: boolean
  ) => {
    const updated: Record<string, boolean> = {};
    keys.forEach((k) => {
      updated[k] = val;
    });
    updateField(category, updated);
  };

  const setTodayDate = (field: keyof CertificateData) => {
    const today = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    updateField(field, today);
  };

  const addDaysToField = (
    baseField: keyof CertificateData,
    targetField: keyof CertificateData,
    days: number
  ) => {
    const now = new Date();
    now.setDate(now.getDate() + days);
    const dateStr = now.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    updateField(targetField, dateStr);
  };

  return (
    <div className="flex flex-col h-full bg-[#131B2E] text-white select-text">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#172138] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">Edit Certificate Parameters</h3>
            <p className="text-[10px] text-white/50">Changes update the official document instantly</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="text-[10px] font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-lg border border-white/10 transition cursor-pointer"
          title="Restore original pre-filled values"
        >
          Restore
        </button>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Section: Patient Details */}
        <div className="space-y-2.5 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Patient Particulars</span>
            </div>
            <span className="text-[10px] font-mono text-white/40">Verified</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] text-white/60 block mb-1">Patient Full Name</label>
              <input
                type="text"
                value={data.patientName || ''}
                onChange={(e) => updateField('patientName', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/60 block mb-1">Age (Yrs)</label>
              <input
                type="text"
                value={data.age || ''}
                onChange={(e) => updateField('age', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition font-mono"
                placeholder="35"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-white/60 flex items-center justify-between mb-1">
                <span>Issue Date</span>
                <button
                  type="button"
                  onClick={() => setTodayDate('issueDate')}
                  className="text-[9px] text-sky-400 hover:underline cursor-pointer"
                >
                  Today
                </button>
              </label>
              <input
                type="text"
                value={data.issueDate || ''}
                onChange={(e) => updateField('issueDate', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
                placeholder="e.g. 10 Sept 2026"
              />
            </div>

            {data.type === 'discharge_summary' && (
              <div>
                <label className="text-[10px] text-white/60 block mb-1">Gender</label>
                <select
                  value={data.gender || 'Female'}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2 py-1.5 text-xs text-white outline-none transition"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* -------------------------------------------------------------
            1. TREATMENT & PAYMENT SPECIFIC FIELDS
           ------------------------------------------------------------- */}
        {data.type === 'treatment_payment' && (
          <div className="space-y-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400">
              <Activity className="w-3.5 h-3.5" />
              <span>Treatment &amp; Payment Details</span>
            </div>

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Condition / Diagnosis</label>
              <input
                type="text"
                value={data.diagnosis || ''}
                onChange={(e) => updateField('diagnosis', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
                placeholder="e.g. Cervical Spondylosis Rehabilitation"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-white/60 block mb-1">Treatment Start Date</label>
                <input
                  type="text"
                  value={data.startDate || ''}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
                  placeholder="1 Aug 2026"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 block mb-1">Treatment End Date</label>
                <input
                  type="text"
                  value={data.endDate || ''}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
                  placeholder="10 Sept 2026"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-white/60 block mb-1">Sessions</label>
                <input
                  type="text"
                  value={data.sessions || ''}
                  onChange={(e) => updateField('sessions', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition font-mono"
                  placeholder="10 Sessions"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 block mb-1">Charges / Session</label>
                <input
                  type="text"
                  value={data.chargesPerSession || ''}
                  onChange={(e) => updateField('chargesPerSession', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition font-mono"
                  placeholder="650.00"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 block mb-1">Total Paid (₹)</label>
                <input
                  type="text"
                  value={data.totalAmount || ''}
                  onChange={(e) => updateField('totalAmount', e.target.value)}
                  className="w-full bg-slate-800 border border-sky-500/40 focus:border-sky-400 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-bold outline-none transition font-mono"
                  placeholder="6,500.00"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Treatment Provided</label>
              <textarea
                rows={2}
                value={data.treatmentProvided || ''}
                onChange={(e) => updateField('treatmentProvided', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg p-2 text-xs text-white outline-none transition leading-relaxed resize-none"
                placeholder="Manual Therapy, Spinal Mobilization, Postural Ergonomics..."
              />
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            2. FITNESS CERTIFICATE SPECIFIC FIELDS
           ------------------------------------------------------------- */}
        {data.type === 'fitness' && (
          <div className="space-y-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-bold text-sky-400">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Fitness Clearances</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setAllCheckboxes(
                      'fitnessOptions',
                      ['work', 'sports', 'gym', 'school', 'travel', 'daily', 'regular', 'advice'],
                      true
                    )
                  }
                  className="text-[9px] text-sky-400 hover:underline cursor-pointer"
                >
                  All
                </button>
                <span className="text-white/20">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setAllCheckboxes(
                      'fitnessOptions',
                      ['work', 'sports', 'gym', 'school', 'travel', 'daily', 'regular', 'advice'],
                      false
                    )
                  }
                  className="text-[9px] text-white/40 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/60 flex items-center justify-between mb-1">
                <span>Assessment Date</span>
                <button
                  type="button"
                  onClick={() => setTodayDate('assessmentDate')}
                  className="text-[9px] text-sky-400 hover:underline cursor-pointer"
                >
                  Today
                </button>
              </label>
              <input
                type="text"
                value={data.assessmentDate || ''}
                onChange={(e) => updateField('assessmentDate', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
              />
            </div>

            {/* Checkboxes List */}
            <div className="space-y-1.5 pt-1">
              {[
                { key: 'work', label: 'Fit for Work Duties' },
                { key: 'sports', label: 'Fit for Sports Participation' },
                { key: 'gym', label: 'Fit for Gym / Fitness Activities' },
                { key: 'school', label: 'Fit for School / College Activities' },
                { key: 'travel', label: 'Fit for Travel' },
                { key: 'daily', label: 'Fit for Daily Activities' },
                { key: 'regular', label: 'Fit to Resume Regular Activities' },
                { key: 'advice', label: 'Fit with Specific Advice / Restrictions' },
              ].map(({ key, label }) => {
                const checked = data.fitnessOptions?.[key] ?? false;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleCheckbox('fitnessOptions', key)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left text-xs transition border cursor-pointer ${
                      checked
                        ? 'bg-sky-500/15 border-sky-500/30 text-white'
                        : 'bg-slate-800/40 border-slate-800 text-white/50 hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        checked ? 'bg-sky-500 text-white' : 'border border-slate-600 bg-slate-800'
                      }`}
                    >
                      {checked && '✓'}
                    </div>
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>

            {data.fitnessOptions?.advice && (
              <div className="pt-1">
                <label className="text-[10px] text-amber-300 block mb-1">Advice / Restriction Details</label>
                <textarea
                  rows={2}
                  value={data.adviceRestrictions || ''}
                  onChange={(e) => updateField('adviceRestrictions', e.target.value)}
                  className="w-full bg-slate-800 border border-amber-500/30 focus:border-amber-400 rounded-lg p-2 text-xs text-white outline-none transition resize-none"
                  placeholder="e.g. Avoid lifting >15kg without lumbar support for 2 weeks..."
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Remarks</label>
              <textarea
                rows={2}
                value={data.remarks || ''}
                onChange={(e) => updateField('remarks', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg p-2 text-xs text-white outline-none transition resize-none"
                placeholder="Patient demonstrates full pain-free functional range of motion..."
              />
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            3. UNFITNESS (MEDICAL REST) SPECIFIC FIELDS
           ------------------------------------------------------------- */}
        {data.type === 'unfitness' && (
          <div className="space-y-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Medical Rest &amp; Unfitness Advice</span>
            </div>

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Medical Condition / Symptoms</label>
              <input
                type="text"
                value={data.symptomsCondition || ''}
                onChange={(e) => updateField('symptomsCondition', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
                placeholder="e.g. Acute Lumbar Radiculopathy with Spasm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-white/60 flex items-center justify-between mb-1">
                  <span>Rest Start</span>
                  <button
                    type="button"
                    onClick={() => setTodayDate('startDate')}
                    className="text-[9px] text-sky-400 hover:underline cursor-pointer"
                  >
                    Today
                  </button>
                </label>
                <input
                  type="text"
                  value={data.startDate || ''}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] text-white/60 flex items-center justify-between mb-1">
                  <span>Rest End</span>
                  <button
                    type="button"
                    onClick={() => addDaysToField('startDate', 'endDate', 7)}
                    className="text-[9px] text-sky-400 hover:underline cursor-pointer"
                  >
                    +7 Days
                  </button>
                </label>
                <input
                  type="text"
                  value={data.endDate || ''}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => addDaysToField('startDate', 'endDate', 3)}
                className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] text-white/70 transition cursor-pointer"
              >
                3 Days Rest
              </button>
              <button
                type="button"
                onClick={() => addDaysToField('startDate', 'endDate', 7)}
                className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] text-white/70 transition cursor-pointer"
              >
                7 Days Rest
              </button>
              <button
                type="button"
                onClick={() => addDaysToField('startDate', 'endDate', 14)}
                className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] text-white/70 transition cursor-pointer"
              >
                14 Days Rest
              </button>
            </div>

            <div>
              <label className="text-[10px] text-white/60 flex items-center justify-between mb-1">
                <span>Follow-up Review Date</span>
                <button
                  type="button"
                  onClick={() => addDaysToField('endDate', 'reviewDate', 1)}
                  className="text-[9px] text-sky-400 hover:underline cursor-pointer"
                >
                  Day After
                </button>
              </label>
              <input
                type="text"
                value={data.reviewDate || ''}
                onChange={(e) => updateField('reviewDate', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
                placeholder="18 Sept 2026"
              />
            </div>

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Clinical Remarks &amp; Offloading Instructions</label>
              <textarea
                rows={2}
                value={data.remarks || ''}
                onChange={(e) => updateField('remarks', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg p-2 text-xs text-white outline-none transition resize-none"
                placeholder="Patient advised complete spinal offloading and daily modalities therapy..."
              />
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            4. DISCHARGE SUMMARY SPECIFIC FIELDS
           ------------------------------------------------------------- */}
        {data.type === 'discharge_summary' && (
          <div className="space-y-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <Activity className="w-3.5 h-3.5" />
              <span>Discharge Summary Parameters</span>
            </div>

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Primary Diagnosis</label>
              <input
                type="text"
                value={data.diagnosis || ''}
                onChange={(e) => updateField('diagnosis', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-white/60 block mb-1">Initial Assessment</label>
                <input
                  type="text"
                  value={data.startDate || ''}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/60 block mb-1">Date of Discharge</label>
                <input
                  type="text"
                  value={data.endDate || ''}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Presenting Complaints</label>
              <textarea
                rows={2}
                value={data.complaints || ''}
                onChange={(e) => updateField('complaints', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg p-2 text-xs text-white outline-none transition resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Outcome at Discharge</label>
              <textarea
                rows={2}
                value={data.outcome || ''}
                onChange={(e) => updateField('outcome', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg p-2 text-xs text-white outline-none transition resize-none"
              />
            </div>

            {/* Progress Achieved Checkboxes */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-white/70 block">Progress Indicators</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'pain', label: 'Pain Reduced' },
                  { key: 'rom', label: 'ROM Improved' },
                  { key: 'strength', label: 'Strength' },
                  { key: 'functional', label: 'Functional Acts' },
                  { key: 'posture', label: 'Posture' },
                  { key: 'balance', label: 'Balance / Coord' },
                  { key: 'goals', label: 'Goals Achieved' },
                ].map(({ key, label }) => {
                  const checked = data.progressOptions?.[key] ?? false;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleCheckbox('progressOptions', key)}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg text-left text-[11px] transition border cursor-pointer ${
                        checked
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-white'
                          : 'bg-slate-800/40 border-slate-800 text-white/40 hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-bold text-emerald-400">{checked ? '✓' : '·'}</span>
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/60 block mb-1">Home Exercise Advice (HEP)</label>
              <textarea
                rows={2}
                value={data.homeAdvice || ''}
                onChange={(e) => updateField('homeAdvice', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 focus:border-sky-500 rounded-lg p-2 text-xs text-white outline-none transition resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
