import type { Metadata } from "next";
import localFont from "next/font/local";
import { Nav } from "@/components/layout/nav";
import { LiquidGlassBackground } from "@/components/layout/liquid-glass-background";
import { StudentFloatingAgent } from "@/components/agent/student-floating-agent";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TheBoard — Student Job Matching",
  description: "Find internships and gigs without digging through group chats.",
};

/** Auth in Nav/StudentFloatingAgent reads cookies — opt out of static prerender. */
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <LiquidGlassBackground />
        <Nav />
        <main>{children}</main>
        <StudentFloatingAgent />
      </body>
    </html>
  );
}
