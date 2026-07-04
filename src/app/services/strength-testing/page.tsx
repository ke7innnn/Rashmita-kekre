'use client';

import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { motion } from 'framer-motion';
import { BicepsFlexed, ShieldAlert, BarChart2, CheckCircle2 } from 'lucide-react';

export default function StrengthTestingPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: 'calc(var(--site-header-height) + 2rem)', minHeight: '80vh' }}>
        <section style={{ padding: '4rem 0 6rem' }}>
          <div className="xpad" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <motion.p 
                className="subtitle uppercase"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Services & Screenings
              </motion.p>
              <motion.h1 
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', lineHeight: 1.1 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Strength Testing
              </motion.h1>
              <motion.p 
                style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', maxWidth: '650px', margin: '0 auto', lineHeight: 1.5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Measure absolute force capacities and identify side-to-side muscular imbalances. Track progression with clinical dynamometer metrics.
              </motion.p>
            </div>

            {/* Layout Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
              alignItems: 'center'
            }}>
              {/* Left Column: Details */}
              <motion.div 
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px' }}>
                    <BicepsFlexed size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '0.25rem' }}>Muscular Symmetry</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                      Compare relative loading thresholds between your left and right limbs to discover strength deficits that increase injury vulnerability.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px' }}>
                    <BarChart2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '0.25rem' }}>Peak Load Output</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                      Evaluate the absolute force production (in kilograms) of primary muscular groups—including quadriceps, hamstrings, rotator cuffs, and core.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '0.25rem' }}>Force-Velocity Curves</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.5 }}>
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
                animate={{ opacity: 1, x: 0 }}
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
      </main>
      <Footer />
    </>
  );
}
