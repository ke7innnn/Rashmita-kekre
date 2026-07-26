'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Users, ArrowUpRight, FileText, ChevronRight } from 'lucide-react';
import { formatINR, formatDateIN } from '@/lib/formatters';
import InvoiceStatusPill from '@/components/billing/InvoiceStatusPill';

export default function BillingOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['billing-overview'],
    queryFn: async () => {
      const res = await fetch('/api/billing/overview');
      if (!res.ok) throw new Error('Failed to fetch billing overview');
      return res.json();
    },
  });

  const [countAnimationDone, setCountAnimationDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCountAnimationDone(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const outstanding = data?.outstanding || 0;
  const collectedThisMonth = data?.collectedThisMonth || 0;
  const activePackagesCount = data?.activePackagesCount || 0;
  const remainingSessionsCount = data?.remainingSessionsCount || 0;
  const recentInvoices = data?.recentInvoices || [];
  const patientsWithOutstanding = data?.patientsWithOutstanding || [];

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight">Billing & Packages</h1>
          <p className="text-xs text-white/50 font-medium mt-1">Track patient treatment courses, prepaid packages, and outstanding clinic balances.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/crm360/billing/invoices">
            <button type="button" className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-white transition-all">
              All Invoices
            </button>
          </Link>

          <Link href="/crm360/billing/invoices/new">
            <button type="button" className="px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer">
              <Plus size={15} />
              New Invoice
            </button>
          </Link>
        </div>
      </div>

      {/* Top 3 Figures Strip (Quiet, typographically strong) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Figure 1: Outstanding */}
        <div className="bg-[#0F0F14] border border-white/12 p-5 rounded-2xl space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 block">Outstanding Unpaid Balance</span>
          <p className="text-2xl font-bold num-tabular text-amber-300">
            {isLoading ? '...' : formatINR(outstanding)}
          </p>
          <p className="text-[10px] text-white/40 font-medium">Across all active patient accounts</p>
        </div>

        {/* Figure 2: Collected This Month */}
        <div className="bg-[#0F0F14] border border-white/12 p-5 rounded-2xl space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 block">Collected This Month</span>
          <p className="text-2xl font-bold num-tabular text-emerald-400">
            {isLoading ? '...' : formatINR(collectedThisMonth)}
          </p>
          <p className="text-[10px] text-white/40 font-medium">Recorded payment receipts</p>
        </div>

        {/* Figure 3: Active Packages */}
        <div className="bg-[#0F0F14] border border-white/12 p-5 rounded-2xl space-y-1">
          <span className="text-[9px] uppercase font-bold tracking-widest text-white/40 block">Active Packages Hold</span>
          <p className="text-2xl font-bold num-tabular text-white">
            {isLoading ? '...' : activePackagesCount} <span className="text-sm text-white/50 font-normal">Packages</span>
          </p>
          <p className="text-[10px] text-[#12D6C4] font-bold num-tabular">
            {remainingSessionsCount} Total Sessions Remaining
          </p>
        </div>
      </div>

      {/* Main Grid: Left Recent Invoices, Right Outstanding Patients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Invoices (2 Columns Width) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Recent Invoices</h3>
            <Link href="/crm360/billing/invoices" className="text-xs font-bold text-[#12D6C4] hover:underline flex items-center gap-1">
              View All <ChevronRight size={13} />
            </Link>
          </div>

          <div className="bg-[#0F0F14] border border-white/12 rounded-2xl overflow-hidden divide-y divide-white/10">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-white/40">Loading invoices...</div>
            ) : recentInvoices.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <FileText className="h-8 w-8 text-white/20 mx-auto" />
                <p className="text-xs text-white/50 font-medium">No invoices created yet.</p>
                <Link href="/crm360/billing/invoices/new">
                  <button type="button" className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white border border-white/15">
                    Create Invoice
                  </button>
                </Link>
              </div>
            ) : (
              recentInvoices.map((inv: any) => (
                <Link key={inv.id} href={`/crm360/billing/invoices/${inv.id}`}>
                  <div className="p-3.5 flex items-center justify-between hover:bg-white/[0.04] transition-colors duration-150 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-white/70 group-hover:border-[#12D6C4]/40 transition-colors">
                        #
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-[#12D6C4] transition-colors truncate">
                          {inv.patient?.fullName || 'Patient'}
                        </p>
                        <p className="text-[10px] font-mono text-white/40">
                          {inv.invoiceNumber} • {formatDateIN(inv.date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right shrink-0">
                      <div>
                        <p className="text-xs font-bold num-tabular text-white">
                          {formatINR(inv.totalAmount)}
                        </p>
                        <p className="text-[9px] num-tabular text-white/40">
                          Paid {formatINR(inv.paidAmount)}
                        </p>
                      </div>

                      <InvoiceStatusPill status={inv.status} dueDate={inv.dueDate} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Patients with Outstanding Balances */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">Patients with Outstanding</h3>

          <div className="bg-[#0F0F14] border border-white/12 rounded-2xl overflow-hidden divide-y divide-white/10">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-white/40">Loading balances...</div>
            ) : patientsWithOutstanding.length === 0 ? (
              <div className="p-6 text-center text-xs text-white/40 italic">
                All patient accounts are currently fully settled! 🎉
              </div>
            ) : (
              patientsWithOutstanding.map((p: any) => (
                <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{p.fullName}</p>
                    <p className="text-[10px] text-white/40 font-mono">{p.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold num-tabular text-rose-400">
                      {formatINR(p.outstandingBalance)}
                    </p>
                    <span className="text-[9px] text-white/40 block">Due Balance</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
