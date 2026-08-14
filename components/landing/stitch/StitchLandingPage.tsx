"use client";

import Image from "next/image";
import LocaleLink from "@/lib/i18n/LocaleLink";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import StitchHomeCta from "@/components/landing/stitch/StitchHomeCta";
import StitchPersonalRadar from "@/components/landing/stitch/StitchPersonalRadar";
import Logo from "@/components/brand/Logo";
import { ROUTES } from "@/constants/routes";
import {
  blueprintPath,
  DECISION_HUB_PATH,
  readStoredReportId,
  relationHubPath,
} from "@/lib/stitch/hubPaths";
import { useAppSession } from "@/lib/routing/useAppSession";
import { useHydrated } from "@/lib/hooks/useHydrated";

const EYEBROW_CLASS =
  "mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-accent-emerald";

type Props = {
  resumeLoading: boolean;
  creatingReport: boolean;
  onOpenStartChoice: () => void;
};

function useScrollReveal() {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = mainRef.current;
    if (!root) return;

    const sections = root.querySelectorAll<HTMLElement>("[data-stitch-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("stitch-reveal-visible");
          }
        }
      },
      { threshold: 0.08 },
    );

    for (const el of sections) {
      el.classList.add("stitch-reveal");
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  return mainRef;
}

export default function StitchLandingPage({
  resumeLoading,
  creatingReport,
  onOpenStartChoice,
}: Props) {
  const router = useRouter();
  const mainRef = useScrollReveal();
  const { locale, messages, href: localize } = useLocale();
  const { reportId: sessionReportId } = useAppSession({ hydrate: false });
  const hydrated = useHydrated();
  const [storedReportId, setStoredReportId] = useState("");

  useEffect(() => {
    setStoredReportId(readStoredReportId());
  }, []);

  const reportId = hydrated
    ? sessionReportId?.trim() || storedReportId
    : "";

  const reportCards = [
    {
      img: "/landing/relationships/lovers.png",
      eyebrow: "Lovers",
      title: messages.landing.reportsLoverTitle,
      desc: messages.landing.reportsLoverDesc,
    },
    {
      img: "/landing/relationships/couple.png",
      eyebrow: "Couples",
      title: messages.landing.reportsCoupleTitle,
      desc: messages.landing.reportsCoupleDesc,
    },
    {
      img: "/landing/relationships/family.png",
      eyebrow: "Family",
      title: messages.landing.reportsFamilyTitle,
      desc: messages.landing.reportsFamilyDesc,
    },
    {
      img: "/landing/relationships/colleagues.png",
      eyebrow: "Colleagues",
      title: messages.landing.reportsColleagueTitle,
      desc: messages.landing.reportsColleagueDesc,
    },
    {
      img: "/landing/relationships/friends.png",
      eyebrow: "Friends",
      title: messages.landing.reportsFriendTitle,
      desc: messages.landing.reportsFriendDesc,
    },
  ];

  const frameworkSteps = [
    {
      step: "01",
      name: "Assessment",
      title: "Cognitive Bias Mapping & Narrative Analysis",
      desc: messages.landing.frameworkStep1Desc,
      tag: "Clarity",
    },
    {
      step: "02",
      name: "Integration",
      title: "Guided Metacognitive Journaling",
      desc: messages.landing.frameworkStep2Desc,
      tag: "Resilience",
    },
    {
      step: "03",
      name: "Evolution",
      title: "Relational Synergy Feedback Loops",
      desc: messages.landing.frameworkStep3Desc,
      tag: "Alignment",
    },
  ];

  const reportSampleAxes = [
    { label: messages.landing.reportSampleAxis1, innate: 82, realized: 47 },
    { label: messages.landing.reportSampleAxis2, innate: 61, realized: 88 },
    { label: messages.landing.reportSampleAxis3, innate: 44, realized: 72 },
    { label: messages.landing.reportSampleAxis4, innate: 90, realized: 58 },
    { label: messages.landing.reportSampleAxis5, innate: 55, realized: 79 },
  ];

  return (
    <div className="stitch-landing overflow-x-hidden">
      <main
        ref={mainRef}
        className="relative mx-auto max-w-[1200px] overflow-hidden px-edge-margin-mobile pb-12 pt-6 md:px-edge-margin-desktop md:pb-20 md:pt-10"
      >
        <section
          data-stitch-reveal
          className="stitch-hero-panel relative mx-auto flex w-full max-w-5xl flex-col items-stretch overflow-hidden rounded-extra-extra-large stitch-reveal-visible"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-emerald-soft/80 blur-2xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-accent-rose-soft blur-2xl" aria-hidden />
          <div className="relative w-full min-h-[min(520px,88dvh)] md:min-h-[400px]">
            <div className="flex min-h-[inherit] flex-col justify-center p-8 md:p-16">
              <div className="mx-auto w-full max-w-2xl text-center md:mx-0 md:text-left">
                <div className="mb-4 flex justify-center md:justify-start">
                  <Logo size={40} href={localize("/")} priority />
                </div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent-emerald">
                  Aha It&apos;s me
                </p>
                <h2 className="stitch-headline mb-6 text-balance text-[2rem] leading-[1.12] sm:text-4xl md:text-[2.75rem] lg:text-5xl">
                  {messages.landing.heroTitle}
                </h2>
                <p className="mb-6 max-w-xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
                  {messages.landing.heroSubtitle}
                </p>
                <p className="mb-8 max-w-xl text-sm leading-relaxed text-on-surface-variant/80 sm:text-base">
                  {messages.landing.heroHook}
                </p>
                <StitchHomeCta
                  resumeLoading={resumeLoading}
                  creatingReport={creatingReport}
                  onOpenStartChoice={onOpenStartChoice}
                />
              </div>
            </div>
          </div>
        </section>

        <section
          data-stitch-reveal
          className="mt-stack-lg md:mt-section-gap"
        >
          <div className="grid gap-10 rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm md:grid-cols-[0.9fr_1.1fr] md:p-14">
            <div>
              <span className={EYEBROW_CLASS}>Brand Philosophy</span>
              <h3 className="stitch-headline whitespace-pre-line text-3xl leading-tight md:text-4xl">
                {messages.landing.philosophyHeadline}
              </h3>
            </div>
            <div>
              <ul className="divide-y divide-outline-variant/30 border-y border-outline-variant/30">
                {[
                  messages.landing.philosophyPoint1,
                  messages.landing.philosophyPoint2,
                  messages.landing.philosophyPoint3,
                ].map((line, i) => (
                  <li key={line} className="flex gap-5 py-5">
                    <span className="text-sm text-accent-rose">0{i + 1}</span>
                    <p className="text-base leading-relaxed text-on-surface-variant">
                      {line}
                    </p>
                  </li>
                ))}
              </ul>
              <blockquote className="mt-8 rounded-extra-large border-l-2 border-accent-emerald bg-secondary-container/60 p-6 text-base leading-relaxed text-primary">
                {messages.landing.philosophySolution}
              </blockquote>
            </div>
          </div>
        </section>

        <section
          data-stitch-reveal
          className="mt-stack-lg md:mt-section-gap"
        >
          <div className="mb-10">
            <span className={EYEBROW_CLASS}>Personal Analysis</span>
            <h3 className="stitch-headline text-3xl leading-tight md:text-4xl">
              {messages.landing.personalHeadline}
            </h3>
          </div>
          <div className="rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
              <div className="order-2 lg:order-1">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div className="border-t-2 border-accent-rose/70 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-rose">
                      Innate
                    </p>
                    <h4 className="mt-2 text-xl font-semibold text-primary">
                      {messages.landing.personalInnateTitle}
                    </h4>
                    <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                      {messages.landing.personalInnateDesc}
                    </p>
                  </div>
                  <div className="border-t-2 border-accent-emerald/70 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-emerald">
                      Realized
                    </p>
                    <h4 className="mt-2 text-xl font-semibold text-primary">
                      {messages.landing.personalRealizedTitle}
                    </h4>
                    <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                      {messages.landing.personalRealizedDesc}
                    </p>
                  </div>
                </div>
                <div className="mt-8 rounded-extra-large border border-accent-emerald/30 bg-secondary-container/60 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-emerald">
                    {messages.landing.personalGapLabel}
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-primary">
                    {messages.landing.personalGapQuote}
                  </p>
                </div>
              </div>
              <div className="order-1 flex items-center justify-center lg:order-2">
                <StitchPersonalRadar />
              </div>
            </div>
            <div className="mt-10 flex justify-center md:justify-end">
              <LocaleLink href={blueprintPath(reportId)} className="stitch-cta-secondary">
                {messages.landing.personalCta}
                <span aria-hidden className="ml-2">
                  →
                </span>
              </LocaleLink>
            </div>
          </div>
        </section>

        <section
          data-stitch-reveal
          className="mt-stack-lg md:mt-section-gap"
        >
          <div className="mb-10">
            <span className={EYEBROW_CLASS}>Relationship Reports</span>
            <h3 className="stitch-headline text-3xl leading-tight md:text-4xl">
              {messages.landing.reportsHeadline}
            </h3>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reportCards.map(({ img, eyebrow, title, desc }) => (
              <div
                key={eyebrow}
                className="relative flex flex-col rounded-extra-large border border-outline-variant/30 bg-surface-container-lowest p-7 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="pointer-events-none absolute right-4 top-4 h-20 w-20 sm:h-24 sm:w-24">
                  <Image
                    src={img}
                    alt={title}
                    fill
                    sizes="96px"
                    className="object-contain"
                  />
                </div>
                <p className="pr-20 text-xs font-semibold uppercase tracking-[0.16em] text-accent-emerald sm:pr-24">
                  {eyebrow}
                </p>
                <h4 className="mt-2 pr-20 text-xl font-semibold text-primary sm:pr-24">
                  {title}
                </h4>
                <p className="mt-3 flex-1 pr-20 text-sm leading-relaxed text-on-surface-variant sm:pr-24">
                  {desc}
                </p>
                <LocaleLink
                  href={relationHubPath(reportId)}
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-accent-emerald/50 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-accent-emerald hover:text-on-primary"
                >
                  {messages.landing.reportsCtaLabel} <span aria-hidden>→</span>
                </LocaleLink>
              </div>
            ))}

            <div className="flex flex-col justify-between rounded-extra-large border border-primary bg-primary p-7 text-on-primary">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-on-primary/70">
                  Start Now
                </p>
                <h4 className="mt-2 text-2xl font-semibold">
                  {messages.landing.reportsStartTitle}
                </h4>
                <p className="mt-3 text-sm leading-relaxed text-on-primary/80">
                  {messages.landing.reportsStartDesc}
                </p>
              </div>
              <LocaleLink
                href={relationHubPath(reportId)}
                className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-on-primary/60 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-on-primary hover:text-primary"
              >
                {messages.landing.reportsStartCta} <span aria-hidden>→</span>
              </LocaleLink>
            </div>
          </div>
        </section>

        <section
          data-stitch-reveal
          className="mt-stack-lg md:mt-section-gap"
        >
          <div className="mb-10">
            <span className={EYEBROW_CLASS}>Scientific Approach</span>
            <h3 className="stitch-headline text-3xl leading-tight md:text-4xl">
              {messages.landing.frameworkHeadline}
            </h3>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {frameworkSteps.map((p) => (
              <article
                key={p.name}
                className="flex flex-col rounded-extra-large border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm transition-colors hover:border-accent-emerald/40"
              >
                <span className="text-sm text-on-surface-variant/70">{p.step}</span>
                <h4 className="mt-4 text-xl font-semibold text-primary">{p.name}</h4>
                <p className="mt-3 text-[0.95rem] text-primary/80">{p.title}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-on-surface-variant">
                  {p.desc}
                </p>
                <span className="mt-8 inline-flex w-fit rounded-full bg-accent-emerald-soft px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-accent-emerald">
                  {p.tag}
                </span>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-extra-large border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm md:p-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className={EYEBROW_CLASS}>Report Sample</span>
                <h4 className="text-2xl font-semibold text-primary">
                  {messages.landing.reportSampleTitle}
                </h4>
              </div>
              <ul className="flex gap-6 text-xs text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-6 rounded-full bg-accent-rose" />{" "}
                  {messages.landing.reportSampleLegendInnate}
                </li>
                <li className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-6 rounded-full bg-accent-emerald" />{" "}
                  {messages.landing.reportSampleLegendRealized}
                </li>
              </ul>
            </div>
            <div className="mt-8 space-y-6">
              {reportSampleAxes.map((a) => (
                <div
                  key={a.label}
                  className="grid items-center gap-3 sm:grid-cols-[10rem_1fr]"
                >
                  <span className="text-sm text-on-surface-variant">{a.label}</span>
                  <div className="space-y-1.5">
                    <div className="h-2.5 w-full rounded-full bg-surface-container-low">
                      <div
                        className="h-full rounded-full bg-accent-rose"
                        style={{ width: `${a.innate}%` }}
                      />
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-surface-container-low">
                      <div
                        className="h-full rounded-full bg-accent-emerald"
                        style={{ width: `${a.realized}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 border-t border-outline-variant/30 pt-5 text-xs text-on-surface-variant">
              {messages.landing.reportSampleFootnote}
            </p>
          </div>
        </section>

        <section
          data-stitch-reveal
          className="mt-stack-lg md:mt-section-gap"
        >
          <div className="grid gap-10 rounded-extra-extra-large border border-outline-variant/30 bg-secondary-container/40 p-8 shadow-sm md:grid-cols-[1fr_0.85fr] md:p-14">
            <div>
              <span className={EYEBROW_CLASS}>Coming Soon</span>
              <h3 className="stitch-headline text-3xl leading-tight md:text-4xl">
                {messages.landing.journalHeadline}
              </h3>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-on-surface-variant">
                {messages.landing.journalDesc}
              </p>
              <LocaleLink href={DECISION_HUB_PATH} className="stitch-cta-secondary mt-8">
                {messages.landing.journalCta}
                <span aria-hidden className="ml-2">
                  →
                </span>
              </LocaleLink>
            </div>
            <div className="rounded-extra-large border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm">
              <p className="text-sm text-accent-emerald">2026. 03. 14</p>
              <p className="mt-4 text-lg font-medium text-primary">
                {messages.landing.journalSampleChoice}
              </p>
              <div className="mt-6 space-y-3 text-sm text-on-surface-variant">
                <p className="border-t border-outline-variant/30 pt-3">
                  {messages.landing.journalSampleEmotion}
                </p>
                <p className="border-t border-outline-variant/30 pt-3">
                  {messages.landing.journalSampleInnate}
                </p>
                <p className="border-t border-outline-variant/30 pt-3">
                  {messages.landing.journalSampleRetry}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-section-gap rounded-t-extra-extra-large border-t border-outline-variant/30 bg-primary px-edge-margin-mobile py-16 pb-32 text-on-primary md:px-edge-margin-desktop">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <div className="mb-6 flex items-center gap-2">
              <Logo size={32} href={localize("/")} onDarkBackground />
              <h5 className="text-2xl font-medium text-on-primary">
                Aha It&apos;s me!
              </h5>
            </div>
            <p className="mb-8 max-w-sm text-on-primary/75">
              {messages.landing.footerTagline}
            </p>
          </div>
          <div className="md:col-span-3">
            <h6 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-emerald-soft/90">
              {messages.account.title}
            </h6>
            <ul className="flex flex-col gap-2.5 text-sm text-on-primary/80">
              <li>
                <LocaleLink
                  href={ROUTES.accountProfile}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.account.profile}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.accountBilling}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.account.billing}
                </LocaleLink>
              </li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h6 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-emerald-soft/90">
              {messages.footer.support}
            </h6>
            <ul className="flex flex-col gap-2.5 text-sm text-on-primary/80">
              <li>
                <LocaleLink
                  href={ROUTES.about}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.nav.about}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.pricing}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.nav.pricing}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.faq}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.nav.faq}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.contact}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.nav.contact}
                </LocaleLink>
              </li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h6 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-emerald-soft/90">
              {messages.footer.legal}
            </h6>
            <ul className="flex flex-col gap-2.5 text-sm text-on-primary/80">
              <li>
                <LocaleLink
                  href={ROUTES.terms}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.footer.terms}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.privacy}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.footer.privacy}
                </LocaleLink>
              </li>
              <li>
                <LocaleLink
                  href={ROUTES.refund}
                  className="transition hover:text-accent-rose-soft"
                >
                  {messages.footer.refund}
                </LocaleLink>
              </li>
              {locale === "en-US" ? (
                <li>
                  <LocaleLink
                    href={ROUTES.doNotSell}
                    className="transition hover:text-accent-rose-soft"
                  >
                    {messages.cookieBanner.doNotSell}
                  </LocaleLink>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-[1200px] flex-col justify-between gap-4 border-t border-on-primary/15 pt-8 text-xs md:flex-row">
          <div className="space-y-3 text-on-primary/60">
            <p>
              © {new Date().getFullYear()} Aha It&apos;s me!{" "}
              {messages.footer.copyrightSuffix}
            </p>
            {locale === "ko-KR" ? (
              <div className="max-w-xl space-y-0.5 text-[11px] leading-relaxed text-on-primary/55">
                <p>
                  {messages.footer.business.companyLabel}:{" "}
                  {messages.footer.business.companyName}
                </p>
                <p>
                  {messages.footer.business.ceoLabel}:{" "}
                  {messages.footer.business.ceoName}
                </p>
                <p>
                  {messages.footer.business.bizNumberLabel}:{" "}
                  {messages.footer.business.bizNumber}
                </p>
                <p>
                  {messages.footer.business.mailOrderLabel}:{" "}
                  {messages.footer.business.mailOrderNumber}
                </p>
                <p>
                  {messages.footer.business.addressLabel}:{" "}
                  {messages.footer.business.address}
                </p>
                <p>
                  {messages.footer.business.phoneLabel}:{" "}
                  {messages.footer.business.phone}
                </p>
                <p>
                  {messages.footer.business.emailLabel}:{" "}
                  <a
                    href={`mailto:${messages.footer.business.email}`}
                    className="underline underline-offset-2 hover:text-on-primary"
                  >
                    {messages.footer.business.email}
                  </a>
                </p>
              </div>
            ) : null}
          </div>
          <nav
            className="flex flex-wrap gap-x-4 gap-y-1 text-on-primary/55"
            aria-label="Hub shortcuts"
          >
            <LocaleLink href={blueprintPath(reportId)} className="hover:text-on-primary">
              {messages.nav.blueprint}
            </LocaleLink>
            <LocaleLink href={relationHubPath(reportId)} className="hover:text-on-primary">
              {messages.nav.relationLab}
            </LocaleLink>
            <LocaleLink href={DECISION_HUB_PATH} className="hover:text-on-primary">
              {messages.nav.decision}
            </LocaleLink>
          </nav>
        </div>
      </footer>
    </div>
  );
}
