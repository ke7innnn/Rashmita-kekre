'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CreditCard, Plus, ArrowUpRight, TrendingUp, Users, Calendar, AlertCircle, FileText, ChevronRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import InvoiceStatusPill from '@/components/billing/InvoiceStatusPill';

import CountUpNumber from '@/components/billing/CountUpNumber';

export default function BillingOverviewPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  useEffect(() => {
    if (session?.user?.role) {
      const role = (session.user.role || '').toLowerCase();
      setIsAdmin(role === 'admin');
    }
  }, [session]);

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
            <div key={i} className="h-36 bg-white/[0.04] border border-white/15 animate-pulse rounded-3xl backdrop-blur-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-rose-300 text-sm flex items-center justify-center gap-3 backdrop-blur-xl">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const { metrics, recentInvoices = [], outstandingPatients = [] } = data || {};
  const showMonthlyCollected = isAdmin && metrics?.totalCollectedThisMonth !== null && metrics?.totalCollectedThisMonth !== undefined;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto selection:bg-[#12D6C4]/30 select-none">
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
            className="px-4 py-2.5 rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl text-xs font-semibold text-white/80 hover:bg-white/10 hover:border-white/25 transition flex items-center gap-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
          >
            <FileText className="w-4 h-4" /> View All Invoices
          </Link>
          <Link
            href="/crm360/billing/invoices/new"
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
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
          className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.015] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_36px_rgba(0,0,0,0.45)] hover:border-white/25 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_18px_45px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all duration-300"
        >
          {/* Glass bubble specular glare */}
          <div className="pointer-events-none absolute -top-16 -left-16 w-36 h-36 rounded-full bg-white/[0.06] blur-2xl group-hover:bg-white/[0.1] transition-all duration-500" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Total Outstanding
            </span>
            <span className="p-2.5 rounded-2xl bg-white/[0.06] text-white/90 border border-white/15 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 relative z-10">
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
            className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.015] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_36px_rgba(0,0,0,0.45)] hover:border-white/25 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_18px_45px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all duration-300"
          >
            {/* Glass bubble specular glare */}
            <div className="pointer-events-none absolute -top-16 -left-16 w-36 h-36 rounded-full bg-white/[0.06] blur-2xl group-hover:bg-white/[0.1] transition-all duration-500" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="flex justify-between items-start relative z-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Collected This Month
              </span>
              <span className="p-2.5 rounded-2xl bg-white/[0.06] text-white border border-white/15 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-4 relative z-10">
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
          className="p-6 rounded-3xl bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.015] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 relative overflow-hidden group shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_12px_36px_rgba(0,0,0,0.45)] hover:border-white/25 hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.3),0_18px_45px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all duration-300"
        >
          {/* Glass bubble specular glare */}
          <div className="pointer-events-none absolute -top-16 -left-16 w-36 h-36 rounded-full bg-[#12D6C4]/[0.08] blur-2xl group-hover:bg-[#12D6C4]/[0.15] transition-all duration-500" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#12D6C4]/40 to-transparent" />
          <div className="flex justify-between items-start relative z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Active Courses
            </span>
            <span className="p-2.5 rounded-2xl bg-[#12D6C4]/15 text-[#12D6C4] border border-[#12D6C4]/30 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_15px_rgba(18,214,196,0.2)]">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 relative z-10">
            <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
              <CountUpNumber value={Number(metrics?.activeCoursesCount || 0)} duration={500} /> <span className="text-sm font-normal text-white/40">courses</span>
            </div>
            <p className="text-xs text-white/40 mt-1.5 font-medium tabular-nums">
              {metrics?.totalDaysRemaining || 0} total treatment sessions remaining across patients
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
                  <AlertCircle className="w-5 h-5 text-[#12D6C4]" /> Expiring Soon Courses
                </h2>
                <span className="text-xs font-semibold text-[#12D6C4] bg-[#12D6C4]/10 border border-[#12D6C4]/25 px-3 py-1 rounded-full backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                  {data.expiringPackages.length} Course{data.expiringPackages.length === 1 ? '' : 's'} expiring within 14 days
                </span>
              </div>

              <div className="bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.015] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 rounded-3xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_14px_40px_rgba(0,0,0,0.45)] relative divide-y divide-white/5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                {data.expiringPackages.map((pkg: any) => (
                  <div key={pkg.id} className="p-4.5 px-5 flex items-center justify-between hover:bg-white/[0.04] transition-all duration-200">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {pkg.patient?.fullName}
                        <span className="text-xs text-white/50 font-normal">({pkg.planName})</span>
                      </h4>
                      <p className="text-xs text-white/40 mt-0.5">{pkg.patient?.phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/[0.08] border border-white/20 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_8px_rgba(0,0,0,0.2)]">
                        {pkg.remainingDays} {pkg.remainingDays === 1 ? 'session' : 'sessions'} remaining · Expires in {pkg.daysToExpiry} {pkg.daysToExpiry === 1 ? 'day' : 'days'}
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
                className="text-xs text-[#12D6C4] hover:underline font-semibold flex items-center gap-1"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="p-8 text-center bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/15 rounded-3xl space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                <FileText className="w-10 h-10 text-white/20 mx-auto" />
                <p className="text-sm text-white/60">No invoices generated yet.</p>
                <p className="text-xs text-white/40">Create an invoice from completed appointments or package purchases.</p>
                <Link
                  href="/crm360/billing/invoices/new"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white text-black rounded-xl hover:bg-white/90 transition mt-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  <Plus className="w-4 h-4" /> Create First Invoice
                </Link>
              </div>
            ) : (
              <div className="bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.015] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 rounded-3xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_14px_40px_rgba(0,0,0,0.45)] relative">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <div className="divide-y divide-white/5">
                  {recentInvoices.map((inv: any) => (
                    <Link
                      key={inv.id}
                      href={`/crm360/billing/invoices/${inv.id}`}
                      className="p-4.5 px-5 flex items-center justify-between hover:bg-white/[0.04] transition-all duration-200 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white group-hover:text-[#12D6C4] transition">
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
            <Users className="w-5 h-5 text-[#12D6C4]" /> Outstanding Balances
          </h2>

          {outstandingPatients.length === 0 ? (
            <div className="p-6 text-center bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/15 rounded-3xl text-xs text-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              All patient balances are fully settled!
            </div>
          ) : (
            <div className="bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.015] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 rounded-3xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_14px_40px_rgba(0,0,0,0.45)] relative divide-y divide-white/5">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              {outstandingPatients.map(({ patient, balance, invoiceCount }: any) => (
                <div key={patient.id} className="p-4.5 px-5 flex items-center justify-between hover:bg-white/[0.04] transition-all duration-200">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{patient.fullName}</h4>
                    <p className="text-xs text-white/40">{patient.phone} · {invoiceCount} unpaid {invoiceCount === 1 ? 'invoice' : 'invoices'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#12D6C4]/10 border border-[#12D6C4]/25 text-sm font-bold text-[#12D6C4] tabular-nums tracking-tight shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_12px_rgba(18,214,196,0.15)]">
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
