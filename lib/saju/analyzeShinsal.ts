import { REF_SHINSAL } from "@/lib/hardcoded/sajuReferenceData";
import type { ChartContext } from "@/lib/saju/chartContext";
import {
  codesToHangulPillar,
  hanjaBranchesToCodes,
  hanjaStemsToCodes,
} from "@/lib/saju/mapping";

export type ShinsalHit = {
  name_ko: string;
  name_hanja: string | null;
  category: string | null;
  meaning_ko: string | null;
  strength_ko: string | null;
  weakness_ko: string | null;
  advice_ko: string | null;
};

type ShinsalRow = {
  name_ko: string;
  name_hanja: string | null;
  category: string | null;
  calculation_type: string;
  calculation_value: string | null;
  target_branch: string | null;
  meaning_ko: string | null;
  strength_ko: string | null;
  weakness_ko: string | null;
  advice_ko: string | null;
  display_order: number | null;
};

function parseGroupedBranchRules(
  value: string,
): { group: string[]; target: string }[] {
  return value.split(",").map((part) => {
    const [groupRaw, targetRaw] = part.split(":").map((s) => s.trim());
    return {
      group: hanjaBranchesToCodes(groupRaw ?? ""),
      target: hanjaBranchesToCodes(targetRaw ?? "")[0] ?? "",
    };
  });
}

function parseGroupedStemRules(
  value: string,
): { stems: string[]; targets: string[] }[] {
  return value.split(",").map((part) => {
    const [stemsRaw, targetsRaw] = part.split(":").map((s) => s.trim());
    const targets = targetsRaw?.includes(",")
      ? targetsRaw.split(",").flatMap((t) => hanjaBranchesToCodes(t.trim()))
      : hanjaBranchesToCodes(targetsRaw ?? "").length
        ? hanjaBranchesToCodes(targetsRaw ?? "")
        : hanjaStemsToCodes(targetsRaw ?? "");
    return {
      stems: hanjaStemsToCodes(stemsRaw ?? ""),
      targets,
    };
  });
}

function parseSingleStemBranchRules(
  value: string,
): { stem: string; target: string }[] {
  return value.split(",").map((part) => {
    const [stemRaw, targetRaw] = part.split(":").map((s) => s.trim());
    const stem = hanjaStemsToCodes(stemRaw ?? "")[0] ?? "";
    const targetBranch = hanjaBranchesToCodes(targetRaw ?? "")[0];
    const targetStem = hanjaStemsToCodes(targetRaw ?? "")[0];
    return { stem, target: targetBranch || targetStem };
  });
}

function parseBranchPairs(value: string): { a: string; b: string }[] {
  return value.split(",").map((part) => {
    const [aRaw, bRaw] = part.split(":").map((s) => s.trim());
    return {
      a: hanjaBranchesToCodes(aRaw ?? "")[0] ?? "",
      b: hanjaBranchesToCodes(bRaw ?? "")[0] ?? "",
    };
  });
}

function matchesShinsal(chart: ChartContext, row: ShinsalRow): boolean {
  const value = row.calculation_value?.trim();
  if (!value) return false;

  switch (row.calculation_type) {
    case "day_stem": {
      if (value.includes(":") && value.includes(",")) {
        const rules = parseGroupedStemRules(value);
        return rules.some(
          (r) =>
            r.stems.includes(chart.dayStemCode) &&
            r.targets.some((t) => chart.branchCodes.has(t) || chart.stemCodes.has(t)),
        );
      }
      const singles = parseSingleStemBranchRules(value);
      return singles.some((r) => {
        if (r.stem !== chart.dayStemCode) return false;
        return chart.branchCodes.has(r.target) || chart.stemCodes.has(r.target);
      });
    }

    case "month_branch": {
      const parts = value.split(",").map((p) => p.trim());
      return parts.some((part) => {
        const [groupRaw, targetRaw] = part.split(":").map((s) => s.trim());
        const group = hanjaBranchesToCodes(groupRaw ?? "");
        const targetStems = hanjaStemsToCodes(targetRaw ?? "");
        if (!group.includes(chart.monthBranchCode)) return false;
        return targetStems.some((s) => chart.stemCodes.has(s));
      });
    }

    case "year_branch": {
      const rules = parseGroupedBranchRules(value);
      return rules.some(
        (r) =>
          r.group.includes(chart.yearBranchCode) &&
          chart.branchCodes.has(r.target),
      );
    }

    case "day_branch": {
      const singles = parseSingleStemBranchRules(value);
      return singles.some(
        (r) =>
          r.stem === chart.dayStemCode && chart.branchCodes.has(r.target),
      );
    }

    case "branch_pair": {
      const pairs = parseBranchPairs(value);
      return pairs.some(
        (p) => chart.branchCodes.has(p.a) && chart.branchCodes.has(p.b),
      );
    }

    case "three_combination":
    case "three_combination_end":
    case "three_combination_mid":
    case "three_combination_start": {
      const rules = parseGroupedBranchRules(value);
      return rules.some(
        (r) =>
          r.group.includes(chart.yearBranchCode) &&
          chart.branchCodes.has(r.target),
      );
    }

    case "fixed_branch": {
      if (value.includes(":")) {
        const [groupRaw] = value.split(":");
        const group = hanjaBranchesToCodes(groupRaw.trim());
        const count = group.filter((c) => chart.branchCodes.has(c)).length;
        return count >= 3;
      }
      const pillars = value.split(",").map((p) => p.trim());
      return pillars.some((hanja) => {
        const stem = hanjaStemsToCodes(hanja.slice(0, 1))[0];
        const branch = hanjaBranchesToCodes(hanja.slice(1, 2))[0];
        if (!stem || !branch) return false;
        return codesToHangulPillar(stem, branch) === chart.dayPillar;
      });
    }

    default:
      return false;
  }
}

export function analyzeShinsal(chart: ChartContext): ShinsalHit[] {
  const hits: ShinsalHit[] = [];
  const rows = [...REF_SHINSAL].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );

  for (const row of rows as ShinsalRow[]) {
    if (!matchesShinsal(chart, row)) continue;
    hits.push({
      name_ko: row.name_ko,
      name_hanja: row.name_hanja,
      category: row.category,
      meaning_ko: row.meaning_ko,
      strength_ko: row.strength_ko,
      weakness_ko: row.weakness_ko,
      advice_ko: row.advice_ko,
    });
  }

  return hits;
}
