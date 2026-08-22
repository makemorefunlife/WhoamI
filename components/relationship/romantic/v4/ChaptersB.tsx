"use client";

/**
 * Chapters 6-12, visual language ported from Lovable "Inner Compass Reports" →
 * romantic-v4-concept (ChaptersB.tsx), wired to the real canonical payload via
 * ./adaptCanonicalSection. Chapters 9 (Daily Life) and 11 (Reflection) have no
 * direct Lovable mock (that concept only demonstrated 10 of our 12 canonical
 * chapters) — they reuse the same primitives/visual vocabulary rather than a
 * literal Lovable screen.
 */
import { ArrowRight, Heart, ShieldCheck } from "lucide-react";
import type { RomanticV4PrototypePayload } from "@/lib/relationship/romantic/prototypeV4/types";
import type { CanonicalSection } from "@/lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives";
import { ChapterSection, PersonTag, Reveal, SubHeading } from "./primitives";
import { josa, josaIGa, josaEunNeun, josaGwaWa, josaEulReul, josaEge } from "@/lib/relationship/romantic/prototypeV4/romanticLanguage";
import {
  adaptHiddenHearts,
  adaptTranslatorPanels,
  adaptRepair,
  adaptStrength,
  adaptDailyLife,
  adaptFuture,
  adaptChoice,
} from "./adaptCanonicalSection";

function Panel({
  step,
  body,
  tone = "taupe",
  className = "",
}: {
  step: string;
  body: string;
  tone?: "deep" | "coral" | "taupe";
  className?: string;
}) {
  const t = tone === "deep" ? "text-rel-deep" : "text-rel-taupe";
  return (
    <div className={`px-5 py-5 ${className}`}>
      <div className={`font-rel-sans text-[10px] uppercase tracking-[0.18em] ${t}`}>{step}</div>
      <p className="mt-2 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink-soft">{body}</p>
    </div>
  );
}

export type SectionProps = {
  payload: RomanticV4PrototypePayload;
  section: CanonicalSection;
  personA: string;
  personB: string;
  /** Sequential "01".."08" position among the core numbered chapters, computed once in CanonicalReportView.tsx — omit for chapters outside that sequence. */
  n?: string;
  debug?: boolean;
  /** Only used by RepairSection — Repair + Daily Life are merged into one
   * visual chapter, so Repair needs the Daily Life section's data too. */
  dailyLifeSection?: CanonicalSection;
};

const DebugPanel = ({ evidenceIds = [] }: { evidenceIds?: string[] }) => (
  <div className="mt-8 border-t border-dashed border-rel-taupe/40 pt-4 text-left font-mono text-[11px] text-rel-ink-mute">
    <div className="mb-1 font-semibold">Debug</div>
    {evidenceIds.length > 0 && <div>Evidence: {evidenceIds.join(", ")}</div>}
  </div>
);

