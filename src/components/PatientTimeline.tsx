'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, MapPin, Tag, FileText, Calendar, 
  Clock, PhoneCall, ChevronLeft, Loader2, ArrowLeft, 
  MessageSquare, FileDown, Activity, Mic, Sparkles, 
  Plus, Check, Camera, Image, AlertTriangle, Download, 
  Trash2, Edit2, PlayCircle, Folder, File, FolderPlus,
  ShieldAlert, Award, X, Dumbbell, Share2, Send, CheckSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const AppointmentStatus = { WAITING: 'WAITING', IN_PROGRESS: 'IN_PROGRESS', COMPLETED: 'COMPLETED', SCHEDULED: 'SCHEDULED', NO_SHOW: 'NO_SHOW', CANCELLED: 'CANCELLED' } as const;
type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];
const CallOutcome = {
  BOOKED: 'BOOKED',
  RESCHEDULED: 'RESCHEDULED',
  CANCELLED: 'CANCELLED',
  INQUIRY_ONLY: 'INQUIRY_ONLY',
  FOLLOW_UP_NEEDED: 'FOLLOW_UP_NEEDED',
  MISSED: 'MISSED',
  INFO_ONLY: 'INFO_ONLY',
  NO_ANSWER: 'NO_ANSWER'
} as const;
type CallOutcome = typeof CallOutcome[keyof typeof CallOutcome];

interface Props {
  patientId: string;
  onBack?: () => void;
}

