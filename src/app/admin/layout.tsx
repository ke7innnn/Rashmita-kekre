import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import '../(crm)/globals.css';

export const metadata: Metadata = {
  title: 'Admin Review Queue — Health 360 CRM',
  description: 'Quarantined contact review, batch approvals, and patient relation merge operations.',
  icons: {
    icon: [
      { url: '/logo/rklogo.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/logo/rklogo.png',
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&f[]=satoshi@400,500,700&display=swap" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0A0711] text-[#F5F3FA] font-['Satoshi',sans-serif]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
