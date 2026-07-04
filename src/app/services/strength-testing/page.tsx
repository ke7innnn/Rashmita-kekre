'use client';

import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { BicepsFlexed, ShieldAlert, BarChart2, CheckCircle2, ChevronDown, User, Award } from 'lucide-react';

const STEPS = [
  { step: '01', title: 'Setup', desc: 'Secure dynamometer straps and anchor braces to isolate targeted muscle groups.' },
  { step: '02', title: 'Max Contraction', desc: 'Perform isometric maximum-effort pushes or pulls against resistance for 5 seconds.' },
  { step: '03', title: 'Symmetry Tracking', desc: 'Record peak force output to compare contralateral muscle capacities.' },
  { step: '04', title: 'Target Planning', desc: 'Isolate key strength deficits to outline custom exercise load targets.' }
];

const FAQS = [
  { q: 'Is maximum-effort testing safe for someone recovering from an injury?', a: 'Yes, because we use isometric dynamometers. Isometric tests measure force production at fixed joint angles without joint movement, which is highly controllable and safe even in early-stage rehab.' },
  { q: 'How does muscle symmetry affect my daily movements?', a: 'Symmetry deficits greater than 10% force secondary muscles to compensate during heavy loads (like carrying bags or running), which gradually creates joint overloading and back/hip pain.' },
  { q: 'Do I need prior training or experience to complete the strength tests?', a: 'Not at all. Our physiotherapist coaches you through the correct postures and contraction tempos prior to recording any data.' }
];

export default function StrengthTestingPage() {
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
              Strength Testing
            </motion.h1>
            <motion.p 
              style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Measure absolute force capacities and identify side-to-side muscular imbalances. Track progression with clinical dynamometer metrics.
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
                    <BicepsFlexed size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Muscular Symmetry</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      Compare relative loading thresholds between your left and right limbs to discover strength deficits that increase injury vulnerability.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px', flexShrink: 0 }}>
                    <BarChart2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Peak Load Output</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      Evaluate the absolute force production (in kilograms) of primary muscular groups—including quadriceps, hamstrings, rotator cuffs, and core.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px', flexShrink: 0 }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Force-Velocity Curves</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      Differentiate between explosive power and muscular endurance to adapt clinical rehabilitation or athletic strength programs.
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
                  src="/strength_test.png" 
                  alt="Muscular Strength Testing" 
                  style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}
                />
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px' }}>
                  <ShieldAlert size={20} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                    Notice: Avoid exhaustive weightlifting or heavy conditioning workouts for 24 hours prior to screening for true capacity reads.
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
                  key={item.step}
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
              Strength Testing FAQs
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
