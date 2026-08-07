'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Plus, Trash2, Check, AlertCircle, FileText, Sparkles, User, ShoppingBag, Calendar, AlertTriangle
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { suggestPlanFromModalities } from '@/lib/planSuggestion';
import CourseMeter from '@/components/billing/CourseMeter';
import InvoiceStatusPill from '@/components/billing/InvoiceStatusPill';
import SellCourseModal from '@/components/billing/SellCourseModal';
import CountUpNumber from '@/components/billing/CountUpNumber';

export default function InvoiceBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  // Patients & Selection
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [activeCoursePackage, setActiveCoursePackage] = useState<any | null>(null);

  // Available Reference Data
  const [plans, setPlans] = useState<any[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);
  const [completedAppointments, setCompletedAppointments] = useState<any[]>([]);

  // Selected Appointments Map for Checkboxes: { [appId]: selectedPlanId }
  const [selectedAppMap, setSelectedAppMap] = useState<Record<string, string>>({});

  // Invoice Lines & State
  const [lines, setLines] = useState<any[]>([]);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSellCourseModalOpen, setIsSellCourseModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      fetchPatientCourseAndAppointments(selectedPatient.id);
    }
  }, [selectedPatient]);

  const fetchInitialData = async () => {
    try {
      const [patientsRes, plansRes, consumablesRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/billing/plans'),
        fetch('/api/billing/consumables')
      ]);

      if (patientsRes.ok) {
        const patientList = await patientsRes.json();
        setPatients(patientList);
        if (patientIdParam) {
          const match = patientList.find((p: any) => p.id === patientIdParam);
          if (match) setSelectedPatient(match);
        }
      }
      if (plansRes.ok) setPlans(await plansRes.json());
      if (consumablesRes.ok) setConsumables(await consumablesRes.json());
    } catch (e) {
      console.error('Error fetching builder initial data:', e);
    }
  };

  const fetchPatientCourseAndAppointments = async (patientId: string) => {
    try {
      // 1. Fetch active course package
      const pkgRes = await fetch(`/api/billing/patients/${patientId}/packages`);
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        setActiveCoursePackage(pkgData.activePackage || null);
      }

      // 2. Fetch completed appointments for patient
      const appRes = await fetch(`/api/appointments?patientId=${patientId}&status=COMPLETED`);
      if (appRes.ok) {
        const appData = await appRes.json();
        setCompletedAppointments(appData);

        // Pre-populate suggestions for unbilled appointments
        const appMap: Record<string, string> = {};
        appData.forEach((app: any) => {
          const suggested = suggestPlanFromModalities(app.treatmentType, plans);
          if (suggested) {
            appMap[app.id] = suggested.id;
          } else if (plans.length > 0) {
            appMap[app.id] = plans[0].id;
          }
        });
        setSelectedAppMap(appMap);
      }
    } catch (e) {
      console.error('Error fetching patient billing context:', e);
    }
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 5);
    return patients.filter(p =>
      p.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.phone.includes(patientSearch)
    ).slice(0, 8);
  }, [patients, patientSearch]);

  // Add Treatment Plan Line (Walk-in Rate)
  const addTreatmentPlanLine = (plan: any) => {
    const isDefaultCovered = !!activeCoursePackage;
    const unitPrice = Number(plan.perSessionRate);

    const newLine = {
      id: `plan_${plan.id}_${Date.now()}`,
      description: `${plan.name} Treatment Session`,
      quantity: 1,
      unitPrice,
      plan,
      isCoveredByPackage: isDefaultCovered,
      patientPackageId: isDefaultCovered ? activeCoursePackage.id : null
    };

    setLines(prev => [...prev, newLine]);
  };

  // Follow-Up Choice State (app.id -> 'consultation' | 'treatment')
  const [followUpChoiceMap, setFollowUpChoiceMap] = useState<Record<string, 'consultation' | 'treatment'>>({});

  // Add Unbilled Appointment via Checkbox
  const toggleAppointmentLine = (app: any, forceChoice?: 'consultation' | 'treatment') => {
    const isCurrentlyAdded = lines.some(l => l.appointmentId === app.id);
    const isFollowUp = app.appointmentType === 'FOLLOW_UP' || app.treatmentType?.toLowerCase().includes('follow');

    if (isCurrentlyAdded && !forceChoice) {
      setLines(prev => prev.filter(l => l.appointmentId !== app.id));
      return;
    }

    const choice = forceChoice || followUpChoiceMap[app.id];

    if (isFollowUp) {
      if (choice === 'consultation') {
        const newLine = {
          id: `app_${app.id}`,
          appointmentId: app.id,
          description: `Consultation & Assessment (Follow-Up · ${app.date ? new Date(app.date).toLocaleDateString('en-IN') : 'Completed'})`,
          quantity: 1,
          unitPrice: 400,
          isUnresolvedFollowUp: false,
          isCoveredByPackage: false,
          patientPackageId: null
        };
        setLines(prev => [...prev.filter(l => l.appointmentId !== app.id), newLine]);
      } else if (choice === 'treatment') {
        const selectedPlanId = selectedAppMap[app.id];
        const chosenPlan = plans.find(p => p.id === selectedPlanId) || suggestPlanFromModalities(app.treatmentType, plans) || plans[0];
        const unitPrice = chosenPlan ? Number(chosenPlan.perSessionRate) : 600;
        const isDefaultCovered = !!activeCoursePackage;

        const newLine = {
          id: `app_${app.id}`,
          appointmentId: app.id,
          description: `${chosenPlan ? chosenPlan.name : 'Treatment'} Session (Follow-Up · ${app.date ? new Date(app.date).toLocaleDateString('en-IN') : 'Completed'})`,
          quantity: 1,
          unitPrice,
          plan: chosenPlan,
          isUnresolvedFollowUp: false,
          isCoveredByPackage: isDefaultCovered,
          patientPackageId: isDefaultCovered ? activeCoursePackage.id : null
        };
        setLines(prev => [...prev.filter(l => l.appointmentId !== app.id), newLine]);
      } else {
        // Checked but no choice made yet -> Unresolved Follow-Up line
        const newLine = {
          id: `app_${app.id}`,
          appointmentId: app.id,
          description: `Follow-Up Session (Needs Billing Choice)`,
          quantity: 1,
          unitPrice: 0,
          isUnresolvedFollowUp: true,
          isCoveredByPackage: false,
          patientPackageId: null
        };
        setLines(prev => [...prev.filter(l => l.appointmentId !== app.id), newLine]);
      }
    } else {
      const selectedPlanId = selectedAppMap[app.id];
      const chosenPlan = plans.find(p => p.id === selectedPlanId) || suggestPlanFromModalities(app.treatmentType, plans) || plans[0];
      const unitPrice = chosenPlan ? Number(chosenPlan.perSessionRate) : 600;
      const isDefaultCovered = !!activeCoursePackage;

      const newLine = {
        id: `app_${app.id}`,
        appointmentId: app.id,
        description: `${app.treatmentType || 'Physiotherapy Session'} (${app.date ? new Date(app.date).toLocaleDateString('en-IN') : 'Completed'})`,
        quantity: 1,
        unitPrice,
        plan: chosenPlan,
        isUnresolvedFollowUp: false,
        isCoveredByPackage: isDefaultCovered,
        patientPackageId: isDefaultCovered ? activeCoursePackage.id : null
      };

      setLines(prev => [...prev.filter(l => l.appointmentId !== app.id), newLine]);
    }
  };

  const addConsumableLine = (cons: any) => {
    const newLine = {
      id: `cons_${cons.id}_${Date.now()}`,
      description: cons.name + (cons.unit ? ` (${cons.unit})` : ''),
      quantity: 1,
      unitPrice: Number(cons.unitPrice),
      isCoveredByPackage: false
    };
    setLines(prev => [...prev, newLine]);
  };

  const addManualLine = () => {
    const newLine = {
      id: `manual_${Date.now()}`,
      description: 'Consultation & Assessment',
      quantity: 1,
      unitPrice: 400,
      isCoveredByPackage: false
    };
    setLines(prev => [...prev, newLine]);
  };

  const updateLineQuantity = (id: string, delta: number) => {
    setLines(prev => prev.map(l => {
      if (l.id === id) {
        const newQ = Math.max(1, l.quantity + delta);
        return { ...l, quantity: newQ };
      }
      return l;
    }));
  };

  const updateLinePrice = (id: string, newPrice: number) => {
    setLines(prev => prev.map(l => {
      if (l.id === id) {
        return { ...l, unitPrice: Math.max(0, newPrice) };
      }
      return l;
    }));
  };

  const toggleLineCourseCoverage = (id: string) => {
    if (!activeCoursePackage) return;
    setLines(prev => prev.map(l => {
      if (l.id === id) {
        const covered = !l.isCoveredByPackage;
        return {
          ...l,
          isCoveredByPackage: covered,
          patientPackageId: covered ? activeCoursePackage.id : null
        };
      }
      return l;
    }));
  };

  const removeLine = (id: string) => {
    setLines(prev => prev.filter(l => l.id !== id));
  };

  // Preview meter calculation (used + lines marked as covered by course)
  const simulatedSessionsUsed = useMemo(() => {
    if (!activeCoursePackage) return 0;
    const extraSessions = lines.filter(l => l.isCoveredByPackage).reduce((acc, l) => acc + l.quantity, 0);
    return activeCoursePackage.sessionsUsed + extraSessions;
  }, [activeCoursePackage, lines]);

  // Totals calculations (Strictly no GST)
  const subtotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      if (l.isCoveredByPackage) return sum; // Covered lines contribute ₹0 to payable total
      return sum + (l.quantity * l.unitPrice);
    }, 0);
  }, [lines]);

  const calculatedDiscount = useMemo(() => {
    if (discountType === 'percentage') {
      return (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  const grandTotal = Math.max(0, subtotal - calculatedDiscount);

  const handleSaveInvoice = async () => {
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }
    if (lines.length === 0) {
      setError('Please add at least one line item');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        patientId: selectedPatient.id,
        lines: lines.map(l => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.isCoveredByPackage ? 0 : l.unitPrice,
          isCoveredByPackage: l.isCoveredByPackage,
          patientPackageId: l.patientPackageId
        })),
        discountAmount: calculatedDiscount,
        notes
      };

      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate invoice');
      }

      const inv = await res.json();
      router.push(`/crm360/billing/invoices/${inv.id}`);
    } catch (err: any) {
      setError(err.message || 'Error generating invoice. Retrying...');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto selection:bg-white/30 select-none pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
            <Link href="/crm360/billing/invoices" className="hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Invoices
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-white" />
            New Invoice Builder
          </h1>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Two Panes Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Builder Pane (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Patient */}
          <div className="p-5 bg-[#0B0A10]/80 border border-white/10 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-white" /> 1. Patient Selection
            </h3>

            {selectedPatient ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-white/[0.04] border border-white/30 rounded-xl">
                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedPatient.fullName}</h4>
                    <p className="text-xs text-white/50">{selectedPatient.phone}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPatient(null);
                      setActiveCoursePackage(null);
                      setCompletedAppointments([]);
                      setLines([]);
                    }}
                    className="text-xs text-white/50 hover:text-white px-3 py-1 rounded-lg bg-white/5 border border-white/10 transition"
                  >
                    Change Patient
                  </button>
                </div>

                {/* Active Course Meter in Patient Card */}
                {activeCoursePackage && (
                  <div className="p-4 bg-gradient-to-r from-white/10 to-transparent border border-white/20 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        {activeCoursePackage.plan?.name || 'Active'} Course · {simulatedSessionsUsed} of {activeCoursePackage.daysPurchased} days used · {Math.max(0, activeCoursePackage.daysPurchased - simulatedSessionsUsed)} remaining
                      </span>
                    </div>
                    <CourseMeter
                      daysPurchased={activeCoursePackage.daysPurchased}
                      sessionsUsed={simulatedSessionsUsed}
                      planName={activeCoursePackage.plan?.name || 'Treatment Course'}
                      expiryDate={activeCoursePackage.expiryDate}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search patient by name or phone..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 outline-none transition"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredPatients.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className="p-3 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 rounded-xl cursor-pointer transition flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{p.fullName}</p>
                        <p className="text-[10px] text-white/40">{p.phone}</p>
                      </div>
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Unbilled Appointments Section (Shown ONLY if selected patient has unbilled appointments) */}
          {selectedPatient && completedAppointments.length > 0 && (
            <div className="p-5 bg-[#0B0A10]/80 border border-white/10 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white" /> Unbilled Completed Appointments
              </h3>
              <p className="text-xs text-white/50">Check to add appointment sessions to this invoice</p>

              <div className="space-y-2">
                {completedAppointments.map(app => {
                  const isChecked = lines.some(l => l.appointmentId === app.id);
                  const isFollowUp = app.appointmentType === 'FOLLOW_UP' || app.treatmentType?.toLowerCase().includes('follow');
                  const suggested = suggestPlanFromModalities(app.treatmentType, plans);
                  const currentSelectedPlanId = selectedAppMap[app.id] || suggested?.id || plans[0]?.id;
                  const currentChoice = followUpChoiceMap[app.id];

                  return (
                    <div
                      key={app.id}
                      className="p-3.5 bg-white/[0.03] border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAppointmentLine(app)}
                          className="w-4 h-4 accent-white cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white flex items-center gap-2">
                            <span>{app.treatmentType || 'Physiotherapy Session'}</span>
                            {isFollowUp && !currentChoice && isChecked && (
                              <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                                Needs billing choice
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-white/40">
                            {new Date(app.date).toLocaleDateString('en-IN')} at {app.startTime}
                          </p>
                        </div>
                      </div>

                      {/* Follow-up inline choice vs Regular plan suggestion */}
                      {isFollowUp ? (
                        <div className="flex flex-wrap items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                          <label className="flex items-center gap-1.5 text-xs font-medium text-white/90 cursor-pointer">
                            <input
                              type="radio"
                              name={`followup_${app.id}`}
                              checked={currentChoice === 'consultation'}
                              onChange={() => {
                                setFollowUpChoiceMap({ ...followUpChoiceMap, [app.id]: 'consultation' });
                                toggleAppointmentLine(app, 'consultation');
                              }}
                              className="accent-white cursor-pointer"
                            />
                            <span>Consultation only — ₹400</span>
                          </label>
                          <label className="flex items-center gap-1.5 text-xs font-medium text-white/90 cursor-pointer">
                            <input
                              type="radio"
                              name={`followup_${app.id}`}
                              checked={currentChoice === 'treatment'}
                              onChange={() => {
                                setFollowUpChoiceMap({ ...followUpChoiceMap, [app.id]: 'treatment' });
                                toggleAppointmentLine(app, 'treatment');
                              }}
                              className="accent-white cursor-pointer"
                            />
                            <span>Treatment</span>
                          </label>
                          {currentChoice === 'treatment' && (
                            <select
                              value={currentSelectedPlanId}
                              onChange={(e) => {
                                const pId = e.target.value;
                                setSelectedAppMap({ ...selectedAppMap, [app.id]: pId });
                                toggleAppointmentLine(app, 'treatment');
                              }}
                              className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-white"
                            >
                              {plans.map(p => (
                                <option key={p.id} value={p.id} className="bg-[#0F0D16] text-white">
                                  {p.name} ({formatCurrency(p.perSessionRate)})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white font-semibold">Suggested:</span>
                          <select
                            value={currentSelectedPlanId}
                            onChange={(e) => setSelectedAppMap({ ...selectedAppMap, [app.id]: e.target.value })}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-white"
                          >
                            {plans.map(p => (
                              <option key={p.id} value={p.id} className="bg-[#0F0D16] text-white">
                                {p.name} ({formatCurrency(p.perSessionRate)})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Add Invoice Lines Section */}
          {selectedPatient && (
            <div className="p-5 bg-[#0B0A10]/80 border border-white/10 rounded-2xl space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-white" /> 2. Add Invoice Lines
              </h3>

              {/* 1. Treatment Group (ABOVE Consumables) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white/60">Treatment Plans & Courses</p>
                  <button
                    type="button"
                    onClick={() => setIsSellCourseModalOpen(true)}
                    className="px-3 py-1 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Sell Course Package
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cstPlan = plans.find(p => p.name.toLowerCase().includes('cst') || p.name.toLowerCase().includes('craniosacral'));
                      if (cstPlan) {
                        addTreatmentPlanLine(cstPlan);
                      } else {
                        addManualLine();
                        const newLines = [...lines];
                        const lastIndex = newLines.length;
                        setLines([
                          ...lines,
                          {
                            id: `line-cst-${Date.now()}`,
                            description: 'Craniosacral Therapy (CST / BCST) Session',
                            quantity: 1,
                            unitPrice: 1500,
                            totalPrice: 1500,
                            isCoveredByPackage: false,
                          }
                        ]);
                      }
                    }}
                    className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-left transition flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200 transition">
                        + CST Session
                      </span>
                      <p className="text-[10px] text-emerald-200/60 mt-0.5 line-clamp-1">
                        Craniosacral Therapy / BCST
                      </p>
                    </div>
                    <div className="mt-2 text-xs font-bold text-emerald-300 tabular-nums">
                      ₹1,500.00
                    </div>
                  </button>

                  {plans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => addTreatmentPlanLine(plan)}
                      className="p-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl text-left transition flex flex-col justify-between group cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-bold text-white group-hover:text-white transition">
                          + {plan.name}
                        </span>
                        <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">
                          {plan.description}
                        </p>
                      </div>
                      <div className="mt-2 text-xs font-bold text-white tabular-nums">
                        {formatCurrency(plan.perSessionRate)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Consumables & Products Group */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <p className="text-xs font-semibold text-white/60">Consumables & Products</p>
                <div className="flex gap-2">
                  {consumables.map(c => (
                    <button
                      key={c.id}
                      onClick={() => addConsumableLine(c)}
                      className="px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-white rounded-xl transition flex items-center gap-2"
                    >
                      <span>+ {c.name}</span>
                      <span className="text-white tabular-nums">{formatCurrency(c.unitPrice)}</span>
                    </button>
                  ))}
                  <button
                    onClick={addManualLine}
                    className="px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-white/70 rounded-xl transition"
                  >
                    + Custom Item
                  </button>
                </div>
              </div>

              {/* Selected Invoice Lines List */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <p className="text-xs font-bold uppercase tracking-wider text-white/50">Current Lines ({lines.length})</p>

                {lines.length === 0 ? (
                  <p className="text-xs text-white/40 italic py-4 text-center">
                    No items added yet. Click above to add treatment sessions or consumables.
                  </p>
                ) : (
                  <AnimatePresence>
                    {lines.map((l) => (
                      <motion.div
                        key={l.id}
                        layout
                        initial={{ opacity: 0, height: 0, y: 10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        className={`p-4 rounded-xl border transition-all space-y-2 overflow-hidden ${
                          l.isCoveredByPackage
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-white/[0.03] border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <input
                            type="text"
                            value={l.description}
                            onChange={(e) => setLines(prev => prev.map(item => item.id === l.id ? { ...item, description: e.target.value } : item))}
                            className={`bg-transparent text-xs font-bold text-white outline-none flex-1 focus:border-b focus:border-white ${
                              l.isCoveredByPackage ? 'line-through text-white/60' : ''
                            }`}
                          />
                          <button
                            onClick={() => removeLine(l.id)}
                            className="text-white/40 hover:text-rose-400 p-1 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quiet Inline Walk-in vs Course Upsell Prompt */}
                        {l.plan && !l.isCoveredByPackage && !activeCoursePackage && (
                          <div className="text-[11px] text-white bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg flex items-center justify-between">
                            <span>
                              {l.plan.name} {formatCurrency(l.plan.perSessionRate)} today. {formatCurrency(l.plan.packageRate)}/day on a course.
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsSellCourseModalOpen(true)}
                              className="font-bold underline text-white hover:text-white/80 ml-2"
                            >
                              Sell Course
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-4 pt-1">
                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5">
                            <button
                              onClick={() => updateLineQuantity(l.id, -1)}
                              className="text-xs font-bold text-white/60 hover:text-white px-1"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold tabular-nums text-white w-4 text-center">
                              {l.quantity}
                            </span>
                            <button
                              onClick={() => updateLineQuantity(l.id, 1)}
                              className="text-xs font-bold text-white/60 hover:text-white px-1"
                            >
                              +
                            </button>
                          </div>

                          {/* Rate input / Covered indicator */}
                          {l.isCoveredByPackage ? (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-500/30">
                              Covered by Course Package
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-white/40">₹</span>
                              <input
                                type="number"
                                value={l.unitPrice}
                                onChange={(e) => updateLinePrice(l.id, parseFloat(e.target.value) || 0)}
                                className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold tabular-nums text-white outline-none focus:border-white"
                              />
                            </div>
                          )}

                          {/* Course Coverage Toggle */}
                          {activeCoursePackage && (
                            <button
                              onClick={() => toggleLineCourseCoverage(l.id)}
                              className={`text-[11px] font-semibold px-2 py-1 rounded-lg border transition ${
                                l.isCoveredByPackage
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                              }`}
                            >
                              {l.isCoveredByPackage ? '✓ Course Covered' : 'Bill to Course'}
                            </button>
                          )}

                          {/* Line Total */}
                          <div className="text-right text-xs font-bold tabular-nums text-white">
                            {formatCurrency(l.isCoveredByPackage ? 0 : l.quantity * l.unitPrice)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Discount Section */}
              <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/70">Discount</span>
                  <div className="flex gap-1 bg-white/5 border border-white/10 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setDiscountType('amount')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        discountType === 'amount' ? 'bg-white text-black' : 'text-white/60'
                      }`}
                    >
                      ₹ Amount
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        discountType === 'percentage' ? 'bg-white text-black' : 'text-white/60'
                      }`}
                    >
                      % Percent
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-white rounded-xl px-3 py-1.5 text-xs font-bold tabular-nums text-white outline-none"
                    placeholder="Enter discount..."
                  />
                  <span className="text-xs font-bold text-amber-300 tabular-nums shrink-0">
                    - {formatCurrency(calculatedDiscount)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Invoice Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional billing notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-white rounded-xl p-3 text-xs text-white outline-none transition"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Sticky Live Preview Pane (1/3) */}
        <div className="lg:sticky lg:top-8 space-y-4">
          <div className="bg-[#0B0A10]/90 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Live Summary</span>
              <span className="text-xs text-white font-bold">Draft</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-white/60">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold text-white">
                  <CountUpNumber value={subtotal} currency duration={500} />
                </span>
              </div>
              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-amber-300">
                  <span>Discount</span>
                  <span className="tabular-nums font-semibold">- {formatCurrency(calculatedDiscount)}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-baseline justify-between">
              <span className="text-sm font-bold text-white">Grand Total</span>
              <span className="text-2xl font-bold text-white tabular-nums">
                <CountUpNumber value={grandTotal} currency duration={500} />
              </span>
            </div>

            <button
              onClick={handleSaveInvoice}
              disabled={saving || !selectedPatient || lines.length === 0 || lines.some(l => l.isUnresolvedFollowUp)}
              className="w-full py-3 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : lines.some(l => l.isUnresolvedFollowUp) ? (
                <span className="text-amber-900 font-bold">Needs Billing Choice for Follow-up</span>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Issue Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sell Course Modal */}
      {selectedPatient && (
        <SellCourseModal
          isOpen={isSellCourseModalOpen}
          onClose={() => setIsSellCourseModalOpen(false)}
          patientId={selectedPatient.id}
          patientName={selectedPatient.fullName}
          onSuccess={() => {
            fetchPatientCourseAndAppointments(selectedPatient.id);
          }}
        />
      )}
    </div>
  );
}
