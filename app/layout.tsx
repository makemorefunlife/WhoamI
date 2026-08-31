import type { Metadata } from "next";
import ReactDOM from "react-dom";
import Script from "next/script";
import {
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  Lora,
  Manrope,
  Noto_Sans_KR,
  Noto_Serif_KR,
} from "next/font/google";
import AppClerkProvider from "@/components/clerk/AppClerkProvider";
import FirstEntryDiagnostics from "@/components/debug/FirstEntryDiagnostics";
import ConditionalAppChrome from "@/components/layout/ConditionalAppChrome";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { localeToHtmlLang } from "@/lib/i18n/locale";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
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

/**
 * Relationship report typography (app/globals.css --font-rel-sans-stack /
 * --font-rel-serif-stack) named these fonts but never actually loaded them —
 * every Korean glyph in the Friend/Marriage/Romantic reports was silently
 * falling back to whatever Korean font the OS/browser substituted, which
 * varied by weight and looked inconsistent within the same page.
 */
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  display: "swap",
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  display: "swap",
});

const GTM_ID = "GTM-M8ZQ6BJD";

const SITE_NAME = "Aha It's me!";
const SITE_DESCRIPTION =
  "Discover your patterns through surveys, charts, and relationships.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ahaitsme.com"),
  title: `${SITE_NAME} — Know yourself`,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      ko: "/kr",
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Know yourself`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — Know yourself`,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
    shortcut: "/brand/favicon-32.png",
  },
};

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: "https://www.ahaitsme.com",
  logo: "https://www.ahaitsme.com/brand/apple-touch-icon.png",
  sameAs: ["https://www.instagram.com/ahaitsme"],
  contactPoint: [
    {
      "@type": "ContactPoint",
      email: "hong@ahaitsme.com",
      contactType: "customer support",
    },
  ],
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: "https://www.ahaitsme.com",
};

/** Clerk publishable key encodes its Frontend API host as base64: pk_(test|live)_<host>$ */
function getClerkFrontendApiOrigin(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const encoded = key?.split("_")[2];
  if (!encoded) return null;
  try {
    const host = Buffer.from(encoded, "base64").toString("utf-8").replace(/\$+$/, "");
    return host ? `https://${host}` : null;
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const htmlLang = localeToHtmlLang(locale);

  const clerkFapiOrigin = getClerkFrontendApiOrigin();
  if (clerkFapiOrigin) {
    // Warm the connection to Clerk's API before the user's first sign-in click.
    ReactDOM.preconnect(clerkFapiOrigin, { crossOrigin: "anonymous" });
    ReactDOM.prefetchDNS(clerkFapiOrigin);
  }

  return (
    <html
      lang={htmlLang}
      className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexMono.variable} ${manrope.variable} ${lora.variable} ${notoSansKr.variable} ${notoSerifKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
        {/* End Google Tag Manager */}

        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
        <LocaleProvider locale={locale}>
          <AppClerkProvider>
            <FirstEntryDiagnostics scope="RootLayout" />
            <ConditionalAppChrome>{children}</ConditionalAppChrome>
          </AppClerkProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
