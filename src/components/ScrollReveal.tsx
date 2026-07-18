'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  skewAmount?: number;
}

export default function ScrollReveal({ 
  children, 
  delay = 0, 
  duration = 0.9, 
  skewAmount = 2.5 
}: ScrollRevealProps) {
  return (
    <span style={{ display: 'block', overflow: 'hidden' }}>
      <motion.span
        initial={{ y: '105%', skewY: skewAmount }}
        whileInView={{ y: '0%', skewY: 0 }}
        viewport={{ once: true, margin: '-10px' }}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1] // premium easeOutExpo curve
        }}
        style={{ display: 'block', transformOrigin: 'left top' }}
      >
        {children}
      </motion.span>
    </span>
  );
}
