import { notFound } from "next/navigation";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { ReportSurfaceProvider } from "@/components/relationship/reportLayout";
import {
  buildRomanticV3PrototypePayload,
} from "@/lib/relationship/romantic/prototypeV3/buildRomanticV3PrototypePayload";
import PrototypeClient from "./PrototypeClient";

type PageProps = {
  searchParams?: Promise<{ variant?: string; locale?: string; debug?: string }>;
};

export default async function RomanticV3ContentPrototypePage({ searchParams }: PageProps) {
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
  const payload = buildRomanticV3PrototypePayload(variant, locale);

  return (
    <LocaleProvider locale={locale}>
      <ReportSurfaceProvider surface="stitch">
        <div className="min-h-screen bg-[#FAF9F6]">
          <PrototypeClient payload={payload} debug={debug} />
        </div>
      </ReportSurfaceProvider>
    </LocaleProvider>
  );
}
