import type { SajuBundle } from "@/lib/v2/saju/calculateSajuBundle";
import type { ChartContext } from "@/lib/saju/chartContext";
import {
  ELEMENT_GENERATES,
  ELEMENT_OVERCOMES,
  branchElement,
  countElements,
  stemElement,
} from "@/lib/saju/elements";
import {
  calculateTenGod,
  calculateTwelveStage,
  getHiddenStemsData,
} from "@/lib/saju/repository";
import { validateSajuPillars } from "@/lib/saju/validateSajuBundle";
import { isGuimun, isWonjin } from "@/lib/saju/workPairRiskSignals";
import { resolveBirthTimeForCharts } from "@/lib/v2/onboarding/resolveBirthChartInput";
import { buildJohuClimate } from "../mappers/mapSajuMasterJson";
import { buildBirthFingerprintPart } from "../utils/fingerprint";
import { buildIntraRelations } from "./buildRelations";
import {
  BRANCH_TEN_GOD_METHOD,
  FAVORABLE_ELEMENTS_METHOD,
  HIDDEN_ELEMENT_WEIGHTING_METHOD,
  HIDDEN_ELEMENT_WEIGHTS,
  INDIVIDUAL_SAJU_CHART_VERSION,
  INDIVIDUAL_SAJU_ENGINE_ID,
  JOHU_METHOD,
  MANSERYEOK_PACKAGE,
  NOBLE_NAME_TO_ID,
  ROOTEDNESS_METHOD,
  SEASONAL_STRENGTH_METHOD,
  STRONG_TWELVE_STAGE_CODES,
  STRENGTH_MARGIN,
  STRENGTH_METHOD,
  type NobleStarId,
} from "./constants";
import { buildGongmangFact } from "./gongmang";
import { computeRefDataFingerprint } from "./refFingerprint";
import {
  findShinsalNumericId,
  hiddenStemReferenceId,
  shinsalReferenceId,
  shinsalSlug,
  toBranchRef,
  toStemRef,
  toTenGodRef,
  toTwelveStageRef,
} from "./refIds";
import type {
  ElementCode,
  ElementCounts,
  EvidenceRef,
  FavorableElementsFact,
  HiddenStemFact,
  IndividualSajuChart,
  NobleIndex,
  PillarFact,
  PillarSlot,
  RootednessFact,
  SeasonalStrengthFact,
  SpecialSignalFact,
  StrengthFact,
} from "./types";

const PILLAR_META: {
  slot: PillarSlot;
  label_ko: PillarFact["label_ko"];
  pillarKey: keyof SajuBundle["saju"];
}[] = [
  { slot: "year", label_ko: "년주", pillarKey: "yearPillar" },
  { slot: "month", label_ko: "월주", pillarKey: "monthPillar" },
  { slot: "day", label_ko: "일주", pillarKey: "dayPillar" },
  { slot: "hour", label_ko: "시주", pillarKey: "hourPillar" },
];

const EMPTY_COUNTS = (): ElementCounts => ({
  wood: 0,
  fire: 0,
  earth: 0,
  metal: 0,
  water: 0,
});

