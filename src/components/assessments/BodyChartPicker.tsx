'use client';

import React, { useState } from 'react';
import { bodyConditions, SILHOUETTE_IMAGE_PATH, BodyCondition } from '@/data/bodyData';
import { Check, X } from 'lucide-react';

export interface SelectedRegion {
  id: string;
  name: string;
  region: string;
  side: 'LEFT' | 'RIGHT' | 'BILATERAL';
}

interface BodyChartPickerProps {
  selectedRegions: SelectedRegion[];
  onChange: (regions: SelectedRegion[]) => void;
  title?: string;
}

export default function BodyChartPicker({
  selectedRegions,
  onChange,
  title = "Pain Site / Radiation Body Chart"
}: BodyChartPickerProps) {
  const [activeSide, setActiveSide] = useState<'LEFT' | 'RIGHT' | 'BILATERAL'>('BILATERAL');

  const isSelected = (id: string) => selectedRegions.some(r => r.id === id);

  const togglePoint = (condition: BodyCondition) => {
    if (isSelected(condition.id)) {
      onChange(selectedRegions.filter(r => r.id !== condition.id));
    } else {
      onChange([
        ...selectedRegions,
        { id: condition.id, name: condition.name, region: condition.region, side: activeSide }
      ]);
    }
  };

  const updateSide = (id: string, side: 'LEFT' | 'RIGHT' | 'BILATERAL') => {
    onChange(selectedRegions.map(r => r.id === id ? { ...r, side } : r));
  };

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <h4 className="text-sm font-serif font-bold text-white">{title}</h4>
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          <span className="text-[10px] text-white/50 px-1 font-semibold uppercase">Default Side:</span>
          {(['LEFT', 'RIGHT', 'BILATERAL'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveSide(s)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                activeSide === s
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-white/60 hover:text-white border border-transparent'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start">
        {/* Silhouette Interactive Map — square aspect to match the 1024×1024 image */}
        <div className="relative w-full max-w-[420px] mx-auto aspect-square bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 rounded-2xl overflow-hidden">
          <img
            src={SILHOUETTE_IMAGE_PATH}
            alt="Body Silhouette Diagram"
            className="absolute inset-0 w-full h-full object-contain opacity-80 pointer-events-none select-none"
          />
          {bodyConditions.map((condition) => {
            const selected = isSelected(condition.id);
            return (
              <button
                key={condition.id}
                type="button"
                onClick={() => togglePoint(condition)}
                title={`${condition.name} (${condition.region})`}
                style={{
                  top: `${condition.yPercent}%`,
                  left: `${condition.xPercent}%`
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer ${
                  selected
                    ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.8)] scale-125 z-20 ring-2 ring-emerald-300'
                    : 'bg-white/20 hover:bg-white/40 text-white border border-white/30 z-10'
                }`}
              >
                {selected ? <Check className="w-3 h-3 stroke-[3]" /> : ''}
              </button>
            );
          })}
        </div>

        {/* Selected Regions Tag List */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
            Selected Pain Regions ({selectedRegions.length})
          </span>
          {selectedRegions.length === 0 ? (
            <p className="text-xs text-white/40 italic py-6 text-center border border-dashed border-white/10 rounded-xl">
              Tap points on the body diagram to mark pain sites or radiation paths.
            </p>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {selectedRegions.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 bg-white/10 border border-white/15 rounded-xl flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{r.name}</span>
                    <span className="text-[10px] text-white/50">{r.region}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={r.side}
                      onChange={(e) => updateSide(r.id, e.target.value as any)}
                      className="bg-white/10 border border-white/20 text-[10px] font-bold text-white rounded-lg px-1.5 py-1"
                    >
                      <option value="LEFT" className="bg-[#0B0A10]">Left</option>
                      <option value="RIGHT" className="bg-[#0B0A10]">Right</option>
                      <option value="BILATERAL" className="bg-[#0B0A10]">Bilateral</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => onChange(selectedRegions.filter(x => x.id !== r.id))}
                      className="p-1 text-white/40 hover:text-rose-400 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
