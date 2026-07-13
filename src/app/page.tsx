import { prisma } from '@/lib/db';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardPage() {
  // Auth bypassed — show dashboard directly
  const mockUser = { name: 'Dr. Rashmita Kekre', role: 'admin' };

  // Pre-fetch some initial data server-side
  const settings = await prisma.clinicSettings.findUnique({
    where: { id: 'clinic_settings' },
  });

  return (
    <DashboardShell 
      user={mockUser} 
      initialSettings={settings || undefined}
    />
  );
}
