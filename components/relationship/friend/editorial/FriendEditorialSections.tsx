"use client";

/**
 * Friend Premium — editorial report sections.
 *
 * Structural + visual port of the Lovable "Inner Compass Reports" concept
 * (/friend-concept, src/components/report/friend/FriendSections.tsx), wired
 * to the real `FriendReportViewModel` (lib/relationship/friend/viewModel)
 * instead of the concept's frozen mock payload. Every field read here comes
 * from an existing ViewModel section — nothing is invented, and a section
 * degrades gracefully (omits the block) when its source field is absent,
 * matching this codebase's "no placeholder data" convention.
 *
 * `play_money` is intentionally not rendered — it was removed from Friend
 * `current_enriched` in an earlier cleanup pass (see
 * docs/dev/FRIEND_FINAL_CONTENT_GAP_REVIEW.md §9) and is effectively always
 * absent in production payloads.
 *
 * The `deep_read` overlay (meta.friend_saju_deep) is not rendered as its own
 * card either — it has no standalone section here. Its four pieces are woven
 * into the sections they thematically belong to instead: person voice ->
 * SocialDnaSection, gap signal -> DimensionsSection, advice/together ->
 * ManualSection. See findSection(vm, "deep_read") in each.
 */
import type { Locale } from "@/lib/i18n/locale";
import { pick } from "@/lib/relationship/friend/friendCopy";
import { useMessages } from "@/lib/i18n/LocaleProvider";
import type {
  FriendReportViewModel,
  BreakupGuideSection as BreakupGuideSectionVM,
  CompareTableSection as CompareTableSectionVM,
  DeEscalationSection as DeEscalationSectionVM,
  DeepReadSection as DeepReadSectionVM,
  HiddenFlowSection as HiddenFlowSectionVM,
  PrescriptionSection as PrescriptionSectionVM,
  PsychRadarSection as PsychRadarSectionVM,
  SnapshotSection as SnapshotSectionVM,
  SocialDnaSection as SocialDnaSectionVM,
  SoulmateSection as SoulmateSectionVM,
} from "@/lib/relationship/friend/viewModel/friendReportSectionTypes";
import {
  Evidence,
  NameChip,
  Quote,
  Reveal,
  Rule,
  Section,
  VersusStrip,
} from "@/components/relationship/shared/editorial/EditorialPrimitives";
import { OverviewSection } from "@/components/relationship/shared/overview/OverviewSection";
import type { OverviewCardData } from "@/lib/relationship/shared/overview/overviewTypes";
import { PsychAxisComparisonSection } from "@/components/relationship/shared/psychAxis/PsychAxisComparisonSection";
import { WhyYouMeUsSection as SharedWhyYouMeUsSection } from "@/components/relationship/shared/whyYouMeUs/WhyYouMeUsSection";
import type { WhyYouMeUsSection as WhyYouMeUsSectionVM } from "@/lib/relationship/friend/viewModel/friendReportSectionTypes";

type Ctx = {
  vm: FriendReportViewModel;
  viewerIsReportA: boolean;
  locale: Locale;
};

function findSection<T extends FriendReportViewModel["sections"][number]["type"]>(
  vm: FriendReportViewModel,
  type: T,
): Extract<FriendReportViewModel["sections"][number], { type: T }> | undefined {
  return vm.sections.find((s): s is Extract<FriendReportViewModel["sections"][number], { type: T }> => s.type === type);
}

/* ---------------------------------- 00 hero --------------------------------- */

export function FriendHero({ vm, locale }: Ctx) {
  const [nameA, nameB] = vm.opening.names;
  return (
    <header className="relative overflow-hidden">
      <div className="mx-auto w-full max-w-[820px] px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <Reveal>
          <p className="font-rel-sans text-[10px] uppercase tracking-[0.3em] text-rel-deep">
            {pick(locale, "Aha! It's me! · Friend Report", "Aha! It's me! · 친구 관계 리포트")}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <NameChip name={nameA} side="a" />
            <span aria-hidden className="font-rel-serif text-[15px] text-rel-ink-mute">
              ×
            </span>
            <NameChip name={nameB} side="b" />
          </div>
          <h1 className="mt-6 max-w-[22ch] font-rel-serif text-[32px] leading-[1.22] tracking-[-0.02em] text-rel-ink sm:text-[46px]">
            {vm.opening.headline}
          </h1>
        </Reveal>
      </div>
    </header>
  );
}

