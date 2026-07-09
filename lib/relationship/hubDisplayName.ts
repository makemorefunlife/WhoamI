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

/** 관계 행 병합 시 localStorage 표시 이름 이전 */
export function migrateHubDisplayNames(idMap: Record<string, string>): void {
  if (typeof window === "undefined") return;
  for (const [fromId, toId] of Object.entries(idMap)) {
    if (!fromId || !toId || fromId === toId) continue;
    const saved = localStorage.getItem(hubDisplayNameKey(fromId))?.trim();
    if (saved && !localStorage.getItem(hubDisplayNameKey(toId))?.trim()) {
      localStorage.setItem(hubDisplayNameKey(toId), saved);
    }
    localStorage.removeItem(hubDisplayNameKey(fromId));
  }
}

export function friendInitials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  if (t.length <= 2) return t;
  return t.slice(0, 2);
}

/** 레거시 localStorage 별명 캐시 제거 — 친구 이름은 DB SSOT */
export function clearLegacyHubDisplayNames(): void {
  if (typeof window === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) toRemove.push(key);
  }
  for (const key of toRemove) localStorage.removeItem(key);
}
