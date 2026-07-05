'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Check, ChevronDown, MessageSquare, ShieldCheck } from 'lucide-react';

const FAQS = [
  { q: 'How long does a HEALTH 360 assessment take?', a: 'The screening itself takes around 45 minutes, followed by a 15-minute consultation with a senior physiotherapist to walk you through your dashboard readings and custom plan.' },
  { q: 'Do you accept corporate group bookings?', a: 'Yes! We coordinate wellness assessments for corporate teams and athletic clubs. Contact us at partners@health360.clinic to coordinate schedules.' },
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
      <main style={{ paddingTop: 'calc(var(--site-header-height) + 2rem)', minHeight: '80vh' }}>
        <section style={{ padding: '4rem 0 6rem', background: 'radial-gradient(circle at bottom left, rgba(0, 159, 199, 0.04), transparent 50%)' }}>
          <div className="xpad" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
              <motion.p 
                className="subtitle uppercase"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Get in Touch
              </motion.p>
              <motion.h1 
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', letterSpacing: '-0.03em' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Connect with our clinic
              </motion.h1>
              <motion.p 
                style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', maxWidth: '650px', margin: '0 auto', lineHeight: 1.5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Have questions about our biometrics tracking, schedules, or recovery programs? Fill out our secure form or contact us directly.
              </motion.p>
            </div>

            {/* Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '3rem',
              alignItems: 'start'
            }}>
              
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
                    <div style={{ color: 'var(--brand)', marginTop: '2px', padding: '8px', background: 'rgba(0,159,199,0.06)', borderRadius: '8px' }}><MapPin size={20} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Address</p>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        Shop no. 1 & 2, Amardeep Society, Om Nagar,<br />
                        Vasai West, Palghar - 401202
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--brand)', marginTop: '2px', padding: '8px', background: 'rgba(0,159,199,0.06)', borderRadius: '8px' }}><Phone size={20} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Phone</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <a href="tel:+919834848956" style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
                          +91 98348 48956
                        </a>
                        <a href="tel:+918482812859" style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
                          +91 84828 12859
                        </a>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--brand)', marginTop: '2px', padding: '8px', background: 'rgba(0,159,199,0.06)', borderRadius: '8px' }}><Mail size={20} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Email</p>
                      <a href="mailto:hello@health360.clinic" style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
                        hello@health360.clinic
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--brand)', marginTop: '2px', padding: '8px', background: 'rgba(0,159,199,0.06)', borderRadius: '8px' }}><Clock size={20} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Clinic Hours</p>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.4 }}>
                        Mon - Sat: 10:00 AM - 2:00 PM, 5:00 PM - 9:00 PM<br />
                        Sun: Closed
                      </p>
                    </div>
                  </div>
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
                            color: 'var(--brand)'
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

              {/* Right Side: Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="glass rounded-l" style={{ padding: '2.5rem' }}>
                  {submitted ? (
                    <motion.div 
                      style={{ textAlign: 'center', padding: '4rem 0' }}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <div style={{ 
                        width: '72px', 
                        height: '72px', 
                        borderRadius: '50%', 
                        background: 'var(--brand)', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 8px 24px rgba(0, 159, 199, 0.2)'
                      }}>
                        <Check size={36} />
                      </div>
                      <h3 style={{ fontSize: '1.65rem', fontWeight: 500, marginBottom: '0.5rem' }}>Message Received!</h3>
                      <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                        Thank you for contacting HEALTH 360, {name}. A clinic specialist will respond at your phone or email details within 12 hours.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 500 }}>Send a secure message</h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="name" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>Name *</label>
                        <input 
                          type="text" 
                          id="name"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            background: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '1rem',
                            outline: 'none',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>Email *</label>
                        <input 
                          type="email" 
                          id="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            background: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '1rem',
                            outline: 'none',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="phone" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>Phone Number *</label>
                        <input 
                          type="tel" 
                          id="phone"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            background: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '1rem',
                            outline: 'none',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="message" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>Concern / Message</label>
                        <textarea 
                          id="message"
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            background: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '1rem',
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(0,0,0,0.01)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.03)' }}>
                        <ShieldCheck size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Clinical grade security. Your message is encrypted.</span>
                      </div>

                      <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ width: '100%', marginTop: '0.5rem', gap: '8px' }}
                      >
                        Send message <Send size={16} />
                      </button>
                    </form>
                  )}
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
                    src="/clinic_location_visual.png" 
                    alt="HEALTH 360 Clinic Building Frontage Watercolor Rendering" 
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
                  <div className="glass rounded-m" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--brand)', marginTop: '3px' }}><ShieldCheck size={20} /></div>
                    <div>
                      <h4 style={{ fontWeight: 500, fontSize: '1.1rem' }}>Preparation for First Visit</h4>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', lineHeight: 1.4, marginTop: '4px' }}>
                        Please wear loose, comfortable clothing (e.g., track pants, training t-shirts) that allow full movement assessment. Arrive 10 minutes prior to your appointment time.
                      </p>
                    </div>
                  </div>

                  <div className="glass rounded-m" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--brand)', marginTop: '3px' }}><MapPin size={20} /></div>
                    <div>
                      <h4 style={{ fontWeight: 500, fontSize: '1.1rem' }}>Dedicated Patient Parking</h4>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', lineHeight: 1.4, marginTop: '4px' }}>
                        Free reserved clinic parking slots are available directly in front of the main entrance at Amardeep Society building for easy wheelchair/stretcher access.
                      </p>
                    </div>
                  </div>

                  <div className="glass rounded-m" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--brand)', marginTop: '3px' }}><Clock size={20} /></div>
                    <div>
                      <h4 style={{ fontWeight: 500, fontSize: '1.1rem' }}>Public Transit Directions</h4>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', lineHeight: 1.4, marginTop: '4px' }}>
                        The clinic is situated a convenient 7-minute auto-rickshaw or taxi drive from the Vasai Road Railway Station (Western Line).
                      </p>
                    </div>
                  </div>
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
