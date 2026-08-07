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
 */
import type { Locale } from "@/lib/i18n/locale";
import { pick } from "@/lib/relationship/friend/friendCopy";
import { useMessages } from "@/lib/i18n/LocaleProvider";
import type {
  FriendReportViewModel,
  BreakupGuideSection as BreakupGuideSectionVM,
  CompareTableSection as CompareTableSectionVM,
  DeEscalationSection as DeEscalationSectionVM,
  HiddenFlowSection as HiddenFlowSectionVM,
  PrescriptionSection as PrescriptionSectionVM,
  PsychRadarSection as PsychRadarSectionVM,
  SnapshotSection as SnapshotSectionVM,
  SocialDnaSection as SocialDnaSectionVM,
  SoulmateSection as SoulmateSectionVM,
} from "@/lib/relationship/friend/viewModel/friendReportSectionTypes";
import { Evidence, NameChip, Quote, Reveal, Rule, Scale, Section, VersusStrip } from "./FriendEditorialUI";
import { FriendEditorialRadar } from "./FriendEditorialRadar";

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
  const gradeReason = vm.opening.gradeReason;
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
          {gradeReason && gradeReason !== vm.opening.headline ? (
            <p className="mt-6 max-w-[54ch] font-rel-sans text-[15px] leading-[1.9] text-rel-ink-soft">
              {gradeReason}
            </p>
          ) : null}
          {vm.opening.grade && (
            <p className="mt-7 font-rel-sans text-[11px] tracking-[0.06em] text-rel-ink-mute">
              {pick(locale, "Reference grade", "참고 등급")}{" "}
              <span className="text-rel-ink-soft">{vm.opening.grade}</span>
            </p>
          )}
        </Reveal>
      </div>
    </header>
  );
}

/* -------------------------- 01 three core signals --------------------------- */

