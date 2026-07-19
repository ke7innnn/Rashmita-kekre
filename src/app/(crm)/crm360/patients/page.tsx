'use client';

import React, { useState } from 'react';
import PatientsTab from '@/components/PatientsTab';

export default function PatientsRoute() {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  return (
    <div className="h-full">
      <PatientsTab 
        selectedPatientId={selectedPatientId} 
        setSelectedPatientId={setSelectedPatientId} 
      />
    </div>
  );
}
