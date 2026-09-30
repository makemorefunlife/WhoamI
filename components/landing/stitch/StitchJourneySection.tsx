"use client";

import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ROUTES } from "@/constants/routes";
import { blueprintPath, relationHubPath } from "@/lib/stitch/hubPaths";

type HowItWorksStepData = {
  stepNumber: string;
  illustration: ReactNode;
  title: string;
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
};

/** Step line illustrations (from the supplied reference). Decorative only. */
function StepIllustration({ src, width, height }: { src: string; width: number; height: number }) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden
      width={width}
      height={height}
      className="h-24 w-auto select-none sm:h-28"
    />
  );
}

/** Horizontal connector (desktop only): thin line with an arrowhead in the middle. */
function HorizontalConnector() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-1/2 hidden -translate-y-1/2 items-center lg:flex"
      style={{ left: "calc(50% + 3.75rem)", right: "calc(-50% + 3.75rem)" }}
    >
      <span className="h-px flex-1 bg-primary/35" />
      <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0 text-primary/70" fill="currentColor">
        <path d="M2 1.5 10.5 6 2 10.5z" />
      </svg>
      <span className="h-px flex-1 bg-primary/35" />
    </div>
  );
}

/** Vertical connector (mobile/tablet only): short line with a downward arrowhead. */
function VerticalConnector() {
  return (
    <div aria-hidden className="flex flex-col items-center py-3 lg:hidden">
      <span className="h-8 w-px bg-primary/30" />
      <svg viewBox="0 0 12 12" className="-mt-px h-3 w-3 text-primary/60" fill="currentColor">
        <path d="M1.5 2 6 10.5 10.5 2z" />
      </svg>
    </div>
  );
}

export default function StitchJourneySection({ reportId }: { reportId: string }) {
  const { messages } = useLocale();

  // CTA destinations are unchanged from the previous card layout.
  const steps: HowItWorksStepData[] = [
    {
      stepNumber: "01",
      illustration: <StepIllustration src="/landing/how-it-works/step1-self-mirror.png" width={252} height={193} />,
      title: messages.landing.frameworkStep1Title,
      text: messages.landing.frameworkStep1Text,
      ctaLabel: messages.landing.frameworkStep1Cta,
      ctaHref: "/survey-v2",
    },
    {
      stepNumber: "02",
      illustration: <StepIllustration src="/landing/how-it-works/step2-blueprint.png" width={180} height={207} />,
      title: messages.landing.frameworkStep2Title,
      text: messages.landing.frameworkStep2Text,
      ctaLabel: messages.landing.frameworkStep2Cta,
      ctaHref: blueprintPath(reportId),
    },
    {
      stepNumber: "03",
      illustration: <StepIllustration src="/landing/how-it-works/step3-connect.png" width={178} height={178} />,
      title: messages.landing.frameworkStep3Title,
      text: messages.landing.frameworkStep3Text,
      ctaLabel: messages.landing.frameworkStep3Cta,
      ctaHref: relationHubPath(reportId),
    },
    {
      stepNumber: "04",
      illustration: <StepIllustration src="/landing/how-it-works/step4-report.png" width={201} height={163} />,
      title: messages.landing.frameworkStep4Title,
      text: messages.landing.frameworkStep4Text,
      ctaLabel: messages.landing.frameworkStep4Cta,
      ctaHref: ROUTES.pricing,
    },
  ];

  return (
    <ol className="flex w-full flex-col lg:grid lg:grid-cols-4">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <Fragment key={step.stepNumber}>
            <li className="flex flex-col items-center text-center lg:px-3">
              {/* STEP badge + connector to next step (desktop) */}
              <div className="relative flex w-full justify-center">
                <span className="inline-flex h-10 items-center justify-center rounded-full bg-accent-emerald-soft/60 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Step {step.stepNumber}
                </span>
                {!isLast ? <HorizontalConnector /> : null}
              </div>

              {/* Illustration, title, supporting line, CTA */}
              <div
                className={`mt-6 flex w-full flex-1 flex-col items-center lg:mt-10 ${
                  idx > 0 ? "lg:border-l lg:border-outline-variant/30" : ""
                }`}
              >
                <div className="flex h-24 items-center justify-center sm:h-28">
                  {step.illustration}
                </div>

                <h3 className="stitch-headline mt-5 text-xl font-bold leading-snug text-primary break-keep md:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant/80 break-keep md:text-base lg:text-sm xl:text-[15px]">
                  {step.text}
                </p>

                {/* Keeps CTAs bottom-aligned across columns on desktop */}
                <div aria-hidden className="lg:flex-1" />

                {step.ctaLabel && step.ctaHref ? (
                  <LocaleLink
                    href={step.ctaHref}
                    className="group mt-6 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-xl border border-primary/80 bg-transparent px-5 py-3 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary hover:text-on-primary lg:max-w-[15rem]"
                  >
                    <span>{step.ctaLabel}</span>
                    <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </LocaleLink>
                ) : null}
              </div>
            </li>

            {!isLast ? (
              <li aria-hidden className="list-none lg:hidden">
                <VerticalConnector />
              </li>
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}
