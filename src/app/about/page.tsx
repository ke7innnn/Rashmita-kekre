'use client';

import { useRef, useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Award, BookOpen, Briefcase, Heart, User, CheckCircle, ShieldCheck, Smile } from 'lucide-react';
import '../../components/InteractiveBodyDiagram.css';

const STATS = [
  { value: '15+', label: 'Years of Experience' },
  { value: '1000+', label: 'Patients Recovered' },
  { value: '25+', label: 'Specialized Therapy Programs' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '95%', label: 'Patient Retention' }
];

const QUALIFICATIONS = [
  'Bachelor of Physiotherapy (BPT)',
  'Biodynamic Craniosacral Therapist (BCST)'
];

const CERTIFICATIONS = [
  'Ante and Postnatal Therapist',
  'Pelvic Floor Rehab Therapist',
  'Manual Therapist',
  'Certified Kinesio Taping Therapist (CKTT)',
  'Dry Needling and Electro Needling Therapist',
  'Certified Cupping Therapist',
  'Certified IASTM Therapist'
];

const ROLES = [
  'Clinical Director, Health 360 Physiotherapy & Craniosacral Therapy Clinic',
  'Consultant Senior Physiotherapist, Divine Hospital'
];

function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const numVal = parseInt(value.replace(/\D/g, ""), 10);
  const suffix = value.replace(/\d/g, "");
  
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    
    let start = 0;
    const end = numVal;
    if (start === end) return;
    
    const duration = 1.5; // seconds
    const startTime = performance.now();

    let animationFrameId: number;

    const updateCount = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuad = progress * (2 - progress);
      const current = Math.floor(easeOutQuad * end);
      
      setCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, numVal]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function AboutPage() {
  const bioSectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: bioSectionRef,
    offset: ["start end", "end start"]
  });

  const photoY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <>
      <Header />
      <main style={{ paddingTop: '130px', minHeight: '80vh' }}>
        
        {/* About Hero */}
        <section style={{ padding: '5rem 0 2rem', background: 'radial-gradient(circle at top right, rgba(0, 159, 199, 0.04), transparent 60%)' }}>
          <div className="xpad" style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto' }}>
            <motion.p 
              className="subtitle uppercase"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              About Health 360
            </motion.p>
            <h1 
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 500, margin: '1rem 0 1.5rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}
            >
              <span style={{ display: 'block', overflow: 'hidden' }}>
                <motion.span
                  style={{ display: 'block', transformOrigin: 'left top' }}
                  initial={{ y: '105%', skewY: 2.5 }}
                  animate={{ y: '0%', skewY: 0 }}
                  transition={{ duration: 0.9, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
                >
                  Empowering Movement.
                </motion.span>
              </span>
              <span style={{ display: 'block', overflow: 'hidden' }}>
                <motion.span
                  style={{ display: 'block', transformOrigin: 'left top' }}
                  initial={{ y: '105%', skewY: 2.5 }}
                  animate={{ y: '0%', skewY: 0 }}
                  transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  Restoring Balance.
                </motion.span>
              </span>
              <span style={{ display: 'block', overflow: 'hidden' }}>
                <motion.span
                  style={{ display: 'block', transformOrigin: 'left top' }}
                  initial={{ y: '105%', skewY: 2.5 }}
                  animate={{ y: '0%', skewY: 0 }}
                  transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  Enhancing Life.
                </motion.span>
              </span>
            </h1>
            <motion.p 
              style={{ fontSize: '1.25rem', color: 'var(--muted-foreground)', lineHeight: 1.6 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              A holistic center dedicated to healing through movement and mindful rehabilitation.
            </motion.p>
          </div>
        </section>

        {/* Doctor Bio Spotlight */}
        <section style={{ padding: '3rem 0' }} ref={bioSectionRef}>
          <div className="xpad">
            <div className="glass rounded-l" style={{ padding: '4rem 3rem', maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '4rem',
                alignItems: 'center'
              }}>
                {/* Photo Column */}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <motion.div 
                    style={{
                      position: 'relative',
                      width: '100%',
                      maxWidth: '350px',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      aspectRatio: '0.72',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                      background: '#e5e2d5'
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.img 
                      src="/doctor.png" 
                      alt="Dr. Rashmita Karvir-Kekre" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', y: photoY, scale: 1.05 }} 
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '20px',
                      background: 'var(--brand)',
                      color: 'white',
                      padding: '8px 18px',
                      borderRadius: '9999px',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      boxShadow: '0 4px 12px rgba(0, 159, 199, 0.3)'
                    }}>
                      Consultant Senior Physiotherapist
                    </div>
                  </motion.div>
                </div>

                {/* Bio Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <span className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Our Specialist</span>
                  <motion.h2 
                    style={{ fontSize: '2.5rem', fontWeight: 500, margin: 0, letterSpacing: '-0.02em' }}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    Dr. Rashmita Karvir-Kekre (PT)
                  </motion.h2>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Health 360 Physiotherapy & Craniosacral Therapy Clinic, founded by Dr. Rashmita Karvir-Kekre, is a holistic center dedicated to healing through movement and mindful rehabilitation. With over 15 years of professional experience, Dr. Rashmita offers an integrated approach that focuses on complete physical and emotional wellbeing.
                  </p>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Our philosophy is simple — treat the root cause, not just the symptoms. Through evidence-based physiotherapy and gentle craniosacral therapy, we help individuals recover from pain, regain functional strength, and restore their natural body balance.
                  </p>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                    Whether it’s chronic pain, post-surgical rehab, women’s health concerns, or pediatric development challenges, we design customized therapy programs that promote long-term recovery and improved quality of life.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid Banner */}
        <section style={{ padding: '4rem 0' }}>
          <div className="xpad">
            <motion.div 
              className="glass rounded-l about-stats-grid" 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {STATS.map((stat, idx) => (
                <div key={idx}>
                  <h4 style={{ fontSize: '3rem', fontWeight: 500, color: 'var(--brand)', margin: 0 }}>
                    <AnimatedCounter value={stat.value} />
                  </h4>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', fontWeight: 500, marginTop: '0.5rem' }}>{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Clinical Philosophy Section */}
        <section style={{ padding: '3rem 0 5rem' }}>
          <div className="xpad" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Our Pillars</p>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 500, marginTop: '0.5rem' }}>Clinical Philosophy</h2>
              <p style={{ maxWidth: '650px', margin: '0.75rem auto 0', color: 'var(--muted-foreground)', fontSize: '1.05rem', lineHeight: 1.5 }}>
                We bridge advanced clinical science with restorative mindfulness to construct a foundation for active, pain-free movement.
              </p>
            </div>

            <div className="pillars-grid">
              <motion.div 
                className="glass rounded-l" 
                style={{ 
                  padding: '2.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1.25rem',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  boxShadow: '0 8px 30px -10px rgba(0, 0, 0, 0.03)'
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ 
                  y: -6, 
                  backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                  borderColor: 'rgba(0, 159, 199, 0.25)',
                  boxShadow: '0 24px 48px -15px rgba(0, 159, 199, 0.08)'
                }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div style={{ color: 'var(--brand)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,159,199,0.06)', borderRadius: '12px', border: '1px solid rgba(0,159,199,0.08)' }}>
                  <Heart size={24} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--foreground)' }}>Patient-Centric Recovery</h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.55 }}>
                  Every body is unique. We conduct multi-dimensional metric scans to formulate customized therapies designed around your specific career, lifestyle, and recovery objectives.
                </p>
              </motion.div>

              <motion.div 
                className="glass rounded-l" 
                style={{ 
                  padding: '2.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1.25rem',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  boxShadow: '0 8px 30px -10px rgba(0, 0, 0, 0.03)'
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ 
                  y: -6, 
                  backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                  borderColor: 'rgba(0, 159, 199, 0.25)',
                  boxShadow: '0 24px 48px -15px rgba(0, 159, 199, 0.08)'
                }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div style={{ color: 'var(--brand)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,159,199,0.06)', borderRadius: '12px', border: '1px solid rgba(0,159,199,0.08)' }}>
                  <Award size={24} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--foreground)' }}>Evidence-Based Science</h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.55 }}>
                  We apply peer-reviewed clinical procedures, utilizing state-of-the-art postural screening and diagnostic movement assessments to locate root imbalances rather than masking symptoms.
                </p>
              </motion.div>

              <motion.div 
                className="glass rounded-l" 
                style={{ 
                  padding: '2.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1.25rem',
                  cursor: 'pointer',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  boxShadow: '0 8px 30px -10px rgba(0, 0, 0, 0.03)'
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ 
                  y: -6, 
                  backgroundColor: 'rgba(255, 255, 255, 0.96)', 
                  borderColor: 'rgba(0, 159, 199, 0.25)',
                  boxShadow: '0 24px 48px -15px rgba(0, 159, 199, 0.08)'
                }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div style={{ color: 'var(--brand)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,159,199,0.06)', borderRadius: '12px', border: '1px solid rgba(0,159,199,0.08)' }}>
                  <ShieldCheck size={24} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--foreground)' }}>Holistic Restorative Balance</h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.975rem', lineHeight: 1.55 }}>
                  Our therapies integrate manual manipulation, specialized exercises, and craniosacral therapy to soothe the nervous system and promote systemic long-term wellness.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Clinical Evolution Timeline */}
        <section style={{ padding: '5rem 0', background: 'rgba(0, 159, 199, 0.01)', borderTop: '1px solid rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
          <div className="xpad" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
              <p className="subtitle uppercase" style={{ fontSize: '0.8rem' }}>Our History</p>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 500, marginTop: '0.5rem' }}>Clinical Evolution Timeline</h2>
              <p style={{ maxWidth: '600px', margin: '0.75rem auto 0', color: 'var(--muted-foreground)', fontSize: '1.05rem' }}>
                Thirteen years of dedication, growth, and commitment to holistic physical rehabilitation.
              </p>
            </div>

            <div className="about-timeline-grid">
              {[
                { year: '2013', img: '/milestone_2013.jpg', title: 'Clinical Foundation', desc: 'Dr. Rashmita established specialized orthopedic physical therapy support, focusing on manual skeletal treatment and musculoskeletal adjustments.' },
                { year: '2017', img: '/milestone_2017.jpg', title: 'Craniosacral Integration', desc: 'Integrated Biodynamic Craniosacral Therapy (BCST) into standard recovery, merging neurological wellness with manual rehabilitation.' },
                { year: '2022', img: '/milestone_2022.jpg', title: 'Digitized Diagnosis', desc: 'Adopted advanced biometrics, introducing dynamic range-of-motion assessments and computerized posture scans for precise client records.' },
                { year: '2026', img: '/milestone_2026.jpg', title: 'HEALTH 360 Clinic', desc: 'Launched the integrated flagship facility in Vasai West, offering unified physiotherapy, craniosacral therapy, and patient dashboards.' }
              ].map((milestone, idx) => (
                <motion.div 
                  key={idx}
                  className="glass rounded-m"
                  style={{ 
                    padding: '1.5rem', 
                    position: 'relative', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '1rem', 
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.45)',
                    boxShadow: '0 8px 30px -10px rgba(0, 0, 0, 0.03)',
                    cursor: 'pointer'
                  }}
                  initial="initial"
                  whileInView="animate"
                  whileHover="hover"
                  viewport={{ once: true }}
                  variants={{
                    initial: { opacity: 0, y: 25 },
                    animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: idx * 0.1 } },
                    hover: {
                      y: -6,
                      backgroundColor: 'rgba(255, 255, 255, 0.96)',
                      borderColor: 'rgba(0, 159, 199, 0.25)',
                      boxShadow: '0 24px 48px -15px rgba(0, 159, 199, 0.08)'
                    }
                  }}
                >
                  <div style={{ width: '100%', height: '145px', overflow: 'hidden', borderRadius: '12px', background: '#e5e2d5' }}>
                    <motion.img 
                      src={milestone.img} 
                      alt={milestone.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      variants={{
                        hover: { scale: 1.08 }
                      }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand)', lineHeight: 1 }}>{milestone.year}</span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '0.25rem', color: 'var(--foreground)' }}>{milestone.title}</h3>
                    <p style={{ color: 'var(--muted-foreground)', fontSize: '0.88rem', lineHeight: 1.45, marginTop: '0.5rem' }}>{milestone.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Credentials & Details Layout */}
        <section style={{ padding: '4rem 0 6rem' }}>
          <div className="xpad" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '4rem',
              alignItems: 'start'
            }}>
              
              {/* Left Column: Education & Experience */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                
                {/* Qualifications */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem' }}>
                    <BookOpen style={{ color: 'var(--brand)' }} /> Education & Qualifications
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {QUALIFICATIONS.map((qual, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <CheckCircle size={18} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                        <span style={{ fontSize: '1.05rem', color: 'var(--muted-foreground)' }}>{qual}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience Roles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem' }}>
                    <Briefcase style={{ color: 'var(--brand)' }} /> Current Roles
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {ROLES.map((role, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <ShieldCheck size={18} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: '3px' }} />
                        <span style={{ fontSize: '1.05rem', color: 'var(--muted-foreground)', lineHeight: 1.4 }}>{role}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Middle Column: Special Trainings & Certifications */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem' }}>
                  <Award style={{ color: 'var(--brand)' }} /> Certifications & Special Training
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {CERTIFICATIONS.map((cert, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <CheckCircle size={18} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                      <span style={{ fontSize: '1.05rem', color: 'var(--muted-foreground)' }}>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Accent Clinical Tools Photo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '0.75rem' }}>
                  <Heart style={{ color: 'var(--brand)' }} /> Clinical Equipment
                </h3>
                <motion.div 
                  className="glass rounded-m" 
                  style={{ 
                    overflow: 'hidden', 
                    aspectRatio: '1', 
                    padding: '10px', 
                    position: 'relative' 
                  }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <img 
                    src="/rehab_tools.jpg" 
                    alt="Clinical Rehabilitation Tools and Equipment" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      borderRadius: '12px' 
                    }} 
                  />
                </motion.div>
              </div>

            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
