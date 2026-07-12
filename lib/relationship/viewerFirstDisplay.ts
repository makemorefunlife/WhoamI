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

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const REPORT_SLOT_PARTICLES =
  "(와 함께|과 함께|에게|는|가|의|와|과|를|을)";

/** LLM 본문의 A/B 슬롯 → 실제 닉네임 (comparison_table 열 슬롯과 동일) */
export function applyReportSlotNames(
  text: string,
  nameA: string,
  nameB: string,
): string {
  if (!text?.trim() || (!nameA?.trim() && !nameB?.trim())) return text;
  const a = nameA.trim();
  const b = nameB.trim();
  let out = text;

  if (a && b) {
    out = out.replace(/A\s*\+\s*B/g, `${a} + ${b}`);
    out = out.replace(/B\s*\+\s*A/g, `${b} + ${a}`);
    out = out.replace(/A와\s+B/g, `${a}와 ${b}`);
    out = out.replace(/B와\s+A/g, `${b}와 ${a}`);
  }

  if (a) {
    out = out.replace(
      new RegExp(`A${REPORT_SLOT_PARTICLES}`, "g"),
      (_, particle) => `${a}${particle}`,
    );
  }
  if (b) {
    out = out.replace(
      new RegExp(`B${REPORT_SLOT_PARTICLES}`, "g"),
      (_, particle) => `${b}${particle}`,
    );
  }

  if (a) {
    out = out.replace(/(?<![가-힣A-Za-z])A(?![가-힣A-Za-z])/g, a);
  }
  if (b) {
    out = out.replace(/(?<![가-힣A-Za-z])B(?![가-힣A-Za-z])/g, b);
  }

  return out;
}

/** 저장된 리포트·LLM 본문의 더미·레거시 이름 → 나/상대 표시명 */
export function buildRomanticNameReplacements(ctx: {
  myName: string;
  partnerName: string;
  personAName: string;
  personBName: string;
  viewerIsReportA: boolean;
}): Array<[string, string]> {
  const { myName, partnerName, personAName, personBName, viewerIsReportA } =
    ctx;
  const pairs: Array<[string, string]> = [
    ["두 번째 사람", partnerName],
    ["첫 번째 사람", myName],
    ["두번째 사람", partnerName],
    ["첫번째 사람", myName],
    ["상대방", partnerName],
    ["상대", partnerName],
    ["탐사자", partnerName],
  ];

  const mapSlot = (slotName: string, reportSlot: "A" | "B") => {
    const from = slotName?.trim();
    if (!from || isGenericPartnerName(from)) return;
    const to =
      reportSlot === "A"
        ? viewerIsReportA
          ? myName
          : partnerName
        : viewerIsReportA
          ? partnerName
          : myName;
    if (from !== to) pairs.push([from, to]);
  };

  mapSlot(personAName, "A");
  mapSlot(personBName, "B");

  return pairs;
}

export function applyRomanticDisplayNames(
  text: string,
  replacements: Array<[string, string]>,
): string {
  if (!text?.trim()) return "";
  let out = text;
  const seen = new Set<string>();

  for (const [from, to] of replacements) {
    const key = `${from}→${to}`;
    if (!from || !to || from === to || seen.has(key)) continue;
    seen.add(key);
    out = out.replace(new RegExp(escapeRegExp(from), "g"), to);
  }

  return out;
}
