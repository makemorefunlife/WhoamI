/**
 * Family wiring 마감용 — 실제 buildFamilyParentReport + ViewModel 출력을 한 번 생성해
 * 신규 필드가 런타임 경로에 붙는지 확인한다. (DB 삭제/일괄 재생성 없음)
 * Run: npx tsx tests/manual/verify-family-wiring-output.mjs
 */
import assert from "node:assert/strict";
import { buildFamilyParentReport } from "../../lib/relationship/familyParent/buildFamilyParentReport.ts";
import { buildFamilyReportViewModel } from "../../lib/relationship/familyParent/viewModel/buildFamilyReportViewModel.ts";
import {
  FAMILY_PARENT_CHILD_DEEP_FORMAT,
  isFamilyParentChildDeepReport,
} from "../../lib/prompts/relationshipPremium/familyParentChild/outputSchema.ts";
import { calculateSajuBundle } from "../../lib/v2/saju/calculateSajuBundle.ts";
import { toV1SajuApiPayload } from "../../lib/saju/toApiPayload.ts";

function sajuFromBirth(birthDate, birthTime = "12:00") {
  const bundle = calculateSajuBundle({ birthDate, birthTime });
  const payload = toV1SajuApiPayload(bundle);
  return {
    saju: payload.saju,
    dayStemData: payload.dayStemData,
    dayBranchData: payload.dayBranchData,
    hiddenStemsData: payload.hiddenStemsData,
    tenGods: payload.tenGods,
    twelveStageData: payload.twelveStageData,
    relations: payload.relations,
    shinsals: payload.shinsals,
  };
}

const report = buildFamilyParentReport({
  nicknameA: "아이",
  nicknameB: "엄마",
  roles: { roleA: "child", roleB: "mother" },
  parentType: "mother",
  sajuJsonA: sajuFromBirth("2014-05-15"),
  sajuJsonB: sajuFromBirth("1988-08-20"),
  locale: "ko-KR",
});

const fatherReport = buildFamilyParentReport({
  nicknameA: "아이",
  nicknameB: "아빠",
  roles: { roleA: "child", roleB: "father" },
  parentType: "father",
  sajuJsonA: sajuFromBirth("2014-05-15"),
  sajuJsonB: sajuFromBirth("1988-08-20"),
  locale: "ko-KR",
});

assert.ok(
  isFamilyParentChildDeepReport({
    format: FAMILY_PARENT_CHILD_DEEP_FORMAT,
    report,
  }),
);

const vm = buildFamilyReportViewModel(report, { locale: "ko-KR" });
const sectionTypes = vm.sections.map((s) => s.type);
const familyKeys = Object.keys(report.family ?? {});
const compareIds = (report.family.section_compare_table ?? []).map((r) => r.id);
const motherTitles = (report.family.section_compare_table ?? []).map((r) => r.label);
const fatherTitles = (fatherReport.family.section_compare_table ?? []).map((r) => r.label);

console.log(
  JSON.stringify(
    {
      ok: true,
      family_keys: familyKeys,
      compare_row_ids: compareIds,
      compare_row_count: compareIds.length,
      mother_compare_titles: motherTitles,
      father_compare_titles: fatherTitles,
      viewmodel_section_types: sectionTypes,
      meta_keys: Object.keys(report.meta ?? {}),
      has_section_child_dna: Boolean(report.family?.section_child_dna),
      has_section_growth_tunnel: Boolean(report.family?.section_growth_tunnel),
      has_section_destiny: Boolean(report.family?.section_destiny),
      has_section_filial_reward: Boolean(report.family?.section_filial_reward),
      has_section_de_escalation: Boolean(report.family?.section_de_escalation),
      has_section_compare_table: Boolean(report.family?.section_compare_table?.length),
      has_parent_lens_summary: Boolean(report.family?.parent_lens_summary),
    },
    null,
    2,
  ),
);
