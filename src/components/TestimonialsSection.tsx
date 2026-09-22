'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import './TestimonialsSection.css';

const testimonials = [
  {
    name: "Parth Bhatt",
    initials: "PB",
    color: "#009FC7",
    bgColor: "#E0F2FE",
    text: "An effective physiotherapy clinic for complete body pain relief. I visited for back stiffness and neck pain and was treated by Dr. Rashmita. The treatment was professional and highly effective."
  },
  {
    name: "Radhamani Sadanandan",
    initials: "RS",
    color: "#D97706",
    bgColor: "#FEF3C7",
    text: "I visited Dr. Rashmita for shoulder pain. After just 7 days of physiotherapy, I experienced significant relief. The exercises suggested were very helpful as well."
  },
  {
    name: "Reena Dodhi",
    initials: "RD",
    color: "#059669",
    bgColor: "#D1FAE5",
    text: "After suffering a painful foot injury, Dr. Rashmita's treatment helped me recover quickly. The care, guidance, and therapy sessions were excellent."
  },
  {
    name: "Sabbu Khan",
    initials: "SK",
    color: "#7C3AED",
    bgColor: "#F3E8FF",
    text: "I had severe shoulder and arm pain. The physiotherapy, exercises, and treatment sessions provided great relief. Thank you for the excellent care."
  },
  {
    name: "Clerissa Pinto",
    initials: "CP",
    color: "#DB2777",
    bgColor: "#FCE7F3",
    text: "Working with Dr. Rashmita during my ACL reconstruction recovery was a game-changer. Her guidance and rehabilitation plan helped me regain confidence and mobility."
  },
  {
    name: "Brennen Thomas",
    initials: "BT",
    color: "#2563EB",
    bgColor: "#DBEAFE",
    text: "Very happy with the treatment for both me and my wife. The results were fast, effective, and Dr. Rashmita was extremely knowledgeable and helpful."
  },
  {
    name: "Namrata Pujari",
    initials: "NP",
    color: "#D97706",
    bgColor: "#FFEDD5",
    text: "I randomly found the clinic on Google and decided to trust the reviews. Taking the 10-day treatment package for my back pain was one of the best decisions I made."
  },
  {
    name: "Shobha Poojari",
    initials: "SP",
    color: "#059669",
    bgColor: "#D1FAE5",
    text: "Very good experience. My back pain has reduced significantly. Dr. Rashmita has excellent knowledge and provides effective treatment."
  },
  {
    name: "Oshin Gonsalves",
    initials: "OG",
    color: "#4F46E5",
    bgColor: "#E0E7FF",
    text: "Dr. Rashmita helped my aunt recover mobility after a stroke and also helped me manage plantar fasciitis. Extremely knowledgeable, patient, and highly recommended."
  },
  {
    name: "Neelam Mahajan",
    initials: "NM",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    text: "Dr. Rashmita has been exceptional during my recovery from Total Knee Replacement surgery and Frozen Shoulder treatment. Highly skilled and supportive throughout the journey."
  }
];

export default function TestimonialsSection() {
  const [groupIndex, setGroupIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  // Desktop automatic cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setGroupIndex((prev) => (prev + 1) % 3);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const getVisibleTestimonials = () => {
    const start = (groupIndex * 4) % testimonials.length;
    const list = [];
    for (let i = 0; i < 4; i++) {
      list.push(testimonials[(start + i) % testimonials.length]);
    }
    return list;
  };

  const visibleTestimonials = getVisibleTestimonials();

  // Mobile touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 40) {
      // Swipe left -> next
      setMobileIndex((prev) => (prev + 1) % testimonials.length);
    } else if (diff < -40) {
      // Swipe right -> prev
      setMobileIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    }
    setTouchStart(null);
  };

  const currentMobileReview = testimonials[mobileIndex];

  return (
    <section className="testimonials-section-center">
      <div className="xpad testimonials-center-inner">
        
        {/* Header */}
        <div className="testimonials-center-header">
          <span className="testimonials-center-tag uppercase">Testimonials</span>
          <h2 className="testimonials-center-title">
            <ScrollReveal>What Our Patients Say</ScrollReveal>
          </h2>
          <div className="testimonials-center-stars-row">
            <div className="stars-flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} fill="#FFB800" color="#FFB800" />
              ))}
            </div>
            <span className="google-rating-text">5.0 Star Google Rating</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MOBILE REVIEW CAROUSEL (< 768px): Thumb-friendly swipe & controls  */}
        {/* ================================================================= */}
        <div 
          className="testimonials-mobile-wrapper md:hidden w-full"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="testimonial-grid-card glass text-left p-5 rounded-3xl"
            >
              {/* Stars */}
              <div className="card-stars-flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="#FFB800" color="#FFB800" />
                ))}
              </div>

              {/* Text */}
              <p className="card-testimonial-text text-sm leading-relaxed mb-4">
                &ldquo;{currentMobileReview.text}&rdquo;
              </p>

              {/* Author */}
              <div className="card-author-row pt-3 border-t border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="card-author-avatar w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs" 
                    style={{ backgroundColor: currentMobileReview.bgColor, color: currentMobileReview.color }}
                  >
                    {currentMobileReview.initials}
                  </div>
                  <div className="card-author-meta">
                    <h4 className="card-author-name text-xs font-bold">{currentMobileReview.name}</h4>
                    <span className="card-author-role text-[10px] text-muted-foreground">Verified Patient</span>
                  </div>
                </div>

                <div className="text-[10px] font-bold text-muted-foreground">
                  {mobileIndex + 1} / {testimonials.length}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Mobile Carousel Navigation Arrows & Dots */}
          <div className="flex items-center justify-between mt-4 px-2">
            <button
              onClick={() => setMobileIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-foreground transition active:scale-90"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1">
              {testimonials.map((_, idx) => (
                <span
                  key={idx}
                  onClick={() => setMobileIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    mobileIndex === idx ? 'w-4 bg-[#009fc7]' : 'w-1 bg-black/20'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setMobileIndex((prev) => (prev + 1) % testimonials.length)}
              className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-foreground transition active:scale-90"
              aria-label="Next review"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* DESKTOP VIEW (>= 768px): Original 2x2 grid with group pagination   */}
        {/* ================================================================= */}
        <div className="testimonials-grid-container hidden md:block">
          <AnimatePresence mode="wait">
            <motion.div
              key={groupIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="testimonials-grid-wrapper"
            >
              {visibleTestimonials.map((item) => (
                <div key={item.name} className="testimonial-grid-card glass">
                  <div className="card-stars-flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} fill="#FFB800" color="#FFB800" />
                    ))}
                  </div>

                  <p className="card-testimonial-text">
                    &ldquo;{item.text}&rdquo;
                  </p>

                  <div className="card-author-row">
                    <div 
                      className="card-author-avatar" 
                      style={{ backgroundColor: item.bgColor, color: item.color }}
                    >
                      {item.initials}
                    </div>
                    <div className="card-author-meta">
                      <h4 className="card-author-name">{item.name}</h4>
                      <span className="card-author-role">Verified Patient</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop Indicators */}
        <div className="center-slider-dots hidden md:flex">
          {[...Array(3)].map((_, idx) => (
            <button
              key={idx}
              className={`center-dot ${groupIndex === idx ? 'active' : ''}`}
              onClick={() => setGroupIndex(idx)}
              aria-label={`Go to set ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
