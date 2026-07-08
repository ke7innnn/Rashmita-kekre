import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Pre-fetch some initial data server-side
  const settings = await prisma.clinicSettings.findUnique({
    where: { id: 'clinic_settings' },
  });

  return (
    <DashboardShell 
      user={session.user as any} 
      initialSettings={settings || undefined}
    />
  );
}
