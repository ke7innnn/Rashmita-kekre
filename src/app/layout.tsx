import type { Metadata } from 'next';
import '../index.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
