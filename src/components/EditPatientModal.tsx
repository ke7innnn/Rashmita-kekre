'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save, UserCheck, AlertCircle } from 'lucide-react';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  onSuccess?: () => void;
}

const DEFAULT_DIAGNOSIS_OPTIONS = [
  'Low Back Pain',
  'Knee Osteoarthritis',
  'Cervical Spondylosis',
  'Shoulder Impingement',
  'Frozen Shoulder',
  'Sciatica / Lumbar Radiculopathy',
  'Post-Op Rehabilitation',
  'ACL Reconstruction / Injury',
  'Sports Injury & Recovery',
  'Muscle Strain / Sprain',
  'Ankle Sprain',
  'Tennis Elbow / Golfer\'s Elbow',
  'Stroke Rehabilitation',
  'Bell\'s Palsy / Facial Palsy',
  'General Musculoskeletal Pain',
  'Postural Dysfunction',
  'Ergonomic Strain',
  'Geriatric Care & Mobility'
];

const MODALITY_OPTIONS = [
  'Class IV High-Intensity Laser (HILT)',
  'Craniosacral Therapy (CST)',
  'Matrix Rhythm Therapy (MaRhyThe)',
  'Dry Needling & Cupping',
  'Manual Physical Therapy',
  'Pediatric Neuro-Physiotherapy',
  'Post-Op Knee/Hip Rehab',
  'General Electrotherapy & Ultrasound'
];

