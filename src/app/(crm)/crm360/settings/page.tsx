'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SettingsTab from '@/components/SettingsTab';

export default function SettingsRoute() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any>({ name: 'Loading', role: 'Staff' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/crm360/login');
    } else if (session?.user) {
      setUser(session.user);
    }
  }, [router, session, status]);

  return (
    <div className="h-full">
      <SettingsTab user={user} />
    </div>
  );
}
