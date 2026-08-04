/**
 * Domain lenses — filter + frame shared Pair CE packets.
 * Never recalculate Pair facts; never mutate packet fact fields.
 */

import type {
  DomainPairLensId,
  DomainPairLensOutput,
  PairContextEngineOutput,
  PairContextPacket,
} from "./types";

const ROMANTIC_KINDS = new Set([
  "stem_combine",
  "branch_pair",
  "branch_trio",
  "wonjin_guimun",
  "gongmang_cross",
  "gongmang_shared",
  "element_flow",
  "johu_relation",
  "yongsin_alignment",
]);

const PARTNER_KINDS = new Set([
  "stem_combine",
  "stem_clash",
  "branch_pair",
  "branch_trio",
  "wonjin_guimun",
  "gongmang_cross",
  "gongmang_shared",
  "element_flow",
  "johu_relation",
  "yongsin_alignment",
]);

const FRIEND_KINDS = new Set([
  "stem_combine",
  "branch_pair",
  "element_flow",
  "johu_relation",
  "wonjin_guimun",
  "gongmang_shared",
]);

const FAMILY_KINDS = new Set([
  "branch_pair",
  "stem_combine",
  "element_flow",
  "wonjin_guimun",
  "gongmang_cross",
  "gongmang_shared",
  "johu_relation",
]);

const WORK_KINDS = new Set([
  "stem_combine",
  "stem_clash",
  "branch_pair",
  "element_flow",
  "wonjin_guimun",
  "gongmang_cross",
]);

function kindsFor(domain: DomainPairLensId): Set<string> {
  switch (domain) {
    case "romantic":
      return ROMANTIC_KINDS;
    case "partner":
      return PARTNER_KINDS;
    case "friend":
      return FRIEND_KINDS;
    case "family":
      return FAMILY_KINDS;
    case "work":
      return WORK_KINDS;
  }
}

function frameTag(domain: DomainPairLensId, p: PairContextPacket): string {
  if (p.group === "bonding") return `${domain}:bond`;
  if (p.group === "friction") return `${domain}:friction`;
  if (p.group === "energy") return `${domain}:energy`;
  if (p.group === "structure") return `${domain}:structure`;
  return `${domain}:modifier`;
}

function relevance(
  domain: DomainPairLensId,
  p: PairContextPacket,
): "primary" | "supporting" | "background" {
  if (domain === "romantic") {
    if (p.group === "bonding" || p.group === "friction") return "primary";
    if (p.group === "energy") return "supporting";
    return "background";
  }
  if (domain === "partner") {
    if (
      p.group === "bonding" ||
      p.group === "friction" ||
      p.fact_kind === "johu_relation" ||
      p.fact_kind === "element_flow"
    ) {
      return "primary";
    }
    return "supporting";
  }
  if (domain === "work") {
    if (p.fact_kind === "stem_clash" || p.fact_kind === "stem_combine") {
      return "primary";
    }
    if (p.group === "friction") return "supporting";
    return "background";
  }
  if (domain === "friend") {
    if (p.fact_kind === "johu_relation" || p.group === "bonding") return "primary";
    return "supporting";
  }
  // family
  if (p.group === "friction" || p.fact_kind === "element_flow") return "primary";
  return "supporting";
}

/**
 * Apply a domain lens to shared Pair CE output.
 * Packets are shallow-copied by reference (immutable fact fields).
 */
export function applyDomainPairLens(
  domain: DomainPairLensId,
  ce: PairContextEngineOutput,
): DomainPairLensOutput {
  const allow = kindsFor(domain);
  const packets = ce.packets.filter((p) => allow.has(p.fact_kind));
  return {
    domain,
    packets,
    framing: packets.map((p) => ({
      packet_id: p.packet_id,
      relevance: relevance(domain, p),
      frame_tag: frameTag(domain, p),
    })),
    source_ce_version: String(ce.schema_version),
    source_pair_fact_version: ce.facts.schema_version,
  };
}

export function applyRomanticPairLens(ce: PairContextEngineOutput) {
  return applyDomainPairLens("romantic", ce);
}
export function applyPartnerPairLens(ce: PairContextEngineOutput) {
  return applyDomainPairLens("partner", ce);
}
export function applyFriendPairLens(ce: PairContextEngineOutput) {
  return applyDomainPairLens("friend", ce);
}
export function applyFamilyPairLens(ce: PairContextEngineOutput) {
  return applyDomainPairLens("family", ce);
}
export function applyWorkPairLens(ce: PairContextEngineOutput) {
  return applyDomainPairLens("work", ce);
}

/** Non-tension packets for Romantic special/bond surfaces. */
export function romanticNonTensionPackets(
  lens: DomainPairLensOutput,
): PairContextPacket[] {
  return lens.packets.filter(
    (p) =>
      p.group === "bonding" ||
      p.group === "energy" ||
      p.fact_kind === "branch_trio" ||
      p.fact_kind === "gongmang_shared",
  );
}
