import { notFound } from "next/navigation";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { ReportSurfaceProvider } from "@/components/relationship/reportLayout";
import {
  buildRomanticV4PrototypePayload,
} from "@/lib/relationship/romantic/prototypeV4/buildRomanticV4PrototypePayload";
import { isRomanticV4ReportEnabled } from "@/lib/relationship/romantic/prototypeV4/romanticV4ReportFlag";
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

export default async function RomanticV4ContentPrototypePage({ searchParams }: PageProps) {
  if (process.env.NODE_ENV !== "development" && !isRomanticV4ReportEnabled()) notFound();

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
