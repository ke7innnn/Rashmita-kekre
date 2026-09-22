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
    <section id="body-diagram" className="py-12 md:py-24" style={{ background: 'rgba(0, 159, 199, 0.01)', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
      <div className="xpad" style={{ maxWidth: '1250px', margin: '0 auto' }}>
        
        <div className="diagram-page-header text-center mb-6 md:mb-12">
          <p className="subtitle uppercase text-xs">Interactive Condition Map</p>
          <h2 className="diagram-page-title text-balance text-2xl sm:text-3xl md:text-5xl font-black mt-1">
            Identify the Reason for Your Pain
          </h2>
          <p className="diagram-page-intro text-balance text-xs sm:text-sm md:text-base mt-2 max-w-2xl mx-auto text-muted-foreground">
            Tap a body area below or touch the joints on the silhouette to explore specific symptoms and rehabilitation options.
          </p>
        </div>

        {/* Mobile Quick Tap Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-5 justify-start sm:justify-center no-scrollbar">
          <span className="text-[10px] font-black text-muted-foreground shrink-0 uppercase tracking-wider mr-1">
            Tap Area:
          </span>
          {bodyConditions.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCondition(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                selectedCondition?.id === c.id
                  ? 'bg-[#009fc7] text-white shadow-md shadow-[#009fc7]/25'
                  : 'bg-black/5 text-foreground/80 hover:bg-black/10'
              }`}
            >
              {c.region}
            </button>
          ))}
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
