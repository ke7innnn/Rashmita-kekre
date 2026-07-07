import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import './TestimonialsSection.css';

const testimonials = [
  {
    name: "Parth Bhatt",
    initials: "PB",
    color: "#009FC7", // Brand teal
    bgColor: "#E0F2FE",
    text: "An effective physiotherapy clinic for complete body pain relief. I visited for back stiffness and neck pain and was treated by Dr. Rashmita. The treatment was professional and highly effective."
  },
  {
    name: "Radhamani Sadanandan",
    initials: "RS",
    color: "#D97706", // Amber
    bgColor: "#FEF3C7",
    text: "I visited Dr. Rashmita for shoulder pain. After just 7 days of physiotherapy, I experienced significant relief. The exercises suggested were very helpful as well."
  },
  {
    name: "Reena Dodhi",
    initials: "RD",
    color: "#059669", // Emerald
    bgColor: "#D1FAE5",
    text: "After suffering a painful foot injury, Dr. Rashmita's treatment helped me recover quickly. The care, guidance, and therapy sessions were excellent."
  },
  {
    name: "Sabbu Khan",
    initials: "SK",
    color: "#7C3AED", // Purple
    bgColor: "#F3E8FF",
    text: "I had severe shoulder and arm pain. The physiotherapy, exercises, and treatment sessions provided great relief. Thank you for the excellent care."
  },
  {
    name: "Clerissa Pinto",
    initials: "CP",
    color: "#DB2777", // Pink
    bgColor: "#FCE7F3",
    text: "Working with Dr. Rashmita during my ACL reconstruction recovery was a game-changer. Her guidance and rehabilitation plan helped me regain confidence and mobility."
  },
  {
    name: "Brennen Thomas",
    initials: "BT",
    color: "#2563EB", // Blue
    bgColor: "#DBEAFE",
    text: "Very happy with the treatment for both me and my wife. The results were fast, effective, and Dr. Rashmita was extremely knowledgeable and helpful."
  },
  {
    name: "Namrata Pujari",
    initials: "NP",
    color: "#D97706", // Orange
    bgColor: "#FFEDD5",
    text: "I randomly found the clinic on Google and decided to trust the reviews. Taking the 10-day treatment package for my back pain was one of the best decisions I made."
  },
  {
    name: "Shobha Poojari",
    initials: "SP",
    color: "#059669", // Emerald green
    bgColor: "#D1FAE5",
    text: "Very good experience. My back pain has reduced significantly. Dr. Rashmita has excellent knowledge and provides effective treatment."
  },
  {
    name: "Oshin Gonsalves",
    initials: "OG",
    color: "#4F46E5", // Indigo
    bgColor: "#E0E7FF",
    text: "Dr. Rashmita helped my aunt recover mobility after a stroke and also helped me manage plantar fasciitis. Extremely knowledgeable, patient, and highly recommended."
  },
  {
    name: "Neelam Mahajan",
    initials: "NM",
    color: "#DC2626", // Red
    bgColor: "#FEE2E2",
    text: "Dr. Rashmita has been exceptional during my recovery from Total Knee Replacement surgery and Frozen Shoulder treatment. Highly skilled and supportive throughout the journey."
  }
];

export default function TestimonialsSection() {
  const [groupIndex, setGroupIndex] = useState(0);

  // Automatically cycle through sets of 4 reviews every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setGroupIndex((prev) => (prev + 1) % 3); // 3 distinct groups of 4 (wrapping around)
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Return a sliding window of 4 reviews shifting by 4 on each step
  const getVisibleTestimonials = () => {
    const start = (groupIndex * 4) % testimonials.length;
    const list = [];
    for (let i = 0; i < 4; i++) {
      list.push(testimonials[(start + i) % testimonials.length]);
    }
    return list;
  };

  const visibleTestimonials = getVisibleTestimonials();

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

        {/* Minimal Grid Container */}
        <div className="testimonials-grid-container">
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
                  {/* 5 Stars */}
                  <div className="card-stars-flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} fill="#FFB800" color="#FFB800" />
                    ))}
                  </div>

                  {/* Review Text */}
                  <p className="card-testimonial-text">
                    "{item.text}"
                  </p>

                  {/* Author Info */}
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

        {/* Indicators for the 3 groups */}
        <div className="center-slider-dots">
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
