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
import { PsychAxisComparisonSection } from "../../shared/psychAxis/PsychAxisComparisonSection";
import { WhyYouMeUsSection } from "../../shared/whyYouMeUs/WhyYouMeUsSection";
import {
  adaptHero,
  adaptAttraction,
  adaptDynamics,
  adaptConflict,
  adaptRadarAxes,
  adaptRadarHighlights,
} from "./adaptCanonicalSection";
import { VersusStrip, Evidence } from "../../shared/editorial/EditorialPrimitives";

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
      <div className="relative mx-auto w-full max-w-[880px] px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
        <Reveal>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-rel-line bg-rel-surface px-3.5 py-1 font-rel-sans text-[11.5px] font-semibold tracking-wide text-rel-ink">
              연애 · 파트너십
            </span>
            <div className="flex items-center gap-2 font-rel-sans text-[13px] font-medium text-rel-ink-soft">
              <span className="rounded-full bg-v4-a-soft px-3 py-0.5 font-semibold text-v4-a">{personA}</span>
              <span className="text-rel-ink-mute">×</span>
              <span className="rounded-full bg-v4-b-soft px-3 py-0.5 font-semibold text-v4-b">{personB}</span>
            </div>
          </div>
          <h1 className="mt-6 font-rel-serif text-[42px] leading-[1.05] tracking-[-0.025em] text-rel-ink sm:text-[62px]">
            {personA} <span className="text-rel-taupe">&</span> {personB}
          </h1>
        </Reveal>

        <div className="mt-10 max-w-[68ch]">
          <Reveal delay={80}>
            <div className="border-l-2 border-rel-deep pl-5 sm:pl-7">
              <p className="font-rel-serif text-[20px] leading-[1.65] tracking-[-0.01em] text-rel-ink sm:text-[25px]">
                {hero.essence}
              </p>
            </div>
            <p className="mt-7 font-rel-sans text-[15px] leading-[1.9] text-rel-ink-soft">
              {hero.definition}
            </p>
          </Reveal>
        </div>

        {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
      </div>
    </section>
  );
};

