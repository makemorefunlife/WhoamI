"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Brain,
  Heart,
  TrendingUp,
} from "lucide-react";
import type {
  RelCounts,
  ResumeState,
} from "@/components/home/HomeAuthActions";
import StitchHomeCta from "@/components/landing/stitch/StitchHomeCta";
import {
  blueprintPath,
  DECISION_HUB_PATH,
  relationHubPath,
} from "@/lib/stitch/hubPaths";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDvgf6WG4j6WmSliT9ytPyueU1yY_U7iK3rDs0KH0un2ei-7z7YtU6CWtOH0vlV1TeaTGp7MNGkGJJE_7jGSf9mVK_GZNVi0cXwUCZbLOqu4lskU70i2IZ3iPe0OhfnCoHROaachRLGnLUdZ7Y2B7Hm2210LeZsY2lijQ2Q7uJTIKNNHhy2pvKTWCMNwJv_B1Qn5xU3k3_SDhSpMjUl9uGmAFlwcpMJCvf2JXK0Od047ck6WxhSnq1RvLD2ek81OaidU9GNkxAezmTk";

const FOOTER_LOGO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBlfdLUG0D7OsmV5zilUhXgdbxK8_gdaUjLzR66qxV9Uwcy6c9STymuREBgO3AGrNwuVjPuskOKRr3Rk8OkuowmNVMQsAPMwC-_wAyPLozUDU8YwGlo2VVV0jeVR03QxjXH75aVHRC8ve2hZVEKYzv1vpqxooMWhMnFWn8FYQl1hhqNkmn2wGw2dG9lPksmnSjMUdPRCfTpZNIhlKXXSk63aCHMTfGCbr7I1eFQuiQB5sWHA5wSA9HIKQEIT6pI2WyEZso";

type Props = {
  resume: ResumeState;
  relCounts: RelCounts;
  creatingReport: boolean;
  onOpenAuth: () => void;
  onOpenStartChoice: () => void;
  onResetResume: () => void;
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
  resume,
  relCounts,
  creatingReport,
  onOpenAuth,
  onOpenStartChoice,
  onResetResume,
}: Props) {
  const router = useRouter();
  const mainRef = useScrollReveal();

  const reportId = resume.reportId?.trim() ?? "";

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
                  resume={resume}
                  relCounts={relCounts}
                  creatingReport={creatingReport}
                  onOpenStartChoice={onOpenStartChoice}
                  onResetResume={onResetResume}
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
          <div className="md:col-span-6">
            <div className="mb-6 flex items-center gap-2">
              <Image
                src={FOOTER_LOGO}
                alt="Aha It's me!"
                width={32}
                height={32}
                className="h-8 w-auto object-contain"
                unoptimized
              />
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
            <h6 className="mb-6 text-sm font-semibold uppercase tracking-widest text-accent-emerald-soft">
              Journey
            </h6>
            <ul className="flex flex-col gap-4 text-on-primary/80">
              <li>
                <Link
                  href={blueprintPath(reportId)}
                  className="hover:text-accent-rose-soft"
                >
                  Personal Analysis
                </Link>
              </li>
              <li>
                <Link
                  href={relationHubPath(reportId)}
                  className="hover:text-accent-rose-soft"
                >
                  Relation Hub
                </Link>
              </li>
              <li>
                <Link
                  href={DECISION_HUB_PATH}
                  className="hover:text-accent-rose-soft"
                >
                  Decision Center
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h6 className="mb-6 text-sm font-semibold uppercase tracking-widest text-accent-emerald-soft">
              Legal
            </h6>
            <ul className="flex flex-col gap-4 text-on-primary">
              <li>
                <Link
                  href="/about"
                  className="font-medium text-on-primary hover:text-accent-rose-soft"
                >
                  Service Information
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="font-medium text-on-primary hover:text-accent-rose-soft"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="font-medium text-on-primary hover:text-accent-rose-soft"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-[1200px] flex-col justify-between gap-4 border-t border-on-primary/15 pt-8 text-xs md:flex-row">
          <p className="text-on-primary/60">
            © 2026 Aha It&apos;s me! All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
