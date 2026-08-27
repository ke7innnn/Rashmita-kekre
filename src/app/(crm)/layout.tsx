import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Health 360 — Physiotherapy Patient CRM & Reception Dashboard",
  description: "Connected clinical management, scheduling, and AI voice agent control panel for Dr. Rashmita Karvir Kekre's practice.",
  icons: {
    icon: [
      { url: '/logo/rklogo.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/logo/rklogo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
