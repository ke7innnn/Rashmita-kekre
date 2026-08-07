import { useState, useEffect } from 'react';
import { Calendar, Check, ArrowLeft, Loader2, Phone, MessageCircle, Sparkles, ShieldCheck, MapPin, UserCheck, Zap } from 'lucide-react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import './BookingModal.css';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

interface BookingPageProps {
  onClose: () => void;
}

const HOURS: Record<number, { name: string; closed: boolean; windows: Array<{ label: string; start: string; end: string }> }> = {
  0: { name: "Sun", closed: true,  windows: [] },
  1: { name: "Mon", closed: false, windows: [ { label: "Morning", start: "10:00", end: "14:00" }, { label: "Evening", start: "17:00", end: "21:00" } ] },
  2: { name: "Tue", closed: false, windows: [ { label: "Morning", start: "10:00", end: "14:00" }, { label: "Evening", start: "17:00", end: "21:00" } ] },
  3: { name: "Wed", closed: false, windows: [ { label: "Morning", start: "10:00", end: "14:00" }, { label: "Evening", start: "17:00", end: "21:00" } ] },
  4: { name: "Thu", closed: false, windows: [ { label: "Morning", start: "10:00", end: "14:00" }, { label: "Evening", start: "17:00", end: "21:00" } ] },
  5: { name: "Fri", closed: false, windows: [ { label: "Morning", start: "10:00", end: "14:00" }, { label: "Evening", start: "17:00", end: "21:00" } ] },
  6: { name: "Sat", closed: false, windows: [ { label: "Morning", start: "10:00", end: "14:00" }, { label: "Evening", start: "17:00", end: "21:00" } ] }
};

const CRM_API_URL = process.env.NEXT_PUBLIC_CRM_API_URL || '';