/* -------------------------- 01 three core signals --------------------------- */

type SignalKey = "connection" | "banter" | "risk";
type SignalBand = "high" | "mid" | "low";

/**
 * Presentation-only banding — mirrors the exact cutoffs already documented in
 * lib/relationship/enrichment/friendScoreCardAudit.ts's connectionLevelMeaning
 * (70/40) / banterLevelMeaning (65/35) / riskLevelMeaning (30/60, inverted).
 * Do not drift these numbers from that source of truth; this function only
 * turns the same bands into a UI tone + short natural-language grade.
 */
function signalBand(key: SignalKey, score: number): SignalBand {
  if (key === "connection") return score >= 70 ? "high" : score >= 40 ? "mid" : "low";
  if (key === "banter") return score >= 65 ? "high" : score >= 35 ? "mid" : "low";
  return score >= 60 ? "high" : score >= 30 ? "mid" : "low"; // risk: high band = high risk
}

function signalTone(key: SignalKey, band: SignalBand): "good" | "neutral" | "warn" {
  if (band === "mid") return "neutral";
  const inverted = key === "risk";
  if (band === "high") return inverted ? "warn" : "good";
  return inverted ? "good" : "warn";
}

const SIGNAL_GRADE_COPY: Record<SignalKey, Record<SignalBand, [en: string, ko: string]>> = {
  connection: {
    high: ["Clicks easily", "잘 통하는 편"],
    mid: ["Comfortable & steady", "무난하게 편안한 편"],
    low: ["Warms up over time", "천천히 가까워지는 사이"],
  },
  banter: {
    high: ["Banter flows easily", "티키타카가 잘 맞는 편"],
    mid: ["Comfortable back-and-forth", "편안한 대화"],
    low: ["Calm, easygoing conversation", "잔잔하게 흐르는 대화"],
  },
  risk: {
    high: ["Clear friction points", "갈등 포인트 뚜렷"],
    mid: ["Occasional friction", "가끔 주의"],
    low: ["Rarely clashes", "마찰이 적은 편"],
  },
};

const SIGNAL_ONE_LINER_COPY: Record<SignalKey, [en: string, ko: string]> = {
  connection: ["How naturally at ease you feel around each other", "애쓰지 않아도 서로 편안하게 끌리는 정도"],
  banter: ["How naturally the back-and-forth flows", "말과 리액션이 자연스럽게 오가는 정도"],
  risk: ["How likely friction is to come up", "친구 사이에 마찰이 생길 가능성"],
};

