/**
 * M9 Do / Don't projector — preventive PairPrescriptionPack only.
 * Canonical deterministic signals only. section_5_action is LLM narrative and
 * is intentionally excluded so provenance is not collapsed into "deterministic".
 * No M7 dialogue lines, no M8 repair steps.
 */
import type { RomanticSajuDeepReport } from "@/lib/prompts/relationshipPremium/romanticSajuDeep/outputSchema";
import { readRomanticExpressionSpeedCanonicalProjection } from "@/lib/relationship/romantic/romanticExpressionSpeedCanonical";
import { readRomanticRecoveryCanonicalProjection } from "@/lib/relationship/romantic/romanticRecoverySpeedCanonical";
import { readRomanticReassuranceCanonicalProjection } from "@/lib/relationship/romantic/romanticReassuranceCanonical";
import type {
  PairPrescriptionItem,
  PairPrescriptionPack,
} from "@/lib/relationship/shared/pairPrescriptionUiTypes";
import type {
  ConfidenceLevel,
  DoDontVM,
  EvidenceRef,
} from "../romanticExperienceTypes";
import { emptyDoDont } from "./_empty";

export type ProjectDoDontInput = {
  report: RomanticSajuDeepReport["report"];
  nameA: string;
  nameB: string;
  myName: string;
  partnerName: string;
  viewerIsReportA: boolean;
  /** Dialogue good/bad lines to exclude (M6 dedupe). */
  forbiddenPhrases?: string[];
  /** Repair stage bodies / speakables to exclude (M9 dedupe). */
  repairTexts?: string[];
};

const SCHEMA_VERSION = "romantic-experience-dodont-b3";

function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function isForbidden(text: string, banned: string[]): boolean {
  const n = norm(text);
  if (!n) return true;
  return banned.some((b) => {
    const bn = norm(b);
    return bn && (n === bn || n.includes(bn) || bn.includes(n));
  });
}

function filterList(list: string[], banned: string[]): string[] {
  return list.filter((line) => !isForbidden(line, banned));
}

function buildExpressionItem(
  input: ProjectDoDontInput,
  banned: string[],
): PairPrescriptionItem | null {
  const expression = readRomanticExpressionSpeedCanonicalProjection(
    input.report,
  );
  if (!expression || expression.direction === "balanced") return null;

  const faster =
    expression.direction === "A"
      ? input.viewerIsReportA
        ? input.myName
        : input.partnerName
      : input.viewerIsReportA
        ? input.partnerName
        : input.myName;
  const slower =
    expression.direction === "A"
      ? input.viewerIsReportA
        ? input.partnerName
        : input.myName
      : input.viewerIsReportA
        ? input.myName
        : input.partnerName;

  const do_list = filterList(
    [
      `평소에 ${faster} 쪽은 감정을 짧게 먼저 말하고, ${slower} 쪽 정리 창을 문장으로 남겨 두기.`,
      `연락·대화 전에 지금 바로 말할지, 나중에 이을지 템포를 먼저 고르기.`,
    ],
    banned,
  );
  const dont_list = filterList(
    [
      `평소에 ${slower} 쪽의 침묵을 무시·거부로 단정하지 않기.`,
      `평소에 ${faster} 쪽에게 즉각 긴 해명을 요구하지 않기.`,
    ],
    banned,
  );
  if (do_list.length === 0 && dont_list.length === 0) return null;

  return {
    topic: "expression_tempo_prevention",
    headline: "표현 속도 차이를 평소에 다루기",
    evidence: {
      source: "canonical_projections.expression_speed",
      signal_paths: ["canonical_projections.expression_speed.direction"],
      summary: `faster=${faster}; slower=${slower}; direction=${expression.direction}`,
      snapshot: {
        direction: expression.direction,
        align: expression.align ?? null,
        confidence: expression.confidence ?? null,
      },
    },
    do_list,
    dont_list,
  };
}

