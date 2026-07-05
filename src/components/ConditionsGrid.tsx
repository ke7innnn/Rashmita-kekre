'use client';

import { motion } from 'framer-motion';
import './ConditionsGrid.css';

const CONDITIONS = [
  { title: 'Back & Spine Pain', img: '/physio_spinal.jpg', tag: 'Musculoskeletal' },
  { title: 'Shoulder & Neck Pain', img: '/physio_shoulder.jpg', tag: 'Orthopedic' },
  { title: 'Knee & Joint Rehab', img: '/physio_knee.jpg', tag: 'Post-surgical' },
  { title: 'Sports Injuries', img: '/physio_exercise.jpg', tag: 'Athletic Care' },
  { title: 'Pediatric Development', img: '/physio_pediatric.jpg', tag: 'Pediatric' },
  { title: 'Therapeutic Massage', img: '/physio_massage.jpg', tag: 'Recovery' },
];

export default function ConditionsGrid() {
  return (
    <section className="conditions-section xpad">
      <div className="conditions-inner">

        <div className="conditions-header">
          <p className="subtitle uppercase">What We Treat</p>
          <h2 className="conditions-title">Conditions & Specializations</h2>
          <p className="conditions-subtext">
            From acute injuries to chronic pain and postural disorders — our clinicians have successfully treated a broad spectrum of conditions.
          </p>
        </div>

        <div className="conditions-grid">
          {CONDITIONS.map((c, idx) => (
            <motion.div
              key={idx}
              className="condition-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: idx * 0.07 }}
              whileHover={{ y: -6 }}
            >
              <div className="condition-img-wrapper">
                <img src={c.img} alt={c.title} className="condition-img" />
                <div className="condition-overlay">
                  <span className="condition-tag">{c.tag}</span>
                  <h3 className="condition-name">{c.title}</h3>
                  <a href="#book" className="condition-btn">Book Appointment →</a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
