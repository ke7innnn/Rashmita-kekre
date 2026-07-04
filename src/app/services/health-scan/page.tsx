'use client';

import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Activity, ShieldAlert, Heart, Zap, CheckCircle, ChevronDown, User, HeartPulse, Sparkles } from 'lucide-react';

const STEPS = [
  { step: '01', title: 'Preparation', desc: 'Change into fitted athletic wear and fit wireless heart rate monitoring sensors.' },
  { step: '02', title: 'Resting Baseline', desc: 'Measure blood pressure, blood oxygen levels, and initial vital averages while resting.' },
  { step: '03', title: 'Stimulus Response', desc: 'Monitor heart rate variability (HRV) and cardiovascular changes during low-intensity stimulus.' },
  { step: '04', title: 'Clinical Review', desc: 'Walk through your health analytics charts and recovery window metrics with your therapist.' }
];

const FAQS = [
  { q: 'How long does the Health Scan take?', a: 'The screening itself takes about 15 minutes as part of the overall 1-hour HEALTH 360 assessment visit.' },
  { q: 'What is Heart Rate Variability (HRV) and why do you measure it?', a: 'HRV measures the variation in time between consecutive heartbeats. It is a key indicator of autonomic nervous system health, stress levels, and cardiovascular recovery capacity.' },
  { q: 'How often should I repeat the Health Scan?', a: 'We recommend repeating the scan every 3 to 6 months to track how your conditioning, sleep, and recovery protocols are affecting your cardiovascular health.' }
];

export default function HealthScanPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Header />
      <main style={{ paddingTop: 'calc(var(--site-header-height) + 2rem)', minHeight: '80vh' }}>
        
        {/* Hero Section */}
        <section style={{ padding: '5rem 0 3rem', background: 'radial-gradient(circle at top right, rgba(0, 159, 199, 0.04), transparent 60%)' }}>
          <div className="xpad" style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto' }}>
            <motion.p 
              className="subtitle uppercase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Services & Screenings
            </motion.p>
            <motion.h1 
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              HEALTH 360 Health Scan
            </motion.h1>
            <motion.p 
              style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Assess your vital statistics, heart rate variability, and aerobic recovery speeds to establish a baseline for safe, effective physical conditioning.
            </motion.p>
          </div>
        </section>

        {/* Feature Grid & Visuals */}
        <section style={{ padding: '3rem 0' }}>
          <div className="xpad" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '4rem',
              alignItems: 'center'
            }}>
              
              {/* Left Column: Details */}
              <motion.div 
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px', flexShrink: 0 }}>
                    <Heart size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Cardiovascular Response</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      We monitor your resting heart rate and active pulse shifts to identify autonomic system responses and recovery capacity.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px', flexShrink: 0 }}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Vitals & Blood Pressure</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      Quick assessment of baseline vitals—including blood pressure, blood oxygen levels, and temperature profile indices.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px', flexShrink: 0 }}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Aerobic Efficiency</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      Track the speed at which your pulse returns to normal after low-intensity stimulus, indicating cardiorespiratory efficiency.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Visual Panel */}
              <motion.div 
                className="glass rounded-l" 
                style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <img 
                  src="/cardio_metrics.png" 
                  alt="HEALTH 360 Health Scan Metrics" 
                  style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}
                />
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px' }}>
                  <ShieldAlert size={20} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                    Note: Health Scan results are structured for physical conditioning analysis and do not replace formal hospital ECG diagnostics.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>



        {/* What to Expect (Timeline) */}
        <section style={{ padding: '4rem 0', background: 'rgba(0,0,0,0.01)', borderTop: '1px solid rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
          <div className="xpad" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>The Flow</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 500, marginTop: '0.5rem' }}>What to Expect</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
              {STEPS.map((item, idx) => (
                <motion.div 
                  key={idx}
                  className="glass rounded-m"
                  style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'rgba(0,159,199,0.15)', lineHeight: 1 }}>{item.step}</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 500 }}>{item.title}</h3>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', lineHeight: 1.4 }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section style={{ padding: '5rem 0 6rem' }}>
          <div className="xpad" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 500, marginBottom: '2.5rem', textAlign: 'center' }}>
              Scan FAQs
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FAQS.map((faq, idx) => (
                <div 
                  key={idx} 
                  className="glass rounded-m" 
                  style={{ overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)' }}
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      fontWeight: 500,
                      fontSize: '1.05rem',
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown 
                      size={20} 
                      style={{ 
                        transition: 'transform 0.2s', 
                        transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--brand)'
                      }} 
                    />
                  </button>
                  {openFaq === idx && (
                    <motion.div 
                      style={{ padding: '0 1.5rem 1.5rem', color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
