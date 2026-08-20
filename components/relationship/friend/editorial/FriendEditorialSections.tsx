"use client";

/**
 * Friend Premium — editorial report sections (Chapters 1 ~ 10).
 *
 * Consolidated 10-chapter IA following the Romantic report's editorial hierarchy:
 * Every chapter uses the `ChapterSection` visual primitive:
 * CHAPTER NUMBER → TITLE → USER QUESTION / SHORT LEAD.
 *
 * Fixed open editorial sections with NO chapter accordions and MAX TOGGLE DEPTH = 1.
 * 11-Axis Radar Graph is relocated from Chapter 1 to Chapter 4 ("일상 템포와 소통 케미").
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
  ChapterSection,
  Disclosure,
  NameChip,
  Quote,
  Reveal,
  Rule,
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
            {pick(locale, "Aha It's me! · Friend Report", "Aha It's me! · 친구 관계 리포트")}
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

/* -------------------------- Signal Banding Utilities -------------------------- */

type SignalKey = "connection" | "banter" | "risk";
type SignalBand = "high" | "mid" | "low";

function signalBand(key: SignalKey, score: number): SignalBand {
  if (key === "connection") return score >= 70 ? "high" : score >= 40 ? "mid" : "low";
  if (key === "banter") return score >= 65 ? "high" : score >= 35 ? "mid" : "low";
  return score >= 60 ? "high" : score >= 30 ? "mid" : "low";
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

/* ------------------- CHAPTER 1: 한눈에 보는 우리 우정 (SUMMARY ONLY) ------------------- */

export function Chapter01Overview({ vm, locale }: Ctx) {
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
    <ChapterSection
      id="ch01_overview"
      n="1"
      title={pick(locale, "Friendship Overview & Signals", "한눈에 보는 우리 우정")}
      lead={pick(
        locale,
        "Three core signals frame the overall shape and strength of this friendship first.",
        "세 가지 핵심 신호로 이 우정의 전체적인 성격과 신뢰를 먼저 봅니다.",
      )}
    >
      <OverviewSection
        id="overview_cards"
        locale={locale}
        eyebrow=""
        title=""
        cards={cards}
        extra={extra}
      />
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 2: 서로에게 끌리는 이유 ------------------- */

export function Chapter02WhyUs({ vm, locale }: Ctx) {
  const section = findSection(vm, "why_you_me_us") as WhyYouMeUsSectionVM | undefined;
  if (!section) return null;
  const [nameA, nameB] = vm.opening.names;
  const ch01Vm = vm.chapters?.find((c) => c.chapterKey === "ch01_why_us");

  return (
    <ChapterSection
      id="ch02_why_us"
      n="2"
      title={section.title}
      lead={pick(
        locale,
        "Why you clicked so quickly, and what keeps you naturally drawn to each other.",
        "왜 우리는 빠르게 친해졌고, 만날수록 서로의 무엇에 끌리는가?",
      )}
    >
      <SharedWhyYouMeUsSection
        id="why_you_me_us_body"
        eyebrow={pick(locale, "Why us", "서로를 선택한 이유")}
        title=""
        data={section.data}
        names={{ a: nameA, b: nameB }}
        locale={locale}
      />
      {ch01Vm?.narrativeText && (
        <Disclosure label={pick(locale, "See expert chemistry synthesis", "우정 시너지 상세 해석 보기")}>
          <div className="rounded-xl border border-rel-line bg-white/80 p-4 font-rel-sans text-xs leading-relaxed text-rel-ink-soft">
            <p className="font-medium text-rel-ink">{ch01Vm.narrativeText}</p>
            {ch01Vm.v1Assets?.whyYouMeUs?.bullets && (
              <ul className="mt-3 space-y-1.5 border-t border-rel-line/50 pt-2.5">
                {ch01Vm.v1Assets.whyYouMeUs.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="font-bold text-rel-deep">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Disclosure>
      )}
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 3: 서로에게 어떤 친구인가 ------------------- */

export function Chapter03Roles({ vm, locale }: Ctx) {
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
    <ChapterSection
      id="ch03_roles"
      n="3"
      title={pick(locale, "Friendship Archetypes & Mutual Roles", "서로에게 어떤 친구인가")}
      lead={pick(
        locale,
        "What kind of guardian seat each of you takes, and what unique strength you bring into each other's life.",
        "나는 이 친구에게 어떤 수호군이고, 이 친구는 나에게 어떤 힘을 주는가?",
      )}
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
                </div>
              ) : null}
            </article>
          </Reveal>
        ))}
      </div>

      {synthesis ? (
        <div className="mt-8">
          <Rule label={pick(locale, "When we're together", "우리가 만나면")} />
          <Reveal>
            <figure
              data-shareable="friend-synthesis"
              className="rounded-3xl border border-rel-deep/20 bg-rel-deep px-7 py-10 text-center sm:px-12 sm:py-12"
            >
              <figcaption className="font-rel-sans text-[10px] uppercase tracking-[0.28em] text-white/55">
                {social.dna.me.nickname} × {social.dna.partner.nickname}
              </figcaption>
              <p className="mt-5 font-rel-serif text-[20px] leading-[1.5] tracking-[-0.01em] text-white sm:text-[24px]">
                {synthesis.label}
              </p>
              <p className="mx-auto mt-4 max-w-[46ch] font-rel-sans text-[13px] leading-[1.85] text-white/75">
                {synthesis.description}
              </p>
            </figure>
          </Reveal>
        </div>
      ) : null}
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 4: 일상 템포와 소통 케미 (11-AXIS PRIMARY HOME) ------------------- */

export function Chapter04Tempo({ vm, viewerIsReportA, locale }: Ctx) {
  const compare = findSection(vm, "compare_table") as CompareTableSectionVM | undefined;
  const radar = findSection(vm, "psych_radar") as PsychRadarSectionVM | undefined;
  const deepRead = findSection(vm, "deep_read") as DeepReadSectionVM | undefined;
  if (!compare && !radar) return null;
  const [nameA, nameB] = vm.opening.names;
  const gap = deepRead?.vm.gapSignal;
  const ch03Vm = vm.chapters?.find((c) => c.chapterKey === "ch03_social_dna_tempo");

  return (
    <ChapterSection
      id="ch04_tempo"
      n="4"
      title={pick(locale, "Daily Tempo & Initiative Chemistry", "일상 템포와 소통 케미")}
      lead={pick(
        locale,
        "How do your daily interaction rhythms, 11-axis psych profiles, and initiative roles compare?",
        "우리는 평소 연락하고 반응하고 움직이는 방식이 어떻게 다른지 11축 그래프와 리듬 비교로 봅니다.",
      )}
    >
      {/* Primary Visual: 11-Axis Psych Radar Chart */}
      {radar ? (
        <div className="mb-10">
          <PsychAxisComparisonSection
            axisResults={radar.axisResults}
            highlights={radar.highlights}
            chartNote={radar.chartNote}
            names={[nameA, nameB]}
            locale={locale}
          />
        </div>
      ) : null}

      {/* NEW capability: initiativeRole */}
      {ch03Vm?.coverageCards?.initiativeRole && (
        <div className="mb-10 rounded-2xl border border-rel-line bg-rel-surface/90 p-5 shadow-xs sm:p-6">
          <h4 className="mb-3.5 flex items-center gap-2 font-rel-sans text-xs font-bold uppercase tracking-wider text-rel-deep">
            <span className="inline-block h-2 w-2 rounded-full bg-rel-deep" />
            {pick(locale, "Who leads what in this friendship?", "이 우정에서 누가 무엇을 주도할까?")}
          </h4>
          <div className="grid grid-cols-1 gap-3 font-rel-sans text-xs text-rel-ink-soft sm:grid-cols-3">
            <div className="rounded-xl border border-rel-line/60 bg-white p-3.5 shadow-2xs">
              <span className="font-semibold text-rel-ink block mb-1">{pick(locale, "Who reaches out first", "연락 물꼬")}</span>
              <span className="font-bold text-rel-deep text-sm">{ch03Vm.coverageCards.initiativeRole.contactInitiator}</span>
            </div>
            <div className="rounded-xl border border-rel-line/60 bg-white p-3.5 shadow-2xs">
              <span className="font-semibold text-rel-ink block mb-1">{pick(locale, "Planning & scheduling", "약속 · 기획")}</span>
              <span className="font-bold text-rel-deep text-sm">{ch03Vm.coverageCards.initiativeRole.planningLead}</span>
            </div>
            <div className="rounded-xl border border-rel-line/60 bg-white p-3.5 shadow-2xs">
              <span className="font-semibold text-rel-ink block mb-1">{pick(locale, "Reconnecting after distance", "관계 회복")}</span>
              <span className="font-bold text-rel-deep text-sm">{ch03Vm.coverageCards.initiativeRole.reconnectionLead}</span>
            </div>
          </div>
        </div>
      )}

      {/* Existing Compare Table */}
      {compare ? (
        <ul className="space-y-10">
          {compare.rows.map((row, i) => {
            const me = viewerIsReportA ? row.personA : row.personB;
            const partner = viewerIsReportA ? row.personB : row.personA;
            return (
              <li key={row.id}>
                <Reveal delay={i * 50}>
                  <VersusStrip label={row.label} aName={nameA} bName={nameB} a={me.shortLabel} b={partner.shortLabel} />
                  <p className="mt-3 font-rel-sans text-[14px] leading-[1.8] text-rel-ink-soft">{row.meaning}</p>
                </Reveal>
              </li>
            );
          })}
        </ul>
      ) : null}

      {gap && (gap.matchNote || gap.meBody || gap.partnerBody) ? (
        <Disclosure label={pick(locale, "See instinct gap details", "결이 갈리는 지점 세부 분석 보기")}>
          <div className="space-y-3 font-rel-sans text-xs text-rel-ink-soft">
            {gap.matchNote ? <p className="font-medium text-rel-ink">{gap.matchNote}</p> : null}
            {gap.meBody && <p>· <strong>{nameA}:</strong> {gap.meBody}</p>}
            {gap.partnerBody && <p>· <strong>{nameB}:</strong> {gap.partnerBody}</p>}
          </div>
        </Disclosure>
      ) : null}
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 5: 같이 놀 때 우리는 어떤 팀인가 ------------------- */

export function Chapter05Teamwork({ vm, locale }: Ctx) {
  const hf = findSection(vm, "hidden_flow") as HiddenFlowSectionVM | undefined;
  const [nameA, nameB] = vm.opening.names;
  const ch04Vm = vm.chapters?.find((c) => c.chapterKey === "ch04_play_travel");
  const t = useMessages().relationshipDrilldown.friendship;

  return (
    <ChapterSection
      id="ch05_teamwork"
      n="5"
      title={pick(locale, "Play & Travel Teamwork Dynamic", "같이 놀 때 우리는 어떤 팀인가")}
      lead={pick(
        locale,
        "When making plans or traveling together, how do your roles and energy paces divide?",
        "함께 약속을 잡거나 여행을 갈 때 우리의 역할 분담과 팀워크는 어떠한가?",
      )}
    >
      {/* NEW capability: travelPlayRole */}
      {ch04Vm?.coverageCards?.travelPlayRole && (
        <div className="mb-8 rounded-2xl border border-rel-line bg-white/90 p-5 shadow-xs sm:p-6">
          <h4 className="mb-3.5 flex items-center gap-2 font-rel-sans text-xs font-bold uppercase tracking-wider text-rel-deep">
            <span className="inline-block h-2 w-2 rounded-full bg-rel-deep" />
            {pick(locale, "What kind of team are we when hanging out?", "놀 때 우리는 어떤 팀인가?")}
          </h4>
          <div className="grid grid-cols-1 gap-3 font-rel-sans text-xs text-rel-ink-soft sm:grid-cols-3">
            <div className="rounded-xl border border-rel-line/60 bg-rel-bg/50 p-3.5">
              <span className="font-semibold text-rel-ink block mb-1">{pick(locale, "Idea generator", "아이디어 제안")}</span>
              <span className="font-bold text-rel-deep text-sm">{ch04Vm.coverageCards.travelPlayRole.ideaCreator}</span>
            </div>
            <div className="rounded-xl border border-rel-line/60 bg-rel-bg/50 p-3.5">
              <span className="font-semibold text-rel-ink block mb-1">{pick(locale, "Execution & booking", "실전 실행 · 예약")}</span>
              <span className="font-bold text-rel-deep text-sm">{ch04Vm.coverageCards.travelPlayRole.practicalExecutor}</span>
            </div>
            <div className="rounded-xl border border-rel-line/60 bg-rel-bg/50 p-3.5">
              <span className="font-semibold text-rel-ink block mb-1">{pick(locale, "Energy pace", "에너지 템포")}</span>
              <span className="font-medium text-rel-deep">{ch04Vm.coverageCards.travelPlayRole.energyPace}</span>
            </div>
          </div>
        </div>
      )}

      {/* Existing Travel Style */}
      {hf?.travelStyle ? (
        <div>
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
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 6: 고민 상담과 제3자 관계 다이내믹 ------------------- */

export function Chapter06CounselingGroup({ vm, locale }: Ctx) {
  const hf = findSection(vm, "hidden_flow") as HiddenFlowSectionVM | undefined;
  const [nameA, nameB] = vm.opening.names;
  const ch05Vm = vm.chapters?.find((c) => c.chapterKey === "ch05_communication_third_person");
  const t = useMessages().relationshipDrilldown.friendship;

  return (
    <ChapterSection
      id="ch06_counseling_group"
      n="6"
      title={pick(locale, "Counseling & Group Dynamics", "고민 상담과 다른 친구가 끼었을 때")}
      lead={pick(
        locale,
        "Why do you turn to this friend in hard times, and how does your bond shift in group settings?",
        "힘들 때 왜 이 친구를 찾으며, 여럿이 모이는 자리에서는 어떤 가이드가 필요한가?",
      )}
    >
      {/* Existing Counseling Style */}
      {hf?.counseling.me || hf?.counseling.partner ? (
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-[15px]">💬</span>
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
        </div>
      ) : null}

      {/* NEW capability: thirdPersonExclusion */}
      {ch05Vm?.coverageCards?.thirdPersonExclusion && (
        <div className="rounded-2xl border border-rel-line bg-white/90 p-5 shadow-xs sm:p-6">
          <h4 className="mb-3.5 flex items-center gap-2 font-rel-sans text-xs font-bold uppercase tracking-wider text-rel-deep">
            <span className="inline-block h-2 w-2 rounded-full bg-rel-deep" />
            {pick(locale, "1-on-1 vs Group & Third-Person Dynamics", "둘만 있을 때와 다른 친구가 함께 있을 때 (다자간 소외/비교 다이내믹)")}
          </h4>
          <div className="space-y-3 font-rel-sans text-xs">
            <div className="inline-block rounded-lg bg-rel-deep/10 px-3 py-1.5 font-bold text-rel-deep text-sm">
              ✨ {ch05Vm.coverageCards.thirdPersonExclusion.humanTitle}
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-emerald-900">
              <strong className="font-semibold text-emerald-700">{pick(locale, "Best context:", "추천 환경/맥락:")}</strong>{" "}
              {ch05Vm.coverageCards.thirdPersonExclusion.situationNote}
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3.5 text-amber-900">
              <strong className="font-semibold text-amber-700">{pick(locale, "Watch out for:", "주의사항:")}</strong>{" "}
              {ch05Vm.coverageCards.thirdPersonExclusion.recommendationNote}
            </div>
          </div>
        </div>
      )}
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 7: 서운함과 관계 회복의 기술 ------------------- */

export function Chapter07ConflictRepair({ vm, locale }: Ctx) {
  const de = findSection(vm, "de_escalation") as DeEscalationSectionVM | undefined;
  if (!de) return null;

  return (
    <ChapterSection
      id="ch07_conflict_repair"
      n="7"
      title={pick(locale, "Conflict Resolution & Reconciliation", "서운함과 관계 회복의 기술")}
      lead={pick(
        locale,
        "How friction arises when you clash, and the exact steps to clear up misunderstandings gracefully.",
        "서운함이 생기거나 갈등이 일어날 때 어떻게 풀어나가야 하는가?",
      )}
    >
      <div className="space-y-4">
        <p className="font-rel-serif text-[18px] leading-[1.5] text-rel-ink">{de.hashtag}</p>
        <p className="font-rel-sans text-[13px] leading-[1.7] text-rel-ink-mute">{de.archetypeLabel}</p>
        <div className="rounded-2xl border border-rel-line bg-rel-surface p-5 font-rel-sans text-[14px] italic leading-[1.8] text-rel-ink shadow-xs">
          💬 {de.cheatScript}
        </div>
        {de.reconciliationScript && (
          <p className="font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink-soft">{de.reconciliationScript}</p>
        )}
      </div>

      {de.recoveryPaceNote && (
        <Disclosure label={pick(locale, "See cooling-off & recovery timing tips", "추천 쿨다운 & 회복 타이밍 팁 보기")}>
          <p className="font-rel-sans text-xs leading-[1.7] text-rel-ink-soft">{de.recoveryPaceNote}</p>
        </Disclosure>
      )}
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 8: 이 우정에서 기대하지 말아야 할 것 ------------------- */

export function Chapter08Boundaries({ vm, locale }: Ctx) {
  const bg = findSection(vm, "breakup_guide") as BreakupGuideSectionVM | undefined;
  const prescription = findSection(vm, "prescription") as PrescriptionSectionVM | undefined;
  if (!bg) return null;
  const [nameA, nameB] = vm.opening.names;

  const risks = [
    { name: nameA, body: bg.warnings.me, care: bg.jealousyGuard.me },
    { name: nameB, body: bg.warnings.partner, care: bg.jealousyGuard.partner },
  ].filter((r) => r.body);

  const releaseItems = (prescription?.items ?? []).flatMap((item) => item.dont_list);

  return (
    <ChapterSection
      id="ch08_boundaries"
      n="8"
      title={pick(locale, "Expectation Boundaries & Guardrails", "이 우정에서 기대하지 말아야 할 것")}
      lead={pick(
        locale,
        "Boundaries to respect and expectations worth releasing for a long-lasting friendship.",
        "서로의 기질 차이에서 오는 한계와 유의해야 할 경계는 무엇인가?",
      )}
    >
      <ol className="space-y-6">
        {risks.map((r, i) => (
          <li key={r.name} className="rounded-xl border border-rel-line bg-white/80 p-4.5 shadow-2xs">
            <h4 className="font-rel-serif text-[17px] font-semibold text-rel-ink">{r.name}의 경계</h4>
            <p className="mt-2 font-rel-sans text-[13.5px] leading-[1.8] text-rel-ink-soft">{r.body}</p>
            {r.care ? <p className="mt-2 font-rel-sans text-[13px] text-rel-deep">→ {r.care}</p> : null}
          </li>
        ))}
      </ol>

      {releaseItems.length > 0 && (
        <Disclosure label={pick(locale, "See expectations worth releasing", "조금 내려놓으면 좋은 기대 사항 보기")}>
          <ul className="space-y-2 font-rel-sans text-xs text-rel-ink-soft">
            {releaseItems.map((line, idx) => (
              <li key={idx} className="flex gap-2">
                <span>🌿</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Disclosure>
      )}
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 9: 오래가는 우정의 거리감 ------------------- */

export function Chapter09Distance({ vm, locale }: Ctx) {
  const soulmate = findSection(vm, "soulmate") as SoulmateSectionVM | undefined;
  const ch08Vm = vm.chapters?.find((c) => c.chapterKey === "ch08_distance_durability");

  return (
    <ChapterSection
      id="ch09_distance_durability"
      n="9"
      title={pick(locale, "Distance & Long-Term Durability", "오래가는 우정의 거리감")}
      lead={pick(
        locale,
        "Are you friends who need frequent hangouts, or an enduring bond that thrives even with occasional catch-ups?",
        "우리는 자주 봐야 하는 친구인가, 가끔 만나도 괜찮은 친구인가?",
      )}
    >
      {/* NEW capability: distanceProfile */}
      {ch08Vm?.coverageCards?.distanceProfile && (
        <div className="mb-8 rounded-2xl border border-rel-line bg-white/90 p-5 shadow-xs sm:p-6">
          <h4 className="mb-3.5 flex items-center gap-2 font-rel-sans text-xs font-bold uppercase tracking-wider text-rel-deep">
            <span className="inline-block h-2 w-2 rounded-full bg-rel-deep" />
            {pick(locale, "Distance & Durability Verdict", "우리는 자주 봐야 하는 친구인가, 가끔 봐도 괜찮은 친구인가?")}
          </h4>
          <div className="space-y-3 font-rel-sans text-xs">
            <div className="rounded-xl bg-rel-deep/10 p-3.5 font-bold text-rel-deep text-sm">
              🏷️ {ch08Vm.coverageCards.distanceProfile.verdictTitle}
            </div>
            {ch08Vm.coverageCards.distanceProfile.rhythmAdvice && (
              <div className="rounded-xl border border-rel-line/50 bg-rel-bg/50 p-3 text-rel-ink-soft">
                <strong className="font-semibold text-rel-ink">{pick(locale, "Contact rhythm guide:", "연락 리듬 가이드:")}</strong>{" "}
                {ch08Vm.coverageCards.distanceProfile.rhythmAdvice}
              </div>
            )}
            {ch08Vm.coverageCards.distanceProfile.meetingFrequencyNeed && (
              <div className="rounded-xl border border-rel-line/50 bg-rel-bg/50 p-3 text-rel-ink-soft">
                <strong className="font-semibold text-rel-ink">{pick(locale, "Meeting frequency:", "만남 지속력:")}</strong>{" "}
                {ch08Vm.coverageCards.distanceProfile.meetingFrequencyNeed}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing Soulmate Verdict */}
      {soulmate ? (
        <div className="rounded-2xl border border-rel-line bg-rel-surface/80 p-5">
          <p className="font-rel-sans text-[14px] leading-[1.85] text-rel-ink-soft">{soulmate.verdict}</p>
        </div>
      ) : null}
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 10: 우리 우정 사용설명서 ------------------- */

export function Chapter10Playbook({ vm, locale }: Ctx) {
  const prescription = findSection(vm, "prescription") as PrescriptionSectionVM | undefined;
  const deepRead = findSection(vm, "deep_read") as DeepReadSectionVM | undefined;
  const t = useMessages().relationshipDrilldown.friendship;
  const adviceForMe = deepRead?.vm.adviceForMe ?? [];
  const adviceForPartner = deepRead?.vm.adviceForPartner ?? [];
  const together = deepRead?.vm.together;

  return (
    <ChapterSection
      id="ch10_playbook"
      n="10"
      title={pick(locale, "Our Friendship Manual & Action Playbook", "우리 우정 사용설명서")}
      lead={pick(
        locale,
        "Practical habits, Do's & Don'ts, and relationship routines to keep your friendship strong for years.",
        "이 우정을 가치 있게 가꾸기 위해 오늘 당장 실천할 지침은 무엇인가?",
      )}
    >
      {/* Pair Prescriptions: Do's & Don'ts */}
      {prescription ? (
        <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
          <section className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-5">
            <h4 className="flex items-center gap-2 border-b border-emerald-200 pb-2.5 font-rel-sans text-[13px] font-bold text-emerald-900">
              <span aria-hidden>✅</span>
              {pick(locale, "Our routine for staying close", "우리에게 맞는 유지 루틴 (Do)")}
            </h4>
            <ul className="mt-3.5 space-y-2.5">
              {prescription.items.flatMap((item) => item.do_list).map((line) => (
                <li key={line} className="flex gap-2 font-rel-sans text-[13px] leading-[1.7] text-emerald-950">
                  <span className="font-bold text-emerald-700">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-rose-200/70 bg-rose-50/40 p-5">
            <h4 className="flex items-center gap-2 border-b border-rose-200 pb-2.5 font-rel-sans text-[13px] font-bold text-rose-900">
              <span aria-hidden>🚫</span>
              {pick(locale, "Just avoid this", "이것만은 피하기 (Don't)")}
            </h4>
            <ul className="mt-3.5 space-y-2.5">
              {prescription.items.flatMap((item) => item.dont_list).map((line) => (
                <li key={line} className="flex gap-2 font-rel-sans text-[13px] leading-[1.7] text-rose-950">
                  <span className="font-bold text-rose-700">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {/* Tailored Advice & Maintenance Covenant */}
      {(adviceForMe.length > 0 || adviceForPartner.length > 0 || together) && (
        <Disclosure label={pick(locale, "See individual advice & friendship covenant", "각자에게 맞는 개별 조언 및 약속 다짐 보기")}>
          <div className="space-y-6 pt-2">
            {adviceForMe.length > 0 && (
              <div>
                <h5 className="font-bold text-xs text-rel-ink mb-2">{t.deepReadAdviceMeLabel}</h5>
                {adviceForMe.map((tip, i) => (
                  <p key={i} className="text-xs text-rel-ink-soft leading-relaxed">· {tip.actionTitle}</p>
                ))}
              </div>
            )}
            {adviceForPartner.length > 0 && (
              <div>
                <h5 className="font-bold text-xs text-rel-ink mb-2">{t.deepReadAdvicePartnerLabel}</h5>
                {adviceForPartner.map((tip, i) => (
                  <p key={i} className="text-xs text-rel-ink-soft leading-relaxed">· {tip.actionTitle}</p>
                ))}
              </div>
            )}
            {together && (
              <div className="rounded-xl bg-rel-deep/5 p-4 text-center border border-rel-deep/10">
                <p className="font-bold text-xs text-rel-deep">{together}</p>
              </div>
            )}
          </div>
        </Disclosure>
      )}

      <div className="mt-12">
        <Quote>
          {pick(
            locale,
            "A different friend cares for you a different way. This friend's way is exactly what's written here.",
            "다른 친구는 다른 방식으로 우리를 아껴줍니다. 이 친구의 방식은 여기에 적힌 그대로예요.",
          )}
        </Quote>
      </div>
    </ChapterSection>
  );
}
