'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowRight, Briefcase, MapPin, Clock,
  Heart, Award, Sparkles, Smile, GraduationCap, Coffee,
  ChevronDown, Users, Star, TrendingUp
} from 'lucide-react';
import './careers.css';

const POSITIONS = [
  {
    title: 'Senior Physiotherapist',
    department: 'Clinical Care',
    location: 'Mumbai, IN (On-site)',
    type: 'Full-time',
    description: 'Lead assessments using our custom HEALTH 360 biometrics platform, diagnose complex movement disorders, and design advanced recovery protocols.',
  },
  {
    title: 'Movement & Data Analyst',
    department: 'Performance Lab',
    location: 'Mumbai, IN (On-site)',
    type: 'Full-time',
    description: 'Interpret postural, mobility, and cardiovascular screening datasets to optimize patients\' recovery progress and compile biomechanical reports.',
  },
  {
    title: 'Clinic Experience Lead',
    department: 'Operations',
    location: 'Mumbai, IN (On-site)',
    type: 'Full-time',
    description: 'Ensure a premium client journey from reception to post-visit data tracking, handling schedules, bookings, and customer relationships.',
  }
];

const PERKS = [
  { icon: <Heart size={20} />, title: 'Premium Health Coverage', desc: 'Comprehensive medical insurance covering you and your immediate dependents.' },
  { icon: <Award size={20} />, title: 'Performance Bonuses', desc: 'Quarterly financial rewards based on client satisfaction scores and clinical outcomes.' },
  { icon: <GraduationCap size={20} />, title: 'Education & Training Fund', desc: 'Annual budget for specialized physiotherapy certifications, courses, and seminars.' },
  { icon: <Sparkles size={20} />, title: 'State-of-the-Art Tech', desc: 'Work with the latest AI computer-vision systems, force plates, and custom software.' },
  { icon: <Smile size={20} />, title: 'Wellness Program', desc: 'Free monthly diagnostic scans, physiotherapy sessions, and customized physical therapy.' },
  { icon: <Coffee size={20} />, title: 'Flexible Time-off', desc: 'Generous paid leaves, wellness days, and a structured, balanced weekly schedule.' }
];

const STEPS = [
  { number: '01', title: 'Online Application', desc: 'Submit your resume and clinical interests through our portal.' },
  { number: '02', title: 'Technical Call', desc: 'A 30-min discussion on your clinical approach and biomechanics alignment.' },
  { number: '03', title: 'In-Clinic Assessment', desc: 'Visit our flagship clinic and demonstrate your hands-on therapy methods.' },
  { number: '04', title: 'Offer & Onboarding', desc: 'Align on responsibilities, growth paths, and receive a formal offer.' }
];

const VALUES = [
  {
    icon: <Award size={18} />,
    title: 'Continuous Growth & Education',
    desc: 'We fund advanced certifications (manual therapy, dry needling, craniosacral training) and hold bi-weekly peer reviews to elevate clinical competencies.'
  },
  {
    icon: <Heart size={18} />,
    title: 'Collaboration-First Model',
    desc: 'Our physiotherapists, analysts, and operations leads coordinate dynamically—treating complex conditions by combining mechanical and neurological perspectives.'
  },
  {
    icon: <Sparkles size={18} />,
    title: 'Sustained Professional Wellness',
    desc: 'We respect work-life balance, maintaining structured schedules and daily case-volume limits to prevent clinical fatigue and ensure premium patient care.'
  }
];

const FAQS = [
  { q: 'What is the clinical training timeline for new hires?', a: 'All clinical team members undergo a comprehensive 2-week onboarding on our proprietary screening software, AI cameras, and dynamometer devices, led by Dr. Rashmita.' },
  { q: 'Is there a path for career progression?', a: 'Absolutely. We offer paths from Junior Physiotherapist to Senior Clinician, Performance Lab Lead, and Clinic Operations Manager as we scale our locations.' },
  { q: 'Do you support relocation to Mumbai?', a: 'For senior clinical roles, we offer structured relocation assistance packages covering travel and initial temporary housing support.' }
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration: 0.55, delay }
});