/* ── Chapter 2 · Attraction ─────────────────────────────────── */
export const AttractionSection = ({ payload, section, personA, personB, n, debug }: SectionProps) => {
  const data = adaptAttraction(section, payload);
  const names = { a: personA, b: personB };

  return (
    <WhyYouMeUsSection
      id={section.chapterId}
      n={n}
      eyebrow={section.userQuestion}
      title={section.title}
      data={{ ...data, moment: undefined }}
      names={names}
      locale={payload.locale}
    >
      {/* Former 8.4 moved into Chapter 02: Long-Term Bond (KEEP DOING & RITUAL only) */}
      {payload.storyPlan?.romanticGapBatch?.longTermBond ? (
        <div className="mt-10 pt-8 border-t border-rel-line space-y-4">
          <SubHeading title="오래 단단한 관계를 유지하는 약속" tag="Long-Term Bond" tone="deep" />
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-xl bg-rel-taupe-soft p-4 border border-rel-line">
              <p className="font-semibold text-v4-good mb-1">✅ KEEP DOING</p>
              {payload.storyPlan.romanticGapBatch.longTermBond.keepDoing.map((k, i) => (
                <p key={i} className="text-rel-ink-soft mt-1">• {k}</p>
              ))}
            </div>
            <div className="rounded-xl bg-rel-taupe-soft p-4 border border-rel-line">
              <p className="font-semibold text-rel-deep mb-1">🕯️ RELATIONSHIP RITUAL</p>
              {payload.storyPlan.romanticGapBatch.longTermBond.relationshipRitual.map((r, i) => (
                <p key={i} className="text-rel-ink-soft mt-1">• {r}</p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </WhyYouMeUsSection>
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
      {/* Final Cleanup pass, item 1 — when the engine has confirmed both
          people share one genuine baseline (romanticGapBatch.conflictTransitions.sharedBaseline),
          render it ONCE ahead of Trigger instead of duplicating the same
          line under two separate person cards. When there's no shared
          baseline (either a real per-person difference, or the two people
          simply cleared different underlying patterns), the two-card layout
          below still applies — nothing here forces an artificial split. */}
      {payload.storyPlan?.romanticGapBatch?.conflictTransitions?.sharedBaseline ? (
        <Reveal>
          <div className="rounded-2xl border border-rel-line bg-rel-taupe-soft p-6 shadow-sm sm:p-7">
            <span className="font-rel-sans text-[11px] font-semibold text-rel-deep tracking-wider">공통 평소 상태</span>
            <p className="mt-2 font-rel-sans text-[14px] leading-[1.75] text-rel-ink-soft">
              {payload.storyPlan.romanticGapBatch.conflictTransitions.sharedBaseline}
            </p>
          </div>
        </Reveal>
      ) : null}

      <Reveal>
        <div className="mt-8 rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm sm:p-7">
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

      {payload.storyPlan?.romanticGapBatch?.conflictTransitions && !payload.storyPlan.romanticGapBatch.conflictTransitions.sharedBaseline ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm space-y-4">
            <PersonTag name={personA} side="a" />
            <div className="rounded-xl bg-rel-taupe-soft p-4 border border-rel-line">
              <span className="font-rel-sans text-[11px] font-semibold text-rel-deep tracking-wider">1. 평소의 모습</span>
              <p className="mt-2 text-xs leading-relaxed text-rel-ink-soft">
                {payload.storyPlan.romanticGapBatch.conflictTransitions.transitionA.normalState}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm space-y-4">
            <PersonTag name={personB} side="b" />
            <div className="rounded-xl bg-rel-taupe-soft p-4 border border-rel-line">
              <span className="font-rel-sans text-[11px] font-semibold text-rel-deep tracking-wider">1. 평소의 모습</span>
              <p className="mt-2 text-xs leading-relaxed text-rel-ink-soft">
                {payload.storyPlan.romanticGapBatch.conflictTransitions.transitionB.normalState}
              </p>
            </div>
          </div>
        </div>
      ) : null}

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
  const axes = adaptRadarAxes(payload) as any[]; // Cast to bypass TS excess property checking if strict
  const highlights = adaptRadarHighlights(payload, personA, personB);
  const compare = payload.comparisonTable;

  return (
    <ChapterSection
      id={section.chapterId}
      n={n}
      label={section.userQuestion}
      title={section.title}
    >
      {axes.length > 0 && (
        <div className="mb-14">
          <SubHeading title="심리 축 매칭" tone="coral" tag={`${axes.length} axes`} />
          <div className="mt-6">
            <PsychAxisComparisonSection
              axisResults={axes}
              highlights={highlights}
              chartNote=""
              names={[personA, personB]}
              locale={payload.locale}
            />
          </div>
        </div>
      )}

      {/* 4. Pair Comparison Table */}
      {compare && compare.length > 0 && (
        <div>
          <SubHeading title="나란히 놓고 보기" tag="성향 비교" />
          <ul className="mt-8 space-y-12">
            {compare.map((row, i) => (
              <li key={row.rowId}>
                <Reveal delay={i * 50}>
                  <VersusStrip label={row.relationshipQuestion} aName={personA} bName={personB} a={row.personA} b={row.personB} />
                  <p className="mt-3 font-rel-sans text-[14px] leading-[1.8] text-rel-ink-soft">
                    {row.relationshipManifestation}
                  </p>
                  {row.understandingPoint ? (
                    <Evidence label={payload.locale === "en-US" ? "Note" : "짚어볼 점"}>
                      {row.understandingPoint}
                    </Evidence>
                  ) : null}
                  <div className="mt-10 h-px w-full bg-rel-line" />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Wanted Love vs Given Love */}
      {payload.storyPlan?.romanticGapBatch?.wantedVsGivenLove ? (
        <div className="mt-12 rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm space-y-4">
          <SubHeading title="서로가 원하는 사랑 vs 표현하는 사랑" tag="Love Language" tone="coral" />
          <p className="text-xs text-rel-ink-mute">{payload.storyPlan.romanticGapBatch.wantedVsGivenLove.summary}</p>
          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-rel-line bg-rel-taupe-soft p-4 space-y-2">
              <PersonTag name={personA} side="a" />
              <p className="text-rel-ink font-medium mt-1">받고 싶은 사랑: {payload.storyPlan.romanticGapBatch.wantedVsGivenLove.loveA.wantedLove}</p>
              <p className="text-rel-ink-soft">실제 주는 사랑: {payload.storyPlan.romanticGapBatch.wantedVsGivenLove.loveA.givenLove}</p>
              <p className="text-rel-deep italic">· 파트너 수용 체감: {payload.storyPlan.romanticGapBatch.wantedVsGivenLove.loveA.partnerReception}</p>
            </div>
            <div className="rounded-xl border border-rel-line bg-rel-taupe-soft p-4 space-y-2">
              <PersonTag name={personB} side="b" />
              <p className="text-rel-ink font-medium mt-1">받고 싶은 사랑: {payload.storyPlan.romanticGapBatch.wantedVsGivenLove.loveB.wantedLove}</p>
              <p className="text-rel-ink-soft">실제 주는 사랑: {payload.storyPlan.romanticGapBatch.wantedVsGivenLove.loveB.givenLove}</p>
              <p className="text-rel-deep italic">· 파트너 수용 체감: {payload.storyPlan.romanticGapBatch.wantedVsGivenLove.loveB.partnerReception}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* 5. Physical Intimacy & Tempo */}
      {payload.storyPlan?.romanticGapBatch?.physicalIntimacy ? (
        <div className="mt-12 rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm space-y-4">
          <SubHeading title="피지컬 친밀감 & 스킨십 템포 조율" tag="스킨십 템포" tone="coral" />
          <div className="rounded-xl bg-rel-taupe-soft p-5 border border-rel-line space-y-2 text-xs">
            <p className="font-semibold text-rel-ink text-sm">💋 {payload.storyPlan.romanticGapBatch.physicalIntimacy.summary}</p>
            <p className="text-rel-ink-soft">· {personA}님 템포: {payload.storyPlan.romanticGapBatch.physicalIntimacy.desiredClosenessA}</p>
            <p className="text-rel-ink-soft">· {personB}님 템포: {payload.storyPlan.romanticGapBatch.physicalIntimacy.desiredClosenessB}</p>
            <p className="text-rel-deep italic mt-2">· 공간/경계 필요성: {payload.storyPlan.romanticGapBatch.physicalIntimacy.spaceNeed}</p>
          </div>
        </div>
      ) : null}

      {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
    </ChapterSection>
  );
};
