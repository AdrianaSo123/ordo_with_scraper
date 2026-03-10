import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Syne, Space_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

import { ThemeProvider } from "@/components/ThemeProvider";
import { GridInspector } from "@/components/GridInspector";
import { SiteNav } from "@/components/SiteNav";
import CommandPalette from "@/components/CommandPalette";
import { GlobalChat } from "@/components/GlobalChat";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "AI Systems Console",
  description: "Next.js Architectural Playground",
};

import { ChatProvider } from "@/hooks/useGlobalChat";
import { Suspense } from "react";

import { SiteFooter } from "@/components/SiteFooter";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} ${syne.className} ${spaceMono.className} antialiased`}
      >
        <ThemeProvider>
          <ChatProvider>
            <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
              {/* STAGE: Nav + Main (Locked to 100vh to push footer below fold) */}
              <div className="h-[100dvh] flex flex-col flex-none overflow-hidden relative">
                <div className="flex-none">
                  <SiteNav user={user} />
                </div>
                <main className="flex-1 flex flex-col relative overflow-hidden min-h-0">
                  {children}
                </main>
              </div>
              
              {/* FOOTER: Naturally below the fold */}
              <div className="flex-none">
                <SiteFooter />
              </div>
            </div>
            <Suspense fallback={null}>
              <GlobalChat />
            </Suspense>
            <GridInspector />
            <CommandPalette />
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
