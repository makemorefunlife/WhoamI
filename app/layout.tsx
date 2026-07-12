import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, Lora, Manrope } from "next/font/google";
import AppClerkProvider from "@/components/clerk/AppClerkProvider";
import FirstEntryDiagnostics from "@/components/debug/FirstEntryDiagnostics";
import ConditionalAppChrome from "@/components/layout/ConditionalAppChrome";
import "./globals.css";
import "./stitch-theme.css";

export const runtime = "nodejs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const manrope = Manrope({
  variable: "--font-manrope-var",
  subsets: ["latin"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora-var",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ahaitsme — 나를 찾는 여행",
  description: "설문과 이야기로 나만의 작은 우주를 만나보세요.",
  icons: {
    icon: [
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
    shortcut: "/brand/favicon-32.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexMono.variable} ${manrope.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppClerkProvider>
          <FirstEntryDiagnostics scope="RootLayout" />
          <ConditionalAppChrome>{children}</ConditionalAppChrome>
        </AppClerkProvider>
      </body>
    </html>
  );
}
