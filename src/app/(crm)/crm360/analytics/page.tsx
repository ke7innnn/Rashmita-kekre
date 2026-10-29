'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AnalyticsTab from '@/components/AnalyticsTab';
import { ShieldAlert } from 'lucide-react';

export default function AnalyticsRoute() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const userRole = (session?.user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.replace('/crm360/patients');
    }
  }, [status, isAdmin, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#12D6C4]" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4 pt-20">
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-300 backdrop-blur-xl">
          <ShieldAlert className="w-10 h-10 mx-auto text-rose-400 mb-2" />
          <h2 className="text-base font-bold text-white">Admin Access Restricted</h2>
          <p className="text-xs text-white/60 mt-1">
            Clinical Practice & Operations Review is reserved for Clinic Administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <AnalyticsTab />
    </div>
  );
}
