'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import './ReferralForm.css';

const CRM_API_URL = process.env.NEXT_PUBLIC_CRM_API_URL || 'http://localhost:3002';

const initialState = {
  date: '',
  referringPerson: '',
  age: '',
  gender: '',
  cOf: '',
  additionalNotes: '',
  referringDrName: '',
  referringDrContact: '',
  referringDrClinicAddress: '',
};

export default function ReferralForm() {
  const [form, setForm] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${CRM_API_URL}/api/public/referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed');
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setForm(initialState);
    setSubmitted(false);
    setError('');
  }

  return (
    <section className="referral-page-section">
      <div className="xpad referral-wrapper">
        <a href="/" className="referral-back-link">
          <ArrowLeft size={16} /> Back to home
        </a>

        {!submitted ? (
          <div className="referral-card">
            {/* Letterhead */}
            <div className="referral-letterhead">
              <div>
                <h1 className="referral-clinic-name">Health 360</h1>
                <p className="referral-clinic-sub">
                  Physiotherapy &amp; Craniosacral Therapy Clinic
                </p>
              </div>
              <div className="referral-doctor-block">
                <p className="referral-doctor-name">Dr. Rashmita Karvir Kekre</p>
                <p>B.P.Th. (M.I.A.P.), BCST</p>
                <p>+91 84828 12859</p>
                <p>health360vasai@gmail.com</p>
                <p>Shop no. 1 &amp; 2, Shree Amardeep Enclave,</p>
                <p>Om Nagar, Vasai West</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="referral-form-body">
              <div className="referral-to-row">
                <p className="referral-to-text">
                  To, <span>Dr. Rashmita Karvir Kekre</span>
                </p>
                <label className="referral-date-label">
                  Date
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className="referral-input referral-date-input"
                    disabled={submitting}
                  />
                </label>
              </div>

              {/* Patient details */}
              <fieldset className="referral-fieldset">
                <legend className="referral-legend">Patient Details</legend>

                <div className="referral-field-group">
                  <label className="referral-field-label">
                    Referring Mr./Mrs./Miss (Patient name)
                  </label>
                  <input
                    type="text"
                    name="referringPerson"
                    value={form.referringPerson}
                    onChange={handleChange}
                    required
                    className="referral-input"
                    placeholder="Patient full name"
                    disabled={submitting}
                  />
                </div>

                <div className="referral-field-row">
                  <div className="referral-field-group">
                    <label className="referral-field-label">Age</label>
                    <input
                      type="number"
                      name="age"
                      min="0"
                      value={form.age}
                      onChange={handleChange}
                      required
                      className="referral-input"
                      placeholder="Age"
                      disabled={submitting}
                    />
                  </div>
                  <div className="referral-field-group">
                    <label className="referral-field-label">Gender</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      required
                      className="referral-input referral-select"
                      disabled={submitting}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="referral-field-group">
                  <label className="referral-field-label">With C/O (Complaint of)</label>
                  <input
                    type="text"
                    name="cOf"
                    value={form.cOf}
                    onChange={handleChange}
                    required
                    className="referral-input"
                    placeholder="e.g. Lower back pain, post-surgery knee"
                    disabled={submitting}
                  />
                </div>

                <div className="referral-field-group">
                  <label className="referral-field-label">Additional Notes</label>
                  <textarea
                    name="additionalNotes"
                    value={form.additionalNotes}
                    onChange={handleChange}
                    rows={3}
                    className="referral-input referral-textarea"
                    placeholder="Any relevant history, investigations, or precautions"
                    disabled={submitting}
                  />
                </div>
              </fieldset>

              <p className="referral-instruction">
                For Further Treatment, Management &amp; Rehabilitation Please do the Needful.
              </p>

              {/* Referring doctor */}
              <fieldset className="referral-fieldset referral-fieldset-boxed">
                <legend className="referral-legend">Referring Doctor</legend>

                <div className="referral-field-group">
                  <label className="referral-field-label">Name of Referring Dr.</label>
                  <input
                    type="text"
                    name="referringDrName"
                    value={form.referringDrName}
                    onChange={handleChange}
                    required
                    className="referral-input"
                    placeholder="Dr. Full Name"
                    disabled={submitting}
                  />
                </div>

                <div className="referral-field-group">
                  <label className="referral-field-label">Contact No.</label>
                  <input
                    type="tel"
                    name="referringDrContact"
                    value={form.referringDrContact}
                    onChange={handleChange}
                    required
                    className="referral-input"
                    placeholder="+91 XXXXX XXXXX"
                    disabled={submitting}
                  />
                </div>

                <div className="referral-field-group">
                  <label className="referral-field-label">Clinic Address</label>
                  <textarea
                    name="referringDrClinicAddress"
                    value={form.referringDrClinicAddress}
                    onChange={handleChange}
                    rows={2}
                    required
                    className="referral-input referral-textarea"
                    placeholder="Clinic name and address"
                    disabled={submitting}
                  />
                </div>
              </fieldset>

              {error && <p className="referral-error-text">{error}</p>}

              <button type="submit" className="referral-submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} style={{ marginRight: 8, display: 'inline' }} />
                    Submitting Referral...
                  </>
                ) : (
                  'Submit Referral'
                )}
              </button>
            </form>

            {/* Facilities */}
            <div className="referral-facilities">
              <h3 className="referral-facilities-title">Facilities Available</h3>
              <div className="referral-facilities-grid">
                <p>• Equipped With Latest Modalities</p>
                <p>• Manual Therapy Techniques</p>
                <p>• Joint Care</p>
                <p>• Neurological Rehabilitation</p>
                <p>• Spine Care</p>
                <p>• Special Packages &amp; Home Care Physiotherapy</p>
                <p>• Women's Health</p>
              </div>
            </div>
          </div>
        ) : (
          /* Confirmation */
          <div className="referral-confirm-card">
            <div className="referral-confirm-icon">
              <Check size={28} />
            </div>
            <h3>Referral Received</h3>
            <p>
              Thank you. The referral for{' '}
              <strong>{form.referringPerson || 'your patient'}</strong>{' '}
              has been submitted to Dr. Rashmita&apos;s clinic. Our reception team will reach out to
              coordinate the appointment.
            </p>
            <button type="button" className="referral-submit" onClick={handleReset}>
              Submit another referral
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
