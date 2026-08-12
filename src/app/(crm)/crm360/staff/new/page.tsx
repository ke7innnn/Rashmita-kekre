'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, UserPlus, Camera, Upload, Plus, Trash2, Check, AlertCircle,
  FileText, Shield, Calendar, Briefcase, CreditCard, X, Copy
} from 'lucide-react';

const DEPARTMENTS = ['Physiotherapy', 'Reception', 'Administration', 'Craniosacral Therapy', 'Other'];
const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Intern'];
const DESIGNATIONS = ['Physiotherapist', 'Senior Physiotherapist', 'Receptionist', 'Admin', 'Intern', 'Other'];

interface CertificateEntry {
  id: string;
  name: string;
  file: File | null;
  date: string;
}

export default function AddEmployeePage() {
  const router = useRouter();
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const iapRef = useRef<HTMLInputElement>(null);
  const msotptRef = useRef<HTMLInputElement>(null);
  const aadhaarFileRef = useRef<HTMLInputElement>(null);

  // Employee details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [designation, setDesignation] = useState('Physiotherapist');
  const [department, setDepartment] = useState('Physiotherapy');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [role, setRole] = useState('PHYSIO');
  const [aadhaarNumber, setAadhaarNumber] = useState('');

  // File states
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [iapFile, setIapFile] = useState<File | null>(null);
  const [msotptFile, setMsotptFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<CertificateEntry[]>([]);

  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'details' | 'documents'>('details');
  const [successData, setSuccessData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyCredentials = () => {
    if (!successData) return;
    const text = `Hi ${successData.fullName},\n\nYour Health 360 CRM staff account has been created successfully.\n\nUsername: ${successData.username}\nPassword: ${successData.defaultPassword}\nLogin Link: ${window.location.origin}/crm360/login\n\nPlease login and change your password on first use.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile photo must be under 5MB');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const addCertificate = () => {
    setCertificates(prev => [...prev, {
      id: crypto.randomUUID(),
      name: '',
      file: null,
      date: ''
    }]);
  };

  const updateCertificate = (id: string, field: string, value: any) => {
    setCertificates(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const removeCertificate = (id: string) => {
    setCertificates(prev => prev.filter(c => c.id !== id));
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const formatAadhaar = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 12);
    const parts = [];
    for (let i = 0; i < digits.length; i += 4) {
      parts.push(digits.slice(i, i + 4));
    }
    return parts.join(' ');
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadhaarNumber(raw);
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Step 1: Create the employee
      const employeePayload: any = {
        mode: 'direct',
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        employeeId: employeeId.trim() || undefined,
        joinedDate: joinedDate || undefined,
        designation,
        department,
        employmentType,
        role,
        aadhaarNumber: aadhaarNumber || undefined,
        profilePhotoUrl: profilePhotoPreview || undefined
      };

      const createRes = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeePayload)
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || 'Failed to create employee');
      }

      const createData = await createRes.json();
      const userId = createData.user.id;

      // Step 2: Upload documents
      const documentUploads: Promise<any>[] = [];

      // CV
      if (cvFile) {
        const dataUrl = await fileToDataUrl(cvFile);
        documentUploads.push(
          fetch(`/api/staff/${userId}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: cvFile.name,
              fileUrl: dataUrl,
              fileSize: cvFile.size,
              mimeType: cvFile.type,
              documentType: 'CV / Resume'
            })
          })
        );
      }

      // IAP Certificate
      if (iapFile) {
        const dataUrl = await fileToDataUrl(iapFile);
        documentUploads.push(
          fetch(`/api/staff/${userId}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: iapFile.name,
              fileUrl: dataUrl,
              fileSize: iapFile.size,
              mimeType: iapFile.type,
              documentType: 'IAP Certificate'
            })
          })
        );
      }

      // MSOTPT
      if (msotptFile) {
        const dataUrl = await fileToDataUrl(msotptFile);
        documentUploads.push(
          fetch(`/api/staff/${userId}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: msotptFile.name,
              fileUrl: dataUrl,
              fileSize: msotptFile.size,
              mimeType: msotptFile.type,
              documentType: 'MSOTPT'
            })
          })
        );
      }

      // Aadhaar
      if (aadhaarFile) {
        const dataUrl = await fileToDataUrl(aadhaarFile);
        documentUploads.push(
          fetch(`/api/staff/${userId}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: aadhaarFile.name,
              fileUrl: dataUrl,
              fileSize: aadhaarFile.size,
              mimeType: aadhaarFile.type,
              documentType: 'Aadhaar'
            })
          })
        );
      }

      // Certificates
      for (const cert of certificates) {
        if (cert.file && cert.name) {
          const dataUrl = await fileToDataUrl(cert.file);
          documentUploads.push(
            fetch(`/api/staff/${userId}/documents`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: cert.file.name,
                fileUrl: dataUrl,
                fileSize: cert.file.size,
                mimeType: cert.file.type,
                documentType: 'Certificate',
                notes: cert.name,
                issueDate: cert.date || null
              })
            })
          );
        }
      }

      if (documentUploads.length > 0) {
        await Promise.all(documentUploads);
      }

      setSuccessData({
        userId,
        username: createData.generatedUsername,
        defaultPassword: createData.defaultPassword,
        fullName: fullName.trim()
      });

    } catch (err: any) {
      setError(err.message || 'Error creating employee');
    } finally {
      setSaving(false);
    }
  };

  // ─── Success Screen ───
  if (successData) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0F0D16] border border-white/10 rounded-2xl p-8 space-y-6 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{successData.fullName}</h2>
            <p className="text-xs text-white/50 mt-1">Employee added successfully</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3 text-left">
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Auto-Generated Username</span>
              <p className="text-sm font-mono text-[#12D6C4] mt-0.5">{successData.username}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Default Password</span>
              <p className="text-sm font-mono text-amber-300 mt-0.5">{successData.defaultPassword}</p>
            </div>
            <p className="text-[10px] text-white/30 pt-1 border-t border-white/5">
              Share these credentials securely. The employee should change their password on first login.
            </p>
          </div>

          <button
            onClick={handleCopyCredentials}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied Shareable Info!' : 'Copy Shareable Login Info'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/crm360/staff/${successData.userId}`)}
              className="flex-1 py-3 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              View Profile
            </button>
            <button
              onClick={() => router.push('/crm360/settings')}
              className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 transition"
            >
              Back to Staff
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 selection:bg-[#12D6C4]/30 select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
          <Link href="/crm360/settings" className="hover:text-white flex items-center gap-1 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
          </Link>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <UserPlus className="w-7 h-7 text-[#12D6C4]" />
          Add New Employee
        </h1>
        <p className="text-xs text-white/40 mt-1">Create a staff account with all required details and documents</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setStep('details')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            step === 'details'
              ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)]'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" /> 1. Employee Details
        </button>
        <div className="w-8 h-px bg-white/10" />
        <button
          onClick={() => {
            if (!fullName.trim()) {
              setError('Please fill in the employee name first');
              return;
            }
            setStep('documents');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
            step === 'documents'
              ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)]'
              : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> 2. Documents
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-white/10 rounded-lg">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ─── STEP 1: Employee Details ─── */}
      {step === 'details' && (
        <div className="space-y-6">
          {/* Profile Photo + Name Row */}
          <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#12D6C4]" /> Personal Information
            </h3>

            <div className="flex items-start gap-6">
              {/* Photo Upload */}
              <div className="shrink-0">
                <div
                  onClick={() => profilePhotoRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/15 hover:border-[#12D6C4]/50 flex items-center justify-center cursor-pointer transition overflow-hidden bg-white/[0.02] group"
                >
                  {profilePhotoPreview ? (
                    <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center space-y-1">
                      <Camera className="w-6 h-6 text-white/20 group-hover:text-[#12D6C4]/60 mx-auto transition" />
                      <span className="text-[9px] text-white/30">Photo</span>
                    </div>
                  )}
                </div>
                <input ref={profilePhotoRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
              </div>

              {/* Name + Phone + Email */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-white/70 mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Pritee Yadav"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#12D6C4] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#12D6C4] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. pritee@health360.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#12D6C4] transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#12D6C4]" /> Employment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#12D6C4] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. H360-005"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#12D6C4] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={joinedDate}
                  onChange={(e) => setJoinedDate(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#12D6C4] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Designation / Role</label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#12D6C4] transition"
                >
                  {DESIGNATIONS.map(d => (
                    <option key={d} value={d} className="bg-[#0F0D16] text-white">{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#12D6C4] transition"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d} className="bg-[#0F0D16] text-white">{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#12D6C4] transition"
                >
                  {EMPLOYMENT_TYPES.map(t => (
                    <option key={t} value={t} className="bg-[#0F0D16] text-white">{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Aadhaar Card */}
          <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#12D6C4]" /> Aadhaar Details
            </h3>
            <div className="max-w-sm">
              <label className="block text-xs font-semibold text-white/70 mb-1">Aadhaar Number</label>
              <input
                type="text"
                placeholder="XXXX XXXX XXXX"
                value={formatAadhaar(aadhaarNumber)}
                onChange={handleAadhaarChange}
                maxLength={14}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#12D6C4] transition font-mono tracking-wider"
              />
              <p className="text-[10px] text-white/30 mt-1.5">
                <Shield className="w-3 h-3 inline mr-1 text-[#12D6C4]/50" />
                Stored securely. Displayed as XXXX-XXXX-{aadhaarNumber.slice(-4) || '****'} in the CRM.
              </p>
            </div>
          </div>

          {/* Next Button */}
          <div className="flex justify-end gap-3">
            <Link
              href="/crm360/settings"
              className="px-6 py-3 rounded-xl border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 transition"
            >
              Cancel
            </Link>
            <button
              onClick={() => {
                if (!fullName.trim()) {
                  setError('Full name is required');
                  return;
                }
                setError(null);
                setStep('documents');
              }}
              className="px-8 py-3 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2"
            >
              Next: Documents <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: Documents ─── */}
      {step === 'documents' && (
        <div className="space-y-6">
          {/* CV / Resume */}
          <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#12D6C4]" /> CV / Resume
            </h3>
            <p className="text-[11px] text-white/40">Single file · PDF / DOC / DOCX</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => cvRef.current?.click()}
                className="px-4 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-[#12D6C4]/50 bg-white/[0.02] text-xs text-white/50 hover:text-[#12D6C4] transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> {cvFile ? 'Replace File' : 'Upload CV'}
              </button>
              {cvFile && (
                <span className="text-xs text-[#12D6C4] font-mono flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" /> {cvFile.name}
                  <button onClick={() => setCvFile(null)} className="p-1 hover:bg-white/10 rounded-lg">
                    <X className="w-3 h-3 text-white/40" />
                  </button>
                </span>
              )}
              <input ref={cvRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) setCvFile(e.target.files[0]);
              }} />
            </div>
          </div>

          {/* Certificates */}
          <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#12D6C4]" /> Certificates
                </h3>
                <p className="text-[11px] text-white/40 mt-0.5">Unlimited uploads · Add name and optional date for each</p>
              </div>
              <button
                onClick={addCertificate}
                className="px-3 py-1.5 rounded-xl bg-[#12D6C4]/15 border border-[#12D6C4]/30 text-xs font-bold text-[#12D6C4] hover:bg-[#12D6C4]/25 transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Certificate
              </button>
            </div>

            {certificates.length === 0 ? (
              <div className="p-6 text-center text-xs text-white/30 border border-dashed border-white/10 rounded-xl">
                No certificates added yet. Click &quot;Add Certificate&quot; to start.
              </div>
            ) : (
              <div className="space-y-3">
                {certificates.map((cert, idx) => (
                  <div key={cert.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white/40">Certificate #{idx + 1}</span>
                      <button
                        onClick={() => removeCertificate(cert.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-white/50 mb-1">Certificate Name</label>
                        <input
                          type="text"
                          placeholder="e.g. BPTh Degree"
                          value={cert.name}
                          onChange={(e) => updateCertificate(cert.id, 'name', e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#12D6C4]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-white/50 mb-1">Certificate Date (optional)</label>
                        <input
                          type="date"
                          value={cert.date}
                          onChange={(e) => updateCertificate(cert.id, 'date', e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#12D6C4]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-white/50 mb-1">Certificate File</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              if (e.target.files?.[0]) updateCertificate(cert.id, 'file', e.target.files[0]);
                            }}
                            className="w-full text-[11px] text-white/50 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#12D6C4]/15 file:text-[#12D6C4] hover:file:bg-[#12D6C4]/25"
                          />
                        </div>
                        {cert.file && (
                          <p className="text-[10px] text-[#12D6C4] mt-1 truncate"><Check className="w-3 h-3 inline mr-1" />{cert.file.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* IAP Certificate */}
          <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" /> IAP Certificate
            </h3>
            <p className="text-[11px] text-white/40">Single file · PDF / Image</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => iapRef.current?.click()}
                className="px-4 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-amber-400/50 bg-white/[0.02] text-xs text-white/50 hover:text-amber-300 transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> {iapFile ? 'Replace File' : 'Upload IAP'}
              </button>
              {iapFile && (
                <span className="text-xs text-amber-300 font-mono flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" /> {iapFile.name}
                  <button onClick={() => setIapFile(null)} className="p-1 hover:bg-white/10 rounded-lg">
                    <X className="w-3 h-3 text-white/40" />
                  </button>
                </span>
              )}
              <input ref={iapRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) setIapFile(e.target.files[0]);
              }} />
            </div>
          </div>

          {/* MSOTPT */}
          <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#12D6C4]" /> MSOTPT
            </h3>
            <p className="text-[11px] text-white/40">Single file · PDF / Image</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => msotptRef.current?.click()}
                className="px-4 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-[#12D6C4]/50 bg-white/[0.02] text-xs text-white/50 hover:text-[#12D6C4] transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> {msotptFile ? 'Replace File' : 'Upload MSOTPT'}
              </button>
              {msotptFile && (
                <span className="text-xs text-[#12D6C4] font-mono flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" /> {msotptFile.name}
                  <button onClick={() => setMsotptFile(null)} className="p-1 hover:bg-white/10 rounded-lg">
                    <X className="w-3 h-3 text-white/40" />
                  </button>
                </span>
              )}
              <input ref={msotptRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) setMsotptFile(e.target.files[0]);
              }} />
            </div>
          </div>

          {/* Aadhaar Document */}
          <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" /> Aadhaar Card Copy
            </h3>
            <p className="text-[11px] text-white/40">Single file · PDF / Image · Number entered in Step 1 will be masked</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => aadhaarFileRef.current?.click()}
                className="px-4 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-purple-400/50 bg-white/[0.02] text-xs text-white/50 hover:text-purple-300 transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" /> {aadhaarFile ? 'Replace File' : 'Upload Aadhaar'}
              </button>
              {aadhaarFile && (
                <span className="text-xs text-purple-300 font-mono flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" /> {aadhaarFile.name}
                  <button onClick={() => setAadhaarFile(null)} className="p-1 hover:bg-white/10 rounded-lg">
                    <X className="w-3 h-3 text-white/40" />
                  </button>
                </span>
              )}
              <input ref={aadhaarFileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) setAadhaarFile(e.target.files[0]);
              }} />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep('details')}
              className="px-6 py-3 rounded-xl border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 transition flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Details
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-10 py-3 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating Employee...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Create Employee
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
