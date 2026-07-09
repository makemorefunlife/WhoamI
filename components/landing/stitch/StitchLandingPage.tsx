"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Brain,
  Heart,
  TrendingUp,
} from "lucide-react";
import StitchHomeCta from "@/components/landing/stitch/StitchHomeCta";
import Logo from "@/components/brand/Logo";
import { ROUTES } from "@/constants/routes";
import {
  blueprintPath,
  DECISION_HUB_PATH,
  readStoredReportId,
  relationHubPath,
} from "@/lib/stitch/hubPaths";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDvgf6WG4j6WmSliT9ytPyueU1yY_U7iK3rDs0KH0un2ei-7z7YtU6CWtOH0vlV1TeaTGp7MNGkGJJE_7jGSf9mVK_GZNVi0cXwUCZbLOqu4lskU70i2IZ3iPe0OhfnCoHROaachRLGnLUdZ7Y2B7Hm2210LeZsY2lijQ2Q7uJTIKNNHhy2pvKTWCMNwJv_B1Qn5xU3k3_SDhSpMjUl9uGmAFlwcpMJCvf2JXK0Od047ck6WxhSnq1RvLD2ek81OaidU9GNkxAezmTk";

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
  const [reportId, setReportId] = useState("");

  useEffect(() => {
    setReportId(readStoredReportId());
  }, []);

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
                  <Logo size={40} href="/" priority />
                </div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent-emerald">
                  Aha It&apos;s me
                </p>
                <h2 className="stitch-headline mb-6 text-balance text-[2rem] leading-[1.12] sm:text-4xl md:text-[2.75rem] lg:text-5xl">
                  Understand yourself.
                  <br />
                  Make peace with <em>your story</em>.
                </h2>
                <p className="mb-10 max-w-xl text-base leading-relaxed text-on-surface-variant sm:text-lg">
                  Gentle insights for the moments you&apos;re searching for
                  answers.
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
          className="mt-stack-lg grid grid-cols-1 gap-6 md:mt-section-gap md:grid-cols-12"
        >
          <div className="group flex min-h-[400px] flex-col justify-between rounded-extra-extra-large border border-outline-variant/30 bg-surface-container-lowest p-8 shadow-sm transition-all duration-500 hover:shadow-lg md:col-span-8 md:p-12">
            <div>
              <span className="mb-6 inline-flex rounded-full bg-accent-emerald-soft p-3 text-accent-emerald">
                <Brain className="h-8 w-8" strokeWidth={1.75} aria-hidden />
              </span>
              <h3 className="mb-4 mt-6 text-3xl font-semibold text-primary">
                Deep Behavioral Mapping
              </h3>
              <p className="max-w-md text-base leading-relaxed text-on-surface-variant">
                Our proprietary algorithms translate complex emotional data into
                actionable clarity, helping you understand the &apos;why&apos;
                behind your reactions.
              </p>
            </div>
            <div className="relative mt-8 aspect-video overflow-hidden rounded-extra-large md:aspect-[21/9]">
              <Image
                src={HERO_IMG}
                alt="Abstract neural pathways visualization"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/60 to-transparent" />
            </div>
          </div>

          <div className="flex flex-col gap-6 md:col-span-4">
            <div className="flex-1 rounded-extra-extra-large border border-accent-rose/25 bg-accent-rose-soft/50 p-8 shadow-sm transition-shadow hover:shadow-md">
              <span className="inline-flex rounded-full bg-white/60 p-3 text-accent-rose">
                <Heart className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </span>
              <h4 className="mb-2 mt-4 text-2xl font-medium text-primary">
                Relationship Alignment
              </h4>
              <p className="text-base leading-relaxed text-on-surface-variant">
                Sync your profile with partners or family to visualize
                compatibility and communication gaps.
              </p>
            </div>
            <div className="flex-1 rounded-extra-extra-large border border-accent-emerald/20 bg-secondary-container p-8 shadow-sm transition-shadow hover:shadow-md">
              <span className="inline-flex rounded-full bg-white/50 p-3 text-accent-emerald">
                <TrendingUp className="h-7 w-7" strokeWidth={1.75} aria-hidden />
              </span>
              <h4 className="mb-2 mt-4 text-2xl font-medium text-primary">
                Longitudinal Growth
              </h4>
              <p className="text-base leading-relaxed text-on-surface-variant">
                Track your evolution over months and years with precise
                data-driven journaling.
              </p>
            </div>
          </div>
        </section>

        <section
          data-stitch-reveal
          className="mx-auto mt-section-gap max-w-4xl"
        >
          <div className="mb-16 text-center">
            <h3 className="mb-4 text-3xl font-semibold text-primary">
              The Scientific Sanctuary
            </h3>
            <p className="text-lg text-on-surface-variant">
              Our three-pillar approach to lasting equilibrium.
            </p>
          </div>
          <div className="overflow-hidden rounded-extra-large border border-outline-variant/20 bg-surface-container-lowest shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                    <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant md:px-8">
                      Pillar
                    </th>
                    <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant md:px-8">
                      Methodology
                    </th>
                    <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant md:px-8">
                      Outcome
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  <tr className="transition-colors hover:bg-surface-container-low/50">
                    <td className="px-6 py-6 font-semibold text-primary md:px-8 md:py-8">
                      Assessment
                    </td>
                    <td className="px-6 py-6 text-on-surface-variant md:px-8 md:py-8">
                      Cognitive Bias Mapping &amp; Narrative Analysis
                    </td>
                    <td className="px-6 py-6 md:px-8 md:py-8">
                      <span className="rounded-full bg-accent-emerald-soft px-3 py-1 text-sm font-medium text-accent-emerald">
                        Clarity
                      </span>
                    </td>
                  </tr>
                  <tr className="transition-colors hover:bg-surface-container-low/50">
                    <td className="px-6 py-6 font-semibold text-primary md:px-8 md:py-8">
                      Integration
                    </td>
                    <td className="px-6 py-6 text-on-surface-variant md:px-8 md:py-8">
                      Guided Metacognitive Journaling
                    </td>
                    <td className="px-6 py-6 md:px-8 md:py-8">
                      <span className="rounded-full bg-accent-rose-soft px-3 py-1 text-sm font-medium text-accent-rose">
                        Resilience
                      </span>
                    </td>
                  </tr>
                  <tr className="transition-colors hover:bg-surface-container-low/50">
                    <td className="px-6 py-6 font-semibold text-primary md:px-8 md:py-8">
                      Evolution
                    </td>
                    <td className="px-6 py-6 text-on-surface-variant md:px-8 md:py-8">
                      Relational Synergy Feedback Loops
                    </td>
                    <td className="px-6 py-6 md:px-8 md:py-8">
                      <span className="rounded-full bg-accent-emerald-soft px-3 py-1 text-sm font-medium text-accent-emerald">
                        Alignment
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-section-gap rounded-t-extra-extra-large border-t border-outline-variant/30 bg-primary px-edge-margin-mobile py-16 pb-32 text-on-primary md:px-edge-margin-desktop">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-3">
            <div className="mb-6 flex items-center gap-2">
              <Logo size={32} href="/" onDarkBackground />
              <h5 className="text-2xl font-medium text-on-primary">
                Aha It&apos;s me!
              </h5>
            </div>
            <p className="mb-8 max-w-sm text-on-primary/75">
              Architecting psychological equilibrium through scientific discovery
              and empathetic design.
            </p>
          </div>
          <div className="md:col-span-3">
            <h6 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-emerald-soft/90">
              Account
            </h6>
            <ul className="flex flex-col gap-2.5 text-sm text-on-primary/80">
              <li>
                <Link
                  href={ROUTES.accountProfile}
                  className="transition hover:text-accent-rose-soft"
                >
                  My Profile
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.accountBilling}
                  className="transition hover:text-accent-rose-soft"
                >
                  Billing History
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h6 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-emerald-soft/90">
              Support
            </h6>
            <ul className="flex flex-col gap-2.5 text-sm text-on-primary/80">
              <li>
                <Link
                  href={ROUTES.about}
                  className="transition hover:text-accent-rose-soft"
                >
                  About Service
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.pricing}
                  className="transition hover:text-accent-rose-soft"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.faq}
                  className="transition hover:text-accent-rose-soft"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.contact}
                  className="transition hover:text-accent-rose-soft"
                >
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h6 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-emerald-soft/90">
              Legal
            </h6>
            <ul className="flex flex-col gap-2.5 text-sm text-on-primary/80">
              <li>
                <Link
                  href={ROUTES.terms}
                  className="transition hover:text-accent-rose-soft"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.privacy}
                  className="transition hover:text-accent-rose-soft"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.refund}
                  className="transition hover:text-accent-rose-soft"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-[1200px] flex-col justify-between gap-4 border-t border-on-primary/15 pt-8 text-xs md:flex-row">
          <p className="text-on-primary/60">
            © {new Date().getFullYear()} Aha It&apos;s me! All rights reserved.
          </p>
          <nav
            className="flex flex-wrap gap-x-4 gap-y-1 text-on-primary/55"
            aria-label="Hub shortcuts"
          >
            <Link href={blueprintPath(reportId)} className="hover:text-on-primary">
              Me
            </Link>
            <Link href={relationHubPath(reportId)} className="hover:text-on-primary">
              Lab
            </Link>
            <Link href={DECISION_HUB_PATH} className="hover:text-on-primary">
              Choice
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
