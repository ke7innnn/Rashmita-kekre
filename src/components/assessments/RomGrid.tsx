'use client';

import React from 'react';
import { NORMATIVE_ROM_PRESETS } from '@/lib/assessments/seedData';
import { Plus, Trash2, RotateCcw } from 'lucide-react';

export interface RomItem {
  id?: string;
  region: string;
  movement: string;
  aromRight: number | null;
  aromLeft: number | null;
  promRight: number | null;
  promLeft: number | null;
  mmtRight: number | null;
  mmtLeft: number | null;
  painOnMovement: boolean;
}

interface RomGridProps {
  items: RomItem[];
  onChange: (items: RomItem[]) => void;
  baselineItems?: RomItem[]; // Passed during reassessment for side-by-side comparison
}

const REGION_PRESETS = [
  'Cervical', 'Shoulder', 'Elbow', 'Wrist/Hand',
  'Lumbar', 'Hip', 'Knee', 'Ankle/Foot'
];

export default function RomGrid({ items, onChange, baselineItems }: RomGridProps) {
  const populatePreset = (region: string) => {
    const presets = NORMATIVE_ROM_PRESETS.filter(p => p.region === region);
    const newItems: RomItem[] = presets.map(p => ({
      region: p.region,
      movement: p.movement,
      aromRight: null,
      aromLeft: null,
      promRight: null,
      promLeft: null,
      mmtRight: null,
      mmtLeft: null,
      painOnMovement: false,
    }));

    // Merge without duplicating existing movements
    const existingKeys = new Set(items.map(i => `${i.region}-${i.movement}`));
    const filteredNew = newItems.filter(i => !existingKeys.has(`${i.region}-${i.movement}`));
    onChange([...items, ...filteredNew]);
  };

  const updateItem = (index: number, key: keyof RomItem, val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: val };
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItemRow = () => {
    onChange([
      ...items,
      {
        region: 'Shoulder',
        movement: 'Flexion',
        aromRight: null,
        aromLeft: null,
        promRight: null,
        promLeft: null,
        mmtRight: null,
        mmtLeft: null,
        painOnMovement: false,
      }
    ]);
  };

  const getNormative = (region: string, movement: string) => {
    const found = NORMATIVE_ROM_PRESETS.find(p => p.region === region && p.movement === movement);
    return found ? found.normalDegrees : null;
  };

  const calcPercentage = (val: number | null, norm: number | null) => {
    if (val === null || norm === null || norm === 0) return null;
    return Math.round((val / norm) * 100);
  };

  const getBaselineMatch = (region: string, movement: string) => {
    if (!baselineItems) return null;
    return baselineItems.find(b => b.region === region && b.movement === movement);
  };

  return (
    <div className="space-y-4 font-sans text-white">
      {/* Region Presets Header Bar */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
          Quick Auto-Populate Region Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {REGION_PRESETS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => populatePreset(r)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-xs font-bold text-white border border-white/15 transition cursor-pointer"
            >
              + {r}
            </button>
          ))}
        </div>
      </div>

      {/* Repeating ROM/MMT Grid Table */}
      {items.length === 0 ? (
        <div className="p-8 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl text-xs text-white/40 space-y-2">
          <p>No ROM or MMT measurements added yet.</p>
          <p className="text-[11px] text-white/30">Tap a region preset above to populate standard joint movements.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/10 text-[10px] uppercase font-bold tracking-wider text-white/60">
              <tr>
                <th className="p-3">Region & Movement</th>
                <th className="p-3">Norm</th>
                <th className="p-3">AROM R / L (°)</th>
                <th className="p-3">PROM R / L (°)</th>
                <th className="p-3">MMT R / L (0–5)</th>
                <th className="p-3 text-center">Pain</th>
                {baselineItems && <th className="p-3 text-emerald-400">Baseline Delta</th>}
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {items.map((item, idx) => {
                const norm = getNormative(item.region, item.movement);
                const aromRNormPct = calcPercentage(item.aromRight, norm);
                const aromLNormPct = calcPercentage(item.aromLeft, norm);
                const baseline = getBaselineMatch(item.region, item.movement);

                return (
                  <tr key={idx} className="hover:bg-white/[0.04] transition">
                    <td className="p-3 space-y-0.5 min-w-[140px]">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">{item.region}</span>
                      <span className="font-bold text-white block">{item.movement}</span>
                    </td>

                    <td className="p-3 font-mono text-white/40">
                      {norm ? `${norm}°` : '—'}
                    </td>

                    {/* AROM R / L */}
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="R°"
                          value={item.aromRight ?? ''}
                          onChange={(e) => updateItem(idx, 'aromRight', e.target.value !== '' ? Number(e.target.value) : null)}
                          className="w-12 px-1.5 py-1 bg-white/10 border border-white/20 rounded-lg font-mono text-xs text-white text-center"
                        />
                        <span className="text-white/30">/</span>
                        <input
                          type="number"
                          placeholder="L°"
                          value={item.aromLeft ?? ''}
                          onChange={(e) => updateItem(idx, 'aromLeft', e.target.value !== '' ? Number(e.target.value) : null)}
                          className="w-12 px-1.5 py-1 bg-white/10 border border-white/20 rounded-lg font-mono text-xs text-white text-center"
                        />
                      </div>
                      {aromRNormPct !== null && (
                        <span className="text-[9px] font-mono text-emerald-400/80 block mt-0.5">
                          R: {aromRNormPct}% of norm
                        </span>
                      )}
                    </td>

                    {/* PROM R / L */}
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder="R°"
                          value={item.promRight ?? ''}
                          onChange={(e) => updateItem(idx, 'promRight', e.target.value !== '' ? Number(e.target.value) : null)}
                          className="w-12 px-1.5 py-1 bg-white/10 border border-white/20 rounded-lg font-mono text-xs text-white text-center"
                        />
                        <span className="text-white/30">/</span>
                        <input
                          type="number"
                          placeholder="L°"
                          value={item.promLeft ?? ''}
                          onChange={(e) => updateItem(idx, 'promLeft', e.target.value !== '' ? Number(e.target.value) : null)}
                          className="w-12 px-1.5 py-1 bg-white/10 border border-white/20 rounded-lg font-mono text-xs text-white text-center"
                        />
                      </div>
                    </td>

                    {/* MMT R / L */}
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="5"
                          placeholder="R"
                          value={item.mmtRight ?? ''}
                          onChange={(e) => updateItem(idx, 'mmtRight', e.target.value !== '' ? Number(e.target.value) : null)}
                          className="w-10 px-1 py-1 bg-white/10 border border-white/20 rounded-lg font-mono text-xs text-white text-center"
                        />
                        <span className="text-white/30">/</span>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          placeholder="L"
                          value={item.mmtLeft ?? ''}
                          onChange={(e) => updateItem(idx, 'mmtLeft', e.target.value !== '' ? Number(e.target.value) : null)}
                          className="w-10 px-1 py-1 bg-white/10 border border-white/20 rounded-lg font-mono text-xs text-white text-center"
                        />
                      </div>
                    </td>

                    {/* Pain on movement */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={item.painOnMovement}
                        onChange={(e) => updateItem(idx, 'painOnMovement', e.target.checked)}
                        className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                      />
                    </td>

                    {/* Baseline Delta comparison during reassessment */}
                    {baselineItems && (
                      <td className="p-3 font-mono text-[11px] text-emerald-300">
                        {baseline ? (
                          <div>
                            <div>R: {baseline.aromRight ?? '—'}° → {item.aromRight ?? '—'}°</div>
                            <div>L: {baseline.aromLeft ?? '—'}° → {item.aromLeft ?? '—'}°</div>
                          </div>
                        ) : 'New'}
                      </td>
                    )}

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-1.5 text-white/40 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={addItemRow}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/15"
        >
          <Plus className="w-3.5 h-3.5" /> Add Custom Movement Row
        </button>
      </div>
    </div>
  );
}
