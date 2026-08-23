"use client";

/**
 * Family Premium — FamilyReportViewModel 전용 렌더러. work·friend·marriage의
 * SectionRenderer.tsx와 동일한 패턴 — en-US/ko-KR 둘 다 production에서
 * 쓰인다(ko-KR 전용 게이트 금지). 카드 내부 라벨은
 * `useMessages().relationshipDrilldown.family`에서 가져온다.
 *
 * family는 비대칭 부모-자녀 관계라 viewer 토글이 없다 — 항상 고정된
 * parent/child 순서로 렌더링한다(기존 FamilyParentReportView.tsx와 동일).
 *
 * 카드 시각 스킨은 Marriage/Work/Friend와 같은 크림-진초록 editorial
 * 시스템(familyEditorialAdapter.tsx)을 쓴다 — 옛 reportLayout의 다크
 * 카드/mint 액센트가 아니다.
 */
import type { ReactNode } from "react";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import {
  MessageCircle,
  ShieldCheck,
  Sprout,
  Flame,
  Mountain,
  Gem,
  Waves,
  Wrench,
  HeartHandshake,
  CloudRain,
  Compass,
  Sparkles,
  PawPrint,
  Palette,
  Lightbulb,
  BookOpen,
  Wallet,
  Trophy,
  Leaf,
  Gift,
  Clock,
  Heart,
} from "lucide-react";
import RelationshipReportCard, {
  RelationshipReportBody,
  RelationshipReportParagraph,
  RelationshipReportLabel,
  RelationshipReportInset,
  FamilyEditorialHero,
} from "@/components/relationship/familyParent/editorial/familyEditorialAdapter";
import { PsychMatchRadarChart } from "@/components/relationship/reportLayout";
import TriScoreSnapshotPanel from "@/components/relationship/TriScoreSnapshotPanel";
import { OverviewSection } from "@/components/relationship/shared/overview/OverviewSection";
import type { OverviewCardData } from "@/lib/relationship/shared/overview/overviewTypes";
import { PsychAxisComparisonSection } from "@/components/relationship/shared/psychAxis/PsychAxisComparisonSection";
import { VersusStrip, Reveal, ec } from "@/components/relationship/shared/editorial/EditorialPrimitives";
import { pick } from "@/lib/relationship/friend/friendCopy";
import PairPrescriptionSection from "@/components/relationship/shared/PairPrescriptionSection";
import type {
  ChildDnaSection,
  CompareTableSection,
  DeEscalationSection,
  DeepReadSection,
  DestinySection,
  FamilyReportSection,
  FamilyReportViewModel,
  FamilyRoleSection,
  FilialFrequencySection,
  FilialRewardSection,
  GrowthTunnelSection,
  HouseholdRolesSection,
  PrescriptionSection,
  PsychRadarSection,
  RelationshipIndexSection,
  SosScriptSection,
  TalentSection,
} from "@/lib/relationship/familyParent/viewModel/familyReportSectionTypes";
import DeepReadCard from "@/components/relationship/shared/DeepReadCard";
import { useMessages, useLocale } from "@/lib/i18n/LocaleProvider";
import { FamilyChapterNav, FamilyChapterSection } from "@/components/relationship/familyParent/chapters/FamilyChapterShell";
import { josaIGa, josaEunNeun, josaGwaWa } from "@/lib/relationship/romantic/prototypeV4/romanticLanguage";

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

/** Shared editorial accent (rel-deep) — matches Romantic V4 / Friend / Marriage / Work, not the old per-domain mint. */
const ACCENT = "#1b3b2b";

/** 하드코딩 이모지 대신 — 오행 아키타입 → Lucide 아이콘. */
const GENIUS_ICON: Record<ChildDnaSection["geniusArchetype"], typeof Sprout> = {
  wood: Sprout,
  fire: Flame,
  earth: Mountain,
  metal: Gem,
  water: Waves,
};

/** 하드코딩 이모지 대신 — 6대 심리 역할 → Lucide 아이콘. */
const ROLE_ICON: Record<FamilyRoleSection["childRole"], typeof Wrench> = {
  fixer: Wrench,
  mediator: HeartHandshake,
  martyr: CloudRain,
  independent: Compass,
  emotional_dump: Sparkles,
  puppy: PawPrint,
};

/** 하드코딩 이모지 대신 — 공부 타입 → Lucide 아이콘. */
const STUDY_TYPE_ICON: Record<string, typeof Palette> = {
  creative: Palette,
  understanding: Lightbulb,
  diligent: BookOpen,
};

/** 하드코딩 이모지 대신 — 성공 그릇 → Lucide 아이콘. */
const WEALTH_VESSEL_ICON: Record<string, typeof Wallet> = {
  practical_finance: Wallet,
  career_honor: Trophy,
  developing: Leaf,
};

/** 하드코딩 이모지 대신 — 효도 주파수 → Lucide 아이콘. */
const FREQUENCY_ICON: Record<string, typeof Gift> = {
  cash_gift: Gift,
  quality_time: Clock,
  emotional_recognition: Heart,
};

const DE_VARIANT: Record<string, "warning" | "success" | "default"> = {
  red: "warning",
  yellow: "warning",
  orange: "warning",
  green: "success",
  blue: "default",
};

// ---- 8-chapter structure ------------------------------------------------------
// Reorganizes the same 16 FamilyReportSection cards (no data change) into a
// numbered 8-chapter read, mirroring the Romantic V4 report's chapter
// nav/numbering pattern. `deep_read` (the optional family_saju_deep LLM
// overlay) sits outside the numbered sequence as a bonus chapter — it isn't
// always present, so giving it a fixed number would risk the same
// hidden-chapter numbering gap that was just fixed on the Romantic side.
type FamilySectionType = FamilyReportSection["type"];

