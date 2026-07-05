import {
  REF_EARTHLY_BRANCHES,
  REF_HEAVENLY_STEMS,
  REF_HIDDEN_STEMS,
  REF_TEN_GOD_RULES,
  REF_TEN_GODS,
  REF_TWELVE_STAGE_RULES,
  REF_TWELVE_STAGES,
} from "@/lib/hardcoded/sajuReferenceData";

const heavenlyStemByCode = new Map(
  REF_HEAVENLY_STEMS.map((row) => [row.code, row]),
);
const earthlyBranchByCode = new Map(
  REF_EARTHLY_BRANCHES.map((row) => [row.code, row]),
);
const hiddenStemsByBranch = new Map<string, typeof REF_HIDDEN_STEMS>();
for (const row of REF_HIDDEN_STEMS) {
  const list = hiddenStemsByBranch.get(row.branch_code) ?? [];
  list.push(row);
  hiddenStemsByBranch.set(row.branch_code, list);
}
for (const [branch, rows] of hiddenStemsByBranch) {
  rows.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  hiddenStemsByBranch.set(branch, rows);
}
const tenGodByCode = new Map(REF_TEN_GODS.map((row) => [row.code, row]));
const twelveStageByCode = new Map(
  REF_TWELVE_STAGES.map((row) => [row.code, row]),
);
const tenGodRuleByKey = new Map(
  REF_TEN_GOD_RULES.map((row) => [
    `${row.day_master_stem}:${row.target_stem}`,
    row.ten_god_code,
  ]),
);
const twelveStageRuleByKey = new Map(
  REF_TWELVE_STAGE_RULES.map((row) => [
    `${row.day_master_stem}:${row.target_branch}`,
    row.stage_code,
  ]),
);

export function getHeavenlyStemData(stemCode: string) {
  const row = heavenlyStemByCode.get(stemCode);
  if (!row) return null;
  return {
    kor_name: row.kor_name,
    metaphor_ko: row.metaphor_ko,
    strength_ko: row.strength_ko,
    weakness_ko: row.weakness_ko,
    advice_ko: row.advice_ko,
  };
}

export function getEarthlyBranchData(branchCode: string) {
  const row = earthlyBranchByCode.get(branchCode);
  if (!row) return null;
  return {
    kor_name: row.kor_name,
    meaning_ko: row.meaning_ko,
    strength_ko: row.strength_ko,
    weakness_ko: row.weakness_ko,
    advice_ko: row.advice_ko,
  };
}

export function getHiddenStemsData(branchCode: string) {
  const rows = hiddenStemsByBranch.get(branchCode) ?? [];
  return rows.map((row) => ({
    stem_code: row.stem_code,
    layer_type: row.layer_type,
    meaning_ko: row.meaning_ko,
    strength_ko: row.strength_ko,
    weakness_ko: row.weakness_ko,
    advice_ko: row.advice_ko,
  }));
}

export function getTenGodData(godCode: string) {
  const row = tenGodByCode.get(godCode);
  if (!row) return null;
  return {
    kor_name: row.kor_name,
    meaning_ko: row.meaning_ko,
    strength_ko: row.strength_ko,
    weakness_ko: row.weakness_ko,
    advice_ko: row.advice_ko,
    relationship_ko: row.relationship_ko,
  };
}

export function getTwelveStageData(stageCode: string) {
  const row = twelveStageByCode.get(stageCode);
  if (!row) return null;
  return {
    kor_name: row.kor_name,
    meaning_ko: row.meaning_ko,
    strength_ko: row.strength_ko,
    weakness_ko: row.weakness_ko,
    advice_ko: row.advice_ko,
    energy_level: row.energy_level,
  };
}

export function calculateTenGod(dayStem: string, targetStem: string): string {
  return tenGodRuleByKey.get(`${dayStem}:${targetStem}`) ?? "bigyeon";
}

export function calculateTwelveStage(
  dayStem: string,
  targetBranch: string,
): string {
  return twelveStageRuleByKey.get(`${dayStem}:${targetBranch}`) ?? "byeong";
}
