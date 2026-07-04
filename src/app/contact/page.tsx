'use client';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Check } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

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
                Get in Touch
              </motion.p>
              <motion.h1 
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                We're here to help
              </motion.h1>
              <motion.p 
                style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Have questions about our assessments or want to consult with a specialist? Fill out the form or reach us directly.
              </motion.p>
            </div>

            {/* Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
              alignItems: 'start'
            }}>
              
              {/* Left Side: Contact Information */}
              <motion.div 
                style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Contact Card */}
                <div className="glass rounded-l" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 500 }}>Clinic Details</h3>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--brand)', marginTop: '2px' }}><MapPin size={24} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Address</p>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        101-102, Premium Medical Plaza, Linking Road,<br />
                        Santacruz West, Mumbai - 400054
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--brand)', marginTop: '2px' }}><Phone size={24} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Phone</p>
                      <a href="tel:+919876543210" style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
                        +91 98765 43210
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--brand)', marginTop: '2px' }}><Mail size={24} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Email</p>
                      <a href="mailto:hello@health360.clinic" style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
                        hello@health360.clinic
                      </a>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--brand)', marginTop: '2px' }}><Clock size={24} /></div>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>Hours</p>
                      <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.4 }}>
                        Mon - Sat: 9:00 AM - 1:00 PM, 5:00 PM - 9:00 PM<br />
                        Sun: Closed
                      </p>
                    </div>
                  </div>
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
                      style={{ textAlign: 'center', padding: '3rem 0' }}
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
                        margin: '0 auto 1.5rem' 
                      }}>
                        <Check size={32} />
                      </div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>Inquiry Sent!</h3>
                      <p style={{ color: 'var(--muted-foreground)' }}>
                        Thank you for reaching out, {name}. A member of our clinical team will get back to you shortly.
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '0.5rem' }}>Send a Message</h3>
                      
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
                            background: 'rgba(255, 255, 255, 0.5)',
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
                            background: 'rgba(255, 255, 255, 0.5)',
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
                            background: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '1rem',
                            outline: 'none',
                            fontFamily: 'inherit'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label htmlFor="message" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--muted-foreground)' }}>Message / Concern</label>
                        <textarea 
                          id="message"
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            background: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '1rem',
                            outline: 'none',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                        />
                      </div>

                      <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ width: '100%', marginTop: '0.75rem', gap: '8px' }}
                      >
                        Send Inquiry <Send size={18} />
                      </button>
                    </form>
                  )}
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
