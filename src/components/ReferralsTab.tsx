'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserCheck, Phone, ChevronRight, Loader2, Network, 
  Search, FileText, CheckCircle, Mail, MapPin, Building2, CheckSquare,
  Plus, X, UserPlus, ArrowLeftRight
} from 'lucide-react';
import CreatePatientModal from './CreatePatientModal';
import GlassPanel from './GlassPanel';

interface Props {
  onViewPatient: (patientId: string) => void;
}

export default function ReferralsTab({ onViewPatient }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  // Manual Doctor Creation Modal States
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('Orthopedics');
  const [docClinic, setDocClinic] = useState('');
  const [docEmail, setDocEmail] = useState('');

  // Manual Patient Assignment States
  const [isAssigningPatientToDoc, setIsAssigningPatientToDoc] = useState<string | null>(null); // doctor name
  const [patientSearch, setPatientSearch] = useState('');
  const [isCreatePatientModalOpen, setIsCreatePatientModalOpen] = useState(false);

  // State to hold manually added doctors from localStorage
  const [customDoctors, setCustomDoctors] = useState<any[]>([]);

  useEffect(() => {
    const list = localStorage.getItem('custom_referral_doctors');
    if (list) {
      try {
        setCustomDoctors(JSON.parse(list));
      } catch (e) {
        console.error('Error parsing custom doctors list:', e);
      }
    }
  }, []);

  // Fetch all patients to build the referrers mapping
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients-all'],
    queryFn: async () => {
      const res = await fetch('/api/patients');
      if (!res.ok) throw new Error('Failed to fetch patients');
      return res.json();
    }
  });

  // Assign patient to referring doctor mutation
  const assignReferralMutation = useMutation({
    mutationFn: async ({ id, referringDoctor }: { id: string; referringDoctor: string }) => {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referringDoctor })
      });
      if (!res.ok) throw new Error('Referral assignment failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients-all'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsAssigningPatientToDoc(null);
      setPatientSearch('');
    }
  });

  // Seed details for known referring doctors to look premium & professional
  const doctorMeta: { [name: string]: { specialty: string; clinic: string; email: string } } = {
    'Dr. Amit Sharma': { specialty: 'Orthopedics & Spine Surgery', clinic: 'Sharma Bone & Joint Clinic', email: 'sharma.ortho@email.com' },
    'Dr. Rajesh Patel': { specialty: 'Neurology & Rehabilitation', clinic: 'Patel Neuro Centre', email: 'patel.neuro@email.com' },
    'Dr. Priya Nair': { specialty: 'Rheumatology Specialists', clinic: 'Nair Rheumatism Clinic', email: 'priya.rheum@email.com' },
    'Dr. Vikram Malhotra': { specialty: 'Cardiology & Sports Injuries', clinic: 'Malhotra Sports Rehab', email: 'vikram.sports@email.com' }
  };

  const getDoctorMetadata = (name: string) => {
    if (doctorMeta[name]) return doctorMeta[name];
    
    const matched = customDoctors.find(d => d.name === name);
    if (matched) {
      return {
        specialty: matched.specialty,
        clinic: matched.clinic,
        email: matched.email
      };
    }

    return {
      specialty: 'General Practice & Intake',
      clinic: 'Local Clinic / Direct Booking',
      email: `${name.toLowerCase().replace(/\s+/g, '')}@email.com`
    };
  };

  // Group patients by referring doctor
  const docMap: { [name: string]: any } = {};

  customDoctors.forEach((doc) => {
    docMap[doc.name] = {
      name: doc.name,
      specialty: doc.specialty,
      clinic: doc.clinic,
      email: doc.email,
      patientsCount: 0,
      thankYouSentCount: 0,
      dischargeReportCount: 0,
      referredPatients: []
    };
  });

  patients.forEach((p: any) => {
    const docName = p.referringDoctor?.trim() || 'Self / Direct';
    
    if (!docMap[docName]) {
      const meta = getDoctorMetadata(docName);
      
      docMap[docName] = {
        name: docName,
        specialty: meta.specialty,
        clinic: meta.clinic,
        email: meta.email,
        patientsCount: 0,
        thankYouSentCount: 0,
        dischargeReportCount: 0,
        referredPatients: []
      };
    }

    docMap[docName].patientsCount += 1;
    docMap[docName].referredPatients.push(p);

    if (p.notes?.includes('Thank-You Note Sent') || p.notes?.includes('[x] Onboarding Thank-You')) {
      docMap[docName].thankYouSentCount += 1;
    }
    if (p.notes?.includes('Discharge Report Sent') || p.notes?.includes('[x] Onboarding Discharge')) {
      docMap[docName].dischargeReportCount += 1;
    }
  });

  // Filter referrers by search query
  const referrers = Object.values(docMap)
    .filter((ref: any) => 
      ref.name.toLowerCase().includes(search.toLowerCase()) || 
      ref.specialty.toLowerCase().includes(search.toLowerCase()) ||
      ref.clinic.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) => b.patientsCount - a.patientsCount);

  // General Metrics
  const totalReferred = patients.filter((p: any) => p.referringDoctor && p.referringDoctor !== 'Self / Direct').length;
  const activeReferrers = Object.keys(docMap).filter(k => k !== 'Self / Direct').length;
  
  const onboardingFinishedCount = patients.filter((p: any) => 
    p.referringDoctor && 
    p.referringDoctor !== 'Self / Direct' && 
    p.treatmentModalityAssigned
  ).length;
  const intakeOnboardingRate = totalReferred > 0 ? Math.round((onboardingFinishedCount / totalReferred) * 100) : 100;

  const topDocName = referrers.find((r: any) => r.name !== 'Self / Direct')?.name || 'Self / Direct';

  const handleAddDoctorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const formattedName = docName.startsWith('Dr.') ? docName.trim() : `Dr. ${docName.trim()}`;
    const newDoc = {
      name: formattedName,
      specialty: docSpecialty,
      clinic: docClinic.trim() || 'General Clinic',
      email: docEmail.trim() || `${formattedName.toLowerCase().replace(/[\s\.]+/g, '')}@email.com`
    };

    const updated = [...customDoctors.filter(d => d.name !== formattedName), newDoc];
    setCustomDoctors(updated);
    localStorage.setItem('custom_referral_doctors', JSON.stringify(updated));
    localStorage.setItem(`referral_doctor_metadata:${formattedName}`, JSON.stringify(newDoc));

    setDocName('');
    setDocClinic('');
    setDocEmail('');
    setIsAddDocOpen(false);
  };

  const assignablePatients = patients.filter((p: any) => {
    const query = patientSearch.toLowerCase();
    const matchesQuery = p.fullName.toLowerCase().includes(query) || p.phone.includes(query);
    const notAlreadyReferredByThisDoc = p.referringDoctor !== isAssigningPatientToDoc;
    return matchesQuery && notAlreadyReferredByThisDoc;
  });

  return (
    <div className="space-y-6 select-none relative">
      {/* Search & Actions Header */}
      <GlassPanel className="p-5 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div>
          <h3 className="text-2xl font-serif text-[#F5F3FA] font-bold">Referral Network</h3>
          <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium mt-0.5">Track patients referred by external doctors, follow conversion stats, and log onboarding notes.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(245,243,250,0.4)] stroke-[2]" />
            <input
              type="text"
              placeholder="Search referrers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-full md:w-56 text-xs glass-input font-medium placeholder-[rgba(245,243,250,0.4)]"
            />
          </div>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddDocOpen(true)}
            className="flex items-center gap-2 bg-[#12D6C4] hover:bg-[#0FBDAE] text-[#06231D] text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(18,214,196,0.3)] border-0 shrink-0"
          >
            <UserPlus className="h-4 w-4 stroke-[2.5]" />
            Add Doctor
          </motion.button>
        </div>
      </GlassPanel>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Referred */}
        <GlassPanel accent="teal" className="p-4.5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#12D6C4] shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow text-[9px] text-[rgba(245,243,250,0.45)]">Referred Patients</p>
            <h4 className="text-2xl font-serif font-bold num-tabular text-[#F5F3FA] mt-0.5">{totalReferred}</h4>
          </div>
        </GlassPanel>

        {/* Active Doctors */}
        <GlassPanel accent="magenta" className="p-4.5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#E23FA6] shrink-0">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow text-[9px] text-[rgba(245,243,250,0.45)]">Active Referrers</p>
            <h4 className="text-2xl font-serif font-bold num-tabular text-[#F5F3FA] mt-0.5">{activeReferrers}</h4>
          </div>
        </GlassPanel>

        {/* Conversion Rate */}
        <GlassPanel accent="teal" className="p-4.5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#19E3B1] shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="eyebrow text-[9px] text-[rgba(245,243,250,0.45)]">Intake Onboard Rate</p>
            <h4 className="text-2xl font-serif font-bold num-tabular text-[#19E3B1] mt-0.5">{intakeOnboardingRate}%</h4>
          </div>
        </GlassPanel>

        {/* Top Referrer */}
        <GlassPanel accent="violet" className="p-4.5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#7B5CFF] shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="truncate">
            <p className="eyebrow text-[9px] text-[rgba(245,243,250,0.45)]">Top Referrer</p>
            <h4 className="text-sm font-serif font-bold text-[#F5F3FA] truncate mt-1 leading-snug">{topDocName}</h4>
          </div>
        </GlassPanel>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="flex justify-center py-20 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-2xl">
          <Loader2 className="h-8 w-8 text-[#12D6C4] animate-spin" />
        </div>
      ) : referrers.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center py-20 text-center p-6 border-dashed">
          <Network className="h-10 w-10 text-[rgba(18,214,196,0.4)] mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-[rgba(245,243,250,0.62)]">No referring sources registered.</h4>
          <p className="text-xs text-[rgba(245,243,250,0.4)] mt-1 font-medium">Patients will be categorized under Direct Intake when no referring doctor is logged.</p>
        </GlassPanel>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {referrers.map((ref: any) => {
              const isDirect = ref.name === 'Self / Direct';
              const isExpanded = expandedDoc === ref.name;
              const convertedRate = ref.patientsCount > 0 
                ? Math.round((ref.referredPatients.filter((p: any) => p.treatmentModalityAssigned).length / ref.patientsCount) * 100)
                : 100;

              return (
                <GlassPanel 
                  key={ref.name}
                  accent={isExpanded ? 'teal' : 'none'}
                  className="rounded-3xl overflow-hidden transition-all duration-200"
                >
                  {/* Doctor Profile Banner */}
                  <div className="p-6 flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 truncate">
                        <h4 className="text-lg font-serif font-bold text-[#F5F3FA] truncate">
                          {ref.name}
                        </h4>
                        <p className="eyebrow text-[9px] text-[#12D6C4]">{ref.specialty}</p>
                      </div>
                      
                      {/* Referrer Patients Count Badge */}
                      <span className="bg-[rgba(18,214,196,0.12)] border border-[rgba(18,214,196,0.3)] text-[#12D6C4] text-[10px] font-bold px-3 py-1.5 rounded-xl num-tabular shrink-0">
                        {ref.patientsCount} {ref.patientsCount === 1 ? 'Patient' : 'Patients'}
                      </span>
                    </div>

                    {/* Clinic details info */}
                    <div className="space-y-2 text-xs font-medium text-[rgba(245,243,250,0.62)]">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-[#12D6C4] shrink-0 stroke-[1.75]" />
                        <span className="truncate">{ref.clinic}</span>
                      </div>
                      {!isDirect && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-[#12D6C4] shrink-0 stroke-[1.75]" />
                          <span className="truncate">{ref.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Onboarding progress meter */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center eyebrow text-[9px] mb-1.5">
                        <span>Intake Conversion</span>
                        <span className="num-tabular text-[#12D6C4]">{convertedRate}%</span>
                      </div>
                      <div className="h-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${convertedRate}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full bg-gradient-to-r from-[#12D6C4] to-[#7B5CFF] rounded-full"
                        />
                      </div>
                    </div>

                    {/* Onboarding logs info */}
                    {!isDirect && (
                      <div className="grid grid-cols-2 gap-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] p-2.5 rounded-xl eyebrow text-[9px]">
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="h-3.5 w-3.5 text-[#12D6C4] stroke-[2]" />
                          <span className="num-tabular">Thank-You: {ref.thankYouSentCount} / {ref.patientsCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-[#12D6C4] stroke-[2]" />
                          <span className="num-tabular">Discharged: {ref.dischargeReportCount} / {ref.patientsCount}</span>
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={() => setExpandedDoc(isExpanded ? null : ref.name)}
                        className="flex-1 py-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[#F5F3FA] eyebrow text-[9px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 focus:outline-hidden"
                      >
                        {isExpanded ? 'Hide Patients' : 'View Patients'}
                        <ChevronRight className={`h-3.5 w-3.5 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {!isDirect && (
                        <button
                          onClick={() => {
                            setIsAssigningPatientToDoc(isAssigningPatientToDoc === ref.name ? null : ref.name);
                            setPatientSearch('');
                          }}
                          className="px-3.5 py-2 bg-[rgba(18,214,196,0.12)] hover:bg-[rgba(18,214,196,0.2)] border border-[rgba(18,214,196,0.3)] text-[#12D6C4] eyebrow text-[9px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 focus:outline-hidden"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Assign
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Assign Patient Overlay Section */}
                  <AnimatePresence>
                    {isAssigningPatientToDoc === ref.name && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[rgba(255,255,255,0.08)] bg-[rgba(10,7,17,0.6)] p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h5 className="eyebrow text-[9px] text-[#12D6C4]">Assign Patient to {ref.name}</h5>
                            <button onClick={() => setIsAssigningPatientToDoc(null)} className="text-[rgba(245,243,250,0.4)] hover:text-[#F5F3FA]">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgba(245,243,250,0.4)]" />
                            <input 
                              type="text"
                              placeholder="Search existing patients..."
                              value={patientSearch}
                              onChange={(e) => setPatientSearch(e.target.value)}
                              className="w-full text-xs pl-8 pr-3 py-2 glass-input font-medium"
                            />
                          </div>

                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                            {assignablePatients.length === 0 ? (
                              <p className="text-xs text-[rgba(245,243,250,0.4)] italic font-medium py-1">No matching assignable patients.</p>
                            ) : (
                              assignablePatients.map((p: any) => (
                                <button
                                  key={p.id}
                                  onClick={() => assignReferralMutation.mutate({ id: p.id, referringDoctor: ref.name })}
                                  className="w-full text-left p-2 border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(18,214,196,0.1)] rounded-lg flex items-center justify-between text-xs font-medium text-[#F5F3FA] hover:text-[#12D6C4] transition-colors cursor-pointer"
                                >
                                  <span className="truncate">{p.fullName} ({p.phone})</span>
                                  <span className="eyebrow text-[8px] shrink-0 pl-2">
                                    {p.referringDoctor ? `Referred by: ${p.referringDoctor}` : 'Direct Intake'}
                                  </span>
                                </button>
                              ))
                            )}
                            
                            {patientSearch.trim().length > 0 && !assignablePatients.some((p: any) => p.fullName.toLowerCase() === patientSearch.trim().toLowerCase()) && (
                              <button
                                onClick={() => setIsCreatePatientModalOpen(true)}
                                className="w-full text-left p-2 mt-1 border border-[rgba(18,214,196,0.3)] bg-[rgba(18,214,196,0.1)] hover:bg-[rgba(18,214,196,0.2)] rounded-lg flex items-center gap-2 text-xs font-bold text-[#12D6C4] transition-colors cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">Create new patient "{patientSearch.trim()}"</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expandable referred patients list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-[rgba(255,255,255,0.08)] bg-[rgba(10,7,17,0.4)]">
                          <div className="p-4 space-y-2">
                            <h5 className="eyebrow text-[9px] mb-2 px-1">Referred Patient List</h5>
                            {ref.referredPatients.length === 0 ? (
                              <p className="text-xs text-[rgba(245,243,250,0.4)] italic font-medium p-2">No patients assigned under this referrer.</p>
                            ) : (
                              ref.referredPatients.map((p: any) => (
                                <div 
                                  key={p.id}
                                  className="p-3 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(18,214,196,0.3)] bg-[rgba(255,255,255,0.02)] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors"
                                >
                                  <div className="truncate space-y-1">
                                    <p className="text-xs font-serif font-bold text-[#F5F3FA] truncate">{p.fullName}</p>
                                    <p className="text-[10px] text-[rgba(245,243,250,0.4)] num-tabular">{p.phone}</p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3">
                                    {p.treatmentModalityAssigned ? (
                                      <span className="text-[9px] font-bold text-[#12D6C4] bg-[rgba(18,214,196,0.12)] border border-[rgba(18,214,196,0.3)] px-2 py-0.5 rounded-md">
                                        {p.treatmentModalityAssigned}
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold text-[#FFB454] bg-[rgba(255,180,84,0.12)] border border-[rgba(255,180,84,0.3)] px-2 py-0.5 rounded-md">
                                        Intake Pending
                                      </span>
                                    )}

                                    <button
                                      onClick={() => onViewPatient(p.id)}
                                      className="eyebrow text-[9px] text-[#12D6C4] hover:underline flex items-center gap-0.5 cursor-pointer"
                                    >
                                      View File
                                      <ChevronRight className="h-3 w-3 stroke-[2]" />
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassPanel>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Doctor Creation Modal */}
      <AnimatePresence>
        {isAddDocOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsAddDocOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative bg-[#120D1F] border border-[rgba(255,255,255,0.12)] p-6 rounded-3xl shadow-[0_24px_50px_rgba(0,0,0,0.5)] w-full max-w-sm z-10 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-3">
                <h4 className="text-lg font-serif font-bold text-[#F5F3FA]">Add Referral Doctor</h4>
                <button onClick={() => setIsAddDocOpen(false)} className="text-[rgba(245,243,250,0.4)] hover:text-[#F5F3FA]">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleAddDoctorSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="eyebrow text-[9px] block">Doctor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Dr. Jane Smith"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="block w-full text-xs glass-input p-2.5 font-medium placeholder-[rgba(245,243,250,0.4)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="eyebrow text-[9px] block">Specialty</label>
                  <select
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    className="block w-full text-xs glass-input p-2.5 cursor-pointer font-bold bg-[#120D1F] text-[#F5F3FA]"
                  >
                    <option value="Orthopedics">Orthopedics & Spine</option>
                    <option value="Neurology">Neurology & Rehab</option>
                    <option value="Rheumatology">Rheumatology</option>
                    <option value="Cardiology">Cardiology & Sports</option>
                    <option value="Pediatrics">Pediatrics Rehab</option>
                    <option value="General Practice">General Practice</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="eyebrow text-[9px] block">Clinic / Hospital</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., City Bone & Joint Clinic"
                    value={docClinic}
                    onChange={(e) => setDocClinic(e.target.value)}
                    className="block w-full text-xs glass-input p-2.5 font-medium placeholder-[rgba(245,243,250,0.4)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="eyebrow text-[9px] block">Email Address</label>
                  <input
                    type="email"
                    placeholder="E.g., doctor@email.com (optional)"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    className="block w-full text-xs glass-input p-2.5 font-medium placeholder-[rgba(245,243,250,0.4)]"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
                  <button
                    type="button"
                    onClick={() => setIsAddDocOpen(false)}
                    className="flex-1 py-2.5 border border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.04)] text-xs font-bold rounded-xl transition-colors cursor-pointer text-[rgba(245,243,250,0.8)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#12D6C4] hover:bg-[#0FBDAE] text-[#06231D] text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-[0_0_20px_rgba(18,214,196,0.3)] border-0"
                  >
                    Add Referrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreatePatientModal 
        isOpen={isCreatePatientModalOpen} 
        onClose={() => setIsCreatePatientModalOpen(false)} 
        prefilledName={patientSearch.trim()}
        prefilledReferringDoctor={isAssigningPatientToDoc || ''}
        onSuccess={() => {
          setIsAssigningPatientToDoc(null);
          setPatientSearch('');
        }}
      />
    </div>
  );
}
