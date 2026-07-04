'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import './Hero.css';

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  
  // As we scroll from 0 to 600px, scale down the background and round its corners
  const scale = useTransform(scrollY, [0, 600], [1, 0.85]);
  const borderRadius = useTransform(scrollY, [0, 600], ['0px', '40px']);

  return (
    <section className="hero" ref={containerRef}>
      <div className="hero-scroll-container">
        <motion.div 
          className="hero-background-wrapper"
          style={{ scale, borderRadius }}
        >
          <img src="/hero.png" alt="HEALTH 360 Clinic" className="hero-bg-image" />
          <div className="hero-gradient-overlay" />
        </motion.div>
      </div>
      
      <div className="hero-content xpad animate-fade-in" style={{ justifyContent: 'center', paddingBottom: '4vh' }}>
        <div className="hero-text-container" style={{ zIndex: 12 }}>
          <motion.h1 
            className="hero-title"
            style={{ 
              color: '#FAF7EC', 
              textShadow: '0 2px 20px rgba(0,0,0,0.5)', 
              marginBottom: '1.25rem', 
              fontWeight: 500,
              fontSize: 'clamp(2.25rem, 6vw, 4.5rem)',
              lineHeight: 1.15
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Restoring Balance. Relieving Pain. Rebuilding Strength.
          </motion.h1>
          <motion.p
            style={{ 
              color: '#FAF7EC', 
              fontSize: 'clamp(1.05rem, 1.8vw, 1.35rem)', 
              maxWidth: '800px', 
              margin: '0 auto 3rem', 
              lineHeight: 1.5, 
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
              opacity: 0.95
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            At Health 360, we combine evidence-based Physiotherapy with Craniosacral Therapy to help you move better, heal naturally, and live pain-free. Our personalized care focuses on holistic recovery and long-term wellness for every age and condition.
          </motion.p>
          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <a href="#book" className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem', boxShadow: '0 10px 25px rgba(0, 159, 199, 0.3)' }}>
              Book Appointment <ArrowRight size={20} />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
