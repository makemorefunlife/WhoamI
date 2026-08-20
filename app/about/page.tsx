import type { Metadata } from "next";
import SpaceBackground from "@/components/space/SpaceBackground";
import GlowButton from "@/components/space/GlowButton";
import { CircleDot, Compass, GitBranch, Orbit, Radar, Satellite, Scale, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { getRequestLocale } from "@/lib/i18n/serverLocale";
import { getMessages } from "@/lib/i18n/messages";
import { buildPageMetadata } from "@/lib/seo/pageMetadata";

/** Avoid SSG: root Clerk chrome can throw useContext null during /about prerender. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return buildPageMetadata({
    locale,
    path: "/about",
    title: messages.about.metaTitle,
    description: messages.about.metaDescription,
  });
}

export default async function AboutPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const t = messages.about;
  return (
    <SpaceBackground>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_62%_12%,rgba(120,142,196,0.22),transparent_42%),radial-gradient(circle_at_20%_78%,rgba(93,119,177,0.14),transparent_48%),linear-gradient(180deg,#060b17_0%,#0b1220_42%,#0a1020_100%)]"
      />
      <main id="main" className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-24 pt-14 [word-break:keep-all] [line-break:strict] sm:px-6 sm:pb-28 sm:pt-20">
        <section className="grid items-center gap-10 border-b border-white/8 pb-14 sm:pb-16 md:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <p className="text-xs font-medium uppercase tracking-[0.26em] text-[#CBB38E]">
              {t.heroEyebrow}
            </p>
            <h1 className="max-w-[16ch] text-3xl font-semibold leading-[1.25] text-[#F8FAFC]">
              {t.heroTitleLine1}
              <br />
              {t.heroTitleLine2}
            </h1>
            <div className="max-w-[35rem] space-y-4 text-sm leading-7 text-[#CBD5E1] sm:text-base sm:leading-8">
              <p className="max-w-[32ch]">
                {t.heroBodyLine1}
                <br />
                {t.heroBodyLine2}
              </p>
              <p className="max-w-[16ch]">
                {t.heroBodyLine3}
                <br />
                {t.heroBodyLine4}
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[22rem]">
            <div className="aspect-square rounded-full border border-white/10 bg-[radial-gradient(circle_at_40%_35%,rgba(255,255,255,0.32),rgba(143,165,216,0.25)_36%,rgba(23,35,60,0.5)_68%,transparent_76%)] shadow-[0_0_72px_rgba(157,170,214,0.24)]" />
            <div className="pointer-events-none absolute inset-0">
              <span className="absolute left-1/2 top-1/2 block h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8DA3D0]/35" />
              <span className="absolute left-1/2 top-1/2 block h-[136%] w-[136%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#8DA3D0]/20" />
              <span className="absolute left-[20%] top-[26%] h-2.5 w-2.5 rounded-full bg-[#E6D7B6] shadow-[0_0_14px_rgba(230,215,182,0.68)]" />
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-14">
          <p className="text-xs font-medium uppercase tracking-[0.26em] text-[#CBB38E]">
            {t.pillarsEyebrow}
          </p>
          <h2 className="mt-3 text-xl font-semibold text-[#F8FAFC] sm:text-2xl">
            {t.pillarsTitle}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#CBD5E1] sm:text-base">
            {t.pillarsBody}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <PillarCard
              icon={<Compass className="h-5 w-5" strokeWidth={1.8} />}
              title={t.pillarMeTitle}
              subtitle={t.pillarMeSubtitle}
              desc={t.pillarMeDesc}
            />
            <PillarCard
              icon={<GitBranch className="h-5 w-5" strokeWidth={1.8} />}
              title={t.pillarRelTitle}
              subtitle={t.pillarRelSubtitle}
              desc={t.pillarRelDesc}
            />
            <PillarCard
              icon={<Scale className="h-5 w-5" strokeWidth={1.8} />}
              title={t.pillarDecisionTitle}
              subtitle={t.pillarDecisionSubtitle}
              desc={t.pillarDecisionDesc}
            />
          </div>
        </section>

        <section className="py-12 sm:py-14">
          <div className="grid gap-5 rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-6 shadow-[0_16px_36px_rgba(0,0,0,0.24)] sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="h-12 w-12 rounded-full border border-[#CBB38E]/35 bg-[radial-gradient(circle,rgba(203,179,142,0.45)_0%,rgba(203,179,142,0.08)_56%,transparent_74%)] shadow-[0_0_24px_rgba(203,179,142,0.22)]" />
            <p className="max-w-[36rem] text-base leading-8 text-[#F8FAFC]">
              {t.helpQuoteLine1}
              <br />
              {t.helpQuoteLine2}
              <br />
              <br />
              {t.helpQuoteLine3}
              <br />
              {t.helpQuoteLine4}
              <br />
              {t.helpQuoteLine5}
            </p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <h2 className="text-left text-xl font-semibold text-[#F8FAFC] sm:text-2xl">
            {t.understandTitle}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-5">
            <StructureCard
              title={t.structureOuterTitle}
              description={t.structureOuterDesc}
              icon={<Satellite className="h-5 w-5" strokeWidth={1.8} />}
              visual={<WaveVisual />}
            />
            <StructureCard
              title={t.structureInnerTitle}
              description={t.structureInnerDesc}
              icon={<CircleDot className="h-5 w-5" strokeWidth={1.8} />}
              visual={<LayerVisual />}
            />
            <StructureCard
              title={t.structureRelTitle}
              description={t.structureRelDesc}
              icon={<Orbit className="h-5 w-5" strokeWidth={1.8} />}
              visual={<OrbitVisual />}
            />
            <StructureCard
              title={t.structureAdviceTitle}
              description={t.structureAdviceDesc}
              icon={<Radar className="h-5 w-5" strokeWidth={1.8} />}
              visual={<RadarVisual />}
            />
          </div>
        </section>

        <section className="border-t border-white/8 py-16 sm:py-20">
          <h2 className="text-left text-xl font-semibold text-[#F8FAFC] sm:text-2xl">
            {t.availableNowTitle}
          </h2>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#CBD5E1] sm:text-base sm:leading-8">
            {t.availableNowBodyLine1}
            <br />
            {t.availableNowBodyLine2}
            <br />
            <br />
            {t.availableNowBodyLine3}
            <br />
            {t.availableNowBodyLine4}
            <br />
            <br />
            {t.availableNowBodyLine5}
            <br />
            {t.availableNowBodyLine6}
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-5">
            <FeatureCard
              title={t.featureFreeTitle}
              points={[
                t.featureFreePoint1,
                t.featureFreePoint2,
                t.featureFreePoint3,
                t.featureFreePoint4,
              ]}
              visual={<TextCardVisual />}
            />
            <FeatureCard
              title={t.featureDeepTitle}
              points={[t.featureDeepPoint1, t.featureDeepPoint2, t.featureDeepPoint3]}
              visual={<BarGraphVisual />}
            />
            <FeatureCard
              title={t.featureRelTitle}
              points={[t.featureRelPoint1, t.featureRelPoint2]}
              visual={<CompareVisual />}
            />
          </div>
        </section>

        <section className="grid gap-8 border-t border-white/8 py-16 sm:py-20 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div>
            <p className="text-xl font-semibold leading-[1.65] text-[#F8FAFC] sm:text-2xl">
              {t.continuousQuoteLine1}
              <br />
              <br />
              {t.continuousQuoteLine2}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] px-6 py-5 text-sm leading-7 text-[#CBD5E1] sm:text-base sm:leading-8">
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5">
                <LineDot /> {t.roadmapRelDeep}
              </li>
              <li className="flex items-center gap-2.5">
                <LineDot /> {t.roadmapMultiAngle}
              </li>
              <li className="flex items-center gap-2.5">
                <LineDot /> {t.roadmapTeam}
              </li>
              <li className="flex items-center gap-2.5">
                <LineDot /> {t.roadmapMore}
              </li>
            </ul>
          </div>
        </section>

        <section className="border-t border-white/8 py-16 sm:py-20">
          <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-start">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.26em] text-[#CBB38E]">
                {t.socialEyebrow}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-[#F8FAFC] sm:text-2xl">
                {t.socialTitle}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#CBD5E1] sm:text-base">
                {t.socialBody}
              </p>
              <a
                href="https://www.instagram.com/ahaitsme"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white transition hover:border-[#f472b6]/40 hover:bg-[#f472b6]/10"
              >
                <span className="text-[#f472b6]" aria-hidden>
                  IG
                </span>
                {t.socialFollowCta}
              </a>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="aspect-square rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3"
                >
                  <div className="h-full w-full rounded-lg bg-white/[0.04]" />
                  <p className="mt-2 text-[10px] text-white/30">{t.feedComingSoon}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] px-6 py-10 text-center sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-24 w-[140%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(203,179,142,0.35),transparent_64%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-4 h-14 w-[118%] -translate-x-1/2 rounded-full border border-[#CBB38E]/25"
          />
          <p className="relative text-2xl font-semibold leading-[1.35] text-[#F8FAFC] sm:text-3xl">
            {t.closingQuoteLine1}
            <br />
            {t.closingQuoteLine2}
          </p>
          <p className="relative mt-3 text-sm leading-7 text-[#94A3B8] sm:text-base">
            {t.closingSubtitle}
          </p>
          <div className="relative mx-auto mt-8 max-w-xs">
            <GlowButton
              href="/"
              variant="primary"
              className="!min-h-[50px] text-[0.98rem] font-semibold"
            >
              {t.closingCta}
            </GlowButton>
          </div>
        </section>
      </main>
    </SpaceBackground>
  );
}

function PillarCard({
  icon,
  title,
  subtitle,
  desc,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  desc: string;
}) {
  return (
    <article className="rounded-[20px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),transparent)] p-5">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#CBB38E]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#F8FAFC]">
        {title}
        <span className="ml-1.5 text-xs font-medium text-white/45">
          {subtitle}
        </span>
      </h3>
      <p className="mt-2 text-sm leading-7 text-[#CBD5E1]">{desc}</p>
    </article>
  );
}

function StructureCard({
  title,
  description,
  icon,
  visual,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  visual: ReactNode;
}) {
  return (
    <article className="min-w-[240px] rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-5 shadow-[0_14px_28px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(203,179,142,0.35)] hover:bg-[rgba(255,255,255,0.035)]">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#CBB38E]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#F8FAFC]">{title}</h3>
      <p className="mt-1.5 text-sm leading-7 text-[#CBD5E1]">{description}</p>
      <div className="mt-4">{visual}</div>
    </article>
  );
}

function FeatureCard({
  title,
  points,
  visual,
}: {
  title: string;
  points: string[];
  visual: ReactNode;
}) {
  return (
    <article className="min-w-[240px] rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018))] p-5 shadow-[0_14px_28px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(203,179,142,0.35)] hover:bg-[rgba(255,255,255,0.035)]">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#CBD5E1]">
        <UserRound className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#F8FAFC]">{title}</h3>
      <ul className="mt-3 space-y-1.5 text-sm leading-7 text-[#CBD5E1]">
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <div className="mt-4">{visual}</div>
    </article>
  );
}

function WaveVisual() {
  return (
    <svg viewBox="0 0 240 78" className="h-16 w-full" aria-hidden="true">
      <path
        d="M6 50c22-30 36 26 58-4s35-22 53 2 28 18 46-5 37-19 63-3"
        fill="none"
        stroke="#94A3B8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 57c22-30 36 26 58-4s35-22 53 2 28 18 46-5 37-19 63-3"
        fill="none"
        stroke="rgba(203,179,142,0.5)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LayerVisual() {
  return (
    <div className="flex h-16 items-center justify-center">
      <div className="relative h-14 w-14 rounded-full border border-white/10 bg-transparent">
        <div className="absolute inset-2 rounded-full border border-[#94A3B8]/35" />
        <div className="absolute inset-4 rounded-full bg-[#CBB38E]/58" />
      </div>
    </div>
  );
}

function OrbitVisual() {
  return (
    <svg viewBox="0 0 240 78" className="h-16 w-full" aria-hidden="true">
      <ellipse cx="120" cy="40" rx="92" ry="26" fill="none" stroke="#94A3B8" strokeOpacity="0.45" />
      <ellipse cx="120" cy="40" rx="58" ry="16" fill="none" stroke="#94A3B8" strokeOpacity="0.25" />
      <circle cx="52" cy="42" r="6" fill="#94A3B8" />
      <circle cx="190" cy="36" r="5" fill="#D6C19A" />
    </svg>
  );
}

function RadarVisual() {
  return (
    <svg viewBox="0 0 240 78" className="h-16 w-full" aria-hidden="true">
      <circle cx="120" cy="39" r="28" fill="none" stroke="#94A3B8" strokeOpacity="0.35" />
      <circle cx="120" cy="39" r="17" fill="none" stroke="#94A3B8" strokeOpacity="0.35" />
      <path d="M120 39 152 26" stroke="#D6C19A" strokeWidth="2" strokeLinecap="round" />
      <circle cx="152" cy="26" r="4.2" fill="#D6C19A" />
    </svg>
  );
}

function TextCardVisual() {
  return (
    <div className="rounded-xl border border-white/15 bg-[#17213a]/70 p-3">
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full border border-[#CBB38E]/40 bg-[#CBB38E]/12" />
        <div className="h-2.5 w-24 rounded-full bg-[#CBB38E]/65" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-2 rounded-full bg-white/16" />
        <div className="h-2 rounded-full bg-white/12" />
        <div className="h-2 w-3/4 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

function BarGraphVisual() {
  return (
    <div className="rounded-xl border border-white/15 bg-[#17213a]/70 p-3">
      <div className="flex h-12 items-end gap-1.5">
        <div className="h-5 w-2.5 rounded bg-white/16" />
        <div className="h-8 w-2.5 rounded bg-white/22" />
        <div className="h-11 w-2.5 rounded bg-[#CBB38E]/58" />
        <div className="h-7 w-2.5 rounded bg-white/22" />
        <div className="h-9 w-2.5 rounded bg-white/26" />
      </div>
      <div className="mt-3 h-2 w-2/3 rounded-full bg-white/15" />
    </div>
  );
}

function CompareVisual() {
  return (
    <div className="rounded-xl border border-white/15 bg-[#17213a]/70 p-3">
      <div className="relative mx-auto h-14 w-28">
        <div className="absolute left-0 top-2 h-10 w-10 rounded-full bg-[#7E8AB9]/45" />
        <div className="absolute right-0 top-2 h-10 w-10 rounded-full bg-[#7E8AB9]/45" />
        <div className="absolute left-1/2 top-3 h-8 w-8 -translate-x-1/2 rounded-full bg-[#CBB38E]/62" />
      </div>
      <div className="mt-2 space-y-1.5">
        <div className="h-2 rounded-full bg-white/15" />
        <div className="h-2 w-4/5 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

function LineDot() {
  return (
    <span aria-hidden className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-[#CBB38E]" />
      <span className="h-px w-4 bg-[#CBB38E]/45" />
    </span>
  );
}
