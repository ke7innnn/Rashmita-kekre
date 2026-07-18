import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, ArrowRight, ArrowLeft, Hand, Zap, Home, Search, ShieldAlert } from 'lucide-react';
import { treatmentMethods, treatmentCategories } from '../data/treatmentsData';
import './OurServices.css';

interface OurServicesProps {
  onClose: () => void;
}

export default function OurServices({ onClose }: OurServicesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedService, setSelectedService] = useState<{
    title: string;
    description: string;
    oneLineDescription: string;
    category: string;
    badgeLabel: string;
    icon: React.ReactNode;
  } | null>(null);

  const getServiceStyleClass = (category: string) => {
    switch (category) {
      case 'exercise': return 'musculo';
      case 'electro': return 'neuro';
      case 'manual': return 'craniosacral';
      case 'bcst': return 'craniosacral';
      case 'care': return 'tele';
      default: return 'tele';
    }
  };

  const getServiceIcon = (category: string) => {
    switch (category) {
      case 'exercise':
        return <Dumbbell className="service-icon" size={20} strokeWidth={1.5} />;
      case 'electro':
        return <Zap className="service-icon" size={20} strokeWidth={1.5} />;
      case 'manual':
      case 'bcst':
        return <Hand className="service-icon" size={20} strokeWidth={1.5} />;
      case 'care':
        return <Home className="service-icon" size={20} strokeWidth={1.5} />;
      default:
        return null;
    }
  };

  // Filter based on tab category and search input query by title/description
  const filteredList = treatmentMethods
    .filter((method) => {
      const matchesCategory = selectedCategory === 'all' || method.category === selectedCategory;
      const matchesSearch = method.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            method.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .map((method) => ({
      title: method.title,
      description: method.description,
      oneLineDescription: method.oneLineDescription,
      category: getServiceStyleClass(method.category),
      badgeLabel: method.categoryLabel,
      icon: getServiceIcon(method.category)
    }));

  // Container variants for stagger reveal
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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
            <h2 className="services-title text-balance">We Help People Move Without Pain Again</h2>
            <p className="services-intro text-balance" style={{ minHeight: '60px' }}>
              {treatmentCategories.find(c => c.id === selectedCategory)?.description ||
               'Providing expert rehabilitation programs engineered for recovery, balance, and independence.'}
            </p>
          </div>

          {/* Controls: Search and Filter Tabs */}
          <div className="services-controls">
            
            {/* Search Bar */}
            <div className="services-search-box rounded-m">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search services..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                  Clear
                </button>
              )}
            </div>

            {/* Filter Categories */}
            <div className="services-tabs">
              {treatmentCategories.map((category) => (
                <button
                  key={category.id}
                  className={`service-tab-btn tab-cat-${category.id} ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                </button>
              ))}
            </div>

          </div>

          {/* Grid Layout wrapped with AnimatePresence */}
          <AnimatePresence mode="wait">
            {filteredList.length > 0 ? (
              <motion.div 
                key={selectedCategory + searchQuery} 
                className="services-grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {filteredList.map((service) => {
                  return (
                    <motion.div 
                      key={service.title}
                      className={`service-card glass rounded-l srv-${service.category}`}
                      variants={cardVariants}
                      whileHover={{ 
                        y: -8,
                        scale: 1.02
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <div className="service-card-top">
                        <div className="service-icon-wrapper">
                          {service.icon}
                        </div>
                        <span className="service-badge uppercase">
                          {service.badgeLabel}
                        </span>
                      </div>
                      
                      <div className="service-card-content">
                        <h3 className="service-card-title">{service.title}</h3>
                        <p className="service-card-one-line">{service.oneLineDescription}</p>
                      </div>

                      <div className="service-card-actions">
                        <button 
                          className="learn-more-link" 
                          onClick={(e) => { e.preventDefault(); setSelectedService(service); }}
                        >
                          Read details
                        </button>

                        <a href="#book" className="service-card-book-btn">
                          Request slot <ArrowRight size={14} />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                className="services-empty-state glass rounded-l"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ShieldAlert size={36} className="text-brand mb-3" />
                <h4>No services found</h4>
                <p>Try searching for a different term or clear the filter query.</p>
                <button className="btn-primary mt-3" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                  Reset Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Service Details Modal */}
          <AnimatePresence>
            {selectedService && (
              <div className="service-modal-overlay" onClick={() => setSelectedService(null)}>
                <motion.div 
                  className={`service-modal-content glass srv-${selectedService.category}`}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="service-modal-close" onClick={() => setSelectedService(null)} aria-label="Close modal">
                    &times;
                  </button>
                  
                  <div className="service-modal-header">
                    <div className="service-icon-wrapper">
                      {selectedService.icon}
                    </div>
                    <span className="service-badge uppercase">
                      {selectedService.badgeLabel}
                    </span>
                  </div>
                  
                  <h3 className="service-modal-title">{selectedService.title}</h3>
                  <p className="service-modal-one-line">{selectedService.oneLineDescription}</p>
                  
                  <div className="service-modal-body">
                    <p className="service-modal-desc">{selectedService.description}</p>
                  </div>
                  
                  <div className="service-modal-actions">
                    <a href="#book" className="service-card-book-btn" onClick={() => setSelectedService(null)}>
                      Request slot <ArrowRight size={14} />
                    </a>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

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
