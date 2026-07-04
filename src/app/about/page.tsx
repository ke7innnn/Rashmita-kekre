'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { Shield, Sparkles, HeartHandshake } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: 'calc(var(--site-header-height) + 2rem)', minHeight: '80vh' }}>
        {/* Intro */}
        <section style={{ padding: '4rem 0 2rem' }}>
          <div className="xpad" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <motion.p 
              className="subtitle uppercase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Our Mission
            </motion.p>
            <motion.h1 
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', lineHeight: 1.1 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Re-imagining physical health and longevity
            </motion.h1>
            <motion.p 
              style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              At HEALTH 360, we believe that understanding your body's movement metrics is the first step toward long-term physical freedom. We merge specialized clinical physiotherapy with modern, real-time biometrics.
            </motion.p>
          </div>
        </section>

        {/* Doctor Spotlight */}
        <section style={{ padding: '4rem 0' }}>
          <div className="xpad">
            <div className="glass rounded-l" style={{ padding: '3.5rem 2.5rem', maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '3rem',
                alignItems: 'center'
              }}>
                {/* Photo Column */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <motion.div 
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '320px',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      aspectRatio: '0.85',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                      background: '#e5e2d5'
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <img 
                      src="/doctor.png" 
                      alt="Dr. Rashmita Karvir-Kekre" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '20px',
                      background: 'var(--brand)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      boxShadow: '0 4px 12px rgba(0, 159, 199, 0.3)'
                    }}>
                      13+ Years Experience
                    </div>
                  </motion.div>
                </div>

                {/* Bio Column */}
                <div>
                  <span className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Clinical Director</span>
                  <h2 style={{ fontSize: '2rem', fontWeight: 500, margin: '0.5rem 0 1rem' }}>
                    Dr. Rashmita Karvir-Kekre
                  </h2>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                    Dr. Rashmita is a leading specialist in biomechanical screening and therapeutic recovery. Her clinical career is centered around bridging the gap between traditional physiotherapy methods and state-of-the-art diagnostic data tracking.
                  </p>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '1.05rem', lineHeight: 1.6 }}>
                    Having successfully managed thousands of patient recoveries, she designed the signature HEALTH 360 screening checklist to offer clients comprehensive, clear, and actionable physiological profiles in under an hour.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section style={{ padding: '3rem 0 6rem' }}>
          <div className="xpad" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 500, marginBottom: '3rem', textAlign: 'center' }}>
              Our Clinical Philosophy
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--brand)', padding: '12px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '16px' }}>
                  <Shield size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>Preventative Longevity</h3>
                  <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                    Most physical care is reactive—treating issues only after injury has occurred. We build systems that scan and flag skeletal misalignments, strength imbalances, and range-of-motion restrictions beforehand, setting you up for injury-free longevity.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--brand)', padding: '12px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '16px' }}>
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>Biomechanical Accuracy</h3>
                  <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                    By leveraging state-of-the-art dynamometers and AI computer-vision scanning, we eliminate the guesswork. Our assessments capture actual joint degrees and force differentials to design evidence-based therapies.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--brand)', padding: '12px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '16px' }}>
                  <HeartHandshake size={28} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem' }}>Empathetic Partnership</h3>
                  <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                    We believe data is only powerful when coupled with expert guidance. Our therapists walk you through every metric on your dashboard, building a collaborative partnership focused on helping you feel your best.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
