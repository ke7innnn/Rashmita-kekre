'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import DictationButton from './DictationButton';

interface RedFlagBannerProps {
  unexplainedWeightLoss: boolean | null;
  bowelBladderDysfunction: boolean | null;
  saddleAnaesthesia: boolean | null;
  nightPain: boolean | null;
  onFlagChange: (flag: string, value: boolean) => void;
  isAcknowledged: boolean;
  onAcknowledgeChange: (ack: boolean) => void;
  decisionNote: string;
  onDecisionNoteChange: (note: string) => void;
  interlockError?: string | null;
}

export default function RedFlagBanner({
  unexplainedWeightLoss,
  bowelBladderDysfunction,
  saddleAnaesthesia,
  nightPain,
  onFlagChange,
  isAcknowledged,
  onAcknowledgeChange,
  decisionNote,
  onDecisionNoteChange,
  interlockError
}: RedFlagBannerProps) {
  const flags = [
    { key: 'unexplainedWeightLoss', title: 'Unexplained Weight Loss', value: unexplainedWeightLoss },
    { key: 'bowelBladderDysfunction', title: 'Bowel or Bladder Dysfunction', value: bowelBladderDysfunction },
    { key: 'saddleAnaesthesia', title: 'Saddle Anaesthesia / Numbness', value: saddleAnaesthesia },
    { key: 'nightPain', title: 'Unrelenting Severe Night Pain', value: nightPain },
  ];

  const hasAnyPositive = Boolean(
    unexplainedWeightLoss === true ||
    bowelBladderDysfunction === true ||
    saddleAnaesthesia === true ||
    nightPain === true
  );

  const isAllAnswered = flags.every(f => f.value !== null);

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Red Flags Screening Questions */}
      <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <div>
          <h4 className="text-base font-serif font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" /> Red Flags Safety Screening
          </h4>
          <p className="text-xs text-white/60 mt-0.5 font-medium">
            Explicit screening for serious underlying pathology. All 4 items require explicit Yes/No selection.
          </p>
        </div>

        <div className="space-y-3">
          {flags.map(f => (
            <div
              key={f.key}
              className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                f.value === true
                  ? 'bg-rose-500/10 border-rose-500/40'
                  : f.value === false
                  ? 'bg-white/5 border-white/10'
                  : 'bg-amber-500/5 border-amber-500/20'
              }`}
            >
              <span className="text-xs font-bold text-white">{f.title}</span>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onFlagChange(f.key, true)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    f.value === true
                      ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                      : 'bg-white/5 text-white/60 hover:text-white border-white/10'
                  }`}
                >
                  YES
                </button>
                <button
                  type="button"
                  onClick={() => onFlagChange(f.key, false)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    f.value === false
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-white/5 text-white/60 hover:text-white border-white/10'
                  }`}
                >
                  NO
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Red Flag Non-Dismissible Safety Interlock Banner */}
      {hasAnyPositive && (
        <div className="p-6 bg-rose-950/60 border-2 border-rose-500/60 rounded-2xl space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/40 text-rose-300 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-200 uppercase tracking-wider">
                Red Flag Safety Interlock Triggered
              </h4>
              <p className="text-xs text-rose-100/80 font-medium leading-relaxed">
                A red flag response was recorded. Document your clinical decision note and acknowledge the finding before completing this assessment.
              </p>
            </div>
          </div>

          {/* Decision Note Input */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Clinician Decision Note *
              </label>
              <DictationButton onTranscript={(txt) => onDecisionNoteChange(decisionNote ? `${decisionNote} ${txt}` : txt)} />
            </div>
            <textarea
              rows={3}
              placeholder="Document your clinical rationale, escalation, or patient management decision..."
              value={decisionNote}
              onChange={(e) => onDecisionNoteChange(e.target.value)}
              className="w-full p-3 bg-black/40 border border-rose-500/40 rounded-xl text-xs text-white placeholder-rose-200/40 focus:border-rose-400 font-medium"
            />
          </div>

          {/* Acknowledgement Checkbox */}
          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="redFlagAck"
              checked={isAcknowledged}
              onChange={(e) => onAcknowledgeChange(e.target.checked)}
              className="h-5 w-5 rounded accent-rose-500 cursor-pointer"
            />
            <label htmlFor="redFlagAck" className="text-xs font-bold text-white cursor-pointer select-none">
              I acknowledge the positive red flag finding and have documented my clinical decision.
            </label>
          </div>
        </div>
      )}

      {interlockError && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-200 font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{interlockError}</span>
        </div>
      )}
    </div>
  );
}
