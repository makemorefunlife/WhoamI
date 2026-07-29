import {
  REF_EARTHLY_BRANCHES,
  REF_HEAVENLY_STEMS,
  REF_SHINSAL,
  REF_TEN_GODS,
  REF_TWELVE_STAGES,
} from "@/lib/hardcoded/sajuReferenceData";
import type {
  BranchRef,
  ElementCode,
  StemRef,
  TenGodCategory,
  TenGodRef,
  TwelveStageRef,
  YinYang,
} from "./types";

export function stemReferenceId(code: string): string {
  return `stem:${code}`;
}

export function branchReferenceId(code: string): string {
  return `branch:${code}`;
}

export function tenGodReferenceId(code: string): string {
  return `ten_god:${code}`;
}

export function twelveStageReferenceId(code: string): string {
  return `twelve_stage:${code}`;
}

export function shinsalReferenceId(numericId: number | string): string {
  return `shinsal:${numericId}`;
}

export function relationReferenceId(numericId: number | string): string {
  return `relation:${numericId}`;
}

export function hiddenStemReferenceId(
  branchCode: string,
  stemCode: string,
  layer: string,
): string {
  return `hidden_stem:${branchCode}:${stemCode}:${layer}`;
}

export function shinsalSlug(nameKo: string): string {
  return nameKo.trim().replace(/\s+/g, "_");
}

export function toStemRef(code: string): StemRef {
  const row = REF_HEAVENLY_STEMS.find((r) => r.code === code);
  return {
    code,
    element: (row?.element as ElementCode) ?? "earth",
    yin_yang: (row?.yin_yang as YinYang) ?? "yang",
    reference_id: stemReferenceId(code),
  };
}

export function toBranchRef(code: string): BranchRef {
  const row = REF_EARTHLY_BRANCHES.find((r) => r.code === code);
  return {
    code,
    element: (row?.element as ElementCode) ?? "earth",
    yin_yang: (row?.yin_yang as YinYang) ?? "yang",
    season: (row?.season as BranchRef["season"]) ?? null,
    reference_id: branchReferenceId(code),
  };
}

export function toTenGodRef(code: string): TenGodRef {
  const row = REF_TEN_GODS.find((r) => r.code === code);
  const category = (row?.category as TenGodCategory) ?? "self";
  return {
    code,
    category,
    reference_id: tenGodReferenceId(code),
  };
}

export function toTwelveStageRef(code: string): TwelveStageRef {
  const row = REF_TWELVE_STAGES.find((r) => r.code === code) as
    | { energy_level?: string | null }
    | undefined;
  return {
    code,
    energy_level:
      typeof row?.energy_level === "string" ? row.energy_level : null,
    reference_id: twelveStageReferenceId(code),
  };
}

export function findShinsalNumericId(nameKo: string): number | null {
  const row = REF_SHINSAL.find((r) => r.name_ko === nameKo);
  return row?.id ?? null;
}
