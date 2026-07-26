/**
 * M7 Daily Life projector.
 * Ordinary-life observations from Romantic comparison/dynamics only.
 * Does not import Marriage cohabitation conclusions or invent lifestyle advice.
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { readRomanticBalanceCanonicalProjection } from "@/lib/relationship/romantic/romanticBalanceOfPowerCanonical";
import {
  formatRomanticCompareLeanLabel,
  readRomanticComparisonTableCanonicalProjection,
  romanticCompareLeanForViewerColumn,
  type RomanticCompareRowKey,
} from "@/lib/relationship/romantic/romanticComparisonTableCanonical";
import { readRomanticReassuranceCanonicalProjection } from "@/lib/relationship/romantic/romanticReassuranceCanonical";
import type {
  ConfidenceLevel,
  DailyLifeDomainId,
  DailyLifeDomainVM,
  DailyLifeVM,
  EvidenceRef,
} from "../romanticExperienceTypes";
import { emptyDailyLife } from "./_empty";

export type ProjectDailyLifeInput = {
  report: RomanticSajuDeepReport["report"];
  viewerIsReportA: boolean;
  myName: string;
  partnerName: string;
  locale?: string;
};

const DOMAIN_META: Record<
  DailyLifeDomainId,
  { label: string }
> = {
  money_practicality: { label: "돈·실용" },
  /** Slot kept for domain inventory; Romantic has no chore/household field. */
  chores_structure: { label: "집안일·가사 분담" },
  space_closeness: { label: "거리·친밀" },
  social_energy: { label: "사회적 에너지" },
  decision_making: { label: "일상 결정" },
  routine_rhythm: { label: "루틴·리듬" },
};

function unsupported(id: DailyLifeDomainId): DailyLifeDomainVM {
  return {
    id,
    label: DOMAIN_META[id].label,
    supported: false,
    observation: null,
    sourceKeys: [],
    confidence: null,
    ownerDirection: null,
  };
}

function mapRowConfidence(
  c: "high" | "low" | undefined,
): ConfidenceLevel | null {
  if (c === "high") return "high";
  if (c === "low") return "low";
  return null;
}

function pairObservation(
  input: ProjectDailyLifeInput,
  rowKey: RomanticCompareRowKey,
  dailyVerb: string,
): Omit<DailyLifeDomainVM, "id" | "label"> | null {
  const table = readRomanticComparisonTableCanonicalProjection(input.report);
  const row = table?.[rowKey];
  if (!row) return null;
  // Skip identical balanced — no ordinary-life contrast to show.
  if (row.lean_a === row.lean_b && row.lean_a === "balanced") return null;

  const leanMe = romanticCompareLeanForViewerColumn(
    row,
    input.viewerIsReportA,
    "me",
  );
  const leanPartner = romanticCompareLeanForViewerColumn(
    row,
    input.viewerIsReportA,
    "partner",
  );
  if (!leanMe || !leanPartner) return null;

  const meLabel = formatRomanticCompareLeanLabel(leanMe, input.locale, rowKey);
  const partnerLabel = formatRomanticCompareLeanLabel(
    leanPartner,
    input.locale,
    rowKey,
  );
  const ownerDirection = `${input.myName}: ${meLabel} / ${input.partnerName}: ${partnerLabel}`;
  const observation =
    leanMe === leanPartner
      ? `일상에서 ${dailyVerb} 둘 다 ${meLabel} 쪽에 가까워요.`
      : `일상에서 ${dailyVerb} ${input.myName}은(는) ${meLabel}, ${input.partnerName}은(는) ${partnerLabel} 리듬이에요.`;

  return {
    supported: true,
    observation,
    sourceKeys: [`canonical_projections.comparison_table.${rowKey}`],
    confidence: mapRowConfidence(row.confidence),
    ownerDirection,
  };
}

/**
 * Availability: ≥1 supported domain from Romantic evidence.
 * Unsupported domains are listed explicitly (no generic advice filler).
 */
