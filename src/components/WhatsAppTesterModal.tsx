'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, AlertTriangle, Loader2, X, Phone, RefreshCw, Sparkles, Terminal, Info } from 'lucide-react';
import { sendWhatsAppNotification } from '@/lib/whatsappTemplates';

interface TemplateTestItem {
  id: string;
  templateName: string;
  displayName: string;
  category: string;
  description: string;
  defaultParams: string[];
  paramLabels: string[];
}

const TEST_TEMPLATES: TemplateTestItem[] = [
  {
    id: 'next_appointment_reminder',
    templateName: 'next_appointment_reminder',
    displayName: 'Next Appointment Reminder',
    category: 'Patient Reminders',
    description: 'Notifies patient of their confirmed next scheduled physiotherapy session date & time.',
    paramLabels: ['Patient First Name', 'Session Date', 'Session Time'],
    defaultParams: ['Irene', 'Thursday, 3 September 2026', '5:30 PM']
  },
  {
    id: 'referral_thankyou_short',
    templateName: 'referral_thankyou_short',
    displayName: 'Doctor Referral Thank-You',
    category: 'Referring Doctors',
    description: 'Sends formal thank-you note directly to the referring doctor’s WhatsApp phone number.',
    paramLabels: ['Doctor Name / Salutation', 'Referred Patient Name'],
    defaultParams: ['Sharma', 'Irene']
  },
  {
    id: 'missed_appointment_notice',
    templateName: 'missed_appointment_notice',
    displayName: 'Missed Session Notice',
    category: 'Patient Retention',
    description: 'Polite re-booking outreach sent when a patient misses their scheduled slot.',
    paramLabels: ['Patient First Name'],
    defaultParams: ['Irene']
  },
  {
    id: 'appointment_booking_confirmation',
    templateName: 'appointment_booking_confirmation',
    displayName: 'Website Booking Confirmation',
    category: 'Online Bookings',
    description: 'Instant booking receipt with clinic address & Google Maps link sent to online booking intakes.',
    paramLabels: ['Patient Name', 'Booking Date', 'Booking Time'],
    defaultParams: ['Irene', 'Wednesday, 2 September 2026', '11:00 AM']
  },
  {
    id: 'google_review_request',
    templateName: 'google_review_request',
    displayName: 'Google Review Request',
    category: 'Reputation & Feedback',
    description: 'Post-recovery review invite with direct Google Maps review link.',
    paramLabels: ['Patient First Name', 'Google Review Link'],
    defaultParams: ['Irene', 'https://g.page/r/CSdQGRuzUnLrEAE/review']
  },
  {
    id: 'mediclaim_certificate_notice',
    templateName: 'mediclaim_certificate_notice',
    displayName: 'Mediclaim Certificate Summary',
    category: 'Certificates & Billing',
    description: 'Treatment duration, session count, and total amount summary for insurance reimbursement.',
    paramLabels: ['Patient Name', 'Clinical Diagnosis', 'Start Date', 'End Date', 'Total Sessions', 'Total Amount (₹)'],
    defaultParams: ['Irene', 'Lumbar Spine Rehabilitation', '1 Aug 2026', '25 Aug 2026', '10', '12500']
  },
  {
    id: 'fitness_certificate_notice',
    templateName: 'fitness_certificate_notice',
    displayName: 'Fitness Certificate Notice',
    category: 'Certificates & Billing',
    description: 'Clinical evaluation clearance notice and home exercise advice.',
    paramLabels: ['Patient Name', 'Assessment Date', 'Fitness Status', 'Physiotherapist Remarks'],
    defaultParams: ['Irene', '1 Sep 2026', 'Fit for regular physical activities', 'Perform daily ergonomic stretches']
  },
  {
    id: 'medical_rest_notice',
    templateName: 'medical_rest_notice',
    displayName: 'Medical Rest Certificate',
    category: 'Certificates & Billing',
    description: 'Prescribed rest period and follow-up clinical review date notice.',
    paramLabels: ['Patient Name', 'Clinical Diagnosis', 'Rest Start Date', 'Rest End Date', 'Next Review Date'],
    defaultParams: ['Irene', 'Acute Lumbar Sprain', '2 Sep 2026', '9 Sep 2026', '10 Sep 2026']
  },
  {
    id: 'patient_discharge_summary',
    templateName: 'patient_discharge_summary',
    displayName: 'Patient Discharge Summary',
    category: 'Clinical Outcomes',
    description: 'Celebratory completion notice with recovery outcome and home maintenance exercise regimen.',
    paramLabels: ['Patient Name', 'Treatment Start Date', 'Treatment End Date', 'Total Sessions', 'Recovery Outcome', 'Home Exercise Advice'],
    defaultParams: ['Irene', '1 Aug 2026', '1 Sep 2026', '12', 'Full functional mobility restored', 'Continue home exercise routine']
  },
  {
    id: 'welcome_clinic_info',
    templateName: 'welcome_clinic_info',
    displayName: 'Welcome & Clinic Location Guide',
    category: 'Onboarding',
    description: 'Detailed clinic orientation with timings, Vasai West address, and Google Maps pin.',
    paramLabels: ['Patient First Name'],
    defaultParams: ['Irene']
  }
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppTesterModal({ isOpen, onClose }: Props) {
  const [testPhone, setTestPhone] = useState('9819434520');
  const [paramsState, setParamsState] = useState<{ [templateId: string]: string[] }>(() => {
    const init: { [templateId: string]: string[] } = {};
    TEST_TEMPLATES.forEach(t => {
      init[t.id] = [...t.defaultParams];
    });
    return init;
  });

  const [loadingMap, setLoadingMap] = useState<{ [templateId: string]: boolean }>({});
  const [resultMap, setResultMap] = useState<{ [templateId: string]: { ok: boolean; message: string; wamid?: string } }>({});

  if (!isOpen) return null;

  const handleParamChange = (templateId: string, paramIndex: number, val: string) => {
    setParamsState(prev => {
      const current = [...(prev[templateId] || [])];
      current[paramIndex] = val;
      return { ...prev, [templateId]: current };
    });
  };

  const handleSendTest = async (template: TemplateTestItem) => {
    const cleanPhone = testPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      alert('Please enter a valid 10-digit mobile number for testing.');
      return;
    }

    const currentParams = paramsState[template.id] || template.defaultParams;
    setLoadingMap(prev => ({ ...prev, [template.id]: true }));
    setResultMap(prev => {
      const copy = { ...prev };
      delete copy[template.id];
      return copy;
    });

    try {
      const res = await sendWhatsAppNotification({
        phone: cleanPhone,
        templateName: template.templateName,
        params: currentParams,
      });

      if (res.success) {
        setResultMap(prev => ({
          ...prev,
          [template.id]: {
            ok: true,
            message: 'Delivered to Meta Cloud API',
            wamid: res.data?.messages?.[0]?.id || 'Dispatched'
          }
        }));
      } else {
        const errorMsg = res.error || res.data?.error?.message || 'Failed to deliver';
        setResultMap(prev => ({
          ...prev,
          [template.id]: {
            ok: false,
            message: typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : String(errorMsg)
          }
        }));
      }
    } catch (e: any) {
      setResultMap(prev => ({
        ...prev,
        [template.id]: {
          ok: false,
          message: e.message || 'Network dispatch error'
        }
      }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [template.id]: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 select-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-gradient-to-b from-[#13111C] to-[#0A0910] border border-white/20 p-5 sm:p-7 rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col z-[100000] text-left space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] rounded-2xl shrink-0 shadow-lg shadow-[#25D366]/10">
              <Terminal className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-bold text-white leading-tight">
                  Meta WhatsApp API Template Tester
                </h2>
                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Test Mode Only
                </span>
              </div>
              <p className="text-xs text-white/50 font-medium mt-0.5">
                Verify deliverability &amp; parameters across all 10 CRM WhatsApp templates.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice & Destination Phone Setup */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-teal-500/5 to-transparent border border-amber-500/20 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>[THIS BUTTON &amp; PANEL IS FOR TESTING PURPOSES ONLY]</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 border-t border-white/[0.08]">
            <label className="text-xs font-bold text-white/80 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#25D366]" />
              Target Test Mobile Number:
            </label>
            <div className="flex items-center gap-2 flex-1">
              <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono font-bold text-white/60">
                +91
              </span>
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9819434520"
                className="w-full text-sm font-mono font-bold bg-white/5 border border-[#25D366]/40 focus:border-[#25D366] rounded-xl px-3 py-1.5 text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-white/50 px-1">
            <span className="font-bold uppercase tracking-wider">
              Templates ({TEST_TEMPLATES.length} Available)
            </span>
            <span>Uses Live Meta Cloud API Endpoint</span>
          </div>

          <div className="space-y-3">
            {TEST_TEMPLATES.map((tmpl, idx) => {
              const currentParams = paramsState[tmpl.id] || tmpl.defaultParams;
              const isLoading = loadingMap[tmpl.id];
              const result = resultMap[tmpl.id];

              return (
                <div
                  key={tmpl.id}
                  className="p-4 bg-white/[0.02] hover:bg-white/[0.035] border border-white/[0.08] hover:border-white/15 rounded-2xl transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {idx + 1}. {tmpl.displayName}
                        </span>
                        <code className="text-[10px] font-mono font-bold text-[#12D6C4] bg-[#12D6C4]/10 border border-[#12D6C4]/20 px-2 py-0.5 rounded">
                          {tmpl.templateName}
                        </code>
                      </div>
                      <p className="text-[11px] text-white/50 mt-0.5 leading-snug">
                        {tmpl.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSendTest(tmpl)}
                      className="py-2 px-3.5 bg-[#25D366] hover:bg-[#1ebe59] text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-[#25D366]/20 shrink-0"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 stroke-[2.2]" />
                          <span>Test on +91 {testPhone}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Param Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-white/[0.05]">
                    {tmpl.paramLabels.map((lbl, pIdx) => (
                      <div key={pIdx} className="space-y-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block truncate">
                          {lbl}
                        </label>
                        <input
                          type="text"
                          value={currentParams[pIdx] || ''}
                          onChange={(e) => handleParamChange(tmpl.id, pIdx, e.target.value)}
                          className="w-full text-xs bg-white/5 border border-white/10 focus:border-[#12D6C4] rounded-lg px-2 py-1 text-white outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Status Banner */}
                  {result && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                        result.ok
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono'
                          : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {result.ok ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="flex-1 truncate">
                            <span className="font-bold">Meta 200 OK:</span> {result.message}
                            {result.wamid && (
                              <span className="block text-[10px] text-emerald-400/80 font-mono truncate">
                                WAMID: {result.wamid}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <div className="flex-1">
                            <span className="font-bold">Meta API Response:</span> {result.message}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-white/40">
          <span>Targeting WhatsApp Cloud API Phone ID: 1264792810055065</span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Close Tester
          </button>
        </div>
      </motion.div>
    </div>
  );
}
