/**
 * Phase 6-2d4 — Romantic unconscious_role_play canonical → client projection.
 *
 * Chain:
 *   collectRomanticDynamicsTypedSnapshot
 *   → dominant_categories.role_*
 *   → buildRomanticRolePlayCanonical(finalized)
 *   → buildRomanticRolePlayClientProjection(value)
 *   → injectRomanticRolePlayClientProjection(report, projection)
 *   → UI badge; LLM headline/body = explanation only
 *
 * primary/saju/agrees = facets of one product judgment.
 * Does not include saju_frame_direction. Does not call resolvers.
 */
import type { CanonicalJudgment } from "@/lib/relationship/contextEngine/canonicalJudgment";
import type { RolePlayBand } from "@/lib/relationship/romanticRules/relationshipDynamics";
import type {
  RomanticContextDominantCategory,
  RomanticDynamicsTypedSnapshot,
} from "./romanticContextInput";

export const ROMANTIC_ROLE_PLAY_CANONICAL_SOURCE =
  "collectRomanticDynamicsTypedSnapshot" as const;

export const ROMANTIC_ROLE_PLAY_PERSISTENCE_PATH =
  "romantic_context_input.dominant_categories" as const;

export const ROMANTIC_ROLE_PLAY_CLIENT_PATH =
  "canonical_projections.unconscious_role_play" as const;

export const ROMANTIC_ROLE_PLAY_PSYCH_MODE = "none" as const;

const ROLE_BANDS = new Set<RolePlayBand>([
  "peer",
  "savior_dependent",
  "mentor_student",
  "parent_child",
]);
const AGREES_CATEGORIES = new Set(["agrees", "differs"]);

export type RomanticRolePlayValue = {
  primary_frame: RolePlayBand;
  saju_frame: RolePlayBand;
  agrees: boolean;
};

export type RomanticRolePlayCanonical =
  CanonicalJudgment<RomanticRolePlayValue>;

function asRoleBand(v: unknown): RolePlayBand | null {
  return typeof v === "string" && ROLE_BANDS.has(v as RolePlayBand)
    ? (v as RolePlayBand)
    : null;
}

function asAgreesBoolean(v: unknown): boolean | null {
  if (typeof v !== "string" || !AGREES_CATEGORIES.has(v)) return null;
  return v === "agrees";
}

function cloneRolePlayValue(v: RomanticRolePlayValue): RomanticRolePlayValue {
  return {
    primary_frame: v.primary_frame,
    saju_frame: v.saju_frame,
    agrees: v.agrees,
  };
}

/** Map typed dynamics snapshot → finalized role-play value. */
export function rolePlayValueFromDynamicsSnapshot(
  d: RomanticDynamicsTypedSnapshot,
): RomanticRolePlayValue {
  return {
    primary_frame: d.rolePlay.primaryFrame,
    saju_frame: d.rolePlay.sajuFrame,
    agrees: d.rolePlay.agrees,
  };
}

/** Map context dominant_categories → finalized value (null if incomplete). */
export function rolePlayValueFromDominantCategories(
  cats: Record<string, RomanticContextDominantCategory> | null | undefined,
): RomanticRolePlayValue | null {
  if (!cats) return null;
  const primary_frame = asRoleBand(cats.role_primary?.category);
  const saju_frame = asRoleBand(cats.role_saju?.category);
  const agrees = asAgreesBoolean(cats.role_agrees?.category);
  if (!primary_frame || !saju_frame || agrees == null) {
    return null;
  }
  return {
    primary_frame,
    saju_frame,
    agrees,
  };
}

/**
 * Wrap an already-finalized role-play judgment.
 * Does not call resolvers, read signals/psych, or alter fields.
 */
