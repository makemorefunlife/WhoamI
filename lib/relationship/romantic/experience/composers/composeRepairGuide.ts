/**
 * M9 Repair Guide — deterministic composer.
 * Ordered recovery sequence from canonical signals; omits unsupported steps.
 * Does not invent meant/heard, intent, attachment, or future outcomes.
 * Does not copy M8 preventive prescription text verbatim.
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import {
  formatRomanticCompareLeanLabel,
  readRomanticComparisonTableCanonicalProjection,
} from "@/lib/relationship/romantic/romanticComparisonTableCanonical";
import { readRomanticExpressionSpeedCanonicalProjection } from "@/lib/relationship/romantic/romanticExpressionSpeedCanonical";
import { readRomanticRecoveryCanonicalProjection } from "@/lib/relationship/romantic/romanticRecoverySpeedCanonical";
import { readRomanticReassuranceCanonicalProjection } from "@/lib/relationship/romantic/romanticReassuranceCanonical";
import { readRomanticResidualCanonicalProjection } from "@/lib/relationship/romantic/romanticResidualCanonical";
import type {
  ConfidenceLevel,
  EvidenceRef,
  RepairGuideVM,
  RepairStageId,
  RepairStageVM,
} from "../romanticExperienceTypes";
import { emptyRepairGuide } from "../projectors/_empty";

export type ComposeRepairGuideInput = {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
  myName: string;
  partnerName: string;
  viewerIsReportA: boolean;
  locale?: string;
  /** M8 preventive lines to avoid repeating verbatim. */
  preventiveTexts?: string[];
};

const STAGE_ORDER: RepairStageId[] = [
  "pause",
  "re_entry",
  "acknowledgement",
  "clarification",
  "reassurance",
  "closure",
];

const STAGE_TITLE: Record<RepairStageId, string> = {
  pause: "멈춤",
  re_entry: "재진입",
  acknowledgement: "인정",
  clarification: "정리",
  reassurance: "안심",
  closure: "마무리",
};

function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function clashesWithPreventive(text: string, preventive: string[]): boolean {
  const n = norm(text);
  return preventive.some((p) => {
    const pn = norm(p);
    return pn && (n === pn || (pn.length > 12 && n.includes(pn)));
  });
}

function viewerRole(
  viewerIsReportA: boolean,
  side: "A" | "B",
): "me" | "partner" {
  if (viewerIsReportA) return side === "A" ? "me" : "partner";
  return side === "A" ? "partner" : "me";
}

function pickReconnectSpeakable(
  report: RomanticSajuDeepReport["report"],
  preventive: string[],
): string | null {
  const s3 = (report.section_3_conversation_patterns ?? {}) as Record<
    string,
    unknown
  >;
  const conflict = s3.conflict_situation as
    | { dialogue_table?: Array<Record<string, unknown>> }
    | undefined;
  const rows = Array.isArray(conflict?.dialogue_table)
    ? conflict!.dialogue_table!
    : [];
  for (const row of rows) {
    const good =
      typeof row.good_line === "string" ? row.good_line.trim() : "";
    if (good && !clashesWithPreventive(good, preventive)) return good;
  }
  return null;
}

/**
 * Compose ordered repair stages. Available when ≥1 stage has evidence.
 */
