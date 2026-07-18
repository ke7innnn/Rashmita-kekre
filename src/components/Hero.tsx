'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import Magnetic from './Magnetic';
import './Hero.css';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // As we scroll from 0 to 600px, scale down the background and round its corners
  const scale = useTransform(scrollY, [0, 600], [1, 0.85]);
  const borderRadius = useTransform(scrollY, [0, 600], ['0px', '40px']);
  const y = useTransform(scrollY, [0, 600], ["0%", "12%"]);
  const imgScale = useTransform(scrollY, [0, 600], [1.1, 1.25]);

  return (
    <section className="hero" ref={containerRef}>
      <div className="hero-scroll-container">
        <motion.div 
          className="hero-background-wrapper"
          style={{ scale, borderRadius }}
        >
          <motion.img 
            src="/hero.png" 
            alt="HEALTH 360 Clinic" 
            className="hero-bg-image" 
            style={{ y, scale: imgScale }}
          />
        </motion.div>
      </div>
      
      <div className="hero-content xpad animate-fade-in">
        <div className="hero-text-container">

          {/* ── Vasai-Only USP Badge ── */}
          <motion.div
            className="hero-usp-badge"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="hero-usp-dot" />
            <Star size={12} fill="currentColor" strokeWidth={0} className="hero-usp-star" />
            <span className="hero-usp-text">
              Vasai&apos;s <strong>Only</strong> Biodynamic Craniosacral Therapist
            </span>
            <span className="hero-usp-pill">Exclusive</span>
          </motion.div>

          <div className="hero-actions">
            <Magnetic strength={0.3}>
              <a href="#book" className="btn-primary">
                Book Appointment <ArrowRight size={20} />
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
