import { psychMatchAxisLabel } from "@/lib/relationship/psychMatch/axisLabels";
import type {
  PersonSnapshotGauges,
  TriScoreSnapshotPanel,
} from "@/lib/relationship/triScoreSnapshot/types";
import { PRIMARY_AXIS_LABELS, PRIMARY_AXIS_EN_LABELS } from "@/lib/v2/framework/axisLabels";
import type { PrimaryAxisKey, SecondaryAxisKey } from "@/lib/v2/survey/types";
import type { PsychMasterJson } from "../types/psychMaster";
import type { SnapshotAxisBar } from "@/lib/relationship/triScoreSnapshot/types";
import type { Locale } from "@/lib/i18n/locale";

export type SnapshotPsychDomain =
  | "cohabitation"
  | "work"
  | "friendship"
  | "family";

const SNAPSHOT_PRIMARY_KEYS: PrimaryAxisKey[] = [
  "connection",
  "stability",
  "growth",
  "structure",
  "adaptability",
];

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function avg(...values: number[]): number {
  if (values.length === 0) return 50;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * 11축 psych_master → 스냅샷 5 primary 축 (동거·동료 공통 UI용 근사).
 * SSOT는 psych_master_json.secondary_axes.
 * `locale` defaults to Korean so every pre-existing caller that doesn't pass
 * it keeps rendering exactly as before.
 */
export function mapPsychMasterToSnapshotAxes(
  psych: PsychMasterJson,
  locale: Locale = "ko-KR",
): SnapshotAxisBar[] {
  const s = psych.secondary_axes;
  const derived: Record<(typeof SNAPSHOT_PRIMARY_KEYS)[number], number> = {
    connection: avg(s.empathy, s.energy_style),
    stability: avg(s.self_control, s.practicality),
    growth: avg(s.stimulation, s.resilience),
    structure: avg(s.structure, s.thinking_style, s.decision_style),
    adaptability: avg(s.conflict_style, s.recognition),
    autonomy: 50,
  };
  const labels = locale === "en-US" ? PRIMARY_AXIS_EN_LABELS : PRIMARY_AXIS_LABELS;

  return SNAPSHOT_PRIMARY_KEYS.map((key) => ({
    key,
    label: labels[key],
    value: clamp(derived[key]),
  }));
}

export function psychSnapshotMetaphor(psych: PsychMasterJson, locale: Locale = "ko-KR"): string {
  const dna = psych.home_life_dna;
  if (dna.lifestyle_title?.trim()) return dna.lifestyle_title.trim();
  const line = dna.life_values_line?.split(".")[0]?.trim();
  return line || (locale === "en-US" ? "Home-Life DNA" : "홈라이프 DNA");
}

export function psychAxesSource(
  psych: PsychMasterJson,
): "survey" | "saju_estimate" {
  return psych.survey_source === "v2_10q" ? "survey" : "saju_estimate";
}

const DOMAIN_LEAD_AXIS_KEYS: Record<
  SnapshotPsychDomain,
  SecondaryAxisKey[]
> = {
  cohabitation: ["empathy", "practicality", "structure"],
  work: ["structure", "decision_style", "thinking_style", "practicality"],
  friendship: ["empathy", "energy_style", "stimulation", "conflict_style"],
  family: ["empathy", "self_control", "recognition", "resilience"],
};

function topSecondaryAxis(
  psych: PsychMasterJson,
  keys: SecondaryAxisKey[],
): SecondaryAxisKey {
  const scores = psych.secondary_axes;
  return keys.reduce((best, key) =>
    scores[key] > scores[best] ? key : best,
  keys[0]!);
}

export function psychSnapshotMetaphorForDomain(
  psych: PsychMasterJson,
  domain: SnapshotPsychDomain,
  locale: Locale = "ko-KR",
): string {
  if (domain === "cohabitation") return psychSnapshotMetaphor(psych, locale);
  const lead = topSecondaryAxis(psych, DOMAIN_LEAD_AXIS_KEYS[domain]);
  const label = psychMatchAxisLabel(lead, locale);
  const score = psych.secondary_axes[lead];
  return locale === "en-US"
    ? `${label} type · ${clamp(score)}`
    : `${label}형 · ${clamp(score)}`;
}

export function buildPersonGaugesFromPsych(
  nickname: string,
  psych: PsychMasterJson,
  domain: SnapshotPsychDomain,
  locale: Locale = "ko-KR",
): PersonSnapshotGauges {
  return {
    nickname,
    metaphor: psychSnapshotMetaphorForDomain(psych, domain, locale),
    axes: mapPsychMasterToSnapshotAxes(psych, locale),
  };
}

export function resolveSnapshotPersonAxesSource(
  psychA: PsychMasterJson | null | undefined,
  psychB: PsychMasterJson | null | undefined,
): TriScoreSnapshotPanel["personAxesSource"] {
  if (!psychA || !psychB) return "hidden";
  return psychAxesSource(psychA) === "survey" &&
    psychAxesSource(psychB) === "survey"
    ? "survey"
    : "saju_estimate";
}

export function patchSnapshotPanelWithPsych(
  panel: TriScoreSnapshotPanel,
  nicknames: { nicknameA: string; nicknameB: string },
  psych: { psychA?: PsychMasterJson | null; psychB?: PsychMasterJson | null },
  domain: SnapshotPsychDomain,
  locale: Locale = "ko-KR",
): TriScoreSnapshotPanel {
  const { psychA, psychB } = psych;
  if (!psychA || !psychB) return panel;
  if (
    panel.personAxesSource === "survey" &&
    panel.personA.axes.length === SNAPSHOT_PRIMARY_KEYS.length &&
    panel.personB.axes.length === SNAPSHOT_PRIMARY_KEYS.length
  ) {
    return panel;
  }
  return {
    ...panel,
    personA: buildPersonGaugesFromPsych(
      nicknames.nicknameA,
      psychA,
      domain,
      locale,
    ),
    personB: buildPersonGaugesFromPsych(
      nicknames.nicknameB,
      psychB,
      domain,
      locale,
    ),
    personAxesSource: resolveSnapshotPersonAxesSource(psychA, psychB),
  };
}
