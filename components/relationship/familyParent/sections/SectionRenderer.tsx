"use client";

/**
 * Family Premium — FamilyReportViewModel 전용 렌더러. work·friend·marriage의
 * SectionRenderer.tsx와 동일한 패턴 — en-US/ko-KR 둘 다 production에서
 * 쓰인다(ko-KR 전용 게이트 금지). 카드 내부 라벨은
 * `useMessages().relationshipDrilldown.family`에서 가져온다.
 *
 * family는 비대칭 부모-자녀 관계라 viewer 토글이 없다 — 항상 고정된
 * parent/child 순서로 렌더링한다(기존 FamilyParentReportView.tsx와 동일).
 */
import type { ReactNode } from "react";
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
import { OverviewSection } from "@/components/relationship/shared/overview/OverviewSection";
import type { OverviewCardData } from "@/lib/relationship/shared/overview/overviewTypes";
import { PsychAxisComparisonSection } from "@/components/relationship/shared/psychAxis/PsychAxisComparisonSection";
import { VersusStrip, Reveal } from "@/components/relationship/shared/editorial/EditorialPrimitives";
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

const ACCENT = getTabTheme("family").accent;

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
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <p className="text-lg font-semibold text-white/92">{section.frictionIndex}%</p>
        <div>
          <RelationshipReportLabel>{t.relationshipIndexSafeDistanceLabel}</RelationshipReportLabel>
          <RelationshipReportParagraph className="mt-1.5">
            {section.safeDistanceNote}
          </RelationshipReportParagraph>
        </div>
        {section.decisionAxisNote ? (
          <RelationshipReportInset>
            <RelationshipReportParagraph className="text-white/78">
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
    <RelationshipReportCard title={section.title} accentColor={ACCENT}>
      <RelationshipReportBody>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <RelationshipReportLabel>
              {t.householdRolesSelfLabel(section.selfName)}
            </RelationshipReportLabel>
            <p className="mt-2 text-base font-semibold text-white/92">{section.selfRoleLabel}</p>
            <RelationshipReportParagraph className="mt-2 text-white/75">
              {section.selfRoleDetail}
            </RelationshipReportParagraph>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <RelationshipReportLabel>
              {t.householdRolesPartnerLabel(section.partnerName)}
            </RelationshipReportLabel>
            <p className="mt-2 text-base font-semibold text-white/92">{section.partnerRoleLabel}</p>
            <RelationshipReportParagraph className="mt-2 text-white/75">
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
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-200/70">
            {t.dnaLayerLabel}
          </p>
          <p className="mt-1 text-sm text-white/55">{t.dnaLayerHint}</p>
        </div>
        <p className="flex items-center gap-2 text-lg font-semibold text-white/92">
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
          <p className="mt-1.5 flex items-center gap-2 text-base font-semibold text-white/92">
            <TypeIconBadge Icon={StudyIcon} />
            {section.studyTypeLabel}
          </p>
          <RelationshipReportParagraph className="mt-1.5">{section.studyTypeNote}</RelationshipReportParagraph>
        </div>
        <div>
          <RelationshipReportLabel>{t.talentWealthVesselLabel}</RelationshipReportLabel>
          <p className="mt-1.5 flex items-center gap-2 text-base font-semibold text-white/92">
            <TypeIconBadge Icon={WealthIcon} />
            {section.wealthVesselLabel}
          </p>
          <RelationshipReportParagraph className="mt-1.5">{section.wealthVesselNote}</RelationshipReportParagraph>
        </div>
        {section.inheritedNote ? (
          <RelationshipReportInset>
            <RelationshipReportParagraph className="text-white/78">
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
          <p className="text-xs font-medium uppercase tracking-wide text-amber-200/70">
            {t.growthLayerLabel}
          </p>
          <p className="mt-1 text-sm text-white/55">{t.growthLayerHint}</p>
        </div>
        <RelationshipReportParagraph>{section.currentChallenge}</RelationshipReportParagraph>
        {section.focusAreas.length > 0 ? (
          <p className="text-sm text-white/50">
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
        <p className="flex items-center gap-2 text-lg font-semibold text-white/92">
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
        <p className="flex items-center gap-2 text-lg font-semibold text-white/92">
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
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-200/70">
            {t.destinyLayerLabel}
          </p>
          <p className="mt-1 text-sm text-white/55">{t.destinyLayerHint}</p>
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
          <RelationshipReportParagraph className="italic text-emerald-200/75">
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
          <p className="text-xs font-medium uppercase tracking-wide text-amber-200/70">
            {t.filialLayerLabel}
          </p>
          <p className="mt-1 text-sm text-white/55">{t.filialLayerHint}</p>
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
        <RelationshipReportInset className="border-emerald-400/20 bg-emerald-950/10">
          <RelationshipReportParagraph className="flex items-start gap-2 italic text-emerald-100/85">
            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" strokeWidth={1.75} aria-hidden />
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
          <p className="text-xs font-medium uppercase tracking-wide text-rose-200/70">
            {t.deEscalationLayerLabel}
          </p>
          <p className="mt-1 text-sm text-white/55">{t.deEscalationLayerHint}</p>
        </div>
        <p className="text-lg font-bold text-white/95">{card.hashtag}</p>
        <p className="text-sm text-white/50">{card.archetype_label}</p>
        <div className="mt-4 space-y-3">
          <div>
            <RelationshipReportLabel>{t.whenAngryLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{card.psych_state}</RelationshipReportParagraph>
          </div>
          <div>
            <RelationshipReportLabel className="text-red-300/80">{t.avoidLabel}</RelationshipReportLabel>
            <RelationshipReportParagraph className="mt-1.5">{card.avoid_actions}</RelationshipReportParagraph>
          </div>
          <RelationshipReportInset className="border-emerald-400/20 bg-emerald-950/10">
            <RelationshipReportParagraph className="flex items-start gap-2 italic text-emerald-100/85">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" strokeWidth={1.75} aria-hidden />
              {card.solution_script}
            </RelationshipReportParagraph>
          </RelationshipReportInset>
          {card.boundary_script ? (
            <RelationshipReportInset className="border-sky-400/20 bg-sky-950/10">
              <RelationshipReportParagraph className="flex items-start gap-2 italic text-sky-100/85">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" strokeWidth={1.75} aria-hidden />
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
        <p className="text-xs font-medium uppercase tracking-wide text-violet-200/70">
          {t.prescriptionLayerLabel}
        </p>
        <p className="mt-1 text-sm text-white/55">{t.prescriptionLayerHint}</p>
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

/** ViewModel 전체를 RelationshipReportLayout에 조립 — production 진입점. */
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
    <RelationshipReportLayout
      kind="family"
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
        const bond = snapshot.panel.narrative.topics.find(t => t.topic === "intimacy")! || snapshot.panel.narrative.topics[0];
        const synergy = snapshot.panel.narrative.topics.find(t => t.topic === "stability")! || snapshot.panel.narrative.topics[1];
        const risk = snapshot.panel.narrative.topics.find(t => t.topic === "conflict")! || snapshot.panel.narrative.topics[2];
        
        const cards: OverviewCardData[] = [
          {
            key: "bond",
            icon: "🔥",
            label: t.scoreLabelBond,
            score: snapshot.scores.bondPct,
            tone: "good",
            inverted: false,
            gradeLabel: bond.title,
            oneLiner: bond.subtitle,
            measures: pick(locale, "How deeply you understand and support each other emotionally", "서로의 마음을 얼마나 깊이 이해하고 지지하는지"),
            why: bond.interpretation,
            thresholdText: bond.axisNote,
          },
          {
            key: "synergy",
            icon: "🧩",
            label: t.scoreLabelSynergy,
            score: snapshot.scores.synergyPct,
            tone: "neutral",
            inverted: false,
            gradeLabel: synergy.title,
            oneLiner: synergy.subtitle,
            measures: pick(locale, "How well your different strengths complement each other for growth", "서로 다른 강점이 시너지를 내어 어떻게 성장을 돕는지"),
            why: synergy.interpretation,
            thresholdText: synergy.axisNote,
          },
          {
            key: "risk",
            icon: "⚡",
            label: t.scoreLabelFriction,
            score: snapshot.scores.riskPct,
            tone: "warn",
            inverted: true,
            gradeLabel: risk.title,
            oneLiner: risk.subtitle,
            measures: pick(locale, "The potential for friction or misunderstanding in daily life", "훈육이나 일상에서 오해나 마찰이 생길 가능성"),
            why: risk.interpretation,
            thresholdText: risk.axisNote,
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

      {editorialChapters.map((chapter) => (
        <FamilyChapterSection
          key={chapter.id}
          id={chapter.id}
          number={chapter.number}
          title={chapter.title}
          accent={ACCENT}
        >
          {chapter.summary ? (
            <p className="mb-6 font-rel-sans text-[15px] font-medium leading-[1.7] text-emerald-200/90 italic border-l-2 border-emerald-400/40 pl-3">
              💡 {chapter.summary}
            </p>
          ) : null}

          {/* StoryPlan Synthesis or Claim Highlight */}
          {chapter.synthesis.length > 0 ? (
            <div className="mb-6 space-y-3">
              {chapter.synthesis.map((syn, idx) => (
                <div key={idx} className="rounded-xl border border-emerald-400/20 bg-emerald-950/20 p-4">
                  <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                    ✨ Synthesis · {syn.headline}
                  </p>
                  <p className="mt-1 text-sm text-white/88 leading-relaxed">
                    {syn.summary}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Coverage Model: Conflict Loop */}
          {chapter.conflictLoop && (chapter.conflictLoop.parentTrigger || chapter.conflictLoop.breakPattern) ? (
            <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-950/20 p-4">
              <p className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                ⚡ 갈등 양상과 조율 포인트 · Conflict Loop
              </p>
              {chapter.conflictLoop.parentTrigger ? (
                <p className="mt-1.5 text-sm font-medium text-white/90">
                  트리거: {chapter.conflictLoop.parentTrigger}
                </p>
              ) : null}
              {chapter.conflictLoop.childReaction ? (
                <p className="mt-1 text-sm text-white/75">
                  자녀 반응: {chapter.conflictLoop.childReaction}
                </p>
              ) : null}
              {chapter.conflictLoop.parentEscalation ? (
                <p className="mt-1 text-sm text-white/75">
                  증폭 방식: {chapter.conflictLoop.parentEscalation}
                </p>
              ) : null}
              {chapter.conflictLoop.breakPattern ? (
                <p className="mt-2 text-xs italic text-rose-200/70">
                  💡 출구 전략: {chapter.conflictLoop.breakPattern}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Core Pair Meaning 1: Dependency / Protection Dynamic */}
          {chapter.dependencyProtection ? (
            <div className="mb-6 rounded-xl border border-indigo-400/20 bg-indigo-950/20 p-4">
              <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                🛡️ 의존과 보호 구도 · Dependency & Protection
              </p>
              <p className="mt-1.5 text-sm font-medium text-white/90">
                부모의 보호 방식: {chapter.dependencyProtection.provider}
              </p>
              <p className="mt-1 text-sm text-white/75">
                자녀의 의존 톤: {chapter.dependencyProtection.reliance}
              </p>
              {chapter.dependencyProtection.roleReversalRisk ? (
                <p className="mt-2 text-xs italic text-amber-300/90">
                  ⚠️ {chapter.dependencyProtection.summary}
                </p>
              ) : (
                <p className="mt-2 text-xs italic text-indigo-200/75">
                  💡 {chapter.dependencyProtection.summary}
                </p>
              )}
            </div>
          ) : null}

          {/* Core Pair Meaning 2: Love Expression vs Reception */}
          {chapter.loveExpressionVsReception ? (
            <div className="mb-6 rounded-xl border border-pink-400/20 bg-pink-950/20 p-4">
              <p className="text-xs font-semibold text-pink-300 uppercase tracking-wider">
                ❤️ 사랑의 표현과 수용 · Love Expression & Reception
              </p>
              <p className="mt-1.5 text-sm font-medium text-white/90">
                부모의 표현 방식: {chapter.loveExpressionVsReception.parentExpresses}
              </p>
              <p className="mt-1 text-sm text-white/75">
                자녀가 느끼는 체감 톤: {chapter.loveExpressionVsReception.childReceives}
              </p>
              <p className="mt-2 text-xs italic text-pink-200/80">
                💬 {chapter.loveExpressionVsReception.summary}
              </p>
            </div>
          ) : null}

          {/* Coverage Model: Repair Pattern */}
          {chapter.repairPattern && chapter.repairPattern.effectiveRepairStyle ? (
            <div className="mb-6 rounded-xl border border-amber-400/20 bg-amber-950/20 p-4">
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                🌱 관계 회복 단계 · Emotional Repair
              </p>
              <p className="mt-1.5 text-sm font-medium text-white/90">
                효과적인 화해 방식: {chapter.repairPattern.effectiveRepairStyle}
              </p>
              {chapter.repairPattern.ineffectiveRepairStyle ? (
                <p className="mt-1 text-sm text-white/75">
                  주의할 역효과 톤: {chapter.repairPattern.ineffectiveRepairStyle}
                </p>
              ) : null}
              {chapter.repairPattern.reconnectionAction ? (
                <p className="mt-2 text-xs italic text-amber-200/80">
                  💡 재연결 실천 행동: {chapter.repairPattern.reconnectionAction}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Coverage Model: Growth Transition */}
          {chapter.growthTransition && chapter.growthTransition.currentRolePattern ? (
            <div className="mb-6 rounded-xl border border-sky-400/20 bg-sky-950/20 p-4">
              <p className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
                🚀 성장 전환점 · Growth Transition
              </p>
              <p className="mt-1.5 text-sm font-medium text-white/90">
                현재 역할 패턴: {chapter.growthTransition.currentRolePattern}
              </p>
              <p className="mt-1 text-sm text-white/75">
                추천 전환 포지션: {chapter.growthTransition.recommendedShift}
              </p>
              {chapter.growthTransition.transitionReason ? (
                <p className="mt-2 text-xs italic text-sky-200/80">
                  💡 전환 이유: {chapter.growthTransition.transitionReason}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* Core Pair Meaning 3: Expectation vs Pressure */}
          {chapter.expectationVsPressure ? (
            <div className="mb-6 rounded-xl border border-purple-400/20 bg-purple-950/20 p-4">
              <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                🎯 부모의 기대와 성취 중압감 · Expectation & Pressure
              </p>
              <p className="mt-1.5 text-sm font-medium text-white/90">
                부모의 기대 톤: {chapter.expectationVsPressure.parentExpectation}
              </p>
              <p className="mt-1 text-sm text-white/75">
                자녀의 체감 중압감: {chapter.expectationVsPressure.childPressureReception}
              </p>
              <p className="mt-2 text-xs italic text-purple-200/80">
                ⚖️ {chapter.expectationVsPressure.summary}
              </p>
            </div>
          ) : null}

          {/* Core Pair Meaning 4: Child Core Needs (3-Tier Structure: Desired Style x Parent Supply x Pair Gap) */}
          {chapter.childCoreNeeds ? (
            <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-950/20 p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                  🎁 Child's Core Needs · 자녀 핵심 양육 욕구 종합
                </p>
                <p className="mt-1 text-xs text-white/70 italic">
                  {chapter.childCoreNeeds.summary}
                </p>
              </div>

              {/* Tier 1: Child Desired Parenting Style (Innate Needs) */}
              {chapter.childCoreNeedsDetailed?.innateParentingNeeds?.length ? (
                <div className="rounded-lg bg-emerald-900/30 p-3 border border-emerald-400/15">
                  <p className="text-xs font-medium text-emerald-200 mb-1.5 flex items-center gap-1.5">
                    <span>🌱</span> 이 아이가 편안하게 자라는 본래 부모 태도
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chapter.childCoreNeedsDetailed.innateParentingNeeds.map((need, idx) => (
                      <span key={idx} className="rounded-md bg-emerald-800/40 px-2 py-0.5 text-xs text-emerald-100 font-medium">
                        #{need.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Tier 2: Well Supplied Needs */}
              {chapter.childCoreNeedsDetailed?.wellSuppliedNeeds?.length ? (
                <div className="rounded-lg bg-emerald-900/30 p-3 border border-emerald-400/15">
                  <p className="text-xs font-medium text-emerald-300 mb-1.5 flex items-center gap-1.5">
                    <span>✅</span> 지금 이 부모가 잘 주고 있는 것 (충분함)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chapter.childCoreNeedsDetailed.wellSuppliedNeeds.map((need, idx) => (
                      <span key={idx} className="rounded-md bg-emerald-950/60 px-2 py-0.5 text-xs text-emerald-200 border border-emerald-500/30">
                        ✓ {need.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Tier 3: Primary Pair Gapped Needs */}
              {chapter.childCoreNeedsDetailed?.primaryNeeds?.length ? (
                <div className="rounded-lg bg-amber-950/30 p-3 border border-amber-400/20">
                  <p className="text-xs font-medium text-amber-200 mb-1.5 flex items-center gap-1.5">
                    <span>💡</span> 이 관계에서 조금 더 필요한 1~3가지 핵심 욕구
                  </p>
                  <ul className="space-y-1.5">
                    {chapter.childCoreNeedsDetailed.primaryNeeds.map((need, idx) => (
                      <li key={idx} className="text-xs text-amber-100 flex items-start gap-1.5">
                        <span className="font-semibold text-amber-300 shrink-0">[{need.gapStatus}]</span>
                        <span><strong>{need.label}</strong>: {need.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Discrepancy Caution Signal if present */}
              {chapter.childCoreNeedsDetailed?.discrepancySummary ? (
                <p className="text-xs text-rose-200/80 italic bg-rose-950/20 p-2.5 rounded-lg border border-rose-400/20">
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
      ))}

      {/* Legacy flat fallback when no editorial chapters */}
      {editorialChapters.length === 0 ? (
        vm.sections.map((section) => (
          <FamilyReportSectionCard key={section.id} section={section} names={vm.opening.names} />
        ))
      ) : null}
    </RelationshipReportLayout>
  );
}