export default function PatientTimeline({ patientId, onBack }: Props) {
  const queryClient = useQueryClient();
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  // Dictation States
  const [isDictating, setIsDictating] = useState(false);
  const [dictatedText, setDictatedText] = useState('');
  const [isSoapGenerating, setIsSoapGenerating] = useState(false);
  const [soapPreview, setSoapPreview] = useState('');

  // ROM Media States
  const [isRomUploading, setIsRomUploading] = useState(false);
  const [romJoint, setRomJoint] = useState('Knee Extension');
  const [romAngle, setRomAngle] = useState('85');
  const [romStage, setRomStage] = useState('Before'); // "Before" | "After"

  // Phase 8 states: HEP and Handout sharing
  const [isAssigningExercise, setIsAssigningExercise] = useState<string | null>(null); // app id
  const [selectedExTemplateId, setSelectedExTemplateId] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('10');
  const [exHold, setExHold] = useState('5s');
  const [exFreq, setExFreq] = useState('Twice daily');
  const [isSharingHandout, setIsSharingHandout] = useState(false);

  // File Explorer path states
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileType, setUploadFileType] = useState('PDF');
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [isUploadingToSupabase, setIsUploadingToSupabase] = useState(false);

  // Sub-tab navigation state
  const [activeTab, setActiveTab] = useState<'documents' | 'rom' | 'billing'>('billing');

  // Custom modal states for Session Packages, Document Previewer, and Custom Confirm
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [totalSessions, setTotalSessions] = useState(10);
  const [subNamesInput, setSubNamesInput] = useState<string[]>(Array(10).fill(''));
  const [packagePrice, setPackagePrice] = useState('');
  const [packagePaid, setPackagePaid] = useState('');
  const [editingNotesSessionIdx, setEditingNotesSessionIdx] = useState<{ pkgId: string; idx: number } | null>(null);
  const [currentSessionNotesText, setCurrentSessionNotesText] = useState('');
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState('');
  const [editPackageName, setEditPackageName] = useState('');
  const [editTotalSessions, setEditTotalSessions] = useState(10);
  const [editSubNamesInput, setEditSubNamesInput] = useState<string[]>([]);
  const [editPackagePrice, setEditPackagePrice] = useState('');
  const [editPackagePaid, setEditPackagePaid] = useState('');
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleTotalSessionsChange = (val: number) => {
    setTotalSessions(val);
    setSubNamesInput(prev => {
      const next = [...prev];
      if (val > prev.length) {
        return next.concat(Array(val - prev.length).fill(''));
      } else {
        return next.slice(0, val);
      }
    });
  };

  const handleEditTotalSessionsChange = (val: number) => {
    setEditTotalSessions(val);
    setEditSubNamesInput(prev => {
      const next = [...prev];
      if (val > prev.length) {
        return next.concat(Array(val - prev.length).fill(''));
      } else {
        return next.slice(0, val);
      }
    });
  };

  // Manual Add/Edit Timeline states
  const [isAddingSession, setIsAddingSession] = useState(false);
  const [isAddingCall, setIsAddingCall] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; type: 'APPOINTMENT' | 'CALL_LOG'; data: any } | null>(null);

  // Form states for Session (Appointment)
  const [sessionDate, setSessionDate] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState('09:00');
  const [sessionEndTime, setSessionEndTime] = useState('09:30');
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionTreatmentType, setSessionTreatmentType] = useState('Physiotherapy Session');
  const [sessionStatus, setSessionStatus] = useState<AppointmentStatus>('SCHEDULED');

  // Form states for Call Log
  const [callDirection, setCallDirection] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [callPhone, setCallPhone] = useState('');
  const [callDuration, setCallDuration] = useState(60); // in seconds
  const [callSummary, setCallSummary] = useState('');
  const [callTranscript, setCallTranscript] = useState('');
  const [callOutcome, setCallOutcome] = useState<CallOutcome>(CallOutcome.BOOKED);
  const [callTimestamp, setCallTimestamp] = useState('');

  // Fetch full patient profile details
  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient-profile', patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) throw new Error('Failed to fetch patient');
      return res.json();
    },
  });

  // Fetch Protocols list for assignment
  const { data: protocols = [] } = useQuery({
    queryKey: ['protocols'],
    queryFn: async () => {
      const res = await fetch('/api/protocols');
      if (res.ok) return res.json();
      return [];
    },
  });

  // Fetch Exercise templates
  const { data: exerciseTemplates = [] } = useQuery({
    queryKey: ['exercise-templates'],
    queryFn: async () => {
      const res = await fetch('/api/exercises');
      if (res.ok) return res.json();
      return [];
    },
  });

  // Fetch Handouts list
  const { data: handouts = [] } = useQuery({
    queryKey: ['handouts-library'],
    queryFn: async () => {
      const res = await fetch('/api/handouts');
      if (res.ok) return res.json();
      return [];
    },
  });

  // Fetch patient packages
  const { data: packages = [], refetch: refetchPackages } = useQuery({
    queryKey: ['packages', patientId],
    queryFn: async () => {
      const res = await fetch(`/api/packages?patientId=${patientId}`);
      if (!res.ok) throw new Error('Failed to fetch packages');
      return res.json();
    },
  });

  // Patient Update Mutation
  const updatePatientMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', patientId] });
      setIsDictating(false);
      setDictatedText('');
      setSoapPreview('');
      setIsRomUploading(false);
    },
  });

  // Assign Exercise Mutation
  const assignExerciseMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Assignment failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', patientId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsAssigningExercise(null);
    },
  });

  // Share Handout Mutation
  const shareHandoutMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/handouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Share failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', patientId] });
      setIsSharingHandout(false);
      alert('Handout successfully shared via WhatsApp!');
    },
  });

  // Reset helpers
  const resetSessionForm = () => {
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSessionStartTime('09:00');
    setSessionEndTime('09:30');
    setSessionNotes('');
    setSessionTreatmentType('Physiotherapy Session');
    setSessionStatus('SCHEDULED');
  };

  const resetCallForm = () => {
    setCallDirection('INBOUND');
    setCallPhone(patient?.phone || '');
    setCallDuration(60);
    setCallSummary('');
    setCallTranscript('');
    setCallOutcome(CallOutcome.BOOKED);
    setCallTimestamp(new Date().toISOString().slice(0, 16));
  };

  // Add Session Mutation
  const addSessionMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create session');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', patientId] });
      setIsAddingSession(false);
      resetSessionForm();
    },
    onError: (err: any) => {
      alert(err.message || 'Error creating session');
    }
  });

  // Edit Session Mutation
  const editSessionMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update session');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', patientId] });
      setEditingItem(null);
      resetSessionForm();
    },
    onError: (err: any) => {
      alert(err.message || 'Error updating session');
    }
  });

  // Delete Session Mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete session');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', patientId] });
    },
    onError: (err: any) => {
      alert(err.message || 'Error deleting session');
    }
  });

  // Add Call Log Mutation
  const addCallLogMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/call-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to log call');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', patientId] });
      setIsAddingCall(false);
      resetCallForm();
    },
    onError: (err: any) => {
      alert(err.message || 'Error creating call log');
    }
  });

  // Edit Call Log Mutation
  const editCallLogMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/call-logs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update call log');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', patientId] });
      setEditingItem(null);
      resetCallForm();
    },
    onError: (err: any) => {
      alert(err.message || 'Error updating call log');
    }
  });

  // Delete Call Log Mutation
  const deleteCallLogMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/call-logs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete call log');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-profile', patientId] });
    },
    onError: (err: any) => {
      alert(err.message || 'Error deleting call log');
    }
  });

  if (isLoading || !patient) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 bg-[#FFFCF6] rounded-2xl">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-foreground/60 mt-2 font-medium">Retrieving clinical history...</p>
      </div>
    );
  }

  // Active protocol assignment mapping
  const activeProtocol = protocols.find((p: any) => p.id === patient.assignedProtocolId);
  const protocolSteps = activeProtocol ? activeProtocol.steps.split(',').map((s: string) => s.trim()) : [];

  // Combine appointments and call logs into a single timeline array
  const timelineItems: any[] = [];

  patient.appointments.forEach((app: any) => {
    timelineItems.push({
      id: app.id,
      type: 'APPOINTMENT',
      date: new Date(app.date),
      time: app.startTime,
      sortDate: new Date(`${app.date.split('T')[0]}T${app.startTime}:00`),
      data: app,
    });
  });

  patient.callLogs.forEach((call: any) => {
    timelineItems.push({
      id: call.id,
      type: 'CALL_LOG',
      date: new Date(call.timestamp),
      time: new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sortDate: new Date(call.timestamp),
      data: call,
    });
  });

  timelineItems.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  const romFiles = patient.attachments.filter((a: any) => a.fileType === 'rom-photo' || a.name.includes('ROM'));

  // Filter attachments that are not ROM photos
  const docAttachments = patient.attachments.filter((a: any) => a.fileType !== 'rom-photo');

  // Parse path hierarchy from attachments
  const files: any[] = [];
  const foldersSet = new Set<string>();

  docAttachments.forEach((a: any) => {
    // If name contains slashes, it represents a path: e.g. "Folder/Sub/file.pdf"
    const parts = a.name.split('/');
    
    // Check if the file path matches the current path prefix
    let matchesPath = true;
    for (let i = 0; i < currentPath.length; i++) {
      if (parts[i] !== currentPath[i]) {
        matchesPath = false;
        break;
      }
    }

    if (matchesPath) {
      const remainingParts = parts.slice(currentPath.length);
      if (remainingParts.length === 1) {
        // It's a file or folder placeholder in the current folder
        const fileName = remainingParts[0];
        if (fileName !== '.folder') {
          files.push({
            id: a.id,
            url: a.url,
            fileType: a.fileType,
            displayName: fileName,
            name: a.name
          });
        }
      } else if (remainingParts.length > 1) {
        // It's a subfolder in the current folder
        foldersSet.add(remainingParts[0]);
      }
    }
  });

  const currentFolders = Array.from(foldersSet);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const fullFolderName = [...currentPath, newFolderName.trim(), '.folder'].join('/');
    updatePatientMutation.mutate({
      attachment: {
        name: fullFolderName,
        url: '#',
        fileType: 'folder-placeholder'
      }
    }, {
      onSuccess: () => {
        setIsCreatingFolder(false);
        setNewFolderName('');
      }
    });
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) return resolve(file);
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_SIZE = 800;
          
          if (width > height && width > MAX_SIZE) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(file);
          
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.85);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleUploadFile = async () => {
    if (!uploadFileName.trim() || !uploadFileObj) return;
    setIsUploadingToSupabase(true);
    
    try {
      const fileExt = uploadFileObj.name.split('.').pop();
      const fileName = `${Date.now()}_${uploadFileName.replace(/\s+/g, '_')}.${fileExt}`;
      const filePath = `${patientId}/${fileName}`;
      
      const compressedBlob = await compressImage(uploadFileObj);

      // Upload via our own backend API to bypass AdBlockers (like uBlock Origin) blocking Supabase domains!
      const formData = new FormData();
      formData.append('file', compressedBlob, uploadFileObj.name);
      formData.append('patientId', patientId);
      formData.append('fileName', filePath);

      const uploadRes = await fetch('/api/patients/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Backend upload failed');
      }

      const { publicUrl } = await uploadRes.json();
      const fullFileName = [...currentPath, uploadFileName.trim()].join('/');
      updatePatientMutation.mutate({
        attachment: {
          name: fullFileName,
          url: publicUrl,
          fileType: uploadFileType
        }
      }, {
        onSuccess: () => {
          setIsUploadingFile(false);
          setUploadFileName('');
          setUploadFileObj(null);
          setIsUploadingToSupabase(false);
        },
        onError: () => {
          setIsUploadingToSupabase(false);
        }
      });
    } catch (err: any) {
      console.error('File upload failed:', err);
      setIsUploadingToSupabase(false);
      alert('Failed to upload file: ' + (err.message || 'Please try again.'));
    }
  };

  // Referral Onboarding Checklist handlers
  const isThankYouSent = patient?.notes?.includes('Thank-You Note Sent') || patient?.notes?.includes('[x] Onboarding Thank-You') || false;
  const isDischargeSent = patient?.notes?.includes('Discharge Report Sent') || patient?.notes?.includes('[x] Onboarding Discharge') || false;

  const handleToggleThankYou = () => {
    let currentNotes = patient.notes || '';
    if (isThankYouSent) {
      currentNotes = currentNotes.replace('Thank-You Note Sent', '').replace('[x] Onboarding Thank-You', '').trim();
    } else {
      currentNotes = (currentNotes + '\nThank-You Note Sent').trim();
    }
    updatePatientMutation.mutate({ notes: currentNotes });
  };

  const handleToggleDischarge = () => {
    let currentNotes = patient.notes || '';
    if (isDischargeSent) {
      currentNotes = currentNotes.replace('Discharge Report Sent', '').replace('[x] Onboarding Discharge', '').trim();
    } else {
      currentNotes = (currentNotes + '\nDischarge Report Sent').trim();
    }
    updatePatientMutation.mutate({ notes: currentNotes });
  };

  // Patient Message Consent/Sent Trackers
  const isPatientWelcomeSent = patient?.notes?.includes('[x] Patient Welcome Sent') || false;
  const isPatientBookingSent = patient?.notes?.includes('[x] Patient Appointment Sent') || false;
  const isPatientHEPSent = patient?.notes?.includes('[x] Patient HEP Sent') || false;
  const isPatientFeedbackSent = patient?.notes?.includes('[x] Patient Feedback Sent') || false;

  const handleTogglePatientWelcome = () => {
    let currentNotes = patient.notes || '';
    if (isPatientWelcomeSent) {
      currentNotes = currentNotes.replace('[x] Patient Welcome Sent', '').trim();
    } else {
      currentNotes = (currentNotes + '\n[x] Patient Welcome Sent').trim();
      alert(`[WhatsApp SIMULATION]\nMessage sent to patient ${patient.fullName} (${patient.phone}):\n\n"Hi ${patient.fullName}, welcome to Health 360! We are excited to support you on your recovery journey. Your clinical case file has been successfully registered. Feel free to message us here if you have any questions."`);
    }
    updatePatientMutation.mutate({ notes: currentNotes });
  };

  const handleTogglePatientBooking = () => {
    let currentNotes = patient.notes || '';
    if (isPatientBookingSent) {
      currentNotes = currentNotes.replace('[x] Patient Appointment Sent', '').trim();
    } else {
      currentNotes = (currentNotes + '\n[x] Patient Appointment Sent').trim();
      alert(`[WhatsApp SIMULATION]\nMessage sent to patient ${patient.fullName} (${patient.phone}):\n\n"Dear ${patient.fullName}, your upcoming therapy session is confirmed. We look forward to seeing you. Please check your assigned timing in the portal or reply directly if you need to reschedule."`);
    }
    updatePatientMutation.mutate({ notes: currentNotes });
  };

  const handleTogglePatientHEP = () => {
    let currentNotes = patient.notes || '';
    if (isPatientHEPSent) {
      currentNotes = currentNotes.replace('[x] Patient HEP Sent', '').trim();
    } else {
      currentNotes = (currentNotes + '\n[x] Patient HEP Sent').trim();
      alert(`[WhatsApp SIMULATION]\nMessage sent to patient ${patient.fullName} (${patient.phone}):\n\n"Hello ${patient.fullName}! This is a gentle reminder from Health 360 to perform your prescribed physical therapy exercises today. Consistent daily movement is key to your fast rehabilitation!"`);
    }
    updatePatientMutation.mutate({ notes: currentNotes });
  };

  const handleTogglePatientFeedback = () => {
    let currentNotes = patient.notes || '';
    if (isPatientFeedbackSent) {
      currentNotes = currentNotes.replace('[x] Patient Feedback Sent', '').trim();
    } else {
      currentNotes = (currentNotes + '\n[x] Patient Feedback Sent').trim();
      alert(`[WhatsApp SIMULATION]\nMessage sent to patient ${patient.fullName} (${patient.phone}):\n\n"Hi ${patient.fullName}, we hope you are feeling better after your session today. Please stay hydrated and rest the joint. Please let us know how your pain levels look tomorrow morning!"`);
    }
    updatePatientMutation.mutate({ notes: currentNotes });
  };

  const getStatusStyle = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.COMPLETED:
        return 'bg-[#E2ECE9] text-[#4E6551] border-[#4E6551]';
      case AppointmentStatus.IN_PROGRESS:
        return 'bg-[#FAF6EF] text-[#D98353] border-[#D98353]';
      case AppointmentStatus.WAITING:
        return 'bg-[#FCE2DB] text-[#D98353] border-[#D98353]';
      case AppointmentStatus.SCHEDULED:
        return 'bg-[#FAF6EF] text-[#2B2620]/70 border-[#EADFCA]';
      case AppointmentStatus.NO_SHOW:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-[#FAF6EF] text-[#2B2620]/50 border-[#EADFCA]';
    }
  };

  const getCallOutcomeStyle = (outcome: CallOutcome) => {
    switch (outcome) {
      case CallOutcome.BOOKED:
        return 'bg-[#E2ECE9] text-[#4E6551] border-[#4E6551]';
      case CallOutcome.FOLLOW_UP_NEEDED:
        return 'bg-[#FCE2DB] text-[#D98353] border-[#D98353]';
      case CallOutcome.CANCELLED:
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-[#FAF6EF] text-[#2B2620]/50 border-[#EADFCA]';
    }
  };

  const parseTranscript = (text: string) => {
    if (!text) return [];
    return text.split('\n').map((line, index) => {
      const match = line.match(/^([^:]+):(.*)$/);
      if (match) {
        return {
          id: index,
          speaker: match[1].trim(),
          message: match[2].trim(),
        };
      }
      return {
        id: index,
        speaker: '',
        message: line.trim(),
      };
    }).filter(l => l.message);
  };

  // Simulating Voice Recognition input
  const startMockDictation = () => {
    setDictatedText("Patient comes in complaining of acute stiffness in the " + (patient.presentingComplaint?.includes('knee') ? 'right knee' : 'impingement zone') + ". Active mobilization reveals range limits. Laser was applied. Plan to continue routine exercises twice a week.");
  };

  const generateSOAPNote = async () => {
    setIsSoapGenerating(true);
    try {
      const res = await fetch('/api/ai/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: dictatedText }),
      });
      if (res.ok) {
        const data = await res.json();
        setSoapPreview(data.soapNote);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSoapGenerating(false);
    }
  };

  const saveSoapNote = () => {
    const existingNotes = patient.notes || '';
    const newNotes = existingNotes + (existingNotes ? '\n\n' : '') + soapPreview;
    updatePatientMutation.mutate({ notes: newNotes });
  };

  const handleProtocolAdvance = () => {
    if (!activeProtocol) return;
    const nextStep = patient.currentProtocolStep + 1;
    if (nextStep < protocolSteps.length) {
      const nextModality = protocolSteps[nextStep];
      updatePatientMutation.mutate({
        currentProtocolStep: nextStep,
        treatmentModalityAssigned: nextModality,
      });
    }
  };

  const handleRomUploadSimulate = () => {
    const fileName = `ROM_${romJoint.replace(' ', '_')}_${romAngle}deg_${romStage}.jpg`;
    updatePatientMutation.mutate({
      attachment: {
        name: fileName,
        url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=80',
        fileType: 'rom-photo',
      }
    });
  };

  // Handle templated selection updates sets/reps parameters
  const handleTemplateChange = (templateId: string) => {
    setSelectedExTemplateId(templateId);
    const match = exerciseTemplates.find((t: any) => t.id === templateId);
    if (match) {
      setExSets(match.defaultSets);
      setExReps(match.defaultReps);
      setExHold(match.defaultHoldTime);
      setExFreq(match.defaultFrequency);
    }
  };

  const handleSaveExercise = (appId: string) => {
    const template = exerciseTemplates.find((t: any) => t.id === selectedExTemplateId);
    if (!template) return;
    assignExerciseMutation.mutate({
      appointmentId: appId,
      name: template.name,
      sets: exSets,
      reps: exReps,
      holdTime: exHold,
      frequency: exFreq,
    });
  };

  const initials = patient.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex-1 flex flex-col bg-[#FFFCF6] select-none">
      {/* Header Profile Summary */}
      <div className="p-6 border-b border-[#EADFCA] bg-[#FFFCF6] flex flex-col gap-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {onBack && (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={onBack} 
                className="p-2 rounded-xl hover:bg-[#FAF6EF] border border-[#EADFCA] mt-1 shrink-0 cursor-pointer focus:outline-hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.button>
            )}
            
            {/* Initials Avatar Badge (Fixed Size) */}
            <div 
              style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px', fontSize: '20px' }}
              className="rounded-full bg-primary/10 border border-[#EADFCA] flex items-center justify-center font-serif text-primary font-bold shrink-0 shadow-inner"
            >
              {initials}
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-serif font-bold text-[#2B2620] tracking-wide leading-none">{patient.fullName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF6EF] text-[#2B2620]/60 border border-[#EADFCA] rounded-full">
                  {patient.gender}
                </span>
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF6EF] text-[#2B2620]/60 border border-[#EADFCA] rounded-full">
                  {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} Years Old
                </span>
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF6EF] text-[#2B2620]/60 border border-[#EADFCA] rounded-full">
                  Intake: {new Date(patient.intakeDate).toLocaleDateString()}
                </span>
                <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-primary text-background rounded-full shadow-xxs">
                  Cadence: {patient.expectedCadence}
                </span>
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#FAF6EF] text-[#2B2620]/60 border border-[#EADFCA] rounded-full">
                  Language: {patient.language || 'English'}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            {/* Dictate SOAP Note button (Prevent Wrap) */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDictating(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden shadow-xs whitespace-nowrap"
            >
              <Mic className="h-4 w-4 stroke-[1.75]" />
              Dictate SOAP
            </motion.button>
          </div>
        </div>

        {/* Demographics details (Consolidated Borders) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold mt-1">
          <div className="flex items-center gap-3.5 text-[#2B2620]/75 bg-[#FAF6EF]/60 border border-[#EADFCA] p-3 rounded-xl shadow-xxs">
            <Phone className="h-4 w-4 text-primary shrink-0 stroke-[1.75]" />
            <div>
              <p className="font-bold">{patient.phone}</p>
              {patient.secondaryPhone && <p className="text-[10px] text-foreground/45 mt-0.5">Sec: {patient.secondaryPhone}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3.5 text-[#2B2620]/75 bg-[#FAF6EF]/60 border border-[#EADFCA] p-3 rounded-xl shadow-xxs">
            <MapPin className="h-4 w-4 text-primary shrink-0 stroke-[1.75]" />
            <span className="truncate" title={patient.address}>{patient.address || 'No address registered'}</span>
          </div>
          <div className="flex items-center gap-3.5 text-[#2B2620]/75 bg-[#FAF6EF]/60 border border-[#EADFCA] p-3 rounded-xl shadow-xxs">
            <Activity className="h-4 w-4 text-primary shrink-0 stroke-[1.75]" />
            <span className="truncate">Modality: <strong className="text-primary font-bold">{patient.treatmentModalityAssigned || 'None'}</strong></span>
          </div>
        </div>

        {/* Additional Demographics Details */}
        {(patient.email || patient.thirdPartyUid || patient.bloodGroup || patient.parentSpouseCaretakerName || patient.dateOfMarriage) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-semibold mt-1">
            {/* Email */}
            {patient.email && (
              <div className="flex flex-col gap-0.5 bg-[#FAF6EF]/40 border border-[#EADFCA] p-2.5 rounded-xl shadow-xxs">
                <span className="text-[#2B2620]/45 font-bold uppercase tracking-wider">Email</span>
                <span className="text-[#2B2620] truncate" title={patient.email}>{patient.email}</span>
              </div>
            )}
            {/* Third Party UID */}
            {patient.thirdPartyUid && (
              <div className="flex flex-col gap-0.5 bg-[#FAF6EF]/40 border border-[#EADFCA] p-2.5 rounded-xl shadow-xxs">
                <span className="text-[#2B2620]/45 font-bold uppercase tracking-wider">Third Party UID</span>
                <span className="text-[#2B2620] truncate">{patient.thirdPartyUid}</span>
              </div>
            )}
            {/* Blood Group */}
            {patient.bloodGroup && (
              <div className="flex flex-col gap-0.5 bg-[#FAF6EF]/40 border border-[#EADFCA] p-2.5 rounded-xl shadow-xxs">
                <span className="text-[#2B2620]/45 font-bold uppercase tracking-wider">Blood Group</span>
                <span className="text-primary font-bold">{patient.bloodGroup}</span>
              </div>
            )}
            {/* Caretaker */}
            {patient.parentSpouseCaretakerName && (
              <div className="col-span-2 flex flex-col gap-0.5 bg-[#FAF6EF]/40 border border-[#EADFCA] p-2.5 rounded-xl shadow-xxs">
                <span className="text-[#2B2620]/45 font-bold uppercase tracking-wider">Guardian / Caretaker Name</span>
                <span className="text-[#2B2620] truncate">{patient.parentSpouseCaretakerName}</span>
              </div>
            )}
            {/* Marriage Details */}
            {patient.dateOfMarriage && (
              <div className="col-span-2 flex flex-col gap-0.5 bg-[#FAF6EF]/40 border border-[#EADFCA] p-2.5 rounded-xl shadow-xxs">
                <span className="text-[#2B2620]/45 font-bold uppercase tracking-wider">Marriage Details</span>
                <span className="text-[#2B2620] truncate">
                  {`Married on ${new Date(patient.dateOfMarriage).toLocaleDateString()}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Active Treatment Protocol Tracker */}
        {activeProtocol && (
          <div className="bg-[#FAF6EF] border border-[#EADFCA] p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-primary stroke-[1.75]" />
                Active Clinical Protocol
              </p>
              <h4 className="font-serif font-bold text-sm text-[#2B2620]">
                {activeProtocol.name} — Step {patient.currentProtocolStep + 1} of {protocolSteps.length}
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {protocolSteps.map((step: string, idx: number) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-[10px] text-foreground/30">→</span>}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      idx === patient.currentProtocolStep 
                        ? 'bg-primary text-background border-transparent' 
                        : idx < patient.currentProtocolStep
                        ? 'bg-[#E2ECE9] text-primary border-primary/20 line-through'
                        : 'bg-[#FFFCF6] text-[#2B2620]/45 border-[#EADFCA]'
                    }`}>
                      {step}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {patient.currentProtocolStep < protocolSteps.length - 1 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleProtocolAdvance}
                className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-[#3C5040] bg-background border border-[#EADFCA] px-3.5 py-2 rounded-xl transition-colors cursor-pointer focus:outline-hidden"
              >
                Advance to Next Step
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Sub-tab Switcher */}
      <div className="flex border-b border-[#EADFCA] bg-[#FAF6EF]/30 px-6 py-2.5 gap-4 shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'documents'
              ? 'bg-primary text-background shadow-xs'
              : 'text-[#2B2620]/60 hover:bg-[#FAF6EF]'
          }`}
        >
          Documents & Case Files
        </button>
        <button
          onClick={() => setActiveTab('rom')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rom'
              ? 'bg-primary text-background shadow-xs'
              : 'text-[#2B2620]/60 hover:bg-[#FAF6EF]'
          }`}
        >
          Clinical ROM & Referrals
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-primary text-background shadow-xs'
              : 'text-[#2B2620]/60 hover:bg-[#FAF6EF]'
          }`}
        >
          Session Packages & Billing
        </button>
      </div>

      {/* Tab Contents */}

      {/* Case Documents Explorer Tab (Huge Card Placeholders) */}
      {activeTab === 'documents' && (
        <div className="p-6 space-y-8 max-w-6xl mx-auto w-full animate-fadeIn">
          {/* Header section with Create Folder and Path details */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#EADFCA] pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-primary">Case Documents Explorer</h3>
              <p className="text-xxs text-[#2B2620]/50 font-bold uppercase tracking-wider mt-0.5">Clinical files, prescriptions & lab results</p>
            </div>
            <div className="flex items-center gap-3">
              {currentPath.length > 0 && (
                <button
                  onClick={() => setCurrentPath(currentPath.slice(0, -1))}
                  className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#FAF6EF] border border-[#EADFCA] text-[#2B2620]/75 text-xs font-bold rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              )}
              <button
                onClick={() => {
                  setIsCreatingFolder(true);
                  setIsUploadingFile(false);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl shadow-xxs cursor-pointer"
              >
                <FolderPlus className="h-4 w-4" />
                New Folder
              </button>
            </div>
          </div>

          {/* Folder Path Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2B2620] bg-[#FAF6EF]/60 border border-[#EADFCA] px-4 py-2.5 rounded-xl shadow-xxs">
            <Folder className="h-4 w-4 text-primary shrink-0 fill-primary/10" />
            <button 
              onClick={() => setCurrentPath([])}
              className="hover:text-primary transition-colors cursor-pointer text-[#2B2620]/45"
            >
              Root
            </button>
            {currentPath.map((folder, index) => (
              <React.Fragment key={index}>
                <span className="text-[#EADFCA]/80">/</span>
                <button 
                  onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                  className="hover:text-primary transition-colors cursor-pointer max-w-[120px] truncate text-[#2B2620]"
                >
                  {folder}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Large Simulated Upload Dropzone Panel (Big Area) */}
          <div className="border-2 border-dashed border-[#EADFCA] hover:border-primary/60 bg-[#FAF6EF]/20 hover:bg-[#FAF6EF]/40 transition-all rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer shadow-xxs relative">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary">
              <Plus className="h-8 w-8 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-base font-serif font-bold text-[#2B2620] mb-1">Simulate Medical Document Intake</h4>
              <p className="text-xs text-[#2B2620]/60 max-w-md mx-auto">
                Select clinical files (Prescriptions, MRI scans, X-rays, lab reports) to register in the patient's record folder.
              </p>
            </div>

            <div className="w-full max-w-lg mt-3 bg-[#FFFCF6] border border-[#EADFCA] rounded-2xl p-5 text-left space-y-4 shadow-sm cursor-default" onClick={(e) => e.stopPropagation()}>
              <h5 className="font-serif font-bold text-xs text-[#2B2620] border-b border-[#EADFCA]/40 pb-1.5">Document Details</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#2B2620]/50 block mb-1 uppercase tracking-wider">File Display Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Left Knee X-Ray Report"
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    className="text-xs bg-transparent border border-[#EADFCA] bg-[#FFFCF6] rounded-xl p-2.5 w-full text-[#2B2620] font-semibold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#2B2620]/50 block mb-1 uppercase tracking-wider">Report Category</label>
                  <select
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value)}
                    className="text-xs bg-transparent border border-[#EADFCA] bg-[#FFFCF6] rounded-xl p-2.5 w-full text-[#2B2620] font-bold focus:outline-hidden"
                  >
                    <option value="PDF">PDF Report</option>
                    <option value="X-Ray">X-Ray Image</option>
                    <option value="MRI">MRI Scan</option>
                    <option value="Prescription">Prescription Slip</option>
                    <option value="Blood Test">Blood Test Lab</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#2B2620]/50 block mb-1 uppercase tracking-wider">Select File</label>
                <input 
                  type="file" 
                  onChange={(e) => setUploadFileObj(e.target.files?.[0] || null)}
                  className="text-xs w-full text-[#2B2620] font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#EADFCA]/40">
                <button 
                  onClick={handleUploadFile}
                  disabled={!uploadFileObj || !uploadFileName.trim() || isUploadingToSupabase}
                  className="px-4 py-2 bg-primary hover:bg-[#3C5040] disabled:opacity-50 text-background text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xxs flex items-center gap-1.5"
                >
                  {isUploadingToSupabase && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isUploadingToSupabase ? 'Uploading...' : 'Upload & Scan File'}
                </button>
              </div>
            </div>
          </div>

          {/* Folder creation form */}
          {isCreatingFolder && (
            <div className="flex gap-3 items-center bg-[#FAF6EF]/60 p-3 border border-[#EADFCA]/70 rounded-2xl shadow-xxs">
              <input 
                type="text" 
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="text-xs bg-transparent border-0 outline-hidden focus:ring-0 p-2 w-full text-[#2B2620] font-semibold focus:outline-hidden"
              />
              <button 
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl cursor-pointer transition-colors whitespace-nowrap shadow-xxs"
              >
                Create Folder
              </button>
              <button 
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 hover:bg-[#FAF6EF] border border-[#EADFCA] text-[#2B2620]/60 text-xs font-bold rounded-xl cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Documents Grid View (Huge Card Placeholders) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/45 mb-4">
              Folder Contents ({currentFolders.length} folders, {files.length} documents)
            </h4>

            {currentFolders.length === 0 && files.length === 0 ? (
              <div className="bg-[#FAF6EF]/40 border border-[#EADFCA] rounded-3xl p-12 text-center">
                <p className="text-sm text-foreground/50 italic font-medium">This folder is currently empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Render folders first (Huge Folder Cards) */}
                {currentFolders.map((folder) => (
                  <div 
                    key={folder}
                    onClick={() => setCurrentPath([...currentPath, folder])}
                    className="group bg-[#FFFCF6] border border-[#EADFCA] hover:border-primary rounded-2xl p-6 flex flex-col items-center justify-center gap-3.5 cursor-pointer transition-all shadow-xs hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="p-4 bg-primary/10 rounded-2xl text-primary group-hover:scale-105 transition-all">
                      <Folder className="h-10 w-10 fill-primary/10" />
                    </div>
                    <span className="font-serif font-bold text-sm text-[#2B2620] truncate text-center w-full px-2">{folder}</span>
                    <span className="text-[10px] text-[#2B2620]/50 font-bold uppercase tracking-wide">Directory Folder</span>
                  </div>
                ))}

                {/* Render files (Huge Document Cards) */}
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    onClick={() => setViewingDoc(file)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className="group bg-[#FFFCF6] border border-[#EADFCA] hover:border-primary rounded-2xl p-6 flex flex-col items-center justify-center gap-3.5 cursor-pointer transition-all shadow-sm hover:shadow-md relative overflow-hidden"
                  >
                    {/* Delete file button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setConfirmDelete({
                          isOpen: true,
                          title: 'Remove Document',
                          message: `Are you sure you want to permanently remove "${file.displayName}" from this patient's records?`,
                          onConfirm: () => {
                            const updatedAttachments = patient.attachments.filter((a: any) => a.id !== file.id);
                            updatePatientMutation.mutate({ attachments: updatedAttachments });
                            setConfirmDelete(prev => ({ ...prev, isOpen: false }));
                          }
                        });
                      }}
                      className="absolute top-3 right-3 p-1 rounded-lg hover:bg-red-50 text-[#2B2620]/40 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete document"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className={`p-4 rounded-2xl group-hover:scale-105 transition-all ${
                      file.fileType === 'Prescription' ? 'bg-orange-500/10 text-orange-600' :
                      file.fileType === 'MRI' ? 'bg-indigo-500/10 text-indigo-600' :
                      file.fileType === 'X-Ray' ? 'bg-cyan-500/10 text-cyan-600' :
                      'bg-primary/10 text-primary'
                    }`}>
                      <FileText className="h-10 w-10 stroke-[1.75]" />
                    </div>
                    <div className="text-center w-full px-2 space-y-1">
                      <p className="font-serif font-bold text-sm text-[#2B2620] truncate w-full" title={file.displayName}>
                        {file.displayName}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          file.fileType === 'Prescription' ? 'bg-orange-500/15 text-orange-700 border border-orange-500/20' :
                          file.fileType === 'MRI' ? 'bg-indigo-500/15 text-indigo-700 border border-indigo-500/20' :
                          file.fileType === 'X-Ray' ? 'bg-cyan-500/15 text-cyan-700 border border-cyan-500/20' :
                          'bg-primary/15 text-primary border border-primary/20'
                        }`}>
                          {file.fileType}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary tracking-wider uppercase mt-2">
                      <FileDown className="h-4 w-4" />
                      View File
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ROM & Referrals Checklist Tab */}
      {activeTab === 'rom' && (
        <div className="p-6 space-y-8 max-w-5xl mx-auto w-full animate-fadeIn grid grid-cols-1 md:grid-cols-2 gap-8 divide-x-0 md:divide-x divide-[#EADFCA]">
          {/* Left panel: Referring Doctor & Checklist */}
          <div className="space-y-6 md:pr-8">
            <h3 className="text-lg font-serif font-bold text-primary border-b border-[#EADFCA]/60 pb-2">Referring Doctor & Onboarding</h3>
            
            {patient.referringDoctor && patient.referringDoctor !== 'Self / Direct' ? (
              <div className="bg-[#FAF6EF]/60 border border-[#EADFCA] p-5 rounded-2xl space-y-4 shadow-xxs">
                <div>
                  <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-wider">Referrer Doctor Name</p>
                  <h4 className="text-base font-serif font-bold text-primary mt-0.5">{patient.referringDoctor}</h4>
                </div>

                <div className="space-y-3.5 pt-1 border-t border-[#EADFCA]/40">
                  <h5 className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider">Onboarding Checklist</h5>
                  
                  <label className="flex items-start gap-2.5 text-xs font-semibold text-[#2B2620] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isThankYouSent}
                      onChange={handleToggleThankYou}
                      className="mt-0.5 rounded border-[#EADFCA] text-primary focus:ring-primary focus:outline-hidden"
                    />
                    <div className="space-y-0.5">
                      <p className={isThankYouSent ? 'line-through text-foreground/45' : ''}>Thank-You Note Sent</p>
                      <p className="text-[9px] text-foreground/40 font-semibold leading-none">Send greeting note to referring doctor</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs font-semibold text-[#2B2620] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isDischargeSent}
                      onChange={handleToggleDischarge}
                      className="mt-0.5 rounded border-[#EADFCA] text-primary focus:ring-primary focus:outline-hidden"
                    />
                    <div className="space-y-0.5">
                      <p className={isDischargeSent ? 'line-through text-foreground/45' : ''}>Discharge Summary Sent</p>
                      <p className="text-[9px] text-foreground/40 font-semibold leading-none">Send final progress report to referring doctor</p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAF6EF]/40 border border-[#EADFCA] p-5 rounded-2xl">
                <p className="text-xs text-foreground/40 font-semibold">Patient registered as Direct Intake. No referring doctor checklist required.</p>
              </div>
            )}

            {/* Handout Shared History */}
            <div className="space-y-4 pt-4 border-t border-[#EADFCA]/60">
              <div className="flex justify-between items-center border-b border-[#EADFCA] pb-2">
                <h4 className="text-base font-serif font-bold text-primary">Patient Handouts Library</h4>
                <Share2 className="h-4.5 w-4.5 text-primary stroke-[1.75]" />
              </div>

              {handouts.length === 0 ? (
                <p className="text-xs text-foreground/50 italic font-medium">No education files in library.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {handouts.map((h: any) => (
                    <div key={h.id} className="p-3 border border-[#EADFCA] rounded-xl bg-[#FAF6EF] flex justify-between items-center gap-3">
                      <div className="truncate">
                        <p className="text-xs font-serif font-bold text-[#2B2620] truncate">{h.title}</p>
                        <p style={{ fontSize: '9px', lineHeight: '12px' }} className="text-[#2B2620]/50 font-bold uppercase mt-1">{h.category} • {h.fileType}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => shareHandoutMutation.mutate({
                          patientId,
                          handoutId: h.id,
                          sentVia: 'whatsapp',
                        })}
                        className="p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors cursor-pointer border-0"
                        title="Share via WhatsApp"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}

              {patient.sentHandouts && patient.sentHandouts.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#EADFCA]/60">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground/45">Sent Handout History</h4>
                  <div className="space-y-2">
                    {patient.sentHandouts.map((sent: any) => (
                      <div key={sent.id} className="p-2 border border-[#EADFCA] bg-[#FAF6EF]/50 rounded-xl text-xxs font-semibold text-[#2B2620]">
                        <p className="font-bold">{sent.handout.title}</p>
                        <p className="text-foreground/45 mt-0.5">Shared via {sent.sentVia} on {new Date(sent.sentAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Patient Outreach & Communication Section */}
            <div className="space-y-4 pt-6 border-t border-[#EADFCA]/60">
              <div className="flex justify-between items-center border-b border-[#EADFCA] pb-2">
                <h4 className="text-base font-serif font-bold text-primary">Patient Communication & Outreach</h4>
                <Share2 className="h-4.5 w-4.5 text-primary stroke-[1.75]" />
              </div>
              <p className="text-xxs text-[#2B2620]/50 font-bold uppercase tracking-wider -mt-2">Select a template to send outreach message directly to patient's WhatsApp</p>

              <div className="bg-[#FAF6EF]/60 border border-[#EADFCA] p-4 rounded-2xl space-y-4.5 shadow-xxs">
                {/* Onboarding Welcome Template */}
                <div className="space-y-2">
                  <label className="flex items-start gap-3 text-xs font-semibold text-[#2B2620] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isPatientWelcomeSent}
                      onChange={handleTogglePatientWelcome}
                      className="mt-1 rounded border-[#EADFCA] text-primary focus:ring-primary focus:outline-hidden"
                    />
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-primary">1. Welcome & Intake Greeting</span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                          isPatientWelcomeSent ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-foreground/5 text-foreground/40'
                        }`}>
                          {isPatientWelcomeSent ? 'Sent via WhatsApp' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xxs bg-[#FFFCF6] border border-[#EADFCA]/40 p-2.5 rounded-xl text-[#2B2620]/75 leading-relaxed font-medium">
                        "Hi {patient?.fullName}, welcome to Health 360! We are excited to support you on your recovery journey. Your clinical case file has been successfully registered. Feel free to message us here if you have any questions."
                      </p>
                    </div>
                  </label>
                </div>

                {/* Appointment Confirmation Template */}
                <div className="space-y-2">
                  <label className="flex items-start gap-3 text-xs font-semibold text-[#2B2620] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isPatientBookingSent}
                      onChange={handleTogglePatientBooking}
                      className="mt-1 rounded border-[#EADFCA] text-primary focus:ring-primary focus:outline-hidden"
                    />
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-primary">2. Appointment Slot Confirmation</span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                          isPatientBookingSent ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-foreground/5 text-foreground/40'
                        }`}>
                          {isPatientBookingSent ? 'Sent via WhatsApp' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xxs bg-[#FFFCF6] border border-[#EADFCA]/40 p-2.5 rounded-xl text-[#2B2620]/75 leading-relaxed font-medium">
                        "Dear {patient?.fullName}, your upcoming therapy session is confirmed. We look forward to seeing you. Please check your assigned timing in the portal or reply directly if you need to reschedule."
                      </p>
                    </div>
                  </label>
                </div>

                {/* HEP Reminder Template */}
                <div className="space-y-2">
                  <label className="flex items-start gap-3 text-xs font-semibold text-[#2B2620] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isPatientHEPSent}
                      onChange={handleTogglePatientHEP}
                      className="mt-1 rounded border-[#EADFCA] text-primary focus:ring-primary focus:outline-hidden"
                    />
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-primary">3. Home Exercise Program (HEP) Reminder</span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                          isPatientHEPSent ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-foreground/5 text-foreground/40'
                        }`}>
                          {isPatientHEPSent ? 'Sent via WhatsApp' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xxs bg-[#FFFCF6] border border-[#EADFCA]/40 p-2.5 rounded-xl text-[#2B2620]/75 leading-relaxed font-medium">
                        "Hello {patient?.fullName}! This is a gentle reminder from Health 360 to perform your prescribed physical therapy exercises today. Consistent daily movement is key to your fast rehabilitation!"
                      </p>
                    </div>
                  </label>
                </div>

                {/* Post-Session Care Feedback Template */}
                <div className="space-y-2">
                  <label className="flex items-start gap-3 text-xs font-semibold text-[#2B2620] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isPatientFeedbackSent}
                      onChange={handleTogglePatientFeedback}
                      className="mt-1 rounded border-[#EADFCA] text-primary focus:ring-primary focus:outline-hidden"
                    />
                    <div className="space-y-1 w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-primary">4. Post-Session Care & Feedback</span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                          isPatientFeedbackSent ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-foreground/5 text-foreground/40'
                        }`}>
                          {isPatientFeedbackSent ? 'Sent via WhatsApp' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xxs bg-[#FFFCF6] border border-[#EADFCA]/40 p-2.5 rounded-xl text-[#2B2620]/75 leading-relaxed font-medium">
                        "Hi {patient?.fullName}, we hope you are feeling better after your session today. Please stay hydrated and rest the joint. Please let us know how your pain levels look tomorrow morning!"
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: ROM progress */}
          <div className="space-y-6 md:pl-8">
            <div className="flex justify-between items-center border-b border-[#EADFCA]/60 pb-2">
              <h3 className="text-lg font-serif font-bold text-primary">ROM Joint Progress</h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsRomUploading(true)}
                className="p-1 text-primary hover:bg-[#FAF6EF] rounded-lg border border-[#EADFCA] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            </div>

            {romFiles.length === 0 ? (
              <div className="bg-[#FAF6EF]/40 border border-[#EADFCA] p-6 rounded-2xl text-center">
                <p className="text-xs text-foreground/50 italic font-semibold">No joint ROM photos logged yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {romFiles.map((file: any) => {
                  const isBefore = file.name.toLowerCase().includes('before');
                  return (
                    <div key={file.id} className="relative rounded-2xl overflow-hidden border border-[#EADFCA] bg-[#FAF6EF] shadow-xxs">
                      <img src={file.url} alt={file.name} className="w-full h-32 object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 flex items-center justify-between text-[10px] font-bold text-white">
                        <span className="truncate max-w-[70%]">{file.name.split('_')[1] || 'Joint'}</span>
                        <span className={`px-2 py-0.5 rounded-md ${isBefore ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                          {isBefore ? 'Before' : 'After'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dictation Box Console Overlay */}
      <AnimatePresence>
        {isDictating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            <div className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md" onClick={() => setIsDictating(false)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative bg-card border border-[#EADFCA] w-full max-w-xl rounded-3xl shadow-[0_24px_50px_rgba(42,38,32,0.15)] overflow-hidden flex flex-col z-10"
              style={{ backgroundColor: '#FFFCF6', borderColor: '#EADFCA' }}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#EADFCA]/60">
                <h3 className="text-xl font-serif font-bold text-[#2B2620]">AI Dictation & SOAP Writer</h3>
                <button onClick={() => setIsDictating(false)} className="p-1 rounded-full hover:bg-[#FAF6EF] text-[#2B2620]/50 hover:text-[#2B2620] cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Dictation Body */}
              <div className="p-6 space-y-4">
                <div className="flex justify-center py-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={startMockDictation}
                    className="flex flex-col items-center justify-center bg-primary/10 border border-primary/20 rounded-full h-16 w-16 text-primary hover:bg-primary/20 transition-all cursor-pointer focus:outline-hidden"
                  >
                    <Mic className="h-6 w-6 animate-pulse" />
                  </motion.button>
                </div>

                <div className="space-y-1">
                  <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60">Raw Session Transcript</label>
                  <textarea
                    rows={4}
                    value={dictatedText}
                    onChange={(e) => setDictatedText(e.target.value)}
                    placeholder="Click the microphone or type raw symptoms, observations, and treatment outcomes..."
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] p-3 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold leading-relaxed"
                  />
                </div>

                {soapPreview ? (
                  <div className="space-y-2">
                    <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60">Structured SOAP Note Preview</label>
                    <div className="bg-[#FAF6EF] border border-[#EADFCA] p-4 rounded-xl text-[11px] leading-relaxed max-h-48 overflow-y-auto font-mono text-[#2B2620] whitespace-pre-wrap">
                      {soapPreview}
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-end gap-3 pt-3 border-t border-[#EADFCA]/60">
                  <button
                    onClick={() => {
                      setDictatedText('');
                      setSoapPreview('');
                    }}
                    className="px-4 py-2 border border-[#EADFCA] hover:bg-[#FAF6EF] text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden"
                  >
                    Clear
                  </button>
                  {soapPreview ? (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={saveSoapNote}
                      className="px-4 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save & Append Note
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={generateSOAPNote}
                      disabled={isSoapGenerating || !dictatedText}
                      className="px-4 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden flex items-center gap-1.5"
                    >
                      {isSoapGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Generate SOAP
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ROM Upload Simulator Sheet */}
      <AnimatePresence>
        {isRomUploading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            <div className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md" onClick={() => setIsRomUploading(false)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative bg-card border border-[#EADFCA] w-full max-w-sm rounded-3xl shadow-[0_24px_50px_rgba(42,38,32,0.15)] overflow-hidden flex flex-col z-10"
              style={{ backgroundColor: '#FFFCF6', borderColor: '#EADFCA' }}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-[#EADFCA]/60">
                <h3 className="text-lg font-serif font-bold text-[#2B2620]">Log ROM Progress</h3>
                <button onClick={() => setIsRomUploading(false)} className="p-1 rounded-full hover:bg-[#FAF6EF] text-[#2B2620]/50 hover:text-[#2B2620] cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Joint Area</label>
                  <select
                    value={romJoint}
                    onChange={(e) => setRomJoint(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                  >
                    <option value="Knee Flexion">Knee Flexion</option>
                    <option value="Knee Extension">Knee Extension</option>
                    <option value="Shoulder Abduction">Shoulder Abduction</option>
                    <option value="Shoulder Rotation">Shoulder Rotation</option>
                  </select>
                </div>

                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Angle (Degrees)</label>
                  <input
                    type="number"
                    value={romAngle}
                    onChange={(e) => setRomAngle(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Rehab Stage</label>
                  <div className="flex gap-4">
                    {['Before', 'After'].map((stage) => (
                      <label key={stage} className="flex items-center gap-1.5 text-xs text-[#2B2620] font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="romStage"
                          checked={romStage === stage}
                          onChange={() => setRomStage(stage)}
                          className="accent-primary"
                        />
                        {stage} Rehab
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#EADFCA]/60">
                  <button
                    onClick={() => setIsRomUploading(false)}
                    className="px-4 py-2 border border-[#EADFCA] hover:bg-[#FAF6EF] text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRomUploadSimulate}
                    className="px-4 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Simulate Capture
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Billing & Packages Tab */}
      {activeTab === 'billing' && (
        <div className="p-6 space-y-6 max-w-4xl mx-auto w-full animate-fadeIn">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4 border-b border-[#EADFCA] pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-primary">Session Packages</h3>
              <p className="text-xxs text-[#2B2620]/50 font-bold uppercase tracking-wider mt-0.5">Manage prepaid treatments and deduct visits</p>
            </div>
            <button
              onClick={() => {
                setPackageName('');
                setTotalSessions(10);
                setSubNamesInput(Array(10).fill(''));
                setIsAddingPackage(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl transition-all shadow-xxs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add New Package
            </button>
          </div>

          {packages.length === 0 ? (
             <div className="p-16 text-center text-foreground/45 border border-dashed border-[#EADFCA] rounded-2xl font-bold bg-[#FFFCF6]">
               No active session packages for this patient.
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg: any) => {
                let subSessionsList: string[] = [];
                try {
                  if (pkg.subSessionNames) {
                    subSessionsList = JSON.parse(pkg.subSessionNames);
                  }
                } catch (e) {
                  subSessionsList = pkg.subSessionNames ? pkg.subSessionNames.split(',') : [];
                }

                let subSessionsNotesList: string[] = [];
                try {
                  if (pkg.subSessionNotes) {
                    subSessionsNotesList = JSON.parse(pkg.subSessionNotes);
                  }
                } catch (e) {
                  subSessionsNotesList = [];
                }
                while (subSessionsNotesList.length < subSessionsList.length) {
                  subSessionsNotesList.push('');
                }

                const price = pkg.price || 0;
                const paid = pkg.paidAmount || 0;
                const balance = price - paid;

                return (
                  <div key={pkg.id} className="bg-[#FFFCF6] border border-[#EADFCA] rounded-2xl p-5 shadow-xxs flex flex-col justify-between">
                    <div>
                      {/* Package Title and Delete */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-[#2B2620]">{pkg.packageName}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                            pkg.paymentStatus === 'PAID' ? 'bg-primary/10 text-primary border-primary/20' :
                            pkg.paymentStatus === 'PARTIAL' ? 'bg-orange-500/10 text-orange-700 border-orange-500/20' :
                            'bg-red-500/10 text-red-700 border-red-500/20'
                          }`}>
                            {pkg.paymentStatus}
                          </span>
                          <button
                            onClick={() => {
                              setEditingPackageId(pkg.id);
                              setEditPackageName(pkg.packageName);
                              setEditTotalSessions(pkg.totalSessions);
                              setEditSubNamesInput(subSessionsList);
                              setEditPackagePrice(pkg.price ? pkg.price.toString() : '');
                              setEditPackagePaid(pkg.paidAmount ? pkg.paidAmount.toString() : '');
                              setIsEditingPackage(true);
                            }}
                            className="p-1 text-[#2B2620]/60 hover:text-primary hover:bg-[#FAF6EF] rounded-lg transition-colors cursor-pointer"
                            title="Edit Package Details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDelete({
                                isOpen: true,
                                title: 'Delete Session Package',
                                message: `Are you sure you want to permanently delete "${pkg.packageName}"? This action cannot be undone.`,
                                onConfirm: async () => {
                                  const res = await fetch(`/api/packages/${pkg.id}`, {
                                    method: 'DELETE'
                                  });
                                  if (res.ok) {
                                    refetchPackages();
                                  }
                                  setConfirmDelete(prev => ({ ...prev, isOpen: false }));
                                }
                              });
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Package"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Pricing Info */}
                      <div className="grid grid-cols-3 gap-2 bg-[#FAF6EF]/50 border border-[#EADFCA]/40 p-2.5 rounded-xl text-[10px] font-bold text-[#2B2620]/75 mb-3">
                        <div>
                          <span className="text-[#2B2620]/45 block text-[8px] uppercase tracking-wider">Total Price</span>
                          <span>₹{price.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[#2B2620]/45 block text-[8px] uppercase tracking-wider">Paid</span>
                          <span className="flex items-center gap-1">
                            ₹{paid.toLocaleString()}
                            <button 
                              onClick={async () => {
                                const newVal = prompt(`Update Paid Amount (Current: ₹${paid}):`, paid.toString());
                                if (newVal === null) return;
                                const parsed = parseFloat(newVal);
                                if (isNaN(parsed)) return alert('Invalid number');
                                const res = await fetch(`/api/packages/${pkg.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ paidAmount: parsed })
                                });
                                if (res.ok) refetchPackages();
                              }}
                              className="text-primary hover:underline font-semibold"
                            >
                              (Edit)
                            </button>
                          </span>
                        </div>
                        <div>
                          <span className="text-[#2B2620]/45 block text-[8px] uppercase tracking-wider">Balance</span>
                          <span className={balance > 0 ? 'text-orange-600' : 'text-primary'}>₹{balance.toLocaleString()}</span>
                        </div>
                      </div>

                      <p className="text-xs text-[#2B2620]/60 font-semibold mb-3">
                        {pkg.sessionsUsed} of {pkg.totalSessions} sessions completed.
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-[#EADFCA]/40 rounded-full h-2 mb-4">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${(pkg.sessionsUsed / pkg.totalSessions) * 100}%` }}
                        ></div>
                      </div>

                      {/* Sub-sessions checklist */}
                      {subSessionsList.length > 0 && (
                        <div className="mt-3 border-t border-[#EADFCA]/40 pt-3 max-h-48 overflow-y-auto space-y-1 bg-[#FAF6EF]/20 rounded-xl p-2 border border-[#EADFCA]/30">
                          <p className="text-[9px] font-bold text-[#2B2620]/50 uppercase tracking-wider mb-1 px-1">Session Checklist & SOAP Notes</p>
                          {subSessionsList.map((name: string, idx: number) => {
                            const isCompleted = idx < pkg.sessionsUsed;
                            return (
                              <div key={idx} className="flex items-center justify-between py-1 px-1 hover:bg-[#FAF6EF]/50 rounded-lg group/item transition-colors">
                                <label className="flex items-center gap-2 text-xs text-[#2B2620] font-semibold cursor-pointer select-none">
                                  <input 
                                    type="checkbox" 
                                    checked={isCompleted}
                                    onChange={async () => {
                                      const newUsed = isCompleted ? idx : idx + 1;
                                      const res = await fetch(`/api/packages/${pkg.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ sessionsUsed: newUsed })
                                      });
                                      if (res.ok) refetchPackages();
                                    }}
                                    className="accent-primary h-3.5 w-3.5 cursor-pointer"
                                  />
                                  <span className={isCompleted ? 'line-through text-[#2B2620]/45 font-medium' : ''}>
                                    {name || `Session ${idx + 1}`}
                                  </span>
                                </label>
                                
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {subSessionsNotesList[idx] && (
                                    <span className="text-[8px] bg-primary/10 text-primary border border-primary/20 font-bold px-1.5 py-0.5 rounded-md">
                                      Has Notes
                                    </span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setCurrentSessionNotesText(subSessionsNotesList[idx] || '');
                                      setEditingNotesSessionIdx({ pkgId: pkg.id, idx });
                                    }}
                                    className="p-1.5 rounded-lg border border-[#EADFCA] bg-[#FAF6EF]/60 hover:bg-[#EADFCA]/40 text-[#2B2620]/60 hover:text-primary transition-all cursor-pointer"
                                    title="Add/Edit Session Notes"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <button
                      disabled={pkg.sessionsUsed >= pkg.totalSessions}
                      onClick={async () => {
                        const res = await fetch(`/api/packages/${pkg.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ sessionsUsed: pkg.sessionsUsed + 1 })
                        });
                        if (res.ok) {
                          refetchPackages();
                        }
                      }}
                      className="w-full mt-4 py-2 bg-[#FAF6EF] hover:bg-[#EADFCA] text-[#2B2620] text-xs font-bold rounded-xl border border-[#EADFCA] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {pkg.sessionsUsed >= pkg.totalSessions ? 'Package Completed' : 'Deduct Session'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add New Package Modal */}
      <AnimatePresence>
        {isAddingPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            <div className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md" onClick={() => setIsAddingPackage(false)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-3xl shadow-xl w-full max-w-md flex flex-col z-10 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-serif font-bold text-primary mb-2">Create Session Package</h3>
              <p className="text-xs text-[#2B2620]/60 font-semibold mb-4">Set up prepaid treatment session plans for the patient.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Package Main Name</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Class IV Laser Sessions"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Total Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={packagePrice}
                      onChange={(e) => setPackagePrice(e.target.value)}
                      className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Amount Paid (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={packagePaid}
                      onChange={(e) => setPackagePaid(e.target.value)}
                      className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Total Sessions</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={totalSessions}
                    onChange={(e) => handleTotalSessionsChange(parseInt(e.target.value) || 1)}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                  />
                </div>
                
                <div className="space-y-2 border-t border-[#EADFCA]/60 pt-3">
                  <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 block">Individual Session Names (Sub-names)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {Array.from({ length: totalSessions }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#2B2620]/50 w-6">#{idx + 1}</span>
                        <input
                          type="text"
                          placeholder={`Session ${idx + 1} specific focus`}
                          value={subNamesInput[idx] || ''}
                          onChange={(e) => {
                            const next = [...subNamesInput];
                            next[idx] = e.target.value;
                            setSubNamesInput(next);
                          }}
                          className="block flex-1 text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-1.5 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#EADFCA]/60">
                  <button
                    onClick={() => setIsAddingPackage(false)}
                    className="px-4 py-2 border border-[#EADFCA] hover:bg-[#FAF6EF] text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!packageName.trim()) return alert('Please enter package name');
                      const priceVal = parseFloat(packagePrice) || 0;
                      const paidVal = parseFloat(packagePaid) || 0;
                      
                      const res = await fetch('/api/packages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          patientId,
                          packageName,
                          totalSessions,
                          price: priceVal,
                          paidAmount: paidVal,
                          subSessionNames: JSON.stringify(subNamesInput),
                        })
                      });
                      if (res.ok) {
                        refetchPackages();
                        setIsAddingPackage(false);
                        setPackageName('');
                        setPackagePrice('');
                        setPackagePaid('');
                        handleTotalSessionsChange(10);
                      } else {
                        alert('Failed to create package');
                      }
                    }}
                    className="px-4 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Save Package
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Existing Package Modal */}
      <AnimatePresence>
        {isEditingPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            <div className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md" onClick={() => setIsEditingPackage(false)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-3xl shadow-xl w-full max-w-md flex flex-col z-10 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-serif font-bold text-primary mb-2">Edit Session Package</h3>
              <p className="text-xs text-[#2B2620]/60 font-semibold mb-4">Modify the package details or session focus names.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Package Main Name</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Class IV Laser Sessions"
                    value={editPackageName}
                    onChange={(e) => setEditPackageName(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Total Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={editPackagePrice}
                      onChange={(e) => setEditPackagePrice(e.target.value)}
                      className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Amount Paid (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={editPackagePaid}
                      onChange={(e) => setEditPackagePaid(e.target.value)}
                      className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Total Sessions</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editTotalSessions}
                    onChange={(e) => handleEditTotalSessionsChange(parseInt(e.target.value) || 1)}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-2 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                  />
                </div>
                
                <div className="space-y-2 border-t border-[#EADFCA]/60 pt-3">
                  <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 block">Individual Session Names (Sub-names)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {Array.from({ length: editTotalSessions }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#2B2620]/50 w-6">#{idx + 1}</span>
                        <input
                          type="text"
                          placeholder={`Session ${idx + 1} specific focus`}
                          value={editSubNamesInput[idx] || ''}
                          onChange={(e) => {
                            const next = [...editSubNamesInput];
                            next[idx] = e.target.value;
                            setEditSubNamesInput(next);
                          }}
                          className="block flex-1 text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] px-3 py-1.5 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#EADFCA]/60">
                  <button
                    onClick={() => setIsEditingPackage(false)}
                    className="px-4 py-2 border border-[#EADFCA] hover:bg-[#FAF6EF] text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!editPackageName.trim()) return alert('Please enter package name');
                      const priceVal = parseFloat(editPackagePrice) || 0;
                      const paidVal = parseFloat(editPackagePaid) || 0;
                      
                      const res = await fetch(`/api/packages/${editingPackageId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          packageName: editPackageName,
                          totalSessions: editTotalSessions,
                          price: priceVal,
                          paidAmount: paidVal,
                          subSessionNames: JSON.stringify(editSubNamesInput),
                        })
                      });
                      if (res.ok) {
                        refetchPackages();
                        setIsEditingPackage(false);
                      } else {
                        alert('Failed to update package');
                      }
                    }}
                    className="px-4 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Session Notes Modal */}
      <AnimatePresence>
        {editingNotesSessionIdx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            <div className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md" onClick={() => setEditingNotesSessionIdx(null)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-3xl shadow-xl w-full max-w-lg flex flex-col z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-serif font-bold text-primary mb-1">Session SOAP & Treatment Note</h3>
              <p className="text-xxs text-[#2B2620]/50 font-bold uppercase tracking-wider mb-4">
                Session #{editingNotesSessionIdx.idx + 1} specific documentation
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-[#2B2620]/60 mb-1 block">Clinical Notes</label>
                  <textarea
                    rows={6}
                    placeholder="Enter visit details, SOAP notes, pain levels, or range of motion outcomes for this session..."
                    value={currentSessionNotesText}
                    onChange={(e) => setCurrentSessionNotesText(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-[#EADFCA] bg-[#FAF6EF] p-3 text-[#2B2620] focus:border-primary focus:outline-hidden font-semibold leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#EADFCA]/60">
                  <button
                    onClick={() => setEditingNotesSessionIdx(null)}
                    className="px-4 py-2 border border-[#EADFCA] hover:bg-[#FAF6EF] text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const { pkgId, idx } = editingNotesSessionIdx;
                      const pkg = packages.find((p: any) => p.id === pkgId);
                      if (!pkg) return;

                      let subNotes: string[] = [];
                      try {
                        if (pkg.subSessionNotes) {
                          subNotes = JSON.parse(pkg.subSessionNotes);
                        }
                      } catch (e) {}

                      while (subNotes.length < pkg.totalSessions) {
                        subNotes.push('');
                      }

                      subNotes[idx] = currentSessionNotesText;

                      const res = await fetch(`/api/packages/${pkgId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          subSessionNotes: JSON.stringify(subNotes)
                        })
                      });

                      if (res.ok) {
                        refetchPackages();
                        setEditingNotesSessionIdx(null);
                        setCurrentSessionNotesText('');
                      } else {
                        alert('Failed to save session notes');
                      }
                    }}
                    className="px-4 py-2 bg-primary hover:bg-[#3C5040] text-background text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {viewingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            <div className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md" onClick={() => setViewingDoc(null)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-3xl shadow-xl w-full max-w-3xl flex flex-col z-10 max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#EADFCA]/60 mb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#2B2620]">{viewingDoc.displayName}</h3>
                  <p className="text-[10px] text-[#2B2620]/50 font-bold uppercase tracking-wider">{viewingDoc.fileType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={viewingDoc.url} 
                    download 
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-[#EADFCA] hover:bg-[#FAF6EF] text-[#2B2620] cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button onClick={() => setViewingDoc(null)} className="p-2 rounded-xl border border-[#EADFCA] hover:bg-[#FAF6EF] text-[#2B2620] cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-[350px] bg-[#FAF6EF]/40 rounded-2xl border border-[#EADFCA]/60 p-4">
                {viewingDoc.url.toLowerCase().endsWith('.pdf') || viewingDoc.fileType === 'PDF' ? (
                  <iframe src={viewingDoc.url} className="w-full h-[55vh] rounded-xl border-0" />
                ) : viewingDoc.url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) || ['X-Ray', 'MRI'].includes(viewingDoc.fileType) ? (
                  <img src={viewingDoc.url} alt={viewingDoc.displayName} className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-xs" />
                ) : (
                  <div className="text-center py-10 space-y-3">
                    <File className="h-12 w-12 text-[#2B2620]/30 mx-auto" />
                    <p className="text-xs text-[#2B2620]/60 font-semibold">Preview not supported for this file type.</p>
                    <a 
                      href={viewingDoc.url} 
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-4 py-2 bg-primary text-background text-xs font-bold rounded-xl"
                    >
                      Open in New Tab
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDelete.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            <div className="absolute inset-0 bg-[#2B2620]/30 backdrop-blur-md" onClick={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-3xl shadow-xl w-full max-w-sm flex flex-col z-10 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#2B2620] mb-2">{confirmDelete.title}</h3>
              <p className="text-xs text-[#2B2620]/60 font-semibold mb-6">{confirmDelete.message}</p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 border border-[#EADFCA] hover:bg-[#FAF6EF] text-xs font-bold rounded-xl cursor-pointer flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete.onConfirm}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl cursor-pointer flex-1"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
