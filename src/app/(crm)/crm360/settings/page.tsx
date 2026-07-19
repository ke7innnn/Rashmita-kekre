'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SettingsTab from '@/components/SettingsTab';

export default function SettingsRoute() {
  const router = useRouter();
  const [user, setUser] = useState<any>({ name: 'Loading', role: 'Staff' });

  useEffect(() => {
    const session = localStorage.getItem('h360_session');
    if (!session) {
      router.replace('/login');
    } else {
      try {
        const parsed = JSON.parse(session);
        setUser(parsed);
      } catch (e) {
        router.replace('/login');
      }
    }
  }, [router]);

  return (
    <div className="h-full">
      <SettingsTab user={user} />
    </div>
  );
}
