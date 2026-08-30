"use client";

/**
 * Marriage/Cohabitation Premium — MarriageReportViewModel 전용 렌더러.
 * work·friend의 SectionRenderer.tsx와 동일한 패턴 — en-US/ko-KR 둘 다
 * production에서 쓰인다(ko-KR 전용 게이트 금지). 카드 내부 라벨은 전부
 * `useMessages().relationshipDrilldown.cohabitation`에서 가져온다.
 */
import type { ReactNode } from "react";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import { User, MessageCircle, Sun, Cloud, CloudLightning } from "lucide-react";
import RelationshipReportCard, {
  RelationshipReportBody,
  RelationshipReportParagraph,
  RelationshipReportLabel,
  RelationshipReportInset,
  MarriageEditorialHero,
} from "@/components/relationship/marriage/editorial/marriageEditorialAdapter";
import {
  default as TriScoreSnapshotPanel,
} from "@/components/relationship/TriScoreSnapshotPanel";
import { OverviewSection } from "@/components/relationship/shared/overview/OverviewSection";
import type { OverviewCardData } from "@/lib/relationship/shared/overview/overviewTypes";
import { pick } from "@/lib/relationship/friend/friendCopy";
import { josaIGa } from "@/lib/relationship/marriage/marriageChapter01Intelligence";
import { createDefaultMarriageChapter03Intelligence } from "@/lib/relationship/marriage/marriageChapter03Intelligence";
import { createDefaultMarriageChapter04Intelligence } from "@/lib/relationship/marriage/marriageChapter04Intelligence";
import { SubHeading } from "@/components/relationship/shared/editorial/EditorialPrimitives";
import PairPrescriptionSection from "@/components/relationship/shared/PairPrescriptionSection";
import { MarriageChapter07View } from "./MarriageChapter07View";
import { MarriageChapter08View } from "./MarriageChapter08View";
import type {
  BedroomSection,
  CompareTableSection,
  DailyLifeMirrorSection,
  DeepReadSection,
  FamilyBoundarySection,
  HomeDnaSection,
  MarriageReportSection,
  MarriageReportViewModel,
  MoneyChoresSection,
  OriginStorySection,
  ParentingSection,
  PrescriptionSection,
  PrivacySection,
  PsychRadarSection,
  UpsetSection,
  WarningSection,
  WeatherForecastSection,
} from "@/lib/relationship/marriage/viewModel/marriageReportSectionTypes";
import DeepReadCard from "@/components/relationship/shared/DeepReadCard";
import { useMessages, useLocale } from "@/lib/i18n/LocaleProvider";
import { MarriageChapterNav, MarriageChapterSection } from "@/components/relationship/marriage/chapters/MarriageChapterShell";
import type { ActionPlanItem, CoupleActionPlanSection } from "@/lib/relationship/enrichment/marriageCoupleActionPlan";
import { VersusStrip } from "@/components/relationship/shared/editorial/EditorialPrimitives";
import { PsychAxisComparisonSection } from "@/components/relationship/shared/psychAxis/PsychAxisComparisonSection";
import type { MarriageCanonicalBundle } from "@/lib/relationship/marriage/marriageCanonicalTypes";

const relSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rel-sans-var",
});
const relSerif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rel-serif-var",
});

/** Shared editorial accent (rel-deep) — matches Romantic V4 / Friend, not the old per-domain purple. */
const ACCENT = "#1b3b2b";

/** Pre-existing gap — used below (CHAPTER_GROUPS/BONUS_CHAPTER_TYPES/byType) but never declared. */
type MarriageSectionType = MarriageReportSection["type"];

/** 하드코딩 이모지 대신 — 3년 날씨 레벨 → Lucide 아이콘 + 테마 컬러. */
const WEATHER_ICON: Record<string, { Icon: typeof Sun; className: string }> = {
  sunny: { Icon: Sun, className: "text-v4-good" },
  cloudy: { Icon: Cloud, className: "text-rel-taupe" },
  storm: { Icon: CloudLightning, className: "text-v4-bad" },
};

/** 사람 이름 앞에 붙는 원형 아이콘 뱃지 — 👤 대체. */
function PersonBadge() {
  return (
    <span
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}
    >
      <User className="h-3 w-3" strokeWidth={2} aria-hidden />
    </span>
  );
}

// ---- Canonical 9(+1)-Chapter Structure (Phase 7 Final Synthesis) --------------
// 순서 근거: decisions/033_marriage-report-part-reorder.md. `id`는 절대 바꾸지
// 않는다 — buildCanonicalMarriageStoryPlan.ts가 이 정확한 chapterId 문자열로
// 챕터별 summary/userQuestion을 채워 넣고, 아래 렌더러의 하드코딩된 특수 블록
// (ExpertVoiceBlock/EconomicPartnershipCard/ConflictSubstantiveCard/
// Chapter07SubstantiveCard/LifePartnershipVerdictCard/MarriageActionPlaybookCard
// 등)도 `cDef.id === "..."`로 매칭한다. 배열 "순서"와 "number" 표시값만 바꿔서
// 화면 순서를 재배치하고, id·types·특수 블록 매칭은 그대로 둔다.
// c6에서 weather_forecast만 분리해 새 c10으로 뺀 것이 유일한 types 변경 —
// c6엔 전용 하드코딩 블록이 없어 안전하다. c10은 buildCanonicalMarriageStoryPlan
// 쪽에 대응 chapterId가 없어 💡 요약 인셋만 없고, 카드 자체는 정상 렌더된다.
const CANONICAL_CHAPTER_DEFINITIONS: Array<{
  id: string;
  number: string;
  titleKo: string;
  titleEn: string;
  types: Array<MarriageReportSection["type"]>;
}> = [
  { id: "c1_who_we_are", number: "01", titleKo: "우리는 어떤 부부인가", titleEn: "Who We Are as a Married Couple", types: ["origin_story", "daily_life_mirror"] },
  { id: "c2_lifestyle_dna", number: "02", titleKo: "함께 살 때 각자의 라이프스타일과 기질", titleEn: "Life Style & Household DNA", types: ["psych_radar", "compare_table", "home_dna"] },
  { id: "c7_longterm_compounding", number: "03", titleKo: "함께 살수록 쌓이는 자산과 부채", titleEn: "Long-Term Compounding: Assets & Liabilities", types: [] },
  { id: "c4_intimacy_bedroom", number: "04", titleKo: "사랑, 신체적 친밀감과 침실 이야기", titleEn: "Physical Intimacy & Bedroom Chemistry", types: ["bedroom"] },
  { id: "c3_household_os", number: "05", titleKo: "돈, 생활력, 그리고 우리 집을 굴리는 방식", titleEn: "Household OS: Money, Life Competence & Mental Load", types: ["money_chores"] },
  { id: "c6_family_parenting_career", number: "06", titleKo: "둘을 넘어 가족이 되면 어떤 시스템이 되는가?", titleEn: "Family System & Parenting", types: ["parenting", "family_boundary"] },
  { id: "c5_conflict_deescalation", number: "07", titleKo: "왜 싸우고, 어떻게 다시 가까워지는가?", titleEn: "Conflict, De-Escalation & SOS Script", types: [] },
  { id: "c9_next_chapter_rituals", number: "08", titleKo: "앞으로 우리에게 어떤 시간이 찾아올까?", titleEn: "What Time Lies Ahead for Us", types: [] },
];

// 레거시 폴백(canonicalStoryPlan 없는 옛 캐시 리포트)
const CHAPTER_GROUPS: Array<{
  id: string;
  types: Exclude<MarriageSectionType, "household_snapshot">[];
  titleKo: string;
  titleEn: string;
}> = [
  {
    id: "ch_temperature",
    types: ["origin_story", "daily_life_mirror"],
    titleKo: "한눈에 보는 우리 부부의 온도",
    titleEn: "Your Marriage at a Glance",
  },
  {
    id: "ch_life_sync",
    types: ["psych_radar", "compare_table", "home_dna"],
    titleKo: "함께 사는 방식과 라이프 시너지",
    titleEn: "How You Live Together",
  },
  {
    id: "ch_theme_playbook",
    types: ["bedroom", "money_chores", "parenting", "family_boundary"],
    titleKo: "다름을 무기로 — 우리 집 실전 역할 분담",
    titleEn: "Turning Differences into Teamwork",
  },
  {
    id: "ch_weather",
    types: ["weather_forecast"],
    titleKo: "향후 3년의 홈 리스크 기상도",
    titleEn: "Your 3-Year Home Risk Forecast",
  },
];

/** deep_read renders after the 8 core chapters, unnumbered — see comment above. */
const BONUS_CHAPTER_TYPES: MarriageSectionType[] = ["deep_read"];

// ---- Part 1: 우리가 부부가 된 이유 (낭만/운명 서사) --------------------------

