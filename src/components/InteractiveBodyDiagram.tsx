'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { bodyConditions, SILHOUETTE_IMAGE_PATH } from '../data/bodyData';
import type { BodyCondition } from '../data/bodyData';
import './InteractiveBodyDiagram.css';

interface InteractiveBodyDiagramProps {
  onClose: () => void;
  onBookClick: () => void;
}

export default function InteractiveBodyDiagram({ onClose, onBookClick }: InteractiveBodyDiagramProps) {
  const [selectedCondition, setSelectedCondition] = useState<BodyCondition | null>(null);

  // Auto-focus on escape key closure helper
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <section className="diagram-page-section">
      <div className="xpad diagram-page-wrapper">
        
        {/* Back Link */}
        <a href="/" className="diagram-back-link" onClick={(e) => { e.preventDefault(); onClose(); }}>
          <ArrowLeft size={16} /> Back to home
        </a>

        {/* Doctor Profile Section */}
        <div className="doctor-profile-section">
          <div className="doctor-profile-grid">
            
            {/* Left: Portrait Photo with frame/hover animation */}
            <div className="doctor-photo-column">
              <motion.div 
                className="doctor-photo-frame"
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <img src="/doctor.png" alt="Dr. Rashmita Karvir-Kekre" className="doctor-photo-img" />
                <div className="experience-tag-floating">
                  <span className="exp-num">13</span>
                  <span className="exp-lbl">Years Exp</span>
                </div>
              </motion.div>
            </div>

            {/* Right: Detailed profile info */}
            <div className="doctor-info-column">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="doctor-info-header"
              >
                <span className="subtitle uppercase">Meet Our Specialist</span>
                <h2 className="doctor-name">Dr. Rashmita Karvir-Kekre (PT)</h2>
                <p className="doctor-title-desc">Consultant Senior Physiotherapist & Biodynamic Craniosacral Therapist</p>
              </motion.div>

              <motion.div 
                className="profile-details-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                {/* Block 1: Education */}
                <div className="profile-detail-card glass rounded-l">
                  <h4 className="detail-card-title">Education & Qualifications</h4>
                  <ul className="detail-list">
                    <li>Bachelor of Physiotherapy</li>
                    <li>Biodynamic Craniosacral Therapist</li>
                  </ul>
                </div>

                {/* Block 2: Special Training */}
                <div className="profile-detail-card glass rounded-l">
                  <h4 className="detail-card-title">Certifications & Special Training</h4>
                  <ul className="detail-list cols-2">
                    <li>Ante and Postnatal Therapist</li>
                    <li>Pelvic Floor Rehab Therapist</li>
                    <li>Manual Therapist</li>
                    <li>Certified Kinesio Taping Therapist CKTT</li>
                    <li>Dry Needling and Electro Needling Therapist</li>
                    <li>Certified cupping Therapist</li>
                    <li>Certified IASTM Therapist</li>
                  </ul>
                </div>

                {/* Block 3: Current Roles */}
                <div className="profile-detail-card glass rounded-l">
                  <h4 className="detail-card-title">Current Clinical Roles</h4>
                  <ul className="detail-list">
                    <li>Health 360 Physiotherapy and Craniosacral Therapy Clinic</li>
                    <li>Divine Hospital</li>
                  </ul>
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        <div className="diagram-section-divider" />

        <div className="diagram-stats-section">
          <div className="diagram-stats-header">
            <h2 className="diagram-page-title">Trusted Results, Proven Recovery</h2>
            <p className="diagram-page-intro text-balance">
              Our commitment to personalized care, expert physiotherapy techniques, and modern rehabilitation ensures every patient’s journey leads to lasting recovery and wellness.
            </p>
          </div>
          
          <div className="diagram-stats-grid">
            <div className="stat-card glass rounded-l">
              <div className="stat-card-number">1000+</div>
              <h4 className="stat-card-title">Patients Treated</h4>
              <p className="stat-card-desc">Successfully helped patients restore mobility, strength, and confidence through specialized care.</p>
            </div>
            <div className="stat-card glass rounded-l">
              <div className="stat-card-number">98%</div>
              <h4 className="stat-card-title">Satisfaction Rate</h4>
              <p className="stat-card-desc">Reflecting the trust and happiness of patients who’ve experienced successful recovery outcomes.</p>
            </div>
            <div className="stat-card glass rounded-l">
              <div className="stat-card-number">95%</div>
              <h4 className="stat-card-title">Patient Retention</h4>
              <p className="stat-card-desc">A testament to our long-term patient relationships and continuous support throughout their wellness journey.</p>
            </div>
          </div>
        </div>

        <div className="diagram-section-divider" />

        <div className="diagram-page-header">
          <p className="subtitle uppercase">Interactive Condition Map</p>
          <h2 className="diagram-page-title text-balance">Common Conditions We Treat</h2>
          <p className="diagram-page-intro text-balance">
            Hover or tap the points on the body diagram to explore specific pain areas, injuries, and joint disorders that can be resolved through professional physiotherapy.
          </p>
        </div>

        <div className="diagram-main-layout">
          
          {/* Left Column: Interactive Silhouette */}
          <div className="diagram-visual-column">
            <div className="silhouette-outer-container">
              <div className="silhouette-wrapper">
                <img 
                  src={SILHOUETTE_IMAGE_PATH} 
                  alt="Body Silhouette Diagram" 
                  className="silhouette-img" 
                />
                {bodyConditions.map((condition) => {
                  const isSelected = selectedCondition?.id === condition.id;
                  return (
                    <button
                      key={condition.id}
                      className={`body-point ${isSelected ? 'active' : ''}`}
                      style={{ 
                        top: `${condition.yPercent}%`, 
                        left: `${condition.xPercent}%` 
                      }}
                      onMouseEnter={() => setSelectedCondition(condition)}
                      onClick={() => setSelectedCondition(condition)}
                      tabIndex={0}
                      aria-label={`${condition.name} (${condition.region})`}
                    >
                      {/* Pulse effect for selected/active dots */}
                      {isSelected && <span className="point-pulse" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Detail Card (Reserved space) */}
          <div className="diagram-detail-column">
            <div className="detail-card-space-holder">
              <AnimatePresence mode="wait">
                {selectedCondition ? (
                  <motion.div
                    key={selectedCondition.id}
                    className="condition-detail-card glass rounded-l"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div className="condition-card-header">
                      <span className="condition-region-tag uppercase">
                        {selectedCondition.region}
                      </span>
                      <h3 className="condition-name">{selectedCondition.name}</h3>
                    </div>

                    <p className="condition-description">
                      {selectedCondition.description}
                    </p>

                    <div className="condition-cta-wrapper">
                      <button 
                        className="btn-primary w-full" 
                        onClick={onBookClick}
                      >
                        Book Appointment
                      </button>
                      <p className="condition-cta-disclaimer">
                        Get a detailed personalized assessment with Dr. Rashmita Karvir-Kekre.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    className="condition-detail-card placeholder-card glass rounded-l"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="placeholder-icon-wrapper rounded-m">
                      <ShieldAlert size={32} className="text-brand" />
                    </div>
                    <h4>Explore Pain Regions</h4>
                    <p>
                      Hover over any circular marker (desktop) or tap directly on the body map (mobile) to inspect conditions, symptoms, and targeted therapies.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
