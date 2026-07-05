'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { BookOpen, Scale, Landmark, ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: 'calc(var(--site-header-height) + 2rem)', minHeight: '80vh' }}>
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
                Legal documents
              </motion.p>
              <motion.h1 
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', letterSpacing: '-0.02em' }}
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

            {/* Split Layout */}
            <div className="legal-grid">
              
              {/* Sticky Sidebar */}
              <div style={{
                position: 'sticky',
                top: 'calc(var(--site-header-height) + 2rem)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div className="glass rounded-m" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 500, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} style={{ color: 'var(--brand)' }} /> Quick Navigation
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: 'var(--muted-foreground)' }}>
                    <a href="#agreement" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>1. Agreement to Terms</a>
                    <a href="#biometrics" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>2. Biometrics Data</a>
                    <a href="#bookings" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>3. Bookings & Refunds</a>
                    <a href="#intellectual" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>4. Intellectual Property</a>
                    <a href="#liability" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>5. Liability Limits</a>
                    <a href="#governing" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>6. Governing Law</a>
                  </div>
                </div>

                <div className="glass rounded-m" style={{ padding: '1.5rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                    By booking an assessment at HEALTH 360, you confirm that you accept all protocols in this clinical service agreement.
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
                <div id="agreement">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>1. Agreement to Terms</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    Welcome to HEALTH 360 ("Company", "we", "us", or "our"). By accessing or using our website, biometrics applications, scheduling tools, and clinical consultation services, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use our services.
                  </p>
                </div>

                <div id="biometrics">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>2. Clinical Assessments & Biometrics Data</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    Our HEALTH 360 Assessment is designed to analyze posture, mobility, strength, and cardiovascular metrics. The results provided are for physical screening, wellness guidance, and specialized physiotherapy purposes. They do not replace surgical diagnoses or emergency medical assessments. Consult with a qualified physician before starting any extreme physical regimen.
                  </p>
                  <div style={{ borderLeft: '3px solid var(--brand)', background: 'rgba(0,159,199,0.03)', padding: '1rem 1.25rem', marginTop: '1rem', borderRadius: '0 8px 8px 0', fontSize: '0.925rem', color: 'var(--muted-foreground)' }}>
                    <strong>Clinical Takeaway:</strong> Posture scans and joint measurements require active standing/sitting. Ensure you communicate any pre-existing physical constraints before screening starts.
                  </div>
                </div>

                <div id="bookings">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>3. Bookings, Cancellations, and Refunds</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    Clients can book assessments and follow-up physiotherapy sessions online through our booking portal. We require a 24-hour notice for appointment cancellations or rescheduling. Cancellations made less than 24 hours prior to the scheduled slot may incur a service charge. Refunds will be processed through the original payment channel.
                  </p>
                </div>

                <div id="intellectual">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>4. Intellectual Property Rights</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    Unless otherwise indicated, the website, proprietary biometrics scoring code, user dashboard interfaces, logos, designs, text, photographs, and diagnostic diagrams are our proprietary property and are protected by copyright, trademark, and intellectual property laws.
                  </p>
                </div>

                <div id="liability">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>5. Limitation of Liability</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    In no event shall HEALTH 360, its clinicians, directors, or employees be liable for any indirect, consequential, exemplary, incidental, or punitive damages arising from your use of the website or physical training exercises conducted outside the supervision of our physiotherapists.
                  </p>
                </div>

                <div id="governing">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>6. Governing Law</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    These terms shall be governed by and defined following the laws of India. HEALTH 360 Clinic and yourself irrevocably consent that the courts of Mumbai shall have exclusive jurisdiction to resolve any dispute which may arise under these terms.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                    <Scale size={18} style={{ color: 'var(--brand)', flexShrink: 0 }} /> All contractual disputes fall under local Mumbai clinical courts.
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
