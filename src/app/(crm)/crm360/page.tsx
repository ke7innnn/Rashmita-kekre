'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import OverviewTab from '@/components/OverviewTab';

export default function CRMOverviewRoute() {
  const router = useRouter();

  return (
    <div className="h-full relative">
      <OverviewTab onVoiceAgentClick={() => router.push('/crm360/calls')} />
    </div>
  );
}
