import type { Metadata } from 'next';
import '../../index.css';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';
import WhatsAppWidget from '@/components/WhatsAppWidget';
import { PWAInstallProvider } from '@/components/PWAInstallProvider';

export const metadata: Metadata = {
  title: 'HEALTH 360 - Comprehensive Movement Analysis & Physiotherapy',
  description: 'Our breakthrough methodology captures hundreds of data points across your posture, mobility, strength, and cardiovascular health – all in one visit.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Health 360',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/logo/rklogo.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0284c7" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body suppressHydrationWarning>
        <PWAInstallProvider>
          <SmoothScrollProvider>
            {children}
            <WhatsAppWidget />
          </SmoothScrollProvider>
        </PWAInstallProvider>
      </body>
    </html>
  );
}
