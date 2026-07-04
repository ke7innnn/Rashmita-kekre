'use client';

import { useState, useEffect } from 'react';
import { Menu, ArrowRight } from 'lucide-react';
import './Header.css';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

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
        
        <nav className="desktop-nav">
          <ul className="nav-links">
            <li><a href="/#assessment">Assessment</a></li>
            <li><a href="/#our-services">Our Services</a></li>
            <li><a href="/#treatments">Treatment Methods</a></li>
            <li><a href="/#technology">Technology</a></li>
            <li><a href="/#about">About us</a></li>
          </ul>
        </nav>

        <div className="header-actions">
          <a href="/#book" className="btn-primary">
            Book an Assessment <ArrowRight size={20} />
          </a>
          <button className="mobile-menu-btn" aria-label="Open menu">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
