/**
 * Deep Essence 구조화 리포트 — 타입 + 런타임 검증기.
 *
 * OpenAI SDK 등 서버 전용 의존성이 전혀 없는 순수 모듈이다. 그래서
 * 서버(runDeepEssenceStructuredLlm.ts)뿐 아니라 클라이언트
 * (lib/v1/slim/slimIntegratedCache.ts, StitchDeepEssenceView.tsx)에서도
 * 안전하게 import해서 "캐시에 저장된 구조가 최신 스키마와 맞는지" 검증할 수 있다.
 *
 * 스키마가 바뀌면(예: Part 02~05 필드 추가) 예전 캐시에는 새 필드가 없는데,
 * 검증 없이 그대로 렌더링하면 `Cannot read properties of undefined` 런타임
 * 에러가 난다. 이 파일의 isDeepEssenceStructuredReport를 캐시 read 시점에
 * 반드시 통과시켜야 한다.
 */
import { PRIMARY_AXIS_KEYS } from "@/lib/v2/survey/types";
import type { PrimaryAxesScores } from "@/lib/v2/survey/types";

export type DeepEssenceStrengthOrWatchout = { title: string; body: string };
/** Batch 4 — one Layered Identity layer. Optional/omittable when evidence is too thin. */
export type DeepEssenceLayeredIdentityLayer = {
  title?: string;
  narrative: string;
  evidence_refs?: string[];
};
export type DeepEssenceEnergyBar = {
  label: string;
  value: number;
  tone: "highlight" | "accent" | "ink";
};
export type DeepEssenceWoundSteadyRow = { wound: string; steady: string };
export type DeepEssencePlaybookRow = { situation: string; old: string; better: string };

export type DeepEssenceStructuredReport = {
  summary: {
    core_mode: string;
    energy_balance: string;
    growth_edge: string;
    /**
     * Batch 3 — internal provenance only, never rendered in the UI.
     * Populated when Part01 Identity Evidence grounding was available;
     * absent otherwise (existing ungrounded behavior is preserved).
     */
    core_mode_evidence_refs?: string[];
    growth_edge_evidence_refs?: string[];
    growth_edge_why?: string;
    growth_edge_real_life_pattern?: string;
    growth_edge_if_developed?: string;
  };
  /**
   * Batch 4 — additive, optional. Four-layer Layered Identity synthesis
   * grounded in Part01 Identity Evidence. Absent when the packet was
   * unavailable, or per-layer omitted when a layer's evidence was too thin
   * to responsibly synthesize (never forced/fabricated).
   */
  layered_identity?: {
    first_impression?: DeepEssenceLayeredIdentityLayer;
    known_self?: DeepEssenceLayeredIdentityLayer;
    close_private_self?: DeepEssenceLayeredIdentityLayer;
    natural_self_and_deep_needs?: DeepEssenceLayeredIdentityLayer;
  };
  radar_potential: PrimaryAxesScores;
  strengths: DeepEssenceStrengthOrWatchout[];
  watchouts: DeepEssenceStrengthOrWatchout[];
  energy: {
    headline: string;
    balance_pct: number;
    bars: DeepEssenceEnergyBar[];
    summary: string;
    fuels: string[];
    drains: string[];
    optimal: string[];
  };
  relationships: {
    pattern: string;
    fit: string[];
    friction: string[];
    compare: DeepEssenceWoundSteadyRow[];
  };
  playbook: {
    rule: string;
    rows: DeepEssencePlaybookRow[];
    heated: string;
    reset: string;
  };
  future: {
    remember: string[];
    leap: string;
  };
  closing: string;
  checklist: string[];
};

// ── 검증 헬퍼 ──

function isFiniteScore(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringArray(v: unknown, min: number, max: number): v is string[] {
  return (
    Array.isArray(v) &&
    v.length >= min &&
    v.length <= max &&
    v.every((item) => isNonEmptyString(item))
  );
}

function isFixedLenList<T>(
  v: unknown,
  len: number,
  check: (item: unknown) => item is T,
): v is T[] {
  return Array.isArray(v) && v.length === len && v.every(check);
}

function isStrengthOrWatchout(v: unknown): v is DeepEssenceStrengthOrWatchout {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return isNonEmptyString(o.title) && isNonEmptyString(o.body);
}

function isEnergyBar(v: unknown): v is DeepEssenceEnergyBar {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    isNonEmptyString(o.label) &&
    isFiniteScore(o.value) &&
    (o.tone === "highlight" || o.tone === "accent" || o.tone === "ink")
  );
}

