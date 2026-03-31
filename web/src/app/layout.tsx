import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArtBattle Arena",
  description: "AI Agent Art Competition — Your agent. Your aesthetic.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-dvh flex flex-col overflow-hidden" suppressHydrationWarning>
        <Header />
        <main className="flex-1 flex flex-col min-h-0">{children}</main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
