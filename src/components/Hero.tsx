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
        </motion.div>
      </div>
      
      <div className="hero-content xpad animate-fade-in">
        <div className="hero-text-container">
          <div className="hero-actions">
            <a href="#book" className="btn-primary">
              Book Appointment <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