export function SignalsSection({ vm, locale }: Ctx) {
  const snap = findSection(vm, "snapshot") as SnapshotSectionVM | undefined;
  const t = useMessages().relationshipDrilldown.friendship;
  if (!snap) return null;
  const audit = snap.scoreCardAudit;

  const raw = [
    {
      key: "connection" as const,
      icon: "🔥",
      label: t.scoreLabelChemistry,
      score: snap.scores.connectionPct,
      inverted: false,
      status: audit?.connection.level_meaning,
      definition: audit?.connection.measures,
      why: audit?.connection.why ?? snap.vibeAxisNotes?.connectionNote,
    },
    {
      key: "banter" as const,
      icon: "🧩",
      label: t.scoreLabelBanter,
      score: snap.scores.banterPct,
      inverted: false,
      status: audit?.banter.level_meaning,
      definition: audit?.banter.measures,
      why: audit?.banter.why ?? snap.vibeAxisNotes?.banterNote,
    },
    {
      key: "risk" as const,
      icon: "⚡",
      label: t.scoreLabelRisk,
      score: snap.scores.riskPct,
      inverted: true,
      status: audit?.risk.level_meaning,
      definition: audit?.risk.measures,
      why: audit?.risk.why ?? snap.vibeAxisNotes?.riskNote,
    },
  ];

  const cards: OverviewCardData[] = raw.map((s) => {
    const band = signalBand(s.key, s.score);
    const [gradeEn, gradeKo] = SIGNAL_GRADE_COPY[s.key][band];
    const [oneLinerEn, oneLinerKo] = SIGNAL_ONE_LINER_COPY[s.key];
    return {
      key: s.key,
      icon: s.icon,
      label: s.label,
      score: s.score,
      inverted: s.inverted,
      tone: signalTone(s.key, band),
      gradeLabel: pick(locale, gradeEn, gradeKo),
      oneLiner: pick(locale, oneLinerEn, oneLinerKo),
      measures: s.definition,
      why: s.why,
      thresholdText: s.status,
    };
  });

  const extra =
    snap.shineWhenBest || snap.shineWhenLow
      ? {
          ruleLabel: pick(locale, "Shines / Struggles", "빛나는 순간 / 조심할 순간"),
          items: [
            snap.shineWhenBest
              ? {
                  icon: "☀️",
                  heading: pick(locale, "When this friendship shines", "이 우정이 빛나는 순간"),
                  body: snap.shineWhenBest,
                  tone: "good" as const,
                }
              : null,
            snap.shineWhenLow
              ? {
                  icon: "🌧️",
                  heading: pick(locale, "When this friendship struggles", "이 우정이 조심해야 하는 순간"),
                  body: snap.shineWhenLow,
                }
              : null,
          ].filter((x): x is NonNullable<typeof x> => x != null),
        }
      : null;

  return (
    <OverviewSection
      id="overview"
      locale={locale}
      eyebrow={pick(locale, "01 · At a Glance", "01 · 한눈에 보기")}
      title={pick(locale, "What kind of friends are we?", "우리는 어떤 친구일까")}
      lead={pick(
        locale,
        "Three signals frame the shape of this friendship first. The numbers are just evidence — the reading is the point.",
        "세 가지 신호로 이 우정의 성격을 먼저 봅니다. 숫자는 근거일 뿐, 해석이 본문이에요.",
      )}
      heroSummary={vm.opening.subtitle}
      cards={cards}
      extra={extra}
    />
  );
}

/* ------------------- 01b why you / why me / why us -------------------- */

export function WhyYouMeUsChapter({ vm, locale }: Ctx) {
  const section = findSection(vm, "why_you_me_us") as WhyYouMeUsSectionVM | undefined;
  if (!section) return null;
  const [nameA, nameB] = vm.opening.names;
  return (
    <SharedWhyYouMeUsSection
      id="why_you_me_us"
      eyebrow={pick(locale, "Why us", "서로를 선택한 이유")}
      title={section.title}
      data={section.data}
      names={{ a: nameA, b: nameB }}
      locale={locale}
    />
  );
}

/* ----------------------- 02 part 1 · 입체 진단 + 11축 ----------------------- */

