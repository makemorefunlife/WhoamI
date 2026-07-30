import type { CrossChartHit, CrossChartTrioHit } from "@/lib/saju/pairChartAnalysis";
import type { PairSajuFacts } from "../pairSaju";
import { koPalaceToEn } from "../pairSaju";
import {
  BRANCH_BOND_TYPES,
  BRANCH_TENSION_TYPES,
  PAIR_POLICY_DEFAULTS,
  type PairContextGroupId,
  type PairFactKind,
  type PairRoleInLens,
  type PairSignalTier,
} from "./constants";
import type { PairContextPacket, PairDirectionality } from "./types";

export type PairCandidate = Omit<
  PairContextPacket,
  "packet_id" | "base_meanings" | "unresolved_reference_ids"
> & {
  dedupe_key: string;
};

function isDayDay(hit: CrossChartHit): boolean {
  return (
    (hit.personA_pillarSlot === "일주" || hit.personA_pillar.startsWith("일주")) &&
    (hit.personB_pillarSlot === "일주" || hit.personB_pillar.startsWith("일주"))
  );
}

function hitDirection(hit: CrossChartHit): PairDirectionality {
  if (hit.category === "gongmang") {
    if (hit.detail?.startsWith("A 공망")) {
      return { polarity: "a_to_b", from: "A", to: "B" };
    }
    if (hit.detail?.startsWith("B 공망")) {
      return { polarity: "b_to_a", from: "B", to: "A" };
    }
  }
  return { polarity: "symmetric" };
}

function branchKindMeta(hit: CrossChartHit): {
  fact_kind: PairFactKind;
  group: PairContextGroupId;
  role: PairRoleInLens;
  relationTypeId: string;
  priority: number;
  tier: PairSignalTier;
} {
  if (hit.category === "stem_combine") {
    return {
      fact_kind: "stem_combine",
      group: "bonding",
      role: "bond_signal",
      relationTypeId: "stem_combine",
      priority: isDayDay(hit)
        ? PAIR_POLICY_DEFAULTS.class_c_selection_priority + 0.05
        : PAIR_POLICY_DEFAULTS.class_c_selection_priority,
      tier: isDayDay(hit) ? 1 : 2,
    };
  }
  if (hit.category === "stem_clash") {
    return {
      fact_kind: "stem_clash",
      group: "friction",
      role: "friction_signal",
      relationTypeId: "stem_clash",
      priority: PAIR_POLICY_DEFAULTS.class_c_selection_priority,
      tier: isDayDay(hit) ? 1 : 2,
    };
  }
  if (hit.category === "wonjin_guimun") {
    const id = hit.type === "원진" ? "wonjin" : "guimun";
    return {
      fact_kind: "wonjin_guimun",
      group: "friction",
      role: "friction_signal",
      relationTypeId: id,
      priority: PAIR_POLICY_DEFAULTS.class_c_selection_priority,
      tier: 2,
    };
  }
  if (hit.category === "gongmang") {
    return {
      fact_kind: "gongmang_cross",
      group: "structure",
      role: "modifier_signal",
      relationTypeId: "gongmang",
      priority: PAIR_POLICY_DEFAULTS.class_c_selection_priority,
      tier: 2,
    };
  }
  // branch_pair
  if (BRANCH_BOND_TYPES.has(hit.type)) {
    return {
      fact_kind: "branch_pair",
      group: "bonding",
      role: "bond_signal",
      relationTypeId: "branch_six_combine",
      priority: isDayDay(hit)
        ? PAIR_POLICY_DEFAULTS.class_a_selection_priority
        : PAIR_POLICY_DEFAULTS.class_a_selection_priority - 0.05,
      tier: isDayDay(hit) ? 1 : 2,
    };
  }
  if (BRANCH_TENSION_TYPES.has(hit.type)) {
    const typeId =
      hit.type === "충"
        ? "branch_clash"
        : hit.type === "형"
          ? "branch_punishment"
          : hit.type === "파"
            ? "branch_break"
            : "branch_harm";
    const band =
      hit.type === "충"
        ? PAIR_POLICY_DEFAULTS.class_a_selection_priority
        : PAIR_POLICY_DEFAULTS.class_b_selection_priority;
    return {
      fact_kind: "branch_pair",
      group: "friction",
      role: "friction_signal",
      relationTypeId: typeId,
      priority: isDayDay(hit) ? band : band - 0.05,
      tier: isDayDay(hit) ? 1 : 2,
    };
  }
  return {
    fact_kind: "other",
    group: "modifiers",
    role: "modifier_signal",
    relationTypeId: "branch_six_combine",
    priority: 0.3,
    tier: 4,
  };
}

