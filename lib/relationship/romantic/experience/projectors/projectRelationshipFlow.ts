/**
 * M4 Relationship Flow projector.
 * Sequence from canonical dynamics — not M2 needs or M6 dialogue copy.
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { readRomanticBalanceCanonicalProjection } from "@/lib/relationship/romantic/romanticBalanceOfPowerCanonical";
import { readRomanticExpressionSpeedCanonicalProjection } from "@/lib/relationship/romantic/romanticExpressionSpeedCanonical";
import { readRomanticRecoveryCanonicalProjection } from "@/lib/relationship/romantic/romanticRecoverySpeedCanonical";
import { readRomanticReassuranceCanonicalProjection } from "@/lib/relationship/romantic/romanticReassuranceCanonical";
import { readRomanticRolePlayCanonicalProjection } from "@/lib/relationship/romantic/romanticRolePlayCanonical";
import type {
  ConfidenceLevel,
  EvidenceRef,
  FlowNodeVM,
  RelationshipFlowVM,
} from "../romanticExperienceTypes";
import { emptyRelationshipFlow } from "./_empty";

export type ProjectRelationshipFlowInput = {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
  myName: string;
  partnerName: string;
  viewerIsReportA: boolean;
};

function recoveryLabel(band: string): string {
  if (band === "quick_recovery") return "빠르게 회복하는 쪽";
  if (band === "deep_processing") return "깊게 숙성하는 쪽";
  return "균형 회복";
}

/**
 * Availability: ≥2 ordered flow nodes from distinct canonical signals.
 */
export function projectRelationshipFlow(
  input: ProjectRelationshipFlowInput,
): RelationshipFlowVM {
  const base = emptyRelationshipFlow();
  const expression = readRomanticExpressionSpeedCanonicalProjection(
    input.report,
  );
  const recovery = readRomanticRecoveryCanonicalProjection(input.report);
  const reassurance = readRomanticReassuranceCanonicalProjection(input.report);
  const rolePlay = readRomanticRolePlayCanonicalProjection(input.report);
  const balance = readRomanticBalanceCanonicalProjection(input.report);

  const nodes: FlowNodeVM[] = [];
  const evidence: EvidenceRef[] = [];
  const chips: Array<{ key: string; label: string }> = [];

  const fasterName =
    expression?.direction === "A"
      ? input.viewerIsReportA
        ? input.myName
        : input.partnerName
      : expression?.direction === "B"
        ? input.viewerIsReportA
          ? input.partnerName
          : input.myName
        : null;
  const slowerName =
    expression?.direction === "A"
      ? input.viewerIsReportA
        ? input.partnerName
        : input.myName
      : expression?.direction === "B"
        ? input.viewerIsReportA
          ? input.myName
          : input.partnerName
        : null;

  // Node order is editorial presentation of co-present signals, not proven causation.
  if (expression && expression.direction !== "balanced" && fasterName && slowerName) {
    nodes.push({
      key: "trigger",
      label: "시작",
      body: `표현 속도 신호: ${fasterName} 쪽이 더 빨리 말하고, ${slowerName} 쪽은 더 늦게 말해요.`,
      sourceKeys: ["canonical_projections.expression_speed"],
    });
    nodes.push({
      key: "faster_move",
      label: "빠른 쪽의 움직임",
      body: `${fasterName}은(는) 감정을 바로 꺼내는 쪽에 가까워요.`,
      sourceKeys: ["canonical_projections.expression_speed"],
    });
    nodes.push({
      key: "slower_move",
      label: "느린 쪽의 움직임",
      body: `${slowerName}은(는) 정리 시간을 둔 뒤 말하는 쪽에 가까워요.`,
      sourceKeys: ["canonical_projections.expression_speed"],
    });
    evidence.push({
      path: "canonical_projections.expression_speed",
      summary: "expression speed sequence",
    });
    chips.push({ key: "expression_speed", label: "표현 속도" });
  } else if (expression?.direction === "balanced") {
    nodes.push({
      key: "trigger",
      label: "시작",
      body: "표현 속도 신호: 두 사람의 말 템포가 비슷해요.",
      sourceKeys: ["canonical_projections.expression_speed"],
    });
    evidence.push({
      path: "canonical_projections.expression_speed",
      summary: "balanced expression speed",
    });
    chips.push({ key: "expression_speed", label: "표현 속도" });
  }

  if (recovery) {
    const aName = input.nameA;
    const bName = input.nameB;
    nodes.push({
      key: "recovery",
      label: "회복 구간",
      body: recovery.recovery_mismatch
        ? `회복 속도 신호: ${aName}은(는) ${recoveryLabel(recovery.recovery_a)}, ${bName}은(는) ${recoveryLabel(recovery.recovery_b)}.`
        : `회복 속도 신호: 둘 다 ${recoveryLabel(recovery.recovery_a)}에 가까워요.`,
      sourceKeys: ["canonical_projections.recovery_speed"],
    });
    evidence.push({
      path: "canonical_projections.recovery_speed",
      summary: "recovery sequence node",
    });
    chips.push({ key: "recovery_speed", label: "회복 속도" });
  }

  if (reassurance) {
    const matchBoth =
      reassurance.match_a_gives_b && reassurance.match_b_gives_a;
    nodes.push({
      key: "reassurance",
      label: "안심 교환",
      body: matchBoth
        ? "안심 신호: 서로의 need/give가 맞게 읽혀요."
        : "안심 신호: need/give 일치가 어긋나요.",
      sourceKeys: ["canonical_projections.reassurance_signal"],
    });
    evidence.push({
      path: "canonical_projections.reassurance_signal",
      summary: "reassurance sequence node",
    });
    chips.push({ key: "reassurance_signal", label: "안심 신호" });
  }

  if (rolePlay) {
    nodes.push({
      key: "role_frame",
      label: "역할 프레임",
      body: rolePlay.agrees
        ? "역할 프레임 신호: primary와 saju 프레임이 같은 방향으로 읽혀요."
        : "역할 프레임 신호: primary와 saju 프레임이 다르게 읽혀요.",
      sourceKeys: ["canonical_projections.unconscious_role_play"],
    });
    evidence.push({
      path: "canonical_projections.unconscious_role_play",
      summary: "role-play sequence node",
    });
    chips.push({ key: "unconscious_role_play", label: "역할 프레임" });
  } else if (balance) {
    nodes.push({
      key: "balance",
      label: "주도·수용 흐름",
      body: "균형 신호: 아이디어·결정·실행 리드가 사람마다 다르게 읽혀요.",
      sourceKeys: ["canonical_projections.balance_of_power"],
    });
    evidence.push({
      path: "canonical_projections.balance_of_power",
      summary: "balance sequence node",
    });
    chips.push({ key: "balance_of_power", label: "균형" });
  }

  if (nodes.length < 2) return base;

  let interrupt: RelationshipFlowVM["interrupt"] = null;
  if (recovery?.recovery_mismatch) {
    interrupt = {
      id: "wait_slower_window",
      label: "심층 숙성 쪽 창이 열릴 때까지 한 박자 쉬고 다시 들어가기",
    };
  } else if (expression && expression.direction !== "balanced") {
    interrupt = {
      id: "name_tempo_gap",
      label: "속도 차이 자체를 한 문장으로 먼저 이름 붙이기",
    };
  }

  let confidence: ConfidenceLevel = "medium";
  if (nodes.length >= 4) confidence = "high";
  else if (nodes.length === 2) confidence = "low";

  return {
    ...base,
    title: "Relationship Flow",
    available: true,
    confidence,
    evidence,
    nodes,
    interrupt,
    signalChips: chips,
  };
}