export function buildRomanticRolePlayCanonical(
  finalized: RomanticRolePlayValue | null | undefined,
): RomanticRolePlayCanonical | null {
  if (!finalized) return null;
  return {
    value: cloneRolePlayValue(finalized),
    source: ROMANTIC_ROLE_PLAY_CANONICAL_SOURCE,
    psychMode: ROMANTIC_ROLE_PLAY_PSYCH_MODE,
    persistencePath: ROMANTIC_ROLE_PLAY_PERSISTENCE_PATH,
  };
}

/** Client-safe typed fields only — no localization, prose, or direction. */
export function buildRomanticRolePlayClientProjection(
  value: RomanticRolePlayValue | null | undefined,
): RomanticRolePlayValue | null {
  if (!value) return null;
  return cloneRolePlayValue(value);
}

type ReportWithCanonicalProjections = {
  canonical_projections?: {
    unconscious_role_play?: unknown;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Immutable inject of server role-play projection.
 * Preserves balance_of_power, recovery_speed, reassurance_signal, and other keys.
 */
export function injectRomanticRolePlayClientProjection<
  T extends ReportWithCanonicalProjections,
>(
  report: T,
  projection: RomanticRolePlayValue | null | undefined,
): T {
  const { canonical_projections: priorProjections, ...rest } = report;
  const priorRest =
    priorProjections && typeof priorProjections === "object"
      ? Object.fromEntries(
          Object.entries(priorProjections).filter(
            ([k]) => k !== "unconscious_role_play",
          ),
        )
      : {};

  if (!projection) {
    if (Object.keys(priorRest).length === 0) {
      return rest as T;
    }
    return {
      ...(rest as T),
      canonical_projections: priorRest,
    };
  }

  return {
    ...(rest as T),
    canonical_projections: {
      ...priorRest,
      unconscious_role_play: cloneRolePlayValue(projection),
    },
  };
}

export function rolePlayJudgmentFields(
  v: RomanticRolePlayValue | null | undefined,
): RomanticRolePlayValue | null {
  if (!v) return null;
  return cloneRolePlayValue(v);
}

/** Parse client projection; malformed → null (never invent from prose). */
export function readRomanticRolePlayCanonicalProjection(
  report:
    | { canonical_projections?: { unconscious_role_play?: unknown } }
    | null
    | undefined,
): RomanticRolePlayValue | null {
  const raw = report?.canonical_projections?.unconscious_role_play;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const primary_frame = asRoleBand(o.primary_frame);
  const saju_frame = asRoleBand(o.saju_frame);
  if (!primary_frame || !saju_frame) return null;
  if (typeof o.agrees !== "boolean") return null;
  return {
    primary_frame,
    saju_frame,
    agrees: o.agrees,
  };
}

function frameLabel(band: RolePlayBand, locale: "ko" | "en"): string {
  if (locale === "en") {
    if (band === "peer") return "peers";
    if (band === "savior_dependent") return "savior–dependent";
    if (band === "mentor_student") return "mentor–student";
    return "parent–child";
  }
  if (band === "peer") return "단짝";
  if (band === "savior_dependent") return "구원자–의존";
  if (band === "mentor_student") return "사제";
  return "부모–자식";
}

/**
 * Presentation label from typed enums only — never reads LLM prose
 * or saju_frame_direction.
 */
export function formatRomanticRolePlayCanonicalLabel(
  value: RomanticRolePlayValue,
  params: {
    nameA?: string;
    nameB?: string;
    locale?: string | null;
  } = {},
): string {
  const locale =
    params.locale === "en" ||
    params.locale === "en-US" ||
    params.locale?.startsWith("en")
      ? "en"
      : "ko";
  const { primary_frame, saju_frame, agrees } = value;

  if (agrees) {
    return locale === "en"
      ? `${frameLabel(primary_frame, "en")} (aligned)`
      : `${frameLabel(primary_frame, "ko")} (일치)`;
  }
  return locale === "en"
    ? `Psych ${frameLabel(primary_frame, "en")} · Saju ${frameLabel(saju_frame, "en")}`
    : `심리 ${frameLabel(primary_frame, "ko")} · 사주 ${frameLabel(saju_frame, "ko")}`;
}