export function SignalsSection({ vm, locale }: Ctx) {
  const snap = findSection(vm, "snapshot") as SnapshotSectionVM | undefined;
  const t = useMessages().relationshipDrilldown.friendship;
  if (!snap) return null;
  const audit = snap.scoreCardAudit;

  const signals = [
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

  return (
    <Section
      id="overview"
      eyebrow={pick(locale, "01 · At a Glance", "01 · 한눈에 보기")}
      title={pick(locale, "What kind of friends are we?", "우리는 어떤 친구일까")}
      lead={pick(
        locale,
        "Three signals frame the shape of this friendship first. The numbers are just evidence — the reading is the point.",
        "세 가지 신호로 이 우정의 성격을 먼저 봅니다. 숫자는 근거일 뿐, 해석이 본문이에요.",
      )}
      tint="cream"
    >
      <ul className="space-y-8">
        {signals.map((s, i) => {
          const tone = s.inverted
            ? s.score <= 35
              ? "good"
              : s.score >= 60
                ? "warn"
                : "neutral"
            : s.score >= 65
              ? "good"
              : s.score <= 40
                ? "warn"
                : "neutral";
          return (
            <li key={s.key}>
              <Reveal delay={i * 70}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="flex min-w-0 items-center gap-2 font-rel-sans text-[14px] font-semibold tracking-[0.02em] text-rel-ink">
                    <span aria-hidden>{s.icon}</span>
                    {s.label}
                  </span>
                  <span className="shrink-0 font-rel-serif text-[22px] leading-none text-rel-ink">
                    {s.score}
                    <span className="ml-1 font-rel-sans text-[10px] tracking-[0.14em] text-rel-ink-mute">
                      {s.inverted ? pick(locale, "lower is better", "낮을수록 좋아요") : "/100"}
                    </span>
                  </span>
                </div>
                <div className="mt-3">
                  <Scale value={s.score} tone={tone as "good" | "neutral" | "warn"} />
                </div>
                {s.status ? (
                  <p className="mt-3 font-rel-sans text-[14px] leading-[1.75] text-rel-ink">{s.status}</p>
                ) : null}
                {s.definition ? (
                  <p className="mt-1 font-rel-sans text-[12.5px] leading-[1.7] text-rel-ink-mute">
                    {s.definition}
                  </p>
                ) : null}
                {s.why ? (
                  <Evidence label={pick(locale, "Why did this come out this way?", "왜 이렇게 나왔나요?")}>
                    {s.why}
                  </Evidence>
                ) : null}
              </Reveal>
            </li>
          );
        })}
      </ul>

      {(snap.shineWhenBest || snap.shineWhenLow) && (
        <>
          <Rule label={pick(locale, "Shines / Struggles", "빛나는 순간 / 조심할 순간")} />
          <div className="grid gap-6 sm:grid-cols-2">
            {snap.shineWhenBest ? (
              <Reveal>
                <div className="h-full rounded-2xl border border-v4-good/25 bg-v4-good-soft p-6">
                  <h3 className="font-rel-sans text-[13px] font-semibold tracking-[0.04em] text-v4-good">
                    ☀️ {pick(locale, "When this friendship shines", "이 우정이 빛나는 순간")}
                  </h3>
                  <p className="mt-4 font-rel-sans text-[13.5px] leading-[1.7] text-rel-ink">
                    {snap.shineWhenBest}
                  </p>
                </div>
              </Reveal>
            ) : null}
            {snap.shineWhenLow ? (
              <Reveal delay={90}>
                <div className="h-full rounded-2xl border border-rel-line bg-rel-surface p-6">
                  <h3 className="font-rel-sans text-[13px] font-semibold tracking-[0.04em] text-rel-ink-soft">
                    🌧️ {pick(locale, "When this friendship struggles", "이 우정이 조심해야 하는 순간")}
                  </h3>
                  <p className="mt-4 font-rel-sans text-[13.5px] leading-[1.7] text-rel-ink">
                    {snap.shineWhenLow}
                  </p>
                </div>
              </Reveal>
            ) : null}
          </div>
        </>
      )}
    </Section>
  );
}

/* ----------------------- 02 part 1 · 입체 진단 + 11축 ----------------------- */

export function DimensionsSection({ vm, viewerIsReportA, locale }: Ctx) {
  const compare = findSection(vm, "compare_table") as CompareTableSectionVM | undefined;
  const radar = findSection(vm, "psych_radar") as PsychRadarSectionVM | undefined;
  if (!compare && !radar) return null;
  const [nameA, nameB] = vm.opening.names;

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

      {radar ? (
        <>
          <Rule label={pick(locale, "Psych 11-Axis", "심리 11축")} />
          {radar.highlights.length > 0 ? (
            <ul className="space-y-5">
              {radar.highlights.map((h, i) => {
                const color =
                  h.match_type === "similarity"
                    ? "text-v4-good border-v4-good/30"
                    : h.match_type === "tension"
                      ? "text-v4-bad border-v4-bad/30"
                      : "text-rel-deep border-rel-deep/25";
                return (
                  <li key={h.axis_key}>
                    <Reveal delay={i * 60}>
                      <div className={`border-l-2 pl-4 ${color}`}>
                        <p className="font-rel-sans text-[12.5px] font-semibold tracking-[0.04em]">{h.hook}</p>
                        <p className="mt-1.5 font-rel-sans text-[13.5px] leading-[1.8] text-rel-ink-soft">
                          {h.narrative}
                        </p>
                      </div>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <div className="mt-10">
            <Reveal>
              <FriendEditorialRadar axisResults={radar.axisResults} aName={nameA} bName={nameB} />
            </Reveal>
            <Evidence label={pick(locale, "How do I read the 11 axes?", "11축은 어떻게 읽나요?")}>
              {radar.chartNote}
            </Evidence>
          </div>
        </>
      ) : null}
    </Section>
  );
}

/* --------------------------- 03 part 2 · Social DNA -------------------------- */

export function SocialDnaSection({ vm, locale }: Ctx) {
  const social = findSection(vm, "social_dna") as SocialDnaSectionVM | undefined;
  const t = useMessages().relationshipDrilldown.friendship;
  if (!social) return null;
  const people = [
    { key: "a" as const, person: social.dna.me },
    { key: "b" as const, person: social.dna.partner },
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
        {people.map(({ key, person }, i) => (
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
  if (!de && !prescription) return null;

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
