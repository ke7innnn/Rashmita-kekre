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

  return (
    <section className="booking-page-section h360-booking">
      <div className="xpad booking-page-wrapper">
        
        {/* Back Link */}
        <a href="/" className="booking-back-link" onClick={(e) => { e.preventDefault(); onClose(); }}>
          <ArrowLeft size={16} /> Back to home
        </a>

        <div className="booking-page-container">
          {!isConfirmed ? (
            <div className="h360-form-wrap">
              <div className="h360-banner">
                <div className="h360-banner-icon">
                  <Calendar size={20} />
                </div>
                <h2>Book your assessment</h2>
                <p>Select a day and time that works best for you.</p>
              </div>

              <div className="h360-body">
                <div className="h360-left">
                  <div className="h360-block-head">
                    <h3>Date</h3>
                    <span className="h360-date-label">
                      {selectedDate
                        ? `${selectedDate.getTime() === new Date().setHours(0,0,0,0) ? "Today, " : ""}${selectedDate.toLocaleDateString("en-IN", { month: "long", day: "numeric" })}`
                        : ""}
                    </span>
                  </div>
                  
                  <div className="h360-days">
                    {days.map((d, index) => {
                      const isClosed = HOURS[d.getDay()].closed;
                      const isSelected = selectedDate && dateKey(selectedDate) === dateKey(d);
                      const isToday = index === 0;
                      
                      return (
                        <button
                          key={index}
                          type="button"
                          className={`h360-day ${isClosed ? 'h360-day-closed' : ''} ${isSelected ? 'h360-day-selected' : ''}`}
                          disabled={isClosed}
                          onClick={() => handleDaySelect(d)}
                        >
                          {isToday ? "Today" : HOURS[d.getDay()].name}
                        </button>
                      );
                    })}
                  </div>

                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 14px' }}>Time slot</h3>
                  <div className="h360-slot-groups">
                    {dayInfo && dayInfo.windows.map((win, winIdx) => {
                      const slots = [];
                      const startMin = toMinutes(win.start);
                      const endMin = toMinutes(win.end);
                      
                      for (let t = startMin; t < endMin; t += 30) {
                        slots.push(t);
                      }

                      return (
                        <div key={winIdx} className="h360-slot-group">
                          <p className="h360-slot-group-label">{win.label}</p>
                          <div className="h360-slots">
                            {slots.map((t, slotIdx) => {
                              const timeStr = pad(Math.floor(t / 60)) + ":" + pad(t % 60);
                              const displayTime = fmtTime(t);
                              const isBooked = bookedSlots.includes(timeStr);
                              const isSelected = selectedTime === timeStr;

                              return (
                                <div
                                  key={slotIdx}
                                  className={`h360-slot ${isBooked ? 'h360-slot-booked' : ''} ${isSelected ? 'h360-slot-selected' : ''}`}
                                  onClick={() => !isBooked && setSelectedTime(timeStr)}
                                >
                                  {displayTime}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="h360-legend">
                    <span className="h360-legend-item">
                      <span className="h360-legend-dot h360-dot-available"></span>Available
                    </span>
                    <span className="h360-legend-item">
                      <span className="h360-legend-dot h360-dot-selected"></span>Selected
                    </span>
                    <span className="h360-legend-item">
                      <span className="h360-legend-dot h360-dot-booked"></span>Booked
                    </span>
                  </div>
                </div>

                {/* Right Panel Patient Details */}
                <div className={`h360-right ${!selectedTime ? 'h360-locked' : ''}`}>
                  <h3>Patient details</h3>
                  <div className="h360-right-fields">
                    <div className={`h360-field ${nameError ? 'h360-field-error' : ''}`}>
                      <label htmlFor="h360Name">Full name</label>
                      <input
                        type="text"
                        id="h360Name"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (e.target.value.trim().length > 1) setNameError(false);
                        }}
                        autoComplete="name"
                      />
                      <p className="h360-error-text">Enter your name.</p>
                    </div>

                    <div className={`h360-field ${phoneError ? 'h360-field-error' : ''}`}>
                      <label htmlFor="h360Phone">Phone number</label>
                      <input
                        type="tel"
                        id="h360Phone"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          const phoneDigits = e.target.value.replace(/\D/g, "");
                          if (phoneDigits.length >= 10) setPhoneError(false);
                        }}
                        autoComplete="tel"
                      />
                      <p className="h360-error-text">Enter a valid phone number.</p>
                    </div>

                    <div className="h360-field">
                      <label htmlFor="h360Concern">Reason for visit</label>
                      <select
                        id="h360Concern"
                        value={concern}
                        onChange={(e) => setConcern(e.target.value)}
                      >
                        <option value="">Select one</option>
                        <option>Back pain</option>
                        <option>Neck and shoulder</option>
                        <option>Knee or joint</option>
                        <option>Sports injury</option>
                        <option>Post-surgery recovery</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <button className="h360-submit" type="button" onClick={handleSubmit}>
                      Confirm booking
                    </button>
                    <p className="h360-disclaimer">By booking, you agree to our cancellation policy.</p>
                  </div>
                  {!selectedTime && (
                    <p className="h360-lock-message">
                      Please select a time slot to continue with your booking.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h360-confirm h360-visible">
              <div className="h360-confirm-icon">
                <Check size={24} />
              </div>
              <h3>Assessment requested</h3>
              <p>Thanks — we've received your request. Our team will confirm your slot shortly.</p>
              
              <div className="h360-confirm-detail">
                <div>
                  <span>Date</span>
                  <span>
                    {selectedDate?.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </div>
                <div>
                  <span>Time</span>
                  <span>{selectedTime ? fmtTime(toMinutes(selectedTime)) : ""}</span>
                </div>
                <div>
                  <span>Name</span>
                  <span>{name}</span>
                </div>
                <div>
                  <span>Phone</span>
                  <span>{phone}</span>
                </div>
                {concern && (
                  <div>
                    <span>Reason</span>
                    <span>{concern}</span>
                  </div>
                )}
              </div>
              
              <button className="h360-submit" type="button" onClick={handleBookAnother}>
                Book another assessment
              </button>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
