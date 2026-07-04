'use client';

import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Compass, ShieldAlert, Activity, ShieldCheck, ChevronDown, User, ActivitySquare } from 'lucide-react';

const STEPS = [
  { step: '01', title: 'Calibration', desc: 'Calibrate motion camera tracking sensors based on shoulder/hip coordinate points.' },
  { step: '02', title: 'Active Tests', desc: 'Perform specific movement drills including deep squats, lunges, and spine rotations.' },
  { step: '03', title: 'Kinetic Scan', desc: 'Capture real-time degree limits of joint extensions and flexions.' },
  { step: '04', title: 'Action Plan', desc: 'Review range-of-motion (ROM) deficits and compile customized mobility therapies.' }
];

const FAQS = [
  { q: 'What is the difference between flexibility and mobility?', a: 'Flexibility is the passive ability of a muscle to stretch, while mobility is the active ability of a joint to move through its full range of motion. We focus on mobility since it dictates active athletic control.' },
  { q: 'I have stiff joints. Is the mobility test suitable for me?', a: 'Yes, absolutely. The screening is tailored to identify where the stiffness is originating (capsular block or muscular tightness) so we can relieve it.' },
  { q: 'Will I get instant results?', a: 'Yes. All movement scans are processed immediately and synchronized to your dashboard by the end of your session.' }
];

export default function MobilityScreeningPage() {
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
              Mobility Screening
            </motion.h1>
            <motion.p 
              style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Map out the functional ranges of your primary joints. Pinpoint flexibility thresholds, muscle tightness, and joint restrictions before they escalate.
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
                    <Compass size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Range of Motion (ROM)</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      We check actual degrees of extension, flexion, and rotation across your shoulders, thoracic spine, hips, knees, and ankles.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px', flexShrink: 0 }}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Kinetic Compensations</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      Identify if your body is recruiting secondary muscles (compensating) to execute simple squats, lunges, or overhead reaches.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                  <div style={{ color: 'var(--brand)', padding: '10px', background: 'rgba(0, 159, 199, 0.08)', borderRadius: '12px', flexShrink: 0 }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.25rem' }}>Stiffness & Block Profiling</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.5 }}>
                      Isolate whether a movement restriction is a muscular flexibility issue (soft-tissue tight) or a capsular joint limitation (bone-on-bone).
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
                  src="/mobility_screen.png" 
                  alt="Joint Mobility Screening" 
                  style={{ width: '100%', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}
                />
                <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px' }}>
                  <ShieldAlert size={20} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                    Guide: Wear flexible athletic clothing that doesn\'t limit your stretching movements to get accurate angle snapshots.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mock Report Card */}
        <section style={{ padding: '4rem 0' }}>
          <div className="xpad" style={{ maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Client Dashboard</p>
              <h2 style={{ fontSize: '2rem', fontWeight: 500, marginTop: '0.5rem' }}>Sample Mobility Report Card</h2>
            </div>

            <motion.div 
              className="glass rounded-l"
              style={{ padding: '2.5rem', border: '1px solid rgba(0, 159, 199, 0.15)', boxShadow: '0 20px 40px rgba(0, 159, 199, 0.03)' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '1.25rem', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 500 }}>Alex Rivers</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Assessment ID: H360-9824</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(0,159,199,0.06)', borderRadius: '9999px', fontSize: '0.85rem', color: 'var(--brand)', fontWeight: 500 }}>
                  <ActivitySquare size={16} /> Mobility Score: 88/100
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Shoulder Flexion (L / R)</span>
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>174° / 176°</span>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '95%', height: '100%', background: 'var(--brand)' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Thoracic Extension</span>
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>42°</span>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '70%', height: '100%', background: 'var(--brand)' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Hip Flexion ROM</span>
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--foreground)' }}>118°</span>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '90%', height: '100%', background: 'var(--brand)' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
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
              Mobility FAQs
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