function candidateFromHit(
  hit: CrossChartHit,
  index: number,
  facts: PairSajuFacts,
): PairCandidate {
  const meta = branchKindMeta(hit);
  const aSlot = koPalaceToEn(hit.personA_pillarSlot ?? hit.personA_pillar.slice(0, 2));
  const bSlot = koPalaceToEn(hit.personB_pillarSlot ?? hit.personB_pillar.slice(0, 2));
  const codes = [
    hit.type,
    hit.personA_code ?? "",
    hit.personB_code ?? "",
    hit.detail ?? "",
  ].filter(Boolean);

  return {
    dedupe_key: [
      meta.fact_kind,
      hit.personA_code ?? "",
      hit.personB_code ?? "",
      aSlot ?? "",
      bSlot ?? "",
      hit.type,
    ].join("|"),
    group: meta.group,
    role_in_lens: meta.role,
    tier: meta.tier,
    fact_path: `cross_hits[${index}]`,
    fact_kind: meta.fact_kind,
    codes,
    parties: {
      a_report_id: facts.report_id_a,
      b_report_id: facts.report_id_b,
    },
    directionality: hitDirection(hit),
    pillar_slots: { a: aSlot, b: bSlot },
    reference_ids: [`relation_type:${meta.relationTypeId}`],
    selection_priority: meta.priority,
    confidence: "deterministic",
    evidence: [
      {
        kind: "relation",
        codes,
        detail: `${hit.personA_pillar}×${hit.personB_pillar}`,
      },
    ],
  };
}

function candidateFromTrio(
  hit: CrossChartTrioHit,
  index: number,
  facts: PairSajuFacts,
): PairCandidate {
  const relationTypeId =
    hit.label === "삼합" ? "branch_three_combine" : "branch_direction_combine";
  const priority =
    hit.label === "삼합"
      ? PAIR_POLICY_DEFAULTS.class_a_selection_priority
      : PAIR_POLICY_DEFAULTS.class_b_selection_priority;
  const contributions = hit.contributedBranches.map((c) => ({
    owner: c.owner as "A" | "B",
    pillar_slot: koPalaceToEn(c.pillarSlot) ?? "day",
    code: c.branchCode,
  }));

  return {
    dedupe_key: `trio|${hit.label}|${hit.resultCode}`,
    group: "structure",
    role_in_lens: "bond_signal",
    tier: 2,
    fact_path: `trio_hits[${index}]`,
    fact_kind: "branch_trio",
    codes: [hit.label, hit.resultCode, hit.name],
    parties: {
      a_report_id: facts.report_id_a,
      b_report_id: facts.report_id_b,
    },
    directionality: { polarity: "multipart" },
    pillar_slots: { contributions },
    reference_ids: [`relation_type:${relationTypeId}`],
    selection_priority: priority,
    confidence: "deterministic",
    evidence: [
      {
        kind: "relation",
        codes: [hit.resultCode, ...hit.contributedBranches.map((c) => c.branchCode)],
        detail: hit.name,
      },
    ],
  };
}

/**
 * Select context-neutral Pair candidates from Pair Fact Layer.
 * No Saju recalculation; no domain copy.
 */
