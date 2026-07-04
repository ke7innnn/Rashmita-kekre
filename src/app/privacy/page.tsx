'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: 'calc(var(--site-header-height) + 2rem)', minHeight: '80vh' }}>
        <section style={{ padding: '4rem 0 6rem' }}>
          <div className="xpad" style={{ maxWidth: '800px', margin: '0 auto' }}>
            
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
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem' }}
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

            {/* Document Body */}
            <motion.div 
              className="glass rounded-l" 
              style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.6 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>1. Personal & Biometric Data Collection</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  We collect personal contact information (such as name, email, phone number) when you book an assessment or request support. Additionally, during your physical assessment at HEALTH 360 Clinic, we capture clinical data including postural scan coordinates, joint angles, muscle strength markers, and heart rate indices.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>2. How We Use Your Information</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Your personal and clinical data is used exclusively to:
                </p>
                <ul style={{ color: 'var(--muted-foreground)', paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Generate your movement analysis reports and biometrics card.</li>
                  <li>Design personalized physiotherapy programs and exercise lists.</li>
                  <li>Manage clinic booking schedules and coordinate direct communication.</li>
                  <li>Improve our diagnostic imaging systems through anonymous, aggregated studies.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>3. Data Storage & Security Standards</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  We implement industry-standard encryption protocols (AES-256) to secure your personal health records. Biometric datasets are hosted on restricted-access cloud environments that comply with digital healthcare privacy acts.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>4. Non-Disclosure & Third Parties</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  HEALTH 360 will never sell, rent, or trade your medical or contact datasets to third-party advertisers, insurance providers, or external brokers. Your data is accessible only by you and your authorized clinic therapists.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>5. Patient Rights</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  You have the right to request a digital export of your clinical biometrics, ask for data corrections, or request complete deletion of your records from our systems at any time by contacting hello@health360.clinic.
                </p>
              </div>
            </motion.div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
