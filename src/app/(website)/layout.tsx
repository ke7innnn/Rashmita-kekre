import type { Metadata } from 'next';
import '../../index.css';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';
import WhatsAppWidget from '@/components/WhatsAppWidget';

export const metadata: Metadata = {
  title: 'HEALTH 360 - Comprehensive Movement Analysis & Physiotherapy',
  description: 'Our breakthrough methodology captures hundreds of data points across your posture, mobility, strength, and cardiovascular health – all in one visit.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SmoothScrollProvider>
          {children}
          <WhatsAppWidget />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
