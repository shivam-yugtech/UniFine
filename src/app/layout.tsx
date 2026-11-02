import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Lexend } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MotionProvider } from "@/components/unifine/motion";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Rounded geometric sans — closest match to the iCloudEMS / KRMU student app typography
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UniFine · KR Mangalam University — Fine Management Portal",
  description:
    "UniFine is KRMU's centralized university fine management system: verified student lookup, approved offence catalogue, transparent fine history, rule book and audit-ready corrections.",
  keywords: ["UniFine", "KRMU", "KR Mangalam University", "fine management", "university portal"],
  authors: [{ name: "KR Mangalam University" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "UniFine · KR Mangalam University",
    description: "Transparent, accurate & audit-ready university fine management.",
    siteName: "UniFine",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // lets env(safe-area-inset-*) work on notched phones
  themeColor: "#4a9ee8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${lexend.variable} ${geistSans.variable} ${geistMono.variable} bg-surface font-sans text-foreground antialiased`}
      >
        <MotionProvider>{children}</MotionProvider>
        <Toaster />
      </body>
    </html>
  );
}
