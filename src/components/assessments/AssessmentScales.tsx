'use client';

import React, { useState } from 'react';
import { ClipboardList, Play, X, ArrowLeft, Search } from 'lucide-react';
import { SCALES, CATEGORIES, ScaleDefinition } from './scaleDefinitions';

interface AssessmentScalesProps {
  value: string | null;
  onChange: (scalesJson: string) => void;
  previousAssessments?: any[];
}

export default function AssessmentScales({ value, onChange, previousAssessments = [] }: AssessmentScalesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeScale, setActiveScale] = useState<ScaleDefinition | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const toggleChecklistItem = (questionId: string, itemValue: any) => {
    setAnswers(prev => {
      const currentList = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const newList = currentList.includes(itemValue)
        ? currentList.filter((x: any) => x !== itemValue)
        : [...currentList, itemValue];
      return { ...prev, [questionId]: newList };
    });
  };

  // Parse current scales from assessment state
  let currentScalesList: any[] = [];
  try {
    if (value) {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) currentScalesList = parsed;
    }
  } catch (e) {}

  // Find previous scores for a scale ID
  const getPreviousScaleRecord = (scaleId: string) => {
    for (const past of previousAssessments) {
      if (past.scalesJson) {
        try {
          const list = JSON.parse(past.scalesJson);
          if (Array.isArray(list)) {
            const found = list.find((s: any) => s?.scaleId === scaleId);
            if (found) {
              return {
                score: found.score,
                maxScore: found.maxScore,
                interpretation: found.interpretation,
                date: new Date(past.assessmentDate || past.createdAt).toLocaleDateString()
              };
            }
          }
        } catch (e) {}
      }
    }
    return null;
  };

  const handleStartScale = (scale: ScaleDefinition) => {
    const existing = currentScalesList.find(s => s.scaleId === scale.id);
    const initialAnswers: Record<string, any> = {};
    scale.questions.forEach(q => {
      initialAnswers[q.id] = existing?.answers?.[q.id] ?? q.defaultValue ?? '';
    });
    setAnswers(initialAnswers);
    setActiveScale(scale);
  };

  const handleSaveScale = () => {
    if (!activeScale) return;
    const { score, maxScore, percent } = activeScale.calculateScore(answers);
    const interpretation = activeScale.getInterpretation(score, percent);

    const scaleRecord = {
      scaleId: activeScale.id,
      name: activeScale.name,
      score,
      maxScore,
      percent,
      interpretation,
      answers,
      completedAt: new Date().toISOString()
    };

    const nextList = currentScalesList.filter(s => s.scaleId !== activeScale.id);
    nextList.push(scaleRecord);

    onChange(JSON.stringify(nextList));
    setActiveScale(null);
  };

  const handleClearScale = (scaleId: string) => {
    const nextList = currentScalesList.filter(s => s.scaleId !== scaleId);
    onChange(JSON.stringify(nextList));
  };

  const filteredScales = SCALES.filter(s => {
    const matchesCategory = selectedCategory === 'All' || s.categories.includes(selectedCategory);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      s.name.toLowerCase().includes(q) || 
      s.id.toLowerCase().includes(q) || 
      s.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  if (activeScale) {
    const currentCalculation = activeScale.calculateScore(answers);
    return (
      <div className="space-y-6 text-xs text-white">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveScale(null)}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-sm font-bold text-white">{activeScale.name}</h3>
            <p className="text-[10px] text-white/50">{activeScale.description}</p>
          </div>
        </div>

        {/* Real-time score calculator preview bar */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex justify-between items-center">
          <span className="font-bold text-emerald-400">Current Calculated Score:</span>
          <span className="text-sm font-serif font-bold text-white">
            {currentCalculation.score}
            {currentCalculation.maxScore ? ` / ${currentCalculation.maxScore}` : ''}
            {currentCalculation.percent !== undefined ? ` (${currentCalculation.percent}%)` : ''}
          </span>
        </div>

        {/* Dynamic Questionnaire Form */}
        <div className="space-y-4">
          {activeScale.questions.map((q) => (
            <div key={q.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
              <label className="text-[11px] font-bold text-white/80 block">{q.text}</label>
              
              {q.type === 'radio' && q.options && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        answers[q.id] === opt.value
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-white/10 text-white/60 border-white/15 hover:bg-white/15'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'select' && q.options && (
                <select
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-bold"
                >
                  <option value="" className="bg-[#0B0A10]">-- Select Choice --</option>
                  {q.options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#0B0A10]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {q.type === 'slider' && (
                <div className="space-y-1">
                  <input
                    type="range"
                    min={q.min ?? 0}
                    max={q.max ?? 100}
                    value={answers[q.id] ?? q.defaultValue ?? 0}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: Number(e.target.value) }))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/40 font-mono">
                    <span>Min: {q.min ?? 0}</span>
                    <span className="text-emerald-400 font-bold">Selected: {answers[q.id] ?? q.defaultValue ?? 0}</span>
                    <span>Max: {q.max ?? 100}</span>
                  </div>
                </div>
              )}

              {q.type === 'number' && (
                <input
                  type="number"
                  placeholder={q.placeholder}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-bold"
                />
              )}

              {q.type === 'text' && (
                <input
                  type="text"
                  placeholder={q.placeholder}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-white"
                />
              )}

              {q.type === 'checklist' && q.options && (
                <div className="space-y-1.5 pt-1">
                  {q.options.map((opt) => {
                    const isChecked = Array.isArray(answers[q.id]) && answers[q.id].includes(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className="flex items-start gap-2.5 p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl cursor-pointer transition select-none text-left"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChecklistItem(q.id, opt.value)}
                          className="mt-0.5 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500/50"
                        />
                        <span className="text-[11px] text-white/85 font-semibold leading-normal">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveScale(null)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveScale}
            className="px-6 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500/60 font-bold transition cursor-pointer shadow-sm"
          >
            Save & Finish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs text-white">
      {/* Search and Category Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search assessment scales (e.g. Roland-Morris, Oswestry, DASH, LEFS, SPADI)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
            Filter by Body Region / Condition:
          </label>
          <div className="flex overflow-x-auto whitespace-nowrap gap-1.5 pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/10 text-white/60 border-white/15 hover:bg-white/15'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of outcomes scales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredScales.map((scale) => {
          const completed = currentScalesList.find(s => s.scaleId === scale.id);
          const previous = getPreviousScaleRecord(scale.id);

          return (
            <div
              key={scale.id}
              className={`p-4 rounded-2xl border transition duration-200 flex flex-col justify-between ${
                completed
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-emerald-950/20'
                  : 'bg-white/5 border-white/10 hover:border-white/25'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-white text-xs">{scale.name}</h4>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      Regions: {scale.categories.filter(c => c !== 'All').join(', ')}
                    </p>
                  </div>
                  {completed && (
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                      Completed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/50 leading-normal">{scale.description}</p>

                {/* Score & details display if completed */}
                {completed && (
                  <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl space-y-1.5 animate-fade-in">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white/60">Current Score:</span>
                      <span className="font-bold text-emerald-400 font-serif">
                        {completed.score}
                        {completed.maxScore ? ` / ${completed.maxScore}` : ''}
                        {completed.percent !== undefined ? ` (${completed.percent}%)` : ''}
                      </span>
                    </div>
                    {completed.interpretation && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-medium text-white/40">Interpretation:</span>
                        <span className="font-semibold text-white/80">{completed.interpretation}</span>
                      </div>
                    )}

                    {/* Comparison with previous */}
                    {previous && (
                      <div className="mt-2 pt-2 border-t border-white/5 space-y-1 font-serif text-[10px]">
                        <div className="flex justify-between text-white/50">
                          <span>Previous ({previous.date}):</span>
                          <span>
                            {previous.score}
                            {previous.maxScore ? `/${previous.maxScore}` : ''}
                          </span>
                        </div>
                        {typeof completed.score === 'number' && typeof previous.score === 'number' && (
                          <div className="flex justify-between">
                            <span>Change:</span>
                            {(() => {
                              const diff = completed.score - previous.score;
                              let isImprovement = false;
                              let isWorse = false;
                              if (scale.scoreDirection === 'lower_better') {
                                isImprovement = diff < 0;
                                isWorse = diff > 0;
                              } else if (scale.scoreDirection === 'higher_better') {
                                isImprovement = diff > 0;
                                isWorse = diff < 0;
                              }
                              const statusText = isImprovement ? 'Improved' : isWorse ? 'Worse' : 'No change';
                              const statusClass = isImprovement ? 'text-emerald-400 font-bold' : isWorse ? 'text-rose-400' : 'text-white/60';
                              return (
                                <span className={statusClass}>
                                  {diff > 0 ? '+' : ''}{diff} points ({statusText})
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Show only previous score if not yet completed today */}
                {!completed && previous && (
                  <div className="mt-2 text-[10px] text-white/40 font-serif">
                    Last Score ({previous.date}): <span className="text-white/70">{previous.score}{previous.maxScore ? `/${previous.maxScore}` : ''}</span> {previous.interpretation && `(${previous.interpretation})`}
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStartScale(scale)}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-white font-bold border border-white/15 transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                >
                  <Play className="w-3 h-3 text-emerald-400" />
                  {completed ? 'Re-take Scale' : 'Start Assessment'}
                </button>

                {completed && (
                  <button
                    type="button"
                    onClick={() => handleClearScale(scale.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 border border-white/15 hover:border-red-500/30 transition cursor-pointer"
                    title="Remove outcome"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
