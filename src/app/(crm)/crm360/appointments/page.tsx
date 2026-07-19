'use client';

import React, { useState } from 'react';
import OPDDashboard from '@/components/OPDDashboard';
import ManageAppointmentPage from '@/components/ManageAppointmentPage';
import { AnimatePresence, motion } from 'framer-motion';

export default function AppointmentsRoute() {
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  return (
    <AnimatePresence mode="wait">
      {selectedAppointmentId ? (
        <motion.div
          key="manage"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="h-full"
        >
          <ManageAppointmentPage 
            appointmentId={selectedAppointmentId} 
            onBack={() => setSelectedAppointmentId(null)} 
          />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="h-full"
        >
          <OPDDashboard onManageAppointment={setSelectedAppointmentId} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
