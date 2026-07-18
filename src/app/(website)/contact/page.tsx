'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Check, ChevronDown, MessageSquare, ShieldCheck, HelpCircle } from 'lucide-react';

const FAQS = [
  { q: 'How long does a HEALTH 360 assessment take?', a: 'The screening itself takes around 45 minutes, followed by a 15-minute consultation with a senior physiotherapist to walk you through your dashboard readings and custom plan.' },
  { q: 'Do you accept corporate group bookings?', a: 'Yes! We coordinate wellness assessments for corporate teams and athletic clubs. Contact us at health360vasai@gmail.com to coordinate schedules.' },
  { q: 'Do I need a prescription to book a session?', a: 'No, you do not need a physician prescription. Our physiotherapists carry out extensive movement analyses to diagnose and treat limitations.' }
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && phone) {
      setSubmitted(true);
    }
  };

  return (
    <>
      <Header />
      <main style={{ paddingTop: '140px', minHeight: '80vh' }}>
        <section style={{ padding: '4rem 0 6rem', background: 'radial-gradient(circle at bottom left, rgba(0, 159, 199, 0.04), transparent 50%)' }}>
          <div className="xpad" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* Header / Hero Section (Centered) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              maxWidth: '800px',
              margin: '0 auto 4rem'
            }}>
              <motion.p 
                className="subtitle uppercase"
                style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  color: 'var(--brand)', 
                  letterSpacing: '0.1em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 159, 199, 0.08)',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  marginBottom: '1rem'
                }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--brand)' }} />
                Clinical Intake Open
              </motion.p>
              <motion.h1 
                style={{ fontSize: 'clamp(2.5rem, 5vw, 3.8rem)', fontWeight: 500, margin: '1rem 0 1.5rem', letterSpacing: '-0.03em', lineHeight: 1.1 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Let's start your recovery journey
              </motion.h1>
              <motion.p 
                style={{ fontSize: '1.2rem', color: 'var(--muted-foreground)', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Have questions about our biometrics tracking, posture screens, or treatment schedules? Fill out our secure intake form or connect directly with our Vasai clinical team.
              </motion.p>
            </div>

            {/* Grid */}
            <div className="contact-main-grid">
              
              {/* Left Side: Contact Information & FAQs */}
              <motion.div 
                style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Contact Card */}
                <div className="glass rounded-l" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 500, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1rem' }}>Clinic Details</h3>
                  
                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ 
                      color: 'var(--brand)', 
                      marginTop: '2px', 
                      padding: '10px', 
                      background: 'rgba(0,159,199,0.06)', 
                      border: '1px solid rgba(0,159,199,0.12)', 
                      borderRadius: '10px' 
                    }}><MapPin size={20} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Address</p>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        Shop no. 1 & 2, Amardeep Society, Om Nagar,<br />
                        Vasai West, Palghar - 401202
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ 
                      color: '#ef4444', 
                      marginTop: '2px', 
                      padding: '10px', 
                      background: 'rgba(239,68,68,0.06)', 
                      border: '1px solid rgba(239,68,68,0.12)', 
                      borderRadius: '10px' 
                    }}><Phone size={20} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Phone</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <a href="tel:+919834848956" style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', fontWeight: 500 }}>
                          +91 98348 48956
                        </a>
                        <a href="tel:+918482812859" style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', fontWeight: 500 }}>
                          +91 84828 12859
                        </a>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ 
                      color: '#8b5cf6', 
                      marginTop: '2px', 
                      padding: '10px', 
                      background: 'rgba(139,92,246,0.06)', 
                      border: '1px solid rgba(139,92,246,0.12)', 
                      borderRadius: '10px' 
                    }}><Mail size={20} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Email</p>
                      <a href="mailto:health360vasai@gmail.com" style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', fontWeight: 500 }}>
                        health360vasai@gmail.com
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ 
                      color: '#f59e0b', 
                      marginTop: '2px', 
                      padding: '10px', 
                      background: 'rgba(245,158,11,0.06)', 
                      border: '1px solid rgba(245,158,11,0.12)', 
                      borderRadius: '10px' 
                    }}><Clock size={20} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Clinic Hours</p>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.4 }}>
                        Mon - Sat: 10:00 AM - 2:00 PM, 5:00 PM - 9:00 PM<br />
                        Sun: Closed
                      </p>
                    </div>
                  </div>
                </div>

              </motion.div>

              <motion.div
                style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="glass rounded-l" style={{ padding: '2.5rem' }}>
                  
                  {submitted ? (
                    <motion.div 
                      style={{ textAlign: 'center', padding: '3rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', justifyContent: 'center' }}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '50%', 
                        background: 'var(--brand)', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto',
                        boxShadow: '0 8px 24px rgba(0, 159, 199, 0.2)'
                      }}>
                        <Check size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 500, color: '#141414' }}>Message Received!</h3>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.925rem', lineHeight: 1.5 }}>
                        Thank you for contacting HEALTH 360, {name}. A specialist will reach out to you within 12 hours.
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      <div className="split-card-right-header" style={{ marginBottom: '1.75rem' }}>
                        {/* Sunburst SVG */}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="split-card-icon" style={{ marginBottom: '1rem' }}>
                          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                          <circle cx="12" cy="12" r="4.5" fill="var(--brand)" style={{ fillOpacity: 0.15 }} />
                        </svg>
                        <h2 style={{ fontSize: '2rem', fontWeight: 500, color: '#141414', marginTop: '0.5rem' }}>Get Started</h2>
                        <p style={{ fontSize: '0.95rem', color: 'var(--muted-foreground)', marginTop: '0.35rem' }}>Welcome to HEALTH 360 — Let's align your plan</p>
                        <div style={{ height: '1px', backgroundColor: 'rgba(0,0,0,0.06)', width: '100%', marginTop: '1.25rem' }} />
                      </div>

                      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="split-form-group">
                          <label className="split-form-label" htmlFor="name">Your name</label>
                          <input 
                            type="text" 
                            id="name"
                            required
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="split-form-input"
                          />
                        </div>

                        <div className="split-form-group">
                          <label className="split-form-label" htmlFor="phone">Your phone</label>
                          <input 
                            type="tel" 
                            id="phone"
                            required
                            placeholder="+91 XXXXX XXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="split-form-input"
                          />
                        </div>

                        <div className="split-form-group">
                          <label className="split-form-label" htmlFor="email">Your email address</label>
                          <input 
                            type="email" 
                            id="email"
                            required
                            placeholder="health360vasai@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="split-form-input"
                          />
                        </div>

                        <div className="split-form-group">
                          <label className="split-form-label" htmlFor="message">Clinical concerns</label>
                          <textarea 
                            id="message"
                            rows={3}
                            placeholder="Explain any back pain, injuries, or recovery goals..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="split-form-textarea"
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="btn-primary" 
                          style={{ width: '100%', marginTop: '0.25rem', gap: '8px', padding: '12px 24px', borderRadius: '12px', fontSize: '1rem' }}
                        >
                          Send Secure Message <Send size={16} />
                        </button>
                      </form>

                      <div className="split-card-link-btn" style={{ marginTop: '1.25rem' }}>
                        Need urgent booking? <a href="tel:+919834848956">Call Us Now</a>
                      </div>
                    </>
                  )}

                </div>

                {/* FAQ Sub-Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 500, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageSquare size={20} style={{ color: 'var(--brand)' }} /> Booking FAQs
                  </h3>
                  
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
                          padding: '1.25rem 1.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          textAlign: 'left',
                          fontWeight: 500,
                          fontSize: '1rem',
                          background: 'none',
                          border: 'none',
                          color: 'inherit',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown 
                          size={18} 
                          style={{ 
                            transition: 'transform 0.2s', 
                            transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                            color: 'var(--brand)',
                            flexShrink: 0
                          }} 
                        />
                      </button>
                      {openFaq === idx && (
                        <motion.div 
                          style={{ padding: '0 1.5rem 1.25rem', color: 'var(--muted-foreground)', fontSize: '0.925rem', lineHeight: 1.5 }}
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          {faq.a}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Clinic Location & Visitor Guide */}
            <div style={{
              marginTop: '6rem',
              borderTop: '1px solid rgba(0,0,0,0.05)',
              paddingTop: '5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '4rem',
              alignItems: 'center'
            }}>
              
              {/* Left Side: Storefront Illustration */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <motion.div 
                  className="glass rounded-l" 
                  style={{ 
                    position: 'relative', 
                    width: '100%', 
                    maxWidth: '480px', 
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
                    src="/clinic_location_visual.jpg" 
                    alt="HEALTH 360 Clinic Corridor and Rehabilitation Equipment Area" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      borderRadius: '16px' 
                    }} 
                  />
                </motion.div>
              </div>

              {/* Right Side: Visitor Guide Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div>
                  <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Visitor details</p>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 500, marginTop: '0.5rem', letterSpacing: '-0.02em' }}>Location & Visitor Guide</h2>
                  <p style={{ color: 'var(--muted-foreground)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                    Find us in Vasai West, Palghar. Here is everything you need to know to prepare for your clinical visit.
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
                    <div style={{ color: 'var(--brand)', marginTop: '3px', background: 'rgba(0,159,199,0.06)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,159,199,0.08)', flexShrink: 0 }}>
                      <HelpCircle size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '1.15rem', color: 'var(--foreground)' }}>Preparation for First Visit</h4>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.93rem', lineHeight: 1.5, marginTop: '6px' }}>
                        Please wear loose, comfortable clothing (e.g., track pants, training t-shirts) that allow full movement assessment. Arrive 10 minutes prior to your appointment time.
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
                    <div style={{ color: 'var(--brand)', marginTop: '3px', background: 'rgba(0,159,199,0.06)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,159,199,0.08)', flexShrink: 0 }}>
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '1.15rem', color: 'var(--foreground)' }}>Dedicated Patient Parking</h4>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.93rem', lineHeight: 1.5, marginTop: '6px' }}>
                        Free reserved clinic parking slots are available directly in front of the main entrance at Amardeep Society building for easy wheelchair/stretcher access.
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
                    <div style={{ color: 'var(--brand)', marginTop: '3px', background: 'rgba(0,159,199,0.06)', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,159,199,0.08)', flexShrink: 0 }}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '1.15rem', color: 'var(--foreground)' }}>Public Transit Directions</h4>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.93rem', lineHeight: 1.5, marginTop: '6px' }}>
                        The clinic is situated a convenient 7-minute auto-rickshaw or taxi drive from the Vasai Road Railway Station (Western Line).
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