export function DimensionsSection({ vm, viewerIsReportA, locale }: Ctx) {
  const compare = findSection(vm, "compare_table") as CompareTableSectionVM | undefined;
  const radar = findSection(vm, "psych_radar") as PsychRadarSectionVM | undefined;
  const deepRead = findSection(vm, "deep_read") as DeepReadSectionVM | undefined;
  if (!compare && !radar) return null;
  const [nameA, nameB] = vm.opening.names;
  const gap = deepRead?.vm.gapSignal;

  return (
    <Section
      id="part1"
      eyebrow={pick(locale, "02 · Part 1", "02 · Part 1")}
      title={pick(locale, "Our friendship in the round", "우리 우정 입체 진단")}
      lead={pick(
        locale,
        "Six places where you differ, and the everyday scenes those differences create.",
        "여섯 가지 지점에서 두 사람이 어떻게 다른지, 그 차이가 실제 생활에서 어떤 장면을 만드는지 봅니다.",
      )}
    >
      {radar ? (
        <div className="mb-12">
          <PsychAxisComparisonSection
            axisResults={radar.axisResults}
            highlights={radar.highlights}
            chartNote={radar.chartNote}
            names={[nameA, nameB]}
            locale={locale}
          />
        </div>
      ) : null}

      {compare ? (
        <ul className="space-y-12">
          {compare.rows.map((row, i) => {
            const me = viewerIsReportA ? row.personA : row.personB;
            const partner = viewerIsReportA ? row.personB : row.personA;
            return (
              <li key={row.id}>
                <Reveal delay={i * 50}>
                  <VersusStrip label={row.label} aName={nameA} bName={nameB} a={me.shortLabel} b={partner.shortLabel} />
                  <p className="mt-3 font-rel-sans text-[14px] leading-[1.8] text-rel-ink-soft">{row.meaning}</p>
                  {row.psych_note ? (
                    <Evidence label={pick(locale, "11-axis corroboration", "11축 확인 문구")}>{row.psych_note}</Evidence>
                  ) : null}
                  <div className="mt-8 h-px w-full bg-rel-line" />
                </Reveal>
              </li>
            );
          })}
        </ul>
      ) : null}

      {gap && (gap.matchNote || gap.meBody || gap.partnerBody) ? (
        <>
          <Rule label={pick(locale, "Where instincts diverge", "결이 갈리는 지점")} />
          <Reveal>
            <div className="space-y-4">
              {gap.matchNote ? (
                <p className="font-rel-sans text-[14px] leading-[1.85] text-rel-ink">{gap.matchNote}</p>
              ) : null}
              {gap.meBody || gap.partnerBody ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {gap.meBody ? (
                    <div>
                      <span className="block font-rel-sans text-[10.5px] font-semibold tracking-[0.08em] text-v4-a">
                        {nameA}
                      </span>
                      <p className="mt-1.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink-soft">{gap.meBody}</p>
                    </div>
                  ) : null}
                  {gap.partnerBody ? (
                    <div>
                      <span className="block font-rel-sans text-[10.5px] font-semibold tracking-[0.08em] text-v4-b">
                        {nameB}
                      </span>
                      <p className="mt-1.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink-soft">{gap.partnerBody}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Reveal>
        </>
      ) : null}
    </Section>
  );
}

/* --------------------------- 03 part 2 · Social DNA -------------------------- */

export function SocialDnaSection({ vm, locale }: Ctx) {
  const social = findSection(vm, "social_dna") as SocialDnaSectionVM | undefined;
  const deepRead = findSection(vm, "deep_read") as DeepReadSectionVM | undefined;
  const t = useMessages().relationshipDrilldown.friendship;
  if (!social) return null;
  const people = [
    { key: "a" as const, person: social.dna.me, voice: deepRead?.vm.meNature },
    { key: "b" as const, person: social.dna.partner, voice: deepRead?.vm.partnerNature },
  ];
  const synthesis = social.dna.me.guardian_character;

  return (
    <Section
      id="part2"
      eyebrow={pick(locale, "03 · Part 2", "03 · Part 2")}
      title="Social DNA"
      lead={pick(
        locale,
        "The seat each of you takes among friends, and what only exists when the two of you meet.",
        "친구들 사이에서 각자가 맡는 자리, 그리고 이 둘이 만났을 때만 생기는 것.",
      )}
      tint="cream"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {people.map(({ key, person, voice }, i) => (
          <Reveal key={key} delay={i * 90}>
            <article
              className={`h-full rounded-2xl border bg-rel-surface p-6 ${
                key === "a" ? "border-v4-a/25" : "border-v4-b/25"
              }`}
            >
              <NameChip name={person.nickname} side={key} />
              <h3 className="mt-4 font-rel-serif text-[20px] leading-[1.35] text-rel-ink">{person.social_title}</h3>
              <dl className="mt-5 space-y-4">
                <div>
                  <dt className="font-rel-sans text-[10px] uppercase tracking-[0.18em] text-rel-ink-mute">
                    {t.positionLabel}
                  </dt>
                  <dd className="mt-1.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink">
                    {person.friend_position}
                  </dd>
                </div>
                <div>
                  <dt className="font-rel-sans text-[10px] uppercase tracking-[0.18em] text-rel-ink-mute">
                    {t.banterLabel}
                  </dt>
                  <dd className="mt-1.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink">
                    {person.tikitaka_label} — {person.tikitaka_description}
                  </dd>
                </div>
                <div>
                  <dt className="font-rel-sans text-[10px] uppercase tracking-[0.18em] text-rel-ink-mute">
                    {t.batteryLabel}
                  </dt>
                  <dd className="mt-1.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink">
                    {person.battery_description}
                  </dd>
                </div>
                <div>
                  <dt className="font-rel-sans text-[10px] uppercase tracking-[0.18em] text-rel-ink-mute">
                    {t.privateSideLabel}
                  </dt>
                  <dd className="mt-1.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink">
                    {person.private_self}
                  </dd>
                </div>
              </dl>
              {voice && (voice.voice || voice.description) ? (
                <div className="mt-5 border-t border-rel-line/60 pt-4">
                  <span className="font-rel-sans text-[10px] uppercase tracking-[0.18em] text-rel-ink-mute">
                    {key === "a" ? t.deepReadVoiceMeLabel : t.deepReadVoicePartnerLabel}
                  </span>
                  {voice.voice ? (
                    <p className="mt-1.5 font-rel-sans text-[13.5px] italic leading-[1.75] text-rel-ink">
                      &ldquo;{voice.voice}&rdquo;
                    </p>
                  ) : null}
                  {voice.description ? (
                    <p className="mt-1.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink-soft">
                      {voice.description}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>
          </Reveal>
        ))}
      </div>

      {synthesis ? (
        <>
          <Rule label={pick(locale, "When we're together", "우리가 만나면")} />
          <Reveal>
            <figure
              data-shareable="friend-synthesis"
              className="rounded-3xl border border-rel-deep/20 bg-rel-deep px-7 py-12 text-center sm:px-12 sm:py-16"
            >
              <figcaption className="font-rel-sans text-[10px] uppercase tracking-[0.28em] text-white/55">
                {social.dna.me.nickname} × {social.dna.partner.nickname}
              </figcaption>
              <p className="mt-7 font-rel-serif text-[22px] leading-[1.5] tracking-[-0.01em] text-white sm:text-[28px]">
                {synthesis.label}
              </p>
              <p className="mx-auto mt-7 max-w-[46ch] font-rel-sans text-[13.5px] leading-[1.9] text-white/75">
                {synthesis.description}
              </p>
              <p className="mt-9 font-rel-sans text-[9.5px] uppercase tracking-[0.3em] text-white/40">
                Aha! It&apos;s me!
              </p>
            </figure>
          </Reveal>
        </>
      ) : null}
    </Section>
  );
}

/* --------------------- 04 part 3 · 숨겨진 흐름 + 관계 조건 -------------------- */

export function HiddenFlowSection({ vm, locale }: Ctx) {
  const hf = findSection(vm, "hidden_flow") as HiddenFlowSectionVM | undefined;
  const soulmate = findSection(vm, "soulmate") as SoulmateSectionVM | undefined;
  const prescription = findSection(vm, "prescription") as PrescriptionSectionVM | undefined;
  const t = useMessages().relationshipDrilldown.friendship;
  if (!hf && !soulmate) return null;
  const [nameA, nameB] = vm.opening.names;

  const releaseItems = (prescription?.items ?? []).flatMap((item) => item.dont_list);

  return (
    <Section
      id="part3"
      eyebrow={pick(locale, "04 · Part 3", "04 · Part 3")}
      title={pick(locale, "The hidden flow of this friendship", "우정의 숨겨진 흐름")}
      lead={pick(
        locale,
        "Patterns you rarely say out loud but that repeat every time. A light skim is enough.",
        "말로는 잘 안 하지만 매번 반복되는 패턴들. 가볍게 훑어보세요.",
      )}
    >
      {hf?.travelStyle ? (
        <div className="mb-10">
          <VersusStrip
            icon="🗺️"
            label={t.travelStyleLabel}
            aName={hf.travelStyle.planner.nickname}
            bName={hf.travelStyle.flexible.nickname}
            a={hf.travelStyle.planner.description}
            b={hf.travelStyle.flexible.description}
          />
          <p className="mt-4 font-rel-sans text-[13px] leading-[1.75] text-rel-ink-mute">
            {hf.travelStyle.role_prescription}
          </p>
        </div>
      ) : null}

      {hf?.counseling.me || hf?.counseling.partner ? (
        <div className="mb-10">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-[15px]">
              💬
            </span>
            <span className="font-rel-sans text-[12px] font-semibold tracking-[0.06em] text-rel-ink">
              {t.counselingStyleLabel}
            </span>
          </div>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {[hf.counseling.me, hf.counseling.partner].map((style, i) =>
              style ? (
                <div key={i}>
                  <span className={`block font-rel-sans text-[10.5px] font-semibold tracking-[0.08em] ${i === 0 ? "text-v4-a" : "text-v4-b"}`}>
                    {i === 0 ? nameA : nameB}
                  </span>
                  <p className="mt-1 font-rel-serif text-[15px] leading-[1.5] text-rel-ink">{style.label}</p>
                  <p className="mt-1.5 font-rel-sans text-[13px] leading-[1.7] text-rel-ink-soft">{style.description}</p>
                </div>
              ) : null,
            )}
          </div>
          {hf.counselingGapNote ? (
            <p className="mt-4 font-rel-sans text-[13px] leading-[1.75] text-rel-ink-mute">{hf.counselingGapNote}</p>
          ) : null}
        </div>
      ) : null}

      {releaseItems.length > 0 && (
        <>
          <Rule label={pick(locale, "Boundaries of expectation", "기대의 경계")} />
          <Quote>
            {pick(
              locale,
              "What can I still expect from this friend when things are hard?",
              "힘들 때 이 친구에게 무엇까지 기대해도 될까?",
            )}
          </Quote>
          <div className="mt-9">
            <h3 className="font-rel-sans text-[13px] font-semibold tracking-[0.04em] text-rel-taupe">
              🌿 {pick(locale, "Expectations worth releasing", "조금 내려놓으면 좋은 것")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {releaseItems.map((line) => (
                <li key={line} className="font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {soulmate ? (
        <>
          <Rule label={pick(locale, "Distance & Endurance", "거리 · 지속성")} />
          <p className="max-w-[58ch] font-rel-sans text-[14px] leading-[1.85] text-rel-ink-soft">{soulmate.verdict}</p>
        </>
      ) : null}
    </Section>
  );
}

/* ---------------------------- 05 part 4 · 방어벽 ---------------------------- */

export function RiskSection({ vm, locale }: Ctx) {
  const bg = findSection(vm, "breakup_guide") as BreakupGuideSectionVM | undefined;
  if (!bg) return null;
  const [nameA, nameB] = vm.opening.names;

  const risks = [
    { name: nameA, body: bg.warnings.me, care: bg.jealousyGuard.me },
    { name: nameB, body: bg.warnings.partner, care: bg.jealousyGuard.partner },
  ].filter((r) => r.body);

  return (
    <Section
      id="part4"
      eyebrow={pick(locale, "05 · Part 4", "05 · Part 4")}
      title={pick(locale, "Guardrails for a healthy friendship", "건강한 우정을 위한 방어벽")}
      lead={pick(
        locale,
        "Not warning signs — just the moments you're most likely to misread each other. Knowing them usually makes them pass right by.",
        "위험 신호가 아니라, 우리가 서로를 오해하기 쉬운 순간들이에요. 알아두면 대부분 그냥 지나갑니다.",
      )}
      tint="cream"
    >
      <ol className="space-y-9">
        {risks.map((r, i) => (
          <li key={r.name}>
            <Reveal delay={i * 50}>
              <div className="flex items-baseline gap-3">
                <span className="font-rel-sans text-[10px] tracking-[0.18em] text-rel-ink-mute">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="min-w-0 font-rel-serif text-[18px] leading-[1.45] text-rel-ink sm:text-[20px]">
                  {r.name}
                </h3>
              </div>
              <p className="mt-2.5 pl-8 font-rel-sans text-[13.5px] leading-[1.8] text-rel-ink-soft">{r.body}</p>
              {r.care ? (
                <p className="mt-2.5 pl-8 font-rel-sans text-[13px] leading-[1.75] text-rel-deep">→ {r.care}</p>
              ) : null}
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* -------------------------- 06 part 5 · 사용설명서 -------------------------- */

export function ManualSection({ vm, locale }: Ctx) {
  const de = findSection(vm, "de_escalation") as DeEscalationSectionVM | undefined;
  const prescription = findSection(vm, "prescription") as PrescriptionSectionVM | undefined;
  const deepRead = findSection(vm, "deep_read") as DeepReadSectionVM | undefined;
  const t = useMessages().relationshipDrilldown.friendship;
  const adviceForMe = deepRead?.vm.adviceForMe ?? [];
  const adviceForPartner = deepRead?.vm.adviceForPartner ?? [];
  const together = deepRead?.vm.together;
  if (!de && !prescription && adviceForMe.length === 0 && adviceForPartner.length === 0 && !together) return null;

  return (
    <Section
      id="part5"
      eyebrow={pick(locale, "06 · Part 5", "06 · Part 5")}
      title={pick(locale, "Our friendship manual", "우리 우정 사용설명서")}
      lead={pick(
        locale,
        "How to actually use everything above. One page.",
        "여기까지 읽은 내용을 실제로 쓰는 방법. 한 장으로 정리했어요.",
      )}
    >
      {de ? (
        <section className="mb-10">
          <h3 className="flex items-center gap-2 border-b border-rel-line pb-3 font-rel-sans text-[13px] font-semibold tracking-[0.04em] text-v4-bad">
            <span aria-hidden>💬</span>
            {pick(locale, "When you fight, do this", "싸웠을 때는 이렇게")}
          </h3>
          <div className="mt-4 space-y-3">
            <p className="font-rel-serif text-[17px] leading-[1.5] text-rel-ink">{de.hashtag}</p>
            <p className="font-rel-sans text-[13px] leading-[1.7] text-rel-ink-mute">{de.archetypeLabel}</p>
            <p className="rounded-xl border border-rel-line bg-rel-surface p-4 font-rel-sans text-[13.5px] italic leading-[1.8] text-rel-ink">
              💬 {de.cheatScript}
            </p>
            {de.reconciliationScript ? (
              <p className="font-rel-sans text-[13px] leading-[1.75] text-rel-ink-soft">{de.reconciliationScript}</p>
            ) : null}
            {de.recoveryPaceNote ? (
              <p className="font-rel-sans text-[12.5px] leading-[1.7] text-rel-ink-mute">{de.recoveryPaceNote}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {prescription ? (
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
          <Reveal>
            <section>
              <h3 className="flex items-center gap-2 border-b border-rel-line pb-3 font-rel-sans text-[13px] font-semibold tracking-[0.04em] text-v4-good">
                <span aria-hidden>✅</span>
                {pick(locale, "Our routine for staying close", "우리에게 맞는 유지 루틴")}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {prescription.items.flatMap((item) => item.do_list).map((line) => (
                  <li key={line} className="flex gap-2.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink">
                    <span aria-hidden className="text-rel-ink-mute">
                      ·
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
          <Reveal delay={60}>
            <section>
              <h3 className="flex items-center gap-2 border-b border-rel-line pb-3 font-rel-sans text-[13px] font-semibold tracking-[0.04em] text-v4-bad">
                <span aria-hidden>🚫</span>
                {pick(locale, "Just avoid this", "이것만은 피하기")}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {prescription.items.flatMap((item) => item.dont_list).map((line) => (
                  <li key={line} className="flex gap-2.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink">
                    <span aria-hidden className="text-rel-ink-mute">
                      ·
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        </div>
      ) : null}

      {adviceForMe.length > 0 || adviceForPartner.length > 0 ? (
        <div className="mt-12">
          <Rule label={pick(locale, "Tailored to each of you", "각자에게 맞는 제안")} />
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
            {adviceForMe.length > 0 ? (
              <Reveal>
                <section>
                  <h3 className="border-b border-rel-line pb-3 font-rel-sans text-[13px] font-semibold tracking-[0.04em] text-rel-ink">
                    {t.deepReadAdviceMeLabel}
                  </h3>
                  <div className="mt-4 space-y-3">
                    {adviceForMe.map((tip, i) => (
                      <div key={i} className="rounded-xl border border-rel-line bg-rel-surface p-4">
                        {tip.actionTitle ? (
                          <p className="font-rel-sans text-[13.5px] font-semibold leading-snug text-rel-ink">
                            {tip.actionTitle}
                          </p>
                        ) : null}
                        {tip.reason ? (
                          <p className="mt-1.5 font-rel-sans text-[12.5px] leading-[1.7] text-rel-ink-mute">
                            {tip.reason}
                          </p>
                        ) : null}
                        {tip.speechTip ? (
                          <p className="mt-1.5 font-rel-sans text-[13px] italic leading-[1.7] text-rel-ink">
                            &ldquo;{tip.speechTip}&rdquo;
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              </Reveal>
            ) : null}
            {adviceForPartner.length > 0 ? (
              <Reveal delay={60}>
                <section>
                  <h3 className="border-b border-rel-line pb-3 font-rel-sans text-[13px] font-semibold tracking-[0.04em] text-rel-ink">
                    {t.deepReadAdvicePartnerLabel}
                  </h3>
                  <div className="mt-4 space-y-3">
                    {adviceForPartner.map((tip, i) => (
                      <div key={i} className="rounded-xl border border-rel-line bg-rel-surface p-4">
                        {tip.actionTitle ? (
                          <p className="font-rel-sans text-[13.5px] font-semibold leading-snug text-rel-ink">
                            {tip.actionTitle}
                          </p>
                        ) : null}
                        {tip.reason ? (
                          <p className="mt-1.5 font-rel-sans text-[12.5px] leading-[1.7] text-rel-ink-mute">
                            {tip.reason}
                          </p>
                        ) : null}
                        {tip.speechTip ? (
                          <p className="mt-1.5 font-rel-sans text-[13px] italic leading-[1.7] text-rel-ink">
                            &ldquo;{tip.speechTip}&rdquo;
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              </Reveal>
            ) : null}
          </div>
        </div>
      ) : null}

      {together ? (
        <Reveal>
          <div className="mt-12 rounded-2xl border border-rel-deep/20 bg-rel-taupe-soft/35 p-6 text-center">
            <span className="font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-ink-mute">
              {t.deepReadTogetherLabel}
            </span>
            <p className="mt-3 font-rel-sans text-[13.5px] leading-[1.8] text-rel-ink">{together}</p>
            {deepRead?.vm.togetherStarter ? (
              <p className="mt-3 font-rel-sans text-[13px] italic leading-[1.7] text-rel-ink-soft">
                &ldquo;{deepRead.vm.togetherStarter}&rdquo;
              </p>
            ) : null}
          </div>
        </Reveal>
      ) : null}

      <div className="mt-16">
        <Quote>
          {pick(
            locale,
            "A different friend cares for you a different way. This friend's way is exactly what's written here.",
            "다른 친구는 다른 방식으로 우리를 아껴줍니다. 이 친구의 방식은 여기에 적힌 그대로예요.",
          )}
        </Quote>
      </div>
    </Section>
  );
}
