'use client';

import React, { useEffect, useState, useRef } from 'react';
import { formatCurrency } from '@/lib/formatters';

interface CountUpNumberProps {
  value: number;
  currency?: boolean;
  duration?: number; // ms
  className?: string;
}

export default function CountUpNumber({
  value,
  currency = false,
  duration = 500,
  className = ''
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);
  const prevValueRef = useRef<number>(value);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    const targetVal = value;
    if (startVal === targetVal) {
      setDisplayValue(targetVal);
      return;
    }

    const startTime = performance.now();

    const updateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // cubic-bezier(0.16, 1, 0.3, 1) easeOut
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(updateCount);
      } else {
        setDisplayValue(targetVal);
        prevValueRef.current = targetVal;
      }
    };

    animFrameRef.current = requestAnimationFrame(updateCount);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value, duration, prefersReducedMotion]);

  const formattedStr = currency ? formatCurrency(displayValue) : Math.round(displayValue).toLocaleString('en-IN');

  return <span className={className}>{formattedStr}</span>;
}