function OriginStoryCard({
  section,
  names,
}: {
  section: OriginStorySection;
  names: [string, string];
}) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  const { locale } = useLocale();
  const isEn = locale === "en-US";
  const b = section.ch01Bundle;

  if (!b) {
    return (
      <RelationshipReportCard title={section.title} accentColor={ACCENT}>
        <RelationshipReportBody>
          <div>
            <RelationshipReportLabel>{t.originStoryWhyUsLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.whyUs}</RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>{t.originStoryPositiveChangeLabel(names[0])}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">
              {section.positiveChangeA}
            </RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>{t.originStoryPositiveChangeLabel(names[1])}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">
              {section.positiveChangeB}
            </RelationshipReportParagraph>
          </div>
        </RelationshipReportBody>
      </RelationshipReportCard>
    );
  }

  const name0IGa = josaIGa(names[0]);
  const name1IGa = josaIGa(names[1]);

  return (
    <div className="space-y-6">
      {/* 1. 왜 처음 서로에게 끌렸을까 */}
      <RelationshipReportCard title={isEn ? "Why we were drawn to each other at first" : "왜 처음 서로에게 끌렸을까"} accentColor={ACCENT}>
        <RelationshipReportBody>
          <div className="space-y-4">
            {b.attraction.drivers.map((d, i) => (
              <div key={i} className="rounded-xl border border-rel-line bg-rel-surface-soft p-4 space-y-2">
                <div className="text-xs font-semibold tracking-wider text-rel-accent uppercase">
                  {d.categoryLabel}
                </div>
                <div className="text-base font-semibold text-rel-ink">
                  {d.headline}
                </div>
                {d.whatDrawsA && d.whatDrawsB ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs text-rel-ink-soft">
                    <div className="rounded-lg bg-rel-surface p-2.5 border border-rel-line/50">
                      <span className="font-semibold text-rel-ink">{names[0]}: </span>
                      {d.whatDrawsA}
                    </div>
                    <div className="rounded-lg bg-rel-surface p-2.5 border border-rel-line/50">
                      <span className="font-semibold text-rel-ink">{names[1]}: </span>
                      {d.whatDrawsB}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-rel-ink-soft leading-relaxed">
                    {d.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </RelationshipReportBody>
      </RelationshipReportCard>

      {/* 2. 좋아하는 것을 넘어, 왜 서로가 필요했을까 */}
      <RelationshipReportCard title={isEn ? "Beyond just liking each other — why you needed each other" : "좋아하는 것을 넘어, 왜 서로가 필요했을까"} accentColor={ACCENT}>
        <RelationshipReportBody>
          <div className="space-y-5">
            <div className="rounded-xl border border-rel-line bg-rel-surface p-4 space-y-2">
              <RelationshipReportLabel>{isEn ? `Why ${names[1]} is needed for ${names[0]}` : `${names[0]}에게 ${name1IGa} 필요한 이유`}</RelationshipReportLabel>
              <p className="text-sm text-rel-ink-soft leading-relaxed">
                {b.mutualNeed.needAtoB.whyPartnerIsNeeded}
              </p>
              <div className="mt-2 text-xs text-rel-accent font-medium">
                ✓ {b.mutualNeed.needAtoB.deliveryStatusNarrative}
              </div>
            </div>

            <div className="rounded-xl border border-rel-line bg-rel-surface p-4 space-y-2">
              <RelationshipReportLabel>{isEn ? `Why ${names[0]} is needed for ${names[1]}` : `${names[1]}에게 ${name0IGa} 필요한 이유`}</RelationshipReportLabel>
              <p className="text-sm text-rel-ink-soft leading-relaxed">
                {b.mutualNeed.needBtoA.whyPartnerIsNeeded}
              </p>
              <div className="mt-2 text-xs text-rel-accent font-medium">
                ✓ {b.mutualNeed.needBtoA.deliveryStatusNarrative}
              </div>
            </div>
          </div>
        </RelationshipReportBody>
      </RelationshipReportCard>

      {/* 3. 나는 이 사람에게 어떤 존재일까 */}
      <RelationshipReportCard title={isEn ? "What I am to this person" : "나는 이 사람에게 어떤 존재일까"} accentColor={ACCENT}>
        <RelationshipReportBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-rel-line bg-rel-surface p-4 space-y-2">
              <div className="text-xs font-semibold text-rel-accent">
                {`${names[0]} → ${names[1]}`}
              </div>
              <div className="text-base font-semibold text-rel-ink">
                {b.directionalMeaning.meaningAtoB.roleTitle}
              </div>
              <p className="text-sm text-rel-ink-soft leading-relaxed">
                {b.directionalMeaning.meaningAtoB.description}
              </p>
            </div>

            <div className="rounded-xl border border-rel-line bg-rel-surface p-4 space-y-2">
              <div className="text-xs font-semibold text-rel-accent">
                {`${names[1]} → ${names[0]}`}
              </div>
              <div className="text-base font-semibold text-rel-ink">
                {b.directionalMeaning.meaningBtoA.roleTitle}
              </div>
              <p className="text-sm text-rel-ink-soft leading-relaxed">
                {b.directionalMeaning.meaningBtoA.description}
              </p>
            </div>
          </div>
        </RelationshipReportBody>
      </RelationshipReportCard>

      {/* 4. 이 사람과 함께하며 나는 어떻게 달라질까 */}
      <RelationshipReportCard title={isEn ? "How I change by being with this person" : "이 사람과 함께하며 나는 어떻게 달라질까"} accentColor={ACCENT}>
        <RelationshipReportBody>
          <div className="space-y-5">
            {[
              {
                personName: names[0],
                partnerName: names[1],
                titleLabel: isEn ? `How ${names[0]} changes with ${names[1]}` : `${names[0]}님이 ${names[1]}님과 함께하며`,
                data: b.mutualTransformation.transformationA,
              },
              {
                personName: names[1],
                partnerName: names[0],
                titleLabel: isEn ? `How ${names[1]} changes with ${names[0]}` : `${names[1]}님이 ${names[0]}님과 함께하며`,
                data: b.mutualTransformation.transformationB,
              },
            ].map(({ personName, partnerName, titleLabel, data }, idx) => (
              <div key={idx} className="rounded-xl border border-rel-line bg-rel-surface p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-rel-line pb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rel-accent">
                    {personName}
                  </span>
                  <h4 className="text-sm font-bold text-rel-ink">
                    {titleLabel}
                  </h4>
                </div>

                {data.beforeState && data.partnerInfluence && data.emergingSelf ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                    <div className="rounded-lg bg-rel-surface-soft p-3 space-y-1 border border-rel-line/50">
                      <div className="text-[11px] font-semibold text-rel-ink-soft/70">
                        {isEn ? "The way they've always leaned on" : "본래 많이 쓰는 방식"}
                      </div>
                      <p className="text-xs text-rel-ink leading-relaxed">
                        {data.beforeState}
                      </p>
                    </div>

                    <div className="rounded-lg bg-rel-surface-soft p-3 space-y-1 border border-rel-line/50">
                      <div className="text-[11px] font-semibold text-rel-accent">
                        {isEn ? `What ${partnerName} adds to the mix` : `${partnerName}님이 더해주는 자극`}
                      </div>
                      <p className="text-xs text-rel-ink leading-relaxed">
                        {data.partnerInfluence}
                      </p>
                    </div>

                    <div className="rounded-lg bg-amber-500/10 dark:bg-amber-500/20 p-3 space-y-1 border border-amber-500/30">
                      <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        {isEn ? "The strength growing in this relationship" : "관계 안에서 넓어지는 힘"}
                      </div>
                      <p className="text-xs font-medium text-rel-ink leading-relaxed">
                        {data.emergingSelf}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-rel-ink-soft leading-relaxed">
                    {data.primaryTransformation}
                  </p>
                )}

                {data.shadowTransformation ? (
                  <div className="mt-2 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-start gap-1.5">
                    <span className="shrink-0 font-bold">{isEn ? "⚠️ Watch for:" : "⚠️ 주의:"}</span>
                    <span>{data.shadowTransformation}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </RelationshipReportBody>
      </RelationshipReportCard>

      {/* 5. 그래서 우리는 어떤 부부일까 */}
      <RelationshipReportCard title={isEn ? "So what kind of couple are we?" : "그래서 우리는 어떤 부부일까"} accentColor={ACCENT}>
        <RelationshipReportBody>
          <div className="rounded-xl border border-rel-accent/30 bg-rel-accent/5 p-5 space-y-2">
            <div className="text-lg font-bold text-rel-ink">
              {b.coupleIdentity.title}
            </div>
            <p className="text-sm text-rel-ink-soft leading-relaxed">
              {b.coupleIdentity.synthesisNarrative}
            </p>
          </div>
        </RelationshipReportBody>
      </RelationshipReportCard>
    </div>
  );
}

// ---- Part 1.5: 일상 모습 (일간/일지 결정론적 표) ------------------------------

function DailyLifeMirrorCard({ section }: { section: DailyLifeMirrorSection }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  const { vm } = section;
  const rows = [vm.personA, vm.personB];
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <RelationshipReportParagraph>{vm.intro}</RelationshipReportParagraph>
        {rows.map((p) => (
          <div key={p.nickname} className="space-y-3">
            {p.charm ? (
              <div>
                <RelationshipReportLabel>{t.dailyLifeMirrorCharmLabel(p.nickname)}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  <span className="font-semibold text-rel-ink">{p.charm.label}</span> — {p.charm.description}
                </RelationshipReportParagraph>
              </div>
            ) : null}
            {p.spouseTrait ? (
              <div>
                <RelationshipReportLabel>{t.dailyLifeMirrorSpouseTraitLabel(p.nickname)}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  <span className="font-semibold text-rel-ink">{p.spouseTrait.label}</span> — {p.spouseTrait.description}
                </RelationshipReportParagraph>
              </div>
            ) : null}
            {p.authority ? (
              <div>
                <RelationshipReportLabel>{t.dailyLifeMirrorAuthorityLabel(p.nickname)}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">
                  <span className="font-semibold text-rel-ink">{p.authority.label}</span> — {p.authority.description}
                </RelationshipReportParagraph>
              </div>
            ) : null}
            <div className="h-px w-full bg-rel-line" />
          </div>
        ))}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

// ---- Part 2: 스코어링 + 11축 매칭 + 비교표 + 자산관리 ------------------------

function CompareTableCard({
  section,
  viewerIsReportA,
  names,
}: {
  section: CompareTableSection;
  viewerIsReportA: boolean;
  names: [string, string];
}) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <ul className="space-y-12">
        {section.rows.map((row) => {
          const me = viewerIsReportA ? row.personA : row.personB;
          const partner = viewerIsReportA ? row.personB : row.personA;
          return (
            <li key={row.id}>
              <VersusStrip label={row.label} aName={names[0]} bName={names[1]} a={me.shortLabel} b={partner.shortLabel} />
              <RelationshipReportParagraph className="mt-3 text-rel-ink-soft">{row.meaning}</RelationshipReportParagraph>
              <div className="mt-8 h-px w-full bg-rel-line" />
            </li>
          );
        })}
      </ul>
    </RelationshipReportCard>
  );
}

function PsychRadarCard({ section, names }: { section: PsychRadarSection; names: [string, string] }) {
  const { locale } = useLocale();
  return (
    <div className="py-2">
      <PsychAxisComparisonSection
        axisResults={section.axisResults}
        highlights={[]}
        chartNote={locale === "en-US" ? "We compared how you two show up right now across the 11-axis survey." : "둘의 현재 모습을 11축으로 비교했어요."}
        names={names}
        locale={locale}
      />
    </div>
  );
}

function ActionPlanList({ heading, items }: { heading: string; items: ActionPlanItem[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <RelationshipReportLabel>{heading}</RelationshipReportLabel>
      <div className="mt-2 space-y-3">
        {items.map((item) => (
          <RelationshipReportInset key={item.title}>
            <p className="text-sm font-semibold text-rel-ink">{item.title}</p>
            <RelationshipReportParagraph className="mt-1.5">{item.body}</RelationshipReportParagraph>
            <RelationshipReportParagraph className="mt-1.5 flex items-start gap-2 italic text-v4-good">
              <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-v4-good" strokeWidth={1.75} aria-hidden />
              {item.quote}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
        ))}
      </div>
    </div>
  );
}

function CoupleActionPlanBlock({ plan }: { plan: CoupleActionPlanSection }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  return (
    <RelationshipReportCard title={t.coupleActionPlanCardTitle} accentColor={ACCENT}>
      <RelationshipReportBody>
        <ActionPlanList heading={t.coupleActionPlanForMeLabel} items={plan.forMe} />
        <ActionPlanList heading={t.coupleActionPlanForPartnerLabel} items={plan.forPartner} />
        <ActionPlanList heading={t.coupleActionPlanTogetherLabel} items={plan.together} />
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function MoneyChoresCard({ section, names }: { section: MoneyChoresSection; names?: [string, string] }) {
  const ch05 = section.ch05Intelligence;
  const { locale } = useLocale();
  const isEn = locale === "en-US";

  if (!ch05) return null;

  const nameA = names ? names[0] : "Person A";
  const nameB = names ? names[1] : "Person B";

  return (
    <div className="space-y-6">
      {/* 01. COUPLE_OPERATING_SYSTEM */}
      <div className="space-y-3 pt-1">
        <SubHeading title={ch05.coupleOperatingSystem.title} tone="deep" />
        <RelationshipReportInset className="border border-v4-good/30 bg-v4-good-soft/20 space-y-3 p-4 rounded-xl">
          <h4 className="text-sm font-extrabold text-rel-deep">{ch05.coupleOperatingSystem.teamTypeTitle}</h4>
          <div className="grid gap-2 text-xs sm:grid-cols-2 pt-1">
            {ch05.coupleOperatingSystem.capabilities.map((cap) => (
              <div key={cap.capabilityKey} className="bg-rel-surface p-2.5 rounded-lg border border-rel-line space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rel-deep">{cap.capabilityLabel}</span>
                  <span className="text-[11px] font-bold text-v4-good bg-v4-good-soft/40 px-2 py-0.5 rounded">{cap.leadName}</span>
                </div>
                <p className="text-rel-ink-soft leading-relaxed text-[11px] mt-1">{cap.narrative}</p>
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-rel-ink border-t border-v4-good/20 pt-2 font-medium">
            {ch05.coupleOperatingSystem.pairInsight}
          </p>
        </RelationshipReportInset>
      </div>

      {/* 02. MONEY_BEHAVIOR */}
      <div className="space-y-3 pt-1">
        <SubHeading title={ch05.moneyBehavior.title} tone="coral" />
        <RelationshipReportInset className="border border-rel-line bg-rel-surface space-y-3 p-4 rounded-xl">
          <div className="grid gap-3 text-xs sm:grid-cols-2">
            <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-1.5">
              <span className="font-bold text-rel-deep block">{isEn ? `${nameA}'s spending style` : `${nameA} 지출 성향`}</span>
              <p className="text-rel-ink text-xs"><b>{isEn ? "What matters:" : "중요 가치:"}</b> {ch05.moneyBehavior.importantValueA}</p>
              <p className="text-rel-ink-soft text-[11px]"><b>{isEn ? "When spending:" : "쓸 때:"}</b> {ch05.moneyBehavior.spendingStyleA}</p>
              <p className="text-rel-ink-soft text-[11px]"><b>{isEn ? "When saving:" : "모을 때:"}</b> {ch05.moneyBehavior.savingStyleA}</p>
            </div>
            <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-1.5">
              <span className="font-bold text-rel-deep block">{isEn ? `${nameB}'s spending style` : `${nameB} 지출 성향`}</span>
              <p className="text-rel-ink text-xs"><b>{isEn ? "What matters:" : "중요 가치:"}</b> {ch05.moneyBehavior.importantValueB}</p>
              <p className="text-rel-ink-soft text-[11px]"><b>{isEn ? "When spending:" : "쓸 때:"}</b> {ch05.moneyBehavior.spendingStyleB}</p>
              <p className="text-rel-ink-soft text-[11px]"><b>{isEn ? "When saving:" : "모을 때:"}</b> {ch05.moneyBehavior.savingStyleB}</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-rel-ink border-t border-rel-line/60 pt-2 font-medium">
            {ch05.moneyBehavior.togetherInsight}
          </p>
          {ch05.moneyBehavior.underPressureInsight ? (
            <p className="text-xs leading-relaxed text-rel-ink-soft bg-v4-good-soft/20 p-2.5 rounded-lg border border-v4-good/20 mt-2">
              💡 <b>{isEn ? "When money gets tight:" : "돈이 빠듯해지면:"}</b> {ch05.moneyBehavior.underPressureInsight}
            </p>
          ) : null}
        </RelationshipReportInset>
      </div>

      {/* 03. WEALTH_BUILDING_STYLE */}
      <div className="space-y-3 pt-1">
        <SubHeading title={ch05.wealthBuildingStyle.title} tone="deep" />
        <RelationshipReportInset className="border border-rel-line bg-rel-surface space-y-3 p-4 rounded-xl">
          <div className="grid gap-3 text-xs sm:grid-cols-2">
            <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-1">
              <span className="font-bold text-rel-deep block">{isEn ? `${nameA}'s approach to growing assets` : `${nameA} 자산 운용 결`}</span>
              <p className="text-rel-ink text-[11px]"><b>{isEn ? "Base tendency:" : "기본 성향:"}</b> {ch05.wealthBuildingStyle.baseStyleA}</p>
              <p className="text-rel-ink-soft text-[11px]"><b>{isEn ? "When they spot an opportunity:" : "기회를 볼 때:"}</b> {ch05.wealthBuildingStyle.opportunityStyleA}</p>
              <p className="text-v4-good text-[11px]"><b>{isEn ? "What tends to fit well:" : "잘 맞기 쉬운 방향:"}</b> {ch05.wealthBuildingStyle.naturalDirectionA}</p>
            </div>
            <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-1">
              <span className="font-bold text-rel-deep block">{isEn ? `${nameB}'s approach to growing assets` : `${nameB} 자산 운용 결`}</span>
              <p className="text-rel-ink text-[11px]"><b>{isEn ? "Base tendency:" : "기본 성향:"}</b> {ch05.wealthBuildingStyle.baseStyleB}</p>
              <p className="text-rel-ink-soft text-[11px]"><b>{isEn ? "When they spot an opportunity:" : "기회를 볼 때:"}</b> {ch05.wealthBuildingStyle.opportunityStyleB}</p>
              <p className="text-v4-good text-[11px]"><b>{isEn ? "What tends to fit well:" : "잘 맞기 쉬운 방향:"}</b> {ch05.wealthBuildingStyle.naturalDirectionB}</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-rel-ink border-t border-rel-line/60 pt-2 font-medium">
            {ch05.wealthBuildingStyle.pairSynergyInsight}
          </p>
        </RelationshipReportInset>
      </div>

      {/* 04. MAJOR_MONEY_DECISIONS */}
      {(() => {
        const legacyMajor = ch05.majorMoneyDecisions as any;
        const steps: MoneyDecisionStep[] = ch05.majorMoneyDecisions?.steps ?? [
          { stepKey: "FIND", stepLabel: isEn ? "Spotting the opportunity" : "기회 찾기", actorName: legacyMajor?.optionProposer?.replace(/\s*\(.*?\)/, "") ?? nameB, confidence: "HIGH" },
          { stepKey: "TRACK", stepLabel: isEn ? "Keeping an eye on it" : "계속 지켜보기", actorName: legacyMajor?.numberChecker?.replace(/\s*\(.*?\)/, "") ?? nameA, confidence: "HIGH" },
          { stepKey: "CHECK", stepLabel: isEn ? "Checking the numbers and risk" : "숫자·위험 확인", actorName: legacyMajor?.riskBrake?.replace(/\s*\(.*?\)/, "") ?? nameA, confidence: "HIGH" },
          { stepKey: "ACT", stepLabel: isEn ? "Actually acting on it" : "실제 실행", actorName: legacyMajor?.commitPusher?.replace(/\s*\(.*?\)/, "") ?? nameB, confidence: "HIGH" },
          { stepKey: "REVIEW", stepLabel: isEn ? "One last check" : "마지막 점검", actorName: legacyMajor?.numberChecker?.replace(/\s*\(.*?\)/, "") ?? nameA, confidence: "HIGH" },
        ];
        const oneLineSynthesis = ch05.majorMoneyDecisions?.oneLineSynthesis ?? legacyMajor?.decisionPatternSummary ?? "";

        return (
          <div className="space-y-3 pt-1">
            <SubHeading title={ch05.majorMoneyDecisions?.title ?? (isEn ? "04. Major Money & Investment Decisions" : "04. 큰돈과 투자 기회 앞에서 우리는 어떻게 움직일까?")} tone="coral" />
            <RelationshipReportInset className="border border-rel-line bg-rel-surface space-y-3 p-4 rounded-xl">
              <div className="space-y-2">
                {steps.map((step) => (
                  <div key={step.stepKey} className="flex justify-between items-center bg-rel-surface p-2.5 rounded-lg border border-rel-line text-xs">
                    <span className="font-bold text-rel-ink">{step.stepLabel}</span>
                    <span className="font-bold text-rel-deep">{step.actorName}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-rel-line/60 pt-3 mt-2 space-y-1">
                <span className="text-xs font-bold text-v4-good block">{isEn ? "One-line summary" : "한 줄 정리"}</span>
                <p className="text-xs leading-relaxed text-rel-ink font-medium">
                  {oneLineSynthesis}
                </p>
              </div>
            </RelationshipReportInset>
          </div>
        );
      })()}

      {/* 05. FINANCIAL_OPERATION */}
      <div className="space-y-3 pt-1">
        <SubHeading title={ch05.financialOperation.title} tone="deep" />
        <RelationshipReportInset className="border border-rel-line bg-rel-surface space-y-3 p-4 rounded-xl">
          <div className="grid gap-2 text-xs sm:grid-cols-3">
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line">
              <span className="text-[11px] text-rel-taupe font-medium block">{isEn ? "Cash flow" : "돈 흐름 확인"}</span>
              <p className="font-bold text-rel-deep mt-0.5">{ch05.financialOperation.flowTracker}</p>
            </div>
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line">
              <span className="text-[11px] text-rel-taupe font-medium block">{isEn ? "Bills & paperwork" : "납부·서류"}</span>
              <p className="font-bold text-rel-deep mt-0.5">{ch05.financialOperation.billsAndDocs}</p>
            </div>
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line">
              <span className="text-[11px] text-rel-taupe font-medium block">{isEn ? "Management style" : "관리 방식"}</span>
              <p className="font-bold text-v4-good mt-0.5">{ch05.financialOperation.operationStyle}</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-rel-ink border-t border-rel-line/60 pt-2 font-medium">
            {ch05.financialOperation.operationInsight}
          </p>
          {ch05.financialOperation.boundaryInsight ? (
            <p className="text-xs leading-relaxed text-rel-ink-soft bg-v4-good-soft/20 p-2.5 rounded-lg border border-v4-good/20 mt-2">
              💳 {ch05.financialOperation.boundaryInsight}
            </p>
          ) : null}
        </RelationshipReportInset>
      </div>

      {/* 06. ECONOMIC_CRISIS_RESILIENCE */}
      {(() => {
        const crisis = ch05.economicCrisisResilience ?? {
          title: isEn ? "06. Economic Resilience Under Crisis" : "06. 경제적 위기가 오면?",
          pairRoles: [
            { roleKey: "REALITY_ORGANIZER", roleLabel: isEn ? "The one who gets real first" : "먼저 현실을 정리하는 사람", personName: nameA },
            { roleKey: "INCOME_EXPLORER", roleLabel: isEn ? "The one who finds new income" : "새 수입원을 찾는 사람", personName: nameB },
            { roleKey: "RISK_TAKER", roleLabel: isEn ? "The one who can take the risk" : "위험을 감수할 수 있는 사람", personName: nameB },
            { roleKey: "ENDURANCE_HOLDER", roleLabel: isEn ? "The one who holds on to the end" : "끝까지 버티는 사람", personName: nameA },
          ],
          oneLineSynthesis: isEn
            ? "One of you holds the line so things don't collapse, while the other looks for the way back up."
            : "한 사람은 무너지지 않게 지키고, 다른 사람은 다시 올라갈 방법을 찾는 조합입니다.",
          profileA: {
            personName: nameA,
            editorialLabel: isEn ? "Holds the line to the end once responsible for it" : "책임지면 끝까지 버티는 생활력",
            narrative: isEn
              ? `When financial pressure hits, ${nameA} tends to get realistic first, and will put off their own comfort if needed to protect the household's foundation to the end.`
              : `${nameA}님은 경제적으로 압박이 생기면 현실을 먼저 정돈하고, 필요하다면 자신의 편안함을 미루면서까지 가정의 기반을 끝까지 지키려는 편입니다.`,
          },
          profileB: {
            personName: nameB,
            editorialLabel: isEn ? "Breaks through by changing approach" : "방법을 바꿔 돌파하는 생활력",
            narrative: isEn
              ? `When things get stuck, ${nameB} doesn't stay tied to one approach — they quickly pivot toward new opportunities and alternative sources of income.`
              : `${nameB}님은 상황이 막혔을 때 한 가지 방식에 메이지 않고, 새로운 기회와 대안을 찾아 발 빠르게 경제적 수입 행동으로 전환하는 편입니다.`,
          },
        };

        return (
          <div className="space-y-3 pt-1">
            <SubHeading title={crisis.title} tone="coral" />
            <RelationshipReportInset className="border border-rel-line bg-rel-surface space-y-4 p-4 rounded-xl">
              <div className="space-y-2 text-xs">
                {crisis.pairRoles.map((role) => (
                  <div key={role.roleKey} className="flex justify-between items-center bg-rel-surface p-2.5 rounded-lg border border-rel-line">
                    <span className="font-bold text-rel-ink">{role.roleLabel}</span>
                    <span className="font-bold text-rel-deep">{role.personName}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-rel-line/60 pt-3 space-y-1">
                <span className="text-xs font-bold text-v4-good block">{isEn ? "One-line read" : "한 줄 해석"}</span>
                <p className="text-xs leading-relaxed text-rel-ink font-medium">
                  {crisis.oneLineSynthesis}
                </p>
              </div>

              <div className="border-t border-rel-line/60 pt-3 space-y-3">
                <span className="text-xs font-bold text-rel-taupe block">{isEn ? "How each of you copes" : "각자의 생활력"}</span>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-1.5">
                    <span className="font-bold text-rel-deep block">
                      {crisis.profileA.personName} | <span className="text-v4-good">{crisis.profileA.editorialLabel}</span>
                    </span>
                    <p className="text-rel-ink-soft text-[11px] leading-relaxed">
                      {crisis.profileA.narrative}
                    </p>
                  </div>
                  <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-1.5">
                    <span className="font-bold text-rel-deep block">
                      {crisis.profileB.personName} | <span className="text-v4-good">{crisis.profileB.editorialLabel}</span>
                    </span>
                    <p className="text-rel-ink-soft text-[11px] leading-relaxed">
                      {crisis.profileB.narrative}
                    </p>
                  </div>
                </div>
              </div>
            </RelationshipReportInset>
          </div>
        );
      })()}

    </div>
  );
}

// ---- Part 3a: 심층 리드 (married_saju_deep 오버레이) -------------------------

function DeepReadSectionCard({ section }: { section: DeepReadSection }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  return (
    <DeepReadCard
      vm={section.vm}
      accentColor={ACCENT}
      labels={{
        cardTitle: section.title,
        voiceMe: t.deepReadVoiceMeLabel,
        voicePartner: t.deepReadVoicePartnerLabel,
        pattern: t.deepReadPatternLabel,
        adviceMe: t.deepReadAdviceMeLabel,
        advicePartner: t.deepReadAdvicePartnerLabel,
        together: t.deepReadTogetherLabel,
      }}
    />
  );
}

// ---- Part 3: 침실 케미스트리 + 수면 + 애착 -----------------------------------

function BedroomCard({ section }: { section: BedroomSection }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  const { matrix } = section;
  const people = [matrix.person_a, matrix.person_b];
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportParagraph>{matrix.sexual_chemistry_summary}</RelationshipReportParagraph>
      <RelationshipReportBody className="mt-3 grid gap-4 sm:grid-cols-2">
        {people.map((person) => (
          <RelationshipReportInset key={person.nickname}>
            <p className="flex items-center gap-1.5 text-sm font-bold text-rel-ink"><PersonBadge /> {person.nickname}</p>
            <div className="mt-3 space-y-2.5">
              <div>
                <RelationshipReportLabel>{t.bedroomStaminaLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1">{person.stamina}</RelationshipReportParagraph>
                {person.stamina_precision_note ? (
                  <div className="mt-2">
                    <RelationshipReportLabel>{t.bedroomStaminaPrecisionNoteLabel}</RelationshipReportLabel>
                    <RelationshipReportParagraph className="mt-1">
                      {person.stamina_precision_note}
                    </RelationshipReportParagraph>
                  </div>
                ) : null}
              </div>
              <div>
                <RelationshipReportLabel>{t.bedroomFantasyLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1">{person.fantasy}</RelationshipReportParagraph>
              </div>
              <div>
                <RelationshipReportLabel>{t.bedroomMannerLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1">{person.manner}</RelationshipReportParagraph>
              </div>
            </div>
          </RelationshipReportInset>
        ))}
      </RelationshipReportBody>
      <p className="mt-3 text-sm text-rel-ink-soft">{matrix.frequency_one_liner}</p>
      <RelationshipReportInset className="mt-4">
        <RelationshipReportLabel>{t.attachmentStyleLabel}</RelationshipReportLabel>
        <RelationshipReportParagraph className="mt-1.5">{section.attachmentStyle}</RelationshipReportParagraph>
      </RelationshipReportInset>
      <RelationshipReportInset className="mt-3">
        <RelationshipReportLabel>{t.sleepPrescriptionLabel}</RelationshipReportLabel>
        <RelationshipReportParagraph className="mt-1.5">{section.sleepFit.narrative}</RelationshipReportParagraph>
        <RelationshipReportParagraph className="mt-1.5">{section.sleepFit.prescription}</RelationshipReportParagraph>
      </RelationshipReportInset>
      <RelationshipReportInset className="mt-3">
        <RelationshipReportLabel>{t.rejectionScriptLabel(matrix.person_a.nickname)}</RelationshipReportLabel>
        <RelationshipReportParagraph className="mt-1.5">{section.rejectionScriptA}</RelationshipReportParagraph>
      </RelationshipReportInset>
      <RelationshipReportInset className="mt-3">
        <RelationshipReportLabel>{t.rejectionScriptLabel(matrix.person_b.nickname)}</RelationshipReportLabel>
        <RelationshipReportParagraph className="mt-1.5">{section.rejectionScriptB}</RelationshipReportParagraph>
      </RelationshipReportInset>
      {section.rejectionAxisNote ? (
        <RelationshipReportInset className="mt-3">
          <RelationshipReportLabel>{t.rejectionAxisNoteLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.rejectionAxisNote}</RelationshipReportParagraph>
        </RelationshipReportInset>
      ) : null}
    </RelationshipReportCard>
  );
}

// ---- Part 4: 홈라이프 DNA + 육아 + 원가족 + 3년 리스크 ------------------------

function HomeDnaCard({ section }: { section: HomeDnaSection }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  const people = [
    { label: "me" as const, person: section.dna.me },
    { label: "partner" as const, person: section.dna.partner },
  ];
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody className="grid gap-4 sm:grid-cols-2">
        {people.map(({ label, person }) => (
          <RelationshipReportInset key={label}>
            <p className="flex items-center gap-1.5 text-sm font-bold text-rel-ink"><PersonBadge /> {person.nickname}</p>
            <p className="mt-2 text-base font-semibold" style={{ color: ACCENT }}>
              {person.lifestyle_title}
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <RelationshipReportLabel>{t.dnaValuesLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">{person.life_values}</RelationshipReportParagraph>
              </div>
              <div>
                <RelationshipReportLabel>{t.dnaPrivateSelfLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">{person.private_home_self}</RelationshipReportParagraph>
              </div>
              <div>
                <RelationshipReportLabel>{t.dnaEnergyLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">{person.energy_battery}</RelationshipReportParagraph>
                {person.energy_axis_note ? (
                  <div className="mt-2">
                    <RelationshipReportLabel>{t.dnaEnergyAxisNoteLabel}</RelationshipReportLabel>
                    <RelationshipReportParagraph className="mt-1">
                      {person.energy_axis_note}
                    </RelationshipReportParagraph>
                  </div>
                ) : null}
              </div>
              <div>
                <RelationshipReportLabel>{t.dnaFamilyIdentityLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1.5">{person.family_identity}</RelationshipReportParagraph>
              </div>
            </div>
          </RelationshipReportInset>
        ))}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function ParentingCard({ section, names }: { section: ParentingSection; names?: [string, string] }) {
  const ch06 = section.ch06Intelligence;
  const { locale } = useLocale();
  const isEn = locale === "en-US";

  if (!ch06) return null;

  const nameA = names ? names[0] : "Person A";
  const nameB = names ? names[1] : "Person B";

  return (
    <div className="space-y-6">
      {/* 01. COUPLE_BOUNDARY */}
      <div className="space-y-3 pt-1">
        <SubHeading title={ch06.coupleBoundary.title} tone="coral" />
        <RelationshipReportInset className="border border-rel-line bg-rel-surface space-y-3 p-4 rounded-xl">
          <div className="grid gap-3 text-xs sm:grid-cols-2">
            <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-1.5">
              <span className="font-bold text-rel-deep block">
                {ch06.coupleBoundary.profileA.personName} | <span className="text-v4-good">{ch06.coupleBoundary.profileA.editorialLabel}</span>
              </span>
              <p className="text-rel-ink-soft text-[11px] leading-relaxed">
                {ch06.coupleBoundary.profileA.narrative}
              </p>
            </div>
            <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-1.5">
              <span className="font-bold text-rel-deep block">
                {ch06.coupleBoundary.profileB.personName} | <span className="text-v4-good">{ch06.coupleBoundary.profileB.editorialLabel}</span>
              </span>
              <p className="text-rel-ink-soft text-[11px] leading-relaxed">
                {ch06.coupleBoundary.profileB.narrative}
              </p>
            </div>
          </div>
          <div className="border-t border-rel-line/60 pt-2.5">
            <span className="text-xs font-bold text-v4-good block">{isEn ? "Your boundary" : "우리의 경계"}</span>
            <p className="text-xs leading-relaxed text-rel-ink font-medium mt-0.5">
              {ch06.coupleBoundary.boundarySynthesis}
            </p>
          </div>
        </RelationshipReportInset>
      </div>

      {/* 02. ORIGIN_FAMILY_DYNAMICS */}
      <div className="space-y-3 pt-1">
        <SubHeading title={ch06.originFamilyDynamics.title} tone="deep" />
        <RelationshipReportInset className="border border-rel-line bg-rel-surface space-y-3 p-4 rounded-xl text-xs">
          <div className="space-y-2">
            {ch06.originFamilyDynamics.pairRoles.map((role) => (
              <div key={role.roleKey} className="flex justify-between items-center bg-rel-surface p-2.5 rounded-lg border border-rel-line">
                <span className="font-bold text-rel-ink">{role.roleLabel}</span>
                <span className="font-bold text-rel-deep">{role.personName}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-rel-line/60 pt-2.5">
            <span className="text-xs font-bold text-v4-good block">{isEn ? "Moments to watch for" : "우리 부부가 조심할 순간"}</span>
            <p className="text-xs leading-relaxed text-rel-ink font-medium mt-0.5">
              {ch06.originFamilyDynamics.cautionMoment}
            </p>
          </div>
        </RelationshipReportInset>
      </div>

      {/* 03. PARENTING_DNA */}
      <div className="space-y-3 pt-1">
        <SubHeading title={ch06.parentingDna.title} tone="coral" />
        <RelationshipReportInset className="border border-rel-line bg-rel-surface space-y-4 p-4 rounded-xl text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-2">
              <span className="font-bold text-rel-deep block text-sm">
                {ch06.parentingDna.profileA.personName} | <span className="text-v4-good">{ch06.parentingDna.profileA.editorialIdentity}</span>
              </span>
              <p className="text-rel-ink-soft text-[11px] leading-relaxed">
                {ch06.parentingDna.profileA.narrative}
              </p>
              <div className="border-t border-rel-line/40 pt-2 space-y-1">
                <span className="text-[11px] font-bold text-rel-taupe block">{isEn ? "What they notice first" : "먼저 보는 것"}</span>
                <p className="text-[11px] font-semibold text-rel-ink">{ch06.parentingDna.profileA.firstFocusKeywords.join(" · ")}</p>
              </div>
              <div className="pt-1">
                <span className="text-[11px] font-bold text-rel-taupe block">{isEn ? "Easy to miss" : "놓치기 쉬운 것"}</span>
                <p className="text-[11px] text-rel-ink-soft">{ch06.parentingDna.profileA.easyToMissNote}</p>
              </div>
            </div>
            <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-2">
              <span className="font-bold text-rel-deep block text-sm">
                {ch06.parentingDna.profileB.personName} | <span className="text-v4-good">{ch06.parentingDna.profileB.editorialIdentity}</span>
              </span>
              <p className="text-rel-ink-soft text-[11px] leading-relaxed">
                {ch06.parentingDna.profileB.narrative}
              </p>
              <div className="border-t border-rel-line/40 pt-2 space-y-1">
                <span className="text-[11px] font-bold text-rel-taupe block">{isEn ? "What they notice first" : "먼저 보는 것"}</span>
                <p className="text-[11px] font-semibold text-rel-ink">{ch06.parentingDna.profileB.firstFocusKeywords.join(" · ")}</p>
              </div>
              <div className="pt-1">
                <span className="text-[11px] font-bold text-rel-taupe block">{isEn ? "Easy to miss" : "놓치기 쉬운 것"}</span>
                <p className="text-[11px] text-rel-ink-soft">{ch06.parentingDna.profileB.easyToMissNote}</p>
              </div>
            </div>
          </div>
        </RelationshipReportInset>
      </div>

      {/* 04. PARENTING_DIFFERENCE */}
      <div className="space-y-3 pt-1">
        <SubHeading title={ch06.parentingDifference.title} tone="deep" />
        <RelationshipReportInset className="border border-rel-line bg-rel-surface space-y-3 p-4 rounded-xl text-xs">
          {ch06.parentingDifference.situations.map((sit, idx) => (
            <div key={idx} className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-1.5">
              <span className="font-extrabold text-rel-deep block">{sit.situationTitle}</span>
              <div className="grid gap-1 sm:grid-cols-2 text-[11px]">
                <p className="text-rel-ink font-medium"><b className="text-v4-good">{nameA}:</b> {sit.reactionA}</p>
                <p className="text-rel-ink font-medium"><b className="text-v4-good">{nameB}:</b> {sit.reactionB}</p>
              </div>
            </div>
          ))}
        </RelationshipReportInset>
      </div>

      {/* 05. PAIR_PARENTING_SYSTEM */}
      <div className="space-y-3 pt-1">
        <SubHeading title={ch06.pairParentingSystem.title} tone="coral" />
        <RelationshipReportInset className="border border-rel-line bg-rel-surface space-y-3 p-4 rounded-xl text-xs">
          <h4 className="font-extrabold text-sm text-rel-deep">{ch06.pairParentingSystem.headline}</h4>
          <div className="space-y-2 pt-1">
            <div className="bg-v4-good-soft/20 p-2.5 rounded-lg border border-v4-good/20">
              <span className="font-bold text-v4-good block">{isEn ? "Our strength" : "우리의 강점"}</span>
              <p className="text-rel-ink text-[11px] leading-relaxed mt-0.5">{ch06.pairParentingSystem.ourStrengths}</p>
            </div>
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line">
              <span className="font-bold text-rel-taupe block">{isEn ? "Watch for" : "조심할 것"}</span>
              <p className="text-rel-ink-soft text-[11px] leading-relaxed mt-0.5">{ch06.pairParentingSystem.whatToWatchOut}</p>
            </div>
          </div>
          <div className="border-t border-rel-line/60 pt-2">
            <p className="text-xs font-medium leading-relaxed text-rel-ink">
              {ch06.pairParentingSystem.oneLineSynthesis}
            </p>
          </div>
        </RelationshipReportInset>
      </div>

      {/* 06. FAMILY_LOAD_REDISTRIBUTION */}
      <div className="space-y-3 pt-1">
        <SubHeading title={ch06.familyLoadRedistribution.title} tone="deep" />
        <RelationshipReportInset className="border border-rel-line bg-rel-surface space-y-3 p-4 rounded-xl text-xs">
          <div className="space-y-2">
            {ch06.familyLoadRedistribution.pairRoles.map((role) => (
              <div key={role.roleKey} className="flex justify-between items-center bg-rel-surface p-2.5 rounded-lg border border-rel-line">
                <span className="font-bold text-rel-ink">{role.roleLabel}</span>
                <span className="font-bold text-rel-deep">{role.personName}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-rel-line/60 pt-2.5">
            <span className="text-xs font-bold text-v4-good block">{isEn ? "One-line read" : "한 줄 해석"}</span>
            <p className="text-xs leading-relaxed text-rel-ink font-medium mt-0.5">
              {ch06.familyLoadRedistribution.oneLineSynthesis}
            </p>
          </div>
        </RelationshipReportInset>
      </div>

      {/* 07. FAMILY_IDENTITY */}
      <div className="space-y-3 pt-1">
        <SubHeading title={ch06.familyIdentity.title} tone="coral" />
        <RelationshipReportInset className="border border-v4-good/30 bg-v4-good-soft/20 space-y-3 p-4 rounded-xl text-xs">
          <h4 className="font-extrabold text-sm text-rel-deep">{ch06.familyIdentity.familyIdentityHeadline}</h4>
          <div className="grid gap-2 sm:grid-cols-2 pt-1">
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line space-y-1">
              <span className="font-bold text-rel-deep block">{isEn ? "The couple's boundary" : "부부의 경계"}</span>
              <p className="text-rel-ink-soft text-[11px] leading-relaxed">{ch06.familyIdentity.coupleBoundarySummary}</p>
            </div>
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line space-y-1">
              <span className="font-bold text-rel-deep block">{isEn ? "What you give the child" : "아이에게 주는 것"}</span>
              <p className="text-rel-ink-soft text-[11px] leading-relaxed">{ch06.familyIdentity.giftToChildSummary}</p>
            </div>
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line space-y-1">
              <span className="font-bold text-rel-deep block">{isEn ? "Watch for" : "조심할 것"}</span>
              <p className="text-rel-ink-soft text-[11px] leading-relaxed">{ch06.familyIdentity.cautionSummary}</p>
            </div>
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line space-y-1">
              <span className="font-bold text-rel-deep block">{isEn ? "Your family's strength" : "우리 가족의 힘"}</span>
              <p className="text-rel-ink-soft text-[11px] leading-relaxed">{ch06.familyIdentity.familyStrengthSummary}</p>
            </div>
          </div>
        </RelationshipReportInset>
      </div>
    </div>
  );
}

function FamilyBoundaryCard({ section }: { section: FamilyBoundarySection }) {
  return null;
}

function WeatherForecastCard({ section }: { section: WeatherForecastSection }) {
  return null;
}

// ---- Part 5: 부부싸움 해독제 + 실전 처방 -------------------------------------

function PrivacyCard({ section }: { section: PrivacySection }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div>
          <RelationshipReportLabel>{t.myPrivacyLineLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.personAPrivateLine}</RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.partnerPrivacyLineLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.personBPrivateLine}</RelationshipReportParagraph>
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function UpsetCard({ section }: { section: UpsetSection }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  const people = [
    { label: "me" as const, guide: section.guide.me },
    { label: "partner" as const, guide: section.guide.partner },
  ];
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody className="grid gap-4 sm:grid-cols-2">
        {people.map(({ label, guide }) => (
          <RelationshipReportInset key={label}>
            <p className="text-sm font-bold text-rel-ink">{t.upsetGuideTitle(guide.nickname)}</p>
            <div className="mt-3 space-y-2.5">
              <div>
                <RelationshipReportLabel>{t.upsetPointLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1">{guide.upset_signals}</RelationshipReportParagraph>
              </div>
              <div>
                <RelationshipReportLabel>{t.resolveLabel}</RelationshipReportLabel>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-rel-ink-soft">
                  {guide.do_list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <RelationshipReportLabel>{t.avoidLabel}</RelationshipReportLabel>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-rel-ink-soft">
                  {guide.avoid_list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </RelationshipReportInset>
        ))}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function WarningCard({ section }: { section: WarningSection }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  const { locale } = useLocale();
  const isEn = locale === "en-US";
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT} variant="warning">
      <RelationshipReportBody>
        <div>
          <RelationshipReportLabel>{t.conflictTriggerLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.conflictTrigger}</RelationshipReportParagraph>
        </div>
        <div>
          <p className="text-sm font-bold text-rel-ink">{section.conflictCommunication.pattern_label}</p>
          <RelationshipReportParagraph className="mt-1.5">
            {section.conflictCommunication.narrative}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph className="mt-1.5 text-rel-ink-soft">
            {section.conflictCommunication.emotional_neglect_risk}
          </RelationshipReportParagraph>
        </div>
        <RelationshipReportInset className="mt-2 border-v4-good/25 bg-v4-good-soft">
          {section.deEscalation.shared_trigger && section.deEscalation.shared_trigger_note ? (
            <RelationshipReportParagraph className="text-rel-ink-soft">
              {section.deEscalation.shared_trigger_note}
            </RelationshipReportParagraph>
          ) : null}
          <RelationshipReportParagraph className={section.deEscalation.shared_trigger ? "mt-2 italic text-v4-good" : "italic text-v4-good"}>
            <MessageCircle className="mr-1.5 inline h-3.5 w-3.5 text-v4-good" strokeWidth={1.75} aria-hidden /> {section.deEscalation.person_a.solution_script}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph className="mt-2 italic text-v4-good">
            <MessageCircle className="mr-1.5 inline h-3.5 w-3.5 text-v4-good" strokeWidth={1.75} aria-hidden /> {section.deEscalation.person_b.solution_script}
          </RelationshipReportParagraph>
        </RelationshipReportInset>

        <RelationshipReportInset className="mt-3 border border-v4-good/30 bg-v4-good-soft/30 space-y-1.5">
          <p className="text-xs font-bold text-v4-good">{isEn ? "🤝 Something to try together" : "🤝 함께 해볼 것"}</p>
          <p className="text-xs text-rel-ink leading-relaxed">
            {isEn
              ? "Your roles and expectations around household chores and finances are landing a bit differently for each of you. Building a weekly check-in habit could ease the load on both sides, and leaning into each of your strengths can make things run even better."
              : "우리의 가사와 재정 운영에서 서로의 역할과 기대가 다르게 잡히고 있어요. 매주 점검하는 습관을 만들면 서로의 부담을 줄일 수 있을 것 같아요. 각자의 강점을 살려 나가면 더 나은 운영이 가능할 거예요."}
          </p>
          <p className="text-xs font-medium text-v4-good italic pt-1">
            <MessageCircle className="mr-1.5 inline h-3.5 w-3.5 text-v4-good" strokeWidth={1.75} aria-hidden /> {isEn ? "“Let's check in this week on how chores and spending are feeling.”" : "“이번 주 가사·지출 온도를 묻는 대화를 해보자.”"}
          </p>
        </RelationshipReportInset>
        <div>
          <RelationshipReportLabel>{t.coldWarGoldenTimeLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {section.coldWarProtocol.golden_time_note}
          </RelationshipReportParagraph>
        </div>
        <RelationshipReportInset>
          <RelationshipReportLabel>{t.reconciliationCueLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {section.coldWarProtocol.reconciliation_cue_a}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph className="mt-2">
            {section.coldWarProtocol.reconciliation_cue_b}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function PrescriptionCard({ section }: { section: PrescriptionSection }) {
  const pack = {
    schema_version: "cohabitation_prescription_v1",
    intro_line: section.introLine,
    items: section.items,
  };
  return <PairPrescriptionSection pack={pack} accentColor={ACCENT} domain="cohabitation" />;
}

// ---- Substantive UI Cards (Phase 7.5 Content Enrichment) ------------------

function EconomicPartnershipCard({ bundle, names, isEn }: { bundle?: MarriageCanonicalBundle; names: [string, string]; isEn: boolean }) {
  if (!bundle?.economicPartnership) return null;
  const { profileA, profileB, pairSynergyTitle, pairSynergyNarrative, decisionFlow } = bundle.economicPartnership;
  const honorific = isEn ? "" : "님";

  const strategyTitle = profileA.primaryRole === "SAVER_ACCUMULATOR" || profileB.primaryRole === "SAVER_ACCUMULATOR"
    ? (isEn ? "Secure a stable cash buffer ➔ quarterly fixed savings system" : "안정적 현금 버퍼 확보 ➔ 분기별 고정 저축 시스템")
    : (isEn ? "Explore growth assets ➔ goal-based staged accumulation" : "성장 자산화 탐색 ➔ 목표 기반 분할 축적 시스템");

  return (
    <RelationshipReportCard title={isEn ? "Economic Partnership Role Map" : "부부 경제 파트너십"} accentColor={ACCENT}>
      <div className="grid gap-4 sm:grid-cols-2">
        <RelationshipReportInset>
          <p className="font-bold text-rel-ink">{isEn ? `${names[0]}'s Economic Role` : `${names[0]}님의 경제적 역할`}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded bg-v4-a-soft px-2 py-0.5 text-xs font-semibold text-v4-a">{profileA.primaryRoleLabel}</span>
            <span className="rounded bg-v4-a-soft px-2 py-0.5 text-xs text-v4-a/80">{profileA.secondaryRoleLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rel-ink-soft">{profileA.behaviorDescription}</p>
        </RelationshipReportInset>

        <RelationshipReportInset>
          <p className="font-bold text-rel-ink">{isEn ? `${names[1]}'s Economic Role` : `${names[1]}님의 경제적 역할`}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded bg-v4-b-soft px-2 py-0.5 text-xs font-semibold text-v4-b">{profileB.primaryRoleLabel}</span>
            <span className="rounded bg-v4-b-soft px-2 py-0.5 text-xs text-v4-b/80">{profileB.secondaryRoleLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-rel-ink-soft">{profileB.behaviorDescription}</p>
        </RelationshipReportInset>
      </div>

      <div className="mt-4 rounded-lg border border-v4-good/30 bg-v4-good-soft p-4">
        <p className="text-sm font-bold text-v4-good">{isEn ? `Economic Partnership Synergy: ${pairSynergyTitle}` : `부부 경제 파트너십 시너지: ${pairSynergyTitle}`}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-rel-ink-soft">{pairSynergyNarrative}</p>
      </div>

      <div className="mt-4 rounded-lg border border-rel-taupe/30 bg-rel-taupe-soft p-4">
        <p className="text-sm font-bold text-rel-taupe">{isEn ? "Recommended savings & asset-building approach for you two" : "우리 부부에게 권장하는 돈 모으기 & 자산 운용 방식"}</p>
        <p className="mt-1 text-xs font-semibold text-rel-ink">{strategyTitle}</p>
        <p className="mt-1 text-xs text-rel-ink-soft">
          {isEn
            ? "Tailored to your styles, the safest structure is to separate fixed monthly costs and an emergency buffer first, then move to joint review before big purchases, and finally channel the rest into long-term assets."
            : "두 사람의 성향에 맞춰 월 고정비와 예비비를 먼저 분리한 뒤, 대형 지출 전에는 상호 검토 수순을 거쳐 장기 자산화로 연결하는 구조가 가장 안전합니다."}
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-rel-line bg-rel-surface p-4 text-xs">
        <p className="font-semibold text-rel-taupe">{isEn ? "Economic Decision Flow" : "경제 의사결정 및 관리 수순"}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-rel-ink-soft sm:grid-cols-3">
          <div><span className="text-rel-ink-mute">{isEn ? "1. Cash flow:" : "1. 현금흐름 관리:"}</span> {decisionFlow.cashFlowTracker}{honorific}</div>
          <div><span className="text-rel-ink-mute">{isEn ? "2. Proposes big purchases:" : "2. 대형지출 제안:"}</span> {decisionFlow.largePurchaseProposer}{honorific}</div>
          <div><span className="text-rel-[#1b3b2b]">{isEn ? "3. Risk review:" : "3. 리스크 검토:"}</span> {decisionFlow.riskReviewer}{honorific}</div>
          <div><span className="text-rel-ink-mute">{isEn ? "4. Final decision:" : "4. 최종 의사결정:"}</span> {decisionFlow.decider}</div>
          <div><span className="text-rel-ink-mute">{isEn ? "5. Executes:" : "5. 금융 실무집행:"}</span> {decisionFlow.executor}{honorific}</div>
        </div>
        <p className="mt-2.5 text-rel-ink-mute">
          {isEn
            ? "Cash-flow tracking and execution follow the household's designated CFO. Purchase proposals and risk review are a separate check-and-balance split, and can sit with either partner."
            : "현금흐름 관리와 금융 실무집행은 가정의 지정 CFO를 따릅니다. 대형지출 제안과 리스크 검토는 별도의 상호 점검 역할 분담으로, CFO와 다른 사람이 맡을 수 있습니다."}
        </p>
      </div>
    </RelationshipReportCard>
  );
}

function ConflictSubstantiveCard({
  view,
  bundle,
  names,
  isEn,
}: {
  view?: import("@/lib/relationship/marriage/viewModel/marriageUiContracts").MarriageConflict4StageViewModel;
  bundle?: MarriageCanonicalBundle;
  names: [string, string];
  isEn: boolean;
}) {
  const personA = view?.personA;
  const personB = view?.personB;
  const scriptAtoB = bundle?.emergencySosCombined?.scriptAtoB;
  const scriptBtoA = bundle?.emergencySosCombined?.scriptBtoA;
  const crisis = bundle?.crisisRole;

  if (!personA || !personB) return null;

  return (
    <RelationshipReportCard title={isEn ? "4-Stage Conflict Transition & Crisis-Response Partnership" : "갈등 4단계 상태 전이 & 위기 대응 파트너십"} accentColor={ACCENT} variant="warning">
      <div className="grid gap-4 sm:grid-cols-2">
        <RelationshipReportInset>
          <p className="font-bold text-v4-bad">{isEn ? `${names[0]}'s 4-Stage Emotional Conflict Transition` : `${names[0]}님의 갈등 감정 4단계 전이`}</p>
          <ol className="mt-2 space-y-2 text-xs text-rel-ink-soft">
            {personA.stages.map((st) => (
              <li key={st.stepNumber}>
                <span className="font-semibold text-rel-taupe">Step {st.stepNumber} ({st.label}):</span>
                <p className="mt-0.5 text-rel-ink-soft leading-relaxed">{st.narrative}</p>
              </li>
            ))}
          </ol>
        </RelationshipReportInset>

        <RelationshipReportInset>
          <p className="font-bold text-v4-bad">{isEn ? `${names[1]}'s 4-Stage Emotional Conflict Transition` : `${names[1]}님의 갈등 감정 4단계 전이`}</p>
          <ol className="mt-2 space-y-2 text-xs text-rel-ink-soft">
            {personB.stages.map((st) => (
              <li key={st.stepNumber}>
                <span className="font-semibold text-rel-taupe">Step {st.stepNumber} ({st.label}):</span>
                <p className="mt-0.5 text-rel-ink-soft leading-relaxed">{st.narrative}</p>
              </li>
            ))}
          </ol>
        </RelationshipReportInset>
      </div>

      {crisis ? (
        <div className="mt-4 rounded-lg border border-rel-taupe/30 bg-rel-taupe-soft p-4">
          <p className="text-sm font-bold text-rel-taupe">
            {(() => {
              const leadName = crisis.practicalLead === "a" ? names[0] : crisis.practicalLead === "b" ? names[1] : `${names[0]} & ${names[1]}`;
              const anchorName = crisis.emotionalAnchor === "a" ? names[0] : crisis.emotionalAnchor === "b" ? names[1] : `${names[0]} & ${names[1]}`;
              return isEn
                ? <>🛡️ Crisis role split: {leadName} (practical lead) × {anchorName} (emotional anchor)</>
                : <>🛡️ 위기 시 역할 분담: {leadName}님(현실 문제 해결 리드) × {anchorName}님(정서적 버팀목)</>;
            })()}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-rel-ink-soft">
            {crisis.narrative ||
              (isEn
                ? `${names[0]} and ${names[1]} flexibly split practical problem-solving and emotional reassurance when something unexpected comes up.`
                : `${names[0]}님과 ${names[1]}님은 예상치 못한 문제 발생 시 현실적 해결과 정서적 안정을 유연하게 나누어 맡는 상보적 팀입니다.`)}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {scriptAtoB?.firstLine ? (
          <div className="rounded-lg border border-v4-bad/30 bg-v4-bad-soft p-4">
            <p className="text-xs font-bold text-v4-bad">🆘 {isEn ? `${names[0]} ➔ ${names[1]} Emergency SOS Recovery Script` : `${names[0]} ➔ ${names[1]} 긴급 SOS 회복 대본`}</p>
            <p className="mt-2 text-xs font-medium text-rel-ink">💬 {isEn ? "First line:" : "첫 마디:"} "{scriptAtoB.firstLine}"</p>
            {scriptAtoB.acknowledgement ? <p className="mt-1 text-xs text-rel-ink-soft">🛡️ {isEn ? "Acknowledge:" : "인정:"} {scriptAtoB.acknowledgement}</p> : null}
            {scriptAtoB.tabooWord ? <p className="mt-1 text-xs text-v4-bad/80">⚠️ {isEn ? "Avoid saying:" : "금지 단어:"} {scriptAtoB.tabooWord}</p> : null}
          </div>
        ) : null}

        {scriptBtoA?.firstLine ? (
          <div className="rounded-lg border border-v4-bad/30 bg-v4-bad-soft p-4">
            <p className="text-xs font-bold text-v4-bad">🆘 {isEn ? `${names[1]} ➔ ${names[0]} Emergency SOS Recovery Script` : `${names[1]} ➔ ${names[0]} 긴급 SOS 회복 대본`}</p>
            <p className="mt-2 text-xs font-medium text-rel-ink">💬 {isEn ? "First line:" : "첫 마디:"} "{scriptBtoA.firstLine}"</p>
            {scriptBtoA.acknowledgement ? <p className="mt-1 text-xs text-rel-ink-soft">🛡️ {isEn ? "Acknowledge:" : "인정:"} {scriptBtoA.acknowledgement}</p> : null}
            {scriptBtoA.tabooWord ? <p className="mt-1 text-xs text-v4-bad/80">⚠️ {isEn ? "Avoid saying:" : "금지 단어:"} {scriptBtoA.tabooWord}</p> : null}
          </div>
        ) : null}
      </div>
    </RelationshipReportCard>
  );
}

function getMatchBadge(matchType: string, isEn: boolean) {
  switch (matchType) {
    case "NATURAL_MATCH":
      return {
        label: isEn ? "Natural Match" : "자연스러운 조화",
        className: "bg-v4-good-soft text-v4-good border border-v4-good/30",
      };
    case "LATENT_MATCH":
      return {
        label: isEn ? "Latent Capacity" : "잠재된 수용력",
        className: "bg-rel-taupe-soft text-rel-taupe border border-rel-line",
      };
    case "ADAPTIVE_SUPPLY":
      return {
        label: isEn ? "Adaptive Effort" : "상대의 세심한 노력",
        className: "bg-amber-500/10 text-amber-700 border border-amber-500/30",
      };
    case "EXPECTATION_GAP":
    default:
      return {
        label: isEn ? "Expectation Gap" : "서로의 시선 차이",
        className: "bg-v4-bad-soft text-v4-bad border border-v4-bad/30",
      };
  }
}

function Chapter03SubstantiveCard({
  bundle,
  names,
  isEn,
}: {
  bundle?: MarriageCanonicalBundle;
  names: [string, string];
  isEn: boolean;
}) {
  const ch03 = bundle?.chapter03Intelligence ?? createDefaultMarriageChapter03Intelligence(names[0], names[1], isEn);

  return (
    <div className="space-y-6 mb-6">
      {/* 01. 관계적 자산 (Relational Assets) */}
      {ch03.assets && ch03.assets.length > 0 ? (
        <div className="space-y-3">
          <SubHeading title={isEn ? "Compounding Relational Assets" : "01. 시간이 살수록 쌓이는 우리의 관계적 자산"} tag="자산" tone="deep" />
          <div className="grid gap-3 sm:grid-cols-2">
            {ch03.assets.map((asset, i) => (
              <RelationshipReportInset key={i} className="border border-v4-good/30 bg-v4-good-soft/20 p-4 rounded-xl space-y-1.5">
                <p className="text-xs font-bold text-v4-good">▫ {asset.title}</p>
                <p className="text-xs leading-relaxed text-rel-ink">{asset.mechanism}</p>
                <p className="text-[11px] text-rel-taupe pt-1 border-t border-v4-good/20">▫ {asset.longTermValue}</p>
              </RelationshipReportInset>
            ))}
          </div>
        </div>
      ) : null}

      {/* 02. 장점의 반전 위험 (Asset-to-Debt Chain) */}
      {ch03.assetToDebtChains && ch03.assetToDebtChains.length > 0 ? (
        <div className="space-y-3">
          <SubHeading title={isEn ? "Asset to Debt Dynamics" : "02. 처음엔 장점이었지만 과부하가 될 수 있는 것"} tag="주의" tone="coral" />
          <div className="space-y-3">
            {ch03.assetToDebtChains.map((chain, i) => (
              <RelationshipReportInset key={i} className="border border-rel-line bg-rel-surface p-4 rounded-xl space-y-2">
                <p className="text-xs font-bold text-rel-deep">▫ {chain.title}</p>
                <p className="text-xs leading-relaxed text-rel-ink"><span className="font-semibold text-emerald-800">{isEn ? "Initial benefit:" : "초기 이점:"}</span> {chain.initialBenefit}</p>
                <p className="text-xs leading-relaxed text-rel-ink"><span className="font-semibold text-red-800">{isEn ? "When it flips:" : "반전 조건:"}</span> {chain.flipCondition}</p>
                <p className="text-xs leading-relaxed text-rel-ink"><span className="font-semibold text-rel-deep">{isEn ? "Long-term cost:" : "장기 비용:"}</span> {chain.longTermCost}</p>
              </RelationshipReportInset>
            ))}
          </div>
        </div>
      ) : null}

      {/* 03. 역할 고착화 위험 (Role Lock-in) */}
      {ch03.roleLockIn ? (
        <div className="space-y-3">
          <SubHeading title={isEn ? "Relational Role Lock-in" : "03. 한 사람에게 역할이 굳어질 위험"} tag="역할 분담" tone="deep" />
          <RelationshipReportInset className="border border-rel-line bg-rel-surface p-4 rounded-xl space-y-3">
            <p className="text-xs leading-relaxed text-rel-ink font-medium">{ch03.roleLockIn.pairSummary}</p>
            <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-rel-line/60">
              <div className="space-y-1 bg-rel-taupe-soft/30 p-3 rounded-lg border border-rel-line">
                <span className="text-xs font-bold text-v4-a">{ch03.roleLockIn.personARole.personName}: {ch03.roleLockIn.personARole.roleTitle}</span>
                <p className="text-[11px] text-rel-ink-soft">{ch03.roleLockIn.personARole.whyFormed}</p>
                <p className="text-[11px] text-v4-bad">▫ {ch03.roleLockIn.personARole.riskWhenLocked}</p>
              </div>
              <div className="space-y-1 bg-rel-taupe-soft/30 p-3 rounded-lg border border-rel-line">
                <span className="text-xs font-bold text-v4-b">{ch03.roleLockIn.personBRole.personName}: {ch03.roleLockIn.personBRole.roleTitle}</span>
                <p className="text-[11px] text-rel-ink-soft">{ch03.roleLockIn.personBRole.whyFormed}</p>
                <p className="text-[11px] text-v4-bad">▫ {ch03.roleLockIn.personBRole.riskWhenLocked}</p>
              </div>
            </div>
          </RelationshipReportInset>
        </div>
      ) : null}
    </div>
  );
}

function Chapter07SubstantiveCard({ bundle, names, isEn }: { bundle?: MarriageCanonicalBundle; names: [string, string]; isEn: boolean }) {
  return null;
}

function MarriageChapter09SubstantiveCard({ bundle, names, isEn }: { bundle?: MarriageCanonicalBundle; names: [string, string]; isEn: boolean }) {
  return null;
}

function getLoveTransmissionBadge(matchType: string, isEn: boolean) {
  switch (matchType) {
    case "DIRECT_MATCH":
      return {
        label: isEn ? "Direct Match" : "자연스러운 직통 채널",
        className: "bg-v4-good-soft text-v4-good border border-v4-good/30",
      };
    case "ADAPTIVE_EXPRESSION":
      return {
        label: isEn ? "Adaptive Expression" : "상대의 맞춤 언어 노력",
        className: "bg-amber-500/10 text-amber-700 border border-amber-500/30",
      };
    case "MISSED_SIGNAL":
      return {
        label: isEn ? "Channel Mismatch" : "채널 미스매치 시선",
        className: "bg-v4-bad-soft text-v4-bad border border-v4-bad/30",
      };
    case "PARTIAL_MATCH":
    default:
      return {
        label: isEn ? "Partial Channel" : "은은하게 통하는 채널",
        className: "bg-rel-taupe-soft text-rel-taupe border border-rel-line",
      };
  }
}

function Chapter04SubstantiveCard({ bundle, names, isEn }: { bundle?: MarriageCanonicalBundle; names: [string, string]; isEn: boolean }) {
  const ch04 = bundle?.chapter04Intelligence ?? createDefaultMarriageChapter04Intelligence(names[0], names[1], isEn);

  return (
    <div className="space-y-8">
      {/* Intro Question Banner */}
      <div className="border-l-[3px] border-[#1b3b2b]/80 pl-3.5 py-0.5 text-rel-ink font-medium text-xs sm:text-sm">
        {ch04.introQuestion.replace(/^💡\s*/, "")}
      </div>

      {/* SECTION 01: Love Transmission */}
      <div className="space-y-3">
        <SubHeading title={isEn ? "Love Transmission Channels" : "01. 내 사랑은 상대에게 잘 도착하고 있을까"} tag="사랑의 언어" tone="coral" />
        <div className="space-y-3">
          {ch04.loveTransmission.map((channel, i) => {
            const badge = getLoveTransmissionBadge(channel.matchType, isEn);
            return (
              <RelationshipReportInset key={i} className="space-y-2">
                <div className="flex items-center justify-between border-b border-rel-line pb-2 mb-1">
                  <span className="text-xs font-bold text-rel-deep">{channel.senderName} ➔ {channel.receiverName}</span>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>{badge.label}</span>
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line">
                    <span className="font-semibold text-rel-taupe block mb-1">{isEn ? `How ${channel.senderName} sends love` : `${channel.senderName}님이 보내는 사랑`}</span>
                    <p className="text-rel-ink">{channel.senderNaturalExpression}</p>
                  </div>
                  <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line">
                    <span className="font-semibold text-rel-taupe block mb-1">{isEn ? `How ${channel.receiverName} feels loved` : `${channel.receiverName}님이 사랑받는다고 느끼는 방식`}</span>
                    <p className="text-rel-ink">{channel.receiverReceptionNeed}</p>
                  </div>
                </div>
                <p className="text-xs font-medium leading-relaxed text-rel-ink bg-v4-good-soft/30 p-2.5 rounded-lg border border-v4-good/20">
                  <span className="font-bold text-v4-good">{isEn ? "How it lands: " : "전달 결과: "}</span>{channel.matchNarrative}
                </p>
                <p className="text-[11px] leading-relaxed text-rel-taupe pt-1">▫ {channel.transmissionInsight}</p>
              </RelationshipReportInset>
            );
          })}
        </div>
      </div>

      {/* SECTION 02: Pair Intimacy Chemistry (HERO) */}
      <div className="space-y-3">
        <SubHeading title={isEn ? "Pair Intimacy Chemistry" : "02. 그래서, 우리 둘의 속궁합은?"} tone="deep" />
        <RelationshipReportInset className="border border-v4-good/30 bg-v4-good-soft/20 space-y-4 p-4 rounded-xl">
          <div>
            <h4 className="text-base font-extrabold text-rel-deep leading-snug">{ch04.pairChemistry.heroIdentity}</h4>
            <p className="text-xs leading-relaxed text-rel-ink mt-2 border-b border-v4-good/20 pb-3">{ch04.pairChemistry.synthesisNarrative}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 pt-0.5 text-xs">
            <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-1">
              <span className="font-bold text-rel-deep block">{isEn ? "Attraction" : "끌림"}</span>
              <p className="text-rel-ink-soft leading-relaxed">{ch04.pairChemistry.attractionNarrative}</p>
            </div>
            <div className="bg-rel-surface p-3 rounded-lg border border-rel-line space-y-1">
              <span className="font-bold text-v4-good block">{isEn ? "Comfort" : "편안함"}</span>
              <p className="text-rel-ink-soft leading-relaxed">{ch04.pairChemistry.comfortNarrative}</p>
            </div>
          </div>
        </RelationshipReportInset>
      </div>

      {/* SECTION 03: Stability vs Novelty */}
      <div className="space-y-3">
        <SubHeading title={isEn ? "Stability vs Novelty Balance" : "03. 익숙한 밤 vs 새로운 공기"} tag="익숙함과 변화" tone="coral" />
        <RelationshipReportInset className="space-y-3 border border-rel-line">
          <p className="text-xs font-bold text-rel-deep">{ch04.stabilityVsNovelty.headline}</p>
          <p className="text-xs leading-relaxed text-rel-ink-soft">{ch04.stabilityVsNovelty.description}</p>
          <div className="grid gap-2 text-xs sm:grid-cols-2 pt-1 border-t border-rel-line/60">
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line space-y-1">
              <span className="font-bold text-v4-a block">{isEn ? names[0] : `${names[0]}님`}</span>
              <p className="text-[11px] text-rel-taupe">{isEn ? "Naturally comfortable with: " : "본래 편한 방식: "}{ch04.stabilityVsNovelty.personAInnate}</p>
              <p className="text-[11px] text-rel-ink">{isEn ? "Currently wants: " : "현재 바라는 분위기: "}{ch04.stabilityVsNovelty.personACurrent}</p>
            </div>
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line space-y-1">
              <span className="font-bold text-v4-b block">{isEn ? names[1] : `${names[1]}님`}</span>
              <p className="text-[11px] text-rel-taupe">{isEn ? "Naturally comfortable with: " : "본래 편한 방식: "}{ch04.stabilityVsNovelty.personBInnate}</p>
              <p className="text-[11px] text-rel-ink">{isEn ? "Currently wants: " : "현재 바라는 분위기: "}{ch04.stabilityVsNovelty.personBCurrent}</p>
            </div>
          </div>
        </RelationshipReportInset>
      </div>

      {/* SECTION 04: Activation & Rhythm */}
      <div className="space-y-3">
        <SubHeading title={isEn ? "Bedroom Temperature & Activation" : "04. 우리 침실의 온도는 같은 속도로 올라올까"} tag="온도와 속도" tone="coral" />
        <div className="grid gap-3 sm:grid-cols-2">
          <RelationshipReportInset className="space-y-2 border border-rel-line">
            <p className="text-xs font-bold text-v4-a">{ch04.activationAndRhythm.personAMode.personName}: {ch04.activationAndRhythm.personAMode.modeTitle}</p>
            <p className="text-xs leading-relaxed text-rel-ink-soft">{ch04.activationAndRhythm.personAMode.description}</p>
          </RelationshipReportInset>
          <RelationshipReportInset className="space-y-2 border border-rel-line">
            <p className="text-xs font-bold text-v4-b">{ch04.activationAndRhythm.personBMode.personName}: {ch04.activationAndRhythm.personBMode.modeTitle}</p>
            <p className="text-xs leading-relaxed text-rel-ink-soft">{ch04.activationAndRhythm.personBMode.description}</p>
          </RelationshipReportInset>
        </div>
        <RelationshipReportInset className="bg-rel-surface border border-rel-line space-y-1.5">
          <p className="text-xs font-bold text-rel-deep">{ch04.activationAndRhythm.headline}</p>
          <p className="text-xs leading-relaxed text-rel-ink-soft">{ch04.activationAndRhythm.rhythmDescription}</p>
          <p className="text-[11px] text-rel-taupe pt-1 border-t border-rel-line/40">▫ {ch04.activationAndRhythm.activationNarrative}</p>
        </RelationshipReportInset>
      </div>

      {/* SECTION 05: Initiation, Lead & Response */}
      <div className="space-y-3">
        <SubHeading title={isEn ? "Initiation & Receptive Engagement" : "05. 누가 먼저 불을 켤까?"} tag="먼저 다가가기" tone="deep" />
        <RelationshipReportInset className="space-y-3 border border-rel-line">
          <p className="text-xs font-bold text-rel-deep">{ch04.initiationLeadResponse.headline}</p>
          <p className="text-xs leading-relaxed text-rel-ink-soft">{ch04.initiationLeadResponse.description}</p>
          <div className="grid gap-2 text-xs sm:grid-cols-2 pt-1 border-t border-rel-line/60">
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line">
              <span className="font-bold text-v4-a block mb-1">{isEn ? `How ${names[0]} takes the first step` : `${names[0]}님이 먼저 다가가는 방식`}</span>
              <p className="text-rel-ink">{ch04.initiationLeadResponse.personAAgency}</p>
            </div>
            <div className="bg-rel-surface p-2.5 rounded-lg border border-rel-line">
              <span className="font-bold text-v4-b block mb-1">{isEn ? `How ${names[1]} takes the first step` : `${names[1]}님이 먼저 다가가는 방식`}</span>
              <p className="text-rel-ink">{ch04.initiationLeadResponse.personBAgency}</p>
            </div>
          </div>
        </RelationshipReportInset>
      </div>

      {/* SECTION 06: Intimate Attunement */}
      <div className="space-y-3">
        <SubHeading title={isEn ? "Intimate Attunement & Care" : "06. 침실에서 우리는 상대를 어떻게 살필까?"} tag="침실에서의 배려" tone="coral" />
        <div className="grid gap-3 sm:grid-cols-2">
          <RelationshipReportInset className="space-y-1.5 border border-rel-line">
            <span className="text-[11px] font-bold text-v4-a block">{ch04.intimateAttunement.personAAttunement.personName}: {ch04.intimateAttunement.personAAttunement.styleTitle}</span>
            <p className="text-xs leading-relaxed text-rel-ink-soft">{ch04.intimateAttunement.personAAttunement.description}</p>
          </RelationshipReportInset>
          <RelationshipReportInset className="space-y-1.5 border border-rel-line">
            <span className="text-[11px] font-bold text-v4-b block">{ch04.intimateAttunement.personBAttunement.personName}: {ch04.intimateAttunement.personBAttunement.styleTitle}</span>
            <p className="text-xs leading-relaxed text-rel-ink-soft">{ch04.intimateAttunement.personBAttunement.description}</p>
          </RelationshipReportInset>
        </div>
        <RelationshipReportInset className="bg-v4-good-soft/20 border border-v4-good/30">
          <p className="text-xs font-medium leading-relaxed text-rel-ink">▫ {ch04.intimateAttunement.attunementInsight}</p>
        </RelationshipReportInset>
      </div>

      {/* SECTION 07: Desire Mismatch & Rejection */}
      <div className="space-y-3">
        <SubHeading title={isEn ? "Desire Mismatch & Rejection Handling" : "07. 오늘은 한 사람만 원할 때"} tag="거절과 재연결" tone="deep" />
        {ch04.desireMismatchAndRejection.isSharedPattern && ch04.desireMismatchAndRejection.sharedPatternSummary ? (
          <RelationshipReportInset className="border border-v4-good/30 bg-v4-good-soft/20 space-y-2">
            <p className="text-xs font-bold text-v4-good">{isEn ? "A shared emotional response you both have" : "두 사람이 공유하는 공통 정서적 반응"}</p>
            <p className="text-xs leading-relaxed text-rel-ink">{ch04.desireMismatchAndRejection.sharedPatternSummary}</p>
          </RelationshipReportInset>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <RelationshipReportInset className="space-y-2">
              <p className="text-xs font-bold text-rel-deep">{isEn ? `${ch04.desireMismatchAndRejection.personARejection.personName}'s response` : `${ch04.desireMismatchAndRejection.personARejection.personName}님의 반응`}</p>
              <p className="text-xs text-rel-ink-soft">{isEn ? "What the rejection means: " : "거절의 의미: "}{ch04.desireMismatchAndRejection.personARejection.interpretation}</p>
              <p className="text-xs text-rel-ink-soft">{isEn ? "How they express it: " : "거절 표현 방식: "}{ch04.desireMismatchAndRejection.personARejection.expressionStyle}</p>
              <p className="text-xs text-v4-good font-medium">{isEn ? "Reconnection cue: " : "재연결 신호: "}{ch04.desireMismatchAndRejection.personARejection.reconnectionNeed}</p>
            </RelationshipReportInset>
            <RelationshipReportInset className="space-y-2">
              <p className="text-xs font-bold text-rel-deep">{isEn ? `${ch04.desireMismatchAndRejection.personBRejection.personName}'s response` : `${ch04.desireMismatchAndRejection.personBRejection.personName}님의 반응`}</p>
              <p className="text-xs text-rel-ink-soft">{isEn ? "What the rejection means: " : "거절의 의미: "}{ch04.desireMismatchAndRejection.personBRejection.interpretation}</p>
              <p className="text-xs text-rel-ink-soft">{isEn ? "How they express it: " : "거절 표현 방식: "}{ch04.desireMismatchAndRejection.personBRejection.expressionStyle}</p>
              <p className="text-xs text-v4-good font-medium">{isEn ? "Reconnection cue: " : "재연결 신호: "}{ch04.desireMismatchAndRejection.personBRejection.reconnectionNeed}</p>
            </RelationshipReportInset>
          </div>
        )}
        <RelationshipReportInset className="bg-rel-taupe-soft/30 border border-rel-line">
          <p className="text-xs font-medium text-rel-ink">▫ {ch04.desireMismatchAndRejection.mismatchAdvice}</p>
        </RelationshipReportInset>
      </div>

      {/* SECTION 08: Pair Intimacy Paradox */}
      {ch04.pairIntimacyParadox && ch04.pairIntimacyParadox.paradoxType !== "NONE" ? (
        <div className="space-y-3">
          <SubHeading title={isEn ? "Pair Intimacy Paradox" : "08. 우리 둘만의 Intimacy Paradox"} tag="친밀감 역설" tone="coral" />
          <RelationshipReportInset className="space-y-2 border border-rel-line bg-rel-surface">
            <p className="text-xs font-bold text-rel-deep">▫ {ch04.pairIntimacyParadox.headline}</p>
            <p className="text-xs leading-relaxed text-rel-ink-soft">{ch04.pairIntimacyParadox.explanation}</p>
            <p className="text-xs text-emerald-800 font-medium border-t border-rel-line/40 pt-2">▫ {isEn ? "When this strength clicks: " : "이 장점이 잘 맞을 때: "}{ch04.pairIntimacyParadox.whenThriving}</p>
            <p className="text-xs text-red-800 font-medium">▫ {isEn ? "When it's easy to misread: " : "오해가 생기기 쉬울 때: "}{ch04.pairIntimacyParadox.whenFriction}</p>
          </RelationshipReportInset>
        </div>
      ) : null}

      {/* BONUS SECTION 09: Sleep Compatibility (CONFIDENCE GATE OMIT) */}
      {ch04.sleepCompatibility && ch04.sleepCompatibility.isSupported && ch04.sleepCompatibility.confidence !== "LOW" ? (
        <div className="space-y-2">
          <SubHeading title={isEn ? "Bonus: Sleep Compatibility" : "BONUS. 같이 자는 밤도 궁합이 있을까?"} tone="deep" />
          <RelationshipReportInset className="border border-rel-line bg-rel-surface p-4 rounded-xl">
            <p className="text-xs font-semibold leading-relaxed text-rel-ink">{ch04.sleepCompatibility.pairInterpretation}</p>
          </RelationshipReportInset>
        </div>
      ) : null}
    </div>
  );
}

function LifePartnershipVerdictCard({
  view,
  names,
  isEn,
}: {
  view?: import("@/lib/relationship/marriage/viewModel/marriageUiContracts").MarriagePartnershipVerdictViewModel;
  names: [string, string];
  isEn: boolean;
}) {
  return null;
}

// ---- Deep-read canonical merge blocks ---------------------------------------
// Additive expert-synthesis subsections for Ch1/Ch3/Ch8/Ch9 — see
// docs/dev/decisions/028 and the Deep Read Content Ownership Audit. Each
// block renders only what the (optional) ViewModel field actually contains;
// none fabricate a fallback, and none carry a title/verdict/score of their
// own — canonical meaning (the cards above) stays authoritative.

function ExpertVoiceBlock({
  vm,
  viewerIsReportA,
}: {
  vm?: import("@/lib/relationship/marriage/viewModel/marriageUiContracts").MarriageExpertVoiceViewModel;
  viewerIsReportA: boolean;
}) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  if (!vm || (!vm.personA && !vm.personB)) return null;
  // vm.personA/personB are CANONICAL (report_id_a/b), not viewer-relative —
  // pick which one is "me" vs "my partner" based on who's actually viewing,
  // matching the same convention the legacy DeepReadCard's `swap` param uses.
  const myVoice = viewerIsReportA ? vm.personA : vm.personB;
  const partnerVoice = viewerIsReportA ? vm.personB : vm.personA;
  return (
    <RelationshipReportInset className="mb-4">
      {myVoice ? (
        <div>
          <RelationshipReportLabel>{t.deepReadVoiceMeLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5 italic">
            “{myVoice.voice}” — {myVoice.personName}
          </RelationshipReportParagraph>
        </div>
      ) : null}
      {partnerVoice ? (
        <div className={myVoice ? "mt-3" : ""}>
          <RelationshipReportLabel>{t.deepReadVoicePartnerLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5 italic">
            “{partnerVoice.voice}” — {partnerVoice.personName}
          </RelationshipReportParagraph>
        </div>
      ) : null}
    </RelationshipReportInset>
  );
}

function RoleFitInsightBlock({ text }: { text?: string }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  if (!text) return null;
  return (
    <RelationshipReportInset className="mt-4">
      <RelationshipReportLabel>{t.deepReadPatternLabel}</RelationshipReportLabel>
      <RelationshipReportParagraph className="mt-1.5">{text}</RelationshipReportParagraph>
    </RelationshipReportInset>
  );
}

function TogetherInsightBlock({
  vm,
}: {
  vm?: import("@/lib/relationship/marriage/viewModel/marriageUiContracts").MarriageTogetherInsightViewModel;
}) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  if (!vm) return null;
  return (
    <RelationshipReportInset className="mt-4">
      <RelationshipReportLabel>{t.deepReadTogetherLabel}</RelationshipReportLabel>
      <RelationshipReportParagraph className="mt-1.5">{vm.text}</RelationshipReportParagraph>
      {vm.starter ? (
        <RelationshipReportParagraph className="mt-1.5 italic">“{vm.starter}”</RelationshipReportParagraph>
      ) : null}
    </RelationshipReportInset>
  );
}

function PersonalizedAdviceBlock({
  vm,
  canonicalNames,
  viewerIsReportA,
}: {
  vm?: import("@/lib/relationship/marriage/viewModel/marriageUiContracts").MarriagePersonalizedAdviceViewModel;
  canonicalNames: [string, string];
  viewerIsReportA: boolean;
}) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  if (!vm || (vm.forPersonA.length === 0 && vm.forPersonB.length === 0)) return null;
  // vm.forPersonA/forPersonB are CANONICAL (report_id_a/b) — pick which
  // side is "me" vs "my partner" based on who's actually viewing, same
  // convention as ExpertVoiceBlock / the legacy DeepReadCard's `swap`.
  const myTips = viewerIsReportA ? vm.forPersonA : vm.forPersonB;
  const partnerTips = viewerIsReportA ? vm.forPersonB : vm.forPersonA;
  const myName = viewerIsReportA ? canonicalNames[0] : canonicalNames[1];
  const partnerName = viewerIsReportA ? canonicalNames[1] : canonicalNames[0];

  const renderTips = (
    tips: import("@/lib/relationship/marriage/viewModel/marriageUiContracts").MarriagePersonalizedAdviceTip[],
    label: string,
  ) => {
    if (tips.length === 0) return null;
    return (
      <div>
        <RelationshipReportLabel>{label}</RelationshipReportLabel>
        <div className="mt-2 space-y-3">
          {tips.map((tip, i) => (
            <RelationshipReportInset key={`${tip.actionTitle}-${i}`}>
              <p className="text-sm font-semibold text-rel-ink">{tip.actionTitle}</p>
              <RelationshipReportParagraph className="mt-1.5" muted>
                {tip.reason}
              </RelationshipReportParagraph>
              <RelationshipReportParagraph className="mt-1.5 italic">
                “{tip.speechTip}”
              </RelationshipReportParagraph>
              {tip.example ? (
                <RelationshipReportParagraph className="mt-1.5" muted>
                  {tip.example}
                </RelationshipReportParagraph>
              ) : null}
            </RelationshipReportInset>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 space-y-4">
      {renderTips(myTips, `${t.deepReadAdviceMeLabel} (${myName})`)}
      {renderTips(partnerTips, `${t.deepReadAdvicePartnerLabel} (${partnerName})`)}
    </div>
  );
}

// ---- Dispatcher -------------------------------------------------------------

type NonSnapshotSection = Exclude<MarriageReportSection, { type: "household_snapshot" }>;

export function MarriageReportSectionCard({
  section,
  names,
  viewerIsReportA,
}: {
  section: NonSnapshotSection;
  names: [string, string];
  viewerIsReportA: boolean;
}): ReactNode {
  switch (section.type) {
    case "origin_story":
      return <OriginStoryCard section={section} names={names} />;
    case "daily_life_mirror":
      return <DailyLifeMirrorCard section={section} />;
    case "deep_read":
      return <DeepReadSectionCard section={section} />;
    case "compare_table":
      return <CompareTableCard section={section} viewerIsReportA={viewerIsReportA} names={names} />;
    case "psych_radar":
      return <PsychRadarCard section={section} names={names} />;
    case "money_chores":
      return <MoneyChoresCard section={section} names={names} />;
    case "bedroom":
      return null;
    case "home_dna":
      return <HomeDnaCard section={section} />;
    case "parenting":
      return <ParentingCard section={section} names={names} />;
    case "family_boundary":
      return <FamilyBoundaryCard section={section} />;
    case "weather_forecast":
      return <WeatherForecastCard section={section} />;
    case "privacy":
      return <PrivacyCard section={section} />;
    case "upset":
      return <UpsetCard section={section} />;
    case "warning":
      return <WarningCard section={section} />;
    case "prescription":
      return <PrescriptionCard section={section} />;
    default: {
      const exhaustiveCheck: never = section;
      return exhaustiveCheck;
    }
  }
}

/** ViewModel 전체를 에디토리얼 레이아웃으로 조립 — production 진입점. */
export function MarriageReportViewModelView({
  vm,
  kindLabel,
  viewerIsReportA,
}: {
  vm: MarriageReportViewModel;
  kindLabel?: string;
  viewerIsReportA: boolean;
}) {
  const { locale } = useLocale();
  const t = useMessages().relationshipDrilldown.cohabitation;
  const isEn = locale === "en-US";

  const snapshot = vm.sections.find(
    (s): s is Extract<MarriageReportSection, { type: "household_snapshot" }> =>
      s.type === "household_snapshot",
  );
  const otherSections = vm.sections.filter(
    (s): s is NonSnapshotSection => s.type !== "household_snapshot",
  );
  const byType = new Map<MarriageSectionType, NonSnapshotSection[]>();
  for (const section of otherSections) {
    const list = byType.get(section.type) ?? [];
    list.push(section);
    byType.set(section.type, list);
  }

  const chapters = CHAPTER_GROUPS.map((group) => ({
    ...group,
    sections: group.types.flatMap((type) => byType.get(type) ?? []),
  })).filter((group) => group.sections.length > 0);
  const bonusSections = BONUS_CHAPTER_TYPES.flatMap((type) => byType.get(type) ?? []);

  const navItems = [
    ...chapters.map((chapter, i) => ({
      id: chapter.id,
      number: String(i + 1).padStart(2, "0"),
      title: isEn ? chapter.titleEn : chapter.titleKo,
    })),
    ...(bonusSections.length > 0
      ? [{ id: "ch_deep_read", number: null, title: bonusSections[0]!.title }]
      : []),
  ];

  return (
    <div
      className={`bg-rel-bg font-rel-sans text-rel-ink antialiased ${relSans.variable} ${relSerif.variable}`}
      lang={isEn ? "en" : "ko"}
    >
      <MarriageEditorialHero
        eyebrow={kindLabel ?? t.defaultKindLabel}
        headline={vm.opening.headline}
        names={vm.opening.names}
      />
      {snapshot ? (() => {
        const topics = snapshot.panel?.narrative?.topics ?? [];
        const intimacy = topics.find(t => t.topic === "intimacy");
        const stability = topics.find(t => t.topic === "stability");
        const conflict = topics.find(t => t.topic === "conflict");

        const cards: OverviewCardData[] = [
          {
            key: "intimacy",
            icon: "🔥",
            label: t.scoreLabelRomanticFit,
            score: snapshot.scores.romanticFitPct,
            tone: "good",
            inverted: false,
            gradeLabel: intimacy?.title ?? t.scoreLabelRomanticFit,
            oneLiner: intimacy?.subtitle ?? "",
            measures: locale === "en-US" ? "How deeply you connect on a romantic and emotional level" : "두 사람이 정서적으로 얼마나 깊이 연결되어 있는지",
            why: intimacy?.interpretation ?? "",
            thresholdText: intimacy?.axisNote,
          },
          {
            key: "stability",
            icon: "🧩",
            label: t.scoreLabelLifeSynergy,
            score: snapshot.scores.lifeSynergyPct,
            tone: "neutral",
            inverted: false,
            gradeLabel: stability?.title ?? t.scoreLabelLifeSynergy,
            oneLiner: stability?.subtitle ?? "",
            measures: locale === "en-US" ? "How well you navigate real-world challenges and life together" : "현실적인 문제와 삶의 방향성을 얼마나 잘 맞춰갈 수 있는지",
            why: stability?.interpretation ?? "",
            thresholdText: stability?.axisNote,
          },
          {
            key: "conflict",
            icon: "⚡",
            label: t.scoreLabelHomeRisk,
            score: snapshot.scores.homeRiskPct,
            tone: "warn",
            inverted: true,
            gradeLabel: conflict?.title ?? t.scoreLabelHomeRisk,
            oneLiner: conflict?.subtitle ?? "",
            measures: locale === "en-US" ? "The potential for friction or misunderstanding in daily life" : "결혼 생활 중 의사소통이나 가치관 차이로 마찰이 생길 가능성",
            why: conflict?.interpretation ?? "",
            thresholdText: conflict?.axisNote,
          },
        ];

        return (
          <div className="mb-12 mt-4">
            <OverviewSection
              locale={locale}
              eyebrow="OVERVIEW"
              title={pick(locale, "At a Glance", "한눈에 보기")}
              lead=""
              cards={cards}
            />
          </div>
        );
      })() : null}
      {/* Canonical 01..09 Chapter Nav & Sections */}
      {vm.canonicalStoryPlan ? (
        <>
          <MarriageChapterNav
            items={CANONICAL_CHAPTER_DEFINITIONS.map((c) => ({
              id: c.id,
              number: c.number,
              title: isEn ? c.titleEn : c.titleKo,
            }))}
          />
          {CANONICAL_CHAPTER_DEFINITIONS.map((cDef) => {
            const chOwnership = vm.canonicalStoryPlan?.chapters.find((ch) => ch.chapterId === cDef.id);
            const summaryText = chOwnership?.summary?.replace(/null/g, "")?.trim();

            return (
              <MarriageChapterSection
                key={cDef.id}
                id={cDef.id}
                number={cDef.number}
                title={isEn ? cDef.titleEn : cDef.titleKo}
                accent={ACCENT}
              >
                {summaryText && cDef.id !== "c2_lifestyle_dna" && cDef.id !== "c7_longterm_compounding" && cDef.id !== "c3_household_os" && cDef.id !== "c9_next_chapter_rituals" && cDef.id !== "c4_intimacy_bedroom" ? (
                  <RelationshipReportInset className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-rel-taupe">
                      ▫ {chOwnership?.userQuestion}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-rel-ink">
                      {summaryText}
                    </p>
                  </RelationshipReportInset>
                ) : null}

                {cDef.id === "c1_who_we_are" ? (
                  <ExpertVoiceBlock vm={vm.chapter1ExpertVoice} viewerIsReportA={viewerIsReportA} />
                ) : null}

                {cDef.id === "c7_longterm_compounding" ? (
                  <Chapter03SubstantiveCard bundle={vm.canonicalBundle} names={vm.canonicalNames} isEn={isEn} />
                ) : null}

                {cDef.id === "c4_intimacy_bedroom" ? (
                  <Chapter04SubstantiveCard bundle={vm.canonicalBundle} names={vm.canonicalNames} isEn={isEn} />
                ) : null}

                {cDef.id === "c5_conflict_deescalation" ? (
                  <MarriageChapter07View ch07={vm.chapter07Intelligence} canonicalNames={vm.canonicalNames} isEn={isEn} />
                ) : null}

                {cDef.id === "c9_next_chapter_rituals" ? (
                  <MarriageChapter08View ch08={vm.chapter08Intelligence} canonicalNames={vm.canonicalNames} isEn={isEn} />
                ) : null}

                {/* Map only this chapter's explicitly owned section cards */}
                {otherSections
                  .filter((sec) => cDef.types.includes(sec.type))
                  .map((section) => (
                    <MarriageReportSectionCard
                      key={section.id}
                      section={section}
                      names={vm.opening.names}
                      viewerIsReportA={viewerIsReportA}
                    />
                  ))}
              </MarriageChapterSection>
            );
          })}
        </>
      ) : (
        <>
          <MarriageChapterNav items={navItems} />
          {chapters.map((chapter, i) => (
            <MarriageChapterSection
              key={chapter.id}
              id={chapter.id}
              number={String(i + 1).padStart(2, "0")}
              title={isEn ? chapter.titleEn : chapter.titleKo}
              accent={ACCENT}
            >
              {chapter.sections.map((section) => (
                <MarriageReportSectionCard
                  key={section.id}
                  section={section}
                  names={vm.opening.names}
                  viewerIsReportA={viewerIsReportA}
                />
              ))}
            </MarriageChapterSection>
          ))}
        </>
      )}
      {!vm.canonicalStoryPlan && bonusSections.length > 0 ? (
        <MarriageChapterSection id="ch_deep_read" number={null} title={bonusSections[0]!.title} accent={ACCENT}>
          {bonusSections.map((section) => (
            <MarriageReportSectionCard
              key={section.id}
              section={section}
              names={vm.opening.names}
              viewerIsReportA={viewerIsReportA}
            />
          ))}
        </MarriageChapterSection>
      ) : null}
    </div>
  );
}
