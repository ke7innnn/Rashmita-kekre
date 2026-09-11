'use client';

import React from 'react';

export type CertificateType =
  | 'treatment_payment'
  | 'fitness'
  | 'unfitness'
  | 'discharge_summary';

export interface CertificateData {
  type: CertificateType;
  issueDate?: string;
  patientName?: string;
  age?: string;
  gender?: string;
  diagnosis?: string;
  startDate?: string;
  endDate?: string;
  sessions?: string;
  treatmentProvided?: string;
  chargesPerSession?: string;
  totalAmount?: string;
  assessmentDate?: string;
  symptomsCondition?: string;
  reviewDate?: string;
  reviewWeeks?: string;
  adviceRestrictions?: string;
  remarks?: string;
  complaints?: string;
  findings?: string;
  otherTreatment?: string;
  outcome?: string;
  homeAdvice?: string;
  precautions?: string;
  // Checkbox maps
  fitnessOptions?: Record<string, boolean>;
  progressOptions?: Record<string, boolean>;
  followupOptions?: Record<string, boolean>;
  dischargeStatusOptions?: Record<string, boolean>;
}

interface CertificateDocumentProps {
  data: CertificateData;
  isEditable?: boolean;
  previewOnly?: boolean;
  onUpdate?: (updated: CertificateData) => void;
}

