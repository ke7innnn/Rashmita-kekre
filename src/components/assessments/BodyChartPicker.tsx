'use client';

import React, { useState, useRef } from 'react';
import { bodyConditions, SILHOUETTE_IMAGE_PATH, BodyCondition } from '@/data/bodyData';
import { Check, X, Plus, MapPin, Sparkles, Crosshair, Edit2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectedRegion {
  id: string;
  name: string;
  region: string;
  side: 'LEFT' | 'RIGHT' | 'BILATERAL';
  xPercent?: number;
  yPercent?: number;
  isCustom?: boolean;
  notes?: string;
}

interface BodyChartPickerProps {
  selectedRegions: SelectedRegion[];
  onChange: (regions: SelectedRegion[]) => void;
  title?: string;
}

// Inferred anatomical regions by vertical percentage on the 1024x1024 silhouette
function inferRegion(yPercent: number): string {
  if (yPercent < 12) return 'Head/face';
  if (yPercent < 20) return 'Neck';
  if (yPercent < 33) return 'Shoulders';
  if (yPercent < 45) return 'Upper body';
  if (yPercent < 54) return 'Lower back / Pelvis';
  if (yPercent < 68) return 'Hips/groin';
  if (yPercent < 77) return 'Knees';
  if (yPercent < 87) return 'Legs (lower)';
  return 'Ankles / Feet';
}

const COMMON_JOINT_SUGGESTIONS = [
  { name: 'Acromioclavicular (AC) Joint', region: 'Shoulders', x: 32, y: 19 },
  { name: 'Sacroiliac (SI) Joint', region: 'Lower back / Pelvis', x: 44, y: 49 },
  { name: 'Patellar Tendon (Jumper\'s Knee)', region: 'Knees', x: 50, y: 74 },
  { name: 'Plantar Fascia / Heel Spur', region: 'Ankles / Feet', x: 55, y: 95 },
  { name: 'Anterior Talofibular (ATFL) Ligament', region: 'Ankles / Feet', x: 42, y: 90 },
  { name: 'Subacromial Bursa', region: 'Shoulders', x: 67, y: 22 },
  { name: 'Sternoclavicular Joint', region: 'Shoulders', x: 48, y: 20 },
  { name: 'Biceps Tendon / Groove', region: 'Shoulders', x: 35, y: 24 },
  { name: 'Scaphoid / Wrist TFCC', region: 'Wrists/hands', x: 25, y: 53 },
  { name: 'Greater Trochanter / Hip Bursa', region: 'Hips/groin', x: 37, y: 52 },
  { name: 'Pes Anserine Bursa', region: 'Knees', x: 44, y: 75 },
  { name: 'Peroneal Tendon', region: 'Legs (lower)', x: 58, y: 88 },
  { name: 'Facet Joint Arthrosis', region: 'Lower back / Pelvis', x: 50, y: 44 },
  { name: 'Coccyx / Tailbone Pain', region: 'Lower back / Pelvis', x: 50, y: 52 },
];

export default function BodyChartPicker({
  selectedRegions,
  onChange,
  title = "Pain Site / Radiation Body Chart"
}: BodyChartPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSide, setActiveSide] = useState<'LEFT' | 'RIGHT' | 'BILATERAL'>('BILATERAL');

  // Custom pin creation modal state
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [pinX, setPinX] = useState<number>(50);
  const [pinY, setPinY] = useState<number>(50);
  const [sicknessName, setSicknessName] = useState('');
  const [pinRegion, setPinRegion] = useState('Joints');
  const [pinSide, setPinSide] = useState<'LEFT' | 'RIGHT' | 'BILATERAL'>('BILATERAL');
  const [isCrosshairActive, setIsCrosshairActive] = useState(false);

  const isSelected = (id: string) => selectedRegions.some(r => r.id === id);

  const togglePoint = (condition: BodyCondition) => {
    if (isSelected(condition.id)) {
      onChange(selectedRegions.filter(r => r.id !== condition.id));
    } else {
      onChange([
        ...selectedRegions,
        {
          id: condition.id,
          name: condition.name,
          region: condition.region,
          side: activeSide,
          xPercent: condition.xPercent,
          yPercent: condition.yPercent,
          isCustom: false
        }
      ]);
    }
  };

  const updateSide = (id: string, side: 'LEFT' | 'RIGHT' | 'BILATERAL') => {
    onChange(selectedRegions.map(r => r.id === id ? { ...r, side } : r));
  };

  // Canvas Click Handler: Drop custom pin at exact clicked point
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    // Check if the click directly landed on an existing button marker
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return; // Handled by marker onClick
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(3, Math.min(97, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(3, Math.min(97, Math.round(((e.clientY - rect.top) / rect.height) * 100)));

    // Auto infer side based on X coordinate
    let inferredSide: 'LEFT' | 'RIGHT' | 'BILATERAL' = activeSide;
    if (activeSide === 'BILATERAL') {
      if (x < 46) inferredSide = 'LEFT';
      else if (x > 54) inferredSide = 'RIGHT';
    }

    const inferredReg = inferRegion(y);

    setEditingCustomId(null);
    setPinX(x);
    setPinY(y);
    setPinRegion(inferredReg);
    setPinSide(inferredSide);
    setSicknessName('');
    setCustomModalOpen(true);
    setIsCrosshairActive(false);
  };

  const handleSaveCustomPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sicknessName.trim()) return;

    if (editingCustomId) {
      // Update existing custom pin
      onChange(selectedRegions.map(r => {
        if (r.id === editingCustomId) {
          return {
            ...r,
            name: sicknessName.trim(),
            region: pinRegion,
            side: pinSide,
            xPercent: pinX,
            yPercent: pinY,
          };
        }
        return r;
      }));
    } else {
      // Create new custom pin
      const newPin: SelectedRegion = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: sicknessName.trim(),
        region: pinRegion,
        side: pinSide,
        xPercent: pinX,
        yPercent: pinY,
        isCustom: true
      };
      onChange([...selectedRegions, newPin]);
    }

    setCustomModalOpen(false);
    setEditingCustomId(null);
    setSicknessName('');
  };

  const handleEditCustomPin = (region: SelectedRegion) => {
    setEditingCustomId(region.id);
    setSicknessName(region.name);
    setPinRegion(region.region);
    setPinSide(region.side);
    setPinX(region.xPercent ?? 50);
    setPinY(region.yPercent ?? 50);
    setCustomModalOpen(true);
  };

  // Custom dots already placed in selectedRegions
  const customDots = selectedRegions.filter(r => r.isCustom && r.xPercent !== undefined && r.yPercent !== undefined);

  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4 font-sans relative">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h4 className="text-sm font-serif font-bold text-white flex items-center gap-2">
            {title}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Interactive Pinpoint
            </span>
          </h4>
          <p className="text-[11px] text-white/50 mt-0.5">
            Click anywhere on the body to place a custom joint/sickness pin, or choose predefined points.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Default Side Picker */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <span className="text-[10px] text-white/50 px-1 font-semibold uppercase">Side:</span>
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

          {/* Add Custom Point Button */}
          <button
            type="button"
            onClick={() => {
              setEditingCustomId(null);
              setPinX(50);
              setPinY(50);
              setPinRegion('Joints');
              setPinSide(activeSide);
              setSicknessName('');
              setCustomModalOpen(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Custom Joint</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Body Silhouette Diagram + Selected Regions List */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 items-start">
        {/* Silhouette Interactive Map */}
        <div className="space-y-2">
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            title="Click anywhere to drop a custom condition pin"
            className={`relative w-full max-w-[420px] mx-auto aspect-square bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/15 rounded-2xl overflow-hidden select-none cursor-crosshair shadow-inner group transition-all`}
          >
            {/* Body Silhouette Image */}
            <img
              src={SILHOUETTE_IMAGE_PATH}
              alt="Body Silhouette Diagram"
              className="absolute inset-0 w-full h-full object-contain opacity-85 pointer-events-none select-none"
            />

            {/* Click-to-place visual hint overlay */}
            <div className="absolute top-2 left-2 z-10 px-2.5 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[9px] font-mono text-white/70 pointer-events-none flex items-center gap-1.5">
              <Crosshair className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
              <span>Tap diagram to pin unlisted joint</span>
            </div>

            {/* Standard Predefined Points */}
            {bodyConditions.map((condition) => {
              const selected = isSelected(condition.id);
              return (
                <button
                  key={condition.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePoint(condition);
                  }}
                  title={`${condition.name} (${condition.region})`}
                  style={{
                    top: `${condition.yPercent}%`,
                    left: `${condition.xPercent}%`
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer ${
                    selected
                      ? 'bg-emerald-400 text-black shadow-[0_0_12px_rgba(52,211,153,0.9)] scale-125 z-20 ring-2 ring-emerald-300'
                      : 'bg-white/20 hover:bg-white/40 text-white border border-white/30 z-10 hover:scale-110'
                  }`}
                >
                  {selected ? <Check className="w-3 h-3 stroke-[3]" /> : ''}
                </button>
              );
            })}

            {/* Custom User Placed Dots */}
            {customDots.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCustomPin(r);
                }}
                title={`[Custom] ${r.name} (${r.region} · ${r.side}) - Click to edit`}
                style={{
                  top: `${r.yPercent}%`,
                  left: `${r.xPercent}%`
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer bg-cyan-400 text-black shadow-[0_0_16px_rgba(6,182,212,1)] ring-2 ring-white scale-125 z-30 group/pin animate-pulse hover:scale-150"
              >
                <MapPin className="w-3.5 h-3.5 fill-black stroke-black" />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/90 border border-cyan-400/50 text-[8px] font-bold text-cyan-300 px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-opacity pointer-events-none z-40">
                  {r.name}
                </span>
              </button>
            ))}
          </div>

          <p className="text-[10px] text-center text-white/40 font-mono">
            💡 Green dots = Standard clinical points · Cyan pins = Custom added joints & conditions
          </p>
        </div>

        {/* Selected Regions Tag List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
              Marked Conditions & Joints ({selectedRegions.length})
            </span>
            {selectedRegions.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[10px] text-rose-400 hover:text-rose-300 transition cursor-pointer font-semibold"
              >
                Clear All
              </button>
            )}
          </div>

          {selectedRegions.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-white/10 rounded-xl space-y-2">
              <Crosshair className="w-8 h-8 text-white/30 mx-auto" />
              <p className="text-xs text-white/50 font-medium">
                No pain points selected yet.
              </p>
              <p className="text-[11px] text-white/40">
                Click any existing dot or click anywhere directly on the body diagram to place your own custom joint pin.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {selectedRegions.map((r) => (
                <div
                  key={r.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                    r.isCustom
                      ? 'bg-cyan-500/[0.08] border-cyan-500/30'
                      : 'bg-white/10 border-white/15'
                  }`}
                >
                  <div className="truncate flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white truncate block">{r.name}</span>
                      {r.isCustom && (
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 shrink-0">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/50">
                      <span>{r.region}</span>
                      {r.xPercent !== undefined && r.yPercent !== undefined && (
                        <span className="font-mono text-[9px] text-white/40">
                          ({r.xPercent}%, {r.yPercent}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={r.side}
                      onChange={(e) => updateSide(r.id, e.target.value as any)}
                      className="bg-white/10 border border-white/20 text-[10px] font-bold text-white rounded-lg px-1.5 py-1"
                    >
                      <option value="LEFT" className="bg-[#0B0A10]">Left</option>
                      <option value="RIGHT" className="bg-[#0B0A10]">Right</option>
                      <option value="BILATERAL" className="bg-[#0B0A10]">Bilateral</option>
                    </select>

                    {r.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleEditCustomPin(r)}
                        className="p-1 text-white/50 hover:text-cyan-300 transition cursor-pointer"
                        title="Edit custom point name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onChange(selectedRegions.filter(x => x.id !== r.id))}
                      className="p-1 text-white/40 hover:text-rose-400 transition cursor-pointer"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Joint Suggestions Bar */}
          <div className="pt-3 border-t border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1.5">
              Frequently Missing Joints (1-Tap Add):
            </span>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
              {COMMON_JOINT_SUGGESTIONS.map((sug) => {
                const alreadyAdded = selectedRegions.some(r => r.name.toLowerCase() === sug.name.toLowerCase());
                return (
                  <button
                    key={sug.name}
                    type="button"
                    onClick={() => {
                      if (!alreadyAdded) {
                        const newPin: SelectedRegion = {
                          id: `custom-sug-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
                          name: sug.name,
                          region: sug.region,
                          side: activeSide,
                          xPercent: sug.x,
                          yPercent: sug.y,
                          isCustom: true
                        };
                        onChange([...selectedRegions, newPin]);
                      }
                    }}
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                      alreadyAdded
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 opacity-60'
                        : 'bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-300 border-white/10 hover:border-cyan-500/30'
                    }`}
                  >
                    {alreadyAdded ? '✓ ' : '+ '}{sug.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add or Edit Custom Joint Pin */}
      <AnimatePresence>
        {customModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setCustomModalOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-gradient-to-b from-[#161420] to-[#0D0B14] border border-cyan-500/30 p-6 rounded-3xl shadow-2xl z-[100000] text-left space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl">
                    <MapPin className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-white">
                      {editingCustomId ? 'Edit Custom Joint / Condition' : 'Name This Joint / Condition'}
                    </h3>
                    <p className="text-[10px] text-white/50 font-mono">
                      Pinned at X: {pinX}%, Y: {pinY}%
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveCustomPin} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                    Sickness / Condition / Joint Name *
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Right AC Joint Arthrosis, Left SI Joint Dysfunction..."
                    value={sicknessName}
                    onChange={(e) => setSicknessName(e.target.value)}
                    className="w-full text-sm bg-white/5 border border-cyan-500/40 focus:border-cyan-400 rounded-xl p-3 text-white font-bold outline-none placeholder-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                      Anatomical Region
                    </label>
                    <select
                      value={pinRegion}
                      onChange={(e) => setPinRegion(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 rounded-xl p-2.5 text-xs text-white font-semibold outline-none"
                    >
                      <option value="Head/face" className="bg-[#0B0A10]">Head / Face</option>
                      <option value="Neck" className="bg-[#0B0A10]">Neck / Cervical</option>
                      <option value="Shoulders" className="bg-[#0B0A10]">Shoulders</option>
                      <option value="Upper body" className="bg-[#0B0A10]">Upper Body / Chest</option>
                      <option value="Arms/elbows" className="bg-[#0B0A10]">Arms / Elbows</option>
                      <option value="Wrists/hands" className="bg-[#0B0A10]">Wrists / Hands</option>
                      <option value="Lower back / Pelvis" className="bg-[#0B0A10]">Lower Back / Pelvis / SI</option>
                      <option value="Hips/groin" className="bg-[#0B0A10]">Hips / Groin</option>
                      <option value="Joints" className="bg-[#0B0A10]">Joints</option>
                      <option value="Legs (upper)" className="bg-[#0B0A10]">Legs (Upper) / Thighs</option>
                      <option value="Knees" className="bg-[#0B0A10]">Knees</option>
                      <option value="Legs (lower)" className="bg-[#0B0A10]">Legs (Lower) / Calves</option>
                      <option value="Ankles / Feet" className="bg-[#0B0A10]">Ankles / Feet</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                      Side
                    </label>
                    <div className="flex gap-1">
                      {(['LEFT', 'RIGHT', 'BILATERAL'] as const).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPinSide(s)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition cursor-pointer ${
                            pinSide === s
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {s === 'BILATERAL' ? 'Both' : s === 'LEFT' ? 'L' : 'R'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick chip recommendations */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 block">
                    Tap to set name:
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {[
                      'AC Joint Arthrosis',
                      'Sacroiliac (SI) Joint Strain',
                      'Patellar Tendinopathy',
                      'Plantar Fasciitis',
                      'Bicipital Tendonitis',
                      'Subacromial Bursitis',
                      'Wrist TFCC Sprain',
                      'Greater Trochanter Bursitis',
                      'L5-S1 Facet Syndrome',
                      'ATFL Ankle Sprain',
                      'De Quervain Tenosynovitis',
                      'Hamstring Tendinopathy',
                      'Pes Anserine Bursitis',
                    ].map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setSicknessName(name)}
                        className="text-[9px] px-2 py-0.5 rounded bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-300 border border-white/10 transition cursor-pointer"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setCustomModalOpen(false)}
                    className="px-4 py-2 border border-white/15 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!sicknessName.trim()}
                    className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 shadow-lg shadow-cyan-400/20 flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{editingCustomId ? 'Save Changes' : 'Place Pin & Add'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
