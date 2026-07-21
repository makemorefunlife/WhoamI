import { REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import type { SajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import type { ChartContext } from "@/lib/saju/chartContext";
import { countElements } from "@/lib/saju/pairChartAnalysis";
import {
  isGuimun,
  isWonjin,
} from "@/lib/saju/workPairRiskSignals";
import { validateSajuPillars } from "@/lib/saju/validateSajuBundle";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";
import {
  estimateStrengthBalance,
  estimateYongsinGisin,
} from "@/lib/saju/strengthBalance";
import { extractDomainSajuSignals } from "../sajuSignals/extractDomainSajuSignals";
import {
  SAJU_ENGINE_VERSION,
  SAJU_MASTER_JSON_VERSION,
} from "../schemaVersion";
import type {
  HiddenStemEntry,
  JohuClimateSnapshot,
  RelationDynamicsEntry,
  SajuMasterJson,
  SajuMasterPillar,
  SajuPillarSlot,
  SajuShinsalHit,
  SajuSpecialSignalFlag,
  TenGodPillarEntry,
  TwelveStageEntry,
} from "../types/sajuMaster";

const PILLAR_META: {
  slot: SajuPillarSlot;
  label_ko: SajuMasterPillar["label_ko"];
  pillarKey: keyof SajuBundle["saju"];
}[] = [
  { slot: "year", label_ko: "년주", pillarKey: "yearPillar" },
  { slot: "month", label_ko: "월주", pillarKey: "monthPillar" },
  { slot: "day", label_ko: "일주", pillarKey: "dayPillar" },
  { slot: "hour", label_ko: "시주", pillarKey: "hourPillar" },
];

const SLOT_BY_PILLAR_NAME: Record<string, SajuPillarSlot> = {
  년주: "year",
  월주: "month",
  일주: "day",
  시주: "hour",
};

function stemHangulFromPillar(pillar: string): string {
  return pillar.trim().charAt(0) || "";
}

function branchHangulFromPillar(pillar: string): string {
  return pillar.trim().charAt(1) || "";
}

function stemKorName(stemCode: string): string | null {
  return REF_HEAVENLY_STEMS.find((r) => r.code === stemCode)?.kor_name ?? null;
}

function buildJohuClimate(chart: ChartContext): JohuClimateSnapshot {
  const el = countElements(chart);
  const wood = el.wood ?? 0;
  const fire = el.fire ?? 0;
  const earth = el.earth ?? 0;
  const metal = el.metal ?? 0;
  const water = el.water ?? 0;
  const cold = water + metal;
  const hot = fire + wood;
  const dry = earth + metal;
  const moist = water + wood;
  const heatDenom = hot + cold;
  const moistureDenom = dry + moist;

  const heat_score =
    heatDenom > 0 ? Math.round((hot / heatDenom) * 100) : 50;
  const moisture_score =
    moistureDenom > 0 ? Math.round((moist / moistureDenom) * 100) : 50;

  let temperature_band: JohuClimateSnapshot["temperature_band"] = "neutral";
  if (cold >= hot + 2) temperature_band = "cold";
  else if (hot >= cold + 2) temperature_band = "hot";

  let moisture_band: JohuClimateSnapshot["moisture_band"] = "neutral";
  if (dry >= moist + 2) moisture_band = "dry";
  else if (moist >= dry + 2) moisture_band = "moist";

  return {
    heat_score,
    moisture_score,
    temperature_band,
    moisture_band,
    element_counts: { wood, fire, earth, metal, water },
  };
}

function mapHiddenStems(
  rows: SajuBundle["hiddenStemsData"],
): HiddenStemEntry[] {
  return rows.map((row, order) => {
    const ref = REF_HEAVENLY_STEMS.find((r) => r.code === row.stem_code);
    return {
      stem_code: row.stem_code,
      stem_hangul: ref?.kor_name ?? null,
      meaning_ko: row.meaning_ko ?? null,
      order,
    };
  });
}

function detectIntraChartPairSignal(
  chart: ChartContext,
  matcher: (a: string, b: string) => boolean,
): string[] {
  const branches = [...chart.branchCodes];
  const evidence: string[] = [];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i]!;
      const b = branches[j]!;
      if (matcher(a, b)) evidence.push(`${a}-${b}`);
    }
  }
  return evidence;
}

function buildSpecialSignals(
  chart: ChartContext,
  shinsals: SajuBundle["shinsals"],
): SajuSpecialSignalFlag[] {
  const shinsalNames = new Set(shinsals.map((s) => s.name_ko));
  const wonjinEvidence = detectIntraChartPairSignal(chart, isWonjin);
  const guimunEvidence = detectIntraChartPairSignal(chart, isGuimun);

  if (shinsalNames.has("원진살")) {
    wonjinEvidence.push("shinsal:원진살");
  }

  return [
    {
      key: "dohwa",
      name_ko: "홍염살",
      possessed: shinsalNames.has("홍염살"),
      evidence: shinsalNames.has("홍염살") ? ["shinsal:홍염살"] : [],
    },
    {
      key: "yeokma",
      name_ko: "역마살",
      possessed: shinsalNames.has("역마살"),
      evidence: shinsalNames.has("역마살") ? ["shinsal:역마살"] : [],
    },
    {
      key: "wonjin",
      name_ko: "원진살",
      possessed: wonjinEvidence.length > 0,
      evidence: wonjinEvidence,
    },
    {
      key: "guimun",
      name_ko: "귀문관살",
      possessed: guimunEvidence.length > 0,
      evidence: guimunEvidence,
    },
  ];
}

