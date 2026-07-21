'use client';
 
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Heart, Brain, Dumbbell, Trophy, Shield, Smile, Activity,
  Clock, Loader2, Search, BookOpen, Layers
} from 'lucide-react';
 
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
 
  // Dynamic category to icon mapping
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

  // Filter modalities based on search query
  const filteredModalities = modalities.filter((m: any) => {
    const query = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      (m.description || '').toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query)
    );
  });
 
  // Group modalities by category
  const categories: { [key: string]: any[] } = {};
  filteredModalities.forEach((m: any) => {
    if (!categories[m.category]) {
      categories[m.category] = [];
    }
    categories[m.category].push(m);
  });

  // Calculate statistics for bento banner
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
          <h3 className="text-3xl font-serif text-[#2B2620] font-semibold">Treatment Modalities Reference</h3>
          <p className="text-xs text-[#2B2620]/50 mt-0.5 font-bold">
            Standardized treatment library utilized for patient assignments and scheduling.
          </p>
        </div>

        {/* Search input bar */}
        {!isLoading && modalities.length > 0 && (
          <div className="relative min-w-[260px] md:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#2B2620]/30 stroke-[1.75]" />
            <input
              type="text"
              placeholder="Search modalities or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full text-xs bg-[#FFFCF6] border border-[#EADFCA] rounded-xl focus:border-primary focus:outline-hidden text-[#2B2620] placeholder-[#2B2620]/45 font-semibold shadow-xxs transition-colors"
            />
          </div>
        )}
      </div>
 
      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : modalities.length === 0 ? (
        <div className="p-16 text-center text-foreground/45 border border-dashed border-[#EADFCA] rounded-2xl font-bold bg-[#FFFCF6]">
          No treatment modalities registered in database.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bento Stats Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Stat 1: Total Modalities */}
            <div className="bg-[#FFFCF6] border border-[#EADFCA]/65 p-4 rounded-xl flex items-center gap-3 shadow-xxs">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <BookOpen className="h-4.5 w-4.5 stroke-[1.75]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-mono font-bold text-[#2B2620]/45 uppercase tracking-wider">Library Volume</p>
                <h4 className="text-base font-serif font-bold text-[#2B2620]">
                  {modalities.length} Modalities
                </h4>
              </div>
            </div>

            {/* Stat 2: Active Specialties */}
            <div className="bg-[#FFFCF6] border border-[#EADFCA]/65 p-4 rounded-xl flex items-center gap-3 shadow-xxs">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Layers className="h-4.5 w-4.5 stroke-[1.75]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-mono font-bold text-[#2B2620]/45 uppercase tracking-wider">Active Specialties</p>
                <h4 className="text-base font-serif font-bold text-[#2B2620]">
                  {totalCategoriesCount} Categories
                </h4>
              </div>
            </div>

            {/* Stat 3: Average Duration */}
            <div className="bg-[#FFFCF6] border border-[#EADFCA]/65 p-4 rounded-xl flex items-center gap-3 shadow-xxs">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="h-4.5 w-4.5 stroke-[1.75]" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-mono font-bold text-[#2B2620]/45 uppercase tracking-wider">Typical Session</p>
                <h4 className="text-base font-serif font-bold text-[#2B2620]">
                  {avgDuration} mins Avg
                </h4>
              </div>
            </div>
            
          </div>

          {/* Reference Cards Deck */}
          {Object.keys(categories).length === 0 ? (
            <div className="p-16 text-center text-foreground/45 border border-dashed border-[#EADFCA] rounded-2xl font-bold bg-[#FFFCF6]">
              No matches found for "{search}"
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(categories).map(([categoryName, items], index) => {
                const CategoryIcon = getCategoryIcon(categoryName);
                return (
                  <motion.div 
                    key={categoryName} 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 24, delay: index * 0.05 }}
                    className="bg-[#FFFCF6] p-6 rounded-2xl shadow-[0_6px_25px_rgba(42,38,32,0.015)] border border-[#EADFCA]/65 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <h4 className="text-xl font-serif text-[#2B2620] border-b border-[#EADFCA]/60 pb-2.5 flex items-center gap-2.5 font-bold">
                        <div className="p-1.5 rounded-lg bg-[#FAF6EF] border border-[#EADFCA]/50 text-primary">
                          <CategoryIcon className="h-4 w-4 stroke-[1.75]" />
                        </div>
                        {categoryName}
                      </h4>
                      
                      {/* Items */}
                      <div className="space-y-3.5 divide-y divide-[#EADFCA]/30">
                        {items.map((item: any, idx: number) => {
                          const isShort = item.defaultDuration <= 30;
                          return (
                            <div 
                              key={item.id} 
                              className={`group hover:bg-[#FAF6EF]/30 p-2 -mx-2 rounded-xl transition-all duration-200 ${
                                idx === 0 ? 'pt-0 border-t-0' : 'pt-3.5 border-t border-t-[#EADFCA]/30'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-4">
                                <h5 className="font-serif font-bold text-sm text-[#2B2620] group-hover:text-primary transition-colors">
                                  {item.name}
                                </h5>
                                
                                <span className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full tracking-wider uppercase ${
                                  isShort 
                                    ? 'bg-[#E2ECE9] text-[#4E6551] border border-[#4E6551]/10' 
                                    : 'bg-[#FCE2DB] text-[#D98353] border border-[#D98353]/10'
                                }`}>
                                  <Clock className="h-2.5 w-2.5 stroke-[2]" />
                                  {item.defaultDuration}m
                                </span>
                              </div>
                              <p className="text-[11px] text-[#2B2620]/60 mt-1 leading-relaxed font-semibold">
                                {item.description || 'No description recorded.'}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
