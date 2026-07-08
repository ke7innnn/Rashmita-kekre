'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { bodyConditions, SILHOUETTE_IMAGE_PATH } from '../data/bodyData';
import type { BodyCondition } from '../data/bodyData';
import './InteractiveBodyDiagram.css';

export default function HomeBodyDiagram() {
  const [selectedCondition, setSelectedCondition] = useState<BodyCondition | null>(null);

  return (
    <section id="body-diagram" style={{ padding: '6rem 0', background: 'rgba(0, 159, 199, 0.01)', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
      <div className="xpad" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        <div className="diagram-page-header" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <p className="subtitle uppercase">Interactive Condition Map</p>
          <h2 className="diagram-page-title text-balance" style={{ fontSize: '2.8rem', fontWeight: 500 }}>Common Conditions We Treat</h2>
          <p className="diagram-page-intro text-balance" style={{ maxWidth: '700px', margin: '1rem auto 0', color: 'var(--muted-foreground)' }}>
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
                      {isSelected && <span className="point-pulse" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Detail Card */}
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
                      <a 
                        className="btn-primary w-full" 
                        href="/#book"
                        style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none' }}
                      >
                        Book Appointment
                      </a>
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
