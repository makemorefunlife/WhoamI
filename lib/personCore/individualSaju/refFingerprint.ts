import { createHash } from "crypto";
import {
  REF_EARTHLY_BRANCHES,
  REF_HEAVENLY_STEMS,
  REF_HIDDEN_STEMS,
  REF_RELATION_RULES,
  REF_SHINSAL,
  REF_TEN_GOD_RULES,
  REF_TEN_GODS,
  REF_TWELVE_STAGE_RULES,
  REF_TWELVE_STAGES,
} from "@/lib/hardcoded/sajuReferenceData";

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(v as object).sort()) {
        sorted[key] = (v as Record<string, unknown>)[key];
      }
      return sorted;
    }
    return v;
  });
}

/** Fingerprint of hardcoded REF tables — SSOT provenance. */
export function computeRefDataFingerprint(): string {
  const payload = {
    stems: REF_HEAVENLY_STEMS.map((r) => r.code),
    branches: REF_EARTHLY_BRANCHES.map((r) => r.code),
    hidden: REF_HIDDEN_STEMS.map(
      (r) => `${r.branch_code}:${r.stem_code}:${r.layer_type}`,
    ),
    tenGods: REF_TEN_GODS.map((r) => r.code),
    tenGodRules: REF_TEN_GOD_RULES.length,
    twelveStages: REF_TWELVE_STAGES.map((r) => r.code),
    twelveStageRules: REF_TWELVE_STAGE_RULES.length,
    shinsal: REF_SHINSAL.map((r) => r.id),
    relations: REF_RELATION_RULES.map((r) => r.id),
  };
  return createHash("sha256").update(stableJson(payload), "utf8").digest("hex");
}
