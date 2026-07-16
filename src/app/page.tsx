import { prisma } from '@/lib/db';
import DashboardShell from '@/components/DashboardShell';

export default async function DashboardPage() {
  // Try to load settings from DB, fallback to default settings if DB is not initialized
  let settings = null;
  try {
    settings = await prisma.clinicSettings.findUnique({
      where: { id: 'clinic_settings' },
    });
  } catch (err) {
    console.warn('Database query failed, using static fallback settings:', err);
  }

  const defaultSettings = settings || {
    id: 'clinic_settings',
    name: 'Health 360 Physiotherapy Clinic',
    phone: '+919820098200',
    email: 'contact@health360physio.com',
    address: 'Shop No. 4, Sunrise Apartments, Carter Road, Bandra West, Mumbai, MH - 400050',
    primaryDoctor: 'Dr. Rashmita Karvir Kekre',
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    slotDuration: 30,
  };

  return (
    <DashboardShell 
      user={{ name: 'Dr. Rashmita', role: 'admin' }} 
      initialSettings={defaultSettings}
    />
  );
}
