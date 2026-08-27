"use client";

/**
 * Friend Premium — editorial report sections.
 *
 * Consolidated 9-chapter IA following the Romantic report's editorial hierarchy:
 * - Unnumbered Top Overview ("◤ 한눈에 보는 우리 우정") with 3 score cards
 * - Chapters 1 through 9 sequentially using standard ChapterSection headers:
 *   CHAPTER NUMBER → TITLE → USER QUESTION / SHORT LEAD.
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

function findSection(vm: FriendReportViewModel, type: string) {
  return vm.sections.find((s) => s.type === type);
}

const SIGNAL_GRADE_COPY: Record<
  "connection" | "banter" | "risk",
  Record<"high" | "mid" | "low", [string, string]>
> = {
  connection: {
    high: ["Deep natural click", "애쓰지 않아도 깊이 통함"],
    mid: ["Comfortable & steady", "무난하고 안정적"],
    low: ["Slow-burn chemistry", "천천히 스며드는 타입"],
  },
  banter: {
    high: ["Banter never runs dry", "밤새 수다 떨 수 있음"],
    mid: ["Easygoing back-and-forth", "필요할 때 통함"],
    low: ["Quiet & calm tempo", "잔잔한 대화 템포"],
  },
  risk: {
    high: ["Requires care & cooldowns", "갈등 수습 팁 필수"],
    mid: ["Occasional friction points", "가끔 사소한 주의"],
    low: ["Low maintenance", "마찰이 적음"],
  },
};

const SIGNAL_ONE_LINER_COPY: Record<"connection" | "banter" | "risk", [string, string]> = {
  connection: [
    "Instinctive closeness that requires minimal effort",
    "애쓰지 않아도 서로 편안하게 끌리는 정도",
  ],
  banter: [
    "Natural rhythm of your back-and-forth conversation",
    "말과 리액션이 자연스럽게 오가는 정도",
  ],
  risk: [
    "Likelihood of friction flared up by temperament differences",
    "친구 사이에 마찰이 생길 가능성",
  ],
};

function signalBand(key: "connection" | "banter" | "risk", score: number): "high" | "mid" | "low" {
  if (key === "connection") {
    if (score >= 70) return "high";
    if (score >= 40) return "mid";
    return "low";
  }
  if (key === "banter") {
    if (score >= 65) return "high";
    if (score >= 35) return "mid";
    return "low";
  }
  if (score >= 60) return "high";
  if (score >= 30) return "mid";
  return "low";
}

function signalTone(
  key: "connection" | "banter" | "risk",
  band: "high" | "mid" | "low",
): "good" | "neutral" | "warn" {
  if (key === "risk") {
    if (band === "low") return "good";
    if (band === "mid") return "neutral";
    return "warn";
  }
  if (band === "high") return "good";
  if (band === "mid") return "neutral";
  return "warn";
}

/* ------------------- TOP OVERVIEW: 한눈에 보는 우리 우정 (Unnumbered Header) ------------------- */

export function FriendshipOverviewSection({ vm, locale }: Ctx) {
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

  return (
    <section id="overview_cards" className="mb-14 scroll-mt-24 border-b border-rel-line pb-10">
      <div className="mb-6 flex items-center gap-2 font-rel-sans text-[12px] font-bold uppercase tracking-[0.2em] text-rel-ink-mute">
        <span className="text-rel-deep font-black">◤</span>
        <span>{pick(locale, "Friendship Overview", "한눈에 보는 우리 우정")}</span>
      </div>
      <OverviewSection
        id="overview_cards_inner"
        locale={locale}
        eyebrow=""
        title=""
        cards={cards}
        extra={null}
      />
    </section>
  );
}

export const Chapter01Overview = FriendshipOverviewSection;

/* ------------------- CHAPTER 1: 서로에게 끌리는 이유 ------------------- */

