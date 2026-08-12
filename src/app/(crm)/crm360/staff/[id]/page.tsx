'use client';

import React, { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, FileText, UploadCloud, Trash2, Download, AlertCircle,
  AlertTriangle, CheckCircle2, Shield, Calendar, Clock, User, Briefcase,
  Activity, Check, X, Plus, Eye
} from 'lucide-react';

const REQUIRED_DOCS = [
  { key: 'CV / Resume', label: 'CV / Resume', description: 'Single file (PDF/DOC/DOCX)' },
  { key: 'Certificates', label: 'Certificates', description: 'Degree & Registration certificates' },
  { key: 'IAP Certificate', label: 'IAP Certificate', description: 'Single file (PDF/Image)' },
  { key: 'MSOTPT', label: 'MSOTPT', description: 'Single file (PDF/Image)' },
  { key: 'Aadhaar', label: 'Aadhaar Card Copy', description: 'Single file (PDF/Image)' }
];

export default function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: staffId } = use(params);
  const router = useRouter();
  
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'employment' | 'activity'>('overview');

  // Document action state
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [certName, setCertName] = useState<string>('');
  const [certDate, setCertDate] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats / Activity feed mock/data
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchStaffProfile();
  }, [staffId]);

  const fetchStaffProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/${staffId}`);
      if (res.status === 403) {
        setError('Forbidden. You do not have permission to view this staff member’s profile.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to load staff profile');
      const data = await res.json();
      setStaff(data);
      
      // Populate activities based on joinedDate and document uploads
      const list: any[] = [];
      if (data.joinedDate) {
        list.push({
          id: 'joined',
          type: 'system',
          title: 'Joined Health 360',
          time: new Date(data.joinedDate).toLocaleDateString('en-IN'),
          description: 'Employee profile was activated in CRM'
        });
      }
      
      // Document upload activities
      if (data.documents) {
        data.documents.forEach((doc: any) => {
          list.push({
            id: doc.id,
            type: 'doc',
            title: `Document Uploaded: ${doc.documentType}`,
            time: new Date(doc.uploadedAt).toLocaleDateString('en-IN'),
            description: `${doc.fileName} uploaded by ${doc.uploadedBy}`
          });
        });
      }

      setActivities(list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));

    } catch (err: any) {
      setError(err.message || 'Error fetching staff profile');
    } finally {
      setLoading(false);
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDocumentAction = (docType: string) => {
    setUploadingDocType(docType);
    setCertName('');
    setCertDate('');
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocType) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      setUploadingDocType(null);
      return;
    }

    try {
      const fileUrl = await fileToDataUrl(file);
      
      // Determine request body parameters
      const payload: any = {
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        documentType: uploadingDocType === 'Certificates' ? 'Certificate' : uploadingDocType
      };

      if (uploadingDocType === 'Certificates') {
        payload.notes = certName || 'Registration Certificate';
        if (certDate) payload.issueDate = certDate;
      }

      const res = await fetch(`/api/staff/${staffId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to upload document');
      }

      // Reset file input & refresh profile
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadingDocType(null);
      fetchStaffProfile();
    } catch (err: any) {
      alert(err.message || 'Error uploading document');
      setUploadingDocType(null);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/staff/${staffId}/documents?documentId=${docId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchStaffProfile();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete document');
      }
    } catch (e) {
      console.error('Error deleting document:', e);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-40 bg-white/5 animate-pulse rounded-lg" />
        <div className="h-64 bg-white/[0.03] border border-white/10 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'Staff member not found'}</span>
        </div>
        <Link href="/crm360/settings" className="text-xs text-[#12D6C4] underline">
          Return to Clinic Settings
        </Link>
      </div>
    );
  }

  // Find status details for each doc type
  const getDocStatus = (docType: string) => {
    const info = staff.documentStatus?.find((d: any) => d.documentType === docType);
    return info || { status: 'missing', documents: [], count: 0 };
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 selection:bg-[#12D6C4]/30 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
            <Link href="/crm360/settings" className="hover:text-white flex items-center gap-1 transition">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-7 h-7 text-[#12D6C4]" />
            Employee Dashboard
          </h1>
        </div>

        {/* Status Indicator / Active Toggle */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-xl border ${
            staff.isActive 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
              : 'bg-white/5 text-white/40 border-white/10'
          }`}>
            {staff.isActive ? 'Active Employee' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative">
          {staff.profilePhotoUrl ? (
            <img 
              src={staff.profilePhotoUrl} 
              alt={staff.fullName || staff.username} 
              className="w-24 h-24 rounded-2xl object-cover border border-white/10"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-[#12D6C4]/15 border border-[#12D6C4]/30 flex items-center justify-center font-bold text-[#12D6C4] text-2xl">
              {(staff.fullName || staff.username).substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div>
            <h2 className="text-xl font-bold text-white">{staff.fullName || staff.username}</h2>
            <p className="text-xs text-[#12D6C4] font-semibold">{staff.designation || 'Clinic Staff'} · {staff.department || 'N/A'}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-white/60 pt-2">
            <div>
              <span className="text-white/30 block text-[10px] uppercase font-bold">Email</span>
              <span>{staff.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-white/30 block text-[10px] uppercase font-bold">Mobile</span>
              <span>{staff.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-white/30 block text-[10px] uppercase font-bold">Employee ID</span>
              <span className="font-mono text-white">{staff.employeeId || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto">
        {(['overview', 'documents', 'employment', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition shrink-0 ${
              activeTab === tab
                ? 'border-[#12D6C4] text-[#12D6C4]'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        
        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Metrics */}
            <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0B0A10]/60 border border-white/10 rounded-2xl p-5 space-y-1 shadow-md">
                  <span className="text-white/40 text-[10px] uppercase font-bold">Attendance Records</span>
                  <p className="text-2xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#12D6C4]" />
                    {staff.stats?.attendanceCount || 0}
                  </p>
                </div>
                <div className="bg-[#0B0A10]/60 border border-white/10 rounded-2xl p-5 space-y-1 shadow-md">
                  <span className="text-white/40 text-[10px] uppercase font-bold">Assigned Appointments</span>
                  <p className="text-2xl font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    {staff.stats?.appointmentCount || 0}
                  </p>
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#12D6C4]" /> Personal Profile Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-white/40 block mb-0.5">Date of Birth</span>
                    <span className="text-white font-semibold">
                      {staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block mb-0.5">Aadhaar Number (Masked)</span>
                    <span className="text-white font-mono tracking-wider font-semibold">
                      {staff.aadhaarMasked || 'Not Provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block mb-0.5">Username</span>
                    <span className="text-white/70 font-mono">{staff.username}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block mb-0.5">Role Authorization</span>
                    <span className="text-[#12D6C4] font-bold">{staff.role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Vault Summary Widget */}
            <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                <span>Document Status</span>
                <span className="text-[10px] text-white/40">Required: 4</span>
              </h3>
              
              <div className="space-y-3">
                {REQUIRED_DOCS.map((docDef) => {
                  const statusInfo = getDocStatus(docDef.key);
                  return (
                    <div key={docDef.key} className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-white">{docDef.label}</p>
                        <p className="text-[10px] text-white/40">{docDef.description}</p>
                      </div>
                      
                      {statusInfo.status === 'uploaded' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Uploaded
                        </span>
                      ) : statusInfo.status === 'expired' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 animate-pulse">
                          <AlertCircle className="w-3 h-3" /> Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> Missing
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── DOCUMENTS TAB ─── */}
        {activeTab === 'documents' && (
          <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileChange}
            />

            {/* Special certificate creation modal logic built-in to the file change */}
            {uploadingDocType === 'Certificates' && (
              <div className="p-4 bg-[#12D6C4]/10 border-b border-[#12D6C4]/20 flex flex-col sm:flex-row gap-3 items-center">
                <span className="text-xs font-bold text-[#12D6C4] shrink-0">Add Certificate Details First:</span>
                <input 
                  type="text" 
                  placeholder="Certificate Name (e.g. BPTh Degree)" 
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#12D6C4]"
                />
                <input 
                  type="date" 
                  value={certDate}
                  onChange={(e) => setCertDate(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#12D6C4]"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!certName}
                    className="px-3 py-1 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-lg disabled:opacity-50"
                  >
                    Select File
                  </button>
                  <button 
                    onClick={() => setUploadingDocType(null)}
                    className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/10 text-white/50 font-bold">
                    <th className="p-4">Document Category</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Files</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/70">
                  {REQUIRED_DOCS.map((docDef) => {
                    const statusInfo = getDocStatus(docDef.key);
                    return (
                      <tr key={docDef.key} className="hover:bg-white/[0.01]">
                        {/* Name */}
                        <td className="p-4">
                          <span className="font-bold text-white block">{docDef.label}</span>
                          <span className="text-[10px] text-white/40">{docDef.description}</span>
                        </td>

                        {/* Status Indicator */}
                        <td className="p-4">
                          {statusInfo.status === 'uploaded' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Uploaded
                            </span>
                          ) : statusInfo.status === 'expired' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                              <AlertCircle className="w-3 h-3" /> Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" /> Missing
                            </span>
                          )}
                        </td>

                        {/* Uploaded Files list */}
                        <td className="p-4">
                          {statusInfo.documents.length === 0 ? (
                            <span className="text-white/30 italic">No files</span>
                          ) : (
                            <div className="space-y-1.5 max-w-xs">
                              {statusInfo.documents.map((doc: any) => (
                                <div key={doc.id} className="flex items-center justify-between gap-3 p-1.5 bg-white/5 border border-white/5 rounded-lg">
                                  <span className="truncate font-mono text-[10px] text-[#12D6C4]" title={doc.fileName}>
                                    {doc.notes ? `${doc.notes}: ` : ''}{doc.fileName}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="text-rose-400 hover:text-rose-300 shrink-0"
                                    title="Delete File"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {statusInfo.documents.length > 0 && (
                              <a
                                href={statusInfo.documents[0].fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition inline-flex items-center gap-1 font-semibold"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#12D6C4]" /> View
                              </a>
                            )}
                            
                            <button
                              onClick={() => handleDocumentAction(docDef.key)}
                              className="px-3 py-2 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase transition flex items-center gap-1"
                            >
                              <UploadCloud className="w-3.5 h-3.5" /> 
                              {docDef.key === 'Certificates' ? 'Add' : statusInfo.documents.length > 0 ? 'Replace' : 'Upload'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── EMPLOYMENT TAB ─── */}
        {activeTab === 'employment' && (
          <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#12D6C4]" /> Employment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs text-white/70">
              <div>
                <span className="text-white/40 block mb-0.5">Employee ID</span>
                <span className="text-white font-mono text-sm font-bold">{staff.employeeId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">Date of Joining</span>
                <span className="text-white font-semibold">
                  {staff.joinedDate ? new Date(staff.joinedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">Employment Type</span>
                <span className="text-[#12D6C4] font-semibold">{staff.employmentType || 'Full-Time'}</span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">Designation</span>
                <span className="text-white font-semibold">{staff.designation || 'N/A'}</span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">Department</span>
                <span className="text-white font-semibold">{staff.department || 'N/A'}</span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">CRM Auth Role</span>
                <span className="text-white font-semibold uppercase">{staff.role}</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── ACTIVITY TAB ─── */}
        {activeTab === 'activity' && (
          <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#12D6C4]" /> Activity History log
            </h3>

            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/30">
                No recent activity records.
              </div>
            ) : (
              <div className="relative border-l border-white/10 pl-6 ml-3 space-y-6">
                {activities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[30px] top-0.5 w-3 h-3 rounded-full bg-[#12D6C4] border border-[#0B0A10]" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-xs font-bold text-white">{act.title}</h4>
                        <span className="text-[10px] font-mono text-white/40">{act.time}</span>
                      </div>
                      <p className="text-xs text-white/50">{act.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