function buildRecoveryItem(
  input: ProjectDoDontInput,
  banned: string[],
): PairPrescriptionItem | null {
  const recovery = readRomanticRecoveryCanonicalProjection(input.report);
  if (!recovery || !recovery.recovery_mismatch) return null;

  const do_list = filterList(
    [
      "평소에 갈등 직후 '언제 이어서 말할지' 시간 앵커만 먼저 합의하기.",
      "회복이 빠른 쪽은 짧은 안부를, 숙성 쪽은 정리 후 한 문장 요약을 기본값으로 두기.",
    ],
    banned,
  );
  const dont_list = filterList(
    [
      "평소에 감정 정리를 같은 속도로 끝내라고 맞추지 않기.",
      "숙성 중인 쪽에 바로 결론·사과 문구를 강요하지 않기.",
    ],
    banned,
  );
  if (do_list.length === 0 && dont_list.length === 0) return null;

  return {
    topic: "recovery_window_prevention",
    headline: "회복 창 차이를 평소에 보호하기",
    evidence: {
      source: "canonical_projections.recovery_speed",
      signal_paths: [
        "canonical_projections.recovery_speed.recovery_a",
        "canonical_projections.recovery_speed.recovery_b",
        "canonical_projections.recovery_speed.recovery_mismatch",
      ],
      summary: "recovery mismatch under normal conditions",
      snapshot: {
        recovery_a: recovery.recovery_a,
        recovery_b: recovery.recovery_b,
        recovery_mismatch: recovery.recovery_mismatch,
      },
    },
    do_list,
    dont_list,
  };
}

function buildReassuranceItem(
  input: ProjectDoDontInput,
  banned: string[],
): PairPrescriptionItem | null {
  const reassurance = readRomanticReassuranceCanonicalProjection(input.report);
  if (!reassurance) return null;
  if (reassurance.match_a_gives_b && reassurance.match_b_gives_a) return null;

  const do_list = filterList(
    [
      "평소에 상대가 안심하는 형태(듣기·행동·존재)를 한 가지로 고정해 반복하기.",
      "좋은 하루에도 안심 신호를 한 번 넣어 갈등 전에 잔고를 쌓기.",
    ],
    banned,
  );
  const dont_list = filterList(
    [
      "내가 편한 안심 방식만 반복하고 상대 필요 형태를 바꾸려 하지 않기.",
      "안심을 '큰 이벤트'로만 몰아두지 않기.",
    ],
    banned,
  );
  if (do_list.length === 0 && dont_list.length === 0) return null;

  return {
    topic: "reassurance_match_prevention",
    headline: "안심 신호 불일치를 평소에 메우기",
    evidence: {
      source: "canonical_projections.reassurance_signal",
      signal_paths: [
        "canonical_projections.reassurance_signal.need_a",
        "canonical_projections.reassurance_signal.need_b",
        "canonical_projections.reassurance_signal.match_a_gives_b",
        "canonical_projections.reassurance_signal.match_b_gives_a",
      ],
      summary: "reassurance give/need mismatch",
      snapshot: {
        need_a: reassurance.need_a,
        need_b: reassurance.need_b,
        match_a_gives_b: reassurance.match_a_gives_b,
        match_b_gives_a: reassurance.match_b_gives_a,
      },
    },
    do_list,
    dont_list,
  };
}

/**
 * Availability: ≥1 canonical prescription item with do or don't after dedupe.
 * section_5_action is not mixed into this pack (LLM provenance).
 */
export function projectDoDont(input: ProjectDoDontInput): DoDontVM {
  const base = emptyDoDont();
  const banned = [
    ...(input.forbiddenPhrases ?? []),
    ...(input.repairTexts ?? []),
  ].filter(Boolean);

  const items: PairPrescriptionItem[] = [];
  const expr = buildExpressionItem(input, banned);
  if (expr) items.push(expr);
  const rec = buildRecoveryItem(input, banned);
  if (rec) items.push(rec);
  const reass = buildReassuranceItem(input, banned);
  if (reass) items.push(reass);

  if (items.length === 0) return base;

  const pack: PairPrescriptionPack = {
    schema_version: SCHEMA_VERSION,
    intro_line:
      "평소에 이 관계를 지키는 예방 체크리스트예요. 이미 긴장된 순간의 복구 순서는 Repair에서 다뤄요.",
    items,
  };

  const evidence: EvidenceRef[] = items.map((item) => ({
    path: item.evidence.signal_paths[0] ?? item.evidence.source,
    summary: item.evidence.summary,
  }));

  let confidence: ConfidenceLevel = "low";
  if (items.length >= 3) confidence = "high";
  else if (items.length >= 2) confidence = "medium";

  return {
    ...base,
    title: "Do / Don't",
    available: true,
    confidence,
    evidence,
    pack,
  };
}
