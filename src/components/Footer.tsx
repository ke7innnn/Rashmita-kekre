import './Footer.css';

export default function Footer() {
  return (
    <footer id="footer" className="site-footer xpad" style={{ background: '#FAF7EC', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="footer-top" style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'space-between' }}>
        
        {/* Brand & Address */}
        <div className="footer-brand" style={{ maxWidth: '350px' }}>
          <a href="/" className="logo" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--foreground)' }}>
            HEALTH<span className="logo-accent" style={{ color: 'var(--brand)' }}>360</span>
          </a>
          <p className="footer-description" style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', marginTop: '0.5rem', lineHeight: 1.5 }}>
            Health 360 Physiotherapy & Craniosacral Therapy Clinic
          </p>
          <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.4 }}>
            <p>
              Shop no. 1 & 2, Amardeep Society, Om Nagar,<br />
              Vasai West, Palghar - 401202
            </p>
            <p>
              Phone: <a href="tel:+918482812859" style={{ textDecoration: 'underline' }}>+91 84828 12859</a> / <a href="tel:+919834848956" style={{ textDecoration: 'underline' }}>+91 98348 48956</a>
            </p>
          </div>
        </div>
        
        {/* Links Grid */}
        <div className="footer-links-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2.5rem', flex: 1, marginLeft: 'auto' }}>
          
          <div className="footer-column">
            <h4 className="footer-heading" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>Useful Links</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="/" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Home</a></li>
              <li><a href="/about" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>About us</a></li>
              <li><a href="/#our-services" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Services</a></li>
              <li><a href="/contact" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Contact</a></li>
              <li><a href="/careers" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Careers</a></li>
              <li><a href="/press" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Press</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>Our Services</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="/#our-services" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Musculoskeletal Physiotherapy</a></li>
              <li><a href="/#our-services" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Neurological Physiotherapy</a></li>
              <li><a href="/#our-services" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Pediatric Physiotherapy</a></li>
              <li><a href="/#our-services" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Geriatric Physiotherapy</a></li>
              <li><a href="/#our-services" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Women’s Health Physiotherapy</a></li>
              <li><a href="/#our-services" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Community-based & Tele-Physiotherapy</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><a href="/terms" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Terms & Conditions</a></li>
              <li><a href="/privacy" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Privacy Policy</a></li>
              <li><a href="/cookies" style={{ fontSize: '0.875rem', color: 'var(--foreground)' }}>Cookie Policy</a></li>
            </ul>
            
            <h4 className="footer-heading" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', marginTop: '1.5rem' }}>Follow Us</h4>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <a href="https://www.facebook.com/profile.php?id=100090143185713" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--foreground)', opacity: 0.8 }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://www.instagram.com/health360physiotherapy_clinic?utm_source=ig_web_button_share_sheet&igsh=ZDN" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--foreground)', opacity: 0.8 }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
            </div>
          </div>
          
        </div>
      </div>
      
      <div className="footer-bottom" style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '3rem' }}>
        <p>&copy; {new Date().getFullYear()} Health 360 Physiotherapy & Craniosacral Therapy Clinic. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
