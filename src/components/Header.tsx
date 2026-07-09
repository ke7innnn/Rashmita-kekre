'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <a href="/" className="logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Health 360 Logo" style={{ height: scrolled ? '58px' : '72px', width: 'auto', objectFit: 'contain', transition: 'height 0.3s ease' }} />
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
            className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="hamburger-box">
              <span className="hamburger-inner"></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav 
            className="mobile-nav-menu"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <ul className="mobile-nav-links">
              {[
                { name: 'Home', href: '/' },
                { name: 'About us', href: '/about' },
                { name: 'Services', href: '/#our-services' },
                { name: 'Contact', href: '/contact' },
                { name: 'Careers', href: '/careers' }
              ].map((item, idx) => (
                <motion.li 
                  key={item.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 + 0.1, duration: 0.3 }}
                >
                  <a href={item.href} onClick={() => setMobileMenuOpen(false)}>
                    {item.name}
                  </a>
                </motion.li>
              ))}
            </ul>
            <motion.div 
              className="mobile-nav-action"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <a href="/#book" onClick={() => setMobileMenuOpen(false)} className="btn-primary">
                Book Appointment <ArrowRight size={20} />
              </a>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