const CHAPTER_GROUPS: Array<{
  id: string;
  types: FamilySectionType[];
  titleKo: string;
  titleEn: string;
}> = [
  {
    id: "ch_temperature",
    types: ["relationship_index", "destiny"],
    titleKo: "한눈에 보는 우리의 가족 온도",
    titleEn: "Your Family at a Glance",
  },
  {
    id: "ch_friction_style",
    types: ["household_roles", "psych_radar"],
    titleKo: "우리가 집 안에서 부딪히는 방식",
    titleEn: "How Friction Shows Up at Home",
  },
  {
    id: "ch_child_dna",
    types: ["child_dna"],
    titleKo: "우리 아이의 타고난 기질과 잠재력",
    titleEn: "Your Child's Natural Temperament",
  },
  {
    id: "ch_praise_growth",
    types: ["talent"],
    titleKo: "맞춤형 칭찬과 성장의 그릇",
    titleEn: "Praise That Lands, and Room to Grow",
  },
  {
    id: "ch_growth_edge",
    types: ["growth_tunnel", "family_role", "sos_script"],
    titleKo: "올해의 성장 과제와 부모의 역할",
    titleEn: "This Year's Growth Edge, and Your Role",
  },
  {
    id: "ch_hidden_hearts",
    types: ["compare_table", "filial_frequency"],
    titleKo: "차이가 만든 오해와 숨은 마음",
    titleEn: "Where Differences Turn Into Misunderstanding",
  },
  {
    id: "ch_cooldown",
    types: ["de_escalation"],
    titleKo: "화가 났을 때 마음을 푸는 치트키",
    titleEn: "The Cheat Code for Cooling Down",
  },
  {
    id: "ch_playbook",
    types: ["filial_reward", "prescription"],
    titleKo: "오래 단단할 우리를 위한 행동 처방전",
    titleEn: "A Playbook for the Long Run",
  },
];

/** deep_read renders after the 8 core chapters, unnumbered — see comment above. */
const BONUS_CHAPTER_TYPES: FamilySectionType[] = ["deep_read"];

// ---- Part 2: 스코어링 + 비교표 + 11축 매칭 -----------------------------------

