'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ArrowRight, Briefcase, MapPin, Clock, Heart, Award, Sparkles, Smile, GraduationCap, Coffee, ChevronDown } from 'lucide-react';

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

const PERKS = [
  { icon: <Heart size={24} />, title: 'Premium Health Coverage', desc: 'Comprehensive medical insurance covering you and your immediate dependents.' },
  { icon: <Award size={24} />, title: 'Performance Bonuses', desc: 'Quarterly financial rewards based on client satisfaction scores and clinical outcomes.' },
  { icon: <GraduationCap size={24} />, title: 'Education & Training Fund', desc: 'Annual budget for specialized physiotherapy certifications, courses, and seminars.' },
  { icon: <Sparkles size={24} />, title: 'State-of-the-Art Tech', desc: 'Work with the latest AI computer-vision systems, force plates, and custom software.' },
  { icon: <Smile size={24} />, title: 'Wellness Program', desc: 'Free monthly diagnostic scans, physiotherapy sessions, and customized physical therapy.' },
  { icon: <Coffee size={24} />, title: 'Flexible Time-off', desc: 'Generous paid leaves, wellness days, and a structured, balanced weekly schedule.' }
];

const STEPS = [
  { number: '01', title: 'Online Application', desc: 'Submit your resume and brief clinical interests through our application portal.' },
  { number: '02', title: 'Technical Call', desc: 'A 30-minute discussion regarding your clinical approach, experience, and biomechanics alignment.' },
  { number: '03', title: 'In-Clinic Assessment', desc: 'Visit our flagship clinic, run a mock assessment, and demonstrate your hands-on therapy methods.' },
  { number: '04', title: 'Final Review & Offer', desc: 'Align on clinical responsibilities, career growth paths, and receive a formal offer.' }
];

const FAQS = [
  { q: 'What is the clinical training timeline for new hires?', a: 'All clinical team members undergo a comprehensive 2-week training program on our proprietary screening software, AI cameras, and dynamometer devices, led by Dr. Rashmita.' },
  { q: 'Is there a path for career progression?', a: 'Absolutely. We offer paths from Junior Physiotherapist to Senior Clinician, Performance Lab Lead, and Clinic Operations Manager as we scale our locations.' },
  { q: 'Do you support relocation to Mumbai?', a: 'For senior clinical roles, we offer structured relocation assistance packages covering travel and initial temporary housing support.' }
];

