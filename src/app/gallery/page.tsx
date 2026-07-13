'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './gallery.css';

// 24 clinic images
const BASE_PHOTOS = Array.from({ length: 24 }, (_, i) => {
  const id = i + 1;
  
  // Custom sizes to form a gorgeous asymmetrical gallery collage
  let sizeType = 'square';
  if (id % 5 === 1) sizeType = 'tall';
  else if (id % 5 === 3) sizeType = 'wide';

  // Professional clinical captions representing a premium clinic
  const titles = [
    "State-of-the-Art Rehabilitation Area",
    "Clinical Consultation & Patient Intake Suite",
    "Comprehensive Biometrics & Assessment Zone",
    "Serene Healing & Alignment Room",
    "Aroleap - Advanced Robotic Rehabilitation Bay",
    "Manual Adjustments & Therapy Chamber",
    "Real-Time Patient Progress Analytics",
    "Cardiovascular Assessment Deck",
    "Tranquil Craniosacral Cradle",
    "Computer-Vision Postural Analysis Bay",
    "Pediatric Coordination & Mobility Corner",
    "Targeted Electrotherapy Modalities Suite",
    "Strength & Proprioception Training Bay",
    "Biomechanical Review Dashboard",
    "Orthopedic Recovery Hub",
    "Deep Tissue & Stretching Deck",
    "Restorative Light Chamber",
    "Warm Sand Waiting & Reception Lounge",
    "Laser Therapy & Thermal Stimulation Lab",
    "Joint Mobilization Suite",
    "Clinical Support Equipment Station",
    "Maternal Health & Pelvic Floor Room",
    "Dynamic Range-of-Motion Screening",
    "Flagship Clinic Entrance & Gallery"
  ];

  return {
    id: `p_${id}`,
    src: `/gallery/photo_${id}.jpg`,
    title: titles[i] || `Clinic Area ${id}`,
    sizeType,
    isFlagship: false
  };
}).filter(photo => photo.id !== 'p_5' && photo.id !== 'p_8' && photo.id !== 'p_11');

const GALLERY_PHOTOS = [
  {
    id: 'f_1',
    src: '/gallery/flagship_1.jpg',
    title: 'Flagship Entrance & Consultation Lounge',
    sizeType: 'square',
    isFlagship: true
  },
  {
    id: 'f_2',
    src: '/gallery/flagship_2.jpg',
    title: 'Advanced Physiotherapy Gym & Movement Lab',
    sizeType: 'tall',
    isFlagship: true
  },
  {
    id: 'f_3',
    src: '/gallery/flagship_3.jpg',
    title: 'Aroleap Robotic Rehabilitation Station',
    sizeType: 'wide',
    isFlagship: true
  },
  ...BASE_PHOTOS
];

export default function GalleryPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const showPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : GALLERY_PHOTOS.length - 1));
  }, [lightboxIndex]);

  const showNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev < GALLERY_PHOTOS.length - 1 ? prev + 1 : 0));
  }, [lightboxIndex]);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  // Keyboard navigation for premium desktop experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') showPrev();
      else if (e.key === 'ArrowRight') showNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, showPrev, showNext, closeLightbox]);

  return (
    <>
      <Header />
      
      <main style={{ paddingTop: '130px', minHeight: '90vh' }}>
        
        {/* Banner Section */}
        <section style={{ padding: '5rem 0 3.5rem', background: 'radial-gradient(circle at top right, rgba(0, 159, 199, 0.05), transparent 60%)' }}>
          <div className="xpad gallery-header">
            <motion.p 
              className="subtitle uppercase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              / Inside HEALTH 360
            </motion.p>
            <motion.h1 
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.1rem)', fontWeight: 500, margin: '1rem 0 1.5rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Flagship Clinic Spaces
            </motion.h1>
            <motion.p 
              className="gallery-intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Explore our state-of-the-art healing spaces, advanced robotic diagnostics, and tranquil treatment chambers designed to foster rapid physical recovery and mental longevity.
            </motion.p>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="xpad">
          <div className="gallery-page-container">
            <motion.div 
              className="gallery-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {GALLERY_PHOTOS.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  className={`gallery-card size-${photo.sizeType}`}
                  onClick={() => setLightboxIndex(index)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
                >
                  <div className="gallery-card-img-wrapper">
                    <img 
                      src={photo.src} 
                      alt={photo.title} 
                      className="gallery-card-img"
                      style={photo.id === 'f_1' ? { objectPosition: '20% center' } : undefined}
                      loading="lazy"
                    />
                    <div className="gallery-card-overlay">
                      <h3 className="gallery-card-title">{photo.title}</h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

      </main>

      {/* Premium Fullscreen Lightbox Overlay */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div 
            className="lightbox-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeLightbox}
          >
            <div 
              className="lightbox-content-wrapper" 
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* Close button */}
              <button className="lightbox-close-btn" onClick={closeLightbox} aria-label="Close Lightbox">
                <X size={20} />
              </button>

              {/* Prev / Next controls */}
              <button className="lightbox-nav-btn prev" onClick={showPrev} aria-label="Previous Image">
                <ArrowLeft size={20} />
              </button>
              <button className="lightbox-nav-btn next" onClick={showNext} aria-label="Next Image">
                <ArrowRight size={20} />
              </button>

              {/* Image element wrapper with smooth transition */}
              <div className="lightbox-image-container">
                <motion.img 
                  key={lightboxIndex}
                  src={GALLERY_PHOTOS[lightboxIndex].src} 
                  alt={GALLERY_PHOTOS[lightboxIndex].title} 
                  className="lightbox-img"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              {/* Bottom Metadata */}
              <div className="lightbox-meta-panel">
                <h4 className="lightbox-image-title">{GALLERY_PHOTOS[lightboxIndex].title}</h4>
                <span className="lightbox-image-counter">
                  {lightboxIndex + 1} / {GALLERY_PHOTOS.length}
                </span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
