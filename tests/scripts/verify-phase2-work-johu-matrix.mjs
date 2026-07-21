/**
 * Phase 2 (Work) 검증 스크립트 — 오피스 캐릭터 타이틀이 조후(temperature_band)에
 * 따라 사양서 표대로 실제로 달라지는지, 카테고리(월지십성) 판정은 그대로인지 확인.
 * 실행: npx tsx tests/scripts/verify-phase2-work-johu-matrix.mjs
 */
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { buildOfficeDnaProfile } from "../../lib/relationship/workColleague/officeLanguage.ts";

function toSajuJson(bundle) {
  return {
    saju: bundle.saju,
    dayStemData: bundle.dayStemData,
    dayBranchData: bundle.dayBranchData,
    hiddenStemsData: bundle.hiddenStemsData,
    tenGods: bundle.tenGods,
    relations: bundle.relations,
    shinsals: bundle.shinsals,
  };
}

function tenGodCounts(bundle) {
  const counts = {};
  for (const t of bundle.tenGods) {
    if (t.pillar === "일주") continue;
    const name = t.godData?.kor_name ?? t.godCode ?? "";
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

const bundle = calculateSajuBundle({ birthDate: "1990-05-15", birthTime: "14:30" });
const sajuJson = toSajuJson(bundle);
const counts = tenGodCounts(bundle);

// 카테고리(월지십성)는 고정해서, temperature_band만 바꿨을 때 타이틀이 달라지는지 확인.
// resolveWorkCategory는 workSignals.month_geokguk.month_stem_category를 우선 쓰므로,
// 실제 chart에서 나온 카테고리를 그대로 재사용한다.
const monthGod = bundle.tenGods.find((t) => t.pillar === "월주");
const monthGodKo = monthGod?.godData?.kor_name ?? "";
const category = monthGodKo.includes("관")
  ? "officer"
  : monthGodKo.includes("재")
    ? "wealth"
    : monthGodKo.includes("식") || monthGodKo.includes("상관")
      ? "food"
      : monthGodKo.includes("인")
        ? "seal"
        : "self";

function fabricateWorkSignals(temperature_band) {
  return {
    month_geokguk: {
      month_stem_ten_god_ko: monthGodKo,
      month_stem_category: category,
      geokguk_label_ko: "",
      month_branch_element: "earth",
      day_master_element_support: false,
    },
    drive_stubborn: {
      food_count: 0,
      self_count: 0,
      food_intensity: 0,
      self_intensity: 0,
      drive_band: "balanced",
      stubborn_band: "balanced",
    },
    literary_noble: {
      has_munchang_guin: false,
      has_jangseong_sal: false,
      has_cheoneul_guin: false,
      noble_star_hits: [],
      work_support_index: 0,
    },
    johu_profile: {
      heat_score: temperature_band === "hot" ? 90 : temperature_band === "cold" ? 10 : 50,
      moisture_score: 50,
      temperature_band,
      dominant_element: "earth",
    },
  };
}

console.log("=== category (월지십성, 고정):", category, "===\n");

for (const band of ["cold", "neutral", "hot"]) {
  const workSignals = fabricateWorkSignals(band);
  const dna = buildOfficeDnaProfile(sajuJson, counts, "ko-KR", workSignals);
  const dnaEn = buildOfficeDnaProfile(sajuJson, counts, "en-US", workSignals);
  console.log(`[${band}] ko: ${dna.character_title}`);
  console.log(`[${band}] en: ${dnaEn.character_title}`);
}

console.log("\n=== workSignals 없이 호출(폴백 경로, 레거시 캐시 시뮬레이션) ===");
const dnaNoSignals = buildOfficeDnaProfile(sajuJson, counts, "ko-KR");
console.log("no workSignals ->", dnaNoSignals.character_title);
