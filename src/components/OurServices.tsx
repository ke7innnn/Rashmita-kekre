import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Brain, Baby, Accessibility, Heart, MonitorSmartphone, ArrowRight, ArrowLeft } from 'lucide-react';
import './OurServices.css';

interface OurServicesProps {
  onClose: () => void;
}

export default function OurServices({ onClose }: OurServicesProps) {
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  const toggleExpand = (idx: number) => {
    setExpandedCards(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const servicesList = [
    {
      title: "Musculoskeletal Physiotherapy",
      description: "Focused on orthopedic and sports-related dysfunctions. Includes manual therapy, joint mobilization, soft-tissue manipulation, and customized exercise programs to improve strength, flexibility, and motor control. Post-operative rehabilitation and pain modulation (TENS, ultrasound, cryotherapy, kinesio-taping) help restore full function and posture.",
      oneLineDescription: "Targeted joint mobilization, manual therapy, and corrective exercise to recover strength and movement.",
      category: "musculo",
      badgeLabel: "Muscle & Joint",
      icon: <Dumbbell className="service-icon" size={20} strokeWidth={1.5} />
    },
    {
      title: "Neurological Physiotherapy",
      description: "Specialized care for conditions like stroke, spinal cord injuries, Parkinson’s disease, cerebral palsy, and neuropathies. Treatment includes neuro-facilitation (PNF, NDT), gait training, tone management, and sensory re-education to enhance balance, coordination, and functional independence.",
      oneLineDescription: "Neuro-facilitation and balance training to restore mobility and independence for nerve-related conditions.",
      category: "neuro",
      badgeLabel: "Nervous System",
      icon: <Brain className="service-icon" size={20} strokeWidth={1.5} />
    },
    {
      title: "Pediatric Physiotherapy",
      description: "Dedicated programs for children with developmental delays, hypotonia, cerebral palsy, or congenital deformities. Focused on developmental milestones, balance and coordination training, play-based motor learning, orthotic support, and gait re-education for improved mobility and confidence.",
      oneLineDescription: "Dedicated milestones-focused motor learning and physical training tailored for developing children.",
      category: "pediatric",
      badgeLabel: "Children's Health",
      icon: <Baby className="service-icon" size={20} strokeWidth={1.5} />
    },
    {
      title: "Geriatric Physiotherapy",
      description: "Comprehensive care for seniors to manage arthritis, balance issues, and post-fracture recovery. Includes fall-prevention programs, strength and mobility training, assistive-device education, and pain management strategies to maintain independence and enhance quality of life.",
      oneLineDescription: "Gentle strength, balance, and fall-prevention programs to support senior mobility and quality of life.",
      category: "geriatric",
      badgeLabel: "Elderly Care",
      icon: <Accessibility className="service-icon" size={20} strokeWidth={1.5} />
    },
    {
      title: "Women’s Health Physiotherapy",
      description: "Focused on pelvic floor health, post-partum recovery, incontinence, and menopause-related changes. Therapy includes pelvic floor strengthening, diastasis recti correction, post-natal rehabilitation, and prenatal exercise guidance for long-term musculoskeletal well-being.",
      oneLineDescription: "Specialized postpartum, prenatal, and pelvic floor strengthening for long-term musculoskeletal wellness.",
      category: "womens",
      badgeLabel: "Women's Health",
      icon: <Heart className="service-icon" size={20} strokeWidth={1.5} />
    },
    {
      title: "Community-based & Tele-Physiotherapy",
      description: "Accessible physiotherapy through home visits and online consultations. Includes guided exercise demonstrations, self-management education, and remote follow-up monitoring to ensure consistent recovery and continued care beyond the clinic.",
      oneLineDescription: "At-home therapist visits and secure online video consultations to keep your recovery consistent anywhere.",
      category: "tele",
      badgeLabel: "Remote & Home",
      icon: <MonitorSmartphone className="service-icon" size={20} strokeWidth={1.5} />
    }
  ];

  // Container variants for stagger reveal
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        ease: [0.16, 1, 0.3, 1] as const
      } 
    }
  };

  return (
    <section className="services-page-section">
      <div className="xpad services-page-wrapper">
        
        {/* Back to Home Link */}
        <a href="/" className="services-back-link" onClick={(e) => { e.preventDefault(); onClose(); }}>
          <ArrowLeft size={16} /> Back to home
        </a>

        <div className="services-container">
          <div className="services-header">
            <p className="subtitle uppercase">Specialized Care Lines</p>
            <h2 className="services-title text-balance">Our Services</h2>
            <p className="services-intro text-balance">
              Providing expert rehabilitation programs engineered for recovery, balance, and independence.
            </p>
          </div>

          <motion.div 
            className="services-grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {servicesList.map((service, index) => {
              const isExpanded = expandedCards[index] || false;

              return (
                <motion.div 
                  key={index}
                  className={`service-card glass rounded-l srv-${service.category}`}
                  variants={cardVariants}
                  whileHover={{ 
                    y: -4,
                    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.04)",
                    borderColor: "rgba(0, 0, 0, 0.08)"
                  }}
                >
                  <div className="service-card-top">
                    <div className="service-icon-wrapper">
                      {service.icon}
                    </div>
                    <span className="service-badge rounded-s uppercase">
                      {service.badgeLabel}
                    </span>
                  </div>
                  
                  <div className="service-card-content">
                    <h3 className="service-card-title">{service.title}</h3>
                    <p className="service-card-one-line">{service.oneLineDescription}</p>
                    
                    {isExpanded && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="service-card-full-desc"
                      >
                        {service.description}
                      </motion.p>
                    )}
                  </div>

                  <div className="service-card-actions">
                    <button 
                      className="learn-more-link" 
                      onClick={(e) => { e.preventDefault(); toggleExpand(index); }}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? "Read less" : "Read more"}
                    </button>

                    <a href="#book" className="service-card-book-btn">
                      Request slot <ArrowRight size={14} />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Adjunct Services & Outcome Goals */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            marginTop: '4.5rem',
            textAlign: 'left'
          }}>
            <div className="glass rounded-l" style={{ padding: '2.5rem', border: '1px solid rgba(0, 159, 199, 0.08)', background: 'rgba(255,255,255,0.3)' }}>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 500, color: 'var(--brand)', marginBottom: '0.75rem' }}>Adjunct Services</h4>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Enhancing overall wellness through fitness and conditioning programs, workplace ergonomics consultations, and sports performance optimization. These services complement physiotherapy care by promoting proactive health and injury prevention.
              </p>
            </div>

            <div className="glass rounded-l" style={{ padding: '2.5rem', border: '1px solid rgba(0, 159, 199, 0.08)', background: 'rgba(255,255,255,0.3)' }}>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 500, color: 'var(--brand)', marginBottom: '0.75rem' }}>Outcome Goals</h4>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Our approach focuses on reducing pain, improving mobility and coordination, restoring functional independence, preventing secondary complications, and empowering patients with long-term health maintenance and self-care education.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
