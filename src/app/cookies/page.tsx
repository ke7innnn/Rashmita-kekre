'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { BookOpen, ShieldCheck, HelpCircle } from 'lucide-react';

export default function CookiesPage() {
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
                Preferences
              </motion.p>
              <motion.h1 
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', letterSpacing: '-0.02em' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Cookie Policy
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
                    <BookOpen size={18} style={{ color: 'var(--brand)' }} /> Policy Outline
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', color: 'var(--muted-foreground)' }}>
                    <a href="#definition" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>1. What Are Cookies</a>
                    <a href="#usage" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>2. Cookie Usage</a>
                    <a href="#thirdparty" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>3. Third-Party Tracking</a>
                    <a href="#management" style={{ transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--brand)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>4. Preferences</a>
                  </div>
                </div>

                <div className="glass rounded-m" style={{ padding: '1.5rem', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                    We only use cookies to maintain your login session and record anonymous clinical-traffic metrics. No advertising cookies are used.
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
                <div id="definition">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>1. What Are Cookies</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    Cookies are small text files stored on your computer or mobile device when you browse websites. They are widely used to make websites work, or work more efficiently, as well as to provide reporting statistics.
                  </p>
                </div>

                <div id="usage">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>2. How HEALTH 360 Uses Cookies</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    We use cookies and similar tracking identifiers for the following purposes:
                  </p>
                  <ul style={{ color: 'var(--muted-foreground)', paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>Essential Session Cookies:</strong> Required to keep you authenticated inside your patient dashboard and store temporary booking selections.</li>
                    <li><strong>Functional Cookies:</strong> Used to remember your site settings, language preferences, or dashboard layouts.</li>
                    <li><strong>Performance & Analytics Cookies:</strong> Allow us to count page visits and traffic sources anonymously so we can benchmark and improve our web speed.</li>
                  </ul>
                  <div style={{ borderLeft: '3px solid var(--brand)', background: 'rgba(0,159,199,0.03)', padding: '1rem 1.25rem', marginTop: '1rem', borderRadius: '0 8px 8px 0', fontSize: '0.925rem', color: 'var(--muted-foreground)' }}>
                    <strong>Cookie Breakdown:</strong> Session cookies expire instantly when you close your web window. Analytics logs remain active for up to 30 days.
                  </div>
                </div>

                <div id="thirdparty">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>3. Third-Party Tracking</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    HEALTH 360 does not integrate third-party advertising or retargeting cookies (like Facebook Pixel or Google Ads trackers) on our diagnostic interfaces. All cookie-based tracking is kept strictly inside our anonymous analytical scope.
                  </p>
                </div>

                <div id="management">
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--foreground)' }}>4. Managing Cookie Preferences</h3>
                  <p style={{ color: 'var(--muted-foreground)' }}>
                    Most browsers allow you to refuse or accept cookies in settings. Please note that disabling essential cookies might affect the loading of your biometrics card, interactive body diagram, and booking forms.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px', marginTop: '1rem', fontSize: '0.95rem', color: 'var(--muted-foreground)' }}>
                    <HelpCircle size={18} style={{ color: 'var(--brand)', flexShrink: 0 }} /> Learn how to manage settings at your browser vendor support page (Chrome, Safari, Firefox).
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
