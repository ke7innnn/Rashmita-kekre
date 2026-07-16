import { motion } from 'framer-motion';
import './Intro.css';

export default function Intro() {
  const lines = [
    "Empowering Movement.",
    "Restoring Balance.",
    "Enhancing Life."
  ];

  // Stagger variants for the paragraph items on the right
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1] as const // premium easeOutExpo curve
      } 
    }
  };

  return (
    <section id="about" className="intro-section xpad">
      <div className="intro-container">
        
        {/* Left Column: Premium mask-clip slide-up heading with subtle skew */}
        <div className="intro-heading-col">
          <h2 className="intro-heading">
            {lines.map((line, idx) => (
              <span key={idx} className="intro-line-mask">
                <motion.span
                  className="intro-line-text"
                  initial={{ y: "105%", rotate: 1.5, skewY: 2 }}
                  whileInView={{ y: "0%", rotate: 0, skewY: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ 
                    duration: 0.9, 
                    delay: idx * 0.12, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h2>
        </div>
        
        {/* Right Column: Paragraph narrative stagger animation */}
        <motion.div 
          className="intro-text-col"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.p className="intro-lead" variants={itemVariants}>
            <strong>Health 360 Physiotherapy & Craniosacral Therapy Clinic</strong>, founded by <strong>Dr. Rashmita Karvir-Kekre (PT)</strong>, is a holistic center dedicated to healing through movement and mindful rehabilitation. With over 15 years of professional experience, Dr. Rashmita offers an integrated approach that focuses on complete physical and emotional wellbeing.
          </motion.p>

          <motion.a 
            href="/about#body-diagram" 
            className="btn-primary" 
            style={{ marginTop: '1.5rem', alignSelf: 'flex-start' }}
            variants={itemVariants}
          >
            Explore Interactive Body Map
          </motion.a>
        </motion.div>

      </div>
    </section>
  );
}