function dominantWeakest(counts: ElementCounts): {
  dominant: ElementCode;
  weakest: ElementCode;
} {
  const entries = Object.entries(counts) as [ElementCode, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const dominant = entries[0]?.[0] ?? "earth";
  entries.sort((a, b) => a[1] - b[1]);
  const weakest = entries[0]?.[0] ?? "earth";
  return { dominant, weakest };
}

function mainHiddenStemCode(branchCode: string): string | null {
  const rows = getHiddenStemsData(branchCode);
  const main = rows.find((r) => r.layer_type === "main");
  return main?.stem_code ?? rows[rows.length - 1]?.stem_code ?? null;
}

function buildHiddenStemsForPillar(
  slot: PillarSlot,
  branchCode: string,
  dayStem: string,
): HiddenStemFact[] {
  return getHiddenStemsData(branchCode).map((row, order) => {
    const stem = toStemRef(row.stem_code);
    const godCode = calculateTenGod(dayStem, row.stem_code);
    return {
      pillar_slot: slot,
      branch_code: branchCode,
      order,
      layer_type: row.layer_type,
      stem,
      ten_god: toTenGodRef(godCode),
      reference_id: hiddenStemReferenceId(
        branchCode,
        row.stem_code,
        row.layer_type,
      ),
    };
  });
}

function buildPillars(bundle: SajuBundle, chart: ChartContext): PillarFact[] {
  const dayStem = chart.dayStemCode;
  return PILLAR_META.map(({ slot, label_ko, pillarKey }) => {
    const chartPillar = chart.pillars.find((p) => p.name === label_ko)!;
    const stemCode = chartPillar.stemCode;
    const branchCode = chartPillar.branchCode;
    const stemGod = calculateTenGod(dayStem, stemCode);
    const mainStem = mainHiddenStemCode(branchCode) ?? stemCode;
    const branchGod = calculateTenGod(dayStem, mainStem);
    const stageCode = calculateTwelveStage(dayStem, branchCode);
    const stage = toTwelveStageRef(stageCode);

    return {
      slot,
      label_ko,
      pillar_hangul: bundle.saju[pillarKey],
      stem: toStemRef(stemCode),
      branch: toBranchRef(branchCode),
      stem_ten_god: toTenGodRef(stemGod),
      branch_ten_god: toTenGodRef(branchGod),
      branch_ten_god_method: BRANCH_TEN_GOD_METHOD,
      twelve_stage: { ...stage, branch_code: branchCode },
      hidden_stems: buildHiddenStemsForPillar(slot, branchCode, dayStem),
    };
  });
}

function buildFiveElements(
  chart: ChartContext,
  pillars: PillarFact[],
): IndividualSajuChart["five_elements"] {
  const surface = countElements(chart) as ElementCounts;
  const withHidden = EMPTY_COUNTS();
  for (const el of Object.keys(surface) as ElementCode[]) {
    withHidden[el] = surface[el] ?? 0;
  }
  for (const p of pillars) {
    for (const h of p.hidden_stems) {
      const w =
        HIDDEN_ELEMENT_WEIGHTS[
          h.layer_type as keyof typeof HIDDEN_ELEMENT_WEIGHTS
        ] ?? 0.25;
      const el = h.stem.element;
      withHidden[el] = (withHidden[el] ?? 0) + w;
    }
  }
  const { dominant, weakest } = dominantWeakest(surface);
  return {
    surface_counts: {
      wood: surface.wood ?? 0,
      fire: surface.fire ?? 0,
      earth: surface.earth ?? 0,
      metal: surface.metal ?? 0,
      water: surface.water ?? 0,
    },
    with_hidden_counts: withHidden,
    weighting_method: HIDDEN_ELEMENT_WEIGHTING_METHOD,
    dominant,
    weakest,
    confidence: "deterministic",
    evidence: [
      {
        kind: "count",
        codes: Object.entries(surface).map(([k, v]) => `${k}:${v}`),
        detail: "surface_eight_characters",
      },
    ],
  };
}

function buildStrength(chart: ChartContext): StrengthFact {
  const dayEl = (stemElement.get(chart.dayStemCode) ?? "earth") as ElementCode;
  const counts = countElements(chart);
  const resource = Object.entries(ELEMENT_GENERATES).find(
    ([, v]) => v === dayEl,
  )?.[0];
  const peer = dayEl;
  const output = ELEMENT_GENERATES[dayEl];
  const control = Object.entries(ELEMENT_OVERCOMES).find(
    ([, v]) => v === dayEl,
  )?.[0];

  const support = (counts[peer] ?? 0) + (counts[resource ?? ""] ?? 0);
  const drain =
    (counts[output ?? ""] ?? 0) + (counts[control ?? ""] ?? 0) * 1.2;

  let label_code: StrengthFact["label_code"] = "balanced";
  let label_token: StrengthFact["label_token"] = "jung_hwa";
  if (support >= drain + STRENGTH_MARGIN) {
    label_code = "strong";
    label_token = "shin_gang";
  } else if (drain >= support + STRENGTH_MARGIN) {
    label_code = "weak";
    label_token = "shin_yak";
  }

  return {
    label_code,
    label_token,
    support_score: support,
    drain_score: Math.round(drain * 10) / 10,
    margin_used: STRENGTH_MARGIN,
    method: STRENGTH_METHOD,
    engine_version: INDIVIDUAL_SAJU_ENGINE_ID,
    confidence: "heuristic",
    evidence: [
      {
        kind: "count",
        codes: [
          `day_el:${dayEl}`,
          `support:${support}`,
          `drain:${drain}`,
        ],
        detail: STRENGTH_METHOD,
      },
    ],
  };
}

function buildRootedness(
  chart: ChartContext,
  pillars: PillarFact[],
): RootednessFact {
  const dayStem = chart.dayStemCode;
  const root_hits: RootednessFact["root_hits"] = [];
  for (const p of pillars) {
    for (const h of p.hidden_stems) {
      if (h.stem.code === dayStem) {
        root_hits.push({
          pillar_slot: p.slot,
          branch_code: p.branch.code,
          hidden_stem_code: h.stem.code,
          layer_type: h.layer_type,
        });
      }
    }
  }
  const strongSet = new Set<string>(STRONG_TWELVE_STAGE_CODES);
  const strong_stage_slots = pillars
    .filter((p) => strongSet.has(p.twelve_stage.code))
    .map((p) => p.slot);

  const dayRooted = root_hits.some((h) => h.pillar_slot === "day");
  const rootedness_index = Math.min(
    100,
    root_hits.length * 25 + strong_stage_slots.length * 15,
  );

  return {
    day_stem_rooted_in_day_branch: dayRooted,
    root_hits,
    strong_stage_slots,
    rootedness_index,
    method: ROOTEDNESS_METHOD,
    engine_version: INDIVIDUAL_SAJU_ENGINE_ID,
    confidence: "high",
    evidence: [
      {
        kind: "hidden_stem",
        codes: root_hits.map(
          (h) => `${h.pillar_slot}:${h.hidden_stem_code}`,
        ),
        detail: ROOTEDNESS_METHOD,
      },
    ],
  };
}

function buildSeasonalStrength(chart: ChartContext): SeasonalStrengthFact {
  const monthBranch = toBranchRef(chart.monthBranchCode);
  const dayEl = (stemElement.get(chart.dayStemCode) ?? "earth") as ElementCode;
  const monthEl = (branchElement.get(chart.monthBranchCode) ??
    "earth") as ElementCode;

  const resource = Object.entries(ELEMENT_GENERATES).find(
    ([, v]) => v === dayEl,
  )?.[0];
  // 득령: 월지 오행 = 일간 오행 또는 인성(resource)
  const inSeason = monthEl === dayEl || monthEl === resource;
  const seasonScore =
    monthEl === dayEl ? 100 : monthEl === resource ? 70 : 30;

  return {
    month_branch_code: chart.monthBranchCode,
    season: monthBranch.season,
    in_season: inSeason,
    season_score: seasonScore,
    method: SEASONAL_STRENGTH_METHOD,
    engine_version: INDIVIDUAL_SAJU_ENGINE_ID,
    confidence: "heuristic",
    evidence: [
      {
        kind: "branch",
        pillar_slot: "month",
        codes: [chart.monthBranchCode, monthEl, dayEl],
        detail: SEASONAL_STRENGTH_METHOD,
      },
    ],
  };
}

function buildFavorableElements(chart: ChartContext): FavorableElementsFact {
  const counts = countElements(chart) as ElementCounts;
  const sorted = (Object.entries(counts) as [ElementCode, number][]).sort(
    (a, b) => a[1] - b[1],
  );
  const weakest = sorted[0]![0];
  const strongest = sorted[sorted.length - 1]![0];
  // 희신: 용신을 생하는 오행
  const resourceOfYong = Object.entries(ELEMENT_GENERATES).find(
    ([, v]) => v === weakest,
  )?.[0] as ElementCode | undefined;

  return {
    yongsin: [weakest],
    huisin: resourceOfYong ? [resourceOfYong] : [],
    gisin: [strongest],
    method: FAVORABLE_ELEMENTS_METHOD,
    engine_version: INDIVIDUAL_SAJU_ENGINE_ID,
    confidence: "low",
    evidence: [
      {
        kind: "count",
        codes: [`weak:${weakest}`, `strong:${strongest}`],
        detail: FAVORABLE_ELEMENTS_METHOD,
      },
    ],
  };
}

function buildSpecialSignals(
  chart: ChartContext,
  shinsalSlugs: Set<string>,
): SpecialSignalFact[] {
  const branches = [...chart.branchCodes];
  const wonjinEvidence: EvidenceRef[] = [];
  const guimunEvidence: EvidenceRef[] = [];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i]!;
      const b = branches[j]!;
      if (isWonjin(a, b)) {
        wonjinEvidence.push({
          kind: "relation",
          codes: [a, b],
          detail: "wonjin_pair",
        });
      }
      if (isGuimun(a, b)) {
        guimunEvidence.push({
          kind: "relation",
          codes: [a, b],
          detail: "guimun_pair",
        });
      }
    }
  }
  if (shinsalSlugs.has("원진살")) {
    wonjinEvidence.push({
      kind: "shinsal",
      codes: ["원진살"],
      detail: "shinsal:원진살",
    });
  }

  const dohwaEvidence: EvidenceRef[] = [];
  if (shinsalSlugs.has("홍염살")) {
    dohwaEvidence.push({
      kind: "shinsal",
      codes: ["홍염살"],
      detail: "shinsal:홍염살",
    });
  }
  if (shinsalSlugs.has("함지살")) {
    dohwaEvidence.push({
      kind: "shinsal",
      codes: ["함지살"],
      detail: "shinsal:함지살",
    });
  }

  return [
    {
      signal_id: "dohwa",
      possessed: dohwaEvidence.length > 0,
      evidence: dohwaEvidence,
    },
    {
      signal_id: "yeokma",
      possessed: shinsalSlugs.has("역마살"),
      evidence: shinsalSlugs.has("역마살")
        ? [{ kind: "shinsal", codes: ["역마살"], detail: "shinsal:역마살" }]
        : [],
    },
    {
      signal_id: "wonjin",
      possessed: wonjinEvidence.length > 0,
      evidence: wonjinEvidence,
    },
    {
      signal_id: "guimun",
      possessed: guimunEvidence.length > 0,
      evidence: guimunEvidence,
    },
  ];
}

