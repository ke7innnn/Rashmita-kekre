
import { Activity, ScanLine, BicepsFlexed, ArrowRight, PersonStanding } from 'lucide-react';
import './AssessmentFeatures.css';

export default function AssessmentFeatures() {
  const features = [
    {
      title: 'POSTURAL ANALYSIS',
      description: 'Full body mechanics and alignment',
      icon: <PersonStanding size={40} className="feature-icon" />
    },
    {
      title: 'MOBILITY SCREENING',
      description: 'Joint range of motion and flexibility',
      icon: <ScanLine size={40} className="feature-icon" />
    },
    {
      title: 'STRENGTH TESTING',
      description: 'Targeted muscle group evaluation',
      icon: <BicepsFlexed size={40} className="feature-icon" />
    },
    {
      title: 'CARDIOVASCULAR',
      description: 'Heart rate and performance metrics',
      icon: <Activity size={40} className="feature-icon" />
    }
  ];

  return (
    <section id="assessment" className="assessment-section">
      <div className="assessment-bg-gradient"></div>
      
      <div className="xpad assessment-content">
        <div className="assessment-header">
          <p className="subtitle uppercase">Comprehensive Movement Analysis</p>
          <h2 className="title text-balance">HEALTH 360 Assessment</h2>
          <p className="description text-balance">
            Our breakthrough methodology captures hundreds of data points across your posture, mobility, strength, and cardiovascular health – all in one visit.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card glass rounded-m">
              <div className="feature-icon-wrapper rounded-m">
                {feature.icon}
              </div>
              <div className="feature-text">
                <p className="feature-title uppercase">{feature.title}</p>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="assessment-summary glass rounded-l">
          <div className="summary-content">
            <p className="subtitle uppercase">Physiotherapy re-imagined</p>
            <h3 className="summary-title text-balance">Everything covered in under one hour</h3>
            <ul className="summary-list">
              <li>In-depth consultation with a specialist physiotherapist</li>
              <li>Results processed and explained instantly</li>
              <li>Your data and custom action plan shared in app</li>
              <li>Engineered by HEALTH 360 from the ground up</li>
            </ul>
            <a href="#book" className="btn-primary" style={{ marginTop: '2rem' }}>
              Book an Assessment <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
