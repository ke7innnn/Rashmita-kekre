'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, AnimatePresence, useTransform } from 'framer-motion';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react';
import './ScrollyServices.css';

export default function ScrollyServices() {
  const containerRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Track scroll position of the entire 300vh section on desktop
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Map the scroll progress directly to the active index (0 to 2) for desktop
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

  // Calculate slide-up translations for the images on desktop
  const y1 = useTransform(scrollYProgress, [0, 0.33, 0.43, 1], ["0%", "0%", "0%", "0%"]);
  const y2 = useTransform(scrollYProgress, [0, 0.33, 0.43, 0.66, 0.76, 1], ["100%", "100%", "0%", "0%", "0%", "0%"]);
  const y3 = useTransform(scrollYProgress, [0, 0.66, 0.76, 1], ["100%", "100%", "0%", "0%"]);

  const services = [
    {
      id: 'physio',
      label: 'PHYSIOTHERAPY',
      shortLabel: 'Physio',
      title: 'Evidence-based Physiotherapy',
      description: 'Recover from orthopedic and sports dysfunctions with targeted manual therapy, joint mobilization, and customized conditioning programs.',
      image: '/physio_therapy_minimal.png',
      y: y1,
      zIndex: 1
    },
    {
      id: 'craniosacral',
      label: 'CRANIOSACRAL',
      shortLabel: 'Craniosacral',
      title: 'Biodynamic Craniosacral Therapy',
      description: 'A gentle, holistic hands-on approach targeting physical and emotional wellbeing to resolve chronic pain and body tension at the root cause.',
      image: '/craniosacral_therapy_minimal.png',
      y: y2,
      zIndex: 2
    },
    {
      id: 'wellness',
      label: 'HEALTH & WELLNESS',
      shortLabel: 'Wellness',
      title: 'Health and Wellness',
      description: 'Transform your health with customized wellness programs that focus on movement, strength, recovery, and prevention.',
      image: '/health_wellness_physio.png',
      y: y3,
      zIndex: 3
    }
  ];

  // Mobile swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe left -> next
    if (diff > 50 && activeIndex < services.length - 1) {
      setActiveIndex(prev => prev + 1);
    }
    // Swipe right -> prev
    else if (diff < -50 && activeIndex > 0) {
      setActiveIndex(prev => prev - 1);
    }
    setTouchStart(null);
  };

  return (
    <section id="services" className="scrolly-section" ref={containerRef}>
      
      {/* ===================================================================== */}
      {/* MOBILE SHOWCASE VIEW (< 768px): Zero scroll trap, high visual impact   */}
      {/* ===================================================================== */}
      <div 
        className="scrolly-mobile-container md:hidden px-5 py-12"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Section Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#009fc7]/10 text-[#009fc7] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Specialized Therapies
          </div>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Our Core Treatments
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Swipe or tap to explore our specialized physical rehabilitation modalities
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center justify-center gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
          {services.map((svc, idx) => (
            <button
              key={svc.id}
              onClick={() => setActiveIndex(idx)}
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeIndex === idx
                  ? 'bg-[#009fc7] text-white shadow-md shadow-[#009fc7]/25 scale-105'
                  : 'bg-black/5 text-foreground/70 hover:bg-black/10'
              }`}
            >
              {svc.shortLabel}
            </button>
          ))}
        </div>

        {/* Mobile Animated Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white/80 backdrop-blur-md rounded-3xl border border-black/5 shadow-xl overflow-hidden"
          >
            {/* Image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
              <img
                src={services[activeIndex].image}
                alt={services[activeIndex].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-extrabold text-white tracking-wider uppercase">
                {services[activeIndex].label}
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-lg font-bold text-foreground leading-snug mb-2">
                {services[activeIndex].title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-5">
                {services[activeIndex].description}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <a
                  href="/#book"
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#009fc7] to-[#12D6C4] text-white font-extrabold text-xs text-center flex items-center justify-center gap-2 shadow-md shadow-[#009fc7]/25"
                >
                  <Calendar className="w-3.5 h-3.5" /> Book Session
                </a>

                <a
                  href="/#our-services"
                  className="py-3 px-4 rounded-xl bg-black/5 hover:bg-black/10 text-foreground font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  Details <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Swipe Dots Indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {services.map((_, idx) => (
            <span
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                activeIndex === idx ? 'w-6 bg-[#009fc7]' : 'w-1.5 bg-black/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* DESKTOP VIEW (>= 768px): Original 300vh sticky stacked parallax deck  */}
      {/* ===================================================================== */}
      <div className="scrolly-sticky hidden md:flex">
        <div className="scrolly-grid">
          
          {/* Left Column: Sticky Stacked Images */}
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
              
              {/* Tab navigation */}
              <div className="scrolly-tabs">
                {services.map((svc, idx) => (
                  <button
                    key={svc.id}
                    className={`scrolly-tab-btn ${activeIndex === idx ? 'active' : ''}`}
                    onClick={() => {
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

              {/* Text content */}
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
