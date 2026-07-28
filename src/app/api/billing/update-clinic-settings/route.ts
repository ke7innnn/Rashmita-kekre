import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const updated = await prisma.clinicSettings.upsert({
      where: { id: 'clinic_settings' },
      update: {
        name: 'Health360',
        tagline: 'Physiotherapy and Craniosacral Therapy Clinic',
        phone: '8482812859',
        email: 'health360vasai@gmail.com',
        address: 'Shop No.1, Amardeep Society, Om Nagar, Vasai (W).',
        primaryDoctor: 'Dr. Rashmita Karvir Kekre',
        doctorNameCredentials: 'Dr. Rashmita Karvir Kekre\nB.PTh.(M.I.A.P.)\nBCST',
        website: 'health360vasai@gmail.com',
        upiId: '8482812859@upi'
      },
      create: {
        id: 'clinic_settings',
        name: 'Health360',
        tagline: 'Physiotherapy and Craniosacral Therapy Clinic',
        phone: '8482812859',
        email: 'health360vasai@gmail.com',
        address: 'Shop No.1, Amardeep Society, Om Nagar, Vasai (W).',
        primaryDoctor: 'Dr. Rashmita Karvir Kekre',
        doctorNameCredentials: 'Dr. Rashmita Karvir Kekre\nB.PTh.(M.I.A.P.)\nBCST',
        website: 'health360vasai@gmail.com',
        upiId: '8482812859@upi'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'ClinicSettings database row updated successfully with real Vasai data!',
      settings: updated
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
