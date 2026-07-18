import { Phone, ExternalLink, Activity } from 'lucide-react';
import './Footer.css';

export default function Footer() {
  return (
    <footer id="footer" className="site-footer">
      <div className="xpad footer-content-wrapper">
        
        {/* Top Header Row */}
        <div className="footer-top-header">
          <h2 className="footer-main-title">
            Your trusted partner<br />
            in movement & recovery
          </h2>
          <a href="/contact" className="footer-contact-pill">
            Contact <ExternalLink size={16} />
          </a>
        </div>

        {/* Four Column Navigation Links Grid */}
        <div className="footer-nav-grid">
          
          {/* Column 1: Services */}
          <div className="footer-nav-column">
            <h4 className="footer-nav-heading">Services</h4>
            <ul className="footer-nav-list">
              <li><a href="/#our-services">Musculoskeletal Physio</a></li>
              <li><a href="/#our-services">Neurological Physio</a></li>
              <li><a href="/#our-services">Pediatric Physio</a></li>
              <li><a href="/#our-services">Geriatric Physio</a></li>
              <li><a href="/#our-services">Women's Health</a></li>
            </ul>
          </div>

          {/* Column 2: Explore */}
          <div className="footer-nav-column">
            <h4 className="footer-nav-heading">Explore</h4>
            <ul className="footer-nav-list">
              <li><a href="/">Home</a></li>
              <li><a href="/about">About us</a></li>
              <li><a href="/gallery">Gallery</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/press">Press</a></li>
              <li><a href="/referral">Doctor Referral</a></li>
            </ul>
          </div>

          {/* Column 3: Say hello! */}
          <div className="footer-nav-column">
            <h4 className="footer-nav-heading">Say hello!</h4>
            <div className="footer-contact-pills">
              <a href="tel:+918482812859" className="phone-pill-link">
                <Phone size={14} /> +91 84828 12859
              </a>
              <a href="tel:+919834848956" className="phone-pill-link">
                <Phone size={14} /> +91 98348 48956
              </a>
            </div>
            <div className="footer-social-circles">
              <a href="https://www.facebook.com/profile.php?id=100090143185713" target="_blank" rel="noopener noreferrer" className="social-circle-btn" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://www.instagram.com/health360physiotherapy_clinic?utm_source=ig_web_button_share_sheet&igsh=ZDN" target="_blank" rel="noopener noreferrer" className="social-circle-btn" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
            </div>
          </div>

          {/* Column 4: Clinic hours */}
          <div className="footer-nav-column">
            <h4 className="footer-nav-heading">Clinic hours ↗</h4>
            <div className="hours-table">
              <div className="hours-row">
                <span className="day-lbl">Mon – Sat</span>
                <span className="time-val">10:00 AM – 2:00 PM</span>
              </div>
              <div className="hours-row">
                <span className="day-lbl">Mon – Sat</span>
                <span className="time-val">5:00 PM – 9:00 PM</span>
              </div>
              <div className="hours-row">
                <span className="day-lbl">Sunday</span>
                <span className="time-val closed">Closed</span>
              </div>
            </div>
            {/* Cardiogram post-it graphic */}
            <div className="cardiogram-graphic-card">
              <Activity className="cardio-svg" size={24} />
              <div className="cardio-bg-lines" />
            </div>
          </div>

        </div>

        {/* Map and Address Column Section */}
        <div className="footer-map-address-section">
          <h4 className="find-us-label">Find us</h4>
          
          <div className="map-address-layout">
            
            {/* Map Frame Container */}
            <div className="footer-map-container">
              <iframe
                title="Google Maps Location for HEALTH 360"
                src="https://maps.google.com/maps?q=Health+360+Physiotherapy+%26+Craniosacral+Therapy+Clinic,+Om+Nagar,+Vasai+West,+Vasai-Virar,+Maharashtra+401202&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a 
                href="https://www.google.com/maps/dir//Health+360+Physiotherapy+%26+Craniosacral+Therapy+Clinic,+Om+Nagar,+Vasai+West,+Vasai-Virar,+Maharashtra+401202/data=!4m6!4m5!1m1!4e2!1m2!1m1!1s0x3be7afc4cdc35a99:0xeb7252b31b195027?sa=X&ved=1t:57443&ictx=111" 
                target="_blank" 
                rel="noopener noreferrer"
                className="open-in-maps-overlay-btn"
              >
                Open in Maps <ExternalLink size={12} />
              </a>
            </div>

            {/* Address Card */}
            <div className="footer-address-card glass">
              <p className="footer-address-text">
                Shop no. 1 & 2, Shree Amardeep Enclave,<br />
                Om Nagar, Vasai West, Palghar – 401202
              </p>
              <a 
                href="https://www.google.com/maps/dir//Health+360+Physiotherapy+%26+Craniosacral+Therapy+Clinic,+Om+Nagar,+Vasai+West,+Vasai-Virar,+Maharashtra+401202/data=!4m6!4m5!1m1!4e2!1m2!1m1!1s0x3be7afc4cdc35a99:0xeb7252b31b195027?sa=X&ved=1t:57443&ictx=111"
                target="_blank"
                rel="noopener noreferrer"
                className="get-directions-link"
              >
                Get directions <ExternalLink size={14} />
              </a>
            </div>

          </div>
        </div>

        {/* Copyright Footer meta */}
        <div className="footer-bottom-branding">
          <div className="footer-bottom-meta">
            <span className="copyright-text">
              © {new Date().getFullYear()} Health 360 - Physiotherapy & Craniosacral Clinic
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
