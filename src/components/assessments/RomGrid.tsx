'use client';

import React, { useState } from 'react';
import { NORMATIVE_ROM_PRESETS } from '@/lib/assessments/seedData';
import { Plus, Trash2, X, Sparkles } from 'lucide-react';

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

const DEFAULT_REGION_PRESETS = [
  'Cervical', 'Thoracic', 'Lumbar', 'Shoulder', 'Elbow', 'Wrist/Hand',
  'Fingers/Thumb', 'Hip', 'Knee', 'Ankle/Foot', 'TMJ', 'Toes'
];

export default function RomGrid({ items, onChange, baselineItems }: RomGridProps) {
  const [customRegions, setCustomRegions] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');

  const allPresets = [...DEFAULT_REGION_PRESETS, ...customRegions];

  const addCustomRegion = () => {
    const trimmed = customInputValue.trim();
    if (!trimmed) return;

    // Add to custom region presets if not already present
    if (!allPresets.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
      setCustomRegions(prev => [...prev, trimmed]);
    }

    // Immediately populate/add row for this custom body part into the grid
    populatePreset(trimmed);

    setCustomInputValue('');
    setShowCustomInput(false);
  };

  const removeCustomRegion = (region: string) => {
    setCustomRegions(prev => prev.filter(r => r.toLowerCase() !== region.toLowerCase()));
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomRegion();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomInputValue('');
    }
  };

  const populatePreset = (region: string) => {
    const presets = NORMATIVE_ROM_PRESETS.filter(
      p => p.region.trim().toLowerCase() === region.trim().toLowerCase()
    );

    let newItems: RomItem[];
    if (presets.length > 0) {
      // Known region with normative presets
      newItems = presets.map(p => ({
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
    } else {
      // Custom body part — add an initial row ready for documentation
      newItems = [{
        region,
        movement: 'Flexion',
        aromRight: null,
        aromLeft: null,
        promRight: null,
        promLeft: null,
        mmtRight: null,
        mmtLeft: null,
        painOnMovement: false,
      }];
    }

    // Merge without duplicating exact existing region+movement combinations
    const existingKeys = new Set(
      items.map(i => `${i.region.trim().toLowerCase()}--${i.movement.trim().toLowerCase()}`)
    );
    const filteredNew = newItems.filter(
      i => !existingKeys.has(`${i.region.trim().toLowerCase()}--${i.movement.trim().toLowerCase()}`)
    );

    // If all were duplicates (e.g. clicked again on custom region), add a new movement row
    if (filteredNew.length === 0 && newItems.length > 0) {
      onChange([
        ...items,
        {
          region: region,
          movement: '',
          aromRight: null,
          aromLeft: null,
          promRight: null,
          promLeft: null,
          mmtRight: null,
          mmtLeft: null,
          painOnMovement: false,
        }
      ]);
    } else {
      onChange([...items, ...filteredNew]);
    }
  };

  const updateItem = (index: number, key: keyof RomItem, val: any) => {
    const next = [...items];
    next[index] = { ...next[index], [key]: val };
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItemRow = (defaultRegion?: string) => {
    const lastRegion = items.length > 0 ? items[items.length - 1].region : '';
    const initialRegion = defaultRegion !== undefined ? defaultRegion : (lastRegion || '');

    onChange([
      ...items,
      {
        region: initialRegion,
        movement: '',
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
    if (!region || !movement) return null;
    const found = NORMATIVE_ROM_PRESETS.find(
      p => p.region.trim().toLowerCase() === region.trim().toLowerCase() &&
           p.movement.trim().toLowerCase() === movement.trim().toLowerCase()
    );
    return found ? found.normalDegrees : null;
  };

  const calcPercentage = (val: number | null, norm: number | null) => {
    if (val === null || norm === null || norm === 0) return null;
    return Math.round((val / norm) * 100);
  };

  const getBaselineMatch = (region: string, movement: string) => {
    if (!baselineItems || !region || !movement) return null;
    return baselineItems.find(
      b => b.region.trim().toLowerCase() === region.trim().toLowerCase() &&
           b.movement.trim().toLowerCase() === movement.trim().toLowerCase()
    );
  };

  return (
    <div className="space-y-4 font-sans text-white">
      {/* Autocomplete Datalists for Quick Suggestions & Custom Input */}
      <datalist id="rom-region-suggestions">
        {allPresets.map(r => (
          <option key={r} value={r} />
        ))}
        <option value="Fingers" />
        <option value="Thumb" />
        <option value="Index Finger" />
        <option value="Middle Finger" />
        <option value="Ring Finger" />
        <option value="Little Finger" />
        <option value="MCP Joints" />
        <option value="PIP Joints" />
        <option value="DIP Joints" />
        <option value="Forearm" />
        <option value="Pelvis / SI Joint" />
        <option value="Ribs / Thorax" />
        <option value="Toes" />
        <option value="Great Toe (MTP)" />
        <option value="C1-C2 Cervical" />
        <option value="Scapulothoracic" />
      </datalist>

      <datalist id="rom-movement-suggestions">
        <option value="Flexion" />
        <option value="Extension" />
        <option value="Abduction" />
        <option value="Adduction" />
        <option value="Internal Rotation" />
        <option value="External Rotation" />
        <option value="Pronation" />
        <option value="Supination" />
        <option value="Lateral Flexion Right" />
        <option value="Lateral Flexion Left" />
        <option value="Rotation Right" />
        <option value="Rotation Left" />
        <option value="Radial Deviation" />
        <option value="Ulnar Deviation" />
        <option value="Dorsiflexion" />
        <option value="Plantarflexion" />
        <option value="Inversion" />
        <option value="Eversion" />
        <option value="MCP Flexion" />
        <option value="MCP Extension" />
        <option value="PIP Flexion" />
        <option value="DIP Flexion" />
        <option value="Thumb Flexion" />
        <option value="Thumb Extension" />
        <option value="Thumb Abduction" />
        <option value="Thumb Opposition" />
        <option value="Opening (Depression)" />
        <option value="Protrusion" />
        <option value="MTP Flexion" />
        <option value="MTP Extension" />
        <option value="IP Flexion" />
        <option value="Elevation" />
        <option value="Depression" />
        <option value="Circumduction" />
      </datalist>

      {/* Region Presets Header Bar */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
            Quick Auto-Populate Region Presets:
          </span>
          <span className="text-[10px] text-emerald-400/80 font-medium">
            ✨ Click any preset or add custom body parts (e.g. Fingers, Thumb, SI Joint)
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {DEFAULT_REGION_PRESETS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => populatePreset(r)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-xs font-bold text-white border border-white/15 transition cursor-pointer"
            >
              + {r}
            </button>
          ))}

          {/* Custom region buttons */}
          {customRegions.map(r => (
            <span key={r} className="inline-flex items-center gap-0">
              <button
                type="button"
                onClick={() => populatePreset(r)}
                className="px-3 py-1.5 rounded-l-xl bg-amber-500/20 hover:bg-amber-500/30 text-xs font-bold text-amber-300 border border-amber-400/30 transition cursor-pointer"
              >
                + {r}
              </button>
              <button
                type="button"
                onClick={() => removeCustomRegion(r)}
                className="px-1.5 py-1.5 rounded-r-xl bg-amber-500/10 hover:bg-red-500/20 text-amber-400/60 hover:text-red-400 border border-l-0 border-amber-400/30 transition cursor-pointer"
                title={`Remove preset ${r}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {/* Add Custom button / input */}
          {showCustomInput ? (
            <div className="inline-flex items-center gap-1">
              <input
                type="text"
                value={customInputValue}
                list="rom-region-suggestions"
                onChange={(e) => setCustomInputValue(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                onBlur={() => { if (!customInputValue.trim()) setShowCustomInput(false); }}
                placeholder="e.g. Fingers, Thumb, Ribs…"
                autoFocus
                className="w-44 px-3 py-1.5 rounded-xl bg-white/10 border border-emerald-400/60 text-xs font-bold text-white placeholder-white/30 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition"
              />
              <button
                type="button"
                onClick={addCustomRegion}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-400/30 text-xs font-bold transition cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setShowCustomInput(false); setCustomInputValue(''); }}
                className="px-1.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 text-xs transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-dashed border-white/20 hover:border-emerald-400/40 text-xs font-bold text-white/40 hover:text-emerald-400 transition cursor-pointer flex items-center gap-1"
            >
              <Plus size={13} /> Custom Body Part
            </button>
          )}
        </div>
      </div>

      {/* Repeating ROM/MMT Grid Table */}
      {items.length === 0 ? (
        <div className="p-8 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl text-xs text-white/40 space-y-3">
          <p className="text-white/60 font-medium">No ROM or MMT measurements added yet.</p>
          <p className="text-[11px] text-white/30">
            Tap any region preset above (such as <strong className="text-emerald-400/80">Fingers/Thumb</strong>, <strong className="text-emerald-400/80">Shoulder</strong>, or <strong className="text-emerald-400/80">+ Custom Body Part</strong>) or click the button below to add custom rows.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => addItemRow('')}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Movement Row
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/10 text-[10px] uppercase font-bold tracking-wider text-white/60">
              <tr>
                <th className="p-3 min-w-[200px]">Region & Movement</th>
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
                    {/* Editable Region & Movement Inputs */}
                    <td className="p-3 space-y-1 min-w-[200px]">
                      <div>
                        <input
                          type="text"
                          list="rom-region-suggestions"
                          value={item.region}
                          onChange={(e) => updateItem(idx, 'region', e.target.value)}
                          placeholder="BODY PART / REGION"
                          className="w-full px-2 py-1 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-emerald-400/80 rounded-lg text-[10px] font-bold uppercase tracking-wider text-emerald-400 placeholder-emerald-400/40 focus:outline-none transition"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          list="rom-movement-suggestions"
                          value={item.movement}
                          onChange={(e) => updateItem(idx, 'movement', e.target.value)}
                          placeholder="Movement (e.g. Flexion)"
                          className="w-full px-2 py-1 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-emerald-400/80 rounded-lg text-xs font-semibold text-white placeholder-white/30 focus:outline-none transition"
                        />
                      </div>
                    </td>

                    {/* Normative Reference */}
                    <td className="p-3 font-mono text-white/40">
                      {norm !== null ? `${norm}°` : '—'}
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
                      {(aromRNormPct !== null || aromLNormPct !== null) && (
                        <div className="text-[9px] font-mono text-emerald-400/80 space-y-0.5 mt-0.5">
                          {aromRNormPct !== null && <div>R: {aromRNormPct}% of norm</div>}
                          {aromLNormPct !== null && <div>L: {aromLNormPct}% of norm</div>}
                        </div>
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

                    {/* Action buttons */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => addItemRow(item.region)}
                          title={`Add another movement row for ${item.region || 'this region'}`}
                          className="p-1.5 text-white/40 hover:text-emerald-400 hover:bg-white/10 rounded-lg transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          title="Delete row"
                          className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-[11px] text-white/40 italic">
          💡 You can edit body parts and movement names directly in any row, or add custom parts above.
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addItemRow()}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/15 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Custom Movement Row
          </button>
        </div>
      </div>
    </div>
  );
}