export default function EditPatientModal({
  isOpen,
  onClose,
  patient,
  onSuccess
}: EditPatientModalProps) {
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Female');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentModalityAssigned, setTreatmentModalityAssigned] = useState('');
  const [parentSpouseCaretakerName, setParentSpouseCaretakerName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [thirdPartyUid, setThirdPartyUid] = useState('');
  const [dateOfMarriage, setDateOfMarriage] = useState('');
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (patient) {
      setFullName(patient.fullName || '');
      setGender(patient.gender || 'Female');
      
      if (patient.dateOfBirth) {
        const d = new Date(patient.dateOfBirth);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          setDateOfBirth(`${yyyy}-${mm}-${dd}`);
          const age = new Date().getFullYear() - d.getFullYear();
          setAgeYears(age > 0 ? age.toString() : '');
        }
      } else {
        setDateOfBirth('');
        setAgeYears('');
      }

      setPhone(patient.phone || '');
      setSecondaryPhone(patient.secondaryPhone || '');
      setEmail(patient.email || '');
      setAddress(patient.address || '');
      setReferringDoctor(patient.referringDoctor || '');
      setDiagnosis(patient.diagnosis || patient.presentingComplaint || '');
      setTreatmentModalityAssigned(patient.treatmentModalityAssigned || '');
      setParentSpouseCaretakerName(patient.parentSpouseCaretakerName || '');
      setBloodGroup(patient.bloodGroup || '');
      setThirdPartyUid(patient.thirdPartyUid || '');

      if (patient.dateOfMarriage) {
        const dm = new Date(patient.dateOfMarriage);
        if (!isNaN(dm.getTime())) {
          const yyyy = dm.getFullYear();
          const mm = String(dm.getMonth() + 1).padStart(2, '0');
          const dd = String(dm.getDate()).padStart(2, '0');
          setDateOfMarriage(`${yyyy}-${mm}-${dd}`);
        }
      } else {
        setDateOfMarriage('');
      }

      setNotes(patient.notes || '');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [patient, isOpen]);

  const handleAgeChange = (years: string) => {
    setAgeYears(years);
    const yrs = parseInt(years, 10);
    if (!isNaN(yrs) && yrs >= 0) {
      const today = new Date();
      const dobYear = today.getFullYear() - yrs;
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setDateOfBirth(`${dobYear}-${mm}-${dd}`);
    }
  };

  const handleDobChange = (dobStr: string) => {
    setDateOfBirth(dobStr);
    if (dobStr) {
      const dob = new Date(dobStr);
      if (!isNaN(dob.getTime())) {
        const age = new Date().getFullYear() - dob.getFullYear();
        setAgeYears(age >= 0 ? age.toString() : '0');
      }
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update patient details');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient', patient.id] });
      setSuccessMsg('Patient details updated successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'An error occurred while updating patient.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Patient full name is required');
      return;
    }
    if (!phone.trim() || phone.length < 5) {
      setErrorMsg('A valid contact phone number is required');
      return;
    }

    const payload = {
      fullName: fullName.trim(),
      gender,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : new Date('1990-01-01').toISOString(),
      phone: phone.trim(),
      secondaryPhone: secondaryPhone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      referringDoctor: referringDoctor.trim() || null,
      diagnosis: diagnosis.trim() || null,
      presentingComplaint: diagnosis.trim() || null,
      treatmentModalityAssigned: treatmentModalityAssigned || null,
      parentSpouseCaretakerName: parentSpouseCaretakerName.trim() || null,
      bloodGroup: bloodGroup || null,
      thirdPartyUid: thirdPartyUid.trim() || null,
      dateOfMarriage: dateOfMarriage ? new Date(dateOfMarriage).toISOString() : null,
      notes: notes.trim() || null,
    };

    updateMutation.mutate(payload);
  };

  if (!isOpen || !patient) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-[#0F0D16] border border-white/20 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col z-[101] overflow-hidden text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
            <div>
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#12D6C4]" />
                Quick Edit Patient Details
              </h3>
              <p className="text-xxs text-white/50 font-medium mt-0.5">
                Update demographic info, contact numbers, or clinical diagnosis for {patient.fullName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <UserCheck className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Row 1: Full Name & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Anjali Sharma"
                  className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-[#12D6C4]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Gender <span className="text-rose-400">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full text-xs bg-[#0B0A10] border border-white/15 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-[#12D6C4]"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Row 2: Phone & Secondary Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Primary Mobile No. <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-mono font-semibold focus:outline-none focus:border-[#12D6C4]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Secondary Contact No. (Optional)
                </label>
                <input
                  type="text"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  placeholder="e.g. 9123456789"
                  className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-mono font-semibold focus:outline-none focus:border-[#12D6C4]"
                />
              </div>
            </div>

            {/* Row 3: DOB & Age */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-[#12D6C4]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Age (Years)
                </label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={ageYears}
                  onChange={(e) => handleAgeChange(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-[#12D6C4]"
                />
              </div>
            </div>

            {/* Row 4: Email & Referring Doctor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. patient@example.com"
                  className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-[#12D6C4]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Referring Doctor
                </label>
                <input
                  type="text"
                  value={referringDoctor}
                  onChange={(e) => setReferringDoctor(e.target.value)}
                  placeholder="e.g. Dr. Mehta / Self / Direct"
                  className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-[#12D6C4]"
                />
              </div>
            </div>

            {/* Row 5: Diagnosis & Assigned Modality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Primary Diagnosis / Condition
                </label>
                <input
                  type="text"
                  list="diagnosis-list"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Cervical Spondylosis / Low Back Pain"
                  className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-[#12D6C4]"
                />
                <datalist id="diagnosis-list">
                  {DEFAULT_DIAGNOSIS_OPTIONS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Assigned Treatment Modality
                </label>
                <select
                  value={treatmentModalityAssigned}
                  onChange={(e) => setTreatmentModalityAssigned(e.target.value)}
                  className="w-full text-xs bg-[#0B0A10] border border-white/15 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-[#12D6C4]"
                >
                  <option value="">Select Modality...</option>
                  {MODALITY_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 6: Caretaker, Blood Group, Third Party UID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Guardian / Caretaker
                </label>
                <input
                  type="text"
                  value={parentSpouseCaretakerName}
                  onChange={(e) => setParentSpouseCaretakerName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma (Spouse)"
                  className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-[#12D6C4]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full text-xs bg-[#0B0A10] border border-white/15 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-[#12D6C4]"
                >
                  <option value="">Select...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                  Third Party UID / UHID
                </label>
                <input
                  type="text"
                  value={thirdPartyUid}
                  onChange={(e) => setThirdPartyUid(e.target.value)}
                  placeholder="e.g. H360-9942"
                  className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-mono font-semibold focus:outline-none focus:border-[#12D6C4]"
                />
              </div>
            </div>

            {/* Row 7: Address */}
            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                Residential Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Flat 402, Sunshine Heights, Vasai West"
                className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-[#12D6C4]"
              />
            </div>

            {/* Row 8: Clinical Notes */}
            <div>
              <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1">
                Internal Case Notes & Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key observations, medical history, precautions..."
                className="w-full text-xs bg-white/[0.04] border border-white/15 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-[#12D6C4]"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-white/15 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-5 py-2.5 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl transition cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 text-black" />
                )}
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
