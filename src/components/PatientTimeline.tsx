'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
import { sendWhatsAppNotification } from '@/lib/whatsappTemplates';
import CourseMeter from '@/components/billing/CourseMeter';
import SellCourseModal from '@/components/billing/SellCourseModal';
import EditPatientModal from '@/components/EditPatientModal';

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

const getDisplayUrl = (url: string) => {
  if (!url) return '';
  const cleanUrl = url.replace(/['"]/g, '');
  const searchStr = '/storage/v1/object/public/health360_documents/';
  const index = cleanUrl.indexOf(searchStr);
  if (index !== -1) {
    const filePath = cleanUrl.substring(index + searchStr.length);
    return `/api/patients/view?path=${encodeURIComponent(filePath)}`;
  }
  return cleanUrl;
};

export default function PatientTimeline({ patientId, onBack }: Props) {
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

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
  const [activeTab, setActiveTab] = useState<'documents' | 'rom' | 'billing' | 'assessments'>('billing');
  const [isSellCourseModalOpen, setIsSellCourseModalOpen] = useState(false);

  // WhatsApp real messaging states
  const [showApptModal, setShowApptModal] = useState(false);
  const [nextApptDate, setNextApptDate] = useState('');
  const [nextApptTime, setNextApptTime] = useState('');
  const [whatsappSending, setWhatsappSending] = useState<string | null>(null);
  const [whatsappSuccess, setWhatsappSuccess] = useState<string | null>(null);

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

  const [confirmWhatsappModal, setConfirmWhatsappModal] = useState<{
    isOpen: boolean;
    title: string;
    templateBadge?: string;
    recipientName: string;
    phone: string;
    messagePreview: string;
    waUrl?: string;
  }>({
    isOpen: false,
    title: '',
    templateBadge: '',
    recipientName: '',
    phone: '',
    messagePreview: '',
    waUrl: '',
  });
  const whatsappConfirmActionRef = useRef<(() => void) | null>(null);

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
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
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
      <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-3xl">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
        <p className="text-sm text-white/60 mt-2 font-medium">Retrieving clinical history...</p>
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
            url: getDisplayUrl(a.url),
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
    
    let filePath = '';
    try {
      const fileExt = uploadFileObj.name.split('.').pop();
      const fileName = `${Date.now()}_${uploadFileName.replace(/\s+/g, '_')}.${fileExt}`;
      filePath = `${patientId}/${fileName}`;
      
      const compressedBlob = await compressImage(uploadFileObj);

      // Upload via our backend API to bypass DNS, CORS, and adblocker bugs completely!
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
        throw new Error(errorData.error || `HTTP ${uploadRes.status}`);
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
      
      // Detailed diagnostics for debugging
      const supabaseUrlVal = process.env.NEXT_PUBLIC_SUPABASE_URL || 'undefined';
      const cleanUrlVal = supabaseUrlVal.replace(/['"]/g, '');
      const anonKeyVal = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'undefined';
      
      alert(
        `Failed to upload file!\n\n` +
        `Error Message: ${err.message || 'Unknown'}\n` +
        `Error Name: ${err.name || 'Unknown'}\n\n` +
        `Diagnostics:\n` +
        `- Original Env URL: ${supabaseUrlVal}\n` +
        `- Sanitized URL: ${cleanUrlVal}\n` +
        `- Anon Key Length: ${anonKeyVal.length} (Starts with: ${anonKeyVal.substring(0, 10)}...)\n` +
        `- Upload Path: health360_documents/${filePath}\n\n` +
        `Please take a screenshot of this alert!`
      );
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

  // WhatsApp — Send Doctor Referral Thank You
  const triggerDoctorThankYouConfirm = () => {
    const rawDoc = patient.referringDoctor && patient.referringDoctor !== 'Self / Direct' ? patient.referringDoctor : 'Doctor';
    const docName = rawDoc.replace(/^Dr\.\s*/i, '');
    const patientName = patient.fullName;
    const preview = `Dear Dr. ${docName},\n\nThank you for referring ${patientName} to Health 360 Physiotherapy & Craniosacral Therapy Clinic. We have commenced their clinical evaluation and specialized rehabilitation protocol.\n\nWe will keep you updated on their recovery progress.\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`;
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/?text=${encodeURIComponent(preview)}`;

    whatsappConfirmActionRef.current = async () => {
      setWhatsappSending('referral');
      const result = await sendWhatsAppNotification({
        phone: patient.phone,
        templateName: 'referral_thankyou_short',
        params: [docName, patientName],
      });
      handleToggleThankYou();
      setWhatsappSending(null);
      if (result.success) {
        setWhatsappSuccess('referral');
        setTimeout(() => setWhatsappSuccess(null), 4000);
      }
    };

    setConfirmWhatsappModal({
      isOpen: true,
      title: `Send Thank-You to Dr. ${docName}`,
      templateBadge: 'referral_thankyou_short (Utility)',
      recipientName: `Dr. ${docName}`,
      phone: patient.phone,
      messagePreview: preview,
      waUrl,
    });
  };

  // WhatsApp — Send Next Appointment Reminder
  const triggerNextApptReminderConfirm = () => {
    if (!nextApptDate || !nextApptTime) return;
    const firstName = patient.fullName?.split(' ')[0] || patient.fullName;
    const dateFormatted = new Date(nextApptDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const [h, m] = nextApptTime.split(':');
    const hour = parseInt(h, 10);
    const timeFormatted = `${hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
    const preview = `Hello ${firstName},\n\nThank you for your visit today. Your next physiotherapy session is scheduled for:\n\n📅 ${dateFormatted}\n⏰ ${timeFormatted}\n\nWe look forward to seeing you. Please reply to this message if you need to reschedule.\n\nTeam Health 360`;
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(preview)}`;

    whatsappConfirmActionRef.current = () => handleSendNextApptReminder();
    setConfirmWhatsappModal({
      isOpen: true,
      title: 'Send Next Session Reminder',
      templateBadge: 'next_appointment_reminder (Utility)',
      recipientName: patient.fullName,
      phone: patient.phone,
      messagePreview: preview,
      waUrl,
    });
  };

  const handleSendNextApptReminder = async () => {
    if (!nextApptDate || !nextApptTime) return;
    setWhatsappSending('appt');
    const firstName = patient.fullName?.split(' ')[0] || patient.fullName;
    const dateFormatted = new Date(nextApptDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const [h, m] = nextApptTime.split(':');
    const hour = parseInt(h, 10);
    const timeFormatted = `${hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
    const result = await sendWhatsAppNotification({
      phone: patient.phone,
      templateName: 'next_appointment_reminder',
      params: [firstName, dateFormatted, timeFormatted],
    });
    setWhatsappSending(null);
    if (result.success) {
      setWhatsappSuccess('appt');
      setShowApptModal(false);
      setTimeout(() => setWhatsappSuccess(null), 4000);
    } else {
      alert('Failed to send WhatsApp message. Please check API credentials.');
    }
  };

  // WhatsApp — Send Missed Appointment Notice
  const triggerMissedApptConfirm = () => {
    const firstName = patient.fullName?.split(' ')[0] || patient.fullName;
    const preview = `Hello ${firstName},\n\nWe missed seeing you at your appointment today. To continue your recovery and maintain your progress, please let us know a suitable time to reschedule your session.\n\nWe look forward to assisting you.\n\nTeam Health 360`;
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(preview)}`;

    whatsappConfirmActionRef.current = () => handleSendMissedAppt();
    setConfirmWhatsappModal({
      isOpen: true,
      title: 'Send Missed Appointment Notice',
      templateBadge: 'missed_appointment_notice (Utility)',
      recipientName: patient.fullName,
      phone: patient.phone,
      messagePreview: preview,
      waUrl,
    });
  };

  const handleSendMissedAppt = async () => {
    setWhatsappSending('missed');
    const firstName = patient.fullName?.split(' ')[0] || patient.fullName;
    const result = await sendWhatsAppNotification({
      phone: patient.phone,
      templateName: 'missed_appointment_notice',
      params: [firstName],
    });
    setWhatsappSending(null);
    if (result.success) {
      setWhatsappSuccess('missed');
      setTimeout(() => setWhatsappSuccess(null), 4000);
    } else {
      alert('Failed to send WhatsApp message. Please check API credentials.');
    }
  };

  // WhatsApp — Send Google Review Request
  const triggerGoogleReviewConfirm = () => {
    const firstName = patient.fullName?.split(' ')[0] || patient.fullName;
    const reviewUrl = 'https://g.page/r/CSdQGRuzUnLrEAE/review';
    const preview = `Hello ${firstName},\n\nThank you for visiting Health 360 Physiotherapy & Craniosacral Therapy Clinic.\n\nWe would love to know about your recovery journey! Please take a quick moment to share your review on our Google profile:\n${reviewUrl}\n\nYour feedback helps others find the right care.\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`;
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(preview)}`;

    whatsappConfirmActionRef.current = async () => {
      setWhatsappSending('review');
      const result = await sendWhatsAppNotification({
        phone: patient.phone,
        templateName: 'google_review_request',
        params: [firstName, reviewUrl],
      });
      setWhatsappSending(null);
      if (result.success) {
        setWhatsappSuccess('review');
        setTimeout(() => setWhatsappSuccess(null), 4000);
      } else {
        alert('Failed to send Google Review request.');
      }
    };

    setConfirmWhatsappModal({
      isOpen: true,
      title: 'Send Google Review & Feedback Request',
      templateBadge: 'google_review_request (Utility)',
      recipientName: patient.fullName,
      phone: patient.phone,
      messagePreview: preview,
      waUrl,
    });
  };

  // WhatsApp — Send Mediclaim Certificate Summary
  const triggerMediclaimConfirm = () => {
    const firstName = patient.fullName;
    const diagnosis = patient.diagnosis || 'Physiotherapy & CST Rehabilitation';
    const startDate = patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent';
    const endDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const sessions = String(patient.sessionPackages?.reduce((sum: number, p: any) => sum + (p.completedSessions || 0), 0) || 10);
    const totalAmount = String(patient.invoices?.reduce((sum: number, inv: any) => sum + (Number(inv.paidAmount) || 0), 0) || '6500');

    const preview = `Hello ${firstName},\n\nYour Physiotherapy Treatment & Mediclaim Certificate from Health 360 Clinic is ready:\n\n• Diagnosis: ${diagnosis}\n• Treatment Period: ${startDate} to ${endDate}\n• Total Sessions Attended: ${sessions}\n• Total Amount Paid: ₹${totalAmount}\n\nPlease let us know if you or your insurance provider need any additional details.\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`;
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(preview)}`;

    whatsappConfirmActionRef.current = async () => {
      setWhatsappSending('mediclaim');
      const result = await sendWhatsAppNotification({
        phone: patient.phone,
        templateName: 'mediclaim_certificate_notice',
        params: [firstName, diagnosis, startDate, endDate, sessions, totalAmount],
      });
      setWhatsappSending(null);
      if (result.success) {
        setWhatsappSuccess('mediclaim');
        setTimeout(() => setWhatsappSuccess(null), 4000);
      } else {
        alert('Failed to send Mediclaim Certificate notice.');
      }
    };

    setConfirmWhatsappModal({
      isOpen: true,
      title: 'Send Mediclaim Reimbursement Summary',
      templateBadge: 'mediclaim_certificate_notice (Utility)',
      recipientName: patient.fullName,
      phone: patient.phone,
      messagePreview: preview,
      waUrl,
    });
  };

  // WhatsApp — Send Fitness Certificate Notice
  const triggerFitnessConfirm = () => {
    const firstName = patient.fullName;
    const assessmentDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const status = 'Fit to resume regular work and sports activities';
    const remarks = 'Perform prescribed warmup and ergonomic exercises daily';

    const preview = `Hello ${firstName},\n\nBased on your clinical evaluation at Health 360 Clinic on ${assessmentDate}, you are certified:\n\n✅ ${status}\n\nPhysiotherapist Advice:\n${remarks}\n\nKeep up the great progress and continue your home routine!\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`;
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(preview)}`;

    whatsappConfirmActionRef.current = async () => {
      setWhatsappSending('fitness');
      const result = await sendWhatsAppNotification({
        phone: patient.phone,
        templateName: 'fitness_certificate_notice',
        params: [firstName, assessmentDate, status, remarks],
      });
      setWhatsappSending(null);
      if (result.success) {
        setWhatsappSuccess('fitness');
        setTimeout(() => setWhatsappSuccess(null), 4000);
      } else {
        alert('Failed to send Fitness Certificate notice.');
      }
    };

    setConfirmWhatsappModal({
      isOpen: true,
      title: 'Send Fitness Certificate Notice',
      templateBadge: 'fitness_certificate_notice (Utility)',
      recipientName: patient.fullName,
      phone: patient.phone,
      messagePreview: preview,
      waUrl,
    });
  };

  // WhatsApp — Send Medical Rest Notice
  const triggerMedicalRestConfirm = () => {
    const firstName = patient.fullName;
    const diagnosis = patient.diagnosis || 'Acute Musculoskeletal Condition';
    const startDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const endDateObj = new Date();
    endDateObj.setDate(endDateObj.getDate() + 7);
    const endDate = endDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const reviewDateObj = new Date();
    reviewDateObj.setDate(reviewDateObj.getDate() + 8);
    const reviewDate = reviewDateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const preview = `Hello ${firstName},\n\nFollowing your clinical assessment at Health 360 Clinic, you have been advised medical rest to support your recovery for ${diagnosis}.\n\n• Recommended Rest: ${startDate} to ${endDate}\n• Next Review Date: ${reviewDate}\n\nPlease avoid strenuous activities and continue your prescribed rehabilitation.\n\nWishing you a speedy recovery,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`;
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(preview)}`;

    whatsappConfirmActionRef.current = async () => {
      setWhatsappSending('rest');
      const result = await sendWhatsAppNotification({
        phone: patient.phone,
        templateName: 'medical_rest_notice',
        params: [firstName, diagnosis, startDate, endDate, reviewDate],
      });
      setWhatsappSending(null);
      if (result.success) {
        setWhatsappSuccess('rest');
        setTimeout(() => setWhatsappSuccess(null), 4000);
      } else {
        alert('Failed to send Medical Rest advice.');
      }
    };

    setConfirmWhatsappModal({
      isOpen: true,
      title: 'Send Medical Rest Notice',
      templateBadge: 'medical_rest_notice (Utility)',
      recipientName: patient.fullName,
      phone: patient.phone,
      messagePreview: preview,
      waUrl,
    });
  };

  // WhatsApp — Send Discharge Summary Notice
  const triggerDischargeConfirm = () => {
    const firstName = patient.fullName;
    const startDate = patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Initial Session';
    const endDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const sessions = String(patient.sessionPackages?.reduce((sum: number, p: any) => sum + (p.completedSessions || 0), 0) || 12);
    const outcome = 'Pain-free mobility and full functional strength achieved';
    const advice = 'Continue home maintenance exercises 3 times a week';

    const preview = `Congratulations ${firstName}! 🎉\n\nYou have successfully completed your physiotherapy program at Health 360 Clinic.\n\n• Treatment Period: ${startDate} to ${endDate}\n• Total Sessions: ${sessions}\n• Recovery Outcome: ${outcome}\n• Home Exercise Advice: ${advice}\n\nThank you for trusting us with your recovery. Feel free to reach out whenever you need guidance!\n\nWarm regards,\nDr. Rashmita Karvir-Kekre (PT)\nHealth 360 Clinic`;
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(preview)}`;

    whatsappConfirmActionRef.current = async () => {
      setWhatsappSending('discharge');
      const result = await sendWhatsAppNotification({
        phone: patient.phone,
        templateName: 'patient_discharge_summary',
        params: [firstName, startDate, endDate, sessions, outcome, advice],
      });
      setWhatsappSending(null);
      if (result.success) {
        setWhatsappSuccess('discharge');
        setTimeout(() => setWhatsappSuccess(null), 4000);
      } else {
        alert('Failed to send Discharge Summary notice.');
      }
    };

    setConfirmWhatsappModal({
      isOpen: true,
      title: 'Send Patient Discharge Summary',
      templateBadge: 'patient_discharge_summary (Utility)',
      recipientName: patient.fullName,
      phone: patient.phone,
      messagePreview: preview,
      waUrl,
    });
  };

  // WhatsApp — Send Clinic Welcome & Location Info
  const triggerWelcomeConfirm = () => {
    const firstName = patient.fullName?.split(' ')[0] || patient.fullName;
    const preview = `🌿 Welcome to Health360 Physiotherapy & Craniosacral Therapy Clinic! 🌿\n\nDear ${firstName},\n\nThank you for choosing Health360 Physiotherapy Clinic. We are committed to helping you recover, move better, and live pain-free.\n\n📍 Address:\nShop no.1 & 2, Amardeep society, Om Nagar, Vasai West.\n\n🕙 Clinic Timings:\nMorning: 10:00 AM – 2:00 PM | Evening: 5:00 PM – 9:00 PM\n\n📍 Google Maps Location:\nhttps://maps.app.goo.gl/VpvTzGtZy3kCZZWGA?g_st=iw\n\n☎️: 8482812859 / 9834848981\n✉️: health360vasai@gmail.com\n\nWishing you good health! 🌸\nTeam Health360 Physiotherapy Clinic`;
    const cleanPhone = patient.phone.replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(preview)}`;

    whatsappConfirmActionRef.current = async () => {
      setWhatsappSending('welcome');
      const result = await sendWhatsAppNotification({
        phone: patient.phone,
        templateName: 'welcome_clinic_info',
        params: [firstName],
      });
      setWhatsappSending(null);
      if (result.success) {
        setWhatsappSuccess('welcome');
        setTimeout(() => setWhatsappSuccess(null), 4000);
      } else {
        alert('Failed to send Clinic Welcome info.');
      }
    };

    setConfirmWhatsappModal({
      isOpen: true,
      title: 'Send Clinic Welcome & Location Guide',
      templateBadge: 'welcome_clinic_info (Utility)',
      recipientName: patient.fullName,
      phone: patient.phone,
      messagePreview: preview,
      waUrl,
    });
  };

  const triggerHandoutShareConfirm = (handout: any) => {
    const preview = `Hi ${patient.fullName?.split(' ')[0] || 'Patient'}, Dr. Rashmita has shared a clinical education handout with you: "${handout.title}" (${handout.category}).`;
    whatsappConfirmActionRef.current = () => {
      shareHandoutMutation.mutate({
        patientId,
        handoutId: handout.id,
        sentVia: 'whatsapp',
      });
    };
    setConfirmWhatsappModal({
      isOpen: true,
      title: `Confirm Sharing Handout: ${handout.title}`,
      recipientName: patient.fullName,
      phone: patient.phone,
      messagePreview: preview,
    });
  };

  const getStatusStyle = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.COMPLETED:
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case AppointmentStatus.IN_PROGRESS:
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case AppointmentStatus.WAITING:
        return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      case AppointmentStatus.SCHEDULED:
        return 'bg-white/10 text-white/70 border border-white/20';
      case AppointmentStatus.NO_SHOW:
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      default:
        return 'bg-white/5 text-white/50 border border-white/10';
    }
  };

  const getCallOutcomeStyle = (outcome: CallOutcome) => {
    switch (outcome) {
      case CallOutcome.BOOKED:
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case CallOutcome.FOLLOW_UP_NEEDED:
        return 'bg-orange-500/20 text-orange-300 border border-orange-500/30';
      case CallOutcome.CANCELLED:
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      default:
        return 'bg-white/5 text-white/50 border border-white/10';
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
    <div className="flex-1 flex flex-col bg-[#0B0A10]/90 border border-white/20 rounded-3xl p-6 shadow-2xl backdrop-blur-xl text-white select-none">
      {/* Header Profile Summary */}
      <div className="pb-6 border-b border-white/10 flex flex-col gap-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {onBack && (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={onBack} 
                className="p-2 rounded-xl hover:bg-white/10 border border-white/20 text-white mt-1 shrink-0 cursor-pointer focus:outline-hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.button>
            )}
            
            {/* Initials Avatar Badge (Fixed Size) */}
            <div 
              style={{ width: '56px', height: '56px', minWidth: '56px', minHeight: '56px', fontSize: '20px' }}
              className="rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-serif text-emerald-300 font-bold shrink-0 shadow-inner"
            >
              {initials}
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl font-serif font-bold text-white tracking-wide leading-none">{patient.fullName}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/10 text-white/70 border border-white/20 rounded-full">
                  {patient.gender}
                </span>
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/10 text-white/70 border border-white/20 rounded-full">
                  {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} Years Old
                </span>
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/10 text-white/70 border border-white/20 rounded-full">
                  Intake: {new Date(patient.intakeDate).toLocaleDateString()}
                </span>
                <span className="inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 bg-emerald-500 text-white rounded-full shadow-xxs">
                  Cadence: {patient.expectedCadence}
                </span>
                <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/10 text-white/70 border border-white/20 rounded-full">
                  Language: {patient.language || 'English'}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditPatientModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md whitespace-nowrap"
              title="Quick edit patient details & demographics"
            >
              <Edit2 className="h-4 w-4 stroke-[1.75]" />
              Quick Edit
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                window.location.href = `/crm360/assessments/new?patientId=${patientId}`;
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md whitespace-nowrap"
            >
              <FileText className="h-4 w-4 stroke-[1.75]" />
              + Initial Assessment
            </motion.button>

            {/* Dictate SOAP Note button (Prevent Wrap) */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsDictating(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md whitespace-nowrap"
            >
              <Mic className="h-4 w-4 stroke-[1.75]" />
              Dictate SOAP
            </motion.button>
          </div>
        </div>

        {/* Demographics details (Consolidated Borders) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold mt-1">
          <div className="flex items-center gap-3.5 text-white/80 bg-white/5 border border-white/10 p-3 rounded-xl">
            <Phone className="h-4 w-4 text-emerald-400 shrink-0 stroke-[1.75]" />
            <div>
              <p className="font-bold">{patient.phone}</p>
              {patient.secondaryPhone && <p className="text-[10px] text-white/50 mt-0.5">Sec: {patient.secondaryPhone}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3.5 text-white/80 bg-white/5 border border-white/10 p-3 rounded-xl">
            <MapPin className="h-4 w-4 text-emerald-400 shrink-0 stroke-[1.75]" />
            <span className="truncate" title={patient.address}>{patient.address || 'No address registered'}</span>
          </div>
          <div className="flex items-center gap-3.5 text-white/80 bg-white/5 border border-white/10 p-3 rounded-xl">
            <Activity className="h-4 w-4 text-emerald-400 shrink-0 stroke-[1.75]" />
            <span className="truncate">Modality: <strong className="text-emerald-400 font-bold">{patient.treatmentModalityAssigned || 'None'}</strong></span>
          </div>
        </div>

        {/* Additional Demographics Details */}
        {(patient.email || patient.thirdPartyUid || patient.bloodGroup || patient.parentSpouseCaretakerName || patient.dateOfMarriage) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] font-semibold mt-1">
            {/* Email */}
            {patient.email && (
              <div className="flex flex-col gap-0.5 bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <span className="text-white/40 font-bold uppercase tracking-wider">Email</span>
                <span className="text-white truncate" title={patient.email}>{patient.email}</span>
              </div>
            )}
            {/* Third Party UID */}
            {patient.thirdPartyUid && (
              <div className="flex flex-col gap-0.5 bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <span className="text-white/40 font-bold uppercase tracking-wider">Third Party UID</span>
                <span className="text-white truncate">{patient.thirdPartyUid}</span>
              </div>
            )}
            {/* Blood Group */}
            {patient.bloodGroup && (
              <div className="flex flex-col gap-0.5 bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <span className="text-white/40 font-bold uppercase tracking-wider">Blood Group</span>
                <span className="text-emerald-400 font-bold">{patient.bloodGroup}</span>
              </div>
            )}
            {/* Caretaker */}
            {patient.parentSpouseCaretakerName && (
              <div className="col-span-2 flex flex-col gap-0.5 bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <span className="text-white/40 font-bold uppercase tracking-wider">Guardian / Caretaker Name</span>
                <span className="text-white truncate">{patient.parentSpouseCaretakerName}</span>
              </div>
            )}
            {/* Marriage Details */}
            {patient.dateOfMarriage && (
              <div className="col-span-2 flex flex-col gap-0.5 bg-white/5 border border-white/10 p-2.5 rounded-xl">
                <span className="text-white/40 font-bold uppercase tracking-wider">Marriage Details</span>
                <span className="text-white truncate">
                  {`Married on ${new Date(patient.dateOfMarriage).toLocaleDateString()}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Active Treatment Protocol Tracker */}
        {activeProtocol && (
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-[#12D6C4] stroke-[1.75]" />
                Active Clinical Protocol
              </p>
              <h4 className="font-serif font-bold text-sm text-white">
                {activeProtocol.name} — Step {patient.currentProtocolStep + 1} of {protocolSteps.length}
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {protocolSteps.map((step: string, idx: number) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-[10px] text-white/30">→</span>}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      idx === patient.currentProtocolStep 
                        ? 'bg-[#12D6C4] text-black border-transparent' 
                        : idx < patient.currentProtocolStep
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 line-through'
                        : 'bg-white/5 text-white/50 border-white/10'
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
                className="text-[10px] font-bold uppercase tracking-wider text-white hover:text-white bg-white/10 border border-white/20 px-3.5 py-2 rounded-xl transition-colors cursor-pointer focus:outline-hidden"
              >
                Advance to Next Step
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Sub-tab Switcher */}
      <div className="flex border border-white/10 bg-white/[0.03] p-1.5 gap-2 shrink-0 overflow-x-auto my-4 rounded-2xl">
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2.5 text-xs font-serif font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'documents'
              ? 'bg-white text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5 font-medium'
          }`}
        >
          Documents & Case Files
        </button>
        <button
          onClick={() => setActiveTab('rom')}
          className={`px-4 py-2.5 text-xs font-serif font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rom'
              ? 'bg-white text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5 font-medium'
          }`}
        >
          Clinical ROM & Referrals
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2.5 text-xs font-serif font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-white text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5 font-medium'
          }`}
        >
          Session Packages & Billing
        </button>
        <button
          onClick={() => setActiveTab('assessments')}
          className={`px-4 py-2.5 text-xs font-serif font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'assessments'
              ? 'bg-white text-black shadow-md'
              : 'text-white/60 hover:text-white hover:bg-white/5 font-medium'
          }`}
        >
          Initial Assessments
        </button>
      </div>

      {/* Tab Contents */}

      {/* Case Documents Explorer Tab (Huge Card Placeholders) */}
      {activeTab === 'documents' && (
        <div className="p-6 space-y-8 max-w-6xl mx-auto w-full animate-fadeIn">
          {/* Header section with Create Folder and Path details */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-white">Case Documents Explorer</h3>
              <p className="text-xxs text-white/40 font-bold uppercase tracking-wider mt-0.5">Clinical files, prescriptions & lab results</p>
            </div>
            <div className="flex items-center gap-3">
              {currentPath.length > 0 && (
                <button
                  onClick={() => setCurrentPath(currentPath.slice(0, -1))}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
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
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                <FolderPlus className="h-4 w-4" />
                New Folder
              </button>
            </div>
          </div>

          {/* Folder Path Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-white/70 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl">
            <Folder className="h-4 w-4 text-[#12D6C4] shrink-0 fill-[#12D6C4]/10" />
            <button 
              onClick={() => setCurrentPath([])}
              className="hover:text-white transition-colors cursor-pointer text-white/40 font-semibold"
            >
              Root
            </button>
            {currentPath.map((folder, index) => (
              <React.Fragment key={index}>
                <span className="text-white/30">/</span>
                <button 
                  onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                  className="hover:text-white transition-colors cursor-pointer max-w-[120px] truncate text-white font-bold"
                >
                  {folder}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Large Simulated Upload Dropzone Panel (Big Area) */}
          <div className="border-2 border-dashed border-white/15 hover:border-[#12D6C4]/50 bg-white/[0.02] hover:bg-white/[0.04] transition-all rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center cursor-pointer relative">
            <div className="p-4 bg-[#12D6C4]/15 rounded-2xl text-[#12D6C4]">
              <Plus className="h-8 w-8 stroke-[2]" />
            </div>
            <div>
              <h4 className="text-base font-serif font-bold text-white mb-1">Simulate Medical Document Intake</h4>
              <p className="text-xs text-white/50 max-w-md mx-auto">
                Select clinical files (Prescriptions, MRI scans, X-rays, lab reports) to register in the patient's record folder.
              </p>
            </div>

            <div className="w-full max-w-lg mt-3 bg-[#0B0A10]/95 border border-white/10 rounded-2xl p-5 text-left space-y-4 shadow-2xl cursor-default" onClick={(e) => e.stopPropagation()}>
              <h5 className="font-serif font-bold text-xs text-white border-b border-white/10 pb-2">Document Details</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-white/50 block mb-1 uppercase tracking-wider">File Display Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Left Knee X-Ray Report"
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    className="text-xs bg-white/[0.04] border border-white/10 rounded-xl p-2.5 w-full text-white font-semibold focus:outline-none focus:border-[#12D6C4] transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-white/50 block mb-1 uppercase tracking-wider">Report Category</label>
                  <select
                    value={uploadFileType}
                    onChange={(e) => setUploadFileType(e.target.value)}
                    className="text-xs bg-[#0B0A10] border border-white/10 rounded-xl p-2.5 w-full text-white font-bold focus:outline-none focus:border-[#12D6C4] transition"
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
                <label className="text-[10px] font-bold text-white/50 block mb-1 uppercase tracking-wider">Select File</label>
                <input 
                  type="file" 
                  onChange={(e) => setUploadFileObj(e.target.files?.[0] || null)}
                  className="text-xs w-full text-white/70 font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#12D6C4]/15 file:text-[#12D6C4] hover:file:bg-[#12D6C4]/25 transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button 
                  onClick={handleUploadFile}
                  disabled={!uploadFileObj || !uploadFileName.trim() || isUploadingToSupabase}
                  className="px-4 py-2 bg-white hover:bg-white/90 disabled:opacity-50 text-black text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                >
                  {isUploadingToSupabase && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isUploadingToSupabase ? 'Uploading...' : 'Upload & Scan File'}
                </button>
              </div>
            </div>
          </div>

          {/* Folder creation form */}
          {isCreatingFolder && (
            <div className="flex gap-3 items-center bg-white/5 p-3.5 border border-white/10 rounded-2xl shadow-xl">
              <input 
                type="text" 
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="text-xs bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 w-full text-white font-semibold focus:outline-none focus:border-[#12D6C4]"
              />
              <button 
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl cursor-pointer transition-colors whitespace-nowrap"
              >
                Create Folder
              </button>
              <button 
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-bold rounded-xl cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Documents Grid View (Huge Card Placeholders) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-4">
              Folder Contents ({currentFolders.length} folders, {files.length} documents)
            </h4>

            {currentFolders.length === 0 && files.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                <p className="text-sm text-white/40 italic font-medium">This folder is currently empty.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Render folders first (Huge Folder Cards) */}
                {currentFolders.map((folder) => (
                  <div 
                    key={folder}
                    onClick={() => setCurrentPath([...currentPath, folder])}
                    className="group bg-[#0B0A10]/80 border border-white/10 hover:border-[#12D6C4]/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3.5 cursor-pointer transition-all shadow-xl hover:-translate-y-0.5"
                  >
                    <div className="p-4 bg-[#12D6C4]/10 rounded-2xl text-[#12D6C4] group-hover:scale-105 transition-all">
                      <Folder className="h-10 w-10 fill-[#12D6C4]/10" />
                    </div>
                    <span className="font-serif font-bold text-sm text-white truncate text-center w-full px-2">{folder}</span>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wide">Directory Folder</span>
                  </div>
                ))}

                {/* Render files (Huge Document Cards) */}
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    onClick={() => setViewingDoc(file)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className="group bg-[#0B0A10]/80 border border-white/10 hover:border-[#12D6C4]/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-3.5 cursor-pointer transition-all shadow-xl relative overflow-hidden"
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
                            updatePatientMutation.mutate({ deleteAttachmentId: file.id });
                            setConfirmDelete(prev => ({ ...prev, isOpen: false }));
                          }
                        });
                      }}
                      className="absolute top-3 right-3 p-1 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete document"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className={`p-4 rounded-2xl group-hover:scale-105 transition-all ${
                      file.fileType === 'Prescription' ? 'bg-orange-500/15 text-orange-400' :
                      file.fileType === 'MRI' ? 'bg-indigo-500/15 text-indigo-400' :
                      file.fileType === 'X-Ray' ? 'bg-cyan-500/15 text-cyan-400' :
                      'bg-[#12D6C4]/15 text-[#12D6C4]'
                    }`}>
                      <FileText className="h-10 w-10 stroke-[1.75]" />
                    </div>
                    <div className="text-center w-full px-2 space-y-1">
                      <p className="font-serif font-bold text-sm text-white truncate w-full" title={file.displayName}>
                        {file.displayName}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          file.fileType === 'Prescription' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                          file.fileType === 'MRI' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          file.fileType === 'X-Ray' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                          'bg-[#12D6C4]/20 text-[#12D6C4] border border-[#12D6C4]/30'
                        }`}>
                          {file.fileType}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-[#12D6C4] tracking-wider uppercase mt-2">
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
        <div className="p-6 space-y-8 max-w-5xl mx-auto w-full animate-fadeIn grid grid-cols-1 md:grid-cols-2 gap-8 divide-x-0 md:divide-x divide-white/10">
          {/* Left panel: Referring Doctor & Checklist */}
          <div className="space-y-6 md:pr-8">
            <h3 className="text-lg font-serif font-bold text-white border-b border-white/10 pb-2">Referring Doctor & Onboarding</h3>
            
            {patient.referringDoctor && patient.referringDoctor !== 'Self / Direct' ? (
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4 shadow-xl">
                <div>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Referrer Doctor Name</p>
                  <h4 className="text-base font-serif font-bold text-emerald-400 mt-0.5">{patient.referringDoctor}</h4>
                </div>

                <div className="space-y-3.5 pt-1 border-t border-white/10">
                  <h5 className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Onboarding Checklist & WhatsApp Actions</h5>
                  
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <label className="flex items-start gap-2.5 text-xs font-semibold text-white cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isThankYouSent}
                        onChange={handleToggleThankYou}
                        className="mt-0.5 rounded border-white/20 accent-emerald-500"
                      />
                      <div className="space-y-0.5">
                        <p className={isThankYouSent ? 'line-through text-white/40' : ''}>Thank-You Note</p>
                        <p className="text-[9px] text-white/50 font-semibold leading-none">Greeting to referring doctor</p>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={triggerDoctorThankYouConfirm}
                      className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[#25D366] text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Send className="w-2.5 h-2.5" /> Send WhatsApp
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <label className="flex items-start gap-2.5 text-xs font-semibold text-white cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isDischargeSent}
                        onChange={handleToggleDischarge}
                        className="mt-0.5 rounded border-white/20 accent-emerald-500"
                      />
                      <div className="space-y-0.5">
                        <p className={isDischargeSent ? 'line-through text-white/40' : ''}>Discharge Summary</p>
                        <p className="text-[9px] text-white/50 font-semibold leading-none">Final clinical progress report</p>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={triggerDischargeConfirm}
                      className="px-2.5 py-1 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[10px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Send className="w-2.5 h-2.5" /> Send WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <p className="text-xs text-white/50 font-semibold">Patient registered as Direct Intake. No referring doctor checklist required.</p>
              </div>
            )}

            {/* Handout Shared History */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h4 className="text-base font-serif font-bold text-white">Patient Handouts Library</h4>
                <Share2 className="h-4.5 w-4.5 text-emerald-400 stroke-[1.75]" />
              </div>

              {handouts.length === 0 ? (
                <p className="text-xs text-white/50 italic font-medium">No education files in library.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {handouts.map((h: any) => (
                    <div key={h.id} className="p-3 border border-white/10 bg-white/5 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{h.title}</p>
                        <p style={{ fontSize: '9px', lineHeight: '12px' }} className="text-white/50 font-bold uppercase mt-1">{h.category} • {h.fileType}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => triggerHandoutShareConfirm(h)}
                        className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg transition-colors cursor-pointer border border-emerald-500/30"
                        title="Share via WhatsApp"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}

              {patient.sentHandouts && patient.sentHandouts.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50">Sent Handout History</h4>
                  <div className="space-y-2">
                    {patient.sentHandouts.map((sent: any) => (
                      <div key={sent.id} className="p-2 border border-white/10 bg-white/5 rounded-xl text-xxs font-semibold text-white">
                        <p className="font-bold">{sent.handout.title}</p>
                        <p className="text-white/50 mt-0.5">Shared via {sent.sentVia} on {new Date(sent.sentAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Patient WhatsApp Communication Hub */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#25D366]">
                    <Share2 className="h-4.5 w-4.5 stroke-[2]" />
                  </div>
                  <div>
                    <h4 className="text-base font-serif font-bold text-white tracking-wide">
                      WhatsApp Communication Hub
                    </h4>
                    <p className="text-[11px] text-white/50 font-medium">
                      Send official Meta verified templates directly to <span className="text-white font-semibold">{patient?.fullName}</span> ({patient?.phone})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#25D366] text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
                  Meta API Connected
                </div>
              </div>

              <div className="bg-gradient-to-b from-[#13111C]/80 to-[#0B0A10]/90 border border-white/[0.08] p-5 rounded-3xl space-y-5 shadow-2xl backdrop-blur-2xl">

                {/* 1. Appointments & Welcome */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Appointments & Clinic Guides
                  </p>

                  {/* Next Appointment Reminder */}
                  <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/30 p-4 rounded-2xl transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-serif font-bold text-white flex items-center gap-2">
                          📅 Next Session Reminder
                        </p>
                        <p className="text-[11px] text-white/50 mt-0.5">
                          Sends confirmed session date & time directly to patient's WhatsApp
                        </p>
                      </div>

                      {whatsappSuccess === 'appt' ? (
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                          ✓ Sent Successfully
                        </span>
                      ) : !showApptModal ? (
                        <button
                          onClick={() => setShowApptModal(true)}
                          className="px-4 py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send Next Reminder
                        </button>
                      ) : null}
                    </div>

                    {showApptModal && (
                      <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Date</label>
                            <input
                              type="date"
                              value={nextApptDate}
                              onChange={(e) => setNextApptDate(e.target.value)}
                              className="w-full text-xs border border-white/10 rounded-xl px-3 py-2 bg-black/40 text-white focus:outline-none focus:border-emerald-400 mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Time</label>
                            <input
                              type="time"
                              value={nextApptTime}
                              onChange={(e) => setNextApptTime(e.target.value)}
                              className="w-full text-xs border border-white/10 rounded-xl px-3 py-2 bg-black/40 text-white focus:outline-none focus:border-emerald-400 mt-1"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setShowApptModal(false)}
                            className="px-3.5 py-1.5 text-xs text-white/60 hover:text-white border border-white/10 rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={triggerNextApptReminderConfirm}
                            disabled={!nextApptDate || !nextApptTime || whatsappSending === 'appt'}
                            className="px-4 py-1.5 bg-[#25D366] hover:bg-[#1ebe59] text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-[#25D366]/20"
                          >
                            {whatsappSending === 'appt' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            {whatsappSending === 'appt' ? 'Sending...' : 'Preview & Dispatch'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Missed Session & Clinic Welcome Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={triggerMissedApptConfirm}
                      disabled={whatsappSending === 'missed'}
                      className="group p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-rose-500/40 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:scale-105 transition-transform">
                          <span className="text-sm">🚫</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-rose-200 transition-colors">
                            Missed Session Notice
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            Polite re-booking notification
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-rose-400/80 group-hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        {whatsappSuccess === 'missed' ? '✓ Sent' : 'Preview ➔'}
                      </span>
                    </button>

                    <button
                      onClick={triggerWelcomeConfirm}
                      disabled={whatsappSending === 'welcome'}
                      className="group p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-teal-500/40 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 group-hover:scale-105 transition-transform">
                          <span className="text-sm">🌿</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-teal-200 transition-colors">
                            Clinic Location & Welcome
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            Timings, address & Maps pin
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-teal-400/80 group-hover:text-teal-300 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20">
                        {whatsappSuccess === 'welcome' ? '✓ Sent' : 'Preview ➔'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/[0.08]" />

                {/* 2. Clinical Certificates & Insurance */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    Clinical Certificates & Discharge Summaries
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={triggerDischargeConfirm}
                      disabled={whatsappSending === 'discharge'}
                      className="group p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-purple-500/40 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
                          <span className="text-sm">🎓</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-purple-200 transition-colors">
                            Discharge Summary
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            Program completion & home advice
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-purple-400/80 group-hover:text-purple-300 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        {whatsappSuccess === 'discharge' ? '✓ Sent' : 'Preview ➔'}
                      </span>
                    </button>

                    {patient.referringDoctor && patient.referringDoctor !== 'Self / Direct' && (
                      <button
                        onClick={triggerDoctorThankYouConfirm}
                        disabled={whatsappSending === 'referral'}
                        className="group p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                            <span className="text-sm">👨‍⚕️</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white group-hover:text-emerald-200 transition-colors">
                              Doctor Referral Note
                            </p>
                            <p className="text-[10px] text-white/40 mt-0.5">
                              Thank-you to {patient.referringDoctor}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400/80 group-hover:text-emerald-300 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          {whatsappSuccess === 'referral' ? '✓ Sent' : 'Preview ➔'}
                        </span>
                      </button>
                    )}

                    <button
                      onClick={triggerMediclaimConfirm}
                      disabled={whatsappSending === 'mediclaim'}
                      className="group p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-sky-500/40 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 group-hover:scale-105 transition-transform">
                          <span className="text-sm">💰</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-sky-200 transition-colors">
                            Mediclaim Summary
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            Attended sessions & total fees
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-sky-400/80 group-hover:text-sky-300 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20">
                        {whatsappSuccess === 'mediclaim' ? '✓ Sent' : 'Preview ➔'}
                      </span>
                    </button>

                    <button
                      onClick={triggerFitnessConfirm}
                      disabled={whatsappSending === 'fitness'}
                      className="group p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-indigo-500/40 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
                          <span className="text-sm">🏃</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">
                            Fitness Certificate
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            Certified fit to resume duties
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-400/80 group-hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        {whatsappSuccess === 'fitness' ? '✓ Sent' : 'Preview ➔'}
                      </span>
                    </button>

                    <button
                      onClick={triggerMedicalRestConfirm}
                      disabled={whatsappSending === 'rest'}
                      className="group p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-amber-500/40 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                          <span className="text-sm">🛌</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors">
                            Medical Rest Advice
                          </p>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            Recommended rest duration
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-400/80 group-hover:text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        {whatsappSuccess === 'rest' ? '✓ Sent' : 'Preview ➔'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-white/[0.08]" />

                {/* 3. Reputation & Review */}
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Patient Reviews & Clinic Reputation
                  </p>
                  <button
                    onClick={triggerGoogleReviewConfirm}
                    disabled={whatsappSending === 'review'}
                    className="w-full group p-4 bg-gradient-to-r from-amber-500/[0.08] via-orange-500/[0.05] to-amber-500/[0.08] hover:from-amber-500/[0.14] hover:to-orange-500/[0.12] border border-amber-500/25 hover:border-amber-500/40 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between shadow-lg shadow-amber-500/5"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 group-hover:scale-105 transition-transform">
                        <span className="text-base">⭐</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors">
                          Request 5-Star Google Review
                        </p>
                        <p className="text-[11px] text-white/50 mt-0.5">
                          Sends personalized feedback note with direct 1-tap Google Maps review link
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/20 group-hover:bg-amber-500/30 px-3.5 py-1.5 rounded-xl border border-amber-500/30 shrink-0">
                      {whatsappSuccess === 'review' ? '✓ Request Sent' : 'Preview & Send ➔'}
                    </span>
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* Right panel: ROM progress */}
          <div className="space-y-6 md:pl-8">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="text-lg font-serif font-bold text-white">ROM Joint Progress</h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsRomUploading(true)}
                className="p-1 text-[#12D6C4] hover:bg-white/10 rounded-lg border border-white/10 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            </div>

            {romFiles.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                <p className="text-xs text-white/50 italic font-semibold">No joint ROM photos logged yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {romFiles.map((file: any) => {
                  const isBefore = file.name.toLowerCase().includes('before');
                  return (
                    <div key={file.id} className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0B0A10] shadow-xl">
                      <img src={getDisplayUrl(file.url)} alt={file.name} className="w-full h-32 object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 flex items-center justify-between text-[10px] font-bold text-white">
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsDictating(false)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative bg-[#0F0D16] border border-white/10 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 text-white"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
                <h3 className="text-xl font-serif font-bold text-white">AI Dictation & SOAP Writer</h3>
                <button onClick={() => setIsDictating(false)} className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Dictation Body */}
              <div className="p-6 space-y-4">
                <div className="flex justify-center py-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={startMockDictation}
                    className="flex flex-col items-center justify-center bg-[#12D6C4]/15 border border-[#12D6C4]/30 rounded-full h-16 w-16 text-[#12D6C4] hover:bg-[#12D6C4]/25 transition-all cursor-pointer focus:outline-hidden"
                  >
                    <Mic className="h-6 w-6 animate-pulse" />
                  </motion.button>
                </div>

                <div className="space-y-1">
                  <label className="text-xxs font-bold uppercase tracking-wider text-white/50">Raw Session Transcript</label>
                  <textarea
                    rows={4}
                    value={dictatedText}
                    onChange={(e) => setDictatedText(e.target.value)}
                    placeholder="Click the microphone or type raw symptoms, observations, and treatment outcomes..."
                    className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] p-3 text-white focus:border-[#12D6C4] outline-none font-semibold leading-relaxed"
                  />
                </div>

                {soapPreview ? (
                  <div className="space-y-2">
                    <label className="text-xxs font-bold uppercase tracking-wider text-white/50">Structured SOAP Note Preview</label>
                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl text-[11px] leading-relaxed max-h-48 overflow-y-auto font-mono text-white/90 whitespace-pre-wrap">
                      {soapPreview}
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => {
                      setDictatedText('');
                      setSoapPreview('');
                    }}
                    className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden"
                  >
                    Clear
                  </button>
                  {soapPreview ? (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={saveSoapNote}
                      className="px-4 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden flex items-center gap-1.5 shadow-md"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save & Append Note
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={generateSOAPNote}
                      disabled={isSoapGenerating || !dictatedText}
                      className="px-4 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl transition-colors cursor-pointer focus:outline-hidden flex items-center gap-1.5 shadow-md disabled:opacity-50"
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsRomUploading(false)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="relative bg-[#0F0D16] border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 text-white"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-serif font-bold text-white">Log ROM Progress</h3>
                <button onClick={() => setIsRomUploading(false)} className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Joint Area</label>
                  <select
                    value={romJoint}
                    onChange={(e) => setRomJoint(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold"
                  >
                    <option value="Knee Flexion" className="bg-[#0B0A10]">Knee Flexion</option>
                    <option value="Knee Extension" className="bg-[#0B0A10]">Knee Extension</option>
                    <option value="Shoulder Abduction" className="bg-[#0B0A10]">Shoulder Abduction</option>
                    <option value="Shoulder Rotation" className="bg-[#0B0A10]">Shoulder Rotation</option>
                  </select>
                </div>

                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Angle (Degrees)</label>
                  <input
                    type="number"
                    value={romAngle}
                    onChange={(e) => setRomAngle(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Rehab Stage</label>
                  <div className="flex gap-4">
                    {['Before', 'After'].map((stage) => (
                      <label key={stage} className="flex items-center gap-1.5 text-xs text-white font-semibold cursor-pointer">
                        <input
                          type="radio"
                          name="romStage"
                          checked={romStage === stage}
                          onChange={() => setRomStage(stage)}
                          className="accent-[#12D6C4]"
                        />
                        {stage} Rehab
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setIsRomUploading(false)}
                    className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRomUploadSimulate}
                    className="px-4 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md"
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
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-xl font-serif font-bold text-white">Session Packages</h3>
              <p className="text-xxs text-white/50 font-bold uppercase tracking-wider mt-0.5">Manage prepaid treatments and deduct visits</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSellCourseModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-400 hover:bg-emerald-500 text-black text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-black" />
                Issue Treatment Course
              </button>
              <button
                onClick={() => {
                  setPackageName('');
                  setTotalSessions(10);
                  setSubNamesInput(Array(10).fill(''));
                  setIsAddingPackage(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Custom Package
              </button>
            </div>
          </div>

          <SellCourseModal
            isOpen={isSellCourseModalOpen}
            onClose={() => setIsSellCourseModalOpen(false)}
            patientId={patientId}
            patientName={patient.fullName}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['patientPackages', patientId] });
              queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
            }}
          />

          {packages.length === 0 ? (
             <div className="p-16 text-center text-white/40 border border-dashed border-white/15 rounded-3xl font-bold bg-white/5">
               No active session packages for this patient.
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg: any) => {
                let subSessionsList: string[] = [];
                try {
                  if (pkg.subSessionNames) {
                    const parsed = JSON.parse(pkg.subSessionNames);
                    if (Array.isArray(parsed)) {
                      subSessionsList = parsed;
                    } else if (typeof pkg.subSessionNames === 'string') {
                      subSessionsList = pkg.subSessionNames.split(',');
                    }
                  }
                } catch (e) {
                  subSessionsList = pkg.subSessionNames ? pkg.subSessionNames.split(',') : [];
                }

                let subSessionsNotesList: string[] = [];
                try {
                  if (pkg.subSessionNotes) {
                    const parsed = JSON.parse(pkg.subSessionNotes);
                    if (Array.isArray(parsed)) {
                      subSessionsNotesList = parsed;
                    }
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
                  <div key={pkg.id} className="bg-white/5 border border-white/15 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      {/* Package Title and Delete */}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-white">{pkg.packageName}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider ${
                            pkg.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            pkg.paymentStatus === 'PARTIAL' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                            'bg-rose-500/20 text-rose-300 border-rose-500/30'
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
                            className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
                            className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                            title="Delete Package"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Pricing Info */}
                      <div className="grid grid-cols-3 gap-2 bg-black/40 border border-white/10 p-2.5 rounded-xl text-[10px] font-bold text-white/80 mb-3">
                        <div>
                          <span className="text-white/40 block text-[8px] uppercase tracking-wider">Total Price</span>
                          <span>₹{price.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[8px] uppercase tracking-wider">Paid</span>
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
                              className="text-[#12D6C4] hover:underline font-semibold"
                            >
                              (Edit)
                            </button>
                          </span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[8px] uppercase tracking-wider">Balance</span>
                          <span className={balance > 0 ? 'text-orange-400' : 'text-[#12D6C4]'}>₹{balance.toLocaleString()}</span>
                        </div>
                      </div>

                      <p className="text-xs text-white/60 font-semibold mb-3">
                        {pkg.sessionsUsed} of {pkg.totalSessions} sessions completed.
                      </p>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                        <div 
                          className="bg-[#12D6C4] h-2 rounded-full transition-all" 
                          style={{ width: `${(pkg.sessionsUsed / pkg.totalSessions) * 100}%` }}
                        ></div>
                      </div>

                      {/* Sub-sessions checklist */}
                      {subSessionsList.length > 0 && (
                        <div className="mt-3 border-t border-white/10 pt-3 max-h-48 overflow-y-auto space-y-1 bg-black/40 rounded-xl p-2.5 border border-white/10">
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1 px-1">Session Checklist & SOAP Notes</p>
                          {subSessionsList.map((name: string, idx: number) => {
                            const isCompleted = idx < pkg.sessionsUsed;
                            return (
                              <div key={idx} className="flex items-center justify-between py-1 px-1 hover:bg-white/5 rounded-lg group/item transition-colors">
                                <label className="flex items-center gap-2 text-xs text-white font-semibold cursor-pointer select-none">
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
                                    className="accent-[#12D6C4] h-3.5 w-3.5 cursor-pointer"
                                  />
                                  <span className={isCompleted ? 'line-through text-white/40 font-medium' : ''}>
                                    {name || `Session ${idx + 1}`}
                                  </span>
                                </label>
                                
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {subSessionsNotesList[idx] && (
                                    <span className="text-[8px] bg-[#12D6C4]/20 text-[#12D6C4] border border-[#12D6C4]/30 font-bold px-1.5 py-0.5 rounded-md">
                                      Has Notes
                                    </span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setCurrentSessionNotesText(subSessionsNotesList[idx] || '');
                                      setEditingNotesSessionIdx({ pkgId: pkg.id, idx });
                                    }}
                                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
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
                      className="w-full mt-4 py-2.5 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl border-0 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
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

      {/* Initial Assessments Tab */}
      {activeTab === 'assessments' && (
        <div className="p-6 space-y-6 max-w-6xl mx-auto w-full animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-serif font-bold text-white">Patient Digital Assessments</h3>
              <p className="text-xs text-white/50 font-semibold mt-0.5">
                Structured clinical evaluations, ROM/MMT measurements, and red flag safety logs.
              </p>
            </div>
            <a
              href={`/crm360/assessments/new?patientId=${patientId}`}
              className="px-4 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> + New Initial Assessment
            </a>
          </div>

          <div className="space-y-3">
            {patient?.assessments && patient.assessments.length > 0 ? (
              patient.assessments.map((a: any) => (
                <div
                  key={a.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#12D6C4]/20 text-[#12D6C4] border border-[#12D6C4]/30 rounded-md">
                        {a.type}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/10 text-white/70 border border-white/20 rounded-md">
                        {a.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-serif font-bold text-white">
                      {a.ptDiagnosis || a.provisionalDiagnosis || 'Clinical Assessment'}
                    </h4>
                    <p className="text-xs text-white/50 font-medium">
                      Date: {new Date(a.assessmentDate).toLocaleDateString()}
                    </p>
                  </div>

                  <a
                    href={`/crm360/assessments/${a.id}`}
                    className="px-3.5 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
                  >
                    View Details
                  </a>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl text-xs text-white/50 space-y-2">
                <p>No initial assessments logged for this patient yet.</p>
                <a
                  href={`/crm360/assessments/new?patientId=${patientId}`}
                  className="text-[#12D6C4] font-bold hover:underline block pt-1"
                >
                  + Click to create first Initial Assessment
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Package Modal */}
      <AnimatePresence>
        {isAddingPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsAddingPackage(false)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#0F0D16] border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-md flex flex-col z-10 max-h-[85vh] overflow-y-auto text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-serif font-bold text-white mb-1">Create Session Package</h3>
              <p className="text-xs text-white/50 font-semibold mb-4">Set up prepaid treatment session plans for the patient.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Package Main Name</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Class IV Laser Sessions"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Total Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={packagePrice}
                      onChange={(e) => setPackagePrice(e.target.value)}
                      className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Amount Paid (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={packagePaid}
                      onChange={(e) => setPackagePaid(e.target.value)}
                      className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Total Sessions</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={totalSessions}
                    onChange={(e) => handleTotalSessionsChange(parseInt(e.target.value) || 1)}
                    className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold"
                  />
                </div>
                
                <div className="space-y-2 border-t border-white/10 pt-3">
                  <label className="text-xxs font-bold uppercase tracking-wider text-white/50 block">Individual Session Names (Sub-names)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {Array.from({ length: totalSessions }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-white/40 w-6">#{idx + 1}</span>
                        <input
                          type="text"
                          placeholder={`Session ${idx + 1} specific focus`}
                          value={subNamesInput[idx] || ''}
                          onChange={(e) => {
                            const next = [...subNamesInput];
                            next[idx] = e.target.value;
                            setSubNamesInput(next);
                          }}
                          className="block flex-1 text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white focus:border-[#12D6C4] outline-none font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setIsAddingPackage(false)}
                    className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold rounded-xl cursor-pointer"
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
                    className="px-4 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl cursor-pointer shadow-md"
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsEditingPackage(false)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#0F0D16] border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-md flex flex-col z-10 max-h-[85vh] overflow-y-auto text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-serif font-bold text-white mb-1">Edit Session Package</h3>
              <p className="text-xs text-white/50 font-semibold mb-4">Modify the package details or session focus names.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Package Main Name</label>
                  <input
                    type="text"
                    placeholder="e.g. 10 Class IV Laser Sessions"
                    value={editPackageName}
                    onChange={(e) => setEditPackageName(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Total Price (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={editPackagePrice}
                      onChange={(e) => setEditPackagePrice(e.target.value)}
                      className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Amount Paid (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={editPackagePaid}
                      onChange={(e) => setEditPackagePaid(e.target.value)}
                      className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Total Sessions</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={editTotalSessions}
                    onChange={(e) => handleEditTotalSessionsChange(parseInt(e.target.value) || 1)}
                    className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-white focus:border-[#12D6C4] outline-none font-semibold"
                  />
                </div>
                
                <div className="space-y-2 border-t border-white/10 pt-3">
                  <label className="text-xxs font-bold uppercase tracking-wider text-white/50 block">Individual Session Names (Sub-names)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {Array.from({ length: editTotalSessions }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-white/40 w-6">#{idx + 1}</span>
                        <input
                          type="text"
                          placeholder={`Session ${idx + 1} specific focus`}
                          value={editSubNamesInput[idx] || ''}
                          onChange={(e) => {
                            const next = [...editSubNamesInput];
                            next[idx] = e.target.value;
                            setEditSubNamesInput(next);
                          }}
                          className="block flex-1 text-xs rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white focus:border-[#12D6C4] outline-none font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setIsEditingPackage(false)}
                    className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold rounded-xl cursor-pointer"
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
                    className="px-4 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl cursor-pointer shadow-md"
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setEditingNotesSessionIdx(null)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#0F0D16] border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col z-10 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-serif font-bold text-white mb-1">Session SOAP & Treatment Note</h3>
              <p className="text-xxs text-white/40 font-bold uppercase tracking-wider mb-4">
                Session #{editingNotesSessionIdx.idx + 1} specific documentation
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xxs font-bold uppercase tracking-wider text-white/50 mb-1 block">Clinical Notes</label>
                  <textarea
                    rows={6}
                    placeholder="Enter visit details, SOAP notes, pain levels, or range of motion outcomes for this session..."
                    value={currentSessionNotesText}
                    onChange={(e) => setCurrentSessionNotesText(e.target.value)}
                    className="block w-full text-xs rounded-xl border border-white/10 bg-white/[0.04] p-3 text-white focus:border-[#12D6C4] outline-none font-semibold leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    onClick={() => setEditingNotesSessionIdx(null)}
                    className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold rounded-xl cursor-pointer"
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
                          const parsed = JSON.parse(pkg.subSessionNotes);
                          if (Array.isArray(parsed)) subNotes = parsed;
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
                    className="px-4 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl cursor-pointer shadow-md"
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setViewingDoc(null)} />
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#0F0D16] border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col z-10 max-h-[85vh] text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
                <div>
                  <h3 className="text-lg font-serif font-bold text-white">{viewingDoc.displayName}</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{viewingDoc.fileType}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={viewingDoc.url + '&download=true'} 
                    download 
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-white cursor-pointer transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button onClick={() => setViewingDoc(null)} className="p-2 rounded-xl border border-white/10 hover:bg-white/10 text-white cursor-pointer transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-[350px] bg-black/40 rounded-2xl border border-white/10 p-4">
                {viewingDoc.url.toLowerCase().endsWith('.pdf') || viewingDoc.fileType === 'PDF' ? (
                  <iframe src={viewingDoc.url} className="w-full h-[55vh] rounded-xl border-0" />
                ) : viewingDoc.url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) || ['X-Ray', 'MRI'].includes(viewingDoc.fileType) ? (
                  <img src={viewingDoc.url} alt={viewingDoc.displayName} className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-xs" />
                ) : (
                  <div className="text-center py-10 space-y-3">
                    <File className="h-12 w-12 text-white/30 mx-auto" />
                    <p className="text-xs text-white/60 font-semibold">Preview not supported for this file type.</p>
                    <a 
                      href={viewingDoc.url} 
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-4 py-2 bg-white text-black text-xs font-bold rounded-xl"
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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0F0D16] border border-white/10 p-6 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col z-10 text-center text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center text-rose-400 mx-auto mb-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-serif font-bold text-white mb-2">{confirmDelete.title}</h3>
              <p className="text-xs text-white/60 font-semibold mb-6">{confirmDelete.message}</p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold rounded-xl cursor-pointer flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete.onConfirm}
                  className="px-4 py-2 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl cursor-pointer flex-1 shadow-md"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WhatsApp Safety Confirmation Interlock Modal — portaled to document.body */}
      {confirmWhatsappModal.isOpen && isMounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none">
          <motion.div
            key="wa-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={() => setConfirmWhatsappModal(prev => ({ ...prev, isOpen: false }))}
          />
          <motion.div
            key="wa-modal"
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative bg-gradient-to-b from-[#13111C] to-[#0B0A10] border border-white/15 p-6 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col z-[100000] text-left space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] rounded-2xl shrink-0 shadow-lg shadow-[#25D366]/10">
                  <Send className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-white leading-tight">
                    {confirmWhatsappModal.title}
                  </h3>
                  <p className="text-[11px] text-white/50 font-medium mt-0.5">
                    Official Meta WhatsApp Template Preview
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmWhatsappModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipient & Template Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                <span className="font-bold text-white">
                  {confirmWhatsappModal.recipientName}
                </span>
                <span className="text-white/40 font-mono text-[11px]">
                  ({confirmWhatsappModal.phone})
                </span>
              </div>
              {confirmWhatsappModal.templateBadge && (
                <span className="text-[10px] font-bold text-[#25D366] bg-[#25D366]/10 border border-[#25D366]/20 px-2.5 py-0.5 rounded-lg">
                  {confirmWhatsappModal.templateBadge}
                </span>
              )}
            </div>

            {/* Realistic WhatsApp Chat Bubble */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">
                Message Preview:
              </span>
              <div className="p-4 bg-[#0B141A] border border-emerald-500/20 rounded-2xl shadow-inner space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] text-[11px] text-[#25D366] font-bold">
                  <span>Health 360 Clinic</span>
                  <span className="text-[9px] font-semibold text-white/40 bg-white/5 px-1.5 py-0.5 rounded">Verified Business</span>
                </div>
                
                <div className="p-3.5 bg-[#005c4b]/30 border border-[#005c4b]/40 rounded-xl rounded-tl-none text-xs text-white/90 leading-relaxed font-sans whitespace-pre-wrap break-words">
                  {confirmWhatsappModal.messagePreview}
                  <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-white/40 font-mono">
                    <span>Just now</span>
                    <span className="text-[#53bdeb]">✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmWhatsappModal(prev => ({ ...prev, isOpen: false }))}
                className="w-full sm:w-auto py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-bold rounded-xl transition cursor-pointer order-3 sm:order-1"
              >
                Cancel
              </button>

              {confirmWhatsappModal.waUrl && (
                <a
                  href={confirmWhatsappModal.waUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setConfirmWhatsappModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full sm:flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 order-2 text-center"
                >
                  <Share2 className="w-3.5 h-3.5" /> Open in WhatsApp Web
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  const action = whatsappConfirmActionRef.current;
                  setConfirmWhatsappModal(prev => ({ ...prev, isOpen: false }));
                  whatsappConfirmActionRef.current = null;
                  if (action) action();
                }}
                className="w-full sm:flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#1ebe59] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-1.5 order-1 sm:order-3"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" /> Send Official Message
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Quick Edit Patient Modal */}
      <EditPatientModal
        isOpen={isEditPatientModalOpen}
        patient={patient}
        onClose={() => setIsEditPatientModalOpen(false)}
      />
    </div>
  );
}