export default function BookingModal({ onClose }: BookingPageProps) {
  const [activeServiceTab, setActiveServiceTab] = useState<'physio' | 'craniosacral'>('physio');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Female');
  const [age, setAge] = useState('35');
  const [concern, setConcern] = useState('');

  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // CRM Integration States
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDateClosed, setIsDateClosed] = useState(false);
  const [dateClosedReason, setDateClosedReason] = useState<string>('');

  // OTP & Firebase States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const getDaysStrip = () => {
    const daysList = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      daysList.push(d);
    }
    return daysList;
  };

  const days = getDaysStrip();

  useEffect(() => {
    const firstOpen = days.find(d => !HOURS[d.getDay()].closed);
    if (firstOpen) {
      setSelectedDate(firstOpen);
      setSelectedTime(null);
    }
    setName('');
    setPhone('');
    setConcern('');
    setNameError(false);
    setPhoneError(false);
    setIsConfirmed(false);
  }, []);

  const pad = (n: number) => n < 10 ? "0" + n : "" + n;

  const toMinutes = (hhmm: string) => {
    const parts = hhmm.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const fmtTime = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return pad(h12) + ":" + pad(m) + " " + ampm;
  };

  const dateKey = (d: Date) => {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  };

  useEffect(() => {
    if (!selectedDate) return;

    const fetchBookedSlots = async () => {
      setIsLoadingSlots(true);
      setIsDateClosed(false);
      setDateClosedReason('');
      try {
        const formattedDate = dateKey(selectedDate);
        const res = await fetch(`${CRM_API_URL}/api/public/book?date=${formattedDate}`);
        if (!res.ok) throw new Error('Failed to fetch booked slots');
        const data = await res.json();
        
        if (data.isHoliday) {
          setIsDateClosed(true);
          setDateClosedReason(data.isSunday ? 'The clinic is closed on Sundays.' : 'The clinic is closed on this date.');
          const allSlots = getAllSlotsForDay().map(t => pad(Math.floor(t / 60)) + ":" + pad(t % 60));
          setBookedSlots(allSlots);
        } else if (Array.isArray(data.bookedSlots)) {
          setBookedSlots(data.bookedSlots);
        } else {
          setBookedSlots([]);
        }
      } catch (err) {
        console.error('Error fetching booked slots:', err);
        setBookedSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchBookedSlots();
  }, [selectedDate]);

  const activeDayIndex = selectedDate ? selectedDate.getDay() : null;
  const dayInfo = activeDayIndex !== null ? HOURS[activeDayIndex] : null;

  const handleDaySelect = (d: Date) => {
    setSelectedDate(d);
    setSelectedTime(null);
  };

  const validate = () => {
    const nameOk = name.trim().length > 1;
    const phoneDigits = phone.replace(/\D/g, "");
    const phoneOk = phoneDigits.length >= 10;

    setNameError(!nameOk);
    setPhoneError(!phoneOk);

    return nameOk && phoneOk && !!selectedTime;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      if (!otpSent) {
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        if (cleanPhone.length < 10) throw new Error('Please enter a valid 10-digit phone number.');
        const formattedPhone = `+91${cleanPhone}`;

        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {},
          });
        }

        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
        setConfirmationResult(confirmation);
        setOtpSent(true);
      } else {
        if (!confirmationResult) {
          throw new Error('Session expired. Please click Send OTP again.');
        }
        if (otp.length !== 6) {
          throw new Error('Please enter a valid 6-digit OTP.');
        }

        await confirmationResult.confirm(otp);

        const parsedAge = parseInt(age, 10);
        const calculatedDob = !isNaN(parsedAge) && parsedAge > 0
          ? `${new Date().getFullYear() - parsedAge}-01-01`
          : '1990-01-01';

        const payload = {
          fullName: name,
          phone: phone.replace(/\D/g, '').slice(-10),
          gender: gender || 'Female',
          dateOfBirth: calculatedDob,
          date: dateKey(selectedDate!),
          startTime: selectedTime,
          treatmentType: activeServiceTab === 'craniosacral' ? 'Craniosacral Therapy (CST)' : (concern || 'Physiotherapy Consultation'),
          presentingComplaint: concern || 'Online Booking Intake',
          diagnosis: concern || '',
          notes: `Inbound online booking request. Diagnosis/Reason: ${concern || 'Not specified'}. Age: ${age || 'N/A'}. Gender: ${gender}`,
        };

        const res = await fetch(`${CRM_API_URL}/api/public/book`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to submit booking request.');
        }

        if (data.success) {
          setIsConfirmed(true);
        } else {
          throw new Error(data.error || 'Failed to confirm booking.');
        }
      }
    } catch (error: any) {
      console.error('Firebase OTP error:', error);
      if (error.code === 'auth/invalid-phone-number') {
        setApiError('Invalid phone number format.');
      } else if (error.code === 'auth/invalid-verification-code') {
        setApiError('Invalid OTP entered. Please check and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setApiError('Too many attempts. Please try again later.');
      } else {
        setApiError(error.message || 'An error occurred while sending OTP.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookAnother = () => {
    setName('');
    setPhone('');
    setConcern('');
    setSelectedTime(null);
    setNameError(false);
    setPhoneError(false);
    setIsConfirmed(false);
    setApiError(null);
    const firstOpen = days.find(d => !HOURS[d.getDay()].closed);
    if (firstOpen) {
      setSelectedDate(firstOpen);
    }
  };

  const getAllSlotsForDay = () => {
    if (!dayInfo) return [];
    const slots: number[] = [];
    dayInfo.windows.forEach(win => {
      const startMin = toMinutes(win.start);
      const endMin = toMinutes(win.end);
      for (let t = startMin; t < endMin; t += 15) {
        slots.push(t);
      }
    });
    return slots;
  };

  return (
    <section className="booking-page-section h360-booking">
      <div className="xpad booking-page-wrapper">
        
        {/* Back Link */}
        <a href="/" className="booking-back-link" onClick={(e) => { e.preventDefault(); onClose(); }}>
          <ArrowLeft size={16} /> Back to home
        </a>

        {!isConfirmed && (
          <div className="booking-section-header">
            <p className="subtitle uppercase">Book a consultation with our Vasai clinical team today.</p>
            <h2 className="booking-section-title">Let's start your recovery journey</h2>
            <p className="booking-section-desc">
              Select your clinical service below. Online calendar slots are available for Physiotherapy assessments, while Craniosacral Therapy sessions are booked directly through our clinic desk.
            </p>
          </div>
        )}

        <div className="booking-page-container">
          
          {/* Left Column: Serene Tropical Leaves Image */}
          <div className="booking-visual-column">
            <img 
              src="/booking_leaves.jpg" 
              alt="Serene tropical leaves wellness background at HEALTH 360" 
              className="booking-visual-img"
            />
          </div>

          {/* Right Column: Title and Card */}
          <div className="booking-form-column">
            
            {!isConfirmed ? (
              <>
                {/* Service Selection Tab Switcher */}
                <div className="service-tab-switcher">
                  <button
                    type="button"
                    className={`service-tab-btn ${activeServiceTab === 'physio' ? 'active' : ''}`}
                    onClick={() => setActiveServiceTab('physio')}
                  >
                    <Calendar size={16} />
                    <span>Physiotherapy Booking</span>
                  </button>
                  <button
                    type="button"
                    className={`service-tab-btn ${activeServiceTab === 'craniosacral' ? 'active' : ''}`}
                    onClick={() => setActiveServiceTab('craniosacral')}
                  >
                    <Sparkles size={16} />
                    <span>Craniosacral Therapy (BCST)</span>
                  </button>
                </div>

                {activeServiceTab === 'physio' ? (
                  /* Single Booking Card for Physiotherapy */
                  <div className="booking-card glass">
                    <h3 className="booking-card-title">Book a Physiotherapy Appointment</h3>
                    <div className="booking-card-divider" />

                  {/* Date Selector */}
                  <div className="booking-card-section">
                    <div className="booking-card-section-header">
                      <span className="section-label">Select Date</span>
                      <span className="section-value">
                        {selectedDate
                          ? selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
                          : ""}
                      </span>
                    </div>

                    <div className="booking-days-strip">
                      {days.map((d, index) => {
                        const isClosed = HOURS[d.getDay()].closed;
                        const isSelected = selectedDate && dateKey(selectedDate) === dateKey(d);
                        const isToday = index === 0;
                        const weekday = HOURS[d.getDay()].name;
                        const subtext = isToday ? "Today" : d.getDate();

                        return (
                          <button
                            key={index}
                            type="button"
                            className={`booking-day-chip ${isClosed ? 'closed' : ''} ${isSelected ? 'selected' : ''}`}
                            disabled={isClosed}
                            onClick={() => handleDaySelect(d)}
                          >
                            <span className="chip-weekday">{weekday}</span>
                            <span className="chip-daynum">{subtext}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Selector */}
                  <div className="booking-card-section">
                    <div className="booking-card-section-header">
                      <span className="section-label">Select Time</span>
                      <span className="section-value">
                        {selectedTime ? fmtTime(toMinutes(selectedTime)) : "Choose a slot"}
                      </span>
                    </div>

                    {isLoadingSlots ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--h360-ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Loader2 className="animate-spin" size={18} /> Loading available slots...
                      </div>
                    ) : isDateClosed ? (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--h360-ink-soft)' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '12px', padding: '16px 24px' }}>
                          <span style={{ fontSize: '22px' }}>🚫</span>
                          <span style={{ fontWeight: 700, fontSize: '13px', color: '#cc3333' }}>{dateClosedReason}</span>
                          <span style={{ fontSize: '11px', color: '#888' }}>Please choose a different date above.</span>
                        </div>
                      </div>
                    ) : (() => {
                      const allSlots = getAllSlotsForDay();
                      const morningSlots = allSlots.filter((t) => t < 12 * 60);
                      const afternoonSlots = allSlots.filter((t) => t >= 12 * 60 && t < 16 * 60);
                      const eveningSlots = allSlots.filter((t) => t >= 16 * 60);

                      const renderSlotGroup = (title: string, slots: number[]) => {
                        if (slots.length === 0) return null;
                        return (
                          <div key={title} style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(43, 38, 32, 0.55)', marginBottom: '8px' }}>
                              {title}
                            </div>
                            <div className="booking-slots-grid">
                              {slots.map((t, idx) => {
                                const timeStr = pad(Math.floor(t / 60)) + ":" + pad(t % 60);
                                const displayTime = fmtTime(t);
                                const isBooked = bookedSlots.includes(timeStr);
                                const isSelected = selectedTime === timeStr;

                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    className={`booking-slot-chip ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                                    disabled={isBooked}
                                    onClick={() => setSelectedTime(timeStr)}
                                  >
                                    {displayTime}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {renderSlotGroup('🌅 Morning Slots', morningSlots)}
                          {renderSlotGroup('☀️ Afternoon Slots', afternoonSlots)}
                          {renderSlotGroup('🌙 Evening Slots', eveningSlots)}
                        </>
                      );
                    })()}
                  </div>

                  {/* Patient Details Unlock Form */}
                  <div className="booking-card-divider" />
                  
                  <div className="booking-patient-form">
                    {!selectedTime ? (
                      <p className="booking-select-prompt">
                        Please select a date and time slot above to unlock booking details.
                      </p>
                    ) : (
                      <div className="booking-inputs-container">
                        
                        <div className={`booking-field-group ${nameError ? 'error' : ''}`}>
                          <label className="booking-field-label" htmlFor="h360Name">Full Name</label>
                          <input
                            type="text"
                            id="h360Name"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              if (e.target.value.trim().length > 1) setNameError(false);
                            }}
                            className="booking-pill-input"
                            autoComplete="name"
                            disabled={isSubmitting}
                          />
                          <p className="booking-field-error-text">Enter your full name.</p>
                        </div>

                        <div className={`booking-field-group ${phoneError ? 'error' : ''}`}>
                          <label className="booking-field-label" htmlFor="h360Phone">Phone Number</label>
                          <input
                            type="tel"
                            id="h360Phone"
                            placeholder="+91 XXXXX XXXXX"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              const phoneDigits = e.target.value.replace(/\D/g, "");
                              if (phoneDigits.length >= 10) setPhoneError(false);
                            }}
                            className="booking-pill-input"
                            autoComplete="tel"
                            disabled={isSubmitting}
                          />
                          <p className="booking-field-error-text">Enter a valid 10-digit phone number.</p>
                        </div>

                        {/* Gender & Age Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          <div className="booking-field-group">
                            <label className="booking-field-label" htmlFor="h360Gender">Gender</label>
                            <select
                              id="h360Gender"
                              value={gender}
                              onChange={(e) => setGender(e.target.value)}
                              className="booking-pill-select"
                              disabled={isSubmitting}
                            >
                              <option value="Female">Female</option>
                              <option value="Male">Male</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div className="booking-field-group">
                            <label className="booking-field-label" htmlFor="h360Age">Age (Years)</label>
                            <input
                              type="number"
                              id="h360Age"
                              placeholder="E.g. 35"
                              value={age}
                              onChange={(e) => setAge(e.target.value)}
                              className="booking-pill-input"
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>

                        {/* Reason for Visit / Diagnosis Type */}
                        <div className="booking-field-group">
                          <label className="booking-field-label" htmlFor="h360Concern">Reason for Visit / Diagnosis Type</label>
                          <select
                            id="h360Concern"
                            value={concern}
                            onChange={(e) => setConcern(e.target.value)}
                            className="booking-pill-select"
                            disabled={isSubmitting}
                          >
                            <option value="">Select concern / diagnosis type</option>
                            <option value="Low Back Pain">Low Back Pain</option>
                            <option value="Knee Osteoarthritis">Knee Osteoarthritis / Joint Pain</option>
                            <option value="Cervical Spondylosis">Cervical Spondylosis / Neck & Shoulder</option>
                            <option value="Shoulder Impingement">Shoulder Impingement / Frozen Shoulder</option>
                            <option value="Sciatica">Sciatica / Disc Herniation</option>
                            <option value="Post-Op Rehab">Post-Surgery Recovery</option>
                            <option value="Sports Injury">Sports Injury & Rehab</option>
                            <option value="Craniosacral Therapy (CST)">Craniosacral Therapy (CST)</option>
                            <option value="General Pain & Wellness">General Pain & Wellness</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {otpSent && (
                          <div className="booking-field-group" style={{ marginTop: '16px' }}>
                            <label className="booking-field-label" htmlFor="h360Otp">Enter 6-digit OTP</label>
                            <input
                              type="text"
                              id="h360Otp"
                              value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="booking-pill-input"
                              placeholder="123456"
                              autoComplete="one-time-code"
                              disabled={isSubmitting}
                              maxLength={6}
                            />
                            <p className="booking-field-error-text" style={{ display: otp.length > 0 && otp.length < 6 ? 'block' : 'none' }}>
                              OTP must be 6 digits.
                            </p>
                          </div>
                        )}

                        <div id="recaptcha-container"></div>

                        <button 
                          className="booking-submit-black" 
                          type="button" 
                          onClick={handleSubmit}
                          disabled={isSubmitting || (otpSent && otp.length !== 6)}
                          style={{ marginTop: otpSent ? '24px' : '32px' }}
                        >
                          {isSubmitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <Loader2 className="animate-spin" size={18} />
                              {otpSent ? 'Confirming...' : 'Sending OTP...'}
                            </span>
                          ) : (
                            otpSent ? 'Verify & Confirm Booking' : 'Send OTP'
                          )}
                        </button>
                        
                        {apiError && (
                          <p className="booking-field-error-text" style={{ display: 'block', textAlign: 'center', marginTop: '10px' }}>
                            {apiError}
                          </p>
                        )}
                        
                      </div>
                    )}
                  </div>

                </div>
                ) : (
                  /* Craniosacral Therapy (BCST) Specialized Card (NO Calendar, Direct Clinic CTAs Only) */
                  <div className="cst-booking-card glass">
                    <div className="cst-card-header">
                      <span className="cst-badge">
                        <Sparkles size={12} />
                        SPECIALIZED CLINICAL THERAPY
                      </span>
                      <h3 className="cst-card-title">Biodynamic Craniosacral Therapy (BCST)</h3>
                      <p className="cst-card-subtitle">
                        A gentle, non-invasive hands-on therapy that calms the central nervous system, releases deep structural tensions, and restores natural body vitality.
                      </p>
                    </div>

                    <div className="cst-divider" />

                    <div className="cst-notice-box">
                      <UserCheck size={20} className="cst-notice-icon" />
                      <div>
                        <h4 className="cst-notice-title">Direct Practitioner Consultation Only</h4>
                        <p className="cst-notice-desc">
                          Because Biodynamic Craniosacral Therapy (BCST) sessions require individual clinical evaluation and 60-minute hands-on slotting, booking is handled directly through Dr. Rashmita's clinical desk rather than automated calendar slots.
                        </p>
                      </div>
                    </div>

                    <div className="cst-highlights-grid">
                      <div className="cst-highlight-item">
                        <div className="cst-highlight-icon">🧠</div>
                        <div>
                          <h5 className="cst-highlight-head">Nervous System Release</h5>
                          <p className="cst-highlight-body">Calms autonomic stress, chronic fatigue, and trauma patterns.</p>
                        </div>
                      </div>
                      <div className="cst-highlight-item">
                        <div className="cst-highlight-icon">💆</div>
                        <div>
                          <h5 className="cst-highlight-head">Migraine & Spinal Realignment</h5>
                          <p className="cst-highlight-body">Gentle release of cranial, spinal, and sacral fascial restrictions.</p>
                        </div>
                      </div>
                      <div className="cst-highlight-item">
                        <div className="cst-highlight-icon">🌿</div>
                        <div>
                          <h5 className="cst-highlight-head">60-Min Practitioner Session</h5>
                          <p className="cst-highlight-body">Personalized hands-on care by Dr. Rashmita Karvir-Kekre (PT, BCST).</p>
                        </div>
                      </div>
                    </div>

                    <div className="cst-cta-section">
                      <p className="cst-cta-prompt">To reserve your Craniosacral Therapy assessment, contact our Vasai clinic desk directly:</p>
                      
                      <div className="cst-cta-buttons">
                        <a href="tel:+919833333333" className="cst-primary-btn">
                          <Phone size={16} />
                          Call Desk: +91 98333 33333
                        </a>

                        <a 
                          href="https://wa.me/919833333333?text=Hi%20Dr.%20Rashmita,%20I%20would%20like%20to%20inquire%20about%20a%20Biodynamic%20Craniosacral%20Therapy%20(BCST)%20session%20at%20HEALTH%20360." 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="cst-secondary-btn"
                        >
                          <MessageCircle size={18} />
                          Inquire on WhatsApp
                        </a>
                      </div>

                      <div className="cst-clinic-location">
                        <MapPin size={14} />
                        <span>HEALTH 360 Clinic • Om Nagar, Vasai West, Maharashtra 401202</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Confirmation Box */
              <div className="booking-confirm-card glass rounded-l">
                <div className="booking-confirm-icon">
                  <Check size={28} />
                </div>
                <h3>Assessment Requested</h3>
                <p>We've received your request! A clinical specialist will reach out to confirm your appointment within 12 hours.</p>
                
                <div className="booking-confirm-details">
                  <div className="confirm-detail-row">
                    <span className="row-title">Date</span>
                    <span className="row-value">
                      {selectedDate?.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                  </div>
                  <div className="confirm-detail-row">
                    <span className="row-title">Time</span>
                    <span className="row-value">{selectedTime ? fmtTime(toMinutes(selectedTime)) : ""}</span>
                  </div>
                  <div className="confirm-detail-row">
                    <span className="row-title">Patient</span>
                    <span className="row-value">{name}</span>
                  </div>
                  <div className="confirm-detail-row">
                    <span className="row-title">Contact</span>
                    <span className="row-value">{phone}</span>
                  </div>
                  {concern && (
                    <div className="confirm-detail-row">
                      <span className="row-title">Reason</span>
                      <span className="row-value">{concern}</span>
                    </div>
                  )}
                </div>
                
                <button className="booking-submit-black" type="button" onClick={handleBookAnother}>
                  Book Another Assessment
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