function buildNobles(shinsalNames: string[]): NobleIndex {
  const base = {
    cheoneul_guin: false,
    munchang_guin: false,
    hakdang_guin: false,
    woldeok_guin: false,
    cheondeok_guin: false,
    taegeuk_guin: false,
    jaego_guin: false,
    cheonnok_guin: false,
    noble_hits: [] as NobleStarId[],
  };
  for (const name of shinsalNames) {
    const id = NOBLE_NAME_TO_ID[name];
    if (!id) continue;
    base[id] = true;
    if (!base.noble_hits.includes(id)) base.noble_hits.push(id);
  }
  return base;
}

export type BuildIndividualSajuChartInput = {
  reportId: string;
  birthDate: string;
  birthTime: string | null;
  birthTimeUnknown: boolean;
  bundle: SajuBundle;
  /** Optional override; default = birth-only fingerprint part hashed externally by caller. */
  inputFingerprint?: string;
  builtAt?: string;
};

/**
 * Pure-fact Individual Saju SSOT from a calculated SajuBundle.
 * Does not persist — caller upserts.
 */
export function buildIndividualSajuChart(
  input: BuildIndividualSajuChartInput,
): IndividualSajuChart {
  const {
    reportId,
    birthDate,
    birthTime,
    birthTimeUnknown,
    bundle,
  } = input;
  const chart = bundle.chart;
  const { chartTime } = resolveBirthTimeForCharts({
    birthTime,
    birthTimeUnknown,
  });

  const pillars = buildPillars(bundle, chart);
  const dayStem = toStemRef(chart.dayStemCode);
  const dayBranch = toBranchRef(chart.dayBranchCode);

  const johuClimate = buildJohuClimate(chart);
  const johu: IndividualSajuChart["johu"] = {
    heat_score: johuClimate.heat_score,
    moisture_score: johuClimate.moisture_score,
    temperature_band: johuClimate.temperature_band,
    moisture_band: johuClimate.moisture_band,
    method: JOHU_METHOD,
    confidence: "heuristic",
    evidence: [
      {
        kind: "count",
        codes: Object.entries(johuClimate.element_counts).map(
          ([k, v]) => `${k}:${v}`,
        ),
        detail: JOHU_METHOD,
      },
    ],
  };

  const shinsalNames = bundle.shinsals.map((s) => s.name_ko);
  const shinsalNameSet = new Set(shinsalNames);

  const shinsal_hits = bundle.shinsals.map((s) => {
    const numericId = findShinsalNumericId(s.name_ko);
    return {
      reference_id: shinsalReferenceId(numericId ?? shinsalSlug(s.name_ko)),
      slug: shinsalSlug(s.name_ko),
      category: s.category,
      possessed: true as const,
      hit_codes: [],
      evidence: [
        {
          kind: "shinsal" as const,
          codes: [s.name_ko],
          detail: `matched:${s.name_ko}`,
        },
      ],
    };
  });

  const validation = validateSajuPillars(
    {
      yearPillar: bundle.saju.yearPillar,
      monthPillar: bundle.saju.monthPillar,
      dayPillar: bundle.saju.dayPillar,
      hourPillar: bundle.saju.hourPillar,
    },
    { birthTimeUnknown },
  );

  const birthFp = buildBirthFingerprintPart({
    birth_date: birthDate,
    birth_time: birthTime,
    birth_time_unknown: birthTimeUnknown,
  });
  const input_fingerprint = input.inputFingerprint ?? birthFp;

  return {
    engine: {
      schema_version: INDIVIDUAL_SAJU_CHART_VERSION,
      engine_id: INDIVIDUAL_SAJU_ENGINE_ID,
      manseryeok_package: MANSERYEOK_PACKAGE,
      ref_data_fingerprint: computeRefDataFingerprint(),
      built_at: input.builtAt ?? new Date().toISOString(),
      input_fingerprint,
    },
    birth: {
      report_id: reportId,
      birth_date: birthDate,
      birth_time_raw: birthTime,
      chart_time: chartTime,
      birth_time_unknown: birthTimeUnknown,
    },
    calendar: {
      input_calendar: "gregorian",
      birth_local_date: birthDate,
      birth_local_time: chartTime,
      birth_time_unknown: birthTimeUnknown,
      lunar_date: null,
      solar_term: null,
      true_solar_time: null,
      timezone_offset_hours: null,
      place_affects_saju: false,
      notes: birthTimeUnknown
        ? ["birth_time_unknown_fallback_12:00"]
        : [],
    },
    pillars,
    day_master: {
      stem: dayStem,
      day_branch: dayBranch,
      day_pillar_hangul: bundle.saju.dayPillar,
      element: dayStem.element,
      yin_yang: dayStem.yin_yang,
    },
    five_elements: buildFiveElements(chart, pillars),
    johu,
    strength: buildStrength(chart),
    rootedness: buildRootedness(chart, pillars),
    seasonal_strength: buildSeasonalStrength(chart),
    favorable_elements: buildFavorableElements(chart),
    relations_intra: buildIntraRelations(chart),
    gongmang: buildGongmangFact(chart),
    shinsal_hits,
    nobles: buildNobles(shinsalNames),
    special_signals: buildSpecialSignals(chart, shinsalNameSet),
    luck_cycles: {
      gender_assumed: null,
      direction: null,
      major_cycles: [],
      method: "not_computed",
      computed: false,
      confidence: "heuristic",
      notes: ["luck_cycles deferred to later batch"],
    },
    validation: {
      ok: validation.ok,
      notes: validation.notes,
      checks: [
        {
          code: "pillars_present",
          ok: Boolean(bundle.saju.dayPillar),
          detail: "day_pillar_required",
        },
        {
          code: "validation_bundle",
          ok: validation.ok,
          detail: validation.notes.join(";") || "ok",
        },
      ],
    },
  };
}
