'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileText, Search, Plus, Filter, ArrowLeft, RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import InvoiceStatusPill from '@/components/billing/InvoiceStatusPill';

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (e) {
      console.error('Error fetching invoices:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = search === '' || 
        (inv.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.patient?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (inv.patient?.phone || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus = selectedStatus === 'ALL' || inv.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, selectedStatus]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto selection:bg-[#12D6C4]/30 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
            <Link href="/crm360/billing" className="hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Billing Overview
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-white" />
            Invoice Directory
          </h1>
        </div>
        <Link
          href="/crm360/billing/invoices/new"
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.25)] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create New Invoice
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0B0A10]/80 p-4 border border-white/10 rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice number, patient name, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 focus:border-white rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 outline-none transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedStatus === st
                  ? 'bg-white/20 border border-white text-white'
                  : 'bg-white/[0.03] border border-white/10 text-white/60 hover:bg-white/[0.08]'
              }`}
            >
              {st === 'ALL' ? 'All Invoices' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Result Count Counter Animation */}
        <div className="text-right shrink-0">
          <motion.span
            key={filteredInvoices.length}
            initial={{ opacity: 0.5, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-xs font-bold text-white/70 tabular-nums"
          >
            {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Invoice' : 'Invoices'}
          </motion.span>
        </div>
      </div>

      {/* Dense Working Table */}
      {loading ? (
        <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-4 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-white/[0.03] animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="p-12 text-center bg-[#0B0A10]/60 border border-white/10 rounded-2xl text-xs text-white/50">
          No matching invoices found.
        </div>
      ) : (
        <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#12101B] border-b border-white/10 text-[11px] font-bold text-white/50 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-white">
                {filteredInvoices.map((inv) => {
                  const total = Number(inv.totalAmount);
                  const paid = Number(inv.paidAmount);
                  const balance = Math.max(0, total - paid);

                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-white/[0.03] transition-colors duration-120 cursor-pointer"
                      onClick={() => window.location.href = `/crm360/billing/invoices/${inv.id}`}
                    >
                      <td className="py-3.5 px-4 font-bold text-white hover:underline">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {inv.patient?.fullName}
                        <div className="text-[10px] text-white/40 font-normal">{inv.patient?.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-white/60">
                        {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold tabular-nums">
                        {formatCurrency(total)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-400 tabular-nums">
                        {formatCurrency(paid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-300 tabular-nums">
                        {formatCurrency(balance)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <InvoiceStatusPill status={inv.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