export default function CertificateDocument({
  data,
  isEditable = false,
  previewOnly = false,
  onUpdate,
}: CertificateDocumentProps) {
  const handleChange = (field: keyof CertificateData, value: any) => {
    if (onUpdate) {
      onUpdate({ ...data, [field]: value });
    }
  };

  const handleCheckboxChange = (
    category: 'fitnessOptions' | 'progressOptions' | 'followupOptions' | 'dischargeStatusOptions',
    key: string
  ) => {
    if ((!isEditable || previewOnly) && !onUpdate) return;
    const current = data[category] || {};
    const updated = { ...current, [key]: !current[key] };
    handleChange(category, updated);
  };

  const renderEditable = (
    field: keyof CertificateData,
    fallback: string = '',
    placeholder: string = '',
    className: string = ''
  ) => {
    const val = (data[field] as string) || fallback;
    if (isEditable && !previewOnly) {
      return (
        <span
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => handleChange(field, e.currentTarget.textContent || '')}
          className={`cert-editable-field ${className}`}
          title="Click to edit parameter directly"
        >
          {val || placeholder}
        </span>
      );
    }
    return <span className={`cert-value font-semibold ${className}`}>{val}</span>;
  };

  const renderHeader = () => (
    <div className="cert-header">
      <div className="cert-header-left">
        <img
          src="/logo/rklogo.png"
          alt="Health 360 Clinic"
          className="cert-logo"
        />
      </div>

      <div className="cert-header-right">
        <div className="cert-doc-name">Dr. Rashmita Karvir Kekre</div>
        <div className="cert-doc-creds">B.P.Th. (M.I.A.P.)</div>
        <div className="cert-doc-creds">BCST</div>
        <div className="cert-contact-item mt-1">
          <span>+91 8071 583 519</span>
          <span className="cert-icon-badge">📞</span>
        </div>
        <div className="cert-contact-item">
          <span>health360vasai@gmail.com</span>
          <span className="cert-icon-badge">✉️</span>
        </div>
        <div className="cert-contact-item">
          <span>Shop no. 1 & 2, Shree Amardeep Enclave</span>
          <span className="cert-icon-badge">🏢</span>
        </div>
        <div className="cert-contact-item">
          <span>Om Nagar, Vasai West</span>
          <span className="cert-icon-badge">📍</span>
        </div>
      </div>
    </div>
  );

  const renderSignatory = () => (
    <div className="cert-signatory-block">
      <div className="cert-sincerely">Sincerely,</div>
      <div className="cert-sign-container">
        <img
          src="/signatures/dr-rashmita-signature.png"
          alt="Dr. Rashmita Karvir-Kekre Signature"
          className="cert-signature-img"
        />
        <div className="cert-sign-line" />
      </div>
      <div className="cert-sign-doc-name">Dr. Rashmita Karvir-Kekre (PT)</div>
      <div className="cert-sign-clinic-name">Health 360 Physiotherapy &amp; Craniosacral Therapy Clinic</div>
      <div className="cert-stamp-container">
        <img
          src="/signatures/dr-rashmita-stamp.png"
          alt="Doctor Registration Stamp"
          className="cert-stamp-img"
        />
      </div>
    </div>
  );

  /* -------------------------------------------------------------
     1. TREATMENT & PAYMENT CERTIFICATE (Mediclaim)
     ------------------------------------------------------------- */
  if (data.type === 'treatment_payment') {
    return (
      <div className="cert-page cert-sheet">
        <style jsx global>{certStyles}</style>
        {renderHeader()}

        <div className="cert-date-row">
          <strong>Date:</strong> {renderEditable('issueDate', data.issueDate || 'Today')}
        </div>

        <div className="cert-title-block">
          <h1 className="cert-main-title">TREATMENT &amp; PAYMENT CERTIFICATE</h1>
          <p className="cert-subtitle">To Whomsoever It May Concern</p>
        </div>

        <div className="cert-body-content">
          <p className="cert-paragraph leading-relaxed">
            This is to certify that Mr./Ms.{' '}
            {renderEditable('patientName', 'Patient Name', 'Patient Name')}
            {data.age ? <>, aged {renderEditable('age', data.age, 'Age')} years,</> : null}{' '}
            was treated at Health 360 Physiotherapy &amp; Craniosacral Therapy Clinic, Vasai West for{' '}
            {renderEditable('diagnosis', 'Cervical Spondylosis / Musculoskeletal Pain', 'Diagnosis')}.
          </p>

          <p className="cert-paragraph leading-relaxed">
            The patient underwent physiotherapy treatment from{' '}
            {renderEditable('startDate', '1 Aug 2026', 'Start Date')} to{' '}
            {renderEditable('endDate', '10 Sept 2026', 'End Date')}.
          </p>

          <div className="cert-details-box">
            <p className="font-bold text-[10pt] mb-2 text-slate-800">Treatment details are as follows:</p>
            <ul className="cert-bullet-list">
              <li>
                <span className="cert-list-label">• Diagnosis / Condition:</span>
                <span className="cert-list-value">{renderEditable('diagnosis', 'Cervical Spine Rehabilitation')}</span>
              </li>
              <li>
                <span className="cert-list-label">• Treatment Period:</span>
                <span className="cert-list-value">
                  {renderEditable('startDate', '1 Aug 2026')} to {renderEditable('endDate', '10 Sept 2026')}
                </span>
              </li>
              <li>
                <span className="cert-list-label">• Number of Sessions Attended:</span>
                <span className="cert-list-value">{renderEditable('sessions', '10 Sessions')}</span>
              </li>
              <li>
                <span className="cert-list-label">• Treatment Provided:</span>
                <span className="cert-list-value">
                  {renderEditable('treatmentProvided', 'Manual Therapy, Spinal Mobilization, Postural Ergonomics & Strengthening')}
                </span>
              </li>
              <li>
                <span className="cert-list-label">• Consultation &amp; Physiotherapy Charges per Session:</span>
                <span className="cert-list-value">₹ {renderEditable('chargesPerSession', '650.00')}</span>
              </li>
              <li>
                <span className="cert-list-label">• Total Amount Paid:</span>
                <span className="cert-list-value font-bold text-slate-900">₹ {renderEditable('totalAmount', '6,500.00')}</span>
              </li>
            </ul>
          </div>

          <p className="cert-paragraph text-[9pt] italic text-slate-700 mt-6 leading-relaxed">
            The above treatment was medically necessary and was provided under the supervision of a qualified physiotherapist for the management and rehabilitation of the condition.
          </p>
        </div>

        {renderSignatory()}
      </div>
    );
  }

  /* -------------------------------------------------------------
     2. FITNESS CERTIFICATE
     ------------------------------------------------------------- */
  if (data.type === 'fitness') {
    const fitnessItems = [
      { key: 'work', label: 'Fit for Work Duties' },
      { key: 'sports', label: 'Fit for Sports Participation' },
      { key: 'gym', label: 'Fit for Gym / Fitness Activities' },
      { key: 'school', label: 'Fit for School / College Activities' },
      { key: 'travel', label: 'Fit for Travel' },
      { key: 'daily', label: 'Fit for Daily Activities' },
      { key: 'regular', label: 'Fit to Resume Regular Activities' },
      { key: 'advice', label: 'Fit with the Following Advice / Restrictions:' },
    ];

    return (
      <div className="cert-page cert-sheet">
        <style jsx global>{certStyles}</style>
        {renderHeader()}

        <div className="cert-date-row">
          <strong>Date:</strong> {renderEditable('issueDate', data.issueDate || 'Today')}
        </div>

        <div className="cert-title-block">
          <h1 className="cert-main-title">FITNESS CERTIFICATE</h1>
          <p className="cert-subtitle">To Whomsoever It May Concern</p>
        </div>

        <div className="cert-body-content">
          <p className="cert-paragraph leading-relaxed">
            This is to certify that Mr./Ms.{' '}
            {renderEditable('patientName', 'Patient Name', 'Patient Name')}
            {data.age ? <>, aged {renderEditable('age', data.age, 'Age')} years,</> : null}{' '}
            has undergone physiotherapy assessment and/or treatment at Health 360 Physiotherapy &amp; Craniosacral Therapy Clinic.
          </p>

          <p className="cert-paragraph leading-relaxed mt-3">
            Upon assessment on{' '}
            {renderEditable('assessmentDate', 'Today', 'Assessment Date')}, the individual is found to be:
          </p>

          <div className="cert-checkbox-list my-4 space-y-2">
            {fitnessItems.map((item) => {
              const checked = !!data.fitnessOptions?.[item.key];
              return (
                <div
                  key={item.key}
                  className="cert-checkbox-item flex items-start gap-2.5 cursor-pointer select-none"
                  onClick={() => handleCheckboxChange('fitnessOptions', item.key)}
                >
                  <div className={`cert-checkbox-box ${checked ? 'checked' : ''}`}>
                    {checked ? '✓' : ''}
                  </div>
                  <div className="text-[9.5pt] text-slate-800 flex-1">
                    {item.label}
                    {item.key === 'advice' && (
                      <div className="mt-1">
                        {renderEditable(
                          'adviceRestrictions',
                          'Perform active warmup, avoid lifting > 15kg without lumbar support for 2 weeks',
                          'Specific clinical restrictions or guidelines...',
                          'block w-full'
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cert-remarks-block mt-4">
            <strong className="block text-[9pt] text-slate-800 mb-1">Remarks:</strong>
            <div className="cert-lines-area">
              {renderEditable(
                'remarks',
                'Patient demonstrates full pain-free functional range of motion and normal muscle power.',
                'Additional clinical findings or advice...'
              )}
            </div>
          </div>

          <p className="cert-paragraph text-[8.5pt] italic text-slate-600 mt-6 leading-relaxed">
            This certificate is issued based on the individual's current functional status and assessment findings and is valid as of the date of examination.
          </p>
        </div>

        {renderSignatory()}
      </div>
    );
  }

  /* -------------------------------------------------------------
     3. UNFITNESS FOR WORK CERTIFICATE (Medical Rest)
     ------------------------------------------------------------- */
  if (data.type === 'unfitness') {
    return (
      <div className="cert-page cert-sheet">
        <style jsx global>{certStyles}</style>
        {renderHeader()}

        <div className="cert-date-row">
          <strong>Date:</strong> {renderEditable('issueDate', data.issueDate || 'Today')}
        </div>

        <div className="cert-title-block">
          <h1 className="cert-main-title">UNFITNESS FOR WORK CERTIFICATE</h1>
          <p className="cert-subtitle">To Whomsoever It May Concern</p>
        </div>

        <div className="cert-body-content">
          <p className="cert-paragraph leading-relaxed">
            This is to certify that Mr./Ms.{' '}
            {renderEditable('patientName', 'Patient Name', 'Patient Name')}
            {data.age ? <>, aged {renderEditable('age', data.age, 'Age')} years,</> : null}{' '}
            has undergone physiotherapy assessment and/or treatment at Health 360 Physiotherapy &amp; Craniosacral Therapy Clinic.
          </p>

          <p className="cert-paragraph leading-relaxed mt-3">
            Upon assessment on{' '}
            {renderEditable('assessmentDate', 'Today', 'Assessment Date')}, the individual is currently experiencing{' '}
            {renderEditable('symptomsCondition', 'Acute Lumbar Radiculopathy with Severe Muscle Spasms', 'Condition')} and is{' '}
            <strong className="text-slate-900 font-bold uppercase tracking-wide">NOT FIT TO PERFORM REGULAR WORK DUTIES</strong> from{' '}
            {renderEditable('startDate', 'Today', 'Start Date')} to{' '}
            {renderEditable('endDate', 'Next Week', 'End Date')}.
          </p>

          <p className="cert-paragraph leading-relaxed mt-3">
            The patient has been advised to rest and continue the prescribed treatment program during this period to facilitate recovery and prevent aggravation of the condition.
          </p>

          <div className="cert-remarks-block mt-4">
            <strong className="block text-[9pt] text-slate-800 mb-1">Remarks:</strong>
            <div className="cert-lines-area min-h-[50px]">
              {renderEditable(
                'remarks',
                'Patient advised complete spinal offloading, modalities treatment daily, and avoidance of prolonged sitting or lifting.',
                'Specific clinical rest instructions...'
              )}
            </div>
          </div>

          <p className="cert-paragraph leading-relaxed mt-4 font-semibold text-slate-800">
            A review assessment is advised on or after{' '}
            {renderEditable('reviewDate', 'Next Week', 'Review Date')} to determine fitness for return to work.
          </p>

          <p className="cert-paragraph text-[8.5pt] italic text-slate-600 mt-6 leading-relaxed">
            This certificate is issued based on the individual's current functional status and assessment findings.
          </p>
        </div>

        {renderSignatory()}
      </div>
    );
  }

  /* -------------------------------------------------------------
     4. PHYSIOTHERAPY DISCHARGE SUMMARY (2 Pages)
     ------------------------------------------------------------- */
  const progressItems = [
    { key: 'pain', label: 'Pain Reduced' },
    { key: 'rom', label: 'Range of Motion Improved' },
    { key: 'strength', label: 'Strength Improved' },
    { key: 'functional', label: 'Functional Activities Improved' },
    { key: 'posture', label: 'Posture Improved' },
    { key: 'balance', label: 'Balance / Coordination Improved' },
    { key: 'goals', label: 'Goals Achieved' },
  ];

  const followupItems = [
    { key: 'recur', label: 'Follow-up only if symptoms recur' },
    { key: 'review', label: 'Review after specified period' },
    { key: 'hep', label: 'Continue Home Exercise Program' },
    { key: 'maint', label: 'Maintenance Physiotherapy as required' },
  ];

  const dischargeStatuses = [
    { key: 'success', label: 'Successfully Discharged' },
    { key: 'request', label: 'Discharged on Patient Request' },
    { key: 'referred', label: 'Referred to Another Healthcare Professional' },
    { key: 'discontinued', label: 'Treatment Discontinued' },
  ];

  return (
    <div className="cert-discharge-container">
      <style jsx global>{certStyles}</style>

      {/* PAGE 1 */}
      <div className="cert-page cert-sheet print:break-after-page">
        {renderHeader()}

        <div className="cert-date-row">
          <strong>Date:</strong> {renderEditable('issueDate', data.issueDate || 'Today')}
        </div>

        <div className="cert-title-block">
          <h1 className="cert-main-title border-b-2 border-[#0284c7] pb-1.5 inline-block">
            PHYSIOTHERAPY DISCHARGE SUMMARY
          </h1>
        </div>

        <div className="cert-meta-table mt-4">
          <div className="cert-meta-row">
            <span className="cert-meta-label">Patient Name:</span>
            <span className="cert-meta-val">{renderEditable('patientName', 'Patient Name')}</span>
          </div>
          <div className="cert-meta-row">
            <span className="cert-meta-label">Age / Gender:</span>
            <span className="cert-meta-val">
              {data.age ? `${renderEditable('age', data.age, 'Age')} Yrs` : '—'} / {renderEditable('gender', data.gender || '—', 'Gender')}
            </span>
          </div>
          <div className="cert-meta-row">
            <span className="cert-meta-label">Diagnosis:</span>
            <span className="cert-meta-val">{renderEditable('diagnosis', 'Frozen Shoulder (Adhesive Capsulitis)')}</span>
          </div>
          <div className="cert-meta-row">
            <span className="cert-meta-label">Date of Initial Assessment:</span>
            <span className="cert-meta-val">{renderEditable('startDate', '10 Aug 2026')}</span>
          </div>
          <div className="cert-meta-row">
            <span className="cert-meta-label">Date of Discharge:</span>
            <span className="cert-meta-val">{renderEditable('endDate', '10 Sept 2026')}</span>
          </div>
          <div className="cert-meta-row">
            <span className="cert-meta-label">Total Sessions Attended:</span>
            <span className="cert-meta-val">{renderEditable('sessions', '12 Sessions')}</span>
          </div>
        </div>

        <div className="cert-section-block mt-4">
          <h2 className="cert-section-title">Presenting Complaints</h2>
          <div className="cert-lines-area">
            {renderEditable(
              'complaints',
              'Severe shoulder pain (VAS 8/10), sleep disturbance, restricted overhead reach, inability to perform self-care.'
            )}
          </div>
        </div>

        <div className="cert-section-block mt-4">
          <h2 className="cert-section-title">Assessment Findings</h2>
          <div className="cert-lines-area">
            {renderEditable(
              'findings',
              'Initial assessment revealed significant capsular restriction, active abduction limited to 70°, external rotation limited to 20°.'
            )}
          </div>
        </div>

        <div className="cert-section-block mt-4">
          <h2 className="cert-section-title">Treatment Provided</h2>
          <ul className="cert-treatment-list text-[9pt] text-slate-800 space-y-1">
            <li>• Physiotherapy Assessment</li>
            <li>• Manual Therapy</li>
            <li>• Therapeutic Exercises</li>
            <li>• Electrotherapy Modalities (if applicable)</li>
            <li>• Patient Education &amp; Home Exercise Program</li>
            <li>
              • Other:{' '}
              {renderEditable(
                'otherTreatment',
                'Craniosacral therapy balancing & myofascial trigger release'
              )}
            </li>
          </ul>
        </div>
      </div>

      {/* PAGE 2 */}
      <div className="cert-page cert-sheet mt-8 print:mt-0 print:break-before-page">
        {/* Running Header on Page 2 */}
        <div className="cert-page2-header flex items-center justify-between pb-2 border-b border-slate-300 mb-5 text-[8pt] text-slate-500">
          <div>
            <strong className="text-[#0284c7]">HEALTH 360</strong> Health 360 Physiotherapy &amp; Craniosacral Therapy Clinic
          </div>
          <div>PHYSIOTHERAPY DISCHARGE SUMMARY · Page 2</div>
        </div>

        <div className="cert-section-block">
          <h2 className="cert-section-title">Progress Achieved</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 my-2">
            {progressItems.map((item) => {
              const checked = data.progressOptions?.[item.key] ?? true;
              return (
                <div
                  key={item.key}
                  className="cert-checkbox-item flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => handleCheckboxChange('progressOptions', item.key)}
                >
                  <div className={`cert-checkbox-box ${checked ? 'checked' : ''}`}>
                    {checked ? '✓' : ''}
                  </div>
                  <span className="text-[9pt] text-slate-800">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cert-section-block mt-4">
          <h2 className="cert-section-title">Outcome at Discharge</h2>
          <div className="cert-lines-area">
            {renderEditable(
              'outcome',
              'Full active range of motion restored (Abduction 170°, ER 75°), pain decreased from VAS 8/10 to 1/10. Functional independence achieved.'
            )}
          </div>
        </div>

        <div className="cert-section-block mt-4">
          <h2 className="cert-section-title">Home Exercise Program / Advice</h2>
          <div className="cert-lines-area">
            {renderEditable(
              'homeAdvice',
              'Continue shoulder pendular swings, wand stretches, and rotator cuff strengthening exercises with light band 3 times per week.'
            )}
          </div>
        </div>

        <div className="cert-section-block mt-4">
          <h2 className="cert-section-title">Precautions / Restrictions (if any)</h2>
          <div className="cert-lines-area">
            {renderEditable(
              'precautions',
              'Avoid sudden jerky overhead jerks or lifting weights exceeding 12 kg without adequate warm-up.'
            )}
          </div>
        </div>

        <div className="cert-section-block mt-4">
          <h2 className="cert-section-title">Follow-up Recommendations</h2>
          <div className="space-y-1.5 my-2">
            {followupItems.map((item) => {
              const checked = !!data.followupOptions?.[item.key];
              return (
                <div
                  key={item.key}
                  className="cert-checkbox-item flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => handleCheckboxChange('followupOptions', item.key)}
                >
                  <div className={`cert-checkbox-box ${checked ? 'checked' : ''}`}>
                    {checked ? '✓' : ''}
                  </div>
                  <span className="text-[9pt] text-slate-800">
                    {item.key === 'review' ? (
                      <span>
                        Review after {renderEditable('reviewWeeks', '4 weeks', 'e.g. 4 weeks')} if needed
                      </span>
                    ) : (
                      item.label
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cert-section-block mt-4">
          <h2 className="cert-section-title">Discharge Status</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 my-2">
            {dischargeStatuses.map((item) => {
              const checked = data.dischargeStatusOptions
                ? !!data.dischargeStatusOptions[item.key]
                : item.key === 'success';
              return (
                <div
                  key={item.key}
                  className="cert-checkbox-item flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => handleCheckboxChange('dischargeStatusOptions', item.key)}
                >
                  <div className={`cert-checkbox-box ${checked ? 'checked' : ''}`}>
                    {checked ? '✓' : ''}
                  </div>
                  <span className="text-[9pt] text-slate-800">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cert-section-block mt-4">
          <h2 className="cert-section-title">Remarks:</h2>
          <div className="cert-lines-area">
            {renderEditable(
              'remarks',
              'Patient was compliant with therapy sessions and achieved excellent functional recovery. Advised to maintain active lifestyle.'
            )}
          </div>
        </div>

        {renderSignatory()}
      </div>
    </div>
  );
}

/* ============================================================
   PIXEL-PERFECT CERTIFICATE STYLES (SCREEN & PRINT)
   ============================================================ */
const certStyles = `
/* A4 Page container */
.cert-page {
  background: #ffffff !important;
  color: #0f172a !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 9.5pt;
  line-height: 1.45;
  width: 210mm;
  min-height: 297mm;
  padding: 15mm 16mm 15mm 16mm;
  margin: 0 auto;
  box-sizing: border-box;
  position: relative;
  border-radius: 4px;
}

.cert-sheet {
  background: #ffffff;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

/* Header */
.cert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 4mm;
  border-bottom: 2px solid #0284c7;
  margin-bottom: 4mm;
}

.cert-header-left {
  display: flex;
  align-items: center;
  max-width: 55%;
}

.cert-logo {
  height: 84px;
  width: auto;
  max-width: 280px;
  object-fit: contain;
}

.cert-header-right {
  text-align: right;
  max-width: 40%;
}

.cert-doc-name {
  font-size: 10.5pt;
  font-weight: 800;
  color: #0f172a;
}

.cert-doc-creds {
  font-size: 7.5pt;
  font-weight: 700;
  color: #0369a1;
  line-height: 1.25;
}

.cert-contact-item {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  font-size: 7pt;
  color: #334155;
  line-height: 1.35;
}

.cert-icon-badge {
  font-size: 8pt;
  line-height: 1;
}

/* Date Row */
.cert-date-row {
  font-size: 9pt;
  color: #334155;
  margin-bottom: 4mm;
}

/* Title Block */
.cert-title-block {
  text-align: center;
  margin-bottom: 6mm;
}

.cert-main-title {
  font-size: 12pt;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f172a;
  margin: 0;
}

.cert-subtitle {
  font-size: 8.5pt;
  font-style: italic;
  color: #64748b;
  margin-top: 1.5mm;
}

/* Body Content */
.cert-body-content {
  color: #1e293b;
  font-size: 9.5pt;
}

.cert-paragraph {
  margin-bottom: 3.5mm;
  text-align: justify;
}

/* Bullet Details */
.cert-details-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4mm 5mm;
  margin: 4mm 0;
}

.cert-bullet-list {
  list-style: none;
  padding: 0;
  margin: 0;
  space-y: 2mm;
}

.cert-bullet-list li {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 9.2pt;
  margin-bottom: 1.8mm;
}

.cert-list-label {
  font-weight: 600;
  color: #334155;
  min-width: 68mm;
}

.cert-list-value {
  color: #0f172a;
  flex: 1;
}

/* Checkboxes */
.cert-checkbox-box {
  width: 14px;
  height: 14px;
  border: 1.5px solid #0284c7;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: #0284c7;
  background: #ffffff;
  flex-shrink: 0;
  margin-top: 2px;
}

.cert-checkbox-box.checked {
  background: #e0f2fe;
}

/* Meta Table for Discharge */
.cert-meta-table {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4mm;
}

.cert-meta-row {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  padding: 2mm 3.5mm;
  font-size: 9pt;
}

.cert-meta-row:last-child {
  border-bottom: none;
}

.cert-meta-label {
  width: 48mm;
  font-weight: 700;
  color: #475569;
}

.cert-meta-val {
  flex: 1;
  color: #0f172a;
  font-weight: 600;
}

/* Section Title */
.cert-section-title {
  font-size: 9.5pt;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 1.5mm;
}

/* Lines area for remarks / complaints */
.cert-lines-area {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  padding: 2.5mm 3.5mm;
  font-size: 9pt;
  color: #334155;
  min-height: 28px;
}

/* Editable highlight styling */
.cert-editable-field {
  background: rgba(2, 132, 199, 0.08);
  border-bottom: 1.5px dashed #0284c7;
  padding: 0 4px;
  border-radius: 3px;
  cursor: text;
  outline: none;
  display: inline-block;
  min-width: 24px;
  color: #0f172a;
  transition: all 0.15s ease-in-out;
}

.cert-editable-field:hover {
  background: rgba(2, 132, 199, 0.16);
  border-bottom-color: #0369a1;
}

.cert-editable-field:focus {
  background: #f0fdf4;
  border-bottom: 2px solid #16a34a;
  box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.2);
  color: #14532d;
}

/* Signatory */
.cert-signatory-block {
  margin-top: 8mm;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
}

.cert-sincerely {
  font-size: 9pt;
  color: #475569;
  margin-bottom: 2mm;
}

.cert-sign-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}

.cert-signature-img {
  height: 16mm;
  width: auto;
  max-width: 50mm;
  object-fit: contain;
  margin-bottom: -3mm;
  pointer-events: none;
  user-select: none;
}

.cert-sign-line {
  width: 55mm;
  border-top: 1.5px solid #0f172a;
}

.cert-sign-doc-name {
  font-size: 9pt;
  font-weight: 800;
  color: #0f172a;
  margin-top: 1.5mm;
}

.cert-sign-clinic-name {
  font-size: 7.5pt;
  color: #64748b;
}

.cert-stamp-container {
  margin-top: 2mm;
}

.cert-stamp-img {
  height: 11mm;
  width: auto;
  max-width: 46mm;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

/* Print Rules */
@media print {
  html, body {
    background: #ffffff !important;
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .cert-page {
    box-shadow: none !important;
    padding: 10mm 12mm 10mm 12mm !important;
    width: 100% !important;
    min-height: auto !important;
    margin: 0 !important;
  }
  .cert-logo {
    height: 22mm !important;
    max-width: 75mm !important;
    object-fit: contain !important;
  }
  .cert-editable-field {
    background: transparent !important;
    border-bottom: none !important;
    padding: 0 !important;
  }
  .cert-lines-area {
    border: none !important;
    background: transparent !important;
    padding: 0 !important;
  }
  .cert-details-box {
    border: 1px solid #cbd5e1 !important;
    background: #ffffff !important;
  }
  .cert-checkbox-box {
    border-color: #000000 !important;
  }
  .cert-signature-img {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    display: block !important;
  }
  .print\\:break-after-page {
    page-break-after: always !important;
    break-after: page !important;
  }
  .print\\:break-before-page {
    page-break-before: always !important;
    break-before: page !important;
  }
}
`;
