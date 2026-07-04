'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';

export default function TermsPage() {
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
                Legal documents
              </motion.p>
              <motion.h1 
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Terms & Conditions
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
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>1. Agreement to Terms</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Welcome to HEALTH 360 ("Company", "we", "us", or "our"). By accessing or using our website, biometrics applications, scheduling tools, and clinical consultation services, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use our services.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>2. Clinical Assessments & Biometrics Data</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Our HEALTH 360 Assessment is designed to analyze posture, mobility, strength, and cardiovascular metrics. The results provided are for physical screening, wellness guidance, and specialized physiotherapy purposes. They do not replace surgical diagnoses or emergency medical assessments. Consult with a qualified physician before starting any extreme physical regimen.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>3. Bookings, Cancellations, and Refunds</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Clients can book assessments and follow-up physiotherapy sessions online through our booking portal. We require a 24-hour notice for appointment cancellations or rescheduling. Cancellations made less than 24 hours prior to the scheduled slot may incur a service charge. Refunds will be processed through the original payment channel.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>4. Intellectual Property Rights</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Unless otherwise indicated, the website, proprietary biometrics scoring code, user dashboard interfaces, logos, designs, text, photographs, and diagnostic diagrams are our proprietary property and are protected by copyright, trademark, and intellectual property laws.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>5. Limitation of Liability</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  In no event shall HEALTH 360, its clinicians, directors, or employees be liable for any indirect, consequential, exemplary, incidental, or punitive damages arising from your use of the website or physical training exercises conducted outside the supervision of our physiotherapists.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>6. Governing Law</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  These terms shall be governed by and defined following the laws of India. HEALTH 360 Clinic and yourself irrevocably consent that the courts of Mumbai shall have exclusive jurisdiction to resolve any dispute which may arise under these terms.
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
