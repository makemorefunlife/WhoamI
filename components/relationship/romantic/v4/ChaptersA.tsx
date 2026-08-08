"use client";

/**
 * Chapters 1-5, visual language ported from Lovable "Inner Compass Reports" →
 * romantic-v4-concept (ChaptersA.tsx), wired to the real canonical payload via
 * ./adaptCanonicalSection instead of Lovable's mock romantic-v4-data.
 */
import { ArrowDown, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import type { RomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/types";
import type { CanonicalSection } from "@/lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives";
import { ChapterSection, PersonTag, Pull, Reveal, SubHeading, Bridge } from "./primitives";
import { MatchRadar } from "./MatchRadar";
import {
  adaptHero,
  adaptAttraction,
  adaptDynamics,
  adaptConflict,
  adaptDifference,
  adaptRadarAxes,
} from "./adaptCanonicalSection";

export type SectionProps = {
  payload: RomanticV4PrototypePayload;
  section: CanonicalSection;
  personA: string;
  personB: string;
  /** Sequential "01".."08" position among the core numbered chapters, computed once in CanonicalReportView.tsx — omit for chapters outside that sequence. */
  n?: string;
  debug?: boolean;
};

const DebugPanel = ({ evidenceIds = [] }: { evidenceIds?: string[] }) => (
  <div className="mt-8 border-t border-dashed border-rel-taupe/40 pt-4 text-left font-mono text-[11px] text-rel-ink-mute">
    <div className="mb-1 font-semibold">Debug</div>
    {evidenceIds.length > 0 && <div>Evidence: {evidenceIds.join(", ")}</div>}
  </div>
);

/* ── Chapter 1 · Hero / Essence ─────────────────────────────── */
export const HeroSection = ({ section, personA, personB, debug }: SectionProps) => {
  const hero = adaptHero(section);
  return (
    <section id={section.chapterId} className="relative overflow-hidden scroll-mt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-40 h-[26rem] w-[26rem] rounded-full bg-rel-taupe-soft blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-[-14rem] h-[30rem] w-[30rem] rounded-full bg-rel-deep-soft blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-[880px] px-5 pb-20 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
        <Reveal>
          <h1 className="mt-4 font-rel-serif text-[46px] leading-[1.02] tracking-[-0.025em] text-rel-ink sm:text-[68px]">
            {personA} <span className="text-rel-taupe">&</span> {personB}
          </h1>
        </Reveal>

        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_240px] md:items-center">
          <Reveal delay={80}>
            <div className="border-l-2 border-rel-deep pl-5 sm:pl-7">
              <p className="font-rel-serif text-[20px] leading-[1.6] tracking-[-0.01em] text-rel-ink sm:text-[25px]">
                {hero.essence}
              </p>
            </div>
            <p className="mt-8 max-w-[58ch] font-rel-sans text-[15px] leading-[1.9] text-rel-ink-soft">
              {hero.definition}
            </p>
          </Reveal>

          <Reveal delay={160} className="order-first md:order-none">
            <RelationshipGlyph aName={personA} bName={personB} />
          </Reveal>
        </div>

        <div className="mt-14 flex items-center gap-3 font-rel-sans text-[10px] uppercase tracking-[0.24em] text-rel-ink-mute">
          <ArrowDown className="h-3.5 w-3.5 animate-bounce motion-reduce:animate-none" strokeWidth={1.5} />
          {personA}와 {personB}의 관계 심층 리포트
        </div>

        {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
      </div>
    </section>
  );
};

function RelationshipGlyph({ aName, bName }: { aName: string; bName: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      className="mx-auto h-auto w-[200px] sm:w-[240px]"
      role="img"
      aria-label={`${aName}와 ${bName}의 관계를 표현한 추상 이미지`}
    >
      <circle cx="120" cy="120" r="96" fill="none" stroke="var(--rel-line)" strokeWidth="1" />
      <circle cx="120" cy="120" r="66" fill="none" stroke="var(--rel-line)" strokeWidth="1" />
      <path
        d="M40 150 C 80 90, 120 190, 160 110 S 210 70, 214 96"
        fill="none"
        stroke="var(--rel-deep)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M26 118 C 70 140, 110 60, 150 132 S 196 168, 208 140"
        fill="none"
        stroke="var(--rel-taupe)"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
      <circle cx="98" cy="120" r="44" fill="var(--rel-deep-soft)" />
      <circle cx="142" cy="120" r="44" fill="var(--rel-taupe-soft)" />
      <circle cx="120" cy="120" r="5" fill="var(--rel-deep)" />
    </svg>
  );
}

/* ── Chapter 2 · Attraction ─────────────────────────────────── */
export const AttractionSection = ({ payload, section, personA, personB, n, debug }: SectionProps) => {
  const data = adaptAttraction(section, payload);
  const dirs = [data.whyYou, data.whyMe];
  const names = { a: personA, b: personB };

  return (
    <ChapterSection
      id={section.chapterId}
      n={n}
      label={section.userQuestion}
      title={section.title}
    >
      <div className="mt-2 grid gap-6 md:grid-cols-2">
        {dirs.map((d, i) => (
          <Reveal key={`${d.from}-${d.to}`} delay={i * 80}>
            <article
              className={`h-full rounded-2xl border bg-rel-surface p-6 shadow-sm sm:p-7 ${
                d.from === "a" ? "border-v4-a/25" : "border-v4-b/30"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 font-rel-sans text-[11px] tracking-[0.1em] text-rel-ink-mute">
                <PersonTag name={names[d.from]} side={d.from} />
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                <PersonTag name={names[d.to]} side={d.to} />
              </div>
              <h3 className="mt-4 font-rel-serif text-[20px] leading-[1.35] tracking-[-0.01em] text-rel-ink">
                {d.title}
              </h3>
              <p className="mt-3 font-rel-sans text-[14.5px] leading-[1.85] text-rel-ink-soft">
                {d.body}
              </p>
              {d.scene && (
                <div
                  className={`mt-4 rounded-xl px-4 py-3 ${
                    d.from === "a" ? "bg-v4-a-soft" : "bg-v4-b-soft"
                  }`}
                >
                  <div
                    className={`font-rel-sans text-[10px] uppercase tracking-[0.16em] ${
                      d.from === "a" ? "text-v4-a" : "text-v4-b"
                    }`}
                  >
                    이럴 때, 이런 모습
                  </div>
                  <p className="mt-1.5 font-rel-sans text-[13px] leading-[1.7] text-rel-ink-soft">
                    {d.scene}
                  </p>
                </div>
              )}
              {d.datingVibe && (
                <p className="mt-3 font-rel-sans text-[13px] italic leading-[1.7] text-rel-ink-mute">
                  데이트할 때는 {d.datingVibe}
                </p>
              )}
              {d.signals.length > 0 && (
                <ul className="mt-5 space-y-2 border-t border-rel-line pt-4">
                  {d.signals.map((s) => (
                    <li key={s} className="flex items-start gap-2.5">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          d.from === "a" ? "bg-v4-a" : "bg-v4-b"
                        }`}
                        aria-hidden
                      />
                      <span className="min-w-0 font-rel-sans text-[13px] leading-[1.6] text-rel-ink-soft">
                        {s}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-8 rounded-2xl bg-rel-deep p-7 sm:p-10">
          <SubHeading title={data.whyUs.title} invert tag="Why us" />
          <p className="mt-5 max-w-[62ch] font-rel-sans text-[15px] leading-[1.9] text-white/80">
            {data.whyUs.body}
          </p>
          {data.whyUs.mechanism.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {data.whyUs.mechanism.map((m) => (
                <div
                  key={m}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 font-rel-sans text-[13px] leading-[1.7] text-white/85"
                >
                  {m}
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {data.moment && (
        <Reveal>
          <figure className="mt-10 border-y border-rel-line py-9">
            <blockquote>
              <Pull>{data.moment.line}</Pull>
            </blockquote>
            <figcaption className="mx-auto mt-5 max-w-[54ch] text-center font-rel-sans text-[13px] leading-[1.75] text-rel-ink-mute">
              {data.moment.scene}
            </figcaption>
          </figure>
        </Reveal>
      )}

      {data.bridge && <Bridge text={data.bridge} label="그런데" />}
      {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
    </ChapterSection>
  );
};

/* ── Chapter 3 · Relationship Dynamics ───────────────────────── */
const statusTone: Record<string, string> = {
  "안정적": "border-v4-good/40 bg-v4-good-soft text-v4-good",
  "보통": "border-rel-taupe/40 bg-rel-taupe-soft text-rel-taupe",
  "주의가 필요한 지점": "border-v4-bad/50 bg-v4-bad-soft text-v4-bad",
};

export const DynamicsSection = ({ section, n, debug }: SectionProps) => {
  const states = adaptDynamics(section);
  return (
    <ChapterSection
      id={section.chapterId}
      n={n}
      label={section.userQuestion}
      title={section.title}
      tint="cream"
      defaultOpen
    >
      <div className="space-y-5">
        {states.map((s, i) => (
          <Reveal key={s.key} delay={i * 70}>
            <article className="overflow-hidden rounded-2xl border border-rel-line bg-rel-surface shadow-sm">
              <div className="px-6 py-6 sm:px-8 sm:py-7">
                <div className="min-w-0">
                  <div className="font-rel-sans text-[10.5px] tracking-[0.24em] text-rel-ink-mute">
                    0{i + 1}
                  </div>
                  <h3 className="mt-2 font-rel-serif text-[20px] leading-[1.3] tracking-[-0.01em] text-rel-ink sm:text-[23px]">
                    {s.label}
                  </h3>
                  {s.summary && (
                    <p className="mt-3 max-w-[64ch] font-rel-sans text-[13.5px] leading-[1.7] text-rel-ink-mute">
                      {s.summary}
                    </p>
                  )}
                </div>

                <p className="mt-5 max-w-[64ch] font-rel-sans text-[14.5px] leading-[1.9] text-rel-ink-soft">
                  {s.interpretation}
                </p>
                <dl className="mt-7 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-v4-good-soft p-5">
                    <dt className="font-rel-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-v4-good">
                      강점
                    </dt>
                    <dd className="mt-2.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink-soft">
                      {s.strength}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-v4-bad-soft p-5">
                    <dt className="font-rel-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-v4-bad">
                      주의
                    </dt>
                    <dd className="mt-2.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink-soft">
                      {s.caution}
                    </dd>
                  </div>
                </dl>
                {s.basis && (
                  <p className="mt-5 font-rel-sans text-[12px] leading-[1.7] text-rel-ink-mute">
                    · {s.basis}
                  </p>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
      {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
    </ChapterSection>
  );
};

/* ── Chapter 4 · Conflict ─────────────────────────────────────── */
function FlowArrow({ loop = false }: { loop?: boolean }) {
  return (
    <div className="flex justify-center py-4" aria-hidden>
      <div className="flex flex-col items-center gap-1">
        <span className="h-6 w-px bg-rel-ink/20" />
        {loop ? (
          <RefreshCw className="h-4 w-4 text-rel-ink-mute" strokeWidth={1.5} />
        ) : (
          <ArrowDown className="h-4 w-4 text-rel-ink-mute" strokeWidth={1.5} />
        )}
        <span className="h-6 w-px bg-rel-ink/20" />
      </div>
    </div>
  );
}

export const ConflictSection = ({ section, payload, personA, personB, n, debug }: SectionProps) => {
  const data = adaptConflict(section, payload);
  const names = { a: personA, b: personB };

  return (
    <ChapterSection
      id={section.chapterId}
      n={n}
      label={section.userQuestion}
      title={section.title}
      tint="cream"
    >
      <Reveal>
        <div className="rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm sm:p-7">
          <div className="font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-taupe">
            Trigger
          </div>
          <h3 className="mt-2 font-rel-serif text-[20px] leading-[1.35] text-rel-ink">
            {data.triggerTitle}
          </h3>
          <p className="mt-3 max-w-[62ch] font-rel-sans text-[14.5px] leading-[1.85] text-rel-ink-soft">
            {data.triggerBody}
          </p>
        </div>
      </Reveal>

      {data.pairs.length > 0 && (
        <>
          <FlowArrow />
          <div className="grid gap-4 sm:grid-cols-2">
            {data.pairs.map((p, i) => (
              <Reveal key={p.person} delay={i * 80}>
                <div className="h-full rounded-2xl border border-rel-line bg-rel-surface p-5 shadow-sm">
                  <PersonTag name={names[p.person]} side={p.person} />
                  <p className="mt-3 font-rel-sans text-[14px] leading-[1.75] text-rel-ink">
                    {p.does}
                  </p>
                  <div className="mt-4 rounded-xl bg-rel-taupe-soft px-4 py-3">
                    <div className="font-rel-sans text-[10px] uppercase tracking-[0.16em] text-rel-taupe">
                      상대에게 도착하는 방식
                    </div>
                    <p className="mt-1.5 font-rel-sans text-[13.5px] leading-[1.7] text-rel-ink-soft">
                      {p.readAs}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </>
      )}

      {data.escalation && (
        <>
          <FlowArrow />
          <Reveal>
            <div className="rounded-2xl border border-rel-taupe/40 bg-rel-taupe-soft p-6 sm:p-7">
              <div className="font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-taupe">
                Escalation
              </div>
              <p className="mt-3 max-w-[62ch] font-rel-sans text-[14.5px] leading-[1.85] text-rel-ink">
                {data.escalation.a} {data.escalation.b}
              </p>
            </div>
          </Reveal>
        </>
      )}

      {data.loop && (
        <>
          <FlowArrow loop />
          <Reveal>
            <div className="rounded-2xl border border-rel-deep/30 bg-rel-deep-soft p-6 sm:p-7">
              <div className="flex items-center gap-2 font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-deep">
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
                Repeating loop
              </div>
              <p className="mt-3 max-w-[62ch] font-rel-sans text-[14.5px] leading-[1.85] text-rel-ink">
                {data.loop}
              </p>
            </div>
          </Reveal>
        </>
      )}
      {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
    </ChapterSection>
  );
};

/* ── Chapter 5 · Difference & Misunderstanding ────────────────── */
export const MisunderstandingSection = ({ section, payload, personA, personB, n, debug }: SectionProps) => {
  const { comparison, details } = adaptDifference(section, payload);
  const axes = adaptRadarAxes(payload);

  return (
    <ChapterSection
      id={section.chapterId}
      n={n}
      label={section.userQuestion}
      title={section.title}
    >
      {comparison.length > 0 && (
        <div>
          <SubHeading title="나란히 놓고 보기" tag="Comparison" />
          <div className="mt-5 overflow-hidden rounded-2xl border border-rel-line bg-rel-surface shadow-sm">
            <div className="hidden grid-cols-[minmax(0,120px)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] items-center gap-4 border-b border-rel-line bg-rel-taupe-soft/60 px-5 py-3.5 text-center font-rel-sans text-[13px] font-semibold tracking-[0.06em] text-rel-ink-soft sm:grid">
              <span>축</span>
              <span className="flex justify-center">
                <PersonTag name={personA} side="a" />
              </span>
              <span>의미</span>
              <span className="flex justify-center">
                <PersonTag name={personB} side="b" />
              </span>
            </div>
            {comparison.map((row, i) => (
              <div
                key={row.axis}
                className={`grid gap-3 px-5 py-4 text-center sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] sm:gap-4 ${
                  i > 0 ? "border-t border-rel-line" : ""
                }`}
              >
                <div className="font-rel-sans text-[13px] font-semibold text-rel-ink">{row.axis}</div>
                <div className="min-w-0 font-rel-sans text-[13.5px] leading-[1.6] text-rel-ink-soft">
                  {row.a}
                </div>
                <div className="min-w-0 font-rel-sans text-[12.5px] leading-[1.65] text-rel-ink-mute">
                  {row.meaning}
                </div>
                <div className="min-w-0 font-rel-sans text-[13.5px] leading-[1.6] text-rel-ink-soft">
                  {row.b}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {axes.length > 0 && (
        <div className="mt-14">
          <SubHeading title="심리 축 매칭" tone="coral" tag={`${axes.length} axes`} />
          <Reveal>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-rel-line bg-rel-surface shadow-sm">
              <div className="min-w-[420px] px-8 py-6 sm:min-w-0 sm:px-14 sm:py-10 [&_svg]:overflow-visible">
                <MatchRadar axes={axes} aName={personA} bName={personB} />
              </div>
            </div>
          </Reveal>
        </div>
      )}

      {details.length > 0 && (
        <div className="mt-14 space-y-6">
          <SubHeading title="가장 크게 갈라지는 지점" tag={`${details.length}개 축`} />
          {details.map((d, i) => (
            <Reveal key={d.axis} delay={i * 60}>
              <article className="rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm sm:p-7">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h4 className="truncate font-rel-serif text-[19px] tracking-[-0.01em] text-rel-ink">
                      {d.axis}
                    </h4>
                    <p className="mt-1 font-rel-sans text-[12.5px] leading-[1.6] text-rel-ink-mute">
                      {d.meaning}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-v4-bad/40 bg-v4-bad-soft px-2.5 py-1 font-rel-sans text-[10.5px] tracking-[0.12em] text-v4-bad">
                    격차 {d.gap}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-rel-line bg-rel-bg px-4 py-3">
                    <PersonTag name={personA} side="a" />
                    <p className="mt-1.5 font-rel-sans text-[13.5px] leading-[1.7] text-rel-ink-soft">
                      {d.aPattern}
                    </p>
                  </div>
                  <div className="rounded-xl border border-rel-line bg-rel-bg px-4 py-3">
                    <PersonTag name={personB} side="b" />
                    <p className="mt-1.5 font-rel-sans text-[13.5px] leading-[1.7] text-rel-ink-soft">
                      {d.bPattern}
                    </p>
                  </div>
                </div>

                <p className="mt-5 font-rel-serif text-[16px] leading-[1.75] text-rel-ink">
                  {d.between}
                </p>

                <dl className="mt-5 grid gap-x-6 gap-y-3 border-t border-rel-line pt-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <dt className="font-rel-sans text-[10px] uppercase tracking-[0.16em] text-v4-good">
                      이 차이가 주는 것
                    </dt>
                    <dd className="mt-1.5 font-rel-sans text-[13px] leading-[1.7] text-rel-ink-soft">
                      {d.benefit}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="font-rel-sans text-[10px] uppercase tracking-[0.16em] text-v4-bad">
                      지칠 때 나타나는 것
                    </dt>
                    <dd className="mt-1.5 font-rel-sans text-[13px] leading-[1.7] text-rel-ink-soft">
                      {d.stress}
                    </dd>
                  </div>
                </dl>
              </article>
            </Reveal>
          ))}
        </div>
      )}

      {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
    </ChapterSection>
  );
};
