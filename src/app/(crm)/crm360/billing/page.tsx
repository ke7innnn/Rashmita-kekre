'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CreditCard, Plus, ArrowUpRight, TrendingUp, Users, Calendar, AlertCircle, FileText, ChevronRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import InvoiceStatusPill from '@/components/billing/InvoiceStatusPill';

import CountUpNumber from '@/components/billing/CountUpNumber';

export default function BillingOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(true);

  useEffect(() => {
    fetchOverviewData();
    const sessionStr = localStorage.getItem('h360_session');
    if (sessionStr) {
      try {
        const parsed = JSON.parse(sessionStr);
        const role = (parsed.role || '').toLowerCase();
        setIsAdmin(role === 'admin');
      } catch (e) {}
    }
  }, []);

  const fetchOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/overview');
      if (!res.ok) throw new Error('Failed to fetch billing data');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error loading billing overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-white/5 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white/[0.03] border border-white/10 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm flex items-center justify-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const { metrics, recentInvoices = [], outstandingPatients = [] } = data || {};
  const showMonthlyCollected = isAdmin && metrics?.totalCollectedThisMonth !== null && metrics?.totalCollectedThisMonth !== undefined;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto selection:bg-white/30 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-white" />
            Billing & Packages
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Course tracking, patient package rates, and clinic invoice management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/crm360/billing/invoices"
            className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/80 hover:bg-white/5 transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> View All Invoices
          </Link>
          <Link
            href="/crm360/billing/invoices/new"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Plus className="w-4 h-4" /> Create Invoice
          </Link>
        </div>
      </div>

      {/* Top Metrics Grid with Dynamic Column Layout based on Role */}
      <div className={`grid grid-cols-1 ${showMonthlyCollected ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-5`}>
        {/* Metric 1: Outstanding */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03, duration: 0.32, ease: 'easeOut' }}
          className="p-6 rounded-2xl bg-[#0B0A10]/80 border border-white/10 relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Total Outstanding
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
              <CountUpNumber value={Number(metrics?.totalOutstanding || 0)} currency duration={500} />
            </div>
            <p className="text-xs text-white/40 mt-1.5 flex items-center gap-1.5">
              <span>{metrics?.overdueCount || 0} overdue invoices pending payment</span>
            </p>
          </div>
        </motion.div>

        {/* Metric 2: Collected This Month (Admin Only) */}
        {showMonthlyCollected && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.32, ease: 'easeOut' }}
            className="p-6 rounded-2xl bg-[#0B0A10]/80 border border-white/10 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                Collected This Month
              </span>
              <span className="p-2 rounded-xl bg-white/10 text-white border border-white/20">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
                <CountUpNumber value={Number(metrics?.totalCollectedThisMonth || 0)} currency duration={500} />
              </div>
              <p className="text-xs text-white/40 mt-1.5">
                Recorded payments in {new Date().toLocaleString('default', { month: 'long' })}
              </p>
            </div>
          </motion.div>
        )}

        {/* Metric 3: Active Courses */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09, duration: 0.32, ease: 'easeOut' }}
          className="p-6 rounded-2xl bg-[#0B0A10]/80 border border-white/10 relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
              Active Courses
            </span>
            <span className="p-2 rounded-xl bg-[#12D6C4]/10 text-[#12D6C4] border border-[#12D6C4]/20">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
              <CountUpNumber value={Number(metrics?.activeCoursesCount || 0)} duration={500} /> <span className="text-sm font-normal text-white/40">courses</span>
            </div>
            <p className="text-xs text-white/40 mt-1.5 font-medium tabular-nums">
              {metrics?.totalDaysRemaining || 0} total treatment days remaining across patients
            </p>
          </div>
        </motion.div>
      </div>

      {/* Two Column Layout: Left (Recent Invoices & Expiring Packages), Right (Outstanding Balances) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Invoices & Expiring Soon Packages (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Expiring Soon Courses Warning Section */}
          {data?.expiringPackages && data.expiringPackages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" /> Expiring Soon Courses
                </h2>
                <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  {data.expiringPackages.length} Course{data.expiringPackages.length === 1 ? '' : 's'} expiring within 14 days
                </span>
              </div>

              <div className="bg-[#0B0A10]/80 border border-amber-500/30 rounded-2xl overflow-hidden divide-y divide-white/5">
                {data.expiringPackages.map((pkg: any) => (
                  <div key={pkg.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {pkg.patient?.fullName}
                        <span className="text-xs text-white/50 font-normal">({pkg.planName})</span>
                      </h4>
                      <p className="text-xs text-white/40 mt-0.5">{pkg.patient?.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full">
                        {pkg.remainingDays} {pkg.remainingDays === 1 ? 'day' : 'days'} unused, expires in {pkg.daysToExpiry} {pkg.daysToExpiry === 1 ? 'day' : 'days'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Invoices */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-white" /> Recent Invoices
              </h2>
              <Link
                href="/crm360/billing/invoices"
                className="text-xs text-white hover:underline font-semibold flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center bg-[#0B0A10]/60 border border-white/10 rounded-2xl space-y-3">
                <FileText className="w-10 h-10 text-white/20 mx-auto" />
                <p className="text-sm text-white/60">No invoices generated yet.</p>
                <p className="text-xs text-white/40">Create an invoice from completed appointments or package purchases.</p>
                <Link
                  href="/crm360/billing/invoices/new"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white text-black rounded-xl hover:bg-white/90 transition mt-2"
                >
                  <Plus className="w-4 h-4" /> Create First Invoice
                </Link>
              </div>
            ) : (
              <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                <div className="divide-y divide-white/5">
                  {recentInvoices.map((inv: any) => (
                    <Link
                      key={inv.id}
                      href={`/crm360/billing/invoices/${inv.id}`}
                      className="p-4 flex items-center justify-between hover:bg-white/[0.03] transition group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white group-hover:text-white transition">
                            {inv.invoiceNumber}
                          </span>
                          <InvoiceStatusPill status={inv.status} />
                        </div>
                        <p className="text-xs text-white/50">
                          {inv.patient?.fullName} · {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white tabular-nums">
                          {formatCurrency(inv.totalAmount)}
                        </div>
                        {Number(inv.paidAmount) > 0 && Number(inv.paidAmount) < Number(inv.totalAmount) && (
                          <p className="text-[11px] text-emerald-400 tabular-nums">
                            Paid: {formatCurrency(inv.paidAmount)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Outstanding Balances (1/3 width) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" /> Outstanding Balances
          </h2>

          {outstandingPatients.length === 0 ? (
            <div className="p-6 text-center bg-[#0B0A10]/60 border border-white/10 rounded-2xl text-xs text-white/50">
              All patient balances are fully settled!
            </div>
          ) : (
            <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
              {outstandingPatients.map(({ patient, balance, invoiceCount }: any) => (
                <div key={patient.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02]">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{patient.fullName}</h4>
                    <p className="text-xs text-white/40">{patient.phone} · {invoiceCount} unpaid {invoiceCount === 1 ? 'invoice' : 'invoices'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-300 tabular-nums">
                      {formatCurrency(balance)}
                    </span>
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
