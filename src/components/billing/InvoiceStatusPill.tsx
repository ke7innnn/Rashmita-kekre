'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, PieChart, CheckCircle2, Slash, AlertCircle } from 'lucide-react';

interface InvoiceStatusPillProps {
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'OVERDUE' | string;
  className?: string;
}

export default function InvoiceStatusPill({ status, className = '' }: InvoiceStatusPillProps) {
  const normStatus = (status || 'PENDING').toUpperCase();

  let config = {
    label: 'Pending',
    bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    icon: Clock
  };

  if (normStatus === 'PARTIALLY_PAID') {
    config = {
      label: 'Partial',
      bg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
      icon: PieChart
    };
  } else if (normStatus === 'PAID') {
    config = {
      label: 'Paid',
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      icon: CheckCircle2
    };
  } else if (normStatus === 'CANCELLED') {
    config = {
      label: 'Cancelled',
      bg: 'bg-white/10 border-white/20 text-white/50',
      icon: Slash
    };
  } else if (normStatus === 'OVERDUE') {
    config = {
      label: 'Overdue',
      bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
      icon: AlertCircle
    };
  }

  const IconComponent = config.icon;

  return (
    <motion.span
      layout
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold tracking-wide uppercase ${config.bg} ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </motion.span>
  );
}
