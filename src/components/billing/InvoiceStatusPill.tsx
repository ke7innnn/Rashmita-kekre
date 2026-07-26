'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, PieChart, Check, Slash, AlertTriangle } from 'lucide-react';

interface InvoiceStatusPillProps {
  status: string;
  dueDate?: Date | string | null;
  paidAmount?: number;
  totalAmount?: number;
}

export default function InvoiceStatusPill({
  status,
  dueDate,
  paidAmount = 0,
  totalAmount = 0,
}: InvoiceStatusPillProps) {
  // Derive OVERDUE status
  let effectiveStatus = status;
  if (status === 'PENDING' || status === 'PARTIALLY_PAID') {
    if (dueDate) {
      const due = new Date(dueDate);
      if (!isNaN(due.getTime()) && due < new Date()) {
        effectiveStatus = 'OVERDUE';
      }
    }
  }

  const getConfig = () => {
    switch (effectiveStatus) {
      case 'PAID':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
          icon: Check,
          label: 'Paid',
        };
      case 'PARTIALLY_PAID':
        return {
          bg: 'bg-blue-500/15 border-blue-500/35 text-blue-300',
          icon: PieChart,
          label: 'Partially Paid',
        };
      case 'OVERDUE':
        return {
          bg: 'bg-rose-500/15 border-rose-500/35 text-rose-300',
          icon: AlertTriangle,
          label: 'Overdue',
        };
      case 'CANCELLED':
        return {
          bg: 'bg-white/10 border-white/20 text-white/50',
          icon: Slash,
          label: 'Cancelled',
        };
      case 'PENDING':
      default:
        return {
          bg: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
          icon: Clock,
          label: 'Pending',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-bold ${config.bg} select-none`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span>{config.label}</span>
    </motion.div>
  );
}
