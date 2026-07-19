import React from 'react';
import CRMSidebar from '@/components/CRMSidebar';

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <CRMSidebar>
      {children}
    </CRMSidebar>
  );
}
