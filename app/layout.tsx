import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import DevPaymentShortcut from "@/components/DevPaymentShortcut";
import Header from "@/components/layout/Header";
import "./globals.css";

export const runtime = "nodejs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ahaitsme — 나를 찾는 여행",
  description: "설문과 이야기로 나만의 작은 우주를 만나보세요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider afterSignOutUrl="/">
          <Header />
          <div className="flex min-h-0 flex-1 flex-col pt-14">{children}</div>
          <DevPaymentShortcut />
        </ClerkProvider>
      </body>
    </html>
  );
}
