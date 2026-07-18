import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, ArrowRight, ShieldAlert, Dumbbell, Zap, Hand, Home } from 'lucide-react';
import { treatmentMethods, treatmentCategories } from '../data/treatmentsData';
import './TreatmentMethods.css';

interface TreatmentMethodsProps {
  onClose: () => void;
  onBookClick: () => void;
}

export default function TreatmentMethods({ onClose, onBookClick }: TreatmentMethodsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (title: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Filter methods based on tab category and search input query by title (live-filter)
  const filteredMethods = treatmentMethods.filter((method) => {
    const matchesCategory = selectedCategory === 'all' || method.category === selectedCategory;
    const matchesSearch = method.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'exercise':
        return <Dumbbell className="category-icon" size={20} strokeWidth={1.5} />;
      case 'electro':
        return <Zap className="category-icon" size={20} strokeWidth={1.5} />;
      case 'manual':
      case 'bcst':
        return <Hand className="category-icon" size={20} strokeWidth={1.5} />;
      case 'care':
        return <Home className="category-icon" size={20} strokeWidth={1.5} />;
      default:
        return null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
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
    <section className="treatments-page-section">
      <div className="xpad treatments-page-wrapper">
        
        {/* Back Link */}
        <a href="/" className="treatments-back-link" onClick={(e) => { e.preventDefault(); onClose(); }}>
          <ArrowLeft size={16} /> Back to home
        </a>

        {/* Page Header */}
        <div className="treatments-header">
          <p className="subtitle uppercase">Therapeutic Modalities</p>
          <h2 className="treatments-title text-balance">Treatment Methods</h2>
          <p className="treatments-intro text-balance" style={{ minHeight: '60px' }}>
            {treatmentCategories.find(c => c.id === selectedCategory)?.description ||
             'Explore our comprehensive range of clinically proven rehabilitation techniques, advanced electrotherapy modalities, and evidence-based exercise therapies.'}
          </p>
        </div>

        {/* Controls: Search and Filter Tabs */}
        <div className="treatments-controls">
          
          {/* Search Bar */}
          <div className="treatments-search-box rounded-m">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search treatment methods..." 
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
          <div className="treatments-tabs">
            {treatmentCategories.map((category) => (
              <button
                key={category.id}
                className={`treatment-tab-btn tab-cat-${category.id} ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>

        </div>

        {/* Treatments Grid */}
        <AnimatePresence mode="wait">
          {filteredMethods.length > 0 ? (
            <motion.div 
              key={selectedCategory + searchQuery} 
              className="treatments-grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {filteredMethods.map((method) => {
                const isExpanded = expandedCards[method.title] || false;

                return (
                  <motion.div 
                    key={method.title}
                    className={`treatment-card glass rounded-l cat-${method.category}`}
                    variants={cardVariants}
                    whileHover={{ 
                      y: -4,
                      boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.04)",
                      borderColor: "rgba(0, 0, 0, 0.08)"
                    }}
                  >
                    <div className="treatment-card-top">
                      <div className="category-icon-wrapper">
                        {getCategoryIcon(method.category)}
                      </div>
                      <span className="treatment-badge rounded-s uppercase">
                        {method.categoryLabel}
                      </span>
                    </div>

                    <div className="treatment-card-content">
                      <h3 className="treatment-card-title">{method.title}</h3>
                      <p className="treatment-card-one-line">{method.oneLineDescription}</p>
                      
                      {isExpanded && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="treatment-card-full-desc"
                        >
                          {method.description}
                        </motion.p>
                      )}
                    </div>

                    <div className="treatment-card-actions">
                      <button 
                        className="learn-more-link"
                        onClick={() => toggleExpand(method.title)}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? 'Show less' : 'Learn more'}
                      </button>

                      <a href="#book" className="treatment-card-book-btn" onClick={(e) => { e.preventDefault(); onBookClick(); }}>
                        Book treatment <ArrowRight size={14} />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              className="treatments-empty-state glass rounded-l"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ShieldAlert size={36} className="text-brand mb-3" />
              <h4>No treatment methods found</h4>
              <p>Try searching for a different term or clear the filter query.</p>
              <button className="btn-primary mt-3" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
                Reset Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
