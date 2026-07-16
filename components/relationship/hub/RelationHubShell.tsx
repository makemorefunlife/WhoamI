"use client";

import type { ReactNode } from "react";
import StitchSurveyShell from "@/components/survey/StitchSurveyShell";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** 관계 허브 — 라우트 전환 시 즉시 보여줄 정적 셸 */
export default function RelationHubShell({
  children,
}: {
  children?: ReactNode;
}) {
  const { messages } = useLocale();
  return (
    <StitchSurveyShell className="stitch-survey stitch-results">
      <div className="mx-auto w-full max-w-lg px-5 py-6 sm:px-6 sm:py-8">
        <header className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary">
            RELATION HUB
          </p>
          <h1 className="stitch-headline mt-2 text-3xl text-primary">
            {messages.hub.title}
          </h1>
        </header>
        {children}
      </div>
    </StitchSurveyShell>
  );
}
