'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Edit2, Check, AlertCircle, ShoppingBag, DollarSign, AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function BillingSettingsTab() {
  const [plans, setPlans] = useState<any[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);
  const [serviceCharges, setServiceCharges] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [editingConsumable, setEditingConsumable] = useState<any | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchBillingSettings();
  }, []);

  const fetchBillingSettings = async () => {
    setLoading(true);
    try {
      const [plansRes, consRes, servRes] = await Promise.all([
        fetch('/api/billing/plans'),
        fetch('/api/billing/consumables'),
        fetch('/api/billing/service-charges')
      ]);

      if (plansRes.ok) setPlans(await plansRes.json());
      if (consRes.ok) setConsumables(await consRes.json());
      if (servRes.ok) setServiceCharges(await servRes.json());
    } catch (e) {
      console.error('Error loading billing settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlanRate = async (planId: string, perSessionRate: number, packageRate: number) => {
    setSaving(true);
    try {
      const res = await fetch('/api/billing/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: planId, perSessionRate, packageRate })
      });
      if (res.ok) {
        setEditingPlan(null);
        fetchBillingSettings();
      }
    } catch (e) {
      console.error('Error updating plan rates:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateServiceCharge = async (id: string, rate: number) => {
    try {
      const res = await fetch('/api/billing/service-charges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rate })
      });
      if (res.ok) {
        fetchBillingSettings();
      }
    } catch (e) {
      console.error('Error updating service charge:', e);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-white/50 text-sm">Loading billing settings...</div>;
  }

  return (
    <div className="space-y-8 select-none">
      {/* Rate Snapshot Warning Box */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl text-xs space-y-1">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
          <AlertCircle className="w-4 h-4 shrink-0" /> Important Rate Snapshot Note
        </div>
        <p className="text-white/70">
          Updating treatment plan rates here will apply ONLY to newly issued patient courses. Existing active courses retain their agreed rate snapshot.
        </p>
      </div>

      {/* 1. Treatment Plans Rate Card */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#12D6C4]" /> Treatment Plan Rates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isEditing = editingPlan?.id === plan.id;

            return (
              <div key={plan.id} className="p-5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                    <p className="text-xs text-white/50">{plan.description}</p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setEditingPlan({ ...plan })}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-white/40 uppercase">Walk-in / day (₹)</label>
                        <input
                          type="number"
                          value={editingPlan.perSessionRate}
                          onChange={(e) => setEditingPlan({ ...editingPlan, perSessionRate: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold text-white outline-none focus:border-[#12D6C4]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#12D6C4] uppercase">Package / day (₹)</label>
                        <input
                          type="number"
                          value={editingPlan.packageRate}
                          onChange={(e) => setEditingPlan({ ...editingPlan, packageRate: e.target.value })}
                          className="w-full bg-white/5 border border-[#12D6C4]/40 rounded-lg px-2.5 py-1 text-xs font-bold text-[#12D6C4] outline-none focus:border-[#12D6C4]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingPlan(null)}
                        className="px-3 py-1 text-xs text-white/60 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdatePlanRate(plan.id, parseFloat(editingPlan.perSessionRate), parseFloat(editingPlan.packageRate))}
                        disabled={saving}
                        className="px-3 py-1 bg-[#12D6C4] text-black text-xs font-bold rounded-lg hover:bg-[#009FC7]"
                      >
                        Save Rates
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] text-white/40 uppercase block">Walk-in Rate</span>
                      <span className="font-bold text-white tabular-nums">{formatCurrency(plan.perSessionRate)}/day</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#12D6C4] uppercase block">Package Course Rate</span>
                      <span className="font-bold text-[#12D6C4] tabular-nums">{formatCurrency(plan.packageRate)}/day</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Service Charges per Appointment Type */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-white" /> Service Charges per Appointment Type
        </h3>

        <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
          {serviceCharges
            .filter((sc) => sc.appointmentType !== 'FOLLOW_UP')
            .map((sc) => {
              const isUnpriced = Number(sc.rate) === 0 && !sc.isBilledByPlan;

              return (
                <div key={sc.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{sc.appointmentType.replace(/_/g, ' ')}</span>
                      {isUnpriced && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Rate not set
                        </span>
                      )}
                      {sc.isBilledByPlan && (
                        <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                          Billed via Plan
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold tabular-nums text-white">
                      {sc.isBilledByPlan ? 'Plan Rate' : formatCurrency(sc.rate)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 3. Consumable Products */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#12D6C4]" /> Clinic Consumable Products
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {consumables.map((cons) => (
            <div key={cons.id} className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{cons.name}</h4>
                {cons.notes && <p className="text-xs text-white/50 mt-0.5">{cons.notes}</p>}
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[#12D6C4] tabular-nums">
                  {formatCurrency(cons.unitPrice)}
                </span>
                {cons.unit && <span className="text-[10px] text-white/40 block">per {cons.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