export function composeRepairGuide(
  input: ComposeRepairGuideInput,
): RepairGuideVM {
  const base = emptyRepairGuide();
  const preventive = (input.preventiveTexts ?? []).filter(Boolean);
  const expression = readRomanticExpressionSpeedCanonicalProjection(
    input.report,
  );
  const recovery = readRomanticRecoveryCanonicalProjection(input.report);
  const reassurance = readRomanticReassuranceCanonicalProjection(input.report);
  const residual = readRomanticResidualCanonicalProjection(input.report);
  const comparison = readRomanticComparisonTableCanonicalProjection(
    input.report,
  );

  const stagesById = new Map<RepairStageId, RepairStageVM>();
  const evidence: EvidenceRef[] = [];
  const doNotDemand: string[] = [];

  let slowerProcessor: "me" | "partner" | "balanced" = "balanced";
  let fasterExpresser: "me" | "partner" | "balanced" = "balanced";
  let pauseWindow: "short" | "medium" | "long" = "medium";
  let whoReachesFirst: "me" | "partner" | "either" = "either";
  let reassuranceForm: "listening" | "behavior_proof" | "presence" | "both" =
    "both";

  if (expression?.direction === "A") {
    fasterExpresser = viewerRole(input.viewerIsReportA, "A");
  } else if (expression?.direction === "B") {
    fasterExpresser = viewerRole(input.viewerIsReportA, "B");
  }

  if (recovery) {
    const deepA = recovery.recovery_a === "deep_processing";
    const deepB = recovery.recovery_b === "deep_processing";
    if (deepA && !deepB) slowerProcessor = viewerRole(input.viewerIsReportA, "A");
    else if (deepB && !deepA)
      slowerProcessor = viewerRole(input.viewerIsReportA, "B");
    else slowerProcessor = "balanced";

    if (recovery.recovery_mismatch) {
      pauseWindow =
        recovery.recovery_a === "deep_processing" ||
        recovery.recovery_b === "deep_processing"
          ? "long"
          : "medium";
      whoReachesFirst =
        fasterExpresser === "balanced" ? "either" : fasterExpresser;
    } else {
      pauseWindow = "short";
    }
  }

  if (reassurance) {
    const needMe = input.viewerIsReportA
      ? reassurance.need_a
      : reassurance.need_b;
    if (
      needMe === "listening" ||
      needMe === "behavior_proof" ||
      needMe === "presence" ||
      needMe === "both"
    ) {
      reassuranceForm = needMe;
    }
  }

  // pause
  if (
    (expression && expression.direction !== "balanced") ||
    recovery?.recovery_mismatch
  ) {
    const body =
      pauseWindow === "long"
        ? "확대를 멈추고, 숙성이 필요한 쪽의 창이 열릴 때까지 말·추궁을 잠시 내려둬요."
        : "확대를 멈추고, 서로의 속도가 다시 맞을 짧은 틈을 만들어요.";
    if (!clashesWithPreventive(body, preventive)) {
      stagesById.set("pause", {
        id: "pause",
        title: STAGE_TITLE.pause,
        body,
        sourceKeys: [
          ...(expression
            ? ["canonical_projections.expression_speed"]
            : []),
          ...(recovery ? ["canonical_projections.recovery_speed"] : []),
        ],
      });
      if (expression) {
        evidence.push({
          path: "canonical_projections.expression_speed",
          summary: "pause from expression asymmetry",
        });
      }
      if (recovery) {
        evidence.push({
          path: "canonical_projections.recovery_speed",
          summary: "pause from recovery mismatch",
        });
      }
    }
    doNotDemand.push("바로 결론·감정 정리를 같은 속도로 요구하기");
  }

  // re_entry
  if (recovery) {
    const body = recovery.recovery_mismatch
      ? "다시 말할 시각을 한 문장으로 정해 두고, 숙성 쪽이 준비되면 그 창으로 재진입해요."
      : "짧은 숨 고르기 뒤, 합의한 시각에 같은 주제로 다시 만나요.";
    if (!clashesWithPreventive(body, preventive)) {
      stagesById.set("re_entry", {
        id: "re_entry",
        title: STAGE_TITLE.re_entry,
        body,
        sourceKeys: ["canonical_projections.recovery_speed"],
      });
      evidence.push({
        path: "canonical_projections.recovery_speed",
        summary: "re-entry timing",
      });
    }
  }

  // acknowledgement
  if (
    (expression && expression.direction !== "balanced") ||
    comparison?.conflict
  ) {
    const body =
      "옳고 그름을 가리기 전에, 방금 장면이 불편했다는 사실만 짧게 인정해요.";
    if (!clashesWithPreventive(body, preventive)) {
      const sourceKeys = [
        ...(expression
          ? ["canonical_projections.expression_speed"]
          : []),
        ...(comparison?.conflict
          ? ["canonical_projections.comparison_table.conflict"]
          : []),
      ];
      stagesById.set("acknowledgement", {
        id: "acknowledgement",
        title: STAGE_TITLE.acknowledgement,
        body,
        sourceKeys,
      });
      for (const path of sourceKeys) {
        evidence.push({ path, summary: "acknowledgement support" });
      }
    }
  }

  // clarification
  if (
    comparison?.communication?.align === "caution" ||
    comparison?.decision?.align === "caution"
  ) {
    const bits: string[] = [];
    if (comparison.communication?.align === "caution") {
      bits.push(
        `소통: ${formatRomanticCompareLeanLabel(comparison.communication.lean_a, input.locale, "communication")} ↔ ${formatRomanticCompareLeanLabel(comparison.communication.lean_b, input.locale, "communication")}`,
      );
    }
    if (comparison.decision?.align === "caution") {
      bits.push(
        `결정: ${formatRomanticCompareLeanLabel(comparison.decision.lean_a, input.locale, "decision")} ↔ ${formatRomanticCompareLeanLabel(comparison.decision.lean_b, input.locale, "decision")}`,
      );
    }
    const body = `한 가지 사실만 골라 서로의 이해 차이를 맞춰 봐요. (${bits.join("; ")})`;
    if (!clashesWithPreventive(body, preventive)) {
      stagesById.set("clarification", {
        id: "clarification",
        title: STAGE_TITLE.clarification,
        body,
        sourceKeys: [
          ...(comparison.communication?.align === "caution"
            ? ["canonical_projections.comparison_table.communication"]
            : []),
          ...(comparison.decision?.align === "caution"
            ? ["canonical_projections.comparison_table.decision"]
            : []),
        ],
      });
      evidence.push({
        path: "canonical_projections.comparison_table",
        summary: "clarification from caution rows",
      });
    }
  }

  // reassurance
  if (reassurance) {
    const formLabel =
      reassuranceForm === "listening"
        ? "듣기로"
        : reassuranceForm === "behavior_proof"
          ? "행동으로"
          : reassuranceForm === "presence"
            ? "곁에 있음으로"
            : "상대가 받는 방식으로";
    const body = `재진입 후 ${formLabel} 안심을 한 번만 분명히 전달해요.`;
    if (!clashesWithPreventive(body, preventive)) {
      stagesById.set("reassurance", {
        id: "reassurance",
        title: STAGE_TITLE.reassurance,
        body,
        sourceKeys: ["canonical_projections.reassurance_signal"],
      });
      evidence.push({
        path: "canonical_projections.reassurance_signal",
        summary: "repair reassurance form",
      });
    }
  }

  // residual qualifies tone only — may extend pause note via doNotDemand
  if (residual) {
    const linger =
      residual.residual_a === "lingers" || residual.residual_b === "lingers";
    if (linger) {
      doNotDemand.push("잔여 감정이 남은 쪽에 즉시 '다 괜찮지?'로 닫기");
      evidence.push({
        path: "canonical_projections.residual",
        summary: "residual qualifies repair pacing",
      });
    }
  }

  // closure
  const speakable = pickReconnectSpeakable(input.report, preventive);
  if (speakable || stagesById.size > 0) {
    const body = speakable
      ? "한 문장으로 다시 연결한 뒤, 오늘은 여기까지로 닫아요."
      : "짧은 연결 문장으로 장면을 닫고, 남은 이야기는 다음 창으로 미뤄요.";
    if (!clashesWithPreventive(body, preventive)) {
      stagesById.set("closure", {
        id: "closure",
        title: STAGE_TITLE.closure,
        body,
        ...(speakable ? { speakable } : {}),
        sourceKeys: speakable
          ? [
              "section_3_conversation_patterns.conflict_situation.dialogue_table",
            ]
          : [
              ...(expression
                ? ["canonical_projections.expression_speed"]
                : []),
              ...(recovery ? ["canonical_projections.recovery_speed"] : []),
            ],
      });
      if (speakable) {
        evidence.push({
          path: "section_3_conversation_patterns.conflict_situation.dialogue_table",
          summary: "closure speakable from good_line",
        });
      }
    }
  }

  const stages = STAGE_ORDER.map((id) => stagesById.get(id)).filter(
    (s): s is RepairStageVM => Boolean(s),
  );
  if (stages.length === 0) return base;

  let interrupt: RepairGuideVM["interrupt"] = null;
  if (recovery?.recovery_mismatch) {
    interrupt = {
      id: "slower_window",
      label: "숙성 쪽 창이 열리기 전에는 본론을 재개하지 않기",
    };
  }

  const hasAsymmetry =
    expression != null || recovery != null || reassurance != null;
  const asymmetry = hasAsymmetry
    ? {
        slowerProcessor,
        fasterExpresser,
        pauseWindow,
        whoReachesFirst,
        reassuranceForm,
      }
    : null;

  let confidence: ConfidenceLevel = "medium";
  if (stages.length >= 4) confidence = "high";
  else if (stages.length === 1) confidence = "low";

  return {
    ...base,
    title: "Repair Guide",
    available: true,
    confidence,
    evidence,
    asymmetry,
    interrupt,
    stages,
    doNotDemand: [...new Set(doNotDemand)],
    polishEligiblePaths: [],
  };
}
