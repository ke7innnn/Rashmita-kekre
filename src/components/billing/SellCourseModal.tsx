'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface TreatmentPlanItem {
  id: string;
  name: string;
  description: string;
  packageRate: number | string;
  perSessionRate: number | string;
}

interface SellCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  onSuccess: () => void;
}

import CountUpNumber from './CountUpNumber';

export default function SellCourseModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  onSuccess
}: SellCourseModalProps) {
  const [plans, setPlans] = useState<TreatmentPlanItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [daysPurchased, setDaysPurchased] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
        if (data.length > 0) {
          setSelectedPlanId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch plans', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const ratePerDay = selectedPlan ? Number(selectedPlan.packageRate) : 0;
  const totalAmount = ratePerDay * daysPurchased;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || daysPurchased <= 0) {
      setError('Please select a valid plan and days');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/billing/patients/${patientId}/packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          daysPurchased,
          createInvoice: true
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to sell course package');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error selling course package');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0F0D16] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white" />
                Sell Treatment Course
              </h3>
              <p className="text-xs text-white/50 mt-0.5">{patientName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-white/50 text-sm">
              Loading treatment plans...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Plan Picker Tiers */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">Select Treatment Plan</label>
                <div className="grid grid-cols-2 gap-2">
                  {plans.map((plan) => {
                    const isSelected = plan.id === selectedPlanId;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-white/15 border-white shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">{plan.name}</span>
                            {isSelected && <Check className="w-4 h-4 text-white" />}
                          </div>
                          <p className="text-[11px] text-white/50 mt-1 line-clamp-1">{plan.description}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-baseline justify-between">
                          <span className="text-[10px] text-white/40 uppercase font-semibold">Course Rate</span>
                          <span className="text-xs font-bold text-white tabular-nums">
                            {formatCurrency(plan.packageRate)}/day
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Course Days Counter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-white/70">Number of Days</label>
                  <div className="flex gap-1">
                    {[5, 10, 15, 20].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDaysPurchased(d)}
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border transition ${
                          daysPurchased === d
                            ? 'bg-white/20 border-white text-white'
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={daysPurchased}
                  onChange={(e) => setDaysPurchased(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-white rounded-xl px-3 py-2 text-base font-bold tabular-nums text-white outline-none transition"
                />
              </div>

              {/* Total Calculation Preview, Expiry Notice & Walk-in Savings */}
              <div className="p-4 bg-white/[0.04] border border-white/10 rounded-xl space-y-2">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Rate per day</span>
                  <span className="tabular-nums font-semibold">{formatCurrency(ratePerDay)}</span>
                </div>
                <div className="flex justify-between text-xs text-white/60">
                  <span>Days</span>
                  <span className="tabular-nums font-semibold">{daysPurchased}</span>
                </div>
                {selectedPlan && Number(selectedPlan.perSessionRate) > ratePerDay && (
                  <div className="text-[11px] text-white bg-white/10 border border-white/20 p-2 rounded-lg font-medium">
                    {daysPurchased} days {selectedPlan.name} — {formatCurrency(totalAmount)}. Saves {formatCurrency((Number(selectedPlan.perSessionRate) - ratePerDay) * daysPurchased)} versus {formatCurrency(selectedPlan.perSessionRate)} per visit.
                  </div>
                )}
                
                {/* 45-Day Expiry & Policy Notice */}
                <div className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg font-medium flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-300" />
                  <span>
                    Valid until {new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Unused days are not refundable.
                  </span>
                </div>

                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                  <span>Total Payable</span>
                  <span className="tabular-nums text-white">
                    <CountUpNumber value={totalAmount} currency duration={500} />
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Issue Course Package
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