export function selectPairSharedCandidates(facts: PairSajuFacts): {
  candidates: PairCandidate[];
  exclusions: Array<{ fact_path: string; reason: "deduped" | "empty_fact"; detail?: string }>;
} {
  const raw: PairCandidate[] = [];
  const exclusions: Array<{
    fact_path: string;
    reason: "deduped" | "empty_fact";
    detail?: string;
  }> = [];

  facts.cross_hits.forEach((hit, i) => {
    raw.push(candidateFromHit(hit, i, facts));
  });
  facts.trio_hits.forEach((hit, i) => {
    raw.push(candidateFromTrio(hit, i, facts));
  });

  if (facts.element_flow) {
    const flow = facts.element_flow;
    const dir: PairDirectionality =
      flow.direction === "a_to_b"
        ? { polarity: "a_to_b", from: "A", to: "B" }
        : flow.direction === "b_to_a"
          ? { polarity: "b_to_a", from: "B", to: "A" }
          : flow.direction === "symmetric"
            ? { polarity: "symmetric" }
            : { polarity: "symmetric" };
    raw.push({
      dedupe_key: `element_flow|${flow.interaction_code}`,
      group: "energy",
      role_in_lens:
        flow.interaction_code.startsWith("generates_")
          ? "energy_flow"
          : "energy_balance",
      tier: 1,
      fact_path: "element_flow",
      fact_kind: "element_flow",
      codes: [
        flow.interaction_code,
        flow.day_stem_element_a,
        flow.day_stem_element_b,
      ],
      parties: {
        a_report_id: facts.report_id_a,
        b_report_id: facts.report_id_b,
      },
      directionality: dir,
      pillar_slots: { a: "day", b: "day" },
      reference_ids: [
        `element:${flow.day_stem_element_a}`,
        `element:${flow.day_stem_element_b}`,
      ].filter((id) => !id.endsWith(":unknown")),
      selection_priority:
        flow.interaction_code.startsWith("generates_")
          ? PAIR_POLICY_DEFAULTS.class_b_selection_priority
          : PAIR_POLICY_DEFAULTS.class_a_selection_priority - 0.1,
      confidence: "deterministic",
      evidence: [
        {
          kind: "stem",
          codes: [flow.day_stem_element_a, flow.day_stem_element_b],
          detail: flow.interaction_code,
        },
      ],
    });
  }

  if (facts.johu_relation) {
    const j = facts.johu_relation;
    raw.push({
      dedupe_key: `johu|${j.relation}|${j.band_a}|${j.band_b}`,
      group: "energy",
      role_in_lens: "energy_balance",
      tier: 1,
      fact_path: "johu_relation",
      fact_kind: "johu_relation",
      codes: [j.relation, j.band_a, j.band_b, String(j.heat_gap)],
      parties: {
        a_report_id: facts.report_id_a,
        b_report_id: facts.report_id_b,
      },
      directionality: { polarity: "symmetric" },
      reference_ids: [],
      selection_priority: PAIR_POLICY_DEFAULTS.class_s_selection_priority,
      confidence: j.confidence,
      evidence: [
        {
          kind: "note",
          codes: [j.band_a, j.band_b],
          detail: `heat_gap=${j.heat_gap};moisture_gap=${j.moisture_gap}`,
        },
      ],
    });
  }

  if (facts.yongsin_alignment && facts.yongsin_alignment.relation === "overlap") {
    const y = facts.yongsin_alignment;
    raw.push({
      dedupe_key: `yongsin|${y.overlap_elements.join(",")}`,
      group: "energy",
      role_in_lens: "directional_guidance",
      tier: 4,
      fact_path: "yongsin_alignment",
      fact_kind: "yongsin_alignment",
      codes: ["overlap", ...y.overlap_elements],
      parties: {
        a_report_id: facts.report_id_a,
        b_report_id: facts.report_id_b,
      },
      directionality: { polarity: "symmetric" },
      reference_ids: y.overlap_elements.map((e) => `element:${e}`),
      selection_priority: PAIR_POLICY_DEFAULTS.class_s_selection_priority - 0.15,
      confidence: y.confidence,
      evidence: [
        {
          kind: "note",
          codes: y.overlap_elements,
          detail: "favorable_element_overlap",
        },
      ],
    });
  }

  if (facts.gongmang_shared) {
    const g = facts.gongmang_shared;
    raw.push({
      dedupe_key: `gongmang_shared|${g.shared_void_branches.join(",")}`,
      group: "structure",
      role_in_lens: "modifier_signal",
      tier: 2,
      fact_path: "gongmang_shared",
      fact_kind: "gongmang_shared",
      codes: ["shared", ...g.shared_void_branches],
      parties: {
        a_report_id: facts.report_id_a,
        b_report_id: facts.report_id_b,
      },
      directionality: { polarity: "symmetric" },
      reference_ids: ["gongmang:void"],
      selection_priority: PAIR_POLICY_DEFAULTS.class_c_selection_priority,
      confidence: "deterministic",
      evidence: [
        {
          kind: "rule",
          codes: g.shared_void_branches,
          detail: "shared_void_intersection",
        },
      ],
    });
  }

  // Semantic dedupe: keep highest selection_priority per dedupe_key
  const best = new Map<string, PairCandidate>();
  for (const c of raw) {
    const prev = best.get(c.dedupe_key);
    if (!prev || c.selection_priority > prev.selection_priority) {
      if (prev) {
        exclusions.push({
          fact_path: prev.fact_path,
          reason: "deduped",
          detail: `superseded by ${c.fact_path}`,
        });
      }
      best.set(c.dedupe_key, c);
    } else {
      exclusions.push({
        fact_path: c.fact_path,
        reason: "deduped",
        detail: `duplicate of ${prev.fact_path}`,
      });
    }
  }

  const candidates = [...best.values()].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (b.selection_priority !== a.selection_priority) {
      return b.selection_priority - a.selection_priority;
    }
    return a.fact_path.localeCompare(b.fact_path);
  });

  return { candidates, exclusions };
}
