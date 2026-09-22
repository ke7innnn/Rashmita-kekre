'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import Magnetic from './Magnetic';
import './Hero.css';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // As we scroll from 0 to 600px, scale down the background and round its corners (Desktop only)
  const scale = useTransform(scrollY, [0, 600], [1, 0.85]);
  const borderRadius = useTransform(scrollY, [0, 600], ['0px', '40px']);
  const y = useTransform(scrollY, [0, 600], ["0%", "12%"]);
  const imgScale = useTransform(scrollY, [0, 600], [1.1, 1.25]);

  return (
    <section className="hero" ref={containerRef}>
      {/* Ambient background glow for mobile & desktop */}
      <div className="hero-ambient-glow" aria-hidden="true" />

      <div className="hero-scroll-container">
        <motion.div 
          className="hero-background-wrapper"
          style={isMobile ? undefined : { scale, borderRadius }}
        >
          <motion.img 
            src="/hero.png" 
            alt="HEALTH 360 Clinic - For every body, every level, and every season of life" 
            className="hero-bg-image" 
            style={isMobile ? undefined : { y, scale: imgScale }}
          />
        </motion.div>
      </div>
      
      <div className="hero-content xpad animate-fade-in">
        <div className="hero-text-container">

          {/* Subtitle explicitly rendered on mobile for guaranteed crisp readability */}
          <p className="hero-mobile-subtitle">
            For every body, every level, and every season of life.
          </p>

          {/* ── Vasai-Only USP Badge ── */}
          <motion.div
            className="hero-usp-badge"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
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

            {/* Mobile Trust Proof */}
            <motion.div 
              className="hero-trust-proof"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
            >
              <div className="flex items-center gap-1 text-[#f6c90e]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <span className="hero-trust-text">
                4.9/5 Rating · 1000+ Recovered
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
