'use client';

import { useState, useEffect } from 'react';
import { Calendar, Check, ArrowLeft } from 'lucide-react';
import './BookingModal.css';

interface BookingPageProps {
  onClose: () => void;
}

const HOURS: Record<number, { name: string; closed: boolean; windows: Array<{ label: string; start: string; end: string }> }> = {
  0: { name: "Sun", closed: true,  windows: [] },
  1: { name: "Mon", closed: false, windows: [ { label: "Morning", start: "09:00", end: "13:00" }, { label: "Evening", start: "19:00", end: "21:00" } ] },
  2: { name: "Tue", closed: false, windows: [ { label: "Morning", start: "09:00", end: "13:00" }, { label: "Evening", start: "17:00", end: "21:00" } ] },
  3: { name: "Wed", closed: false, windows: [ { label: "Morning", start: "09:00", end: "13:00" }, { label: "Evening", start: "17:00", end: "21:00" } ] },
  4: { name: "Thu", closed: false, windows: [ { label: "Morning", start: "09:00", end: "13:00" }, { label: "Evening", start: "17:00", end: "21:00" } ] },
  5: { name: "Fri", closed: false, windows: [ { label: "Morning", start: "09:00", end: "13:00" }, { label: "Evening", start: "17:00", end: "21:00" } ] },
  6: { name: "Sat", closed: false, windows: [ { label: "Morning", start: "09:00", end: "13:00" }, { label: "Evening", start: "17:00", end: "21:00" } ] }
};

export default function BookingModal({ onClose }: BookingPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [concern, setConcern] = useState('');

  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

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

  const getBookedSlots = (dateKeyStr: string) => {
    const day = new Date(dateKeyStr).getDay();
    return day !== 0 ? ["09:30", "11:00", "12:00", "18:30"] : [];
  };

  const activeDayIndex = selectedDate ? selectedDate.getDay() : null;
  const dayInfo = activeDayIndex !== null ? HOURS[activeDayIndex] : null;
  const bookedSlots = selectedDate ? getBookedSlots(dateKey(selectedDate)) : [];

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

  const handleSubmit = () => {
    if (!validate()) return;
    setIsConfirmed(true);
  };

  const handleBookAnother = () => {
    setName('');
    setPhone('');
    setConcern('');
    setSelectedTime(null);
    setNameError(false);
    setPhoneError(false);
    setIsConfirmed(false);
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
      for (let t = startMin; t < endMin; t += 30) {
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

        <div className="booking-page-container">
          
          {/* Left Column: Premium Clinical Image */}
          <div className="booking-visual-column">
            <img 
              src="/physio_consultation.jpg" 
              alt="Clinical consultation and assessment session at HEALTH 360" 
              className="booking-visual-img"
            />
          </div>

          {/* Right Column: Title and Card */}
          <div className="booking-form-column">
            
            {!isConfirmed ? (
              <>
                {/* Section Header */}
                <div className="booking-section-header">
                  <p className="subtitle uppercase">Book a consultation with our Vasai clinical team today.</p>
                  <h2 className="booking-section-title">Let's start your recovery journey</h2>
                  <p className="booking-section-desc">
                    Ready to reclaim your strength? Choose a date and time slot below to schedule your personalized physiotherapy assessment.
                  </p>
                </div>

                {/* Single Booking Card */}
                <div className="booking-card glass">
                  <h3 className="booking-card-title">Book an appointment</h3>
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

                    <div className="booking-slots-grid">
                      {getAllSlotsForDay().map((t, idx) => {
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
                          />
                          <p className="booking-field-error-text">Enter a valid 10-digit phone number.</p>
                        </div>

                        <div className="booking-field-group">
                          <label className="booking-field-label" htmlFor="h360Concern">Reason for visit</label>
                          <select
                            id="h360Concern"
                            value={concern}
                            onChange={(e) => setConcern(e.target.value)}
                            className="booking-pill-select"
                          >
                            <option value="">Select concern type</option>
                            <option>Back pain</option>
                            <option>Neck and shoulder</option>
                            <option>Knee or joint</option>
                            <option>Sports injury</option>
                            <option>Post-surgery recovery</option>
                            <option>Other</option>
                          </select>
                        </div>

                        <button className="booking-submit-black" type="button" onClick={handleSubmit}>
                          Submit Booking Request
                        </button>
                        
                        <p className="booking-disclaimer">
                          By booking, you agree to HEALTH 360 clinic guidelines.
                        </p>
                      </div>
                    )}
                  </div>

                </div>
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
