import type { HomeLifeFamilyCategory } from "../types/psychMaster";
import type { TenGodCounts } from "@/lib/relationship/marriage/marriageTenGodAnalysis";
import { profileTenGods } from "@/lib/relationship/marriage/marriageTenGodAnalysis";

/** `homeLifeLanguage.dominantFamilyCategory` 와 동일 규칙 (레거시 비수정 복제) */
export function resolveHomeLifeFamilyCategory(
  counts: TenGodCounts,
): HomeLifeFamilyCategory {
  const p = profileTenGods(counts);
  const ranked = [
    { key: "wealth" as const, score: p.wealthOfficer },
    { key: "food" as const, score: p.food },
    { key: "seal" as const, score: p.seal },
    { key: "self" as const, score: p.self },
  ].sort((a, b) => b.score - a.score);
  const top = ranked[0]!;
  if (top.score <= 1) return "balanced";
  if (top.key === "wealth" && p.officer >= 2) return "officer";
  return top.key;
}
