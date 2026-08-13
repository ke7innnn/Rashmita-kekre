'use client';

import React, { useState } from 'react';
import OverviewTab from '@/components/OverviewTab';
import { AnimatePresence, motion } from 'framer-motion';
import { PhoneCall, X } from 'lucide-react';

export default function CRMOverviewRoute() {
  const [showRedirectModal, setShowRedirectModal] = useState(false);

  const handleConfirmRedirect = () => {
    setShowRedirectModal(false);
    window.open('https://health360-nu.vercel.app', '_blank');
  };

  return (
    <div className="h-full relative">
      <OverviewTab onVoiceAgentClick={() => setShowRedirectModal(true)} />

      {/* External Voice Agent Redirect Modal */}
      <AnimatePresence>
        {showRedirectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRedirectModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="relative bg-[#0F0D16] border border-white/20 p-6 rounded-3xl shadow-2xl w-full max-w-sm z-10 flex flex-col items-center text-center space-y-4 text-white"
            >
              <button 
                onClick={() => setShowRedirectModal(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white cursor-pointer"
              >
                <X className="h-4.5 w-4.5 stroke-[1.75]" />
              </button>
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-[#12D6C4]">
                <PhoneCall className="h-5.5 w-5.5 stroke-[1.75]" />
              </div>
              <div className="space-y-1.5 px-2">
                <h3 className="text-xl font-serif font-bold text-white">
                  Redirect to Voice App?
                </h3>
                <p className="text-xs text-white/65 leading-relaxed font-semibold">
                  Would you like to open the external Health 360 AI Voice Agent application?
                </p>
              </div>
              <div className="flex w-full gap-3 pt-2">
                <button
                  onClick={() => setShowRedirectModal(false)}
                  className="flex-1 px-4 py-2.5 border border-white/15 hover:bg-white/10 text-xs font-bold rounded-xl transition-colors text-white/80 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRedirect}
                  className="flex-1 px-4 py-2.5 bg-white hover:bg-white/90 text-black text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Proceed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