function isWoundSteadyRow(v: unknown): v is DeepEssenceWoundSteadyRow {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return isNonEmptyString(o.wound) && isNonEmptyString(o.steady);
}

function isPlaybookRow(v: unknown): v is DeepEssencePlaybookRow {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return isNonEmptyString(o.situation) && isNonEmptyString(o.old) && isNonEmptyString(o.better);
}

/** Part A(요약·레이더·강점·주의점·에너지) 응답 검증 */
export function isDeepEssencePartA(v: unknown): v is Pick<
  DeepEssenceStructuredReport,
  "summary" | "radar_potential" | "strengths" | "watchouts" | "energy"
> {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;

  const summary = obj.summary as Record<string, unknown> | undefined;
  if (
    !summary ||
    !isNonEmptyString(summary.core_mode) ||
    !isNonEmptyString(summary.energy_balance) ||
    !isNonEmptyString(summary.growth_edge)
  ) {
    return false;
  }

  const radar = obj.radar_potential as Record<string, unknown> | undefined;
  if (!radar || !PRIMARY_AXIS_KEYS.every((k) => isFiniteScore(radar[k]))) {
    return false;
  }

  if (!isFixedLenList(obj.strengths, 3, isStrengthOrWatchout)) return false;
  if (!isFixedLenList(obj.watchouts, 3, isStrengthOrWatchout)) return false;

  const energy = obj.energy as Record<string, unknown> | undefined;
  if (
    !energy ||
    !isNonEmptyString(energy.headline) ||
    !isFiniteScore(energy.balance_pct) ||
    !isFixedLenList(energy.bars, 3, isEnergyBar) ||
    !isNonEmptyString(energy.summary) ||
    !isStringArray(energy.fuels, 3, 5) ||
    !isStringArray(energy.drains, 3, 5) ||
    !isStringArray(energy.optimal, 2, 4)
  ) {
    return false;
  }

  return true;
}

/** Part B(관계·플레이북·앞으로·체크리스트) 응답 검증 */
export function isDeepEssencePartB(v: unknown): v is Pick<
  DeepEssenceStructuredReport,
  "relationships" | "playbook" | "future" | "closing" | "checklist"
> {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;

  const relationships = obj.relationships as Record<string, unknown> | undefined;
  if (
    !relationships ||
    !isNonEmptyString(relationships.pattern) ||
    !isFixedLenList(relationships.fit, 3, isNonEmptyString) ||
    !isFixedLenList(relationships.friction, 3, isNonEmptyString) ||
    !isFixedLenList(relationships.compare, 3, isWoundSteadyRow)
  ) {
    return false;
  }

  const playbook = obj.playbook as Record<string, unknown> | undefined;
  if (
    !playbook ||
    !isNonEmptyString(playbook.rule) ||
    !isFixedLenList(playbook.rows, 3, isPlaybookRow) ||
    !isNonEmptyString(playbook.heated) ||
    !isNonEmptyString(playbook.reset)
  ) {
    return false;
  }

  const future = obj.future as Record<string, unknown> | undefined;
  if (
    !future ||
    !isFixedLenList(future.remember, 3, isNonEmptyString) ||
    !isNonEmptyString(future.leap)
  ) {
    return false;
  }

  if (!isNonEmptyString(obj.closing)) return false;
  if (!isStringArray(obj.checklist, 8, 12)) return false;

  return true;
}

/**
 * 전체 스키마 검증. 서버에서 LLM 응답을 검증할 때는 물론, 클라이언트에서
 * localStorage 캐시를 읽을 때도 반드시 이걸 통과한 것만 구조화 뷰로 렌더링해야
 * 한다 — 스키마 버전이 올라가면 예전 캐시는 필드가 없어서 여기서 걸러진다.
 */
export function isDeepEssenceStructuredReport(
  v: unknown,
): v is DeepEssenceStructuredReport {
  return isDeepEssencePartA(v) && isDeepEssencePartB(v);
}
