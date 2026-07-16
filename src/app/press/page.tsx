'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { Download, FileText, ArrowRight, Building, Award, Calendar, Mail, FileCheck } from 'lucide-react';

const RELEASES = [
  {
    title: 'HEALTH 360 Launches Redefined Physiotherapy Clinic in Mumbai',
    date: 'July 01, 2026',
    excerpt: 'HEALTH 360 opens its flagship clinic in Mumbai, introducing a completely new physiotherapy experience powered by advanced data-driven postural scans and mobility screening.',
    link: '#'
  },
  {
    title: 'Biomechanical Screening Reaches 99% Assessment Accuracy in Internal Studies',
    date: 'May 12, 2026',
    excerpt: 'Clinical trials demonstrate that HEALTH 360\'s proprietary movement analysis system yields 99% accuracy in diagnosing muscular asymmetry and postural deviations compared to traditional tests.',
    link: '#'
  }
];

export default function PressPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '130px', minHeight: '80vh' }}>
        <section style={{ padding: '4rem 0 6rem', background: 'radial-gradient(circle at bottom right, rgba(0, 159, 199, 0.03), transparent 60%)' }}>
          <div className="xpad" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
              <motion.p 
                className="subtitle uppercase"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Press Room
              </motion.p>
              <motion.h1 
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', letterSpacing: '-0.03em' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Press & Media Center
              </motion.h1>
              <motion.p 
                style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', maxWidth: '650px', margin: '0 auto', lineHeight: 1.5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Get the latest clinical announcements, brand guidelines, and high-resolution media resources from HEALTH 360.
              </motion.p>
            </div>

            {/* Quick Stats Banner */}
            <motion.div 
              className="glass rounded-l" 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '2rem',
                padding: '2.5rem',
                marginBottom: '4.5rem',
                textAlign: 'center'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div>
                <h4 style={{ fontSize: '2.5rem', fontWeight: 500, color: 'var(--brand)', margin: 0 }}>2024</h4>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Founded</p>
              </div>
              <div>
                <h4 style={{ fontSize: '2.5rem', fontWeight: 500, color: 'var(--brand)', margin: 0 }}>15+</h4>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Expert Years</p>
              </div>
              <div>
                <h4 style={{ fontSize: '2.5rem', fontWeight: 500, color: 'var(--brand)', margin: 0 }}>300+</h4>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Data Points Screened</p>
              </div>
              <div>
                <h4 style={{ fontSize: '2.5rem', fontWeight: 500, color: 'var(--brand)', margin: 0 }}>100%</h4>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Personalized Plans</p>
              </div>
            </motion.div>

            {/* Featured Media Coverage */}
            <div style={{ marginBottom: '5rem', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '4rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Editorial features</p>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 500, marginTop: '0.5rem', letterSpacing: '-0.02em' }}>HEALTH 360 in the Media</h2>
                <p style={{ maxWidth: '600px', margin: '0.75rem auto 0', color: 'var(--muted-foreground)', fontSize: '1.05rem' }}>
                  Explore how we are making news across the clinical healthcare and digital biometrics ecosystem.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2.5rem'
              }}>
                {[
                  { outlet: 'The Health Standard', title: 'Redefining Posture Corrections with Real-time Biometrics', date: 'June 2026', excerpt: 'HEALTH 360’s integration of AI-driven postural screening tools is changing how clinicians diagnose joint imbalances.' },
                  { outlet: 'Clinical Tech Digest', title: 'Why Data-driven Screening is the Future of Musculoskeletal Recovery', date: 'April 2026', excerpt: 'An in-depth study of Dr. Rashmita’s dual therapy approach combining biometric analytics with craniosacral adjustments.' },
                  { outlet: 'Wellness Chronicle', title: 'Integrating Craniosacral Therapy: Gentle Release for Chronic Pain', date: 'February 2026', excerpt: 'How targeting the nervous system through BCST facilitates structural realignment without high-impact manipulation.' }
                ].map((article, idx) => (
                  <motion.div 
                    key={idx}
                    className="glass rounded-l" 
                    style={{ 
                      padding: '2.5rem', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1.25rem',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.45)',
                      boxShadow: '0 8px 30px -10px rgba(0, 0, 0, 0.03)'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    whileHover={{ 
                      y: -6, 
                      backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                      borderColor: 'rgba(0, 159, 199, 0.25)',
                      boxShadow: '0 24px 48px -15px rgba(0, 159, 199, 0.08)'
                    }}
                  >
                    <span className="subtitle uppercase" style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 600 }}>{article.outlet}</span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--foreground)' }}>{article.title}</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.55 }}>{article.excerpt}</p>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: 'auto' }}>{article.date}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Press Releases & Tablet Mockup Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '4rem',
              alignItems: 'center',
              marginBottom: '5rem',
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              paddingBottom: '4rem'
            }}>
              
              {/* Left Column: Press Releases List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 500, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem' }}>
                  Press Releases
                </h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {RELEASES.map((release, idx) => (
                    <motion.div 
                      key={idx}
                      className="glass rounded-m"
                      style={{ 
                        padding: '2rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.45)',
                        boxShadow: '0 8px 30px -10px rgba(0, 0, 0, 0.03)',
                        cursor: 'pointer'
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      whileHover={{ 
                        y: -4, 
                        backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                        borderColor: 'rgba(0, 159, 199, 0.25)',
                        boxShadow: '0 16px 36px -12px rgba(0, 159, 199, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
                        <Calendar size={14} /> {release.date}
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--foreground)' }}>{release.title}</h3>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.925rem', lineHeight: 1.45 }}>
                        {release.excerpt}
                      </p>
                      <a href={release.link} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem', alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                        Read More <ArrowRight size={16} />
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right Column: Premium Tablet Mockup Graphic */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <motion.div 
                  className="glass rounded-l" 
                  style={{ 
                    position: 'relative', 
                    width: '100%', 
                    maxWidth: '480px', 
                    overflow: 'hidden', 
                    aspectRatio: '1',
                    padding: '12px'
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <img 
                    src="/press_room_hero.png" 
                    alt="HEALTH 360 Interactive Biometrics Dashboard mockup" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      borderRadius: '16px' 
                    }} 
                  />
                </motion.div>
              </div>

            </div>

            {/* Media Kits & Media Inquiries Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '4rem',
              alignItems: 'start'
            }}>
              
              {/* Left Column: Media Kit Downloads */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 500, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem' }}>
                  Media Kit & Assets
                </h2>
                
                <motion.div 
                  className="glass rounded-m" 
                  style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    Download our press assets pack containing clinical photographs, vector branding files, and factual brochures.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '1rem', 
                      border: '1px solid rgba(0,0,0,0.06)', 
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.4)' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Building size={20} style={{ color: 'var(--brand)' }} />
                        <div>
                          <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Clinic Photo Library</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>ZIP • High-Res JPEG • 24.5 MB</p>
                        </div>
                      </div>
                      <button className="mobile-menu-btn" style={{ padding: '8px', borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center' }}>
                        <Download size={18} />
                      </button>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '1rem', 
                      border: '1px solid rgba(0,0,0,0.06)', 
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.4)' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Award size={20} style={{ color: 'var(--brand)' }} />
                        <div>
                          <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>Brand Logo Pack</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>ZIP • SVG & PNG • 3.2 MB</p>
                        </div>
                      </div>
                      <button className="mobile-menu-btn" style={{ padding: '8px', borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center' }}>
                        <Download size={18} />
                      </button>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '1rem', 
                      border: '1px solid rgba(0,0,0,0.06)', 
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.4)' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={20} style={{ color: 'var(--brand)' }} />
                        <div>
                          <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>HEALTH 360 Fact Sheet</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>PDF • English • 0.8 MB</p>
                        </div>
                      </div>
                      <button className="mobile-menu-btn" style={{ padding: '8px', borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center' }}>
                        <Download size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Media Inquiries Contact */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 500, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem' }}>
                  Media Inquiries
                </h2>
                <div className="glass rounded-m" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '12px', color: 'var(--brand)' }}>
                    <FileCheck size={24} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500 }}>Get in touch with PR</h3>
                  </div>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    Are you a journalist or researcher writing about digital healthcare, AI posture scanning, or physiotherapy? Reach our PR contact directly.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', marginTop: '0.5rem' }}>
                    <Mail size={16} style={{ color: 'var(--brand)' }} />
                    <a href="mailto:media@health360.clinic" style={{ fontWeight: 500, textDecoration: 'underline' }}>
                      media@health360.clinic
                    </a>
                  </div>
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
