'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Search, Sparkles, AlertCircle, 
  Map, Calendar, Users, HelpCircle, FileText, Loader2
} from 'lucide-react';

export default function AnalyticsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // 1. Fetch Heatmap Analytics
  const { data: heatmap = [], isLoading: isHeatmapLoading } = useQuery({
    queryKey: ['analytics-heatmap'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/heatmap');
      if (!res.ok) throw new Error('Failed to fetch heatmap');
      return res.json();
    },
  });

  // 2. Fetch Referral Analytics
  const { data: referrals = [], isLoading: isReferralsLoading } = useQuery({
    queryKey: ['analytics-referrals'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/referrals');
      if (!res.ok) throw new Error('Failed to fetch referrals');
      return res.json();
    },
  });

  // 3. Fetch Clinical Search Results
  const { data: searchResults = [], isLoading: isSearchLoading } = useQuery({
    queryKey: ['clinical-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await fetch(`/api/search?q=${searchQuery}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: searchQuery.trim().length >= 3,
  });

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-[#FFFCF6] border-[#EADFCA] text-[#2B2620]/30';
    if (count <= 2) return 'bg-[#E2ECE9] border-[#B9D0C8] text-[#3C5040]';
    if (count <= 4) return 'bg-[#FFEECB] border-[#FBD688] text-[#9A6F1A]';
    return 'bg-[#FCE2DB] border-[#F6B7A5] text-[#A63A1D]';
  };

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const segments = ['MORNING', 'AFTERNOON', 'EVENING'];

  const getCellCount = (day: string, segment: string) => {
    const match = heatmap.find((h: any) => h.day === day && h.segment === segment);
    return match ? match.count : 0;
  };

  return (
    <div className="space-y-8 select-none">
      {/* Title */}
      <div className="space-y-0.5">
        <h3 className="text-3xl font-serif text-[#2B2620] font-semibold">Practice Analytics & Note Search</h3>
        <p className="text-sm text-foreground/45 font-bold">
          Review clinic booking density, track patient referral conversion, and search notes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heatmap density */}
        <div className="lg:col-span-2 bg-[#FFFCF6] p-6 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.015)] flex flex-col justify-between border border-[#EADFCA]">
          <div className="space-y-1 mb-4">
            <h4 className="text-xl font-serif font-bold text-[#2B2620] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary stroke-[1.75]" />
              OPD Demand Heatmap
            </h4>
            <p className="text-xs text-[#2B2620]/50 font-bold">Weekday vs Time segment appointment density</p>
          </div>

          {isHeatmapLoading ? (
            <div className="flex justify-center py-20 flex-1">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-foreground/40 uppercase tracking-wider mb-2">
                <span>Day</span>
                <span>Morning (9-12)</span>
                <span>Afternoon (12-15)</span>
                <span>Evening (15-18)</span>
              </div>

              {weekdays.map((day) => (
                <div key={day} className="grid grid-cols-4 gap-2 items-center">
                  <span className="text-xs font-bold text-[#2B2620]">{day}</span>
                  {segments.map((seg) => {
                    const count = getCellCount(day, seg);
                    return (
                      <motion.div
                        key={seg}
                        whileHover={{ scale: 1.02 }}
                        className={`py-2 px-2 rounded-xl text-center font-bold text-xs border ${getHeatmapColor(count)} shadow-xxs flex items-center justify-center gap-1.5`}
                      >
                        {count > 0 ? (
                          <>
                            <span className="text-xs font-bold leading-none">{count}</span>
                            <span style={{ fontSize: '9px' }} className="font-semibold uppercase tracking-wider opacity-70">session{count !== 1 ? 's' : ''}</span>
                          </>
                        ) : (
                          <span className="text-[#2B2620]/30 font-medium">—</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ))}

              {/* Heatmap Legend */}
              <div className="flex justify-end gap-4 pt-4 text-[9px] font-bold text-foreground/50">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[#FFFCF6] border border-[#EADFCA] rounded-xs" />
                  <span>Empty</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[#E2ECE9] border border-[#B9D0C8] rounded-xs" />
                  <span>Light (1-2)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[#FFEECB] border border-[#FBD688] rounded-xs" />
                  <span>Moderate (3-4)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[#FCE2DB] border border-[#F6B7A5] rounded-xs" />
                  <span>Dense (5+)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Referral conversions */}
        <div className="lg:col-span-1 bg-[#FFFCF6] p-6 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.015)] flex flex-col justify-between border border-[#EADFCA]">
          <div className="space-y-1 mb-4">
            <h4 className="text-xl font-serif font-bold text-[#2B2620] flex items-center gap-2">
              <Users className="h-5 w-5 text-primary stroke-[1.75]" />
              Referral Source Tracker
            </h4>
            <p className="text-xs text-[#2B2620]/50 font-bold">Top clinical channels converting to patients</p>
          </div>

          {isReferralsLoading ? (
            <div className="flex justify-center py-20 flex-1">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 flex-1 flex flex-col justify-start">
              {referrals.map((ref: any) => (
                <div key={ref.name} className="space-y-2 p-3 bg-[#FAF6EF]/30 border border-[#EADFCA] rounded-xl shadow-xxs">
                  <div className="flex justify-between items-center text-xs font-bold text-[#2B2620]">
                    <span className="truncate pr-2">{ref.name}</span>
                    <span className="shrink-0 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-bold border border-primary/10">
                      {ref.count} Patient{ref.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="w-full bg-[#FAF6EF] h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (ref.count / Math.max(1, referrals[0]?.count || 1)) * 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="bg-primary h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Natural language clinical search */}
      <div className="bg-[#FFFCF6] border border-[#EADFCA] p-6 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.015)] space-y-6">
        <div className="space-y-1">
          <h4 className="text-xl font-serif font-bold text-[#2B2620] flex items-center gap-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-transparent stroke-[0]" />
            <Sparkles className="h-5 w-5 text-primary stroke-[1.75]" />
            Natural-Language Note Index
          </h4>
          <p className="text-xs text-[#2B2620]/50 font-bold">Query session summaries, tags, and complaints (e.g. "frozen shoulder last month")</p>
        </div>

        <div className="relative flex items-center bg-[#FAF6EF] border border-[#EADFCA] rounded-xl px-3.5 py-3 shadow-xxs">
          <Search className="h-5 w-5 text-[#2B2620]/30 stroke-[1.75] shrink-0" />
          <input
            type="text"
            placeholder="Type search terms... e.g. 'ACL reconstruction', 'chronic back pain'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-3 w-full text-sm bg-transparent border-0 outline-hidden text-[#2B2620] placeholder-[#2B2620]/40 font-semibold"
          />
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {isSearchLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : searchResults.length === 0 && searchQuery.trim().length >= 3 ? (
            <div className="p-6 text-center text-[#2B2620]/45 text-xs font-bold bg-[#FAF6EF] border border-[#EADFCA]/45 rounded-xl">
              No matching clinical logs or patient diagnoses found.
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((res: any) => (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.005 }}
                  className="bg-[#FAF6EF] border border-[#EADFCA] p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3 shadow-xxs hover:border-primary transition-colors duration-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        res.type === 'PATIENT_PROFILE' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-accent/10 text-accent border-accent/20'
                      }`}>
                        {res.type.replace('_', ' ')}
                      </span>
                      <h5 className="font-serif font-bold text-sm text-[#2B2620]">{res.title}</h5>
                    </div>
                    <p className="text-xs text-[#2B2620]/60 font-semibold">{res.subtitle}</p>
                    <p className="text-xs text-[#2B2620]/75 font-medium leading-relaxed italic">"{res.description}"</p>
                  </div>

                  <div className="flex flex-wrap gap-1 md:self-start">
                    {res.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="text-[9px] font-bold bg-[#FFFCF6] text-[#2B2620]/50 border border-[#EADFCA] px-2 py-0.5 rounded-md capitalize">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
