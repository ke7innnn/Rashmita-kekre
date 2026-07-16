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
  description: "Connected clinical management, scheduling, and AI voice agent control panel.",
};

export default function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className={`crm-root ${instrumentSerif.variable} ${plusJakartaSans.variable} antialiased`}
      suppressHydrationWarning
    >
      <Providers>{children}</Providers>
    </div>
  );
}
