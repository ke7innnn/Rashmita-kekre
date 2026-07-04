
import './Footer.css';

export default function Footer() {
  return (
    <footer id="about" className="site-footer xpad">
      <div className="footer-top">
        <div className="footer-brand">
          <a href="/" className="logo">
            HEALTH<span className="logo-accent">360</span>
          </a>
          <p className="footer-description">
            A completely new physiotherapy experience.
          </p>
        </div>
        
        <div className="footer-links-grid">
          <div className="footer-column">
            <h4 className="footer-heading">Services</h4>
            <ul>
              <li><a href="/services/health-scan">Health Scan</a></li>
              <li><a href="/services/postural-analysis">Postural Analysis</a></li>
              <li><a href="/services/mobility-screening">Mobility Screening</a></li>
              <li><a href="/services/strength-testing">Strength Testing</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Company</h4>
            <ul>
              <li><a href="/about">About us</a></li>
              <li><a href="/careers">Careers</a></li>
              <li><a href="/contact">Contact</a></li>
              <li><a href="/press">Press</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Legal</h4>
            <ul>
              <li><a href="/terms">Terms & Conditions</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/cookies">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} HEALTH 360 Clinic. All rights reserved.</p>
      </div>
    </footer>
  );
}
