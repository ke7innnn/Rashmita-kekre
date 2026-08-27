'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileText, Plus, Search, ShieldAlert, Lock, ArrowRight, User, Calendar
} from 'lucide-react';

export default function AssessmentsDirectoryPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assessments');
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assessments.filter(a => 
    (a.patient?.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.provisionalDiagnosis || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.ptDiagnosis || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 select-none font-sans text-white">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Clinical Records
          </span>
          <h1 className="text-2xl font-serif font-bold text-white mt-1 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-400" /> Digital Initial Assessments
          </h1>
          <p className="text-xs text-white/60 font-semibold mt-0.5">
            Structured clinical assessment records, ROM/MMT measurements, and red flag safety logs.
          </p>
        </div>

        <Link
          href="/crm360/assessments/new"
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-black text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> + New Assessment
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative flex items-center max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          placeholder="Search by patient name or diagnosis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/15 rounded-2xl text-xs text-white placeholder-white/40 font-medium"
        />
      </div>

      {/* Directory List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <FileText className="w-10 h-10 text-white/40 mx-auto" />
          <h3 className="text-base font-bold text-white">No Clinical Assessments Found</h3>
          <p className="text-xs text-white/50">Click "+ New Assessment" to create your first digital evaluation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const hasRedFlag = Boolean(
              a.redFlagWeightLoss || a.redFlagBowelBladder || a.redFlagSaddleAnaesthesia || a.redFlagNightPain
            );

            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-white/10 border border-white/20 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl hover:border-emerald-500/40 transition"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                      {a.type}
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/10 text-white/70 border border-white/20 rounded-md">
                      {a.status}
                    </span>
                    {hasRedFlag && (
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Red Flag Recorded
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-white/50" /> {a.patient?.fullName || 'Patient'}
                  </h3>

                  <p className="text-xs text-white/70 font-medium leading-relaxed">
                    {a.ptDiagnosis || a.provisionalDiagnosis || 'No diagnosis specified.'}
                  </p>

                  <div className="text-[10px] text-white/40 flex items-center gap-3 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(a.assessmentDate).toLocaleDateString()}
                    </span>
                    {a.signedAt && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Lock className="w-3 h-3" /> Signed {new Date(a.signedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/crm360/assessments/${a.id}`}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/15 cursor-pointer"
                  >
                    View Record <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
