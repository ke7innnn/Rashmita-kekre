'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { Shield, Sparkles, HeartHandshake, Eye, Award, CheckCircle } from 'lucide-react';

const TIMELINE = [
  { year: '2024', title: 'Conceptualization', desc: 'Dr. Rashmita and a team of software engineers draft plans to integrate real-time computer vision into physiotherapy.' },
  { year: '2025', title: 'Beta Testing', desc: 'Conducted 500+ trial scans in Mumbai, refining joint marker tracking and dynamometer calibration.' },
  { year: '2026', title: 'Flagship Launch', desc: 'Opened our premium Linking Road clinic, launching the complete HEALTH 360 screening experience to the public.' }
];

const CREDENTIALS = [
  'Indian Association of Physiotherapists (IAP) Certified',
  'Proprietary Biometrics Software Patent Pending',
  'Clinical Study Collaboration with Leading Orthopedic Labs',
  'All Clinicians Carry Advanced Biomechanical Degrees'
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: 'calc(var(--site-header-height) + 2rem)', minHeight: '80vh' }}>
        
        {/* Intro Hero */}
        <section style={{ padding: '5rem 0 2rem', background: 'radial-gradient(circle at top right, rgba(0, 159, 199, 0.04), transparent 60%)' }}>
          <div className="xpad" style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto' }}>
            <motion.p 
              className="subtitle uppercase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Our Mission
            </motion.p>
            <motion.h1 
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}
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
              At HEALTH 360, we believe that understanding your body\'s movement metrics is the first step toward long-term physical freedom. We merge specialized clinical physiotherapy with modern, real-time biometrics.
            </motion.p>
          </div>
        </section>

        {/* Doctor Spotlight */}
        <section style={{ padding: '4rem 0' }}>
          <div className="xpad">
            <div className="glass rounded-l" style={{ padding: '4rem 3rem', maxWidth: '1000px', margin: '0 auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '3.5rem',
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
                  <h2 style={{ fontSize: '2.25rem', fontWeight: 500, margin: '0.5rem 0 1.25rem', letterSpacing: '-0.02em' }}>
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

        {/* Pillars / Values */}
        <section style={{ padding: '4rem 0' }}>
          <div className="xpad" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Our Pillars</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 500, marginTop: '0.5rem' }}>Clinical Philosophy</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--brand)', padding: '12px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '16px', flexShrink: 0 }}>
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
                <div style={{ color: 'var(--brand)', padding: '12px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '16px', flexShrink: 0 }}>
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
                <div style={{ color: 'var(--brand)', padding: '12px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '16px', flexShrink: 0 }}>
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

        {/* Timeline */}
        <section style={{ padding: '4.5rem 0', background: 'rgba(0,0,0,0.01)', borderTop: '1px solid rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
          <div className="xpad" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Milestones</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 500, marginTop: '0.5rem' }}>Our Journey</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {TIMELINE.map((time, idx) => (
                <motion.div 
                  key={idx}
                  className="glass rounded-m"
                  style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand)' }}>{time.year}</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 500 }}>{time.title}</h3>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.925rem', lineHeight: 1.4 }}>{time.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology & Credentials */}
        <section style={{ padding: '5rem 0 6rem' }}>
          <div className="xpad" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '4rem',
              alignItems: 'start'
            }}>
              {/* Technology */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Eye style={{ color: 'var(--brand)' }} /> Our Technology Stack
                </h3>
                <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                  The HEALTH 360 lab coordinates an array of computer-vision cameras and dynamometers to scan hundreds of points in under an hour.
                </p>
                <div className="glass rounded-m" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>• 3D Skeletal Marker Arrays</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>• Wireless Dual-Axis Dynamometers</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>• Custom Cardiovascular Heart Rate Sensors</p>
                </div>
              </div>

              {/* Credentials */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award style={{ color: 'var(--brand)' }} /> Quality & Accreditations
                </h3>
                <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                  We operate under stringent regulatory and medical guidelines to provide reliable screening profiles.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {CREDENTIALS.map((cred, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.95rem' }}>
                      <CheckCircle size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                      <span style={{ color: 'var(--muted-foreground)' }}>{cred}</span>
                    </div>
                  ))}
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
