'use client';

import { useState, useEffect } from 'react';
import { Menu, ArrowRight, X } from 'lucide-react';
import Magnetic from './Magnetic';
import './Header.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`site-header glass-nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container xpad">
        <a href="/" className="logo">
          HEALTH<span className="logo-accent">360</span>
        </a>
        
        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About us</a></li>
            <li><a href="/#our-services">Services</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/careers">Careers</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <Magnetic strength={0.25}>
            <a href="/#book" className="btn-primary">
              Book Appointment <ArrowRight size={20} />
            </a>
          </Magnetic>
          <button 
            className="mobile-menu-btn" 
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '6px' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <nav className="mobile-nav glass" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'rgba(250, 247, 236, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '2rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          zIndex: 100
        }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <li><a href="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--foreground)' }}>Home</a></li>
            <li><a href="/about" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--foreground)' }}>About us</a></li>
            <li><a href="/#our-services" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--foreground)' }}>Services</a></li>
            <li><a href="/contact" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--foreground)' }}>Contact</a></li>
            <li><a href="/careers" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--foreground)' }}>Careers</a></li>
          </ul>
          <a href="/#book" onClick={() => setMobileMenuOpen(false)} className="btn-primary" style={{ width: '100%', textAlign: 'center', justifyContent: 'center', marginTop: '0.5rem' }}>
            Book Appointment <ArrowRight size={20} />
          </a>
        </nav>
      )}
    </header>
  );
}
