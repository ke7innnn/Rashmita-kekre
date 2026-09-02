'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import OverviewTab from '@/components/OverviewTab';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function CRMOverviewRoute() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.replace('/crm360/patients');
    }
  }, [status, isAdmin, router]);

  if (status === 'loading') {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center space-y-3 select-none">
        <ShieldAlert className="w-12 h-12 text-rose-400" />
        <h2 className="text-lg font-serif font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-white/50 max-w-sm">
          Clinic Overview and management analytics are strictly reserved for Administrator accounts. Redirecting to Patients Directory...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <OverviewTab onVoiceAgentClick={() => router.push('/crm360/calls')} />
    </div>
  );
}
