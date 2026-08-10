"use client";

/**
 * Shared Overview section — golden reference: Friend's "01 한눈에 보기"
 * (components/relationship/friend/editorial/FriendEditorialSections.tsx
 * SignalsSection, as redesigned in the Aug 2026 Overview redesign).
 *
 * Structure: one-line relationship summary -> 3 signal cards (icon+label,
 * score, natural-language grade, one-liner) -> progressive disclosure
 * ("See more") revealing measures/why, with a nested threshold-band toggle.
 *
 * Purely presentational — every score, band, grade label, and evidence
 * string is computed by the calling domain and passed in via
 * `OverviewCardData`. This component owns no scoring/threshold logic, so
 * each domain keeps its own contract intact (Friend/Marriage/Family/Work's
 * own `computeXMasterScores` + `xScoreCardAudit.ts`, Romantic's
 * `computeRelationshipEventScores`/`interpretTopic`).
 */
import type { Locale } from "@/lib/i18n/locale";
import type { OverviewCardData } from "@/lib/relationship/shared/overview/overviewTypes";
import { CircularGauge, Disclosure, Evidence, Quote, Reveal, Section, ec } from "@/components/relationship/shared/editorial/EditorialPrimitives";

export type OverviewSectionProps = {
  id?: string;
  locale: Locale;
  eyebrow: string;
  title: string;
  lead: string;
  heroSummary?: string | null;
  cards: OverviewCardData[];
  /** Optional "shines / struggles" style pair, rendered below the cards (kept generic — label text supplied by caller). */
  extra?: {
    ruleLabel: string;
    items: Array<{ icon: string; heading: string; body: string; tone?: "good" | "neutral" }>;
  } | null;
};

export function OverviewSection({
  id = "overview",
  locale,
  eyebrow,
  title,
  lead,
  heroSummary,
  cards,
  extra,
}: OverviewSectionProps) {
  if (!cards.length) return null;

  return (
    <Section id={id} eyebrow={eyebrow} title={title} lead={lead} tint="cream">
      {heroSummary ? (
        <div className="mb-10">
          <Quote>{heroSummary}</Quote>
        </div>
      ) : null}

      <ul className="grid gap-x-8 gap-y-10 md:grid-cols-3">
        {cards.map((s, i) => {
          const hasDetail = Boolean(s.measures || s.why || s.thresholdText);
          return (
            <li key={s.key}>
              <Reveal delay={i * 70}>
                {/* ① 항목명 */}
                <span className="flex min-w-0 items-center gap-2 font-rel-sans text-[13px] font-semibold tracking-[0.02em] text-rel-ink">
                  <span aria-hidden>{s.icon}</span>
                  {s.label}
                </span>

                {/* ② 원형 게이지 (score/100) */}
                <div className="mt-4 flex justify-center">
                  <CircularGauge value={s.score} tone={s.tone} />
                </div>

                {/* ③ 현재 상태 문구 */}
                <p className="mt-4 text-center font-rel-serif text-[20px] leading-[1.35] text-rel-ink">
                  {s.gradeLabel}
                </p>

                {/* ④ 이 지표가 무엇을 의미하는지 한 줄 설명 */}
                <p className="mt-2 text-center font-rel-sans text-[13.5px] leading-[1.7] text-rel-ink-soft">
                  {s.oneLiner}
                </p>

                {/* ⑤ 점수 읽는 법 — 낮을수록 좋은 지표는 안내 배지로 표시 */}
                {s.inverted ? (
                  <p className="mt-3 text-center">
                    <span className="inline-block rounded-full border border-rel-line px-2 py-0.5 font-rel-sans text-[10px] tracking-[0.06em] text-rel-ink-mute">
                      {ec(locale, "lower is better", "낮을수록 편안해요")}
                    </span>
                  </p>
                ) : null}

                {/* ⑥ 자세히 보기 — 기존 토글/상세 설명 그대로 */}
                {hasDetail ? (
                  <Disclosure label={ec(locale, "See more", "자세히 보기")}>
                    {s.measures ? (
                      <div>
                        <p className="font-rel-sans text-[10px] uppercase tracking-[0.18em] text-rel-ink-mute">
                          {ec(locale, "What does this score measure?", "이 점수는 무엇인가요?")}
                        </p>
                        <p className="mt-1.5 font-rel-sans text-[13px] leading-[1.75] text-rel-ink-soft">
                          {s.measures}
                        </p>
                      </div>
                    ) : null}
                    {s.why ? (
                      <div>
                        <p className="font-rel-sans text-[10px] uppercase tracking-[0.18em] text-rel-ink-mute">
                          {ec(locale, "Why did this come out this way?", "왜 이렇게 나왔나요?")}
                        </p>
                        <p className="mt-1.5 font-rel-sans text-[13px] leading-[1.75] text-rel-ink-soft">{s.why}</p>
                      </div>
                    ) : null}
                    {s.thresholdText ? (
                      <Evidence label={ec(locale, "How to read this score", "점수는 이렇게 읽어요")}>
                        {s.thresholdText}
                      </Evidence>
                    ) : null}
                  </Disclosure>
                ) : null}
              </Reveal>
            </li>
          );
        })}
      </ul>

      {extra && extra.items.length > 0 ? (
        <>
          <div className="my-10 flex items-center gap-4">
            <span className="shrink-0 font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-ink-mute">
              {extra.ruleLabel}
            </span>
            <span className="h-px flex-1 bg-rel-line" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {extra.items.map((item, i) => (
              <Reveal key={item.heading} delay={i * 90}>
                <div
                  className={`h-full rounded-2xl border p-6 ${
                    item.tone === "good"
                      ? "border-v4-good/25 bg-v4-good-soft"
                      : "border-rel-line bg-rel-surface"
                  }`}
                >
                  <h3
                    className={`font-rel-sans text-[13px] font-semibold tracking-[0.04em] ${
                      item.tone === "good" ? "text-v4-good" : "text-rel-ink-soft"
                    }`}
                  >
                    {item.icon} {item.heading}
                  </h3>
                  <p className="mt-4 font-rel-sans text-[13.5px] leading-[1.7] text-rel-ink">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </>
      ) : null}
    </Section>
  );
}
