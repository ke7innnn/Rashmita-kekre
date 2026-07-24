'use client';
 
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Heart, Brain, Dumbbell, Trophy, Shield, Smile, Activity,
  Clock, Loader2, Search, BookOpen, Layers
} from 'lucide-react';
import GlassPanel from './GlassPanel';
 
export default function TreatmentsTab() {
  const [search, setSearch] = useState('');

  const { data: modalities = [], isLoading } = useQuery({
    queryKey: ['modalities'],
    queryFn: async () => {
      const res = await fetch('/api/modalities');
      if (!res.ok) throw new Error('Failed to fetch modalities');
      return res.json();
    },
  });
 
  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('cardio') || cat.includes('pulmonary') || cat.includes('chest')) {
      return Heart;
    }
    if (cat.includes('neuro') || cat.includes('brain') || cat.includes('rehab')) {
      return Brain;
    }
    if (cat.includes('ortho') || cat.includes('bone') || cat.includes('joint') || cat.includes('manual')) {
      return Dumbbell;
    }
    if (cat.includes('sports') || cat.includes('athlete')) {
      return Trophy;
    }
    if (cat.includes('geriatric') || cat.includes('senior')) {
      return Shield;
    }
    if (cat.includes('pediatric') || cat.includes('child')) {
      return Smile;
    }
    return Activity;
  };

  const filteredModalities = modalities.filter((m: any) => {
    const query = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      (m.description || '').toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query)
    );
  });
 
  const categories: { [key: string]: any[] } = {};
  filteredModalities.forEach((m: any) => {
    if (!categories[m.category]) {
      categories[m.category] = [];
    }
    categories[m.category].push(m);
  });

  const avgDuration = modalities.length > 0 
    ? Math.round(modalities.reduce((acc: number, m: any) => acc + m.defaultDuration, 0) / modalities.length)
    : 0;

  const totalCategoriesCount = Object.keys(
    modalities.reduce((acc: any, m: any) => {
      acc[m.category] = true;
      return acc;
    }, {})
  ).length;
 
  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-3xl font-serif text-[#F5F3FA] font-bold">Treatment Modalities Reference</h3>
          <p className="text-xs text-[rgba(245,243,250,0.62)] mt-0.5 font-medium">
            Standardized treatment library utilized for patient assignments and scheduling.
          </p>
        </div>

        {/* Search input bar */}
        {!isLoading && modalities.length > 0 && (
          <div className="relative min-w-[260px] md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(245,243,250,0.4)] stroke-[1.75]" />
            <input
              type="text"
              placeholder="Search modalities or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full text-xs glass-input font-medium placeholder-[rgba(245,243,250,0.4)]"
            />
          </div>
        )}
      </div>
 
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 text-[#12D6C4] animate-spin" />
        </div>
      ) : modalities.length === 0 ? (
        <GlassPanel className="p-16 text-center text-[rgba(245,243,250,0.4)] font-medium border-dashed text-xs">
          No treatment modalities registered in database.
        </GlassPanel>
      ) : (
        <div className="space-y-6">
          {/* Bento Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Stat 1: Total Modalities */}
            <GlassPanel accent="teal" className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#12D6C4]">
                <BookOpen className="h-4.5 w-4.5 stroke-[1.75]" />
              </div>
              <div className="space-y-0.5">
                <p className="eyebrow text-[9px] text-[rgba(245,243,250,0.45)]">Library Volume</p>
                <h4 className="text-base font-serif font-bold num-tabular text-[#F5F3FA]">
                  {modalities.length} Modalities
                </h4>
              </div>
            </GlassPanel>

            {/* Stat 2: Active Specialties */}
            <GlassPanel accent="violet" className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#7B5CFF]">
                <Layers className="h-4.5 w-4.5 stroke-[1.75]" />
              </div>
              <div className="space-y-0.5">
                <p className="eyebrow text-[9px] text-[rgba(245,243,250,0.45)]">Active Specialties</p>
                <h4 className="text-base font-serif font-bold num-tabular text-[#F5F3FA]">
                  {totalCategoriesCount} Categories
                </h4>
              </div>
            </GlassPanel>

            {/* Stat 3: Average Duration */}
            <GlassPanel accent="teal" className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#12D6C4]">
                <Clock className="h-4.5 w-4.5 stroke-[1.75]" />
              </div>
              <div className="space-y-0.5">
                <p className="eyebrow text-[9px] text-[rgba(245,243,250,0.45)]">Typical Session</p>
                <h4 className="text-base font-serif font-bold num-tabular text-[#F5F3FA]">
                  {avgDuration} mins Avg
                </h4>
              </div>
            </GlassPanel>
            
          </div>

          {/* Reference Cards Deck */}
          {Object.keys(categories).length === 0 ? (
            <GlassPanel className="p-16 text-center text-[rgba(245,243,250,0.4)] font-medium border-dashed text-xs">
              No matches found for "{search}"
            </GlassPanel>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(categories).map(([categoryName, items], index) => {
                const CategoryIcon = getCategoryIcon(categoryName);
                return (
                  <GlassPanel 
                    key={categoryName} 
                    className="p-6 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <h4 className="text-xl font-serif text-[#F5F3FA] border-b border-[rgba(255,255,255,0.08)] pb-3 flex items-center gap-2.5 font-bold">
                        <div className="p-1.5 rounded-lg bg-[rgba(18,214,196,0.12)] border border-[rgba(18,214,196,0.3)] text-[#12D6C4]">
                          <CategoryIcon className="h-4 w-4 stroke-[1.75]" />
                        </div>
                        {categoryName}
                      </h4>
                      
                      {/* Items */}
                      <div className="space-y-3 divide-y divide-[rgba(255,255,255,0.06)]">
                        {items.map((item: any, idx: number) => {
                          const isShort = item.defaultDuration <= 30;
                          return (
                            <div 
                              key={item.id} 
                              className={`group hover:bg-[rgba(255,255,255,0.02)] p-2 -mx-2 rounded-xl transition-colors ${
                                idx === 0 ? 'pt-0 border-t-0' : 'pt-3'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <h5 className="font-serif font-bold text-sm text-[#F5F3FA] group-hover:text-[#12D6C4] transition-colors">
                                  {item.name}
                                </h5>
                                
                                <span className={`flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold rounded-full num-tabular uppercase ${
                                  isShort 
                                    ? 'bg-[rgba(18,214,196,0.12)] text-[#12D6C4] border border-[rgba(18,214,196,0.3)]' 
                                    : 'bg-[rgba(255,180,84,0.12)] text-[#FFB454] border border-[rgba(255,180,84,0.3)]'
                                }`}>
                                  <Clock className="h-2.5 w-2.5 stroke-[2]" />
                                  {item.defaultDuration}m
                                </span>
                              </div>
                              <p className="text-xs text-[rgba(245,243,250,0.62)] mt-1 leading-relaxed font-medium">
                                {item.description || 'No description recorded.'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </GlassPanel>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
