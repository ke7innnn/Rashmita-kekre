import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import "./crm.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Health 360 — Physiotherapy Patient CRM & Reception Dashboard",
  description: "Connected clinical management, scheduling, and AI voice agent control panel for Dr. Rashmita Karvir Kekre's practice.",
};

export default function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${instrumentSerif.variable} ${plusJakartaSans.variable} crm-layout-wrapper min-h-screen flex flex-col bg-background text-foreground`}>
      <Providers>{children}</Providers>
    </div>
  );
}
