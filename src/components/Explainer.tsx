import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import './Explainer.css';

export default function Explainer() {
  const [activeTab, setActiveTab] = useState('posture');

  const tabs = [
    { 
      id: 'posture', 
      label: 'Posture',
      title: 'Your body mechanics, analyzed in incredible detail',
      description: 'HEALTH 360 utilizes state-of-the-art diagnostic imaging and sensor arrays to map your skeletal alignment, muscle imbalances, and joint integrity with pinpoint accuracy.',
      image: '/explainer_bg.png'
    },
    { 
      id: 'mobility', 
      label: 'Mobility',
      title: 'Kinematics & joint range of motion assessment',
      description: 'Evaluate joint flexibility, flexion, and extension patterns in real-time. Identify specific movement restrictions and joint blocks before they translate into chronic pain or structural issues.',
      image: '/mobility_screen.png'
    },
    { 
      id: 'strength', 
      label: 'Strength',
      title: 'Peak force capacity & digital muscle load testing',
      description: 'Assess maximum output and loading thresholds of target muscle groups. Pinpoint left-to-right force imbalances to build hyper-customized strengthening pathways.',
      image: '/strength_test.png'
    },
    { 
      id: 'cardio', 
      label: 'Cardio',
      title: 'Heart rate variability & cardiovascular profiling',
      description: 'Measure pulse wave velocity, arterial stiffness, and autonomic nervous system metrics to accurately profile your athletic endurance thresholds and overall metabolic health.',
      image: '/cardio_metrics.png'
    }
  ];

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <section id="technology" className="explainer-section">
      <div className="explainer-container xpad">
        
        <div className="explainer-content">
          <nav className="explainer-nav">
            <ul className="explainer-tabs">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="explainer-text-wrapper">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="explainer-title text-balance">
                  {currentTab.title}
                </h2>
                <p className="explainer-description">
                  {currentTab.description}
                </p>
              </motion.div>
            </AnimatePresence>
            
            <a href="#book" className="btn-secondary" style={{ marginTop: '2rem' }}>
              Learn more <ArrowRight size={20} />
            </a>
          </div>
        </div>

        <div className="explainer-visual">
          <div className="visual-container rounded-l">
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeTab}
                src={currentTab.image} 
                alt={currentTab.title} 
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="visual-image" 
              />
            </AnimatePresence>
            <div className="visual-overlay"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
