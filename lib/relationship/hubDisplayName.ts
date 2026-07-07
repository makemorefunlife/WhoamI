const PREFIX = "ahaitsme_partner_display_";

export function hubDisplayNameKey(relationshipReportId: string): string {
  return `${PREFIX}${relationshipReportId}`;
}

export function readHubDisplayName(
  relationshipReportId: string,
  fallback: string,
): string {
  if (typeof window === "undefined") return fallback;
  const saved = localStorage
    .getItem(hubDisplayNameKey(relationshipReportId))
    ?.trim();
  return saved || fallback;
}

export function writeHubDisplayName(
  relationshipReportId: string,
  name: string,
): void {
  if (typeof window === "undefined") return;
  const trimmed = name.trim().slice(0, 10);
  if (!trimmed) {
    localStorage.removeItem(hubDisplayNameKey(relationshipReportId));
    return;
  }
  localStorage.setItem(hubDisplayNameKey(relationshipReportId), trimmed);
}

export function friendInitials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  if (t.length <= 2) return t;
  return t.slice(0, 2);
}
