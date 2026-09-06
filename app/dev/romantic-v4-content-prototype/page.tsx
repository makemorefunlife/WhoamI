/**
 * This dev-only preview page renders fixtures through the SAME engine that
 * generates real users' romantic reports in production (see the warning at
 * the top of lib/relationship/romantic/prototypeV4/romanticV4ReportFlag.ts).
 * "prototype" in this page's name/route refers only to when it was built —
 * the engine itself is current production code, not legacy.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { ReportSurfaceProvider } from "@/components/relationship/reportLayout";
import {
  buildRomanticV4PrototypePayload,
} from "@/lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import PrototypeClient from "./PrototypeClient";

const relSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rel-sans-var",
});
const relSerif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rel-serif-var",
});

type PageProps = {
  searchParams?: Promise<{ variant?: string; locale?: string; debug?: string }>;
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function RomanticV4ContentPrototypePage({ searchParams }: PageProps) {
  // Dev-only, unconditionally. The romanticV4 feature flag controls whether
  // real users get the V4 report on the production analyze route — it must
  // never also control whether this fixture-driven prototype preview is
  // reachable outside development.
  if (process.env.NODE_ENV !== "development") notFound();

  const params = await searchParams;
  const variant =
    params?.variant === "minimal"
      ? "minimal"
      : params?.variant === "tension"
        ? "tension"
        : "complete";
  const locale = params?.locale === "en-US" ? "en-US" : "ko-KR";
  const debug = params?.debug === "1";
  const payload = buildRomanticV4PrototypePayload(variant, locale);

  return (
    <LocaleProvider locale={locale}>
      <ReportSurfaceProvider surface="stitch">
        <div className={`min-h-screen bg-[#FAF9F6] ${relSans.variable} ${relSerif.variable}`}>
          <PrototypeClient payload={payload} debug={debug} />
        </div>
      </ReportSurfaceProvider>
    </LocaleProvider>
  );
}
