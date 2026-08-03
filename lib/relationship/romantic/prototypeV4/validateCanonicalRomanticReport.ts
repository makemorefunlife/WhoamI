/**
 * Structural validators for canonical Romantic V4 report.
 */
import type { CanonicalRelationshipStoryPlan } from "./canonicalStoryPlanTypes";
import type { CanonicalSection } from "./composeCanonicalSectionNarratives";

export type CanonicalValidationIssue = {
  code: string;
  severity: "error" | "warning";
  message: string;
  chapterId?: string;
};

const INTERNAL_LEAK =
  /\b(personal_ce_v1|pair_ce_v1|ce\.individual|sourceKind|ch2_|a_to_b|b_to_a|schema_version)\b/;

const DIAGNOSIS =
  /(애착\s*유형|트라우마|성격\s*장애|가스라이팅\s*확정|외도\s*확정)/;

const DETERMINISTIC_FUTURE =
  /(반드시\s*(이별|결혼|성공)|운명적으로\s*헤어|절대\s*안\s*맞)/;

export function validateCanonicalRomanticReport(params: {
  plan: CanonicalRelationshipStoryPlan;
  sections: CanonicalSection[];
}): { ok: boolean; issues: CanonicalValidationIssue[] } {
  const { plan, sections } = params;
  const issues: CanonicalValidationIssue[] = [];

  const visible = sections.filter((s) => s.visible);

  // bilateral attraction
  const attr = visible.find((s) => s.chapterId === "c2_attraction");
  if (attr) {
    const hasA = attr.blocks.some((b) => b.blockId === "attr.a");
    const hasB = attr.blocks.some((b) => b.blockId === "attr.b");
    if (!hasA || !hasB) {
      issues.push({
        code: "missing_bilateral_attraction",
        severity: "error",
        message: "끌림 설명이 양방향이 아닙니다.",
        chapterId: "c2_attraction",
      });
    }
  }

  // bilateral misread
  const mis = visible.find((s) => s.chapterId === "c5_misunderstanding");
  if (mis) {
    const dirs = mis.blocks.filter((b) => b.blockId.startsWith("misread."));
    if (dirs.length < 2) {
      issues.push({
        code: "missing_bilateral_misread",
        severity: "error",
        message: "오해 번역이 양방향이 아닙니다.",
        chapterId: "c5_misunderstanding",
      });
    }
  }

  // repair not one-sided
  const repair = visible.find((s) => s.chapterId === "c7_repair");
  if (repair) {
    const helpsA = repair.blocks.some((b) => b.blockId === "repair.helpsA");
    const helpsB = repair.blocks.some((b) => b.blockId === "repair.helpsB");
    if (!helpsA || !helpsB) {
      issues.push({
        code: "one_sided_accommodation",
        severity: "error",
        message: "회복 조언이 한쪽에만 있습니다.",
        chapterId: "c7_repair",
      });
    }
  }

  // timing hidden when unavailable
  const timing = sections.find((s) => s.chapterId === "c10_future_timing");
  if (timing?.visible && !plan.timing.available) {
    issues.push({
      code: "unsupported_timing_claim",
      severity: "error",
      message: "timing evidence 없이 연도 흐름이 노출되었습니다.",
      chapterId: "c10_future_timing",
    });
  }
  if (!plan.timing.available && timing?.visible === false) {
    // ok
  }

  // axis priority (not all equal length narrative)
  const why = visible.find((s) => s.chapterId === "c5_misunderstanding");
  if (why) {
    const diffBlocks = why.blocks.filter((b) => b.blockId.startsWith("axis.diff."));
    if (diffBlocks.length > 4) {
      issues.push({
        code: "axis_priority_missing",
        severity: "warning",
        message: "차이 축 서술이 과도합니다. 상위 3개 우선을 권장합니다.",
        chapterId: "c5_misunderstanding",
      });
    }
  }

  // text scans
  for (const section of visible) {
    for (const block of section.blocks) {
      if (INTERNAL_LEAK.test(block.body) || INTERNAL_LEAK.test(block.title)) {
        issues.push({
          code: "internal_flag_leakage",
          severity: "error",
          message: `내부 키 노출: ${block.blockId}`,
          chapterId: section.chapterId,
        });
      }
      if (DIAGNOSIS.test(block.body)) {
        issues.push({
          code: "unsupported_diagnosis",
          severity: "error",
          message: `진단형 표현: ${block.blockId}`,
          chapterId: section.chapterId,
        });
      }
      if (DETERMINISTIC_FUTURE.test(block.body)) {
        issues.push({
          code: "deterministic_prediction",
          severity: "error",
          message: `단정 예측: ${block.blockId}`,
          chapterId: section.chapterId,
        });
      }
      if (block.body.includes("운명적으로 서로 보완한다") || block.body === "서로 보완한다") {
        issues.push({
          code: "generic_filler",
          severity: "warning",
          message: `일반론 보완 문장: ${block.blockId}`,
          chapterId: section.chapterId,
        });
      }
    }
  }

  // strength/vuln both present in c8
  const sv = visible.find((s) => s.chapterId === "c8_strength_vulnerability");
  if (sv) {
    const hasGift = sv.blocks.some((b) => b.blockId.startsWith("gift."));
    if (!hasGift) {
      issues.push({
        code: "missing_duality",
        severity: "error",
        message: "강점/취약 양면이 불완전합니다.",
        chapterId: "c8_strength_vulnerability",
      });
    }
  }

  // connected evidence should be non-empty for complete report
  if (plan.connectedEvidenceIds.length < 5) {
    issues.push({
      code: "thin_evidence",
      severity: "warning",
      message: "연결된 evidence가 너무 적습니다.",
    });
  }

  const ok = !issues.some((i) => i.severity === "error");
  return { ok, issues };
}
