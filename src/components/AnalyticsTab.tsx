'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Search, Sparkles, AlertCircle, 
  Map, Calendar, Users, HelpCircle, FileText, Loader2
} from 'lucide-react';
import GlassPanel from './GlassPanel';

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
    if (count === 0) return 'bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.06)] text-[rgba(245,243,250,0.3)]';
    if (count <= 2) return 'bg-[rgba(18,214,196,0.15)] border-[rgba(18,214,196,0.3)] text-[#12D6C4] shadow-[0_0_12px_rgba(18,214,196,0.2)]';
    if (count <= 4) return 'bg-[rgba(123,92,255,0.2)] border-[rgba(123,92,255,0.35)] text-[#7B5CFF] shadow-[0_0_12px_rgba(123,92,255,0.25)]';
    return 'bg-[rgba(226,63,166,0.25)] border-[rgba(226,63,166,0.4)] text-[#E23FA6] shadow-[0_0_15px_rgba(226,63,166,0.3)]';
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
        <h3 className="text-3xl font-serif text-[#F5F3FA] font-bold">Practice Analytics & Note Search</h3>
        <p className="text-sm text-[rgba(245,243,250,0.62)] font-medium">
          Review clinic booking density, track patient referral conversion, and search notes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Heatmap density */}
        <GlassPanel className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <h4 className="text-xl font-serif font-bold text-[#F5F3FA] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#12D6C4] stroke-[1.75]" />
              OPD Demand Heatmap
            </h4>
            <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">Weekday vs Time segment appointment density</p>
          </div>

          {isHeatmapLoading ? (
            <div className="flex justify-center py-20 flex-1">
              <Loader2 className="h-6 w-6 text-[#12D6C4] animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div className="grid grid-cols-4 gap-2 text-center eyebrow text-[9px] mb-2">
                <span>Day</span>
                <span>Morning (9-12)</span>
                <span>Afternoon (12-15)</span>
                <span>Evening (15-18)</span>
              </div>

              {weekdays.map((day) => (
                <div key={day} className="grid grid-cols-4 gap-2 items-center">
                  <span className="text-xs font-bold text-[#F5F3FA]">{day}</span>
                  {segments.map((seg) => {
                    const count = getCellCount(day, seg);
                    return (
                      <motion.div
                        key={seg}
                        whileHover={{ scale: 1.02 }}
                        className={`py-2 px-2 rounded-xl text-center font-bold text-xs border ${getHeatmapColor(count)} flex items-center justify-center gap-1.5`}
                      >
                        {count > 0 ? (
                          <>
                            <span className="text-xs font-serif font-bold num-tabular leading-none">{count}</span>
                            <span style={{ fontSize: '9px' }} className="eyebrow opacity-80">session{count !== 1 ? 's' : ''}</span>
                          </>
                        ) : (
                          <span className="text-[rgba(245,243,250,0.3)] font-medium">—</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ))}

              {/* Heatmap Legend */}
              <div className="flex justify-end gap-4 pt-4 text-[10px] font-medium text-[rgba(245,243,250,0.6)]">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xs" />
                  <span>Empty</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[rgba(18,214,196,0.2)] border border-[rgba(18,214,196,0.3)] rounded-xs" />
                  <span>Light (1-2)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[rgba(123,92,255,0.25)] border border-[rgba(123,92,255,0.35)] rounded-xs" />
                  <span>Moderate (3-4)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 bg-[rgba(226,63,166,0.3)] border border-[rgba(226,63,166,0.4)] rounded-xs" />
                  <span>Dense (5+)</span>
                </div>
              </div>
            </div>
          )}
        </GlassPanel>

        {/* Referral conversions */}
        <GlassPanel className="lg:col-span-1 p-6 flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <h4 className="text-xl font-serif font-bold text-[#F5F3FA] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#12D6C4] stroke-[1.75]" />
              Referral Source Tracker
            </h4>
            <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">Top clinical channels converting to patients</p>
          </div>

          {isReferralsLoading ? (
            <div className="flex justify-center py-20 flex-1">
              <Loader2 className="h-6 w-6 text-[#12D6C4] animate-spin" />
            </div>
          ) : (
            <div className="space-y-3 flex-1 flex flex-col justify-start">
              {referrals.map((ref: any) => (
                <div key={ref.name} className="space-y-2 p-3 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl">
                  <div className="flex justify-between items-center text-xs font-bold text-[#F5F3FA]">
                    <span className="truncate pr-2">{ref.name}</span>
                    <span className="shrink-0 bg-[rgba(18,214,196,0.12)] text-[#12D6C4] px-2 py-0.5 rounded-full text-[9px] font-bold border border-[rgba(18,214,196,0.3)] num-tabular">
                      {ref.count} Patient{ref.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="w-full bg-[rgba(255,255,255,0.04)] h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (ref.count / Math.max(1, referrals[0]?.count || 1)) * 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-[#12D6C4] to-[#7B5CFF] h-full rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>
      </div>

      {/* Natural language clinical search */}
      <GlassPanel className="p-6 space-y-6">
        <div className="space-y-1">
          <h4 className="text-xl font-serif font-bold text-[#F5F3FA] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#12D6C4] stroke-[1.75]" />
            Natural-Language Note Index
          </h4>
          <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">Query session summaries, tags, and complaints (e.g. "frozen shoulder last month")</p>
        </div>

        <div className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[rgba(245,243,250,0.4)] stroke-[1.75] shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Type search terms... e.g. 'ACL reconstruction', 'chronic back pain'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-4 py-3 w-full text-sm glass-input font-medium placeholder-[rgba(245,243,250,0.4)]"
          />
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {isSearchLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 text-[#12D6C4] animate-spin" />
            </div>
          ) : searchResults.length === 0 && searchQuery.trim().length >= 3 ? (
            <div className="p-6 text-center text-[rgba(245,243,250,0.4)] text-xs font-medium bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl">
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
                  className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] p-4 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-3 hover:border-[rgba(18,214,196,0.4)] transition-colors duration-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        res.type === 'PATIENT_PROFILE' 
                          ? 'bg-[rgba(18,214,196,0.12)] text-[#12D6C4] border-[rgba(18,214,196,0.3)]' 
                          : 'bg-[rgba(123,92,255,0.12)] text-[#7B5CFF] border-[rgba(123,92,255,0.3)]'
                      }`}>
                        {res.type.replace('_', ' ')}
                      </span>
                      <h5 className="font-serif font-bold text-sm text-[#F5F3FA]">{res.title}</h5>
                    </div>
                    <p className="text-xs text-[rgba(245,243,250,0.62)] font-medium">{res.subtitle}</p>
                    <p className="text-xs text-[rgba(245,243,250,0.8)] font-medium leading-relaxed italic">"{res.description}"</p>
                  </div>

                  <div className="flex flex-wrap gap-1 md:self-start">
                    {res.tags.map((tag: string, idx: number) => (
                      <span key={idx} className="eyebrow text-[9px] bg-[rgba(255,255,255,0.04)] text-[rgba(245,243,250,0.6)] border border-[rgba(255,255,255,0.08)] px-2 py-0.5 rounded-md capitalize">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
