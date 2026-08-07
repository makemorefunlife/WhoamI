/**
 * Representative DEV corpus cases for Relationship Incremental Enrichment.
 * Pure data — no report building here.
 */

export type EnrichmentDomain = "friend" | "work" | "family" | "partner";

export type CorpusCaseId =
  | "strong"
  | "mixed"
  | "weak"
  | "reversed_ab"
  | "unknown_hour"
  | "sparse_psych"
  | "psych_saju_agree"
  | "psych_saju_conflict";

export type CorpusBirthPair = {
  /** ISO date YYYY-MM-DD */
  birthA: string;
  birthB: string;
  timeA: string | null;
  timeB: string | null;
  nicknameA: string;
  nicknameB: string;
  /** family only */
  roles?: { roleA: "child" | "mother" | "father"; roleB: "child" | "mother" | "father" };
  parentType?: "mother" | "father";
};

export type PsychProfileKind =
  | "none"
  | "sparse"
  | "balanced"
  | "agree_high_empathy"
  | "conflict_style_clash";

export type CorpusCaseDef = {
  id: CorpusCaseId;
  label_ko: string;
  label_en: string;
  psych: PsychProfileKind;
  /** when true, swap A/B after base pair is chosen */
  reverseAb?: boolean;
  unknownHour?: boolean;
};

/** Shared birth pairs tuned for compatibility variety (deterministic). */
export const CORPUS_BIRTH_PAIRS: Record<
  "compat_strong" | "compat_mixed" | "compat_weak",
  CorpusBirthPair
> = {
  compat_strong: {
    birthA: "1990-05-15",
    birthB: "1992-03-08",
    timeA: "14:30",
    timeB: "09:00",
    nicknameA: "Alex",
    nicknameB: "Jordan",
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
  },
  compat_mixed: {
    birthA: "1988-11-22",
    birthB: "1995-07-04",
    timeA: "06:20",
    timeB: "18:45",
    nicknameA: "Alex",
    nicknameB: "Jordan",
    roles: { roleA: "child", roleB: "father" },
    parentType: "father",
  },
  compat_weak: {
    birthA: "1985-01-10",
    birthB: "1999-12-28",
    timeA: "22:10",
    timeB: "03:30",
    nicknameA: "Alex",
    nicknameB: "Jordan",
    roles: { roleA: "child", roleB: "mother" },
    parentType: "mother",
  },
};

export const CORPUS_CASES: CorpusCaseDef[] = [
  {
    id: "strong",
    label_ko: "조화가 많은 테스트 사례",
    label_en: "High Harmony Test Case",
    psych: "balanced",
  },
  {
    id: "mixed",
    label_ko: "장점과 긴장이 섞인 테스트 사례",
    label_en: "Mixed Strengths & Tension Test Case",
    psych: "balanced",
  },
  {
    id: "weak",
    label_ko: "주의점이 많은 테스트 사례",
    label_en: "High Caution Test Case",
    psych: "balanced",
  },
  {
    id: "reversed_ab",
    label_ko: "A/B 방향 반전 검증",
    label_en: "A/B Direction Reversal Test Case",
    psych: "balanced",
    reverseAb: true,
  },
  {
    id: "unknown_hour",
    label_ko: "출생시간 없음",
    label_en: "Birth Hour Unknown Test Case",
    psych: "balanced",
    unknownHour: true,
  },
  {
    id: "sparse_psych",
    label_ko: "설문 데이터 부족",
    label_en: "Sparse Survey Data Test Case",
    psych: "sparse",
  },
  {
    id: "psych_saju_agree",
    label_ko: "사주·설문 일치",
    label_en: "Saju & Psych Align Test Case",
    psych: "agree_high_empathy",
  },
  {
    id: "psych_saju_conflict",
    label_ko: "사주·설문 충돌",
    label_en: "Saju & Psych Conflict Test Case",
    psych: "conflict_style_clash",
  },
];

export const ENRICHMENT_DOMAINS: EnrichmentDomain[] = [
  "friend",
  "work",
  "family",
  "partner",
];

export function resolveBirthPairForCase(caseId: CorpusCaseId): CorpusBirthPair {
  const base =
    caseId === "weak"
      ? CORPUS_BIRTH_PAIRS.compat_weak
      : caseId === "mixed" || caseId === "sparse_psych"
        ? CORPUS_BIRTH_PAIRS.compat_mixed
        : CORPUS_BIRTH_PAIRS.compat_strong;

  const def = CORPUS_CASES.find((c) => c.id === caseId)!;
  let pair: CorpusBirthPair = { ...base, roles: base.roles ? { ...base.roles } : undefined };

  if (def.unknownHour) {
    pair = { ...pair, timeA: null, timeB: null };
  }

  if (def.reverseAb) {
    pair = {
      ...pair,
      birthA: base.birthB,
      birthB: base.birthA,
      timeA: base.timeB,
      timeB: base.timeA,
      nicknameA: base.nicknameB,
      nicknameB: base.nicknameA,
      roles: base.roles
        ? { roleA: base.roles.roleB, roleB: base.roles.roleA }
        : undefined,
      parentType: base.parentType,
    };
  }

  return pair;
}
