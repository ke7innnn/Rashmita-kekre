import { motion } from 'framer-motion';
import './BrandBanner.css';

export default function BrandBanner() {
  return (
    <section className="brand-banner-section">
      <div className="brand-banner-inner xpad">
        <div className="banner-grid">
          <div className="banner-left">
            {/* Empty space matching the reference layout */}
          </div>
          <div className="banner-right">
            <motion.div 
              className="banner-photo-wrapper rounded-m overflow-hidden"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <img 
                src="/banner_stretching_pose.jpg" 
                alt="HEALTH 360 stretching pose" 
                className="banner-photo"
              />
            </motion.div>
          </div>
        </div>
        
        <div className="banner-text-wrapper">
          <motion.h2 
            className="giant-brand-text"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          >
            HEALTH 360
          </motion.h2>
        </div>
      </div>
    </section>
  );
}
