'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Check, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchableDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onCreateNew?: (value: string) => void;
  placeholder?: string;
  createLabel?: string;
  disabled?: boolean;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  onCreateNew,
  placeholder = "Select or search...",
  createLabel = "Create new",
  disabled = false
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter unique options based on search
  const uniqueOptions = Array.from(new Set(options.filter(Boolean)));
  const filteredOptions = uniqueOptions.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exactMatch = uniqueOptions.some(
    opt => opt.toLowerCase() === searchTerm.trim().toLowerCase()
  );

  const showCreateOption = onCreateNew && searchTerm.trim().length > 0 && !exactMatch;

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreate = () => {
    if (onCreateNew && searchTerm.trim()) {
      onCreateNew(searchTerm.trim());
      onChange(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative w-full select-none" ref={wrapperRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full text-xs rounded-xl border ${isOpen ? 'border-[#12D6C4] ring-1 ring-[#12D6C4]/30' : 'border-white/15'} ${disabled ? 'bg-white/5 opacity-50 cursor-not-allowed' : 'bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer'} px-3.5 py-2.5 text-white font-semibold transition-all`}
      >
        <span className={value ? "text-white font-semibold" : "text-white/40 font-medium"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-white/50 transition-transform ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-[#0F0D16] border border-white/20 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
          >
            <div className="p-2 border-b border-white/10 bg-white/5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-white/[0.04] border border-white/15 rounded-xl text-white placeholder-white/35 font-semibold focus:outline-none focus:border-[#12D6C4]"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
              {filteredOptions.length === 0 && !showCreateOption ? (
                <div className="p-3 text-center text-xxs text-white/40 italic font-medium">
                  No matches found.
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <div
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl cursor-pointer transition-colors ${
                      value === option 
                        ? 'bg-[#12D6C4]/20 text-[#12D6C4]' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{option}</span>
                    {value === option && <Check className="h-3.5 w-3.5 text-[#12D6C4] shrink-0" />}
                  </div>
                ))
              )}

              {showCreateOption && (
                <div
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#12D6C4] hover:bg-[#12D6C4]/15 rounded-xl cursor-pointer transition-colors border-t border-white/10 mt-1"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span>{createLabel}: "{searchTerm}"</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