function RelationshipIndexCard({ section }: { section: RelationshipIndexSection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT} showMarker={true}>
      <RelationshipReportBody>
        <p className="text-lg font-semibold text-rel-ink">{section.frictionIndex}%</p>
        <div>
          <RelationshipReportLabel>{t.relationshipIndexSafeDistanceLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {section.safeDistanceNote}
          </RelationshipReportParagraph>
        </div>
        {section.decisionAxisNote ? (
          <RelationshipReportInset>
            <RelationshipReportParagraph>
              {section.decisionAxisNote}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function CompareTableCard({
  section,
  names,
}: {
  section: CompareTableSection;
  names: [string, string];
}) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <div className="mt-8">
      <ul className="space-y-12">
        {section.rows.map((row, i) => (
          <li key={row.id}>
            <Reveal delay={i * 50}>
              <VersusStrip
                label={row.label}
                aName={`${t.compareTableColParent} · ${names[1]}`}
                bName={`${t.compareTableColChild} · ${names[0]}`}
                a={row.personParent.shortLabel}
                b={row.personChild.shortLabel}
              />
              <p className="mt-3 font-rel-sans text-[14px] leading-[1.8] text-rel-ink-soft">
                {row.meaning}
              </p>
              <div className="mt-10 h-px w-full bg-rel-line" />
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HouseholdRolesCard({ section }: { section: HouseholdRolesSection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT} showMarker={true}>
      <RelationshipReportBody>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-rel-line bg-rel-taupe-soft/25 px-4 py-3">
            <RelationshipReportLabel>
              {t.householdRolesSelfLabel(section.selfName)}
            </RelationshipReportLabel>
            <p className="mt-2 text-base font-semibold text-rel-ink">{section.selfRoleLabel}</p>
            <RelationshipReportParagraph className="mt-2">
              {section.selfRoleDetail}
            </RelationshipReportParagraph>
          </div>
          <div className="rounded-xl border border-rel-line bg-rel-taupe-soft/25 px-4 py-3">
            <RelationshipReportLabel>
              {t.householdRolesPartnerLabel(section.partnerName)}
            </RelationshipReportLabel>
            <p className="mt-2 text-base font-semibold text-rel-ink">{section.partnerRoleLabel}</p>
            <RelationshipReportParagraph className="mt-2">
              {section.partnerRoleDetail}
            </RelationshipReportParagraph>
          </div>
        </div>
        <div>
          <RelationshipReportLabel>{t.householdRolesComplementLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {section.complement}
          </RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.householdRolesTensionLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {section.tension}
          </RelationshipReportParagraph>
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function PsychRadarCard({ section, names }: { section: PsychRadarSection; names: [string, string] }) {
  const { locale } = useLocale();
  return (
    <div className="mt-6">
      <PsychAxisComparisonSection
        axisResults={section.axisResults}
        highlights={section.highlights}
        chartNote={section.chartNote}
        names={names}
        locale={locale}
      />
    </div>
  );
}

// ---- Part 3: 자녀 DNA + 성장 터널 --------------------------------------------

function ChildDnaCard({ section }: { section: ChildDnaSection }) {
  const t = useMessages().relationshipDrilldown.family;
  const GeniusIcon = GENIUS_ICON[section.geniusArchetype] ?? Sparkles;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            {t.dnaLayerLabel}
          </p>
          <p className="mt-1 text-sm text-rel-ink-mute">{t.dnaLayerHint}</p>
        </div>
        <p className="flex items-center gap-2 text-lg font-semibold text-rel-ink">
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}
          >
            <GeniusIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          {section.geniusTitle}
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <RelationshipReportLabel>{t.dnaCommunicationLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.communicationStyle}</RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>{t.dnaHiddenSensitivityLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.hiddenSensitivity}</RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>{t.dnaEnergyLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.attentionFocusStyle}</RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel>{t.dnaHiddenGeniusLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{section.hiddenGenius}</RelationshipReportParagraph>
          </div>
          {section.praiseTriggerNote ? (
            <div>
              <RelationshipReportLabel>Praise trigger</RelationshipReportLabel>
              <RelationshipReportParagraph className="mt-1.5">{section.praiseTriggerNote}</RelationshipReportParagraph>
            </div>
          ) : null}
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function TypeIconBadge({ Icon }: { Icon: typeof Palette }) {
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}
    >
      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
    </span>
  );
}

function TalentCard({ section }: { section: TalentSection }) {
  const t = useMessages().relationshipDrilldown.family;
  const StudyIcon = STUDY_TYPE_ICON[section.studyType] ?? Sparkles;
  const WealthIcon = WEALTH_VESSEL_ICON[section.wealthVessel] ?? Sparkles;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div>
          <RelationshipReportLabel>{t.talentStudyTypeLabel}</RelationshipReportLabel>
          <p className="mt-1.5 flex items-center gap-2 text-base font-semibold text-rel-ink">
            <TypeIconBadge Icon={StudyIcon} />
            {section.studyTypeLabel}
          </p>
          <RelationshipReportParagraph className="mt-1.5">{section.studyTypeNote}</RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.talentWealthVesselLabel}</RelationshipReportLabel>
          <p className="mt-1.5 flex items-center gap-2 text-base font-semibold text-rel-ink">
            <TypeIconBadge Icon={WealthIcon} />
            {section.wealthVesselLabel}
          </p>
          <RelationshipReportParagraph className="mt-1.5">{section.wealthVesselNote}</RelationshipReportParagraph>
        </div>
        {section.inheritedNote ? (
          <RelationshipReportInset>
            <RelationshipReportParagraph>
              {section.inheritedNote}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function GrowthTunnelCard({ section }: { section: GrowthTunnelSection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT} variant="warning">
      <RelationshipReportBody>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            {t.growthLayerLabel}
          </p>
          <p className="mt-1 text-sm text-rel-ink-mute">{t.growthLayerHint}</p>
        </div>
        <RelationshipReportParagraph>{section.currentChallenge}</RelationshipReportParagraph>
        {section.focusAreas.length > 0 ? (
          <p className="text-sm text-rel-ink-mute">
            {t.focusAreasPrefix}
            {section.focusAreas.join(" · ")}
          </p>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function FamilyRoleCard({ section }: { section: FamilyRoleSection }) {
  const t = useMessages().relationshipDrilldown.family;
  const RoleIcon = ROLE_ICON[section.childRole] ?? Sparkles;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <p className="flex items-center gap-2 text-lg font-semibold text-rel-ink">
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${ACCENT}22`, color: ACCENT }}
          >
            <RoleIcon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          {section.roleLabel}
        </p>
        <RelationshipReportInset>
          <RelationshipReportLabel>{t.familyRoleDescriptionLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {section.roleDescription}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function FilialFrequencyCard({ section }: { section: FilialFrequencySection }) {
  const FrequencyIcon = FREQUENCY_ICON[section.frequencyType] ?? Sparkles;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <p className="flex items-center gap-2 text-lg font-semibold text-rel-ink">
          <TypeIconBadge Icon={FrequencyIcon} />
          {section.frequencyLabel}
        </p>
        <RelationshipReportInset>
          <RelationshipReportParagraph className="mt-1.5">
            {section.frequencyNote}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

// ---- Part 4a: 심층 리드 (family_saju_deep 오버레이) ---------------------------

function DeepReadSectionCard({ section }: { section: DeepReadSection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <DeepReadCard
      vm={section.vm}
      accentColor={ACCENT}
      labels={{
        cardTitle: section.title,
        voiceMe: t.deepReadVoiceParentLabel,
        voicePartner: t.deepReadVoiceChildLabel,
        pattern: t.deepReadPatternLabel,
        adviceMe: t.deepReadAdviceParentLabel,
        advicePartner: t.deepReadAdviceChildLabel,
        together: t.deepReadTogetherLabel,
      }}
    />
  );
}

// ---- Part 4: 운명적 케미 + 부모 렌즈 + 미래 보답 ------------------------------

function DestinyCard({ section }: { section: DestinySection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            {t.destinyLayerLabel}
          </p>
          <p className="mt-1 text-sm text-rel-ink-mute">{t.destinyLayerHint}</p>
        </div>
        <div>
          <RelationshipReportLabel>{t.harmonyLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.harmonyOneLiner}</RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.favoritismRiskLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">{section.favoritismWarning}</RelationshipReportParagraph>
        </div>
        {section.parentLensSummary ? (
          <RelationshipReportParagraph className="italic text-emerald-700">
            {section.parentLensSummary}
          </RelationshipReportParagraph>
        ) : null}
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function FilialRewardCard({ section }: { section: FilialRewardSection }) {
  const t = useMessages().relationshipDrilldown.family;
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            {t.filialLayerLabel}
          </p>
          <p className="mt-1 text-sm text-rel-ink-mute">{t.filialLayerHint}</p>
        </div>
        <RelationshipReportParagraph>{section.futureReward}</RelationshipReportParagraph>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function SosScriptCard({ section }: { section: SosScriptSection }) {
  return (
    <RelationshipReportCard title={section.title} accentColor={ACCENT} variant="warning">
      <RelationshipReportBody>
        <RelationshipReportLabel>{section.triggerLabel}</RelationshipReportLabel>
        <RelationshipReportInset className="border-emerald-100 bg-emerald-50/60">
          <RelationshipReportParagraph className="flex items-start gap-2 italic text-emerald-900">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={1.75} aria-hidden />
            {section.sosLine}
          </RelationshipReportParagraph>
        </RelationshipReportInset>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

// ---- Part 5: 갈등 완화 + 실전 처방 -------------------------------------------

function DeEscalationCard({ section }: { section: DeEscalationSection }) {
  const t = useMessages().relationshipDrilldown.family;
  const card = section.card;
  return (
    <RelationshipReportCard
      title={section.title}
      accentColor={ACCENT}
      variant={DE_VARIANT[card.color] ?? "default"}
    >
      <RelationshipReportBody>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-rose-700">
            {t.deEscalationLayerLabel}
          </p>
          <p className="mt-1 text-sm text-rel-ink-mute">{t.deEscalationLayerHint}</p>
        </div>
        <p className="text-lg font-bold text-rel-ink">{card.hashtag}</p>
        <p className="text-sm text-rel-ink-mute">{card.archetype_label}</p>
        <div className="mt-4 space-y-3">
          <div>
            <RelationshipReportLabel>{t.whenAngryLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{card.psych_state}</RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel className="text-red-700">{t.avoidLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{card.avoid_actions}</RelationshipReportParagraph>
          </div>
          <RelationshipReportInset className="border-emerald-100 bg-emerald-50/60">
            <RelationshipReportParagraph className="flex items-start gap-2 italic text-emerald-900">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={1.75} aria-hidden />
              {card.solution_script}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
          {card.boundary_script ? (
            <RelationshipReportInset className="border-sky-100 bg-sky-50/60">
              <RelationshipReportParagraph className="flex items-start gap-2 italic text-sky-900">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" strokeWidth={1.75} aria-hidden />
                {card.boundary_script}
              </RelationshipReportParagraph>
            </RelationshipReportInset>
          ) : null}
          <div>
            <RelationshipReportLabel>{t.contactWaitLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{card.contact_wait_note}</RelationshipReportParagraph>
          </div>
        </div>
      </RelationshipReportBody>
    </RelationshipReportCard>
  );
}

function PrescriptionCard({ section }: { section: PrescriptionSection }) {
  const t = useMessages().relationshipDrilldown.family;
  const pack = {
    schema_version: "family_prescription_v1",
    intro_line: section.introLine,
    items: section.items,
  };
  return (
    <div className="space-y-3">
      <div className="px-1">
        <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
          {t.prescriptionLayerLabel}
        </p>
        <p className="mt-1 text-sm text-rel-ink-mute">{t.prescriptionLayerHint}</p>
      </div>
      <PairPrescriptionSection
        pack={pack}
        accentColor={ACCENT}
        domain="family"
        titleOverride={section.title}
      />
    </div>
  );
}

// ---- Dispatcher -------------------------------------------------------------

type NonSnapshotSection = Exclude<FamilyReportSection, { type: "snapshot" }>;

export function FamilyReportSectionCard({
  section,
  names,
}: {
  section: NonSnapshotSection;
  names: [string, string];
}): ReactNode {
  switch (section.type) {
    case "relationship_index":
      return <RelationshipIndexCard section={section} />;
    case "compare_table":
      return <CompareTableCard section={section} names={names} />;
    case "household_roles":
      return <HouseholdRolesCard section={section} />;
    case "psych_radar":
      return <PsychRadarCard section={section} names={names} />;
    case "child_dna":
      return <ChildDnaCard section={section} />;
    case "talent":
      return <TalentCard section={section} />;
    case "growth_tunnel":
      return <GrowthTunnelCard section={section} />;
    case "family_role":
      return <FamilyRoleCard section={section} />;
    case "filial_frequency":
      return <FilialFrequencyCard section={section} />;
    case "deep_read":
      return <DeepReadSectionCard section={section} />;
    case "destiny":
      return <DestinyCard section={section} />;
    case "filial_reward":
      return <FilialRewardCard section={section} />;
    case "sos_script":
      return <SosScriptCard section={section} />;
    case "de_escalation":
      return <DeEscalationCard section={section} />;
    case "prescription":
      return <PrescriptionCard section={section} />;
    default: {
      const exhaustiveCheck: never = section;
      return exhaustiveCheck;
    }
  }
}

/** ViewModel 전체를 editorial hero + chapter shell로 조립 — production 진입점. */
export function FamilyReportViewModelView({
  vm,
  kindLabel,
}: {
  vm: FamilyReportViewModel;
  kindLabel?: string;
}) {
  const { locale } = useLocale();
  const t = useMessages().relationshipDrilldown.family;
  const isEn = locale === "en-US";

  const snapshot = vm.snapshot ?? vm.sections.find(
    (s): s is Extract<FamilyReportSection, { type: "snapshot" }> => s.type === "snapshot",
  );

  const editorialChapters = vm.editorialChapters && vm.editorialChapters.length > 0
    ? vm.editorialChapters
    : [];

  const navItems = editorialChapters.map((ch) => ({
    id: ch.id,
    number: ch.number,
    title: ch.title,
  }));

  return (
    <div
      className={`bg-rel-bg font-rel-sans text-rel-ink antialiased ${relSans.variable} ${relSerif.variable}`}
      lang={isEn ? "en" : "ko"}
    >
      <FamilyEditorialHero
        eyebrow={kindLabel ?? t.defaultKindLabel}
        headline={vm.opening.headline}
        names={vm.opening.names}
      />
      {snapshot ? (() => {
        // Defensive: a cached/DB-persisted snapshot may have a missing
        // `narrative` object or an incomplete `topics` array (older payload
        // shape) — never assume all three topics are present.
        const topics = snapshot.panel?.narrative?.topics ?? [];
        const bond = topics.find(t => t.topic === "intimacy");
        const synergy = topics.find(t => t.topic === "stability");
        const risk = topics.find(t => t.topic === "conflict");

        const cards: OverviewCardData[] = [
          {
            key: "bond",
            icon: "🔥",
            label: t.scoreLabelBond,
            score: snapshot.scores.bondPct,
            tone: "good",
            inverted: false,
            gradeLabel: bond?.title ?? t.scoreLabelBond,
            oneLiner: bond?.subtitle ?? "",
            measures: pick(locale, "How deeply you understand and support each other emotionally", "서로의 마음을 얼마나 깊이 이해하고 지지하는지"),
            why: bond?.interpretation ?? "",
            thresholdText: bond?.axisNote,
          },
          {
            key: "synergy",
            icon: "🧩",
            label: t.scoreLabelSynergy,
            score: snapshot.scores.synergyPct,
            tone: "neutral",
            inverted: false,
            gradeLabel: synergy?.title ?? t.scoreLabelSynergy,
            oneLiner: synergy?.subtitle ?? "",
            measures: pick(locale, "How well your different strengths complement each other for growth", "서로 다른 강점이 시너지를 내어 어떻게 성장을 돕는지"),
            why: synergy?.interpretation ?? "",
            thresholdText: synergy?.axisNote,
          },
          {
            key: "risk",
            icon: "⚡",
            label: t.scoreLabelFriction,
            score: snapshot.scores.riskPct,
            tone: "warn",
            inverted: true,
            gradeLabel: risk?.title ?? t.scoreLabelFriction,
            oneLiner: risk?.subtitle ?? "",
            measures: pick(locale, "The potential for friction or misunderstanding in daily life", "훈육이나 일상에서 오해나 마찰이 생길 가능성"),
            why: risk?.interpretation ?? "",
            thresholdText: risk?.axisNote,
          },
        ];

        return (
          <div className="mb-12 mt-4">
            <OverviewSection
              locale={locale}
              eyebrow={pick(locale, "01 · At a Glance", "01 · 한눈에 보기")}
              title={pick(locale, "How You Connect", "우리가 연결되는 방식")}
              lead={pick(
                locale,
                "Three signals frame the shape of this family bond.",
                "세 가지 신호로 가족 관계의 성격을 먼저 봅니다."
              )}
              cards={cards}
            />
          </div>
        );
      })() : null}

      {navItems.length > 0 ? <FamilyChapterNav items={navItems} /> : null}

      {editorialChapters.map((chapter) => {
        const resolveDetailedWhy = (
          topic: "intimacy" | "stability" | "conflict",
          rawInterpretation: string | undefined,
          score: number,
        ) => {
          const isShortSummary =
            !rawInterpretation ||
            rawInterpretation.length < 70 ||
            rawInterpretation.includes("명확한 선과 쿨한 마무리") ||
            rawInterpretation.includes("중간 수준") ||
            rawInterpretation.includes("(이)") ||
            rawInterpretation.includes("(은)") ||
            rawInterpretation.includes("(을)") ||
            rawInterpretation.includes("점)");

          if (!isShortSummary && rawInterpretation) {
            return rawInterpretation;
          }

          const parentName = vm.opening.names[1] || "부모";
          const childName = vm.opening.names[0] || "자녀";
          const cIGa = josaIGa(childName);
          const cEunNeun = josaEunNeun(childName);
          const pIGa = josaIGa(parentName);
          const pEunNeun = josaEunNeun(parentName);
          const pGwaWa = josaGwaWa(parentName);

          if (topic === "intimacy") {
            if (score >= 70) {
              return pick(
                locale,
                `When ${childName} experiences emotional stress, they feel safe approaching ${parentName} without hesitation. ${parentName}'s supportive reception and ${childName}'s openness align naturally, creating an effortless reservoir of mutual trust where feelings flow freely.`,
                `${cIGa} 밖에서 억울하거나 힘든 일을 겪고 돌아온 날, 망설임 없이 ${pGwaWa} 마음을 털어놓는 모습을 보입니다. ${pEunNeun} 아이의 이야기를 따뜻하게 들어주고 ${cEunNeun} 그 품 안에서 깊은 안도감을 얻어요. 소통 템포가 자연스럽게 맞아떨어져 “이 사람은 언제나 내 편”이라는 단단한 신뢰가 일상에 흐릅니다.`,
              );
            }
            if (score >= 50) {
              return pick(
                locale,
                `When ${childName} returns home with heavy feelings, they need time to process internally before opening up. Meanwhile, ${parentName} naturally reaches out to check in right away. While mutual affection is deep, this timing gap means closeness feels close in heart but needs gentle pacing in daily rhythm.`,
                `${cIGa} 힘든 일을 겪고 돌아오면 바로 털어놓기보다 혼자 마음을 정리할 시간이 먼저 필요해요. 반면 ${pEunNeun} 괜찮은지 빨리 확인하고 싶어 가까이 다가가는 편이에요. 마음의 크기보다 다가가는 타이밍이 달라, 서로 아끼면서도 순간적으로는 “왜 내 마음을 몰라주지?”라는 조급함이 생길 수 있어요. 성급히 질문을 건네기보다 따뜻하게 기다려주는 한 박자의 쉼표가 들어갈 때 비로소 마음이 온전히 통합니다.`,
              );
            }
            return pick(
              locale,
              `When ${childName} seeks acceptance, ${parentName}'s direct advice can inadvertently feel like emotional pressure. Overcoming this misread intention requires replacing rapid problem-solving with calm, non-judgmental reception.`,
              `${cIGa} 마음을 털어놓으려 할 때 ${pGwaWa}의 조언이나 지적이 정서적 부담으로 작용하곤 합니다. 관심과 위로의 의도와 달리 전달되는 순간에 오해가 생겨 아이가 “말해봤자 지적만 받는다”며 방어적으로 입을 닫는 흐름이 반복되기 쉬워요. 성급한 대안 제시 대신 판단 없이 들어주는 공감의 첫마디를 건넬 때 비로소 굳은 다리가 풀어집니다.`,
            );
          }

          if (topic === "stability") {
            if (score >= 75) {
              return pick(
                locale,
                `Growth flourishes when ${parentName} sets clear boundaries while granting ${childName} full autonomy in execution. Supported by parent's structural safety, ${childName} explores without fear of failure, turning guidance into bold momentum.`,
                `이 관계의 강점은 ${pEunNeun} 방향의 든든한 기준을 잡아주고, ${cEunNeun} 자기 방식으로 시도할 자율 공간을 확보할 때 가장 빛이 납니다. ${cIGa} 새로운 과제나 진로에 도전할 때 ${pEunNeun} 세부 실행을 믿고 맡겨주어. 아이는 실패 부담 없이 잠재력을 마음껏 발휘하고, 부모의 조용한 지지는 성장의 강력한 엔진이 됩니다. “방향은 부모가 가이드하고 방법은 아이가 선택할 때” 최고의 성장이 촉진됩니다.`,
              );
            }
            if (score >= 55) {
              return pick(
                locale,
                `A gentle pace gap exists between ${parentName}'s structured advice and ${childName}'s desire for independent trial. While parent's experience offers a vital safety rail, allowing ${childName} space to learn through personal trial maximizes steady progress.`,
                `${pEunNeun}가 제시하는 체계적인 가이드와 ${cEunNeun}가 원하는 자율적 탐색 사이에 소폭의 호흡 차이가 존재해요. ${pEunNeun} 안전펜스 역할을 든든히 해주지만, ${cIGa} 스스로 시행착오를 겪고 깨달을 수 있는 탐색 시간을 허용할 때 협력 가치가 제대로 발휘돼요. 조급하게 정답을 내려주기보다 아이의 시도 과정을 지켜봐 줄 때 단단한 시너지가 이어집니다.`,
              );
            }
            return pick(
              locale,
              `${parentName}'s eagerness to help can manifest as premature solutions, which ${childName} may interpret as control. Synergy strengthens as parent shifts from directing to supporting independent choices.`,
              `성장을 바라는 마음은 같으나 가이드 방식에서 템포 마찰이 생기기 쉬운 조합이에요. ${pEunNeun} 시행착오를 줄여주려 미리 답을 주려 하지만, ${cEunNeun} 이를 “내 능력을 안 믿어주나?”라는 간섭으로 받아들여 방어적인 태도를 취하곤 합니다. 결과보다는 아이의 주도적 시도 자체를 정서적으로 인정해 줄 때 비로소 시너지가 활짝 피어납니다.`,
            );
          }

          // topic === "conflict"
          if (score >= 65) {
            return pick(
              locale,
              `When discipline issues arise, ${parentName}'s immediate demand for answers triggers ${childName}'s defensive withdrawal. As parent interprets silence as reluctance and raises voice tone, an escalation loop develops rapidly. The key is separating the issue from ego and establishing a cool-down buffer before demanding responses.`,
              `생활 규칙이나 약속 미준수를 두고 지적이 나오는 순간, ${pEunNeun}의 즉각적인 확인 요구와 ${cEunNeun}의 방어적 반응이 빠르게 부딪혀요. 부모가 잘못을 정면으로 언급하면 ${cIGa} 자존심이 상해 입을 닫고, ${pEunNeun} 그 침묵을 “내 말을 무시하나?”라 느껴 톤이 높아지는 악순환이 생기기 십상입니다. 지적의 내용보다 답을 요구하는 속도와 아이가 감정적으로 닫히는 속도가 부딪히는 지점을 정돈하는 것이 핵심입니다.`,
            );
          }
          if (score >= 45) {
            return pick(
              locale,
              `Discipline scenarios trigger a pacing gap: ${parentName} seeks rapid resolution while ${childName} needs time to absorb feedback. Allowing a brief pause prevents minor friction from becoming tension.`,
              `훈육 상황이 생기면 지적이 전달되는 속도와 ${cEunNeun}가 이를 받아들이는 수용 속도 사이에 약간의 시차가 발생해요. ${pEunNeun}가 규칙 미준수를 언급했을 때 ${cIGa} 즉각 반응하기보다 생각할 시간이 필요합니다. 감정이 과열되기 전 한 박자 쉬었다가 사안에만 집중해 대화하면 큰 대립 없이 원만하게 조율되는 관계예요.`,
            );
          }
          return pick(
            locale,
            `When correcting ${childName}, ${parentName} focuses strictly on the behavior without attacking dignity, and ${childName} receives guidance without feeling hostile. A healthy buffer protects the bond from escalating friction.`,
            `의견 충돌이나 지적이 오가더라도 감정 싸움으로 번지지 않는 안전한 완충 구역이 존재해요. ${pEunNeun}는 자녀(${childName})의 자존심을 건드리지 않고 사안 자체만 정돈해 지적하며, ${cEunNeun} 역시 부모의 안내를 공격으로 오해하지 않습니다. 서로를 존중하는 정돈된 톤이 유지되어 일상 속 규칙들이 원만하고 평화롭게 조율됩니다.`,
          );
        };

        return (
          <FamilyChapterSection
            key={chapter.id}
            id={chapter.id}
            number={chapter.number}
            title={chapter.title}
            accent={ACCENT}
          >
            {chapter.summary ? (
              <p className="mb-6 font-rel-sans text-[15px] font-medium leading-[1.7] text-rel-ink-soft italic border-l-2 border-rel-deep/40 pl-3">
                💡 {chapter.summary}
              </p>
            ) : null}

            {/* Chapter 01 (우리가 함께 있을 때의 모습) — Romantic V4 Design Ported Cards */}
            {chapter.id === "ch_together" && snapshot ? (() => {
              const topics = snapshot.panel?.narrative?.topics ?? [];
              const bond = topics.find(t => t.topic === "intimacy");
              const synergy = topics.find(t => t.topic === "stability");
              const risk = topics.find(t => t.topic === "conflict");

              return (
                <div className="my-8 space-y-6">
                  {[
                    {
                      num: "01",
                      label: ec(locale, "When sharing feelings and seeking comfort", "마음을 나누고 위로가 필요할 때"),
                      scene: bond?.scene,
                      why: resolveDetailedWhy("intimacy", bond?.detailedWhy || bond?.interpretation, snapshot.scores.bondPct),
                      strength: bond?.strength,
                      caution: bond?.caution,
                    },
                    {
                      num: "02",
                      label: ec(locale, "When learning, trying new things, and finding their path", "배우고 도전하고 자기 길을 찾을 때"),
                      scene: synergy?.scene,
                      why: resolveDetailedWhy("stability", synergy?.detailedWhy || synergy?.interpretation, snapshot.scores.synergyPct),
                      strength: synergy?.strength,
                      caution: synergy?.caution,
                    },
                    {
                      num: "03",
                      label: ec(locale, "When setting boundaries or correcting mistakes", "기준을 세우거나 잘못을 바로잡을 때"),
                      scene: risk?.scene,
                      why: resolveDetailedWhy("conflict", risk?.detailedWhy || risk?.interpretation, snapshot.scores.riskPct),
                      strength: risk?.strength,
                      caution: risk?.caution,
                    },
                  ].map((card) => (
                  <article key={card.num} className="overflow-hidden rounded-2xl border border-rel-line bg-rel-surface shadow-sm">
                    <div className="p-6 sm:p-7">
                      <div className="min-w-0">
                        <div className="font-rel-sans text-[10.5px] font-semibold tracking-[0.24em] text-rel-ink-mute">
                          {card.num}
                        </div>
                        <h3 className="mt-2 font-rel-serif text-[20px] leading-[1.3] tracking-[-0.01em] text-rel-ink sm:text-[23px]">
                          {card.label}
                        </h3>
                        {card.scene && (
                          <p className="mt-3 max-w-[64ch] font-rel-sans text-[13.5px] leading-[1.7] text-rel-ink-mute">
                            {card.scene}
                          </p>
                        )}
                      </div>

                      {card.why && (
                        <p className="mt-5 max-w-[64ch] font-rel-sans text-[14.5px] leading-[1.9] text-rel-ink-soft">
                          {card.why}
                        </p>
                      )}

                      {card.strength || card.caution ? (
                        <dl className="mt-7 grid gap-4 sm:grid-cols-2">
                          {card.strength && (
                            <div className="rounded-xl bg-v4-good-soft p-5 border border-v4-good/20">
                              <dt className="font-rel-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-v4-good">
                                {ec(locale, "Strength", "강점")}
                              </dt>
                              <dd className="mt-2.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink-soft">
                                {card.strength}
                              </dd>
                            </div>
                          )}
                          {card.caution && (
                            <div className="rounded-xl bg-v4-bad-soft p-5 border border-v4-bad/20">
                              <dt className="font-rel-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-v4-bad">
                                {ec(locale, "Caution", "주의")}
                              </dt>
                              <dd className="mt-2.5 font-rel-sans text-[13.5px] leading-[1.75] text-rel-ink-soft">
                                {card.caution}
                              </dd>
                            </div>
                          )}
                        </dl>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            );
          })() : null}

          {/* StoryPlan Synthesis or Claim Highlight */}
          {chapter.synthesis.length > 0 ? (
            <div className="mb-6 space-y-3">
              {chapter.synthesis.map((syn, idx) => (
                <div key={idx} className="rounded-xl border border-rel-line bg-rel-surface p-4">
                  <p className="text-xs font-semibold text-rel-deep uppercase tracking-wider">
                    ✨ Synthesis · {syn.headline}
                  </p>
                  <p className="mt-1 text-sm text-rel-ink leading-relaxed">
                    {syn.summary}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Coverage Model: Conflict Loop */}
          {chapter.conflictLoop && (chapter.conflictLoop.parentTrigger || chapter.conflictLoop.breakPattern) ? (
            <div className="mb-6 rounded-xl border border-v4-bad/25 bg-v4-bad-soft p-4">
              <p className="text-xs font-semibold text-rel-deep uppercase tracking-wider">
                ⚡ 갈등 양상과 조율 포인트 · Conflict Loop
              </p>
              {chapter.conflictLoop.parentTrigger ? (
                <p className="mt-1.5 text-sm font-medium text-rel-ink">
                  트리거: {chapter.conflictLoop.parentTrigger}
                </p>
              ) : null}
              {chapter.conflictLoop.childReaction ? (
                <p className="mt-1 text-sm text-rel-ink-soft">
                  자녀 반응: {chapter.conflictLoop.childReaction}
                </p>
              ) : null}
              {chapter.conflictLoop.parentEscalation ? (
                <p className="mt-1 text-sm text-rel-ink-soft">
                  증폭 방식: {chapter.conflictLoop.parentEscalation}
                </p>
              ) : null}
              {chapter.conflictLoop.breakPattern ? (
                <p className="mt-2 text-xs italic text-rel-taupe">
                  💡 출구 전략: {chapter.conflictLoop.breakPattern}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Core Pair Meaning 1: Dependency / Protection Dynamic */}
          {chapter.dependencyProtection ? (
            <div className="mb-6 rounded-xl border border-rel-line bg-rel-surface p-4">
              <p className="text-xs font-semibold text-rel-deep uppercase tracking-wider">
                🛡️ 의존과 보호 구도 · Dependency & Protection
              </p>
              <p className="mt-1.5 text-sm font-medium text-rel-ink">
                부모의 보호 방식: {chapter.dependencyProtection.provider}
              </p>
              <p className="mt-1 text-sm text-rel-ink-soft">
                자녀의 의존 톤: {chapter.dependencyProtection.reliance}
              </p>
              {chapter.dependencyProtection.roleReversalRisk ? (
                <p className="mt-2 text-xs italic text-rel-taupe">
                  ⚠️ {chapter.dependencyProtection.summary}
                </p>
              ) : (
                <p className="mt-2 text-xs italic text-rel-taupe">
                  💡 {chapter.dependencyProtection.summary}
                </p>
              )}
            </div>
          ) : null}

          {/* Core Pair Meaning 2: Love Expression vs Reception */}
          {chapter.loveExpressionVsReception ? (
            <div className="mb-6 rounded-xl border border-pink-100 bg-pink-50/60 p-4">
              <p className="text-xs font-semibold text-pink-700 uppercase tracking-wider">
                ❤️ 사랑의 표현과 수용 · Love Expression & Reception
              </p>
              <p className="mt-1.5 text-sm font-medium text-rel-ink">
                부모의 표현 방식: {chapter.loveExpressionVsReception.parentExpresses}
              </p>
              <p className="mt-1 text-sm text-rel-ink-soft">
                자녀가 느끼는 체감 톤: {chapter.loveExpressionVsReception.childReceives}
              </p>
              <p className="mt-2 text-xs italic text-pink-700">
                💬 {chapter.loveExpressionVsReception.summary}
              </p>
            </div>
          ) : null}

          {/* Coverage Model: Emotional Repair */}
          {chapter.repairPattern && chapter.repairPattern.effectiveRepairStyle ? (
            <div className="mb-6 rounded-xl border border-rel-line bg-rel-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-rel-deep">
                🌱 관계 회복 단계 · Emotional Repair
              </p>
              <p className="mt-1.5 text-sm font-medium text-rel-ink">
                효과적인 화해 방식: {chapter.repairPattern.effectiveRepairStyle}
              </p>
              {chapter.repairPattern.ineffectiveRepairStyle ? (
                <p className="mt-1 text-sm text-rel-ink-soft">
                  주의할 역효과 톤: {chapter.repairPattern.ineffectiveRepairStyle}
                </p>
              ) : null}
              {chapter.repairPattern.reconnectionAction ? (
                <p className="mt-2 text-xs italic text-rel-taupe">
                  💡 재연결 실천 행동: {chapter.repairPattern.reconnectionAction}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Coverage Model: Growth Transition */}
          {chapter.growthTransition && chapter.growthTransition.currentRolePattern ? (
            <div className="mb-6 rounded-xl border border-rel-line bg-rel-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-rel-deep">
                🚀 성장 전환점 · Growth Transition
              </p>
              <p className="mt-1.5 text-sm font-medium text-rel-ink">
                현재 역할 패턴: {chapter.growthTransition.currentRolePattern}
              </p>
              <p className="mt-1 text-sm text-rel-ink-soft">
                추천 전환 포지션: {chapter.growthTransition.recommendedShift}
              </p>
              {chapter.growthTransition.transitionReason ? (
                <p className="mt-2 text-xs italic text-rel-taupe">
                  💡 전환 이유: {chapter.growthTransition.transitionReason}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Core Pair Meaning 3: Expectation vs Pressure */}
          {chapter.expectationVsPressure ? (
            <div className="mb-6 rounded-xl border border-rel-line bg-rel-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-rel-deep">
                🎯 부모의 기대와 성취 중압감 · Expectation & Pressure
              </p>
              <p className="mt-1.5 text-sm font-medium text-rel-ink">
                부모의 기대 톤: {chapter.expectationVsPressure.parentExpectation}
              </p>
              <p className="mt-1 text-sm text-rel-ink-soft">
                자녀의 체감 중압감: {chapter.expectationVsPressure.childPressureReception}
              </p>
              <p className="mt-2 text-xs italic text-rel-taupe">
                ⚖️ {chapter.expectationVsPressure.summary}
              </p>
            </div>
          ) : null}

          {/* Core Pair Meaning 4: Child Core Needs (3-Tier Structure: Desired Style x Parent Supply x Pair Gap) */}
          {chapter.childCoreNeeds ? (
            <div className="mb-6 rounded-xl border border-rel-line bg-rel-surface p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rel-deep">
                  🎁 Child's Core Needs · 자녀 핵심 양육 욕구 종합
                </p>
                <p className="mt-1 text-xs text-rel-ink-soft italic">
                  {chapter.childCoreNeeds.summary}
                </p>
              </div>

              {/* Tier 1: Child Desired Parenting Style (Innate Needs) */}
              {chapter.childCoreNeedsDetailed?.innateParentingNeeds?.length ? (
                <div className="rounded-lg bg-rel-taupe-soft/30 p-3 border border-rel-line">
                  <p className="text-xs font-medium text-rel-ink mb-1.5 flex items-center gap-1.5">
                    <span>🌱</span> 이 아이가 편안하게 자라는 본래 부모 태도
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chapter.childCoreNeedsDetailed.innateParentingNeeds.map((need, idx) => (
                      <span key={idx} className="rounded-md bg-rel-paper px-2 py-0.5 text-xs text-rel-ink font-medium border border-rel-line">
                        #{need.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Tier 2: Well Supplied Needs */}
              {chapter.childCoreNeedsDetailed?.wellSuppliedNeeds?.length ? (
                <div className="rounded-lg bg-v4-good-soft p-3 border border-v4-good/25">
                  <p className="text-xs font-medium text-rel-ink mb-1.5 flex items-center gap-1.5">
                    <span>✅</span> 지금 이 부모가 잘 주고 있는 것 (충분함)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chapter.childCoreNeedsDetailed.wellSuppliedNeeds.map((need, idx) => (
                      <span key={idx} className="rounded-md bg-rel-surface px-2 py-0.5 text-xs text-rel-ink border border-v4-good/30">
                        ✓ {need.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Tier 3: Primary Pair Gapped Needs */}
              {chapter.childCoreNeedsDetailed?.primaryNeeds?.length ? (
                <div className="rounded-lg bg-v4-bad-soft p-3 border border-v4-bad/25">
                  <p className="text-xs font-medium text-rel-ink mb-1.5 flex items-center gap-1.5">
                    <span>💡</span> 이 관계에서 조금 더 필요한 1~3가지 핵심 욕구
                  </p>
                  <ul className="space-y-1.5">
                    {chapter.childCoreNeedsDetailed.primaryNeeds.map((need, idx) => (
                      <li key={idx} className="text-xs text-rel-ink-soft flex items-start gap-1.5">
                        <span className="font-semibold text-amber-700 shrink-0">[{need.gapStatus}]</span>
                        <span><strong>{need.label}</strong>: {need.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Discrepancy Caution Signal if present */}
              {chapter.childCoreNeedsDetailed?.discrepancySummary ? (
                <p className="text-xs text-rose-800 italic bg-rose-50/60 p-2.5 rounded-lg border border-rose-100">
                  ⚠️ 참고: {chapter.childCoreNeedsDetailed.discrepancySummary}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Mapped Legacy Reusable Content Sections */}
          {chapter.legacySections.map((section) => (
            <FamilyReportSectionCard key={section.id} section={section} names={vm.opening.names} />
          ))}
        </FamilyChapterSection>
      );
    })}

      {/* Legacy flat fallback when no editorial chapters */}
      {editorialChapters.length === 0 ? (
        vm.sections.map((section) => (
          <FamilyReportSectionCard key={section.id} section={section} names={vm.opening.names} />
        ))
      ) : null}
    </div>
  );
}

