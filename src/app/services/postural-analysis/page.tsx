'use client';

import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Focus, Eye, ShieldAlert, Layers, ChevronDown, User, ScanLine, Sparkles } from 'lucide-react';

const STEPS = [
  { step: '01', title: 'Setup', desc: 'Stand on custom force balance plates facing the AI camera array.' },
  { step: '02', title: 'Skeletal Scan', desc: 'System automatically tracks and logs 32 primary skeletal joint coordinates.' },
  { step: '03', title: 'Gait Test', desc: 'Perform simple steps and shifts to analyze dynamic weight load displacements.' },
  { step: '04', title: 'Diagnostics', desc: 'Review bone-line tilts, spine curves, and ankle pressures on the diagnostic interface.' }
];

const FAQS = [
  { q: 'Why is Postural Analysis part of the assessment?', a: 'Postural deviations (like head extensions or hip tilts) create chronic muscle load, which eventually leads to joint wear and pain. Mapping coordinates helps us correct issues at their source.' },
  { q: 'Is the scanning process safe?', a: 'Yes. We use standard optical cameras and computer-vision depth sensors. No radiation or invasive scanners are used.' },
  { q: 'Can postural analysis help with chronic back pain?', a: 'Yes. It isolates postural asymmetries (such as pelvis rotation) that overload spinal muscles. Correcting these lines directly relieves pressure.' }
];

export default function PosturalAnalysisPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Header />
      <main style={{ paddingTop: 'calc(var(--site-header-height) + 2rem)', minHeight: '80vh' }}>
        
        {/* Hero Section */}
        <section style={{ padding: '5rem 0 3rem', background: 'radial-gradient(circle at top right, rgba(0, 159, 199, 0.04), transparent 60%)' }}>
          <div className="xpad" style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto' }}>
            <motion.p 
              className="subtitle uppercase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Services & Screenings
            </motion.p>
            <motion.h1 
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Postural Analysis
            </motion.h1>
            <motion.p 
              style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Leverage computer-vision technology to map your skeletal coordinates in real-time. Detect imbalances, scoliosis markers, pelvic tilts, and neck extensions.
            </motion.p>
          </div>
        </section>

        {/* Feature Grid & Visuals */}
        <section style={{ padding: '3rem 0' }}>
          <div className="xpad" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '4rem',
              alignItems: 'center'
            }}>
              
              {/* Left Column: Details */}
              <motion.div 
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px', flexShrink: 0 }}>
                    <Focus size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Skeletal Mapping</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      Our tracking sensors capture 32 primary skeletal markers while you stand, diagnosing weight distribution and hip/shoulder line asymmetries.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px', flexShrink: 0 }}>
                    <Layers size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Pelvic & Spine Alignment</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      Diagnose anterior or posterior pelvic tilt, hyper-lordosis, and lateral deviations of the spine during static and dynamic postures.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px', flexShrink: 0 }}>
                    <Eye size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Dynamic Weight Tracking</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      Compare loading patterns between the left and right foot to identify gait deviations that cause unilateral knee or hip stress.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Right Column: Visual Panel */}
              <motion.div 
                className="glass rounded-l" 
                style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <img 
                  src="/posture_scan.png" 
                  alt="Skeletal Posture Scan" 
                  style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}
                />
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px' }}>
                  <ShieldAlert size={20} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                    Notice: Wear fitted athletic wear during your screening appointment to ensure precise computer-vision marker calculation.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>



        {/* What to Expect (Timeline) */}
        <section style={{ padding: '4rem 0', background: 'rgba(0,0,0,0.01)', borderTop: '1px solid rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
          <div className="xpad" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>The Flow</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 500, marginTop: '0.5rem' }}>What to Expect</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
              {STEPS.map((item, idx) => (
                <motion.div 
                  key={item.step}
                  className="glass rounded-m"
                  style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'rgba(0,159,199,0.15)', lineHeight: 1 }}>{item.step}</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 500 }}>{item.title}</h3>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', lineHeight: 1.4 }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section style={{ padding: '5rem 0 6rem' }}>
          <div className="xpad" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 500, marginBottom: '2.5rem', textAlign: 'center' }}>
              Postural FAQs
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {FAQS.map((faq, idx) => (
                <div 
                  key={idx} 
                  className="glass rounded-m" 
                  style={{ overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)' }}
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'left',
                      fontWeight: 500,
                      fontSize: '1.05rem',
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown 
                      size={20} 
                      style={{ 
                        transition: 'transform 0.2s', 
                        transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                        color: 'var(--brand)'
                      }} 
                    />
                  </button>
                  {openFaq === idx && (
                    <motion.div 
                      style={{ padding: '0 1.5rem 1.5rem', color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
