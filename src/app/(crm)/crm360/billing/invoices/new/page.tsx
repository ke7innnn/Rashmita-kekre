'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Search, Check, AlertCircle, Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/formatters';
import PackageMeter from '@/components/billing/PackageMeter';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  isCoveredByPackage: boolean;
  patientPackageId?: string;
}

export default function InvoiceBuilderPage() {
  const router = useRouter();

  // Patient Selection
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Line items state
  const [lines, setLines] = useState<LineItem[]>([
    { id: '1', description: 'Physiotherapy Consultation & Assessment', quantity: 1, unitPrice: 1500, isCoveredByPackage: false },
  ]);

  // Discount
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Submit error state
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Search patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: async () => {
      if (!patientSearch) return [];
      const res = await fetch(`/api/patients?query=${encodeURIComponent(patientSearch)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: patientSearch.length >= 1,
  });

  // Calculate totals
  const subtotal = lines.reduce((sum, line) => {
    if (line.isCoveredByPackage) return sum;
    return sum + (line.quantity * line.unitPrice);
  }, 0);

  const discountAmount = discountType === 'PERCENT'
    ? Math.round((subtotal * (discountValue / 100)))
    : discountValue;

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleAddLine = () => {
    const newLine: LineItem = {
      id: Date.now().toString(),
      description: 'Manual Service / Consumables',
      quantity: 1,
      unitPrice: 500,
      isCoveredByPackage: false,
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    setLines(lines.filter((l) => l.id !== id));
  };

  const handleUpdateLine = (id: string, updates: Partial<LineItem>) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const createInvoiceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');
      return data;
    },
    onSuccess: (data) => {
      router.push(`/crm360/billing/invoices/${data.id}`);
    },
    onError: (err: any) => {
      setSubmitError(err.message || 'Error saving invoice');
    },
  });

  const handleSaveInvoice = () => {
    if (!selectedPatient) {
      setSubmitError('Please select a patient first.');
      return;
    }
    if (lines.length === 0) {
      setSubmitError('Please add at least one line item.');
      return;
    }

    setSubmitError(null);
    createInvoiceMutation.mutate({
      patientId: selectedPatient.id,
      discountAmount,
      notes,
      lines: lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        isCoveredByPackage: l.isCoveredByPackage,
        patientPackageId: l.patientPackageId,
      })),
    });
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <Link href="/crm360/billing/invoices" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">Create Invoice</h1>
          <p className="text-xs text-white/50 font-medium mt-0.5">Build and issue an invoice for patient treatment sessions & consumables.</p>
        </div>
      </div>

      {/* Two Pane Layout: Left Building, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Invoice Building (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Patient Selection Card */}
          <div className="bg-gradient-to-b from-white/[0.09] to-white/[0.03] backdrop-blur-2xl border border-white/15 p-5 rounded-3xl space-y-4 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
            <label className="text-xs font-bold uppercase tracking-wider text-white/60 block">1. Select Patient *</label>

            {selectedPatient ? (
              <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/12 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-white">{selectedPatient.fullName}</p>
                  <p className="text-xs text-white/50 font-mono">{selectedPatient.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs font-bold text-rose-400 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Type name or phone to search patient..."
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowPatientDropdown(true);
                  }}
                  className="w-full text-xs bg-white/5 border border-white/10 pl-9 pr-3 py-2.5 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 font-medium"
                />

                {showPatientDropdown && patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#15151D] border border-white/15 rounded-xl shadow-2xl z-30 max-h-48 overflow-y-auto divide-y divide-white/10">
                    {patients.map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p);
                          setShowPatientDropdown(false);
                        }}
                        className="w-full text-left p-3 hover:bg-white/5 text-xs text-white transition-colors"
                      >
                        <p className="font-bold">{p.fullName}</p>
                        <p className="text-[10px] text-white/50 font-mono">{p.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Package Surface */}
            {selectedPatient?.sessionPackages && selectedPatient.sessionPackages.length > 0 && (
              <div className="pt-2">
                <PackageMeter
                  packageName={selectedPatient.sessionPackages[0].packageName}
                  totalSessions={selectedPatient.sessionPackages[0].totalSessions}
                  sessionsUsed={selectedPatient.sessionPackages[0].sessionsUsed}
                  expiryDate={selectedPatient.sessionPackages[0].expiryDate}
                />
              </div>
            )}
          </div>

          {/* Line Items Card */}
          <div className="bg-gradient-to-b from-white/[0.09] to-white/[0.03] backdrop-blur-2xl border border-white/15 p-5 rounded-3xl space-y-4 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-white/60 block">2. Invoice Lines</label>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-bold text-[#12D6C4] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Line
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {lines.map((line) => (
                  <motion.div
                    key={line.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-3.5 rounded-xl border space-y-2.5 transition-colors ${
                      line.isCoveredByPackage
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => handleUpdateLine(line.id, { description: e.target.value })}
                        className={`flex-1 text-xs bg-transparent border-b border-white/15 pb-1 text-white font-semibold focus:outline-none focus:border-[#12D6C4] ${
                          line.isCoveredByPackage ? 'line-through text-white/50' : ''
                        }`}
                        placeholder="Line item description..."
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.id)}
                        className="p-1 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-white/50">Qty:</span>
                          <input
                            type="number"
                            min={1}
                            value={line.quantity}
                            onChange={(e) => handleUpdateLine(line.id, { quantity: parseInt(e.target.value) || 1 })}
                            className="w-12 text-center text-xs bg-white/5 border border-white/15 rounded-lg py-0.5 text-white font-mono font-bold"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-white/50">Price:</span>
                          <input
                            type="number"
                            min={0}
                            value={line.unitPrice}
                            onChange={(e) => handleUpdateLine(line.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-20 text-right text-xs bg-white/5 border border-white/15 rounded-lg py-0.5 px-2 text-white font-mono font-bold"
                          />
                        </div>
                      </div>

                      {/* Package Coverage Toggle */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-white/70">
                        <input
                          type="checkbox"
                          checked={line.isCoveredByPackage}
                          onChange={(e) => handleUpdateLine(line.id, { isCoveredByPackage: e.target.checked })}
                          className="rounded border-white/20 bg-white/10 text-[#12D6C4] focus:ring-0"
                        />
                        <span>Covered by package</span>
                      </label>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Discount & Notes Card */}
          <div className="bg-gradient-to-b from-white/[0.09] to-white/[0.03] backdrop-blur-2xl border border-white/15 p-5 rounded-3xl space-y-4 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
            <label className="text-xs font-bold uppercase tracking-wider text-white/60 block">3. Discount & Notes</label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/50 font-bold uppercase block mb-1">Discount Type</label>
                <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setDiscountType('AMOUNT')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${
                      discountType === 'AMOUNT' ? 'bg-white text-black' : 'text-white/60'
                    }`}
                  >
                    ₹ Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENT')}
                    className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors ${
                      discountType === 'PERCENT' ? 'bg-white text-black' : 'text-white/60'
                    }`}
                  >
                    % Percent
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-white/50 font-bold uppercase block mb-1">Discount Value</label>
                <input
                  type="number"
                  min={0}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs bg-white/5 border border-white/15 rounded-xl py-2 px-3 text-white font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/50 font-bold uppercase block mb-1">Invoice Notes / Remarks</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., session 3 of 10, patient requested weekend appointment, etc."
                className="w-full text-xs bg-white/5 border border-white/15 rounded-xl p-3 text-white font-medium focus:outline-none placeholder-white/30"
              />
            </div>
          </div>
        </div>

        {/* Right Pane: Live Sticky Invoice Preview (5 Columns) */}
        <div className="lg:col-span-5 sticky top-6 space-y-4">
          <div className="bg-gradient-to-b from-white/[0.09] to-white/[0.03] backdrop-blur-2xl border border-white/15 p-6 rounded-3xl space-y-6 shadow-2xl">
            <div className="border-b border-white/10 pb-4">
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#12D6C4] block">Live Preview</span>
              <h3 className="text-xl font-serif font-bold text-white mt-1">Health 360 Clinic</h3>
              <p className="text-[10px] text-white/50">123 Clinic Street, Mumbai, India</p>
            </div>

            {/* Patient Header */}
            <div>
              <span className="text-[9px] uppercase font-bold tracking-wider text-white/40 block">Bill To</span>
              <p className="text-sm font-bold text-white mt-0.5">
                {selectedPatient ? selectedPatient.fullName : 'No Patient Selected'}
              </p>
              {selectedPatient && <p className="text-xs text-white/50 font-mono">{selectedPatient.phone}</p>}
            </div>

            {/* Lines Summary */}
            <div className="space-y-2 text-xs border-y border-white/10 py-4">
              {lines.map((l) => (
                <div key={l.id} className="flex justify-between items-center">
                  <div className="min-w-0 pr-2">
                    <p className={`font-semibold truncate ${l.isCoveredByPackage ? 'line-through text-white/40' : 'text-white'}`}>
                      {l.description}
                    </p>
                    <p className="text-[9px] text-white/40 num-tabular">{l.quantity} x {formatINR(l.unitPrice)}</p>
                  </div>
                  <span className="font-bold num-tabular text-white shrink-0">
                    {l.isCoveredByPackage ? 'Covered' : formatINR(l.quantity * l.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals Block */}
            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span className="num-tabular">{formatINR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>Discount</span>
                  <span className="num-tabular">- {formatINR(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-lg font-bold text-white border-t border-white/15 pt-3">
                <span>Payable Total</span>
                <motion.span
                  key={finalTotal}
                  initial={{ scale: 1.1, color: '#12D6C4' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  className="num-tabular text-xl"
                >
                  {formatINR(finalTotal)}
                </motion.span>
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-300 font-medium">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Save & Issue Invoice Button */}
            <button
              type="button"
              disabled={createInvoiceMutation.isPending}
              onClick={handleSaveInvoice}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-white/90 text-black text-xs font-bold transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Issuing Invoice...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Confirm & Issue Invoice</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
