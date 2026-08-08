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
import TriScoreSnapshotPanel from "@/components/relationship/TriScoreSnapshotPanel";
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

// ---- 8-chapter structure ------------------------------------------------------
// Regroups the same 14 MarriageReportSection cards (no data change) into a
// numbered 8-chapter read, mirroring the Romantic V4 / Family / Work chapter
// nav+numbering pattern. `deep_read` (the optional married_saju_deep LLM
// overlay) sits outside the numbered sequence as a bonus chapter — it isn't
// always present, so giving it a fixed number would risk the same
// hidden-chapter numbering gap fixed earlier on the Romantic side.
type MarriageSectionType = MarriageReportSection["type"];

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
    types: ["compare_table", "psych_radar", "home_dna"],
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
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              <th className="px-4 py-3 font-semibold text-white/55">&nbsp;</th>
              <th className="px-4 py-3 font-semibold text-white/80">{names[0]}</th>
              <th className="px-4 py-3 font-semibold text-white/80">{names[1]}</th>
              <th className="px-4 py-3 font-semibold text-white/55">{t.compareTableColMeaning}</th>
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, i) => {
              const me = viewerIsReportA ? row.personA : row.personB;
              const partner = viewerIsReportA ? row.personB : row.personA;
              return (
                <tr key={row.id} className={i % 2 === 0 ? "bg-white/[0.015]" : undefined}>
                  <td className="border-t border-white/8 px-4 py-3 align-top font-medium text-white/70">
                    {row.label}
                  </td>
                  <td className="border-t border-white/8 px-4 py-3 align-top font-semibold" style={{ color: ACCENT }}>
                    {me.shortLabel}
                  </td>
                  <td className="border-t border-white/8 px-4 py-3 align-top font-semibold text-white/85">
                    {partner.shortLabel}
                  </td>
                  <td className="border-t border-white/8 px-4 py-3 align-top text-white/72">
                    {row.meaning}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </RelationshipReportCard>
  );
}

function PsychRadarCard({ section, names }: { section: PsychRadarSection; names: [string, string] }) {
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportParagraph className="mb-3" muted>
        {section.chartNote}
      </RelationshipReportParagraph>
      <div className="rounded-2xl border border-white/10 bg-[#f8f6f3] p-3 sm:p-4">
        <PsychMatchRadarChart axisResults={section.axisResults} personALabel={names[0]} personBLabel={names[1]} />
      </div>
      {section.highlights.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {section.highlights.map((item) => (
            <li key={item.axis_key} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-sm font-semibold leading-snug text-white/92">{item.hook}</p>
              <RelationshipReportParagraph className="mt-2 text-white/78">{item.narrative}</RelationshipReportParagraph>
            </li>
          ))}
        </ul>
      ) : null}
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
      scores={
        snapshot
          ? [
              { emoji: "🔥", label: t.scoreLabelRomanticFit, value: snapshot.scores.romanticFitPct, tone: "warm" },
              { emoji: "🧩", label: t.scoreLabelLifeSynergy, value: snapshot.scores.lifeSynergyPct, tone: "cool" },
              { emoji: "⚡", label: t.scoreLabelHomeRisk, value: snapshot.scores.homeRiskPct, tone: "alert" },
            ]
          : []
      }
      scoreFooter={snapshot ? <TriScoreSnapshotPanel panel={snapshot.panel} kind="cohabitation" /> : undefined}
    >
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
      {bonusSections.length > 0 ? (
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
