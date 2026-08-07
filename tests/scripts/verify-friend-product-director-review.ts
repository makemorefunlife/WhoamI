import { buildEnrichmentReviewPackage } from "../../lib/relationship/enrichment/buildEnrichmentReviewPackage";
import { CORPUS_CASES } from "../../lib/relationship/enrichment/corpusCases";
import { buildFriendReportViewModel } from "../../lib/relationship/friend/viewModel/buildFriendReportViewModel";
import type { FriendReportBody } from "../../lib/relationship/friend/buildFriendReport";

console.log("=== Comprehensive Friend Product Director Review Verification (Final Composition) ===");

// 1. Verify Corpus Case Labels
const EXPECTED_LABELS: Record<string, { ko: string; en: string }> = {
  strong: { ko: "조화가 많은 테스트 사례", en: "High Harmony Test Case" },
  mixed: { ko: "장점과 긴장이 섞인 테스트 사례", en: "Mixed Strengths & Tension Test Case" },
  weak: { ko: "주의점이 많은 테스트 사례", en: "High Caution Test Case" },
  reversed_ab: { ko: "A/B 방향 반전 검증", en: "A/B Direction Reversal Test Case" },
  unknown_hour: { ko: "출생시간 없음", en: "Birth Hour Unknown Test Case" },
  sparse_psych: { ko: "설문 데이터 부족", en: "Sparse Survey Data Test Case" },
  psych_saju_agree: { ko: "사주·설문 일치", en: "Saju & Psych Align Test Case" },
  psych_saju_conflict: { ko: "사주·설문 충돌", en: "Saju & Psych Conflict Test Case" },
};

for (const caseDef of CORPUS_CASES) {
  const expected = EXPECTED_LABELS[caseDef.id];
  if (!expected) {
    throw new Error(`Unexpected case id: ${caseDef.id}`);
  }
  if (caseDef.label_ko !== expected.ko || caseDef.label_en !== expected.en) {
    throw new Error(
      `Label mismatch for ${caseDef.id}: expected [${expected.ko} / ${expected.en}], got [${caseDef.label_ko} / ${caseDef.label_en}]`,
    );
  }
}
console.log("✓ Fixture case labels verified.");

// 2. Verify all cases for Friend domain
for (const caseDef of CORPUS_CASES) {
  for (const locale of ["ko-KR", "en-US"] as const) {
    const pkg = buildEnrichmentReviewPackage({
      domain: "friend",
      caseId: caseDef.id,
      locale,
    });

    const currentRep = pkg.current.report as FriendReportBody;
    const enrichedRep = pkg.current_enriched.report as FriendReportBody;

    const currentVm = buildFriendReportViewModel(currentRep, {
      viewerIsReportA: true,
      myName: pkg.case_meta.birth.nicknameA,
      partnerName: pkg.case_meta.birth.nicknameB,
      locale,
    });

    const enrichedVm = buildFriendReportViewModel(enrichedRep, {
      viewerIsReportA: true,
      myName: pkg.case_meta.birth.nicknameA,
      partnerName: pkg.case_meta.birth.nicknameB,
      locale,
    });

    // 1. Verify "우정 주파수 매칭" and "돈 계산" are REMOVED from enriched ViewModel
    const enrichedSectionTypes = enrichedVm.sections.map((s) => s.type);
    if (enrichedSectionTypes.includes("play_money")) {
      throw new Error(`play_money should be removed in ${caseDef.id} [${locale}]`);
    }
    if (enrichedSectionTypes.includes("psych_radar")) {
      throw new Error(`psych_radar should be removed in ${caseDef.id} [${locale}]`);
    }

    // 2. Verify "우정의 숨겨진 흐름" (hidden_flow) and "노는 코드" (soulmate) are PRESERVED
    if (!enrichedSectionTypes.includes("hidden_flow")) {
      throw new Error(`hidden_flow must be preserved in ${caseDef.id} [${locale}]`);
    }
    if (!enrichedSectionTypes.includes("soulmate")) {
      throw new Error(`soulmate must be preserved in ${caseDef.id} [${locale}]`);
    }

    // 3. Verify "실전 행동 처방전" (prescription) is RESTORED
    if (!enrichedSectionTypes.includes("prescription")) {
      throw new Error(`prescription must be restored in ${caseDef.id} [${locale}]`);
    }

    const prescriptionPack = enrichedRep.meta?.prescription_friendship;
    if (!prescriptionPack || prescriptionPack.schema_version !== "friend_prescription_v1") {
      throw new Error(`Invalid prescription pack schema in ${caseDef.id} [${locale}]`);
    }
    if (!Array.isArray(prescriptionPack.items) || prescriptionPack.items.length < 2) {
      throw new Error(`Prescription items missing or insufficient in ${caseDef.id} [${locale}]`);
    }

    for (const item of prescriptionPack.items) {
      if (!item.topic || !item.headline || !item.evidence || !item.do_list || !item.dont_list) {
        throw new Error(`Malformed prescription item in ${caseDef.id} [${locale}]: ${JSON.stringify(item)}`);
      }
    }

    // 4. Verify Directional Gifts (Q2, Q5) & Pair Emergence (Q17)
    const guardianA = enrichedRep.friend?.section_social_dna_a?.guardian_character;
    const guardianB = enrichedRep.friend?.section_social_dna_b?.guardian_character;
    if (!guardianA || !guardianA.label || !guardianA.description) {
      throw new Error(`Missing guardian_character A in ${caseDef.id} [${locale}]`);
    }
    if (!guardianB || !guardianB.label || !guardianB.description) {
      throw new Error(`Missing guardian_character B in ${caseDef.id} [${locale}]`);
    }

    // 5. Verify Q19 Group vs 1:1 Social Energy Dynamics
    const batteryA = enrichedRep.friend?.section_social_dna_a?.battery_description;
    const batteryB = enrichedRep.friend?.section_social_dna_b?.battery_description;
    if (!batteryA || batteryA.length < 15) {
      throw new Error(`Missing or short battery_description A in ${caseDef.id} [${locale}]`);
    }
    if (!batteryB || batteryB.length < 15) {
      throw new Error(`Missing or short battery_description B in ${caseDef.id} [${locale}]`);
    }

    // 6. Verify Q3 Situational Shine
    const shine = enrichedRep.friend?.section_snapshot?.shine_when_best;
    if (!shine || shine.length < 10) {
      throw new Error(`Missing or short shine_when_best in ${caseDef.id} [${locale}]`);
    }
  }
}

console.log("✓ All 16 Friend cases (8 cases × 2 locales) verified with 100% composition compliance!");
console.log("=== Verification Successful ===");
