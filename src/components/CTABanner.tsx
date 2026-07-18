'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import './CTABanner.css';

export default function CTABanner() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <section className="cta-banner-section xpad">
      <motion.div
        className="cta-banner-inner rounded-l"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
      >
        <div className="cta-banner-bg" />

        <div className="cta-banner-photo-col" ref={sectionRef}>
          <motion.img 
            src="/physio_exercise.jpg" 
            alt="Patient doing rehabilitation exercises" 
            className="cta-banner-photo" 
            style={{ y, scale: 1.25, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <div className="cta-banner-text-col">
          <p className="subtitle uppercase cta-tag">Start Your Recovery Today</p>
          <h2 className="cta-banner-title">
            Don't Let Pain Hold You Back Any Longer
          </h2>
          <p className="cta-banner-desc">
            Join over 1,000 patients who have rediscovered freedom of movement with HEALTH 360. Book a consultation today — same-week appointments available.
          </p>
          <div className="cta-banner-actions">
            <a href="#book" className="btn-primary cta-btn-primary">
              Book Appointment <ArrowRight size={18} />
            </a>
            <a href="/contact" className="btn-secondary cta-btn-secondary">
              Contact Us
            </a>
          </div>
          <div className="cta-banner-trust">
            <span>⭐ 5.0 Google Rating</span>
            <span>•</span>
            <span>No Referral Needed</span>
            <span>•</span>
            <span>Same-Week Appointments</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
