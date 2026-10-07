import type { Locale } from "@/lib/i18n/locale";
import { getRelationshipRoleById } from "./relationshipRoleSsot";
import { roleDescription, roleLabel } from "./roleLocale";

/**
 * Relationship Discovery -- "who is who to whom" copy for the popups and the
 * hub card. Pure composer on top of the role SSOT (labels + meanings) and
 * the existing relationshipMap sentence templates, so the popup says exactly
 * what the Relation Map's person panel says.
 */
export type DiscoveryRoleSentences = {
  discoveryOtherRoleSentence: (partnerName: string, roleLabel: string) => string;
  discoveryViewerRoleSentence: (partnerName: string, roleLabel: string) => string;
};

export type DiscoveryRoleLine = { sentence: string; meaning: string };

export type DiscoveryRoleText = {
  /** "{partner} is your {role}." + what that role means. */
  other: DiscoveryRoleLine | null;
  /** "You are {partner}'s {role}." + what that role means. */
  viewer: DiscoveryRoleLine | null;
};

function line(
  roleId: string | null | undefined,
  locale: Locale,
  make: (label: string) => string,
): DiscoveryRoleLine | null {
  if (!roleId) return null;
  const role = getRelationshipRoleById(roleId);
  if (!role) return null;
  return { sentence: make(roleLabel(role, locale)), meaning: roleDescription(role, locale) };
}

/** Returns null when no direction can be resolved (caller keeps its generic copy). */
export function buildDiscoveryRoleText(input: {
  locale: Locale;
  partnerName: string;
  roleId?: string | null;
  reciprocalRoleId?: string | null;
  messages: DiscoveryRoleSentences;
}): DiscoveryRoleText | null {
  const { locale, partnerName, messages } = input;
  const other = line(input.roleId, locale, (l) =>
    messages.discoveryOtherRoleSentence(partnerName, l),
  );
  const viewer = line(input.reciprocalRoleId, locale, (l) =>
    messages.discoveryViewerRoleSentence(partnerName, l),
  );
  if (!other && !viewer) return null;
  return { other, viewer };
}

/** Plain-text body for the modal (one string, line breaks between lines). */
export function discoveryRoleTextToBody(text: DiscoveryRoleText): string {
  return [text.other, text.viewer]
    .filter((l): l is DiscoveryRoleLine => l != null)
    .map((l) => `${l.sentence}\n${l.meaning}`)
    .join("\n\n");
}

/** Client fetch of the focused pair's two role ids; null on any failure. */
export async function fetchDiscoveryRoleIds(
  reportId: string,
  relationshipReportId: string,
): Promise<{ roleId: string | null; reciprocalRoleId: string | null } | null> {
  try {
    const res = await fetch(
      `/api/relationship/map?reportId=${encodeURIComponent(reportId)}&focusRelationshipReportId=${encodeURIComponent(relationshipReportId)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as {
      focusPerson?: { roleId?: string; reciprocalRoleId?: string };
    } | null;
    const fp = data?.focusPerson;
    if (!fp) return null;
    return { roleId: fp.roleId ?? null, reciprocalRoleId: fp.reciprocalRoleId ?? null };
  } catch {
    return null;
  }
}
