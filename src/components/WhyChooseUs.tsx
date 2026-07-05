'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, Users, Award, Heart, Zap } from 'lucide-react';
import './WhyChooseUs.css';

const FEATURES = [
  { icon: <Award size={22} />, title: '13+ Years of Experience', desc: 'Dr. Rashmita brings over a decade of hands-on clinical expertise in orthopedic, neurological, and pediatric physiotherapy.' },
  { icon: <Heart size={22} />, title: 'Personalized Care Plans', desc: 'Every patient receives a tailor-made recovery program built around their body, lifestyle, and rehabilitation goals.' },
  { icon: <CheckCircle size={22} />, title: 'Evidence-Based Treatment', desc: 'We combine research-backed physiotherapy techniques with modern biometric assessments for precise, effective outcomes.' },
  { icon: <Users size={22} />, title: '1000+ Patients Recovered', desc: 'Our clinic has guided over a thousand patients from pain and immobility back to active, full, fulfilling lives.' },
  { icon: <Clock size={22} />, title: 'Flexible Appointment Hours', desc: 'Morning and evening sessions Mon–Sat to fit busy lifestyles, working professionals, and school-going children.' },
  { icon: <Zap size={22} />, title: 'Holistic Dual-Therapy Approach', desc: 'Our integrated model merges physiotherapy and craniosacral therapy for complete physical and emotional healing.' }
];

export default function WhyChooseUs() {
  return (
    <section className="why-section xpad" id="why-us">
      <div className="why-container">

        {/* Left: Overlapping Photo Stack */}
        <motion.div
          className="why-photo-block"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="why-photo-main rounded-l">
            <img src="/physio_back_therapy.jpg" alt="Physiotherapy back therapy session" />
          </div>
          <div className="why-photo-accent rounded-m" style={{ backgroundColor: '#e5e2d5' }}>
            <img src="/doctor.png" alt="Dr. Rashmita Karvir-Kekre" style={{ objectFit: 'cover', objectPosition: 'top' }} />
          </div>
        </motion.div>

        {/* Right: Heading + Feature Grid */}
        <div className="why-content">
          <motion.p className="subtitle uppercase" initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            Why Health 360
          </motion.p>
          <motion.h2 className="why-heading" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}>
            The Region's Most Trusted Physiotherapy Clinic
          </motion.h2>
          <motion.p className="why-subtext" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}>
            At HEALTH 360 we go beyond symptom relief — we address root causes through an integrated methodology, restoring you to a life of unrestricted movement and lasting wellness.
          </motion.p>

          <div className="why-features-grid">
            {FEATURES.map((f, idx) => (
              <motion.div
                key={idx}
                className="why-feature-card glass rounded-m"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.07 }}
              >
                <div className="why-icon">{f.icon}</div>
                <div>
                  <h4 className="why-feature-title">{f.title}</h4>
                  <p className="why-feature-desc">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.a href="#book" className="btn-primary why-cta" initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}>
            Book Your Assessment
          </motion.a>
        </div>

      </div>
    </section>
  );
}