export function projectDailyLife(input: ProjectDailyLifeInput): DailyLifeVM {
  const base = emptyDailyLife();
  const evidence: EvidenceRef[] = [];
  const domains: DailyLifeDomainVM[] = [];

  // money — no Romantic report field
  domains.push(unsupported("money_practicality"));

  // chores / domestic labor — no Romantic household field.
  // Stress/conflict leans are weak proxies; do not promote them to chore claims.
  domains.push(unsupported("chores_structure"));

  // space/closeness ← reassurance needs
  const reassurance = readRomanticReassuranceCanonicalProjection(input.report);
  if (reassurance) {
    const needMe = input.viewerIsReportA
      ? reassurance.need_a
      : reassurance.need_b;
    const needPartner = input.viewerIsReportA
      ? reassurance.need_b
      : reassurance.need_a;
    const needLabel = (n: string) => {
      if (n === "listening") return "듣기로 안심";
      if (n === "behavior_proof") return "행동 증명으로 안심";
      if (n === "presence") return "존재감으로 안심";
      return "복합 안심";
    };
    domains.push({
      id: "space_closeness",
      label: DOMAIN_META.space_closeness.label,
      supported: true,
      observation: `가까운 일상에서 ${input.myName}은(는) ${needLabel(needMe)}, ${input.partnerName}은(는) ${needLabel(needPartner)} 쪽을 더 찾아요.`,
      sourceKeys: ["canonical_projections.reassurance_signal"],
      confidence: "medium",
      ownerDirection: `${input.myName}: ${needMe} / ${input.partnerName}: ${needPartner}`,
    });
    evidence.push({
      path: "canonical_projections.reassurance_signal",
      summary: "closeness / reassurance form",
    });
  } else {
    domains.push(unsupported("space_closeness"));
  }

  // social energy ← communication (+ expression if present)
  const social = pairObservation(input, "communication", "함께 말할 때");
  const expression = pairObservation(input, "expression", "감정을 드러낼 때");
  if (social || expression) {
    const parts = [social?.observation, expression?.observation].filter(
      Boolean,
    ) as string[];
    const sourceKeys = [
      ...(social?.sourceKeys ?? []),
      ...(expression?.sourceKeys ?? []),
    ];
    domains.push({
      id: "social_energy",
      label: DOMAIN_META.social_energy.label,
      supported: true,
      observation: parts.join(" "),
      sourceKeys,
      confidence: social?.confidence ?? expression?.confidence ?? "medium",
      ownerDirection:
        social?.ownerDirection ?? expression?.ownerDirection ?? null,
    });
    for (const path of sourceKeys) {
      evidence.push({ path, summary: "social energy contrast" });
    }
  } else {
    domains.push(unsupported("social_energy"));
  }

  // decision-making
  const decision = pairObservation(input, "decision", "결정을 내릴 때");
  if (decision) {
    domains.push({
      id: "decision_making",
      label: DOMAIN_META.decision_making.label,
      ...decision,
    });
    evidence.push({
      path: "canonical_projections.comparison_table.decision",
      summary: "everyday decision rhythm",
    });
  } else {
    domains.push(unsupported("decision_making"));
  }

  // routine rhythm ← balance of power (who leads shared pacing) — not marriage chores
  const balance = readRomanticBalanceCanonicalProjection(input.report);
  if (balance) {
    const bandMe = input.viewerIsReportA
      ? balance.balance_a
      : balance.balance_b;
    const bandPartner = input.viewerIsReportA
      ? balance.balance_b
      : balance.balance_a;
    const bandLabel = (b: string) => {
      if (b === "leader") return "리드";
      if (b === "receiver") return "수용";
      return "균형";
    };
    domains.push({
      id: "routine_rhythm",
      label: DOMAIN_META.routine_rhythm.label,
      supported: true,
      observation: `함께하는 리듬에서 ${input.myName}은(는) ${bandLabel(bandMe)}, ${input.partnerName}은(는) ${bandLabel(bandPartner)} 쪽에 가까워요.`,
      sourceKeys: ["canonical_projections.balance_of_power"],
      confidence: "medium",
      ownerDirection: `${input.myName}: ${bandMe} / ${input.partnerName}: ${bandPartner}`,
    });
    evidence.push({
      path: "canonical_projections.balance_of_power",
      summary: "shared routine lead/receive",
    });
  } else {
    domains.push(unsupported("routine_rhythm"));
  }

  const supported = domains.filter((d) => d.supported);
  if (supported.length === 0) return base;

  let confidence: ConfidenceLevel = "low";
  if (supported.length >= 3) confidence = "high";
  else if (supported.length >= 2) confidence = "medium";

  return {
    ...base,
    title: "Daily Life",
    available: true,
    confidence,
    evidence,
    domains,
  };
}