export default function CareersPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Header />
      <main className="careers-main">

        {/* ── 1. HERO ─────────────────────────────────────── */}
        <section className="careers-hero xpad">
          <div className="careers-hero-inner">

            {/* Text */}
            <div className="careers-hero-text">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="careers-hero-eyebrow"
              >
                <Briefcase size={13} /> Careers at HEALTH 360
              </motion.div>

              <motion.h1
                className="careers-hero-title"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
              >
                Redefine physical wellness <em>with us</em>
              </motion.h1>

              <motion.p
                className="careers-hero-desc"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.16 }}
              >
                We merge clinical expertise with real-time biometric data. Join a team dedicated to movement longevity and patient-first innovation.
              </motion.p>

              <motion.div
                className="careers-hero-cta"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.24 }}
              >
                <a href="#open-roles" className="btn-primary">
                  View Open Roles <ArrowRight size={16} />
                </a>
                <span className="careers-hero-scroll">3 positions open</span>
              </motion.div>
            </div>

            {/* Image */}
            <motion.div
              className="careers-hero-image-wrap"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <img src="/careers_hero_team.png" alt="HEALTH 360 clinical team" />

              {/* Floating chips */}
              <div className="careers-hero-stat careers-hero-stat--a">
                <span className="careers-hero-stat-num">10+</span>
                <span className="careers-hero-stat-label">Specialists</span>
              </div>
              <div className="careers-hero-stat careers-hero-stat--b">
                <span className="careers-hero-stat-num">4.9★</span>
                <span className="careers-hero-stat-label">Team rating</span>
              </div>
            </motion.div>
          </div>

          {/* Stats bar */}
          <motion.div
            className="careers-stats-bar"
            {...fadeUp(0.2)}
          >
            <div className="careers-stats-bar-inner">
              {[
                { num: '2013', label: 'Founded in Mumbai' },
                { num: '5,000+', label: 'Patients treated' },
                { num: '98%', label: 'Client satisfaction' },
                { num: '3', label: 'Open positions today' }
              ].map((s, i) => (
                <div key={i} className="careers-stat-item">
                  <span className="careers-stat-item-num">{s.num}</span>
                  <span className="careers-stat-item-label">{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── 2. CULTURE & VALUES ─────────────────────────── */}
        <section className="careers-culture">
          <div className="careers-culture-inner xpad">

            {/* Left: Text & values */}
            <div>
              <motion.p className="careers-culture-label" {...fadeUp()}>Our Environment</motion.p>
              <motion.h2 className="careers-culture-title" {...fadeUp(0.07)}>
                A place where great clinicians thrive
              </motion.h2>
              <motion.p className="careers-culture-desc" {...fadeUp(0.12)}>
                Premium client outcomes start with a supportive, growth-oriented environment for our clinicians and staff.
              </motion.p>

              <div className="careers-value-list">
                {VALUES.map((v, i) => (
                  <motion.div key={i} className="careers-value-item" {...fadeUp(0.1 + i * 0.07)}>
                    <div className="careers-value-icon">{v.icon}</div>
                    <div>
                      <h4>{v.title}</h4>
                      <p>{v.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: image collage */}
            <motion.div
              className="careers-culture-images"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
            >
              <div className="careers-culture-img-main">
                <img src="/clinic_careers.png" alt="HEALTH 360 clinic environment" />
              </div>
              <div className="careers-culture-img-secondary">
                <img src="/physio_therapy_minimal.png" alt="Physiotherapy session" />
              </div>
            </motion.div>

          </div>
        </section>

        {/* ── 3. PERKS ────────────────────────────────────── */}
        <section className="careers-perks">
          <div className="xpad">
            <motion.div className="careers-section-header" {...fadeUp()}>
              <p className="careers-section-label">The Experience</p>
              <h2 className="careers-section-title">Perks & Benefits</h2>
            </motion.div>

            <div className="careers-perks-grid">
              {PERKS.map((perk, i) => (
                <motion.div key={i} className="careers-perk-card" {...fadeUp(i * 0.06)}>
                  <div className="careers-perk-icon">{perk.icon}</div>
                  <h3>{perk.title}</h3>
                  <p>{perk.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. HIRING PROCESS ───────────────────────────── */}
        <section className="careers-process">
          <div className="xpad">
            <motion.div className="careers-section-header" {...fadeUp()}>
              <p className="careers-section-label">Our Journey Together</p>
              <h2 className="careers-section-title">The Hiring Process</h2>
            </motion.div>

            <div className="careers-steps">
              {STEPS.map((step, i) => (
                <motion.div key={i} className="careers-step" {...fadeUp(0.08 + i * 0.1)}>
                  <div className="careers-step-dot">{step.number}</div>
                  <div className="careers-step-body">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. OPEN ROLES ───────────────────────────────── */}
        <section className="careers-roles" id="open-roles">
          <div className="xpad">
            <motion.div className="careers-section-header" {...fadeUp()}>
              <p className="careers-section-label">Join the Team</p>
              <h2 className="careers-section-title">Open Roles</h2>
            </motion.div>

            <div className="careers-roles-list">
              {POSITIONS.map((job, i) => (
                <motion.div key={i} className="careers-role-card" {...fadeUp(0.06 + i * 0.08)}>
                  <div>
                    <p className="careers-role-dept">{job.department}</p>
                    <h3 className="careers-role-title">{job.title}</h3>
                    <p className="careers-role-desc">{job.description}</p>
                    <div className="careers-role-meta">
                      <span><MapPin size={13} /> {job.location}</span>
                      <span><Clock size={13} /> {job.type}</span>
                    </div>
                  </div>
                  <div className="careers-role-action">
                    <Link
                      href={`/careers/apply?role=${encodeURIComponent(job.title)}`}
                      className="btn-primary"
                      style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', padding: '11px 22px' }}
                    >
                      Apply Now <ArrowRight size={15} />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. FAQ ──────────────────────────────────────── */}
        <section className="careers-faq">
          <div className="xpad">
            <motion.div className="careers-section-header" {...fadeUp()}>
              <p className="careers-section-label">Got Questions?</p>
              <h2 className="careers-section-title">Frequently Asked</h2>
            </motion.div>

            <div className="careers-faq-inner">
              {FAQS.map((faq, i) => (
                <div key={i} className="careers-faq-item">
                  <button
                    className="careers-faq-btn"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        className="careers-faq-answer"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28 }}
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
