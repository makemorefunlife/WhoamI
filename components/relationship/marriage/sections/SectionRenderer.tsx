"use client";

/**
 * Marriage/Cohabitation Premium — MarriageReportViewModel 전용 렌더러.
 * work·friend의 SectionRenderer.tsx와 동일한 패턴 — en-US/ko-KR 둘 다
 * production에서 쓰인다(ko-KR 전용 게이트 금지). 카드 내부 라벨은 전부
 * `useMessages().relationshipDrilldown.cohabitation`에서 가져온다.
 */
import type { ReactNode } from "react";
import { User, MessageCircle, Sun, Cloud, CloudLightning } from "lucide-react";
import {
  RelationshipReportLayout,
  RelationshipReportCard,
  RelationshipReportBody,
  RelationshipReportParagraph,
  RelationshipReportLabel,
  RelationshipReportInset,
  PsychMatchRadarChart,
  getTabTheme,
} from "@/components/relationship/reportLayout";
import {
  default as TriScoreSnapshotPanel,
} from "@/components/relationship/TriScoreSnapshotPanel";
import { OverviewSection } from "@/components/relationship/shared/overview/OverviewSection";
import type { OverviewCardData } from "@/lib/relationship/shared/overview/overviewTypes";
import { pick } from "@/lib/relationship/friend/friendCopy";
import PairPrescriptionSection from "@/components/relationship/shared/PairPrescriptionSection";
import type {
  BedroomSection,
  CompareTableSection,
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

const ACCENT = getTabTheme("cohabitation").accent;

/** 하드코딩 이모지 대신 — 3년 날씨 레벨 → Lucide 아이콘 + 테마 컬러. */
const WEATHER_ICON: Record<string, { Icon: typeof Sun; className: string }> = {
  sunny: { Icon: Sun, className: "text-emerald-300" },
  cloudy: { Icon: Cloud, className: "text-amber-400" },
  storm: { Icon: CloudLightning, className: "text-rose-500" },
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

// ---- Canonical 9-Chapter Structure (Phase 7 Final Synthesis) ------------------
const CANONICAL_CHAPTER_DEFINITIONS: Array<{
  id: string;
  number: string;
  titleKo: string;
  titleEn: string;
  types: Array<MarriageReportSection["type"]>;
}> = [
  { id: "c1_who_we_are", number: "01", titleKo: "우리는 어떤 부부인가", titleEn: "Who We Are as a Married Couple", types: ["origin_story"] },
  { id: "c2_lifestyle_dna", number: "02", titleKo: "함께 살 때 각자의 라이프스타일과 기질", titleEn: "Life Style & Household DNA", types: ["psych_radar", "compare_table", "home_dna"] },
  { id: "c3_household_os", number: "03", titleKo: "돈, 집안일, 보이지 않는 운영 책임", titleEn: "Household OS: Money, Chores & PM", types: ["money_chores"] },
  { id: "c4_intimacy_bedroom", number: "04", titleKo: "사랑, 신체적 친밀감과 침실 이야기", titleEn: "Physical Intimacy & Bedroom Chemistry", types: ["bedroom"] },
  { id: "c5_conflict_deescalation", number: "05", titleKo: "부딪히는 순간과 다시 가까워지는 법", titleEn: "Conflict, De-Escalation & SOS Script", types: ["warning"] },
  { id: "c6_family_parenting_career", number: "06", titleKo: "원가족 경계, 자녀 양육과 일-가정 밸런스", titleEn: "Family Boundary, Parenting & Career-Home", types: ["parenting", "family_boundary", "weather_forecast"] },
  { id: "c7_longterm_compounding", number: "07", titleKo: "함께 살수록 쌓이는 자산과 부채", titleEn: "Long-Term Compounding: Assets & Liabilities", types: ["privacy"] },
  { id: "c8_partnership_verdict", number: "08", titleKo: "부부 파트너십 최종 판정", titleEn: "Life Partnership Verdict", types: [] },
  { id: "c9_next_chapter_rituals", number: "09", titleKo: "오래 함께 살기 위한 우리의 넥스트 챕터", titleEn: "Our Next Chapter & Household Rituals", types: ["upset", "prescription"] },
];

const CHAPTER_GROUPS: Array<{
  id: string;
  types: Exclude<MarriageSectionType, "household_snapshot">[];
  titleKo: string;
  titleEn: string;
}> = [
  {
    id: "ch_temperature",
    types: ["origin_story"],
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
    id: "ch_money_chores",
    types: ["money_chores"],
    titleKo: "가사와 재정의 완벽한 분담",
    titleEn: "Splitting Chores & Finances",
  },
  {
    id: "ch_fight_pattern",
    types: ["warning", "upset", "privacy"],
    titleKo: "부부싸움의 패턴과 해독제",
    titleEn: "Your Fight Pattern & the Antidote",
  },
  {
    id: "ch_parenting_boundary",
    types: ["parenting", "family_boundary"],
    titleKo: "육아 가치관과 원가족 바운더리",
    titleEn: "Parenting Values & In-Law Boundaries",
  },
  {
    id: "ch_bedroom",
    types: ["bedroom"],
    titleKo: "침실 케미스트리와 정서적 애착",
    titleEn: "Bedroom Chemistry & Attachment",
  },
  {
    id: "ch_weather",
    types: ["weather_forecast"],
    titleKo: "향후 3년의 홈 리스크 기상도",
    titleEn: "Your 3-Year Home Risk Forecast",
  },
  {
    id: "ch_playbook",
    types: ["prescription"],
    titleKo: "오래 단단할 우리를 위한 절대 처방전",
    titleEn: "The Playbook for the Long Run",
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
              <RelationshipReportParagraph className="mt-3 text-white/72">{row.meaning}</RelationshipReportParagraph>
              <div className="mt-8 h-px w-full bg-white/10" />
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
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <PsychAxisComparisonSection
        axisResults={section.axisResults}
        highlights={section.highlights}
        chartNote={section.chartNote}
        names={names}
        locale={locale}
      />
    </RelationshipReportCard>
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
            <p className="text-sm font-semibold text-white/92">{item.title}</p>
            <RelationshipReportParagraph className="mt-1.5">{item.body}</RelationshipReportParagraph>
            <RelationshipReportParagraph className="mt-1.5 flex items-start gap-2 italic text-emerald-100/85">
              <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" strokeWidth={1.75} aria-hidden />
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

function MoneyChoresCard({ section }: { section: MoneyChoresSection }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  return (
    <>
      <RelationshipReportCard title={section.title} accentColor={ACCENT}>
        <RelationshipReportBody>
          <div>
            <RelationshipReportLabel>{t.cfoQuestionLabel}</RelationshipReportLabel>
            {section.cfoCanonicalLabel ? (
              <RelationshipReportLabel className="mt-1.5">
                {section.cfoCanonicalLabel}
              </RelationshipReportLabel>
            ) : null}
            <RelationshipReportParagraph className="mt-1.5">
              {section.cfoNickname} — {section.cfoReason}
            </RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>{t.choresLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.choresGuideline}</RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>{t.spendingStyleLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.spendingStyleNote}</RelationshipReportParagraph>
          </div>
          {section.cfoAxisNote ? (
            <RelationshipReportInset>
              <RelationshipReportLabel>{t.cfoAxisNoteLabel}</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">{section.cfoAxisNote}</RelationshipReportParagraph>
            </RelationshipReportInset>
          ) : null}
          {section.mentalLoadNote ? (
            <RelationshipReportInset>
              <RelationshipReportLabel>Mental load</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">{section.mentalLoadNote}</RelationshipReportParagraph>
            </RelationshipReportInset>
          ) : null}
        </RelationshipReportBody>
      </RelationshipReportCard>
      {section.coupleActionPlan ? <CoupleActionPlanBlock plan={section.coupleActionPlan} /> : null}
    </>
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
            <p className="flex items-center gap-1.5 text-sm font-bold text-white/92"><PersonBadge /> {person.nickname}</p>
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
      <p className="mt-3 text-sm text-white/72">{matrix.frequency_one_liner}</p>
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
            <p className="flex items-center gap-1.5 text-sm font-bold text-white/92"><PersonBadge /> {person.nickname}</p>
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

function ParentingCard({ section }: { section: ParentingSection }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  const roleNotes = [section.personARoleNote, section.personBRoleNote].filter(
    (note): note is string => Boolean(note),
  );
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <RelationshipReportParagraph>{section.combinedAttitude}</RelationshipReportParagraph>
        <RelationshipReportParagraph>{section.personAStyle}</RelationshipReportParagraph>
        <RelationshipReportParagraph>{section.personBStyle}</RelationshipReportParagraph>
        <RelationshipReportInset>
          <RelationshipReportParagraph>{section.harmonyTip}</RelationshipReportParagraph>
        </RelationshipReportInset>
        {roleNotes.length > 0 ? (
          <RelationshipReportInset>
            <RelationshipReportLabel>{t.parentingRoleNoteLabel}</RelationshipReportLabel>
            {roleNotes.map((note) => (
              <RelationshipReportParagraph key={note} className="mt-1.5">
                {note}
              </RelationshipReportParagraph>
            ))}
          </RelationshipReportInset>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function FamilyBoundaryCard({ section }: { section: FamilyBoundarySection }) {
  const t = useMessages().relationshipDrilldown.cohabitation;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div>
          <RelationshipReportLabel>{t.inlawStressLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.inlawStressSummary}</RelationshipReportParagraph>
        </div>
        <RelationshipReportParagraph>{section.personABoundaryNote}</RelationshipReportParagraph>
        <RelationshipReportParagraph>{section.personBBoundaryNote}</RelationshipReportParagraph>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function WeatherForecastCard({ section }: { section: WeatherForecastSection }) {
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportParagraph>{section.forecast.summary_line}</RelationshipReportParagraph>
      <ul className="mt-4 space-y-3">
        {section.forecast.years.map((y) => {
          const weather = WEATHER_ICON[y.level] ?? WEATHER_ICON.cloudy!;
          const WeatherIcon = weather.Icon;
          return (
          <li key={y.year} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-white/92">
              <WeatherIcon className={`h-4 w-4 ${weather.className}`} strokeWidth={1.75} aria-hidden />
              {y.year_label} — {y.weather_label}
            </p>
            {y.advisory ? (
              <RelationshipReportParagraph className="mt-1.5 text-white/78">{y.advisory}</RelationshipReportParagraph>
            ) : null}
          </li>
          );
        })}
      </ul>
    </RelationshipReportCard>
  );
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
            <p className="text-sm font-bold text-white/92">{t.upsetGuideTitle(guide.nickname)}</p>
            <div className="mt-3 space-y-2.5">
              <div>
                <RelationshipReportLabel>{t.upsetPointLabel}</RelationshipReportLabel>
                <RelationshipReportParagraph className="mt-1">{guide.upset_signals}</RelationshipReportParagraph>
              </div>
              <div>
                <RelationshipReportLabel>{t.resolveLabel}</RelationshipReportLabel>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-white/80">
                  {guide.do_list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <RelationshipReportLabel>{t.avoidLabel}</RelationshipReportLabel>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-white/80">
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
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT} variant="warning">
      <RelationshipReportBody>
        <div>
          <RelationshipReportLabel>{t.conflictTriggerLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.conflictTrigger}</RelationshipReportParagraph>
        </div>
        <div>
          <p className="text-sm font-bold text-white/92">{section.conflictCommunication.pattern_label}</p>
          <RelationshipReportParagraph className="mt-1.5">
            {section.conflictCommunication.narrative}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph className="mt-1.5 text-white/72">
            {section.conflictCommunication.emotional_neglect_risk}
          </RelationshipReportParagraph>
        </div>
        <RelationshipReportInset className="mt-2 border-emerald-400/20 bg-emerald-950/10">
          <RelationshipReportParagraph className="italic text-emerald-100/85">
            <MessageCircle className="mr-1.5 inline h-3.5 w-3.5 text-emerald-300" strokeWidth={1.75} aria-hidden /> {section.deEscalation.person_a.solution_script}
          </RelationshipReportParagraph>
          <RelationshipReportParagraph className="mt-2 italic text-emerald-100/85">
            <MessageCircle className="mr-1.5 inline h-3.5 w-3.5 text-emerald-300" strokeWidth={1.75} aria-hidden /> {section.deEscalation.person_b.solution_script}
          </RelationshipReportParagraph>
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

function EconomicPartnershipCard({ bundle, names }: { bundle?: MarriageCanonicalBundle; names: [string, string] }) {
  if (!bundle?.economicPartnership) return null;
  const { profileA, profileB, pairSynergyTitle, pairSynergyNarrative, decisionFlow } = bundle.economicPartnership;

  const strategyTitle = profileA.primaryRole === "SAVER_ACCUMULATOR" || profileB.primaryRole === "SAVER_ACCUMULATOR"
    ? "안정적 현금 버퍼 확보 ➔ 분기별 고정 저축 시스템"
    : "성장 자산화 탐색 ➔ 목표 기반 분할 축적 시스템";

  return (
    <RelationshipReportCard title="💸 부부 경제 파트너십 (Economic Partnership Role Map)" accentColor={ACCENT}>
      <div className="grid gap-4 sm:grid-cols-2">
        <RelationshipReportInset>
          <p className="font-bold text-white/90">👤 {names[0]}님의 경제적 역할</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-200">{profileA.primaryRoleLabel}</span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300/80">{profileA.secondaryRoleLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/80">{profileA.behaviorDescription}</p>
        </RelationshipReportInset>

        <RelationshipReportInset>
          <p className="font-bold text-white/90">👤 {names[1]}님의 경제적 역할</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-200">{profileB.primaryRoleLabel}</span>
            <span className="rounded bg-teal-500/10 px-2 py-0.5 text-xs text-teal-300/80">{profileB.secondaryRoleLabel}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/80">{profileB.behaviorDescription}</p>
        </RelationshipReportInset>
      </div>

      <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4">
        <p className="text-sm font-bold text-emerald-200">🤝 부부 경제 파트너십 시너지: {pairSynergyTitle}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-emerald-100/90">{pairSynergyNarrative}</p>
      </div>

      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
        <p className="text-sm font-bold text-amber-200">💡 우리 부부에게 권장하는 돈 모으기 & 자산 운용 방식</p>
        <p className="mt-1 text-xs font-semibold text-amber-100">{strategyTitle}</p>
        <p className="mt-1 text-xs text-white/80">
          두 사람의 성향에 맞춰 월 고정비와 예비비를 먼저 분리한 뒤, 대형 지출 전에는 상호 검토 수순을 거쳐 장기 자산화로 연결하는 구조가 가장 안전합니다.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-xs">
        <p className="font-semibold text-amber-200/90">📊 경제 의사결정 및 관리 수순 (Economic Decision Flow)</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-white/80 sm:grid-cols-3">
          <div><span className="text-white/50">1. 현금흐름 관리:</span> {decisionFlow.cashFlowTracker}님</div>
          <div><span className="text-white/50">2. 대형지출 제안:</span> {decisionFlow.largePurchaseProposer}님</div>
          <div><span className="text-white/50">3. 리스크 검토:</span> {decisionFlow.riskReviewer}님</div>
          <div><span className="text-white/50">4. 최종 의사결정:</span> {decisionFlow.decider}</div>
          <div><span className="text-white/50">5. 금융 실무집행:</span> {decisionFlow.executor}님</div>
        </div>
      </div>
    </RelationshipReportCard>
  );
}

function ConflictSubstantiveCard({
  view,
  bundle,
  names,
}: {
  view?: import("@/lib/relationship/marriage/viewModel/marriageUiContracts").MarriageConflict4StageViewModel;
  bundle?: MarriageCanonicalBundle;
  names: [string, string];
}) {
  const personA = view?.personA;
  const personB = view?.personB;
  const scriptAtoB = bundle?.emergencySosCombined?.scriptAtoB;
  const scriptBtoA = bundle?.emergencySosCombined?.scriptBtoA;
  const crisis = bundle?.crisisRole;

  if (!personA || !personB) return null;

  return (
    <RelationshipReportCard title="🔥 갈등 4단계 상태 전이 & 위기 대응 파트너십" accentColor={ACCENT} variant="warning">
      <div className="grid gap-4 sm:grid-cols-2">
        <RelationshipReportInset>
          <p className="font-bold text-rose-200">⚡ {names[0]}님의 갈등 감정 4단계 전이</p>
          <ol className="mt-2 space-y-2 text-xs text-white/85">
            {personA.stages.map((st) => (
              <li key={st.stepNumber}>
                <span className="font-semibold text-amber-300">Step {st.stepNumber} ({st.label}):</span>
                <p className="mt-0.5 text-white/80 leading-relaxed">{st.narrative}</p>
              </li>
            ))}
          </ol>
        </RelationshipReportInset>

        <RelationshipReportInset>
          <p className="font-bold text-rose-200">⚡ {names[1]}님의 갈등 감정 4단계 전이</p>
          <ol className="mt-2 space-y-2 text-xs text-white/85">
            {personB.stages.map((st) => (
              <li key={st.stepNumber}>
                <span className="font-semibold text-amber-300">Step {st.stepNumber} ({st.label}):</span>
                <p className="mt-0.5 text-white/80 leading-relaxed">{st.narrative}</p>
              </li>
            ))}
          </ol>
        </RelationshipReportInset>
      </div>

      {crisis ? (
        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
          <p className="text-sm font-bold text-amber-200">
            🛡️ 위기 시 역할 분담: {crisis.practicalLead === "a" ? names[0] : names[1]}님(현실 문제 해결 리드) × {crisis.emotionalAnchor === "a" ? names[0] : names[1]}님(정서적 버팀목)
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/85">
            {crisis.narrative || `${names[0]}님과 ${names[1]}님은 예상치 못한 문제 발생 시 현실적 해결과 정서적 안정을 유연하게 나누어 맡는 상보적 팀입니다.`}
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {scriptAtoB?.firstLine ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-4">
            <p className="text-xs font-bold text-rose-200">🆘 {names[0]} ➔ {names[1]} 긴급 SOS 회복 대본</p>
            <p className="mt-2 text-xs font-medium text-white/90">💬 첫 마디: "{scriptAtoB.firstLine}"</p>
            {scriptAtoB.acknowledgement ? <p className="mt-1 text-xs text-white/75">🛡️ 인정: {scriptAtoB.acknowledgement}</p> : null}
            {scriptAtoB.tabooWord ? <p className="mt-1 text-xs text-rose-300/80">⚠️ 금지 단어: {scriptAtoB.tabooWord}</p> : null}
          </div>
        ) : null}

        {scriptBtoA?.firstLine ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-4">
            <p className="text-xs font-bold text-rose-200">🆘 {names[1]} ➔ {names[0]} 긴급 SOS 회복 대본</p>
            <p className="mt-2 text-xs font-medium text-white/90">💬 첫 마디: "{scriptBtoA.firstLine}"</p>
            {scriptBtoA.acknowledgement ? <p className="mt-1 text-xs text-white/75">🛡️ 인정: {scriptBtoA.acknowledgement}</p> : null}
            {scriptBtoA.tabooWord ? <p className="mt-1 text-xs text-rose-300/80">⚠️ 금지 단어: {scriptBtoA.tabooWord}</p> : null}
          </div>
        ) : null}
      </div>
    </RelationshipReportCard>
  );
}

function Chapter07SubstantiveCard({ bundle, names }: { bundle?: MarriageCanonicalBundle; names: [string, string] }) {
  if (!bundle?.coupleBurnout || !bundle?.longTermCompounding || !bundle?.expectationsAndNeeds) return null;
  const { primaryOverloadRiskPartner, overallNarrative } = bundle.coupleBurnout;
  const { assets, liabilities, compoundingSummary } = bundle.longTermCompounding;
  const { expectationsAtoB, expectationsBtoA } = bundle.expectationsAndNeeds;

  const expA = expectationsAtoB[0]?.whatNotToExpect || "지나치게 자발적인 집안 정리를 기대하기보다는 구체적인 업무를 요청하는 것이 안전합니다.";
  const expB = expectationsBtoA[0]?.whatNotToExpect || "감정 표현에 매순간 완벽하게 반응해주기보다 혼자만의 복원 시간이 필요함을 인정해야 합니다.";

  const primaryPartnerName = primaryOverloadRiskPartner === "a" ? names[0] : primaryOverloadRiskPartner === "b" ? names[1] : "균형";

  return (
    <RelationshipReportCard title="⚖️ 장기 부부 자산과 부채 & 번아웃 리스크" accentColor={ACCENT}>
      <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4">
        <p className="text-sm font-bold text-amber-200">🚨 번아웃 및 가사 PM 소진 주의 파트너: {primaryPartnerName}님</p>
        <p className="mt-1 text-xs text-amber-100/90">{overallNarrative || `${primaryPartnerName}님이 집안 운영 기획과 루틴을 주로 챙기고 있어 정기적인 가사 업무 분담 재협상이 필요합니다.`}</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <RelationshipReportInset>
          <p className="font-bold text-amber-200">⚠️ {names[0]} ➔ {names[1]} 배우자에게 기대하지 말아야 할 것</p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/80">{expA}</p>
        </RelationshipReportInset>

        <RelationshipReportInset>
          <p className="font-bold text-amber-200">⚠️ {names[1]} ➔ {names[0]} 배우자에게 기대하지 말아야 할 것</p>
          <p className="mt-1.5 text-xs leading-relaxed text-white/80">{expB}</p>
        </RelationshipReportInset>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <RelationshipReportInset>
          <p className="font-bold text-emerald-300">📈 시간이 살수록 쌓이는 부부 자산 (Assets)</p>
          <ul className="mt-2 space-y-2 text-xs text-white/85">
            {assets.map((ast, i) => (
              <li key={i}>
                <p className="font-semibold text-emerald-200">{ast.title}</p>
                {ast.body ? <p className="text-white/75">{ast.body}</p> : null}
              </li>
            ))}
          </ul>
        </RelationshipReportInset>

        <RelationshipReportInset>
          <p className="font-bold text-rose-300">📉 관리를 안 하면 누적되는 부부 부채 (Liabilities)</p>
          <ul className="mt-2 space-y-2 text-xs text-white/85">
            {liabilities.map((liab, i) => (
              <li key={i}>
                <p className="font-semibold text-rose-200">{liab.title}</p>
                {liab.body ? <p className="text-white/75">{liab.body}</p> : null}
              </li>
            ))}
          </ul>
        </RelationshipReportInset>
      </div>

      {compoundingSummary ? (
        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/80">
          <p className="font-bold text-white">📌 장기 복리 총평</p>
          <p className="mt-1">{compoundingSummary}</p>
        </div>
      ) : null}
    </RelationshipReportCard>
  );
}

function LifePartnershipVerdictCard({
  view,
  names,
}: {
  view?: import("@/lib/relationship/marriage/viewModel/marriageUiContracts").MarriagePartnershipVerdictViewModel;
  names: [string, string];
}) {
  if (!view) return null;
  const { lifeSyncPct, operatingPartnerFit, emotionalPartnerFit, longTermGrowthFit, oneLineVerdict, greatestStrength, biggestVulnerability } = view;

  return (
    <RelationshipReportCard title="🏆 부부 파트너십 최종 판정 (Life Partnership Verdict)" accentColor={ACCENT}>
      <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Life Partnership Sync Score</p>
        <p className="mt-1 text-4xl font-extrabold text-white">{lifeSyncPct}<span className="text-lg font-normal text-emerald-300/80">%</span></p>
        <p className="mt-3 text-base font-bold text-emerald-100">{oneLineVerdict}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 text-center text-xs">
        <div className="rounded-lg bg-white/5 p-3 border border-white/10">
          <p className="text-white/60 font-medium">가정 운영 적합성</p>
          <p className="mt-1 text-base font-bold text-amber-200">{`${operatingPartnerFit}점`}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3 border border-white/10">
          <p className="text-white/60 font-medium">정서 교감 적합성</p>
          <p className="mt-1 text-base font-bold text-emerald-200">{`${emotionalPartnerFit}점`}</p>
        </div>
        <div className="rounded-lg bg-white/5 p-3 border border-white/10">
          <p className="text-white/60 font-medium">장기 성장 적합성</p>
          <p className="mt-1 text-base font-bold text-teal-200">{`${longTermGrowthFit}점`}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <RelationshipReportInset>
          <p className="font-bold text-emerald-300">✨ 우리 부부의 가장 큰 결합력 (Greatest Strength)</p>
          <p className="mt-2 text-xs leading-relaxed text-white/85">{greatestStrength}</p>
        </RelationshipReportInset>

        <RelationshipReportInset>
          <p className="font-bold text-rose-300">⚠️ 관계의 안정감을 흔드는 가장 큰 취약점 (Biggest Vulnerability)</p>
          <p className="mt-2 text-xs leading-relaxed text-white/85">{biggestVulnerability}</p>
        </RelationshipReportInset>
      </div>
    </RelationshipReportCard>
  );
}

function MarriageActionPlaybookCard({ names }: { names: [string, string] }) {
  return (
    <RelationshipReportCard title="📘 지속 가능한 부부 파트너십 실전 사용설명서 (Do & Don't)" accentColor={ACCENT}>
      <div className="grid gap-4 sm:grid-cols-2">
        <RelationshipReportInset>
          <p className="font-bold text-emerald-200">✅ 지금 당장 해볼 것 (Do)</p>
          <ul className="mt-2 space-y-1.5 text-xs text-white/90">
            <li>• 주 1회 15분간 가사 및 재정 일정 스탠드업 미팅 진행하기</li>
            <li>• 상대의 기획/정리 노고에 "고마워" 즉시 정서적 피드백 주기</li>
            <li>• 대형 지출 전에는 24시간 생각 정리 후 상호 합의 거치기</li>
            <li>• 싸움이 15분을 넘어가면 타임아웃 키워드 선언 후 20분 쿨링다운하기</li>
          </ul>
        </RelationshipReportInset>

        <RelationshipReportInset>
          <p className="font-bold text-rose-200">🚫 절대 하지 말 것 (Don't)</p>
          <ul className="mt-2 space-y-1.5 text-xs text-white/90">
            <li>• 침실 문이 닫힌 뒤 그날의 갈등이나 서운함 재개하지 않기</li>
            <li>• 상대의 원가족이나 과거 부모 습관을 갈등 도중에 끌어오지 않기</li>
            <li>• 집안일이나 재정 주도권을 한 사람에게 무작정 전임하고 방관하기</li>
            <li>• 상대가 혼자만의 복원 시간을 요청할 때 말을 쏘아붙이며 억지로 대화 강요하지 않기</li>
          </ul>
        </RelationshipReportInset>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-xs font-semibold text-emerald-200">🌱 {names[0]}님과 {names[1]}님의 10년, 20년 안식을 위한 약속</p>
        <p className="mt-1 text-xs text-white/75">
          작은 생활의 루틴을 투명하게 나누고 서로의 복원 시간을 지켜줄 때, 두 사람의 가정은 가장 안전한 휴식처가 됩니다.
        </p>
      </div>
    </RelationshipReportCard>
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
    case "deep_read":
      return <DeepReadSectionCard section={section} />;
    case "compare_table":
      return <CompareTableCard section={section} viewerIsReportA={viewerIsReportA} names={names} />;
    case "psych_radar":
      return <PsychRadarCard section={section} names={names} />;
    case "money_chores":
      return <MoneyChoresCard section={section} />;
    case "bedroom":
      return <BedroomCard section={section} />;
    case "home_dna":
      return <HomeDnaCard section={section} />;
    case "parenting":
      return <ParentingCard section={section} />;
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

/** ViewModel 전체를 RelationshipReportLayout에 조립 — production 진입점. */
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
    <RelationshipReportLayout
      kind="cohabitation"
      kindLabel={kindLabel ?? t.defaultKindLabel}
      headline={{
        title: vm.opening.headline,
        subtitle: vm.opening.subtitle,
        names: vm.opening.names,
        badge: vm.opening.grade ? t.gradeBadge(vm.opening.grade) : undefined,
      }}
      scores={[]}
    >
      {snapshot ? (() => {
        const intimacy = snapshot.panel.narrative!.topics.find(t => t.topic === "intimacy")!;
        const stability = snapshot.panel.narrative!.topics.find(t => t.topic === "stability")!;
        const conflict = snapshot.panel.narrative!.topics.find(t => t.topic === "conflict")!;
        
        const cards: OverviewCardData[] = [
          {
            key: "intimacy",
            icon: "🔥",
            label: t.scoreLabelRomanticFit,
            score: snapshot.scores.romanticFitPct,
            tone: "good",
            inverted: false,
            gradeLabel: intimacy.title,
            oneLiner: intimacy.subtitle,
            measures: locale === "en-US" ? "How deeply you connect on a romantic and emotional level" : "두 사람이 정서적으로 얼마나 깊이 연결되어 있는지",
            why: intimacy.interpretation,
            thresholdText: intimacy.axisNote,
          },
          {
            key: "stability",
            icon: "🧩",
            label: t.scoreLabelLifeSynergy,
            score: snapshot.scores.lifeSynergyPct,
            tone: "neutral",
            inverted: false,
            gradeLabel: stability.title,
            oneLiner: stability.subtitle,
            measures: locale === "en-US" ? "How well you navigate real-world challenges and life together" : "현실적인 문제와 삶의 방향성을 얼마나 잘 맞춰갈 수 있는지",
            why: stability.interpretation,
            thresholdText: stability.axisNote,
          },
          {
            key: "conflict",
            icon: "⚡",
            label: t.scoreLabelHomeRisk,
            score: snapshot.scores.homeRiskPct,
            tone: "warn",
            inverted: true,
            gradeLabel: conflict.title,
            oneLiner: conflict.subtitle,
            measures: locale === "en-US" ? "The potential for friction or misunderstanding in daily life" : "결혼 생활 중 의사소통이나 가치관 차이로 마찰이 생길 가능성",
            why: conflict.interpretation,
            thresholdText: conflict.axisNote,
          },
        ];

        return (
          <div className="mb-12 mt-4">
            <OverviewSection
              locale={locale}
              eyebrow={pick(locale, "01 · At a Glance", "01 · 한눈에 보기")}
              title={pick(locale, "How You Live Together", "함께 사는 방식과 라이프 시너지")}
              lead={pick(
                locale,
                "Three signals frame the shape of this relationship.",
                "세 가지 신호로 이 관계의 성격을 먼저 봅니다. 숫자는 근거일 뿐, 해석이 본문이에요."
              )}
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
                {summaryText ? (
                  <RelationshipReportInset className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-200/90">
                      💡 {chOwnership?.userQuestion}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/90">
                      {summaryText}
                    </p>
                  </RelationshipReportInset>
                ) : null}

                {cDef.id === "c3_household_os" ? (
                  <EconomicPartnershipCard bundle={vm.canonicalBundle} names={vm.opening.names} />
                ) : null}

                {cDef.id === "c5_conflict_deescalation" ? (
                  <ConflictSubstantiveCard view={vm.conflict4StageView} bundle={vm.canonicalBundle} names={vm.opening.names} />
                ) : null}

                {cDef.id === "c7_longterm_compounding" ? (
                  <Chapter07SubstantiveCard bundle={vm.canonicalBundle} names={vm.opening.names} />
                ) : null}

                {cDef.id === "c8_partnership_verdict" ? (
                  <LifePartnershipVerdictCard view={vm.lifePartnershipVerdictView} names={vm.opening.names} />
                ) : null}

                {cDef.id === "c9_next_chapter_rituals" ? (
                  <MarriageActionPlaybookCard names={vm.opening.names} />
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
    </RelationshipReportLayout>
  );
}
