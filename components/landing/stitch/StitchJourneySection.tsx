"use client";

import type { ReactNode } from "react";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import { blueprintPath, relationHubPath } from "@/lib/stitch/hubPaths";
import {
  SelfIllustration,
  RelationshipIllustration,
  ChoiceIllustration,
  ReflectionIllustration,
} from "@/components/landing/stitch/StitchIllustrations";

type HowItWorksStepData = {
  stepNumber: string;
  illustration: ReactNode;
  title: string;
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export default function StitchJourneySection({ reportId }: { reportId: string }) {
  const { messages } = useLocale();

  const steps: HowItWorksStepData[] = [
    {
      stepNumber: "01",
      illustration: <SelfIllustration className="h-10 w-10 text-accent-emerald" />,
      title: messages.landing.frameworkStep1Title || "Step 1. Rapid Self-Assessment",
      text: messages.landing.frameworkStep1Text,
      ctaLabel: messages.landing.frameworkStep1Cta,
      ctaHref: "/survey-v2",
    },
    {
      stepNumber: "02",
      illustration: <RelationshipIllustration className="h-10 w-10 text-accent-emerald" />,
      title: messages.landing.frameworkStep2Title || "Step 2. 6-Axis Blueprint Dashboard",
      text: messages.landing.frameworkStep2Text,
      ctaLabel: messages.landing.frameworkStep2Cta,
      ctaHref: blueprintPath(reportId),
    },
    {
      stepNumber: "03",
      illustration: <ChoiceIllustration className="h-10 w-10 text-accent-emerald" />,
      title: messages.landing.frameworkStep3Title || "Step 3. Connect Peers & Partners",
      text: messages.landing.frameworkStep3Text,
      ctaLabel: messages.landing.frameworkStep3Cta,
      ctaHref: relationHubPath(reportId),
    },
    {
      stepNumber: "04",
      illustration: <ReflectionIllustration className="h-10 w-10 text-accent-emerald" />,
      title: messages.landing.frameworkStep4Title || "Step 4. Actionable 7-Scene Report",
      text: messages.landing.frameworkStep4Text,
      ctaLabel: messages.landing.frameworkStep4Cta,
      ctaHref: ROUTES.pricing,
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="group relative flex flex-col justify-between rounded-extra-large border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent-emerald/40 hover:shadow-md"
          >
            <div>
              {/* 상단 번호 & 아이콘 헤더 */}
              <div className="mb-5 flex items-center justify-between">
                <span className="inline-flex h-9 items-center justify-center rounded-full bg-accent-emerald-soft/60 px-3.5 text-xs font-bold uppercase tracking-widest text-primary">
                  Step {step.stepNumber}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-low/70 transition-transform duration-200 group-hover:scale-105">
                  {step.illustration}
                </div>
              </div>

              {/* 단계 제목 & 내용 */}
              <h3 className="mb-2.5 text-lg font-bold text-primary break-keep leading-snug">
                {step.title}
              </h3>
              <p className="text-xs sm:text-sm font-normal text-on-surface-variant/85 leading-relaxed break-keep">
                {step.text}
              </p>
            </div>

            {/* 하단 CTA 링크 */}
            {step.ctaLabel && step.ctaHref ? (
              <div className="mt-6 border-t border-outline-variant/20 pt-4">
                <LocaleLink
                  href={step.ctaHref}
                  className="inline-flex items-center text-xs font-semibold text-primary transition-colors hover:text-accent-emerald"
                >
                  <span>{step.ctaLabel}</span>
                  <span aria-hidden className="ml-1 transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </LocaleLink>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
