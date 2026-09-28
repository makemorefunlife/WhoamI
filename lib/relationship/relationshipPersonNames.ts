import { getMessages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/locale";
import { isGenericPartnerName } from "@/lib/relationship/resolvePartnerDisplayName";
import { sanitizeDisplayNameInput } from "@/lib/report/displayNameInput";

/**
 * THE canonical person-name rule for the Relationship product. Every server
 * path that shows or sends a participant's name (report page, generation
 * prompts, hub list) resolves through here; downstream code receives stable
 * `meDisplayName` / `otherDisplayName` values and never picks between a
 * nickname and "Partner" / "상대" on its own.
 *
 * ME
 *   1. my account nickname (Clerk publicMetadata.displayName -- the value
 *      Account -> display name edits; see app/api/account/display-name)
 *   2. my report's name (reports.name, legacy nickname location)
 *   3. my Clerk full name, then first name
 *   4. locale fallback: "Me" / "나"
 *
 * OTHER person
 *   1. my own override for them -- for a manually added person
 *      (partner_manual) reports.name IS the name I gave them (editable via
 *      /api/relationship/partner-name). No other override system exists.
 *   2. otherwise their own nickname: their Clerk account display name
 *      (publicMetadata.displayName -> full name -> first name, as returned by
 *      resolveClerkDisplayNamesByUserId), then their reports.name
 *   3. locale fallback: "Partner" / "상대"
 *
 * Names are returned exactly as stored (trimmed only): emoji, Japanese,
 * Arabic, Korean and any other Unicode nickname is preserved, never
 * translated or replaced. Only empty values and known placeholder labels
 * (isGenericPartnerName) fall through to the next source.
 */

export type RelationshipFallbackNames = { me: string; other: string };

export function relationshipFallbackNames(locale: Locale | string): RelationshipFallbackNames {
  const m = getMessages(locale === "en-US" ? "en-US" : "ko-KR").report;
  return { me: m.meFallbackLabel, other: m.partnerFallbackLabel };
}

function usable(name: string | null | undefined): string | null {
  const t = sanitizeDisplayNameInput(name ?? null);
  return t && !isGenericPartnerName(t) ? t : null;
}

export function resolveMeDisplayName(params: {
  /** Clerk publicMetadata.displayName of the viewer (raw). */
  accountDisplayName?: unknown;
  reportName?: string | null;
  clerkFullName?: string | null;
  clerkFirstName?: string | null;
  locale: Locale | string;
}): string {
  const account =
    typeof params.accountDisplayName === "string" ? usable(params.accountDisplayName) : null;
  return (
    account ??
    usable(params.reportName) ??
    usable(params.clerkFullName) ??
    usable(params.clerkFirstName) ??
    relationshipFallbackNames(params.locale).me
  );
}

export function resolveOtherDisplayName(params: {
  /** True for a manually added person (reports.report_type === "partner_manual"). */
  isManualPartner: boolean;
  /** The other person's reports.name (my override when isManualPartner). */
  reportName?: string | null;
  /** Their own Clerk account display name (never passed for a manual partner). */
  accountDisplayName?: string | null;
  locale: Locale | string;
}): string {
  return resolveOtherNameOrEmpty(params) || relationshipFallbackNames(params.locale).other;
}

/**
 * Same precedence as resolveOtherDisplayName, but returns "" instead of a
 * locale fallback -- for results cached without a locale (the relationship
 * map), where the fallback is filled in per request. An optional name from
 * an analysis-log snapshot is used only when no canonical source has a real
 * name and it is not a stored placeholder.
 */
export function resolveOtherNameOrEmpty(params: {
  isManualPartner: boolean;
  reportName?: string | null;
  accountDisplayName?: string | null;
  logName?: string | null;
}): string {
  const canonical = params.isManualPartner
    ? usable(params.reportName)
    : (usable(params.accountDisplayName) ?? usable(params.reportName));
  if (canonical) return canonical;
  const log = usable(params.logName);
  return log && !isStoredPlaceholderName(log) ? log : "";
}

/**
 * True for any placeholder that may have been STORED in place of a name --
 * the generic Korean labels plus every locale's fallback ("Partner", "Me",
 * "상대", "나") and the old slot labels. Used only to decide whether a
 * stored/snapshot name is a real name; never applied to live account names.
 */
export function isStoredPlaceholderName(name: string | null | undefined): boolean {
  const t = name?.trim() ?? "";
  if (isGenericPartnerName(t)) return true;
  const en = relationshipFallbackNames("en-US");
  const ko = relationshipFallbackNames("ko-KR");
  return [en.me, en.other, ko.me, ko.other, "Person A", "Person B", "the parent", "the child", "부모", "자녀"].includes(t);
}

/** Current canonical names per report slot (report_id_a / report_id_b). */
export function slotDisplayNames(params: {
  viewerIsReportA: boolean;
  meDisplayName: string;
  otherDisplayName: string;
}): { a: string; b: string } {
  return params.viewerIsReportA
    ? { a: params.meDisplayName, b: params.otherDisplayName }
    : { a: params.otherDisplayName, b: params.meDisplayName };
}