export function Chapter02WhyUs({ vm, locale }: Ctx) {
  const section = findSection(vm, "why_you_me_us") as WhyYouMeUsSectionVM | undefined;
  if (!section) return null;
  const [nameA, nameB] = vm.opening.names;
  const snap = findSection(vm, "snapshot") as SnapshotSectionVM | undefined;

  const shineItems = [
    snap?.shineWhenBest
      ? {
          icon: "☀️",
          heading: pick(locale, "When this friendship shines", "이 우정이 빛나는 순간"),
          body: snap.shineWhenBest,
          tone: "good" as const,
        }
      : null,
    snap?.shineWhenLow
      ? {
          icon: "🌧️",
          heading: pick(locale, "When this friendship struggles", "이 우정이 조심해야 하는 순간"),
          body: snap.shineWhenLow,
        }
      : null,
  ].filter((x): x is NonNullable<typeof x> => x != null);

  return (
    <ChapterSection
      id="ch02_why_us"
      n="1"
      title={section.title}
      lead={pick(
        locale,
        "Why you clicked so quickly, and what keeps you naturally drawn to each other.",
        "왜 우리는 빠르게 친해졌고, 만날수록 서로의 무엇에 끌리는가?",
      )}
    >
      <SharedWhyYouMeUsSection
        id="why_you_me_us_body"
        eyebrow=""
        title=""
        data={section.data}
        names={{ a: nameA, b: nameB }}
        locale={locale}
      />

      {shineItems.length > 0 && (
        <div className="mt-10">
          <div className="my-8 flex items-center gap-4">
            <span className="shrink-0 font-rel-sans text-[10px] uppercase tracking-[0.22em] text-rel-ink-mute">
              {pick(locale, "Shines / Struggles", "빛나는 순간 / 조심할 순간")}
            </span>
            <span className="h-px flex-1 bg-rel-line" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {shineItems.map((item, i) => (
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
        </div>
      )}
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 2: 서로에게 어떤 친구인가 ------------------- */

export function Chapter03Roles({ vm, locale }: Ctx) {
  const social = findSection(vm, "social_dna") as SocialDnaSectionVM | undefined;
  const deepRead = findSection(vm, "deep_read") as DeepReadSectionVM | undefined;
  const isKo = locale !== "en-US";
  if (!social) return null;

  const me = social.dna.me;
  const partner = social.dna.partner;
  const pairSynth = (me as { pair_synthesis?: { label: string; lineAtoB?: string; lineBtoA?: string; description: string } }).pair_synthesis;

  const people = [
    { key: "a" as const, person: me, partnerName: partner.nickname, voice: deepRead?.vm.meNature },
    { key: "b" as const, person: partner, partnerName: me.nickname, voice: deepRead?.vm.partnerNature },
  ];

  return (
    <ChapterSection
      id="ch03_roles"
      n="2"
      title={pick(locale, "Friendship Identity & Directional Roles", "서로에게 어떤 친구인가")}
      lead={pick(
        locale,
        "What kind of friend each of you inherently is, and what unique strength you bring into each other's life.",
        "나는 원래 어떤 친구이고, 이 사람에게는 특별히 어떤 힘이 되는가?",
      )}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {people.map(({ key, person, partnerName, voice }, i) => {
          const profile = (person as { four_slot_profile?: import("@/lib/relationship/friend/friendCharacterEngine").FourSlotFriendProfile }).four_slot_profile;
          const group = profile?.groupSlot;
          const oneOnOne = profile?.oneOnOneSlot;
          const support = profile?.supportSlot;
          const directional = person.guardian_character;

          return (
            <Reveal key={key} delay={i * 90}>
              <article
                className={`h-full rounded-2xl border bg-rel-surface p-6 ${
                  key === "a" ? "border-v4-a/25" : "border-v4-b/25"
                }`}
              >
                <div className="mb-4">
                  <NameChip name={person.nickname} side={key} />
                </div>

                <div className="space-y-5">
                  <div>
                    <dt className="font-rel-sans text-[11px] font-semibold tracking-wide text-rel-ink-mute">
                      {isKo ? "친구들 사이에서는" : "In Friendship Groups"}
                    </dt>
                    <dd className="mt-1 font-rel-sans text-[14px] font-bold leading-[1.4] text-rel-ink">
                      {group?.label ?? (isKo ? "부담 없이 편안하게 어울리는 쪽" : "Comfortably blends into groups")}
                    </dd>
                    <dd className="mt-1 font-rel-sans text-[12.5px] leading-[1.65] text-rel-ink-mute">
                      {group?.description ?? person.friend_position}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-rel-sans text-[11px] font-semibold tracking-wide text-rel-ink-mute">
                      {isKo ? "둘이 있을 때는" : "One-on-One"}
                    </dt>
                    <dd className="mt-1 font-rel-sans text-[14px] font-bold leading-[1.4] text-rel-ink">
                      {oneOnOne?.label ?? (isKo ? "소소한 일상을 편하게 나누는 친구" : "Easygoing 1-on-1 companion")}
                    </dd>
                    <dd className="mt-1 font-rel-sans text-[12.5px] leading-[1.65] text-rel-ink-mute">
                      {oneOnOne?.description ?? person.battery_description}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-rel-sans text-[11px] font-semibold tracking-wide text-rel-ink-mute">
                      {isKo ? "친구가 힘들 때는" : "When a Friend Needs Support"}
                    </dt>
                    <dd className="mt-1 font-rel-sans text-[14px] font-bold leading-[1.4] text-rel-ink">
                      {support?.label ?? (isKo ? "말보다 꾸준히 곁을 지키는 친구" : "Steadily stands by your side")}
                    </dd>
                    <dd className="mt-1 font-rel-sans text-[12.5px] leading-[1.65] text-rel-ink-mute">
                      {support?.description ?? (isKo ? "화려하게 위로하기보다 흔들림 없이 곁에 있어줘요." : "Offers steady presence during difficult times.")}
                    </dd>
                  </div>

                  {directional ? (
                    <div className="rounded-xl border border-rel-line/70 bg-rel-bg/50 p-3.5">
                      <dt className="font-rel-sans text-[11px] font-semibold tracking-wide text-rel-accent">
                        {isKo ? `${partnerName}에게 나는` : `For ${partnerName}`}
                      </dt>
                      <dd className="mt-1 font-rel-serif text-[14.5px] font-semibold leading-[1.4] text-rel-ink">
                        {directional.label}
                      </dd>
                      <dd className="mt-1 font-rel-sans text-[12.5px] leading-[1.65] text-rel-ink-mute">
                        {directional.description}
                      </dd>
                    </div>
                  ) : null}
                </div>

                {voice && (voice.voice || voice.description) ? (
                  <div className="mt-5 border-t border-rel-line/60 pt-4">
                    <span className="font-rel-sans text-[10px] uppercase tracking-[0.18em] text-rel-ink-mute">
                      {key === "a" ? "MY NATURE" : "PARTNER NATURE"}
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
          );
        })}
      </div>

      <div className="mt-8">
        <Rule label={pick(locale, "When We Come Together", "우리가 만나면")} />
        <Reveal>
          <figure
            data-shareable="friend-synthesis"
            className="rounded-3xl border border-rel-deep/20 bg-rel-deep px-7 py-9 text-center sm:px-12 sm:py-11"
          >
            <figcaption className="font-rel-sans text-[10px] uppercase tracking-[0.28em] text-white/55">
              {me.nickname} × {partner.nickname}
            </figcaption>
            <p className="mt-4 font-rel-serif text-[20px] font-semibold leading-[1.5] tracking-[-0.01em] text-white sm:text-[23px]">
              &ldquo;{pairSynth?.label ?? (isKo ? "서로의 강점이 자연스럽게 맞물리는 조합" : "Complementary Friendship Synergy")}&rdquo;
            </p>

            {pairSynth?.description ? (
              <p className="mx-auto mt-3 max-w-[48ch] font-rel-sans text-[13.5px] leading-[1.8] text-white/80">
                {pairSynth.description}
              </p>
            ) : null}
          </figure>
        </Reveal>
      </div>
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 3: 일상 템포와 소통 케미 (11-AXIS PRIMARY HOME) ------------------- */

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
      n="3"
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

/* ------------------- CHAPTER 4: 같이 놀 때 우리는 어떤 팀인가 ------------------- */

/** Friend VNext Ch4-8 — generic renderer for evidence-backed ◤ sub-blocks. */
function VNextBlocksSection({
  blocks,
}: {
  blocks:
    | {
        title: string;
        headline: string;
        description: string;
        compare?: { name: string; label?: string; body: string }[];
      }[]
    | undefined;
}) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className="mt-8 space-y-4">
      {blocks.map((b, i) => (
        <div key={i} className="rounded-2xl border border-rel-line bg-rel-surface p-6">
          <dt className="font-rel-sans text-[11px] font-semibold tracking-wide text-rel-ink-mute">
            {b.title}
          </dt>
          {b.compare && b.compare.length > 1 ? (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {b.compare.map((c, ci) => (
                <div
                  key={ci}
                  className="rounded-xl border border-rel-line/70 bg-rel-bg/50 p-4"
                >
                  <NameChip name={c.name} side={ci === 0 ? "a" : "b"} />
                  {c.label ? (
                    <dd className="mt-2 font-rel-sans text-[13px] font-bold leading-[1.4] text-rel-ink">{c.label}</dd>
                  ) : null}
                  <dd className="mt-1 font-rel-sans text-[12.5px] leading-[1.65] text-rel-ink-mute">{c.body}</dd>
                </div>
              ))}
            </div>
          ) : (
            <>
              <dd className="mt-1 font-rel-sans text-[14px] font-bold leading-[1.4] text-rel-ink">{b.headline}</dd>
              <dd className="mt-1 font-rel-sans text-[12.5px] leading-[1.65] text-rel-ink-mute">{b.description}</dd>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function Chapter05Teamwork({ vm, locale }: Ctx) {
  const ch04Vm = vm.chapters?.find((c) => c.chapterKey === "ch04_play_travel");

  return (
    <ChapterSection
      id="ch05_teamwork"
      n="4"
      title={pick(locale, "Play & Travel Teamwork Dynamic", "같이 놀 때 우리는 어떤 팀인가")}
      lead={pick(
        locale,
        "When making plans or traveling together, how do your roles and energy paces divide?",
        "함께 약속을 잡거나 여행을 갈 때 우리의 역할 분담과 팀워크는 어떠한가?",
      )}
    >
      <VNextBlocksSection blocks={ch04Vm?.vNextBlocks} />
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 5: 고민 상담과 제3자 관계 다이내믹 ------------------- */

export function Chapter06CounselingGroup({ vm, locale }: Ctx) {
  const ch05Vm = vm.chapters?.find((c) => c.chapterKey === "ch05_communication_third_person");

  return (
    <ChapterSection
      id="ch06_counseling_group"
      n="5"
      title={pick(locale, "When You're Struggling, What Kind of Friend Are We", "힘들 때 우리는 어떤 친구인가")}
      lead={pick(
        locale,
        "What kind of help do you give and receive from each other in hard moments?",
        "힘든 순간 서로에게 어떤 도움을 주고받는지 봅니다.",
      )}
    >
      <VNextBlocksSection blocks={ch05Vm?.vNextBlocks} />
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 6: 서운함과 관계 회복의 기술 ------------------- */

export function Chapter07ConflictRepair({ vm, locale }: Ctx) {
  const ch06Vm = vm.chapters?.find((c) => c.chapterKey === "ch06_conflict_repair");

  return (
    <ChapterSection
      id="ch07_conflict_repair"
      n="6"
      title={pick(locale, "How We Change When We're Hurt", "서운할 때 우리는 어떻게 달라지는가")}
      lead={pick(
        locale,
        "How friction arises when you clash, and the exact steps to clear up misunderstandings.",
        "서운함이 생기면 각자는 어떻게 반응하고, 그 차이가 어떻게 갈등과 회복으로 이어지는가?",
      )}
    >
      <VNextBlocksSection blocks={ch06Vm?.vNextBlocks} />
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 7: 이 우정에서 기대하지 말아야 할 것 ------------------- */

export function Chapter08Boundaries({ vm, locale }: Ctx) {
  const ch07Vm = vm.chapters?.find((c) => c.chapterKey === "ch07_expectation_boundaries");

  return (
    <ChapterSection
      id="ch08_boundaries"
      n="7"
      title={pick(locale, "The Line Even Close Friends Shouldn't Cross", "친해도 넘지 말아야 할 선")}
      lead={pick(
        locale,
        "What should be respected even between close friends, and what expectations make things hard if you hold onto them?",
        "친한 친구라도 무엇은 지켜줘야 하고, 무엇까지 기대하면 서로 힘들어지는가?",
      )}
    >
      <VNextBlocksSection blocks={ch07Vm?.vNextBlocks} />
    </ChapterSection>
  );
}

/* ------------------- CHAPTER 8: 오래가는 우정의 거리감 ------------------- */

export function Chapter09Distance({ vm, locale }: Ctx) {
  const ch08Vm = vm.chapters?.find((c) => c.chapterKey === "ch08_distance_durability");

  return (
    <ChapterSection
      id="ch09_distance_durability"
      n="8"
      title={pick(locale, "The Distance That Makes a Friendship Last", "오래가는 우정의 거리")}
      lead={pick(
        locale,
        "How often do you need to connect to feel comfortable, and what does it take for this to last?",
        "우리는 얼마나 자주 연결되어야 편하며, 무엇이 있어야 오래 이어지는가?",
      )}
    >
      <VNextBlocksSection blocks={ch08Vm?.vNextBlocks} />
    </ChapterSection>
  );
}

/** Renders an advice item with title/reason/speech-tip visually separated
 * instead of joined into one run-on "title — reason — 💬 quote" line. */
function AdviceItem({ item }: { item: unknown }) {
  if (typeof item === "string") return <>{item}</>;
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const title = typeof obj.actionTitle === "string" ? obj.actionTitle : typeof obj.action_title === "string" ? obj.action_title : typeof obj.title === "string" ? obj.title : "";
    const reason = typeof obj.reason === "string" ? obj.reason : typeof obj.saju_reason === "string" ? obj.saju_reason : typeof obj.body === "string" ? obj.body : "";
    const speechTip = typeof obj.speechTip === "string" ? obj.speechTip : typeof obj.real_speech_tip === "string" ? obj.real_speech_tip : "";
    if (title || reason || speechTip) {
      return (
        <span className="block">
          {title && <strong className="font-semibold text-rel-ink">{title}</strong>}
          {reason && <span className="mt-0.5 block text-rel-ink-soft">{reason}</span>}
          {speechTip && (
            <span className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-rel-bg/70 px-2.5 py-1.5 text-[12px] leading-[1.5] text-rel-ink-mute">
              <span aria-hidden className="shrink-0">💬</span>
              <span>&ldquo;{speechTip}&rdquo;</span>
            </span>
          )}
        </span>
      );
    }
  }
  return <>{String(item ?? "")}</>;
}

/* ------------------- CHAPTER 9: 우리 우정 사용설명서 ------------------- */

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
      n="9"
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
              {prescription.items.flatMap((item) => item.do_list).map((line, idx) => (
                <li key={idx} className="flex gap-2 font-rel-sans text-[13px] leading-[1.7] text-emerald-950">
                  <span className="font-bold text-emerald-700">·</span>
                  <AdviceItem item={line} />
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-rose-200/70 bg-rose-50/40 p-5">
            <h4 className="flex items-center gap-2 border-b border-rose-200 pb-2.5 font-rel-sans text-[13px] font-bold text-rose-900">
              <span aria-hidden>🚫</span>
              {pick(locale, "Things to avoid doing to each other", "이 우정에서 주의해야 할 행동 (Don't)")}
            </h4>
            <ul className="mt-3.5 space-y-2.5">
              {prescription.items.flatMap((item) => item.dont_list).map((line, idx) => (
                <li key={idx} className="flex gap-2 font-rel-sans text-[13px] leading-[1.7] text-rose-950">
                  <span className="font-bold text-rose-700">·</span>
                  <AdviceItem item={line} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {/* Deep Read Advice per person */}
      {(adviceForMe.length > 0 || adviceForPartner.length > 0) && (
        <div className="mt-10 border-t border-rel-line pt-8">
          <h4 className="font-rel-sans text-[12px] font-semibold tracking-[0.06em] text-rel-ink">
            {t.deepReadTitle}
          </h4>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-rel-line bg-rel-surface p-4">
              <NameChip name={vm.opening.names[0]} side="a" />
              <ul className="mt-3 space-y-3 font-rel-sans text-[13px] leading-[1.7] text-rel-ink-soft">
                {adviceForMe.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 text-rel-ink-mute">·</span>
                    <AdviceItem item={item} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-rel-line bg-rel-surface p-4">
              <NameChip name={vm.opening.names[1]} side="b" />
              <ul className="mt-3 space-y-3 font-rel-sans text-[13px] leading-[1.7] text-rel-ink-soft">
                {adviceForPartner.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 text-rel-ink-mute">·</span>
                    <AdviceItem item={item} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {together && (
        <div className="mt-8 rounded-2xl bg-rel-deep/5 p-5">
          <span className="font-rel-sans text-[11px] font-semibold tracking-[0.08em] text-rel-deep">
            {t.deepReadTogetherLabel}
          </span>
          <p className="mt-2 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink">{together}</p>
        </div>
      )}
    </ChapterSection>
  );
}

export function FriendHero({ vm, locale }: Ctx) {
  return (
    <header className="mb-12 border-b border-rel-line pb-10 text-center sm:mb-16 sm:pb-14">
      <div className="inline-flex items-center gap-2 rounded-full border border-rel-line bg-rel-surface px-4 py-1.5 font-rel-sans text-[11.5px] tracking-[0.1em] text-rel-ink-mute">
        <span>{pick(locale, "Friendship Report", "우정 심화 리포트")}</span>
      </div>
      <h1 className="mt-6 font-rel-serif text-[28px] font-normal leading-[1.3] tracking-[-0.01em] text-rel-ink sm:text-[36px]">
        {vm.opening.names[0]} <span className="text-rel-ink-mute">×</span> {vm.opening.names[1]}
      </h1>
      {vm.opening.oneLineSummary ? (
        <blockquote className="mx-auto mt-6 max-w-[56ch] font-rel-serif text-[17px] leading-[1.7] text-rel-ink sm:text-[19px]">
          &ldquo;{vm.opening.oneLineSummary}&rdquo;
        </blockquote>
      ) : null}
    </header>
  );
}
