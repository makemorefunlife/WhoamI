/**
 * Phase 6 — Resolver-centric Context Engine (minimal shared contract).
 * Runtime identity = resolver/composite export name + persistence path.
 * No Question Registry. Domain result types stay domain-local.
 */

export type PsychMode =
  | "none"
  | "context_only"
  | "confirm_only"
  | "soft"
  | "primary";

/**
 * Thin envelope around a domain-local finalized judgment.
 * `value` is the only product answer consumers may read.
 */
export type CanonicalJudgment<TValue, TMeta = undefined> = {
  value: TValue;
  /** Composite or resolver export name, e.g. refineLeadershipRoleSplit */
  source: string;
  psychMode: PsychMode;
  confidence?: "high" | "low" | number;
  align?: "confirms" | "caution";
  /** Pre-composite base, when applicable */
  base?: TValue;
  meta?: TMeta;
  /** Saved JSON path relative to report body, e.g. office.section_roles.leadership_split */
  persistencePath?: string;
  compareRowId?: string;
};
