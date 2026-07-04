'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';

export default function CookiesPage() {
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
                Preferences
              </motion.p>
              <motion.h1 
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem' }}
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

            {/* Document Body */}
            <motion.div 
              className="glass rounded-l" 
              style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: 1.6 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>1. What Are Cookies</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Cookies are small text files stored on your computer or mobile device when you browse websites. They are widely used to make websites work, or work more efficiently, as well as to provide reporting statistics.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>2. How HEALTH 360 Uses Cookies</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  We use cookies and similar tracking identifiers for the following purposes:
                </p>
                <ul style={{ color: 'var(--muted-foreground)', paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li><strong>Essential Session Cookies:</strong> Required to keep you authenticated inside your patient dashboard and store temporary booking selections.</li>
                  <li><strong>Functional Cookies:</strong> Used to remember your site settings, language preferences, or dashboard layouts.</li>
                  <li><strong>Performance & Analytics Cookies:</strong> Allow us to count page visits and traffic sources anonymously so we can benchmark and improve our web speed.</li>
                </ul>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>3. Third-Party Tracking</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  HEALTH 360 does not integrate third-party advertising or retargeting cookies (like Facebook Pixel) on our diagnostic interfaces. All cookie-based tracking is kept strictly inside our analytics scope.
                </p>
              </div>

              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.75rem' }}>4. Managing Cookie Preferences</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Most browsers allow you to refuse or accept cookies in settings. Please note that disabling essential cookies might affect the loading of your biometrics card, interactive body diagram, and booking forms.
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
