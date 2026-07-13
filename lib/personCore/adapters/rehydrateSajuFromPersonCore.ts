import type { SajuDataForIntegrated } from "@/lib/report/formatEssenceAnalysisForIntegrated";
import { REF_HEAVENLY_STEMS } from "@/lib/hardcoded/sajuReferenceData";
import type { SajuChartProvenance } from "@/lib/saju/loadSajuBundleFromReport";
import { SAJU_ENGINE_VERSION } from "../schemaVersion";
import type { SajuMasterJson, SajuPillarSlot } from "../types/sajuMaster";

const SLOT_TO_PILLAR_KEY: Record<
  SajuPillarSlot,
  keyof NonNullable<SajuDataForIntegrated["saju"]>
> = {
  year: "yearPillar",
  month: "monthPillar",
  day: "dayPillar",
  hour: "hourPillar",
};

const SLOT_TO_LABEL: Record<SajuPillarSlot, string> = {
  year: "년주",
  month: "월주",
  day: "일주",
  hour: "시주",
};

function pillarHangulBySlot(master: SajuMasterJson, slot: SajuPillarSlot): string {
  return master.pillars.find((p) => p.slot === slot)?.pillar_hangul ?? "";
}

/** PersonCore 스냅샷 → 레거시 `SajuDataForIntegrated` (재계산 없음) */
export function rehydrateSajuDataForIntegrated(
  master: SajuMasterJson,
): SajuDataForIntegrated {
  const saju: NonNullable<SajuDataForIntegrated["saju"]> = {
    yearPillar: pillarHangulBySlot(master, "year"),
    monthPillar: pillarHangulBySlot(master, "month"),
    dayPillar: pillarHangulBySlot(master, "day"),
    hourPillar: pillarHangulBySlot(master, "hour"),
  };

  const dayStemRef = REF_HEAVENLY_STEMS.find(
    (r) => r.code === master.stem_focus.day_stem_code,
  );

  return {
    saju,
    dayStemData: {
      kor_name: master.stem_focus.day_stem_kor_name ?? dayStemRef?.kor_name,
      metaphor_ko: dayStemRef?.metaphor_ko ?? null,
    },
    dayBranchData: {
      kor_name: master.stem_focus.day_branch_hangul || undefined,
    },
    hiddenStemsData: master.hidden_stems.map((h) => ({
      stem_code: h.stem_code,
      meaning_ko: h.meaning_ko,
    })),
    tenGods: master.ten_gods.map((g) => ({
      pillar: SLOT_TO_LABEL[g.pillar_slot],
      godCode: g.god_code,
      godData: g.god_kor_name ? { kor_name: g.god_kor_name } : null,
    })),
    twelveStageData: (() => {
      const dayStage = master.twelve_stages.find((s) => s.pillar_slot === "day");
      if (!dayStage?.stage_kor_name) return null;
      return {
        kor_name: dayStage.stage_kor_name,
        meaning_ko: dayStage.meaning_ko ?? null,
      };
    })(),
    relations: master.relation_dynamics.map((r) => ({
      type: r.type,
      name: r.name,
      interpretation: r.interpretation,
    })),
    shinsals: master.shinsal_hits.map((s) => ({
      name_ko: s.name_ko,
      name_hanja: s.name_hanja,
      category: s.category,
      meaning_ko: s.meaning_ko,
    })),
  };
}

/** PersonCore 스냅샷 → 레거시 `SajuChartProvenance` */
export function rehydrateSajuProvenance(
  master: SajuMasterJson,
): SajuChartProvenance {
  const dayStemRef = REF_HEAVENLY_STEMS.find(
    (r) => r.code === master.stem_focus.day_stem_code,
  );

  return {
    birthDate: master.birth.birth_date,
    chartTime: master.birth.chart_time,
    birthTimeUnknown: master.birth.birth_time_unknown,
    pillars: {
      year: pillarHangulBySlot(master, "year"),
      month: pillarHangulBySlot(master, "month"),
      day: pillarHangulBySlot(master, "day"),
      hour: pillarHangulBySlot(master, "hour"),
    },
    dayStemCode: master.stem_focus.day_stem_code,
    dayStemKor: master.stem_focus.day_stem_kor_name ?? dayStemRef?.kor_name ?? "",
    dayStemMetaphor: dayStemRef?.metaphor_ko ?? "",
    engine: SAJU_ENGINE_VERSION,
    validationOk: master.validation.ok,
    validationNotes: master.validation.notes,
  };
}

export type LegacySajuInputsFromPersonCore = {
  sajuJson: SajuDataForIntegrated;
  provenance: SajuChartProvenance;
};

export function legacySajuInputsFromPersonCore(
  master: SajuMasterJson,
): LegacySajuInputsFromPersonCore {
  return {
    sajuJson: rehydrateSajuDataForIntegrated(master),
    provenance: rehydrateSajuProvenance(master),
  };
}
