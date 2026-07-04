'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import './ScrollyServices.css';

export default function ScrollyServices() {
  const containerRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Track scroll position of the entire 400vh section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Map the scroll progress directly to the active index (0 to 2) for the text columns
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    let index = 0;
    if (latest < 0.33) {
      index = 0;
    } else if (latest < 0.66) {
      index = 1;
    } else {
      index = 2;
    }

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  });

  // Calculate slide-up translations (translateY) for the images to create a 3-image stacked deck
  const y1 = useTransform(scrollYProgress, [0, 0.33, 0.43, 1], ["0%", "0%", "0%", "0%"]);
  const y2 = useTransform(scrollYProgress, [0, 0.33, 0.43, 0.66, 0.76, 1], ["100%", "100%", "0%", "0%", "0%", "0%"]);
  const y3 = useTransform(scrollYProgress, [0, 0.66, 0.76, 1], ["100%", "100%", "0%", "0%"]);

  const services = [
    {
      id: 'physio',
      label: 'PHYSIOTHERAPY',
      title: 'Evidence-based Physiotherapy',
      description: 'Recover from orthopedic and sports dysfunctions with targeted manual therapy, joint mobilization, and customized conditioning programs.',
      image: '/posture_scan.png',
      y: y1,
      zIndex: 1
    },
    {
      id: 'craniosacral',
      label: 'CRANIOSACRAL',
      title: 'Biodynamic Craniosacral Therapy',
      description: 'A gentle, holistic hands-on approach targeting physical and emotional wellbeing to resolve chronic pain and body tension at the root cause.',
      image: '/mobility_screen.png',
      y: y2,
      zIndex: 2
    },
    {
      id: 'specialized',
      label: 'SPECIALIZED CARE',
      title: "Women's Health & Pediatric Rehab",
      description: 'Tailored clinical conditioning for prenatal/postnatal recovery, pelvic floor rehabilitation, and child milestone development programs.',
      image: '/strength_test.png',
      y: y3,
      zIndex: 3
    }
  ];

  return (
    <section id="services" className="scrolly-section" ref={containerRef}>
      <div className="scrolly-sticky">
        <div className="scrolly-grid">
          
          {/* Left Column: Sticky Stacked Images (Neko Health style deck of cards) */}
          <div className="scrolly-visual-column">
            <div className="scrolly-image-container">
              {services.map((svc) => (
                <motion.div
                  key={svc.id}
                  style={{ y: svc.y, zIndex: svc.zIndex }}
                  className="scrolly-image-wrapper"
                >
                  <img
                    src={svc.image}
                    alt={svc.title}
                    className="scrolly-image"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Sticky Text and Tabs */}
          <div className="scrolly-content-column xpad">
            <div className="scrolly-content-wrapper">
              
              {/* Tab navigation indicating the active index */}
              <div className="scrolly-tabs">
                {services.map((svc, idx) => (
                  <button
                    key={svc.id}
                    className={`scrolly-tab-btn ${activeIndex === idx ? 'active' : ''}`}
                    onClick={() => {
                      // Smooth scroll window to target service section boundary
                      const element = containerRef.current;
                      if (element) {
                        const totalHeight = element.offsetHeight;
                        const targetScroll = element.offsetTop + (idx * (totalHeight / 3));
                        window.scrollTo({
                          top: targetScroll,
                          behavior: 'smooth'
                        });
                      }
                    }}
                  >
                    {svc.label}
                  </button>
                ))}
              </div>

              {/* Text content animating in/out matching the active image */}
              <div className="scrolly-text-content">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <h2 className="scrolly-title text-balance">
                      {services[activeIndex].title}
                    </h2>
                    <p className="scrolly-description">
                      {services[activeIndex].description}
                    </p>
                    
                    <a href="/#our-services" className="scrolly-learn-more" style={{ textDecoration: 'none' }}>
                      <div className="arrow-circle">
                        <ArrowRight size={18} className="text-white" />
                      </div>
                      <span className="learn-more-text">Learn more</span>
                    </a>
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
