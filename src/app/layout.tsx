import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UniFine · KR Mangalam University — Fine Management Portal",
  description:
    "UniFine is KRMU's centralized university fine management system: verified student lookup, approved offence catalogue, transparent fine history, rule book and audit-ready corrections.",
  keywords: ["UniFine", "KRMU", "KR Mangalam University", "fine management", "university portal"],
  authors: [{ name: "KR Mangalam University" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "UniFine · KR Mangalam University",
    description: "Transparent, accurate & audit-ready university fine management.",
    siteName: "UniFine",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
