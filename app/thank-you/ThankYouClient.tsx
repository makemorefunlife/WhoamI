"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { localizedPath } from "@/lib/i18n/locale";
import { ROUTES } from "@/constants/routes";

function ThankYouContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, messages } = useLocale();
  const [countdown, setCountdown] = useState(3);
  const [, startTransition] = useTransition();

  const t = messages.thankYou;

  // Resolve target analysis page based on search parameters
  const redirectParam = searchParams.get("redirect") || searchParams.get("next");
  const reportId = searchParams.get("reportId");
  const relationshipReportId = searchParams.get("relationshipReportId") || searchParams.get("rrId");
  const target = searchParams.get("target");

  let rawTarget = ROUTES.blueprint;
  if (redirectParam && redirectParam.startsWith("/")) {
    rawTarget = redirectParam;
  } else if (relationshipReportId) {
    const kind = searchParams.get("kind");
    const viewer = searchParams.get("viewer");
    const q = new URLSearchParams();
    if (kind) q.set("kind", kind);
    if (viewer) q.set("viewer", viewer);
    const suffix = q.toString() ? `?${q.toString()}` : "";
    rawTarget = `${ROUTES.relationship}/${encodeURIComponent(relationshipReportId)}${suffix}`;
  } else if (reportId) {
    rawTarget = `${ROUTES.blueprint}?reportId=${encodeURIComponent(reportId)}`;
  } else if (target === "relationships" || target === "relationship") {
    rawTarget = ROUTES.relationships;
  }

  // Ensure path has proper locale prefix (/kr prefix for ko-KR, unprefixed for en-US)
  const targetUrl = localizedPath(rawTarget, locale);

  // Auto-redirect timer: count down from 3 to 0
  useEffect(() => {
    if (countdown <= 0) {
      startTransition(() => {
        router.push(targetUrl);
      });
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router, targetUrl]);

  const handleGoToAnalysis = () => {
    startTransition(() => {
      router.push(targetUrl);
    });
  };

  return (
    <div className="stitch-landing relative flex min-h-[80vh] w-full flex-col items-center justify-center bg-[#FAF7F0] px-4 py-12">
      {/* Stitch ambient radial background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_85%_12%,rgba(58,143,110,0.08)_0%,transparent_45%),radial-gradient(circle_at_8%_88%,rgba(196,154,156,0.14)_0%,transparent_40%)]"
      />

      <main className="relative z-10 flex w-full max-w-md flex-col items-center justify-center">
        <div className="w-full overflow-hidden rounded-3xl border border-[#D4CFC4]/70 bg-[#FFFDF8] p-8 text-center shadow-[0_20px_50px_rgba(26,51,40,0.08)] sm:p-10">
          {/* Success Checkmark Icon Badge */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#3A8F6E]/30 bg-[#E3F2EC] text-[#3A8F6E] shadow-[0_8px_20px_rgba(58,143,110,0.15)]">
            <svg
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          {/* Headline & Description */}
          <h1 className="mb-3 text-2xl font-bold tracking-tight text-[#1A3328] sm:text-3xl">
            {t.title}
          </h1>
          <p className="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-[#4A5C52] sm:text-base">
            {t.subtitle}
          </p>

          {/* Countdown Indicator Badge */}
          <div className="mb-8 inline-flex items-center justify-center gap-2 rounded-full border border-[#3A8F6E]/30 bg-[#E3F2EC] px-4 py-2 text-xs font-semibold text-[#1A3328]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3A8F6E] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1A3328]" />
            </span>
            <span>{t.redirectingIn(Math.max(0, countdown))}</span>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleGoToAnalysis}
            className="group relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#234A38] to-[#1A3328] px-6 py-4 text-base font-semibold text-[#FFFDF8] shadow-[0_14px_36px_rgba(26,51,40,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(26,51,40,0.3)] active:scale-[0.98]"
          >
            <span>{t.goToAnalysis}</span>
            <svg
              className="h-5 w-5 text-[#FFFDF8] transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>

          {/* Manual Redirect Hint */}
          <p className="mt-4 text-xs text-[#6A7D73]">
            {t.manualRedirectHint}
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ThankYouClient() {
  return (
    <Suspense
      fallback={
        <div className="stitch-landing relative flex min-h-[80vh] w-full flex-col items-center justify-center bg-[#FAF7F0] px-4 py-12">
          <main className="relative z-10 flex w-full max-w-md flex-col items-center justify-center">
            <div className="w-full rounded-3xl border border-[#D4CFC4]/70 bg-[#FFFDF8] p-8 text-center text-[#4A5C52]">
              Loading confirmation…
            </div>
          </main>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
