'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserCheck, Phone, ChevronRight, Loader2, Network, 
  Search, FileText, CheckCircle, Mail, MapPin, Building2, CheckSquare,
  Plus, X, UserPlus, ArrowLeftRight
} from 'lucide-react';

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
      // Dummy data for instant loading
      return [
        { id: 'p1', fullName: 'James Doe', phone: '+919876543210', referringDoctor: 'Self', createdAt: '2023-11-01T10:00:00Z' },
        { id: 'p2', fullName: 'Sarah Connor', phone: '+919988776655', referringDoctor: 'Dr. Smith', createdAt: '2024-01-10T11:00:00Z' },
        { id: 'p3', fullName: 'Robert Bruce', phone: '+919876543211', referringDoctor: 'City Hospital', createdAt: '2024-02-15T09:30:00Z' },
        { id: 'p4', fullName: 'Emily Davis', phone: '+919876543212', referringDoctor: 'Self', createdAt: '2024-03-20T14:15:00Z' },
        { id: 'p5', fullName: 'Michael Chang', phone: '+919876543213', referringDoctor: 'Dr. Smith', createdAt: '2024-04-10T10:00:00Z' }
      ];
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
    
    // Fallback to custom doctors in state/localStorage
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

  // Pre-seed manually created doctors even if they don't have patients yet
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

    // Track mock onboarding checkboxes by reading state flags in notes
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
  
  // Calculate average intake completions: patients who have assigned modality or treatments
  const onboardingFinishedCount = patients.filter((p: any) => 
    p.referringDoctor && 
    p.referringDoctor !== 'Self / Direct' && 
    p.treatmentModalityAssigned
  ).length;
  const intakeOnboardingRate = totalReferred > 0 ? Math.round((onboardingFinishedCount / totalReferred) * 100) : 100;

  // Find top doctor
  const topDocName = referrers.find((r: any) => r.name !== 'Self / Direct')?.name || 'Self / Direct';

  // Handler to manually save a new doctor referrer
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

    // Clear form
    setDocName('');
    setDocClinic('');
    setDocEmail('');
    setIsAddDocOpen(false);
  };

  // Find candidates for referral assignment search
  const assignablePatients = patients.filter((p: any) => {
    const query = patientSearch.toLowerCase();
    const matchesQuery = p.fullName.toLowerCase().includes(query) || p.phone.includes(query);
    const notAlreadyReferredByThisDoc = p.referringDoctor !== isAssigningPatientToDoc;
    return matchesQuery && notAlreadyReferredByThisDoc;
  });

  return (
    <div className="space-y-6 select-none relative">
      {/* Search & Actions Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-[#FFFCF6] p-5 rounded-2xl shadow-[0_8px_30px_rgba(42,38,32,0.02)] border border-[#EADFCA]/45">
        <div>
          <h3 className="text-2xl font-serif text-[#2B2620] font-bold">Referral Network</h3>
          <p className="text-xs text-[#2B2620]/45 font-bold mt-0.5">Track patients referred by external doctors, follow conversion stats, and log onboarding notes.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2B2620]/45 stroke-[2]" />
            <input
              type="text"
              placeholder="Search referrers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4.5 py-2.5 w-full md:w-52 text-xs bg-[#FAF6EF]/65 border border-[#EADFCA] rounded-xl hover:border-primary/30 focus:bg-white focus:border-primary focus:outline-hidden text-[#2B2620] placeholder-[#2B2620]/45 font-semibold transition-all duration-200 shadow-xxs"
            />
          </div>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddDocOpen(true)}
            className="flex items-center gap-1.5 bg-primary hover:bg-[#3C5040] text-background text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer focus:outline-hidden shadow-xs shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Add Doctor
          </motion.button>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Referred */}
        <div className="bg-[#FFFCF6] border-l-4 border-primary p-4.5 rounded-2xl border border-y-[#EADFCA]/60 border-r-[#EADFCA]/60 shadow-[0_8px_30px_rgba(42,38,32,0.015)] flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#2B2620]/45 uppercase tracking-wider">Referred Patients</p>
            <h4 className="text-2xl font-serif font-bold text-[#2B2620] mt-0.5">{totalReferred}</h4>
          </div>
        </div>

        {/* Active Doctors */}
        <div className="bg-[#FFFCF6] border-l-4 border-[#D98353] p-4.5 rounded-2xl border border-y-[#EADFCA]/60 border-r-[#EADFCA]/60 shadow-[0_8px_30px_rgba(42,38,32,0.015)] flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[#D98353]/10 flex items-center justify-center text-[#D98353] shrink-0">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#2B2620]/45 uppercase tracking-wider">Active Referrers</p>
            <h4 className="text-2xl font-serif font-bold text-[#2B2620] mt-0.5">{activeReferrers}</h4>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-[#FFFCF6] border-l-4 border-emerald-500 p-4.5 rounded-2xl border border-y-[#EADFCA]/60 border-r-[#EADFCA]/60 shadow-[0_8px_30px_rgba(42,38,32,0.015)] flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#2B2620]/45 uppercase tracking-wider">Intake Onboard Rate</p>
            <h4 className="text-2xl font-serif font-bold text-[#2B2620] mt-0.5">{intakeOnboardingRate}%</h4>
          </div>
        </div>

        {/* Top Referrer */}
        <div className="bg-[#FFFCF6] border-l-4 border-indigo-500 p-4.5 rounded-2xl border border-y-[#EADFCA]/60 border-r-[#EADFCA]/60 shadow-[0_8px_30px_rgba(42,38,32,0.015)] flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="truncate">
            <p className="text-[10px] font-bold text-[#2B2620]/45 uppercase tracking-wider">Top Referrer</p>
            <h4 className="text-sm font-serif font-bold text-[#2B2620] truncate mt-1 leading-snug">{topDocName}</h4>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="flex justify-center py-20 bg-[#FFFCF6] border border-[#EADFCA]/50 rounded-2xl">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : referrers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#FFFCF6] border border-dashed border-[#EADFCA] rounded-2xl p-6">
          <Network className="h-10 w-10 text-primary/30 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-foreground/60">No referring sources registered.</h4>
          <p className="text-xxs text-[#2B2620]/45 mt-0.5 font-bold">Patients will be categorized under Direct Intake when no referring doctor is logged.</p>
        </div>
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
                <div 
                  key={ref.name}
                  className={`bg-[#FFFCF6] border rounded-3xl overflow-hidden transition-all duration-300 shadow-[0_8px_25px_rgba(42,38,32,0.01)] hover:shadow-[0_16px_35px_rgba(42,38,32,0.035)] ${
                    isExpanded ? 'border-primary/50' : 'border-[#EADFCA]/65'
                  }`}
                >
                  {/* Doctor Profile Banner */}
                  <div className="p-6 flex flex-col justify-between h-full space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 truncate">
                        <h4 className="text-lg font-serif font-bold text-[#2B2620] truncate">
                          {ref.name}
                        </h4>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{ref.specialty}</p>
                      </div>
                      
                      {/* Referrer Patients Count Badge */}
                      <span className="bg-[#FAF6EF] border border-[#EADFCA] text-primary text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xxs shrink-0">
                        {ref.patientsCount} {ref.patientsCount === 1 ? 'Patient' : 'Patients'}
                      </span>
                    </div>

                    {/* Clinic details info */}
                    <div className="space-y-2 text-xxs font-semibold text-[#2B2620]/75">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-primary shrink-0 stroke-[1.75]" />
                        <span className="truncate">{ref.clinic}</span>
                      </div>
                      {!isDirect && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-primary shrink-0 stroke-[1.75]" />
                          <span className="truncate">{ref.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Onboarding progress meter */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/50 mb-1.5">
                        <span>Intake Conversion</span>
                        <span>{convertedRate}%</span>
                      </div>
                      <div className="h-2 bg-[#FAF6EF] border border-[#EADFCA]/45 rounded-full overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${convertedRate}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    </div>

                    {/* Onboarding logs info */}
                    {!isDirect && (
                      <div className="grid grid-cols-2 gap-3 bg-[#FAF6EF]/40 border border-[#EADFCA]/30 p-2.5 rounded-2xl text-[9px] font-bold text-[#2B2620]/60">
                        <div className="flex items-center gap-1.5">
                          <CheckSquare className="h-3.5 w-3.5 text-primary stroke-[2]" />
                          <span>Thank-You: {ref.thankYouSentCount} / {ref.patientsCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-primary stroke-[2]" />
                          <span>Discharged: {ref.dischargeReportCount} / {ref.patientsCount}</span>
                        </div>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={() => setExpandedDoc(isExpanded ? null : ref.name)}
                        className="flex-1 py-2 bg-[#FAF6EF] hover:bg-[#EADFCA]/30 border border-[#EADFCA] text-[#2B2620]/65 text-xxs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 focus:outline-hidden"
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
                          className="px-3.5 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xxs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 focus:outline-hidden"
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
                        className="border-t border-[#EADFCA] bg-[#FAF6EF]/60 p-4 space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary">Assign Patient to {ref.name}</h5>
                          <button onClick={() => setIsAssigningPatientToDoc(null)} className="text-[#2B2620]/45 hover:text-[#2B2620]">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#2B2620]/40" />
                          <input 
                            type="text"
                            placeholder="Search existing patients..."
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            className="w-full text-xs pl-8 pr-3 py-2 bg-[#FFFCF6] border border-[#EADFCA] rounded-xl text-[#2B2620] placeholder-[#2B2620]/35 font-semibold focus:outline-hidden focus:border-primary"
                          />
                        </div>

                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                          {assignablePatients.length === 0 ? (
                            <p className="text-xxs text-foreground/45 italic font-medium py-1">No matching assignable patients.</p>
                          ) : (
                            assignablePatients.map((p: any) => (
                              <button
                                key={p.id}
                                onClick={() => assignReferralMutation.mutate({ id: p.id, referringDoctor: ref.name })}
                                className="w-full text-left p-2 border border-[#EADFCA]/40 bg-[#FFFCF6] hover:bg-primary/5 rounded-lg flex items-center justify-between text-xxs font-semibold text-[#2B2620] hover:text-primary transition-colors cursor-pointer"
                              >
                                <span className="truncate">{p.fullName} ({p.phone})</span>
                                <span className="text-[8px] uppercase font-bold text-[#2B2620]/40 shrink-0 pl-2">
                                  {p.referringDoctor ? `Referred by: ${p.referringDoctor}` : 'Direct Intake'}
                                </span>
                              </button>
                            ))
                          )}
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
                        className="border-t border-[#EADFCA] bg-[#FAF6EF]/30"
                      >
                        <div className="p-4 space-y-2">
                          <h5 className="text-[10px] font-bold uppercase tracking-wider text-[#2B2620]/45 mb-2 px-1">Referred Patient List</h5>
                          {ref.referredPatients.length === 0 ? (
                            <p className="text-xxs text-foreground/45 italic font-medium p-2">No patients assigned under this referrer.</p>
                          ) : (
                            ref.referredPatients.map((p: any) => (
                              <div 
                                key={p.id}
                                className="p-3 border border-[#EADFCA]/50 hover:border-primary/30 bg-[#FFFCF6] rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-colors shadow-xxs"
                              >
                                <div className="truncate space-y-1">
                                  <p className="text-xs font-serif font-bold text-[#2B2620] truncate">{p.fullName}</p>
                                  <p className="text-[10px] text-[#2B2620]/50 font-semibold">{p.phone}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                  {p.treatmentModalityAssigned ? (
                                    <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                                      {p.treatmentModalityAssigned}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-[#D98353] bg-[#D98353]/10 border border-[#D98353]/20 px-2 py-0.5 rounded-md">
                                      Intake Pending
                                    </span>
                                  )}

                                  <button
                                    onClick={() => onViewPatient(p.id)}
                                    className="text-[9px] font-bold uppercase tracking-wider text-primary hover:text-[#3C5040] flex items-center gap-0.5 cursor-pointer"
                                  >
                                    View File
                                    <ChevronRight className="h-3 w-3 stroke-[2]" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Doctor Creation Modal */}
      <AnimatePresence>
        {isAddDocOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md" onClick={() => setIsAddDocOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-3xl shadow-[0_24px_50px_rgba(42,38,32,0.15)] w-full max-w-sm z-10 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-[#EADFCA]/60 pb-2">
                <h4 className="text-lg font-serif font-bold text-[#2B2620]">Add Referral Doctor</h4>
                <button onClick={() => setIsAddDocOpen(false)} className="text-[#2B2620]/45 hover:text-[#2B2620]">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form onSubmit={handleAddDoctorSubmit} className="space-y-4.5">
                {/* Doctor Name */}
                <div className="space-y-1">
                  <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">Doctor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Dr. Jane Smith"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold placeholder-[#2B2620]/35 shadow-xxs"
                  />
                </div>

                {/* Doctor Specialty */}
                <div className="space-y-1">
                  <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">Specialty</label>
                  <select
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3 py-2 cursor-pointer text-[#2B2620] focus:border-primary focus:outline-hidden font-bold shadow-xxs"
                  >
                    <option value="Orthopedics">Orthopedics & Spine</option>
                    <option value="Neurology">Neurology & Rehab</option>
                    <option value="Rheumatology">Rheumatology</option>
                    <option value="Cardiology">Cardiology & Sports</option>
                    <option value="Pediatrics">Pediatrics Rehab</option>
                    <option value="General Practice">General Practice</option>
                  </select>
                </div>

                {/* Clinic Name */}
                <div className="space-y-1">
                  <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">Clinic / Hospital</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., City Bone & Joint Clinic"
                    value={docClinic}
                    onChange={(e) => setDocClinic(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold placeholder-[#2B2620]/35 shadow-xxs"
                  />
                </div>

                {/* Doctor Email */}
                <div className="space-y-1">
                  <label className="block text-xxs font-bold uppercase tracking-wider text-[#2B2620]/65">Email Address</label>
                  <input
                    type="email"
                    placeholder="E.g., doctor@email.com (optional)"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF]/40 px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold placeholder-[#2B2620]/35 shadow-xxs"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-[#EADFCA]/60">
                  <button
                    type="button"
                    onClick={() => setIsAddDocOpen(false)}
                    className="flex-1 py-2.5 border border-[#EADFCA] hover:bg-[#FAF6EF] text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden text-[#2B2620]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden"
                  >
                    Add Referrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
