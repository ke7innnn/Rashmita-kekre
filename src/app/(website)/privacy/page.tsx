'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { ShieldAlert, BookOpen, ShieldCheck, Mail } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '130px', minHeight: '80vh' }}>
        <section style={{ padding: '4rem 0 6rem' }}>
          <div className="xpad" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <motion.p 
                className="subtitle uppercase"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Security & Trust
              </motion.p>
              <motion.h1 
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', letterSpacing: '-0.02em' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Privacy Policy
              </motion.h1>
              <motion.p 
                style={{ fontSize: '1.1rem', color: 'var(--muted-foreground)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Last updated: July 04, 2026
              </motion.p>
            </div>

            {/* Split Layout */}
            <div className="legal-grid">
              
              {/* Sticky Sidebar */}
              <div style={{
                position: 'sticky',
                top: '130px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div className="glass rounded-m" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 500, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} style={{ color: 'var(--brand)' }} /> Policy Outline
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: 'var(--muted-foreground)' }}>
                    <a href="#collection" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>1. Data Collection</a>
                    <a href="#usage" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>2. Data Usage</a>
                    <a href="#security" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>3. Data Security</a>
                    <a href="#disclosure" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>4. Third-Party Scope</a>
                    <a href="#rights" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>5. Patient Rights</a>
                  </div>
                </div>

                <div className="glass rounded-m" style={{ padding: '1.5rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                    Your biometric and postural datasets are strictly medical records and protected by AES-256 local database encryption.
                  </p>
                </div>
              </div>

              {/* Main Document Text */}
              <motion.div 
                className="glass rounded-l" 
                style={{ padding: '3.5rem 3rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', lineHeight: 1.6 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div id="collection">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>1. Personal & Biometric Data Collection</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    We collect personal contact information (such as name, email, phone number) when you book an assessment or request support. Additionally, during your physical assessment at HEALTH 360 Clinic, we capture clinical data including postural scan coordinates, joint angles, muscle strength markers, and heart rate indices.
                  </p>
                </div>

                <div id="usage">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>2. How We Use Your Information</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    Your personal and clinical data is used exclusively to:
                  </p>
                  <ul style={{ color: 'var(--muted-foreground)', paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Generate your movement analysis reports and biometrics card.</li>
                    <li>Design personalized physiotherapy programs and exercise lists.</li>
                    <li>Manage clinic booking schedules and coordinate direct communication.</li>
                    <li>Improve our diagnostic imaging systems through anonymous, aggregated studies.</li>
                  </ul>
                </div>

                <div id="security">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>3. Data Storage & Security Standards</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    We implement industry-standard encryption protocols (AES-256) to secure your personal health records. Biometric datasets are hosted on restricted-access cloud environments that comply with digital healthcare privacy acts.
                  </p>
                  <div style={{ borderLeft: '3px solid var(--brand)', background: 'rgba(0,159,199,0.03)', padding: '1rem 1.25rem', marginTop: '1rem', borderRadius: '0 8px 8px 0', fontSize: '0.925rem', color: 'var(--muted-foreground)' }}>
                    <strong>Clinical Privacy:</strong> All biometric files are partitioned securely and decrypted only on active clinic visualization devices during appointments.
                  </div>
                </div>

                <div id="disclosure">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>4. Non-Disclosure & Third Parties</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    HEALTH 360 will never sell, rent, or trade your medical or contact datasets to third-party advertisers, insurance providers, or external brokers. Your data is accessible only by you and your authorized clinic therapists.
                  </p>
                </div>

                <div id="rights">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>5. Patient Rights</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    You have the right to request a digital export of your clinical biometrics, ask for data corrections, or request complete deletion of your records from our systems at any time by contacting health360vasai@gmail.com.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px', marginTop: '1rem', fontSize: '0.95rem', color: 'var(--muted-foreground)' }}>
                    <Mail size={18} style={{ color: 'var(--brand)', flexShrink: 0 }} /> Contact our data privacy officer at <a href="mailto:health360vasai@gmail.com" style={{ textDecoration: 'underline', marginLeft: '4px' }}>health360vasai@gmail.com</a>.
                  </div>
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
