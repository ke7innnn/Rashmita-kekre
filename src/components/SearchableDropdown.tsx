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
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full text-xs rounded-xl border ${isOpen ? 'border-primary ring-1 ring-primary/20' : 'border-[#EADFCA]'} ${disabled ? 'bg-[#FAF6EF]/20 opacity-60 cursor-not-allowed' : 'bg-[#FAF6EF]/40 hover:bg-[#FAF6EF]/60 cursor-pointer'} px-3.5 py-2.5 text-[#2B2620] font-semibold shadow-xxs transition-all`}
      >
        <span className={value ? "text-[#2B2620]" : "text-[#2B2620]/45"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#2B2620]/45 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-[#FFFCF6] border border-[#EADFCA]/60 rounded-xl shadow-[0_8px_30px_rgba(42,38,32,0.12)] overflow-hidden"
          >
            <div className="p-2 border-b border-[#EADFCA]/40 bg-[#FAF6EF]/30">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#2B2620]/40" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-[#EADFCA] rounded-lg text-[#2B2620] placeholder-[#2B2620]/35 font-semibold focus:outline-hidden focus:border-primary shadow-inner"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto p-1">
              {filteredOptions.length === 0 && !showCreateOption ? (
                <div className="p-3 text-center text-xxs text-[#2B2620]/45 italic font-medium">
                  No matches found.
                </div>
              ) : (
                filteredOptions.map((option, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelect(option)}
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-primary/5 rounded-lg cursor-pointer text-xs font-semibold text-[#2B2620] transition-colors"
                  >
                    <span className="truncate">{option}</span>
                    {value === option && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                ))
              )}

              {showCreateOption && (
                <div
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-3 py-2.5 mt-1 border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded-lg cursor-pointer text-xs font-bold text-primary transition-colors"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="truncate">{createLabel} "{searchTerm}"</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
