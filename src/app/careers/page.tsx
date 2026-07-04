'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, MapPin, Clock } from 'lucide-react';

const POSITIONS = [
  {
    title: 'Senior Physiotherapist',
    department: 'Clinical Care',
    location: 'Mumbai, IN (On-site)',
    type: 'Full-time',
    description: 'Lead assessments using our custom HEALTH 360 biometrics platform, diagnose complex movement disorders, and design advanced recovery protocols.',
  },
  {
    title: 'Movement & Data Analyst',
    department: 'Performance Lab',
    location: 'Mumbai, IN (On-site)',
    type: 'Full-time',
    description: 'Interpret postural, mobility, and cardiovascular screening datasets to optimize patients\' recovery progress and compile biomechanical reports.',
  },
  {
    title: 'Clinic Experience Lead',
    department: 'Operations',
    location: 'Mumbai, IN (On-site)',
    type: 'Full-time',
    description: 'Ensure a premium client journey from reception to post-visit data tracking, handling schedules, bookings, and customer relationships.',
  }
];

export default function CareersPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: 'calc(var(--site-header-height) + 2rem)', minHeight: '80vh' }}>
        {/* Hero Section */}
        <section style={{ padding: '4rem 0 2rem' }}>
          <div className="xpad" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
            <motion.p 
              className="subtitle uppercase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Careers at HEALTH 360
            </motion.p>
            <motion.h1 
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', lineHeight: 1.1 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Join the future of physiotherapy
            </motion.h1>
            <motion.p 
              style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              We are merging expert physiotherapy with state-of-the-art biometrics tracking. Come help us redefine movement, recovery, and human performance.
            </motion.p>
          </div>
        </section>

        {/* Culture & Benefits */}
        <section style={{ padding: '3rem 0' }}>
          <div className="xpad">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem',
              marginTop: '2rem'
            }}>
              <motion.div 
                className="glass rounded-l" 
                style={{ padding: '2.5rem' }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h3 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '1rem' }}>Patient-First Innovation</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  We spend double the industry standard time with patients to build genuine relationships and craft precise, personalized recovery actions.
                </p>
              </motion.div>

              <motion.div 
                className="glass rounded-l" 
                style={{ padding: '2.5rem' }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h3 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '1rem' }}>Modern Workspace</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Work in a sleek, beautifully designed clinic powered by proprietary screening tech, premium gym installations, and streamlined in-house apps.
                </p>
              </motion.div>

              <motion.div 
                className="glass rounded-l" 
                style={{ padding: '2.5rem' }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h3 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '1rem' }}>Constant Growth</h3>
                <p style={{ color: 'var(--muted-foreground)' }}>
                  Receive allowances for certifications, attend regular biomechanics training workshops, and work alongside leading clinical experts.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section style={{ padding: '4rem 0 6rem' }}>
          <div className="xpad" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 500, marginBottom: '2.5rem', textAlign: 'center' }}>
              Open Positions
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {POSITIONS.map((job, idx) => (
                <motion.div 
                  key={idx}
                  className="glass rounded-m"
                  style={{
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    transition: 'all 0.3s ease',
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ translateY: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span className="subtitle uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>{job.department}</span>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginTop: '0.25rem' }}>{job.title}</h3>
                    </div>
                    <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                      Apply <ArrowRight size={16} />
                    </button>
                  </div>
                  
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                    {job.description}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} /> {job.location}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> {job.type}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
