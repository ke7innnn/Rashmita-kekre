'use client';

import React, { useState } from 'react';
import { SPECIAL_TESTS_LIBRARY } from '@/lib/assessments/seedData';
import { Plus, Trash2 } from 'lucide-react';

export interface SpecialTestResultItem {
  id?: string;
  testId?: string;
  testName: string;
  region: string;
  side: 'LEFT' | 'RIGHT' | 'BILATERAL';
  result: 'POSITIVE' | 'NEGATIVE' | 'INCONCLUSIVE' | 'NOT_TESTED';
  note?: string;
}

interface SpecialTestsPickerProps {
  items: SpecialTestResultItem[];
  onChange: (items: SpecialTestResultItem[]) => void;
  selectedRegions?: string[];
}

export default function SpecialTestsPicker({
  items,
  onChange,
  selectedRegions = ['Shoulder', 'Knee', 'Lumbar', 'Cervical']
}: SpecialTestsPickerProps) {
  const [activeRegionFilter, setActiveRegionFilter] = useState<string>(selectedRegions[0] || 'Shoulder');
  const [customTestName, setCustomTestName] = useState('');

  const regionPresets = SPECIAL_TESTS_LIBRARY.filter(t => t.region === activeRegionFilter);

  const addPresetTest = (testName: string) => {
    if (items.some(i => i.testName === testName)) return;
    onChange([
      ...items,
      {
        testName,
        region: activeRegionFilter,
        side: 'BILATERAL',
        result: 'POSITIVE',
        note: '',
      }
    ]);
  };

  const addCustomTest = () => {
    if (!customTestName.trim()) return;
    onChange([
      ...items,
      {
        testName: customTestName.trim(),
        region: activeRegionFilter,
        side: 'BILATERAL',
        result: 'POSITIVE',
        note: '',
      }
    ]);
    setCustomTestName('');
  };

  const updateItem = (index: number, key: keyof SpecialTestResultItem, val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: val };
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 font-sans text-white">
      {/* Region Category Selector */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
            Special Tests Library Filter:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Cervical', 'Shoulder', 'Elbow', 'Wrist/Hand', 'Lumbar', 'Hip', 'Knee', 'Ankle/Foot'].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setActiveRegionFilter(r)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                activeRegionFilter === r
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : 'bg-white/5 text-white/60 hover:text-white border-white/10'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Available Presets */}
        <div className="pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
          {regionPresets.map(t => {
            const isAdded = items.some(i => i.testName === t.name);
            return (
              <button
                key={t.name}
                type="button"
                onClick={() => addPresetTest(t.name)}
                disabled={isAdded}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer border ${
                  isAdded
                    ? 'bg-white/10 text-white/30 border-white/5 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-emerald-500/20 text-white border-white/15'
                }`}
              >
                + {t.name}
              </button>
            );
          })}
        </div>

        {/* Custom Test Input */}
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Add custom orthopedic test name..."
            value={customTestName}
            onChange={(e) => setCustomTestName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTest(); } }}
            className="flex-1 px-3 py-1.5 bg-white/10 border border-white/15 rounded-xl text-xs text-white placeholder-white/40"
          />
          <button
            type="button"
            onClick={addCustomTest}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Add Custom
          </button>
        </div>
      </div>

      {/* Recorded Special Tests Results List */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
          Recorded Special Tests ({items.length})
        </span>

        {items.length === 0 ? (
          <p className="text-xs text-white/40 italic py-6 text-center border border-dashed border-white/10 rounded-xl">
            No special tests recorded yet. Click a test from the library above to add.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-[160px]">
                  <span className="text-[9px] uppercase font-bold text-emerald-400 block">{item.region}</span>
                  <span className="font-bold text-white block">{item.testName}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 flex-1">
                  {/* Side */}
                  <select
                    value={item.side}
                    onChange={(e) => updateItem(idx, 'side', e.target.value)}
                    className="bg-white/10 border border-white/20 text-xs font-bold text-white rounded-xl px-2 py-1.5"
                  >
                    <option value="LEFT" className="bg-[#0B0A10]">Left</option>
                    <option value="RIGHT" className="bg-[#0B0A10]">Right</option>
                    <option value="BILATERAL" className="bg-[#0B0A10]">Bilateral</option>
                  </select>

                  {/* Result */}
                  <select
                    value={item.result}
                    onChange={(e) => updateItem(idx, 'result', e.target.value)}
                    className={`text-xs font-bold rounded-xl px-3 py-1.5 border transition ${
                      item.result === 'POSITIVE'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : item.result === 'NEGATIVE'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-white/10 text-white/70 border-white/20'
                    }`}
                  >
                    <option value="POSITIVE" className="bg-[#0B0A10] text-rose-300">Positive (+)</option>
                    <option value="NEGATIVE" className="bg-[#0B0A10] text-emerald-300">Negative (-)</option>
                    <option value="INCONCLUSIVE" className="bg-[#0B0A10] text-amber-300">Inconclusive</option>
                    <option value="NOT_TESTED" className="bg-[#0B0A10] text-white/50">Not Tested</option>
                  </select>

                  {/* Note */}
                  <input
                    type="text"
                    placeholder="Findings / degree of reproduction..."
                    value={item.note || ''}
                    onChange={(e) => updateItem(idx, 'note', e.target.value)}
                    className="flex-1 min-w-[140px] px-3 py-1.5 bg-white/10 border border-white/15 rounded-xl text-xs text-white placeholder-white/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="p-1.5 text-white/40 hover:text-rose-400 transition cursor-pointer self-end md:self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
