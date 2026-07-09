import { isGenericPartnerName } from "@/lib/relationship/resolvePartnerDisplayName";

export type ViewerFirstContext = {
  viewerIsReportA: boolean;
  myName: string;
  partnerName: string;
  personAName: string;
  personBName: string;
};

/** 로그인·리포트 이름 — 더미 라벨 대신 실제 표시명 */
export function resolveViewerDisplayName(options: {
  reportName?: string | null;
  clerkFirstName?: string | null;
  clerkFullName?: string | null;
  fallback?: string;
}): string {
  const fromReport = options.reportName?.trim();
  if (fromReport && !isGenericPartnerName(fromReport)) return fromReport;

  const fromClerk =
    options.clerkFirstName?.trim() ||
    options.clerkFullName?.trim()?.split(/\s+/)[0];
  if (fromClerk && !isGenericPartnerName(fromClerk)) return fromClerk;

  return options.fallback?.trim() || "나";
}

export function buildViewerFirstContext(params: {
  viewerReportId: string;
  reportIdA: string;
  reportIdB: string;
  personAName: string;
  personBName: string;
  viewerName: string;
  partnerName: string;
}): ViewerFirstContext {
  const viewerIsReportA = params.viewerReportId === params.reportIdA;
  return {
    viewerIsReportA,
    myName: params.viewerName,
    partnerName: params.partnerName,
    personAName: params.personAName,
    personBName: params.personBName,
  };
}

/** report_id_a/b 슬롯 → 나(뷰어) / 상대 */
export function pickViewerFirstPair<T>(
  personA: T,
  personB: T,
  viewerIsReportA: boolean,
): { me: T; partner: T } {
  return viewerIsReportA
    ? { me: personA, partner: personB }
    : { me: personB, partner: personA };
}