/* ── Chapter 6 · Hidden Hearts ────────────────────────────────── */
export const HiddenHeartsSection = ({ section, payload, personA, personB, n, debug }: SectionProps) => {
  const hearts = adaptHiddenHearts(section);
  const panels = adaptTranslatorPanels(payload);
  const names = { a: personA, b: personB };

  return (
    <ChapterSection
      id={section.chapterId}
      n={n}
      label={section.userQuestion}
      title={section.title}
    >
      {panels.length > 0 && (
        <div className="mb-16">
          <SubHeading title="오해 번역기" tone="coral" tag="Translator" />
          <div className="mt-6 space-y-5">
            {panels.map((p, i) => (
              <Reveal key={`${p.observer}-${i}`} delay={i * 70}>
                <div className="overflow-hidden rounded-2xl border border-rel-line bg-rel-surface shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 border-b border-rel-line bg-rel-taupe-soft/50 px-5 py-3">
                    <PersonTag name={names[p.observer]} side={p.observer} />
                    <span className="font-rel-sans text-[11.5px] tracking-[0.08em] text-rel-ink-mute">
                      가 겪은 행동
                    </span>
                  </div>
                  <div className="grid gap-0 sm:grid-cols-3">
                    <Panel step="장면" body={p.what} />
                    <Panel
                      step="이렇게 읽힙니다"
                      body={p.easyReading}
                      tone="coral"
                      className="border-t border-rel-line sm:border-l sm:border-t-0"
                    />
                    <Panel
                      step="사실은"
                      body={p.actualMeaning}
                      tone="deep"
                      className="border-t border-rel-line sm:border-l sm:border-t-0"
                    />
                  </div>
                  {p.betterExpression && (
                    <div className="border-t border-rel-line bg-rel-deep-soft px-5 py-4">
                      <div className="font-rel-sans text-[10px] uppercase tracking-[0.18em] text-rel-deep">
                        이렇게 말해보면 좋아요
                      </div>
                      <p className="mt-1.5 font-rel-serif text-[14.5px] leading-[1.75] text-rel-ink">
                        {p.betterExpression}
                      </p>
                    </div>
                  )}
                  {p.helpfulResponse && (
                    <div className="flex flex-wrap items-start gap-2 border-t border-rel-line px-5 py-3.5">
                      <PersonTag name={names[p.other]} side={p.other} />
                      <span className="min-w-0 font-rel-sans text-[13px] leading-[1.6] text-rel-ink-soft">
                        {p.helpfulResponse}
                      </span>
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}



      <SubHeading title="숨은 마음" tag="Hidden hearts" />
      <div className="mt-10 space-y-16">
        {hearts.map((h) => {
          const other = h.person === "a" ? "b" : "a";
          return (
            <Reveal key={h.person}>
              <article className="grid gap-8 md:grid-cols-[minmax(0,180px)_minmax(0,1fr)] md:items-start">
                <div>
                  <PersonTag name={names[h.person]} side={h.person} />
                </div>

                <div className="min-w-0 space-y-7">
                  <div>
                    <div className="font-rel-sans text-[10px] uppercase tracking-[0.2em] text-rel-taupe">
                      바라는 것
                    </div>
                    <p className="mt-2 font-rel-serif text-[23px] leading-[1.45] tracking-[-0.01em] text-rel-ink sm:text-[27px]">
                      {h.need}
                    </p>
                  </div>

                  <div className="border-l border-rel-taupe/50 pl-5">
                    <div className="font-rel-sans text-[10px] uppercase tracking-[0.2em] text-rel-taupe">
                      두려운 것
                    </div>
                    <p className="mt-2 font-rel-serif text-[18px] leading-[1.6] text-rel-ink sm:text-[19px]">
                      {h.fear}
                    </p>
                  </div>

                  <div>
                    <div className="font-rel-sans text-[10px] uppercase tracking-[0.18em] text-rel-ink-mute">
                      그래서 하는 행동
                    </div>
                    <p className="mt-2 font-rel-sans text-[14px] leading-[1.8] text-rel-ink-soft">
                      {h.defense}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-rel-deep-soft px-6 py-5">
                    <div className="font-rel-sans text-[10px] uppercase tracking-[0.18em] text-rel-deep">
                      알아봐 주면 좋은 것
                    </div>
                    <p className="mt-2 flex items-start gap-2.5 font-rel-serif text-[17px] leading-[1.65] text-rel-ink">
                      <Heart className="mt-1 h-4 w-4 shrink-0 text-rel-taupe" strokeWidth={1.5} />
                      <span className="min-w-0">{h.recognition}</span>
                    </p>
                    <p className="mt-3 font-rel-sans text-[11.5px] tracking-[0.06em] text-rel-ink-mute">
                      — {names[other]}가 알아봐 줄 수 있는 것
                    </p>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      {/* Former 8.2 moved into Chapter 05: When Needed Most */}
      {payload.storyPlan?.romanticGapBatch?.whenWeNeedEachOtherMost ? (
        <div className="mt-16 rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm space-y-4">
          <SubHeading title="서로를 가장 절실히 필요로 하는 구체적 순간들" tag="When Needed Most" tone="deep" />
          <div className="grid gap-6 md:grid-cols-2 text-xs">
            <div className="rounded-xl border border-rel-line bg-rel-taupe-soft p-5 space-y-2">
              <PersonTag name={personA} side="a" />
              <p className="font-semibold text-rel-ink mt-1">💡 {josaIGa(personA)} {josaEulReul(personB)} 필요로 할 때:</p>
              {payload.storyPlan.romanticGapBatch.whenWeNeedEachOtherMost.whenANeedsB.map((item, i) => (
                <div key={i} className="space-y-1">
                  <p className="font-medium text-rel-deep">· {item.sceneTitle}</p>
                  <p className="text-rel-ink-soft">{item.concreteContext}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-rel-line bg-rel-taupe-soft p-5 space-y-2">
              <PersonTag name={personB} side="b" />
              <p className="font-semibold text-rel-ink mt-1">💡 {josaIGa(personB)} {josaEulReul(personA)} 필요로 할 때:</p>
              {payload.storyPlan.romanticGapBatch.whenWeNeedEachOtherMost.whenBNeedsA.map((item, i) => (
                <div key={i} className="space-y-1">
                  <p className="font-medium text-rel-deep">· {item.sceneTitle}</p>
                  <p className="text-rel-ink-soft">{item.concreteContext}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
    </ChapterSection>
  );
};

/* ── Chapter 6 · Repair Guide ─────────────────────────────────── */
export const RepairSection = ({ section, payload, personA, personB, n, dailyLifeSection, debug }: SectionProps) => {
  const { steps, helps } = adaptRepair(section);
  const dailyCards = dailyLifeSection ? adaptDailyLife(dailyLifeSection) : [];
  const names = { a: personA, b: personB };

  return (
    <ChapterSection
      id={section.chapterId}
      n={n}
      label={section.userQuestion}
      title={section.title}
      tint="cream"
    >
      {/* 1. 각자에게 도움이 되는 것 (What Helps) */}
      {helps.length > 0 && (
        <div>
          <SubHeading title="각자에게 도움이 되는 것" tag="What helps" />
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {helps.map((h, i) => (
              <Reveal key={h.person} delay={i * 70}>
                <article className="h-full rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm">
                  <PersonTag name={names[h.person]} side={h.person} />
                  <ul className="mt-5 space-y-4">
                    {h.tips.map((tip) => (
                      <li key={tip} className="flex items-start gap-3">
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                            h.person === "a" ? "bg-v4-a" : "bg-v4-b"
                          }`}
                          aria-hidden
                        />
                        <span className="min-w-0 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink-soft">
                          {tip}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {/* 2. 싸웠을 때 즉시 꺼내 쓰는 SOS (Emergency SOS) */}
      {payload.storyPlan?.romanticGapBatch?.emergencySos ? (
        <div className="mt-14 rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm space-y-6">
          <SubHeading title="싸웠을 때 즉시 꺼내 쓰는 3단계 SOS 응급 대화 대본" tag="Emergency SOS" tone="coral" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-rel-line bg-rel-taupe-soft p-5 space-y-3">
              <div className="flex items-center gap-2">
                <PersonTag name={personA} side="a" />
                <span className="text-xs text-rel-ink-mute">→ {personB}에게 말할 때</span>
              </div>
              <p className="text-xs text-v4-bad font-medium">⚠️ 트리거: {payload.storyPlan.romanticGapBatch.emergencySos.sosAtoB.trigger}</p>
              <p className="text-xs text-rel-ink-soft">❌ 하지 말 것: {payload.storyPlan.romanticGapBatch.emergencySos.sosAtoB.doNot}</p>
              <div className="space-y-1.5 pt-2 text-xs border-t border-rel-line">
                <p className="font-semibold text-rel-deep">1단계 (첫 문장): {payload.storyPlan.romanticGapBatch.emergencySos.sosAtoB.firstLine}</p>
                <p className="font-semibold text-rel-ink">2단계 (징검다리): {payload.storyPlan.romanticGapBatch.emergencySos.sosAtoB.bridgeLine}</p>
                <p className="font-semibold text-v4-good">3단계 (재접속): {payload.storyPlan.romanticGapBatch.emergencySos.sosAtoB.reconnectionLine}</p>
              </div>
            </div>
            <div className="rounded-xl border border-rel-line bg-rel-taupe-soft p-5 space-y-3">
              <div className="flex items-center gap-2">
                <PersonTag name={personB} side="b" />
                <span className="text-xs text-rel-ink-mute">→ {personA}에게 말할 때</span>
              </div>
              <p className="text-xs text-v4-bad font-medium">⚠️ 트리거: {payload.storyPlan.romanticGapBatch.emergencySos.sosBtoA.trigger}</p>
              <p className="text-xs text-rel-ink-soft">❌ 하지 말 것: {payload.storyPlan.romanticGapBatch.emergencySos.sosBtoA.doNot}</p>
              <div className="space-y-1.5 pt-2 text-xs border-t border-rel-line">
                <p className="font-semibold text-rel-deep">1단계 (첫 문장): {payload.storyPlan.romanticGapBatch.emergencySos.sosBtoA.firstLine}</p>
                <p className="font-semibold text-rel-ink">2단계 (징검다리): {payload.storyPlan.romanticGapBatch.emergencySos.sosBtoA.bridgeLine}</p>
                <p className="font-semibold text-v4-good">3단계 (재접속): {payload.storyPlan.romanticGapBatch.emergencySos.sosBtoA.reconnectionLine}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 3. 현실에서 마주하는 장면들 (Real Life) */}
      {dailyCards.length > 0 && (
        <div className="mt-14">
          <SubHeading title="현실에서 마주하는 장면들" tag="Real life" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {dailyCards.map((c, i) => (
              <Reveal key={c.title} delay={i * 50}>
                <div className="h-full rounded-xl border-l-2 border-l-rel-taupe bg-rel-surface px-5 py-5 shadow-sm">
                  <h4 className="font-rel-sans text-[13.5px] font-semibold text-rel-ink">{c.title}</h4>
                  {c.difference && (
                    <p className="mt-3 font-rel-sans text-[13px] leading-[1.75] text-rel-ink-soft">
                      <span className="font-semibold text-rel-taupe">차이 · </span>
                      {c.difference}
                    </p>
                  )}
                  {c.agreement && (
                    <p className="mt-2 font-rel-sans text-[13px] leading-[1.75] text-rel-ink-soft">
                      <span className="font-semibold text-rel-deep">합의 · </span>
                      {c.agreement}
                    </p>
                  )}
                  {c.usableLine && (
                    <p className="mt-3 rounded-lg bg-rel-taupe-soft px-3 py-2 font-rel-serif text-[13.5px] leading-[1.7] text-rel-ink">
                      “{c.usableLine}”
                    </p>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}

      {/* 4. 회복 순서 (Sequence) */}
      {steps.length > 0 && (
        <div className="mt-14">
          <SubHeading title="회복 순서" tone="coral" tag="Sequence" />
          <ol className="mt-6 space-y-0">
            {steps.map((s, i) => (
              <Reveal key={s.step} delay={i * 60}>
                <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-5">
                  <div className="flex flex-col items-center">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-rel-deep bg-rel-surface font-rel-sans text-[11.5px] font-semibold text-rel-deep">
                      {s.step}
                    </span>
                    {i < steps.length - 1 && (
                      <span className="my-1 w-px flex-1 bg-rel-deep/25" aria-hidden />
                    )}
                  </div>
                  <div className={i < steps.length - 1 ? "pb-8" : ""}>
                    <h4 className="font-rel-serif text-[18px] leading-[1.4] text-rel-ink">{s.title}</h4>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      )}
      {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
    </ChapterSection>
  );
};

/* ── Chapter 7 · What Not to Expect (Former 8.3) ───────────── */
export const ExpectationsSection = ({ section, payload, personA, personB, n, debug }: SectionProps) => {
  const data = payload.storyPlan?.romanticGapBatch?.whatNotToExpect;
  const isEn = payload.locale === "en-US";

  const listA = data?.notToExpectAFromB ?? [
    { title: isEn ? "Instant Pacing Match" : "즉각적인 반응 속도 동기화", reason: isEn ? "Each person processes feelings at their own pace." : "각자의 감정 처리 템포를 인정하고 기다려주는 시간이 필요합니다." }
  ];
  const listB = data?.notToExpectBFromA ?? [
    { title: isEn ? "Perfect Emotional Symmetry" : "완벽한 감정적 대칭성", reason: isEn ? "Different communication styles require space for differences." : "서로 다른 표현 방식의 차이를 인정할 때 관계가 원만해집니다." }
  ];

  return (
    <ChapterSection
      id={section.chapterId}
      n={n}
      label={section.userQuestion || (isEn ? "Areas to leave open" : "서로를 위해 비워두어야 할 영역")}
      title={section.title || (isEn ? "What Not to Expect" : "서로에게 내려놓아야 할 기대")}
      tint="cream"
    >
      <div className="rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm space-y-4">
        <SubHeading title={isEn ? "Overextending expectations can strain the relationship" : "서로에게 이것까지 요구하면 관계가 힘들어집니다"} tag="What Not to Expect" tone="coral" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-rel-line bg-rel-taupe-soft p-5 space-y-2">
            <PersonTag name={personA} side="a" />
            <p className="text-xs font-semibold text-rel-ink mt-1">❌ {josaIGa(personA)} {josaEge(personB)} 내려놓아야 할 기대:</p>
            <ul className="list-disc pl-4 text-xs text-rel-ink-soft space-y-1">
              {listA.map((item, i) => (
                <li key={i}><strong>{item.title}</strong>: {item.reason}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-rel-line bg-rel-taupe-soft p-5 space-y-2">
            <PersonTag name={personB} side="b" />
            <p className="text-xs font-semibold text-rel-ink mt-1">❌ {josaIGa(personB)} {josaEge(personA)} 내려놓아야 할 기대:</p>
            <ul className="list-disc pl-4 text-xs text-rel-ink-soft space-y-1">
              {listB.map((item, i) => (
                <li key={i}><strong>{item.title}</strong>: {item.reason}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
    </ChapterSection>
  );
};

/* ── Chapter 8 · Strength & Vulnerability ─────────────────────── */
export const StrengthVulnerabilitySection = ({ section, payload, personA, personB, n, debug }: SectionProps) => {
  const { gives, sharedStrength, sharedVulnerability } = adaptStrength(section, payload);
  const names = { a: personA, b: personB };

  return (
    <ChapterSection
      id={section.chapterId}
      n={n}
      label={section.userQuestion}
      title={section.title}
      tint="cream"
    >
      {/* Mutual Growth & Synergy (Moved from Chapter 05 into Chapter 08 per User Request #4) */}
      {payload.storyPlan?.romanticGapBatch?.chapter06 ? (
        <div className="mb-8 rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm space-y-4">
          <SubHeading title="서로에게서 배우는 점 및 관계 시너지" tag="Synergy & Learning" tone="deep" />
          <div className="rounded-xl bg-rel-taupe-soft/50 p-5 border border-rel-line text-xs text-rel-ink-soft space-y-2.5">
            {payload.storyPlan.romanticGapBatch.chapter06.roleMatrix.complement ? (
              <p><span className="font-semibold text-rel-deep">✨ 시너지 · </span>{payload.storyPlan.romanticGapBatch.chapter06.roleMatrix.complement}</p>
            ) : null}
            {payload.storyPlan.romanticGapBatch.chapter06.growth.aLearnsFromB ? (
              <p><span className="font-semibold text-amber-600">🌱 배우는 점 ({personA}) · </span>{payload.storyPlan.romanticGapBatch.chapter06.growth.aLearnsFromB}</p>
            ) : null}
            {payload.storyPlan.romanticGapBatch.chapter06.growth.bLearnsFromA ? (
              <p><span className="font-semibold text-amber-600">🌱 배우는 점 ({personB}) · </span>{payload.storyPlan.romanticGapBatch.chapter06.growth.bLearnsFromA}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {gives.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {gives.map((g, i) => (
            <Reveal key={`${g.from}-${g.to}`} delay={i * 80}>
              <article className="h-full rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <PersonTag name={names[g.from]} side={g.from} />
                  <ArrowRight className="h-3.5 w-3.5 text-rel-ink-mute" strokeWidth={1.5} />
                  <PersonTag name={names[g.to]} side={g.to} />
                </div>
                <p className="mt-4 font-rel-sans text-[14.5px] leading-[1.85] text-rel-ink-soft">
                  {g.body}
                </p>
                {g.signals.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-rel-line pt-4">
                    {g.signals.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-rel-line bg-rel-taupe-soft px-3 py-1 font-rel-sans text-[12px] text-rel-ink-soft"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {g.shadow && (
                  <p className="mt-4 rounded-xl border border-v4-bad/30 bg-v4-bad-soft px-4 py-3 font-rel-sans text-[13px] leading-[1.7] text-rel-ink">
                    <span className="font-semibold text-v4-bad">과해질 때 </span>
                    {g.shadow}
                  </p>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      )}

      {sharedStrength.body && (
        <Reveal>
          <div className="mt-8 rounded-2xl border border-rel-deep/25 bg-rel-surface p-7 shadow-sm sm:p-9">
            <div className="flex items-center gap-2 font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-deep">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
              Shared strength
            </div>
            <h3 className="mt-3 font-rel-serif text-[22px] leading-[1.3] tracking-[-0.01em] text-rel-ink sm:text-[26px]">
              {sharedStrength.title}
            </h3>
            <p className="mt-4 max-w-[62ch] font-rel-sans text-[15px] leading-[1.9] text-rel-ink-soft">
              {sharedStrength.body}
            </p>
          </div>
        </Reveal>
      )}

      {sharedVulnerability.body && (
        <Reveal>
          <div className="mt-6 rounded-2xl bg-rel-deep p-7 sm:p-9">
            <SubHeading title={sharedVulnerability.title} invert tag="Vulnerability" />
            <p className="mt-5 max-w-[62ch] font-rel-sans text-[15px] leading-[1.9] text-white/80">
              {sharedVulnerability.body}
            </p>
          </div>
        </Reveal>
      )}
      {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
    </ChapterSection>
  );
};

/* ── Chapter 8 · Future & Timing ──────────────────────────────── */
export const FutureTimingSection = ({ section, n, debug }: SectionProps) => {
  const cards = adaptFuture(section);
  return (
    <ChapterSection
      id={section.chapterId}
      n={n}
      label={section.userQuestion}
      title={section.title}
    >
      <div className="relative">
        <span
          className="absolute left-[7px] top-2 hidden h-[calc(100%-1rem)] w-px bg-rel-deep/20 sm:block"
          aria-hidden
        />
        <div className="space-y-8">
          {cards.map((c, i) => (
            <Reveal key={c.title} delay={i * 70}>
              <div className="grid gap-4 sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)] sm:gap-7">
                <div className="flex items-center gap-3 sm:block">
                  <span
                    className="hidden h-4 w-4 rounded-full border-2 border-rel-deep bg-rel-bg sm:block"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 rounded-2xl border border-rel-line bg-rel-surface p-6 shadow-sm sm:p-7">
                  <div className="font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-deep">
                    {c.title}
                  </div>
                  <p className="mt-3 max-w-[60ch] font-rel-serif text-[17px] leading-[1.7] text-rel-ink">
                    {c.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <Reveal>
        <p className="mt-10 max-w-[62ch] font-rel-sans text-[12.5px] leading-[1.8] text-rel-ink-mute">
          이 장은 정해진 미래를 말하지 않습니다. 지금의 흐름에서 두 사람이 선택할 수 있는 방향을 보여줄 뿐입니다.
        </p>
      </Reveal>
      {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
    </ChapterSection>
  );
};

/* ── Chapter 09 · Choice ──────────────────────────────────────── */
export const ChoiceSection = ({ section, payload, personA, personB, n, debug }: SectionProps) => {
  const { possibility, remember, watchSignals, improvingSignals, cautionSignals } = adaptChoice(
    section,
    payload,
  );
  const names = { a: personA, b: personB };

  return (
    <ChapterSection
      id={section.chapterId}
      n={n}
      label={section.userQuestion}
      title={section.title}
      tint="cream"
    >
      {possibility && (
        <Reveal>
          <p className="mx-auto max-w-[54ch] text-center font-rel-serif text-[21px] italic leading-[1.7] text-rel-ink sm:text-[24px]">
            “{possibility}”
          </p>
        </Reveal>
      )}

      {remember.length > 0 && (
        <Reveal>
          <div className="mt-14 space-y-4">
            <SubHeading title="기억할 문장" tone="coral" tag="Remember" />
            {remember.map((r) => (
              <div
                key={r.person}
                className="rounded-2xl border-l-2 border-l-rel-taupe bg-rel-surface px-6 py-5 shadow-sm"
              >
                <PersonTag name={names[r.person]} side={r.person} />
                <p className="mt-3 font-rel-serif text-[17.5px] leading-[1.75] text-rel-ink sm:text-[19px]">
                  {r.line}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {(watchSignals.length > 0 || improvingSignals.length > 0 || cautionSignals.length > 0) && (
        <Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {watchSignals.length > 0 && (
              <div className="rounded-xl border border-rel-line bg-rel-surface px-4 py-4">
                <div className="font-rel-sans text-[10px] uppercase tracking-[0.16em] text-rel-ink-mute">
                  지켜볼 것
                </div>
                <ul className="mt-2 space-y-1.5">
                  {watchSignals.map((s) => (
                    <li key={s} className="font-rel-sans text-[12.5px] leading-[1.6] text-rel-ink-soft">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {improvingSignals.length > 0 && (
              <div className="rounded-xl border border-v4-good/30 bg-v4-good-soft px-4 py-4">
                <div className="font-rel-sans text-[10px] uppercase tracking-[0.16em] text-v4-good">
                  나아지고 있다는 신호
                </div>
                <ul className="mt-2 space-y-1.5">
                  {improvingSignals.map((s) => (
                    <li key={s} className="font-rel-sans text-[12.5px] leading-[1.6] text-rel-ink-soft">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {cautionSignals.length > 0 && (
              <div className="rounded-xl border border-v4-bad/30 bg-v4-bad-soft px-4 py-4">
                <div className="font-rel-sans text-[10px] uppercase tracking-[0.16em] text-v4-bad">
                  주의가 필요한 신호
                </div>
                <ul className="mt-2 space-y-1.5">
                  {cautionSignals.map((s) => (
                    <li key={s} className="font-rel-sans text-[12.5px] leading-[1.6] text-rel-ink-soft">
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Reveal>
      )}

      <p className="mt-14 border-t border-rel-line pt-6 font-rel-sans text-[12px] leading-[1.85] text-rel-ink-mute">
        이 리포트는 두 사람을 이해하기 위한 참고 자료이며, 관계에 대한 단정적 결론이 아닙니다. 해석은 참고로만
        활용해 주세요.
      </p>
      {debug && <DebugPanel evidenceIds={section.primaryEvidenceIds} />}
    </ChapterSection>
  );
};