function mapShinsalHits(shinsals: SajuBundle["shinsals"]): SajuShinsalHit[] {
  return shinsals.map((s) => ({
    name_ko: s.name_ko,
    name_hanja: s.name_hanja,
    category: s.category,
    possessed: true as const,
    meaning_ko: s.meaning_ko,
  }));
}

function mapTwelveStages(
  growthStages: SajuBundle["growthStages"],
): TwelveStageEntry[] {
  return growthStages.map((g) => {
    const slot = SLOT_BY_PILLAR_NAME[g.pillar] ?? "day";
    return {
      pillar_slot: slot,
      branch_code: "",
      stage_code: g.stageCode,
      stage_kor_name: g.stageData?.kor_name ?? null,
      meaning_ko: g.stageData?.meaning_ko ?? null,
    };
  });
}

function mapTenGods(tenGods: SajuBundle["tenGods"]): TenGodPillarEntry[] {
  return tenGods.map((g) => ({
    pillar_slot: SLOT_BY_PILLAR_NAME[g.pillar] ?? "day",
    god_code: g.godCode,
    god_kor_name: g.godData?.kor_name ?? null,
  }));
}

function mapRelationDynamics(
  relations: SajuBundle["relations"],
): RelationDynamicsEntry[] {
  return relations.map((r) => ({
    type: r.type,
    name: r.name,
    interpretation: r.interpretation,
    priority: r.priority,
    codes: [],
  }));
}

function buildPillars(bundle: SajuBundle, chart: ChartContext): SajuMasterPillar[] {
  return PILLAR_META.map(({ slot, label_ko, pillarKey }) => {
    const pillarHangul = bundle.saju[pillarKey];
    const chartPillar = chart.pillars.find((p) => p.name === label_ko);
    return {
      slot,
      label_ko,
      pillar_hangul: pillarHangul,
      stem_code: chartPillar?.stemCode ?? "",
      branch_code: chartPillar?.branchCode ?? "",
    };
  });
}

export function mapSajuBundleToMasterJson(params: {
  bundle: SajuBundle;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
}): SajuMasterJson {
  const { bundle, birthDate, birthTime, birthTimeUnknown } = params;
  const chart = bundle.chart;
  const pillars = {
    yearPillar: bundle.saju.yearPillar,
    monthPillar: bundle.saju.monthPillar,
    dayPillar: bundle.saju.dayPillar,
    hourPillar: bundle.saju.hourPillar,
  };
  const validation = validateSajuPillars(pillars, { birthTimeUnknown });
  const { chartTime } = resolveBirthTimeForCharts({
    birthTime,
    birthTimeUnknown,
  });

  const dayStemHangul = stemHangulFromPillar(pillars.dayPillar);
  const monthStemHangul = stemHangulFromPillar(pillars.monthPillar);
  const johu_climate = buildJohuClimate(chart);
  const strength_balance = estimateStrengthBalance(chart);
  const yongsin_estimate = estimateYongsinGisin(chart);

  return {
    schema_version: SAJU_MASTER_JSON_VERSION,
    engine_version: SAJU_ENGINE_VERSION,
    birth: {
      birth_date: birthDate,
      chart_time: chartTime,
      birth_time_unknown: birthTimeUnknown,
    },
    pillars: buildPillars(bundle, chart),
    stem_focus: {
      day_stem_code: chart.dayStemCode,
      day_stem_hangul: dayStemHangul,
      day_stem_kor_name: stemKorName(chart.dayStemCode),
      month_stem_code: chart.monthStemCode,
      month_stem_hangul: monthStemHangul,
      month_stem_kor_name: stemKorName(chart.monthStemCode),
      day_branch_code: chart.dayBranchCode,
      day_branch_hangul: branchHangulFromPillar(pillars.dayPillar),
    },
    johu_climate,
    strength_balance,
    yongsin_estimate,
    hidden_stems: mapHiddenStems(bundle.hiddenStemsData),
    special_signals: buildSpecialSignals(chart, bundle.shinsals),
    shinsal_hits: mapShinsalHits(bundle.shinsals),
    twelve_stages: mapTwelveStages(bundle.growthStages),
    ten_gods: mapTenGods(bundle.tenGods),
    relation_dynamics: mapRelationDynamics(bundle.relations),
    domain_signals: extractDomainSajuSignals(bundle, johu_climate),
    validation: {
      ok: validation.ok,
      notes: validation.notes,
    },
  };
}
