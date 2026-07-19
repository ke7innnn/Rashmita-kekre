'use client';

import React, { useState } from 'react';
import ReferralsTab from '@/components/ReferralsTab';
import PatientsTab from '@/components/PatientsTab';
import { AnimatePresence, motion } from 'framer-motion';

export default function ReferralsRoute() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // If a patient is selected from the referrals tab, we render the patient timeline view here.
  return (
    <AnimatePresence mode="wait">
      {selectedPatientId ? (
        <motion.div
          key="patient-view"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="h-full"
        >
          <PatientsTab 
            selectedPatientId={selectedPatientId} 
            setSelectedPatientId={setSelectedPatientId} 
          />
        </motion.div>
      ) : (
        <motion.div
          key="referrals-view"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="h-full"
        >
          <ReferralsTab onViewPatient={setSelectedPatientId} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
