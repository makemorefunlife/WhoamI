const GENERIC_PARTNER_NAMES = new Set([
  "상대",
  "상대방",
  "탐사자",
  "친구",
  "나",
  "A",
  "B",
]);

const DEV_PLACEHOLDER_NAME = /^(첫|두)\s*번째(\s*사람)?$/;

/** No real display name is ever this long — a report headline/synthesis
 * sentence mistakenly read as a "name" (see partnerNameFromLogSnapshot's
 * removed `report.headline` fallback) would fail here even if some future
 * field makes the same mistake. */
const MAX_PLAUSIBLE_NAME_LENGTH = 30;

export function isGenericPartnerName(name: string | null | undefined): boolean {
  const t = name?.trim() ?? "";
  if (!t || GENERIC_PARTNER_NAMES.has(t)) return true;
  if (DEV_PLACEHOLDER_NAME.test(t)) return true;
  if (t.length > MAX_PLAUSIBLE_NAME_LENGTH) return true;
  return false;
}

/** DB reports.name — 빈 값·더미 라벨이면 null */
export function partnerNameFromReportRow(
  name: string | null | undefined,
): string | null {
  const t = name?.trim() ?? "";
  if (isGenericPartnerName(t)) return null;
  return t;
}

/** analysis log 스냅샷에서 상대 이름 추출 시도 */
export function partnerNameFromLogSnapshot(
  snapshot: Record<string, unknown> | null | undefined,
): string | null {
  if (!snapshot || typeof snapshot !== "object") return null;

  const report = snapshot.report as Record<string, unknown> | undefined;
  if (report && typeof report === "object") {
    const s1 = report.section_1_summary as Record<string, unknown> | undefined;
    const fromRomantic = s1?.relationship_name;
    if (typeof fromRomantic === "string" && !isGenericPartnerName(fromRomantic)) {
      return fromRomantic.trim();
    }
    // `report.headline` used to be tried here too, but a report's headline
    // is always a narrative sentence/synthesis line (e.g. "Speed-First Risk
    // Manager and The Data-Driven Realist — a complementary combo..."),
    // never a person's name, for every relationship kind's report shape.
    // The length guard in isGenericPartnerName now also catches this class
    // of mistake generically, but the fallback itself was never correct.
  }

  const perspective = snapshot.perspective as Record<string, unknown> | undefined;
  const partnerLabel = perspective?.partner_label ?? perspective?.partner_name;
  if (typeof partnerLabel === "string" && !isGenericPartnerName(partnerLabel)) {
    return partnerLabel.trim();
  }

  return null;
}

export function resolvePartnerDisplayName(
  reportName: string | null | undefined,
  logName: string | null | undefined,
  fallback = "친구",
): string {
  const fromReport = partnerNameFromReportRow(reportName);
  if (fromReport) return fromReport;
  const fromLog = logName?.trim();
  if (fromLog && !isGenericPartnerName(fromLog)) return fromLog;
  return fallback;
}
