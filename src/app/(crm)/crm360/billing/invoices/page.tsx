'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, ArrowLeft, ChevronRight } from 'lucide-react';
import { formatINR, formatDateIN } from '@/lib/formatters';
import InvoiceStatusPill from '@/components/billing/InvoiceStatusPill';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All Invoices' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { id: 'PAID', label: 'Paid' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export default function InvoiceListPage() {
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices-list', selectedStatus, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (searchQuery) params.set('query', searchQuery);

      const res = await fetch(`/api/billing/invoices?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch invoices');
      return res.json();
    },
  });

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/crm360/billing" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight">Invoice List</h1>
            <p className="text-xs text-white/50 font-medium mt-0.5">View, filter, and manage all patient invoices.</p>
          </div>
        </div>

        <Link href="/crm360/billing/invoices/new">
          <button type="button" className="px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer">
            <Plus size={15} />
            Create Invoice
          </button>
        </Link>
      </div>

      {/* Filter Bar & Animated Result Count */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F0F14] border border-white/12 p-3.5 rounded-2xl">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Animated Result Count */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search invoice # or patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-white/5 border border-white/10 pl-9 pr-3 py-2 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/30 font-medium"
            />
          </div>

          <motion.span
            key={invoices.length}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold num-tabular text-[#12D6C4] bg-[#12D6C4]/10 border border-[#12D6C4]/30 px-2.5 py-1 rounded-xl shrink-0"
          >
            {invoices.length} Result{invoices.length === 1 ? '' : 's'}
          </motion.span>
        </div>
      </div>

      {/* Dense Invoice Table */}
      <div className="bg-[#0F0F14] border border-white/12 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white/[0.04] border-b border-white/10 text-[10px] uppercase font-bold text-white/40 tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 font-medium text-white/80">
              {isLoading ? (
                /* Skeleton Loading Rows */
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-white/10 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-32 bg-white/10 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-white/10 rounded-md" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-16 bg-white/10 rounded-md ml-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-16 bg-white/10 rounded-md ml-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-16 bg-white/10 rounded-md ml-auto" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 w-20 bg-white/10 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-white/40 italic">
                    No invoices matching current filter.
                  </td>
                </tr>
              ) : (
                invoices.map((inv: any) => {
                  const balance = Math.max(0, inv.totalAmount - inv.paidAmount);
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer group"
                      onClick={() => window.location.href = `/crm360/billing/invoices/${inv.id}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-white group-hover:text-[#12D6C4] transition-colors">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        {inv.patient?.fullName || 'Patient'}
                      </td>
                      <td className="py-3.5 px-4 text-white/60 num-tabular">
                        {formatDateIN(inv.date)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold num-tabular text-white">
                        {formatINR(inv.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right num-tabular text-emerald-400 font-semibold">
                        {formatINR(inv.paidAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right num-tabular font-bold text-amber-300">
                        {formatINR(balance)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <InvoiceStatusPill status={inv.status} dueDate={inv.dueDate} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