export default function CareersPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Header />
      <main style={{ paddingTop: 'calc(var(--site-header-height) + 2rem)', minHeight: '80vh' }}>
        
        {/* Hero Section */}
        <section style={{ padding: '5rem 0 3rem', background: 'radial-gradient(circle at top right, rgba(0, 159, 199, 0.05), transparent 60%)' }}>
          <div className="xpad" style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto' }}>
            <motion.p 
              className="subtitle uppercase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Careers at HEALTH 360
            </motion.p>
            <motion.h1 
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Redefine physical wellness with us
            </motion.h1>
            <motion.p 
              style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              We are merging clinical expert physiotherapy with real-time biometric datasets. Join a team dedicated to movement longevity and patient-first innovation.
            </motion.p>
          </div>
        </section>

        {/* Perks & Benefits */}
        <section style={{ padding: '4rem 0' }}>
          <div className="xpad" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>The Experience</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 500, marginTop: '0.5rem' }}>Perks & Benefits</h2>
            </div>
            
             <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '2rem'
            }}>
              {PERKS.map((perk, idx) => (
                <motion.div 
                  key={idx}
                  className="glass rounded-l" 
                  style={{ 
                    padding: '2.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1.1rem',
                    border: '1px solid rgba(255, 255, 255, 0.45)',
                    boxShadow: '0 8px 30px -10px rgba(0, 0, 0, 0.03)',
                    cursor: 'pointer'
                  }}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ 
                    y: -6, 
                    backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                    borderColor: 'rgba(0, 159, 199, 0.25)',
                    boxShadow: '0 24px 48px -15px rgba(0, 159, 199, 0.08)'
                  }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <div style={{ 
                    color: 'var(--brand)', 
                    width: '48px', 
                    height: '48px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: 'rgba(0,159,199,0.06)', 
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 159, 199, 0.08)'
                  }}>
                    {perk.icon}
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginTop: '0.5rem', color: 'var(--foreground)' }}>{perk.title}</h3>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.55 }}>
                    {perk.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Workplace Culture & Core Values */}
        <section style={{ padding: '5rem 0', background: 'rgba(0,159,199,0.01)', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
          <div className="xpad" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '4rem',
              alignItems: 'center'
            }}>
              
              {/* Left Column: Values */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Our Environment</p>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 500, marginTop: '0.5rem', letterSpacing: '-0.02em' }}>Workplace Culture & Values</h2>
                  <p style={{ color: 'var(--muted-foreground)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                    We believe that premium client outcomes start with a supportive, growth-oriented environment for our clinicians and staff.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <motion.div 
                    className="glass rounded-m" 
                    style={{ 
                      padding: '1.75rem', 
                      display: 'flex', 
                      gap: '1.25rem', 
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.45)',
                      boxShadow: '0 8px 24px -10px rgba(0, 0, 0, 0.03)'
                    }}
                    whileHover={{ 
                      y: -4, 
                      backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                      borderColor: 'rgba(0, 159, 199, 0.25)',
                      boxShadow: '0 16px 36px -12px rgba(0, 159, 199, 0.08)'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <div style={{ color: 'var(--brand)', marginTop: '3px', background: 'rgba(0,159,199,0.06)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,159,199,0.08)' }}>
                      <Award size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '1.15rem', color: 'var(--foreground)' }}>Continuous Growth & Education</h4>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.93rem', lineHeight: 1.5, marginTop: '6px' }}>
                        We fund advanced certifications (manual therapy, dry needling, craniosacral training) and hold bi-weekly peer reviews to elevate clinical competencies.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="glass rounded-m" 
                    style={{ 
                      padding: '1.75rem', 
                      display: 'flex', 
                      gap: '1.25rem', 
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.45)',
                      boxShadow: '0 8px 24px -10px rgba(0, 0, 0, 0.03)'
                    }}
                    whileHover={{ 
                      y: -4, 
                      backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                      borderColor: 'rgba(0, 159, 199, 0.25)',
                      boxShadow: '0 16px 36px -12px rgba(0, 159, 199, 0.08)'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <div style={{ color: 'var(--brand)', marginTop: '3px', background: 'rgba(0,159,199,0.06)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,159,199,0.08)' }}>
                      <Heart size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '1.15rem', color: 'var(--foreground)' }}>Collaboration-First Model</h4>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.93rem', lineHeight: 1.5, marginTop: '6px' }}>
                        Our physiotherapists, analysts, and operations leads coordinate dynamically. We treat complex conditions by combining mechanical reviews with neurological perspectives.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="glass rounded-m" 
                    style={{ 
                      padding: '1.75rem', 
                      display: 'flex', 
                      gap: '1.25rem', 
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.45)',
                      boxShadow: '0 8px 24px -10px rgba(0, 0, 0, 0.03)'
                    }}
                    whileHover={{ 
                      y: -4, 
                      backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                      borderColor: 'rgba(0, 159, 199, 0.25)',
                      boxShadow: '0 16px 36px -12px rgba(0, 159, 199, 0.08)'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <div style={{ color: 'var(--brand)', marginTop: '3px', background: 'rgba(0,159,199,0.06)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,159,199,0.08)' }}>
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '1.15rem', color: 'var(--foreground)' }}>Sustained Professional Wellness</h4>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.93rem', lineHeight: 1.5, marginTop: '6px' }}>
                        We respect work-life balances, maintaining structured schedules and limits on daily case volumes to prevent clinical fatigue and ensure premium patient care.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Right Column: Beautiful Generated Image */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <motion.div 
                  className="glass rounded-l" 
                  style={{ 
                    position: 'relative', 
                    width: '100%', 
                    maxWidth: '450px', 
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
                    src="/clinic_careers.png" 
                    alt="HEALTH 360 Collaborative Clinic Environment" 
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
          </div>
        </section>

        {/* Hiring Process */}
        <section style={{ padding: '4rem 0', background: 'rgba(0,0,0,0.01)', borderTop: '1px solid rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
          <div className="xpad" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Our Journey together</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 500, marginTop: '0.5rem' }}>The Hiring Process</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', position: 'relative' }}>
              {STEPS.map((step, idx) => (
                <motion.div 
                  key={idx}
                  className="glass rounded-m"
                  style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'rgba(0,159,199,0.15)', lineHeight: 1 }}>
                    {step.number}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 500 }}>{step.title}</h3>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', lineHeight: 1.4 }}>
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Job Listings */}
        <section style={{ padding: '5rem 0 4rem' }}>
          <div className="xpad" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Join the team</p>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 500, marginTop: '0.5rem' }}>Open Roles</h2>
            </div>
            
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
                    <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.95rem' }}>
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

        {/* Careers FAQs */}
        <section style={{ padding: '3rem 0 6rem' }}>
          <div className="xpad" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 500, marginBottom: '2rem', textAlign: 'center' }}>
              Frequently Asked Questions
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
