'use client';

import { motion } from 'framer-motion';
import './HowItWorks.css';

const STEPS = [
  {
    number: '01',
    title: 'Book Your Session',
    desc: 'Choose your preferred appointment slot online or by phone. New patients receive a complimentary 15-minute pre-assessment call.'
  },
  {
    number: '02',
    title: 'Comprehensive Diagnosis',
    desc: 'Dr. Rashmita performs a detailed biomechanical evaluation — assessing posture, range of motion, strength, and nerve function.'
  },
  {
    number: '03',
    title: 'Personalized Treatment',
    desc: 'Receive a customized therapy plan combining manual techniques, corrective exercise, dry needling, or craniosacral therapy as required.'
  },
  {
    number: '04',
    title: 'Track Your Recovery',
    desc: 'Progress is monitored at each session. We adjust the protocol dynamically to accelerate healing and maximize long-term results.'
  }
];

export default function HowItWorks() {
  return (
    <section className="how-section xpad">
      <div className="how-inner">
        <div className="how-header">
          <p className="subtitle uppercase">Our Process</p>
          <h2 className="how-title">How It Works</h2>
          <p className="how-sub">A structured, patient-centered process designed to get you back to full function — safely and efficiently.</p>
        </div>

        <div className="how-steps">
          {STEPS.map((step, idx) => (
            <motion.div
              key={idx}
              className="how-step glass rounded-l"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <span className="how-step-number">{step.number}</span>
              <h3 className="how-step-title">{step.title}</h3>
              <p className="how-step-desc">{step.desc}</p>
              {idx < STEPS.length - 1 && <div className="how-step-connector" />}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
