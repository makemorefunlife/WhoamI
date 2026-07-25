/**
 * Deterministic post-LLM narrative guards for Business / Partnership only.
 * Skeleton ported from family/married — domain labels are business-specific.
 * Do not import romanticSajuDeep, marriedSajuDeep, or familySajuDeep.
 */

import { polishKoTableCell, polishKoTone } from "../shared/koToneGuards";

type AnyRec = Record<string, unknown>;

const SOFT_WASH_BUSINESS =
  /일이\s*잘\s*안\s*풀려도\s*서로\s*믿으면\s*된다|파트너니까\s*괜찮|사이만\s*좋으면\s*사업은\s*된다|신뢰만\s*있으면\s*된다|다\s*잘될\s*거예|그냥\s*파트너라서\s*괜찮|서로\s*믿으면\s*된다/i;

const GAP_AUDIBLE =
  /어긋|불일치|맞지\s*않|갭|다를\s*수|확인해\s*볼|조율|역할|소유|리스크|보고|핸드오프|의사결정|추진|한도/;

const TENTATIVE_MARKER =
  /보일\s*수\s*있|가능성이\s*있|확인해\s*볼|경향이\s*있|편으로|듯하|수\s*있습니다|가까울/;

const EVIDENCE_BRIDGE =
  /업무\s*경계|역할\s*소유|피드백|시너지|번아웃|회복\s*리듬|리스크|손익|보고|공유\s*리듬|대외\s*리드|내부\s*점검|의사결정|추진\s*속도|권한|위임|잡히기\s*때문에|잡히므로|보이기\s*때문에|어긋날\s*수\s*있어서|같은\s*결|기울기가?\s*다르|다르게\s*잡히/;

const GENERIC_ONLY_ADVICE =
  /서로\s*존중하며\s*소통하세요|서로\s*믿으면\s*된다|감정을\s*솔직히\s*표현하세요|무조건\s*사랑하|설레는\s*연애|특별한\s*에너지|시너지\s*창출이\s*요구/;

const FEWSHOT_TOGETHER_BLEED =
  /가장\s*아름다운\s*조각|따뜻한\s*차\s*한\s*잔을\s*사이에\s*두고|설레는\s*데이트|서로\s*믿으면\s*된다|무조건\s*사랑하는\s*가족이니까/;

const ASPECT_BRIDGE_LABEL: Record<string, string> = {
  boundary: "업무 경계·역할 소유",
  feedback: "피드백 전달·수용",
  synergy_position: "시너지·역할 자리",
  burnout: "번아웃·회복 리듬",
  risk_taking: "리스크 감수",
  reporting_rhythm: "보고·공유 리듬",
  leadership: "대외 리드 / 내부 점검",
};

type LeanRow = {
  band_a?: string | null;
  band_b?: string | null;
  lean_a?: string | null;
  lean_b?: string | null;
  confidence?: string | null;
  align?: string | null;
};

function asObj(v: unknown): AnyRec | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as AnyRec) : null;
}

function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function partnerLabelForSpeaker(otherName: string): string {
  const n = otherName.trim();
  if (!n || n === "나" || n === "저") return "파트너";
  return n;
}

function stripHonorificBans(text: string): { text: string; fixed: boolean } {
  const next = text
    .replace(/나님은/g, "나는")
    .replace(/나님는/g, "나는")
    .replace(/나님이/g, "내가")
    .replace(/나님가/g, "내가")
    .replace(/나님을/g, "나를")
    .replace(/나님를/g, "나를")
    .replace(/나님의/g, "나의")
    .replace(/나님에게/g, "나에게")
    .replace(/나님한테/g, "나한테")
    .replace(/나님께/g, "나에게")
    .replace(/저님은/g, "저는")
    .replace(/저님는/g, "저는")
    .replace(/저님이/g, "제가")
    .replace(/저님가/g, "제가")
    .replace(/저님을/g, "저를")
    .replace(/저님를/g, "저를")
    .replace(/저님의/g, "저의")
    .replace(/저님에게/g, "저에게")
    .replace(/저님한테/g, "저한테")
    .replace(/저님께/g, "저에게")
    .replace(/나님/g, "나")
    .replace(/저님/g, "저");
  return { text: next, fixed: next !== text };
}

function hasBatchimKorean(word: string): boolean {
  const ch = word.at(-1);
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function waGwa(word: string): "와" | "과" {
  return hasBatchimKorean(word) ? "과" : "와";
}

function eulReul(word: string): "을" | "를" {
  return hasBatchimKorean(word) ? "을" : "를";
}

function iGa(word: string): "이" | "가" {
  return hasBatchimKorean(word) ? "이" : "가";
}

/**
 * In partner 1st-person prose, ban treating own display name as the other party.
 */
export function rewriteSpeakerSelfAsOther(
  text: string,
  speakerName: string,
  otherName: string,
): { text: string; fixed: boolean } {
  const self = speakerName.trim();
  // Display name "나"/"저" collides with 1st-person pronouns — skip unsafe rewrite.
  if (!self || !text || self === "나" || self === "저") {
    return { text, fixed: false };
  }
  const other = partnerLabelForSpeaker(otherName);
  let out = text;
  let fixed = false;

  const patterns: Array<[RegExp, string]> = [
    [new RegExp(`나와\\s*${escapeRe(self)}의`, "g"), `나와 ${other}의`],
    [
      new RegExp(`나와\\s*${escapeRe(self)}[이가]`, "g"),
      `나와 ${other}${iGa(other)}`,
    ],
    [new RegExp(`나와\\s*${escapeRe(self)}`, "g"), `나와 ${other}`],
    [
      new RegExp(`${escapeRe(self)}와의\\s*관계`, "g"),
      `${other}${waGwa(other)}의 관계`,
    ],
    [
      new RegExp(`${escapeRe(self)}과의\\s*관계`, "g"),
      `${other}${waGwa(other)}의 관계`,
    ],
    [new RegExp(`${escapeRe(self)}과의`, "g"), `${other}${waGwa(other)}의`],
    [new RegExp(`${escapeRe(self)}와의`, "g"), `${other}${waGwa(other)}의`],
    [new RegExp(`${escapeRe(self)}에게`, "g"), `${other}에게`],
    [new RegExp(`${escapeRe(self)}한테`, "g"), `${other}한테`],
    [new RegExp(`${escapeRe(self)}의`, "g"), `${other}의`],
    [new RegExp(`${escapeRe(self)}을`, "g"), `${other}${eulReul(other)}`],
    [new RegExp(`${escapeRe(self)}를`, "g"), `${other}${eulReul(other)}`],
    [
      new RegExp(`${escapeRe(self)}이(?![가-힣])`, "g"),
      `${other}${iGa(other)}`,
    ],
    [
      new RegExp(`${escapeRe(self)}가(?![가-힣])`, "g"),
      `${other}${iGa(other)}`,
    ],
    [
      new RegExp(`(?<![가-힣A-Za-z])${escapeRe(self)}(?![가-힣A-Za-z님])`, "g"),
      other,
    ],
  ];

  for (const [re, rep] of patterns) {
    if (re.test(out)) {
      out = out.replace(re, rep);
      fixed = true;
    }
  }
  return { text: out, fixed };
}

/** B-slot alias matching romantic/married naming. */
export function rewriteBSpeakerSelfName(
  text: string,
  nicknameB: string,
  nicknameA: string,
): { text: string; fixed: boolean } {
  return rewriteSpeakerSelfAsOther(text, nicknameB, nicknameA);
}

function polishInventedNameForms(
  text: string,
  name: string,
): { text: string; fixed: boolean } {
  const n = name.trim();
  if (!n || n === "나" || n === "저" || n === "상대" || n === "파트너") {
    return { text, fixed: false };
  }
  let out = text;
  let fixed = false;
  if (!n.endsWith("님")) {
    const withNim = new RegExp(`${escapeRe(n)}님`, "g");
    if (withNim.test(out)) {
      out = out.replace(withNim, n);
      fixed = true;
    }
  }
  const iui = new RegExp(`${escapeRe(n)}이의`, "g");
  if (iui.test(out)) {
    out = out.replace(iui, `${n}의`);
    fixed = true;
  }
  return { text: out, fixed };
}

function ensureLowConfTentative(cell: string): { text: string; fixed: boolean } {
  const raw = cell.trim();
  if (!raw) return { text: cell, fixed: false };
  if (TENTATIVE_MARKER.test(raw)) return { text: raw, fixed: false };
  const base = raw.replace(/[.。]\s*$/, "");
  return {
    text: `${base}. 다만 실제 협업에서는 조금 다르게 나타날 수도 있으니, 함께 확인해 볼 부분이에요.`,
    fixed: true,
  };
}

export function adviceHasLeadingEvidenceBridge(reason: string): boolean {
  const first = reason.split(/(?<=[.。])\s+/)[0] || reason;
  const head = first.length >= 12 ? first : reason.slice(0, 100);
  return EVIDENCE_BRIDGE.test(head);
}

function scrubBusinessSoftWash(body: string): string {
  let out = body;
  const replacements: Array<[RegExp, string]> = [
    [
      /일이\s*잘\s*안\s*풀려도\s*서로\s*믿으면\s*된다\.?/g,
      "역할·리스크·보고 리듬 차이를 확인해 볼 필요가 있다",
    ],
    [
      /파트너니까\s*괜찮습니다?/g,
      "소유권과 한도를 문서로 맞춰 갈 여지가 있다",
    ],
    [
      /사이만\s*좋으면\s*사업은\s*된다\.?/g,
      "손익·리스크 감각 차이를 조율해 볼 필요가 있다",
    ],
    [
      /신뢰만\s*있으면\s*된다\.?/g,
      "핸드오프와 의사결정 규칙을 합의하면 도움이 된다",
    ],
    [/다\s*잘될\s*거예요\.?/g, "실제 운영에서 확인해 볼 부분이다."],
    [
      /그냥\s*파트너라서\s*괜찮다\.?/g,
      "역할 분담과 추진 속도를 조율해 볼 필요가 있다.",
    ],
    [
      /서로\s*믿으면\s*된다\.?/g,
      "역할·리스크 한도를 맞춰 가면 도움이 된다",
    ],
  ];
  for (const [re, rep] of replacements) {
    out = out.replace(re, rep);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

function softWashBody(body: string): string {
  if (!body.trim()) return body;
  let out = body.trim();
  if (!GAP_AUDIBLE.test(out.slice(0, Math.min(out.length, 140)))) {
    out = `역할·리스크·보고에서 어긋날 수 있는 지점이 있다. ${out}`;
  }
  out = scrubBusinessSoftWash(out);
  if (SOFT_WASH_BUSINESS.test(out)) {
    out =
      `${out.replace(SOFT_WASH_BUSINESS, "").trim()} 맞춰 갈 여지는 확인해 볼 수 있다.`.trim();
  }
  return out;
}

function buildAdviceBridgePool(params: {
  mismatchRoles?: boolean;
  comparisonLeans?: Partial<Record<string, LeanRow>>;
}): string[] {
  const pool: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    if (!s || seen.has(s)) return;
    seen.add(s);
    pool.push(s);
  };

  if (params.mismatchRoles) {
    push("파트너 사이 역할·리스크 기대가 어긋날 수 있어서");
  }

  const leans = params.comparisonLeans ?? {};
  const order = [
    "boundary",
    "feedback",
    "synergy_position",
    "burnout",
    "risk_taking",
    "reporting_rhythm",
    "leadership",
  ] as const;

  for (const key of order) {
    const row = leans[key];
    const a = row?.band_a ?? row?.lean_a ?? null;
    const b = row?.band_b ?? row?.lean_b ?? null;
    if (!a || !b) continue;
    const label = ASPECT_BRIDGE_LABEL[key] ?? key;
    if (a === b) {
      push(`양쪽 모두 ${label}에서 같은 결을 공유하는 편으로 잡히기 때문에`);
    } else if (key === "boundary") {
      push("업무 경계·역할 소유가 다르게 잡히기 때문에");
    } else if (key === "feedback") {
      push("피드백 전달·수용 결이 다르게 보이기 때문에");
    } else if (key === "synergy_position") {
      push("시너지·역할 자리 기대가 다르게 잡히므로");
    } else if (key === "burnout") {
      push("번아웃·회복 리듬이 다르게 보이기 때문에");
    } else if (key === "risk_taking") {
      push("리스크 감수 성향이 다르게 잡히기 때문에");
    } else if (key === "reporting_rhythm") {
      push("보고·공유 리듬이 다르게 보이기 때문에");
    } else if (key === "leadership") {
      push("대외 리드 / 내부 점검 역할 분담이 어긋날 수 있어서");
    } else {
      push(`${label} 결이 다르게 잡히기 때문에`);
    }
  }

  push("파트너 사이에서 잡힌 역할·리스크·보고 결이 달라 보일 수 있어서");
  return pool;
}

function pickAdviceBridge(
  pool: string[],
  tipIndex: number,
  used: Set<string>,
): string {
  if (pool.length === 0) {
    return "파트너 사이에서 잡힌 역할·리스크·보고 결이 달라 보일 수 있어서";
  }
  for (let i = 0; i < pool.length; i++) {
    const candidate = pool[(tipIndex + i) % pool.length]!;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  const fallback = pool[tipIndex % pool.length]!;
  used.add(fallback);
  return fallback;
}

function ensureAdviceEvidenceBridge(
  reason: string,
  bridgeClause: string,
): { text: string; fixed: boolean } {
  const raw = reason.trim();
  if (!raw) return { text: reason, fixed: false };
  if (adviceHasLeadingEvidenceBridge(raw)) {
    return { text: raw, fixed: false };
  }
  const clause = bridgeClause.replace(/[,，.\s]+$/u, "");
  return { text: `${clause}, ${raw}`, fixed: true };
}

function patchStringField(
  obj: AnyRec,
  key: string,
  patch: (s: string) => { text: string; fixed: boolean },
  fixes: string[],
  tag: string,
): void {
  const raw = asStr(obj[key]);
  if (!raw) return;
  const { text, fixed } = patch(raw);
  if (fixed) {
    obj[key] = text;
    fixes.push(tag);
  }
}

export type BusinessPostValidateResult = {
  report: AnyRec;
  fixes: string[];
};

/**
 * Round 1 business narrative post-validate.
 * Safe no-op when overlay fields are absent.
 */
export function postValidateBusinessNarrative(
  report: AnyRec,
  params: {
    nicknameA: string;
    nicknameB: string;
    mismatchRoles?: boolean | null;
    comparisonLeans?: Partial<Record<string, LeanRow>>;
  },
): BusinessPostValidateResult {
  const fixes: string[] = [];
  const nicknameA = params.nicknameA?.trim() || "나";
  const nicknameB = params.nicknameB?.trim() || "상대";
  const next: AnyRec = { ...report };

  const stripTree = (node: unknown): unknown => {
    if (typeof node === "string") {
      const { text, fixed } = stripHonorificBans(node);
      if (fixed) fixes.push("strip_nanim_jeonim");
      return text;
    }
    if (Array.isArray(node)) return node.map(stripTree);
    const obj = asObj(node);
    if (!obj) return node;
    const out: AnyRec = {};
    for (const [k, v] of Object.entries(obj)) out[k] = stripTree(v);
    return out;
  };
  const stripped = stripTree(next) as AnyRec;

  const nature = asObj(stripped.section_2_nature);
  if (nature) {
    const bNature = asObj(nature.b_nature);
    if (bNature) {
      for (const key of ["first_person_voice", "description"] as const) {
        patchStringField(
          bNature,
          key,
          (s) => rewriteSpeakerSelfAsOther(s, nicknameB, nicknameA),
          fixes,
          `b_nature.${key}`,
        );
      }
      nature.b_nature = bNature;
      stripped.section_2_nature = nature;
    }
    const aNature = asObj(nature.a_nature);
    if (aNature) {
      for (const key of ["first_person_voice", "description"] as const) {
        patchStringField(
          aNature,
          key,
          (s) => rewriteSpeakerSelfAsOther(s, nicknameA, nicknameB),
          fixes,
          `a_nature.${key}`,
        );
      }
      nature.a_nature = aNature;
      stripped.section_2_nature = nature;
    }
  }

  const mismatch = params.mismatchRoles === true;
  if (mismatch) {
    const frames = asObj(stripped.section_4_business_frames) ?? {};
    const gapSignal = asObj(frames.role_gap_signal) ?? frames;
    if (asObj(gapSignal)) {
      for (const key of ["a_body", "b_body", "match_note"] as const) {
        const prev = asStr((gapSignal as AnyRec)[key]);
        if (!prev) continue;
        const nextBody =
          key === "match_note"
            ? (() => {
                let note = prev;
                if (!GAP_AUDIBLE.test(note)) {
                  note =
                    "역할·리스크·보고에서 어긋날 수 있다. 상대가 편하다고 느끼는 소유권·한도를 따로 확인해 볼 필요가 있다.";
                }
                return scrubBusinessSoftWash(note);
              })()
            : softWashBody(prev);
        if (nextBody !== prev) {
          (gapSignal as AnyRec)[key] = nextBody;
          fixes.push(`mismatch_${key}`);
        }
      }
      if (asObj(frames.role_gap_signal)) {
        frames.role_gap_signal = gapSignal;
      }
      stripped.section_4_business_frames = frames;
    }
  }

  const leans = params.comparisonLeans ?? {};
  const aspectToKey: Record<string, string> = {
    "업무 경계": "boundary",
    "역할 소유": "boundary",
    피드백: "feedback",
    "시너지 자리": "synergy_position",
    번아웃: "burnout",
    "리스크 감수": "risk_taking",
    "보고 리듬": "reporting_rhythm",
    리더십: "leadership",
  };
  const lowConfAspects = new Set([
    "boundary",
    "risk_taking",
    "leadership",
    "feedback",
  ]);
  const s2 = asObj(stripped.section_2_nature);
  const table = Array.isArray(s2?.comparison_table)
    ? [...(s2!.comparison_table as AnyRec[])]
    : null;
  if (table && s2) {
    let changed = false;
    for (let i = 0; i < table.length; i++) {
      const row = asObj(table[i]);
      if (!row) continue;
      const aspect = asStr(row.aspect);
      const key = aspectToKey[aspect];
      const leanRow = key ? leans[key] : undefined;
      if (
        key &&
        lowConfAspects.has(key) &&
        (leanRow?.confidence === "low" || leanRow?.align === "caution")
      ) {
        for (const cell of ["a", "b"] as const) {
          if (!asStr(row[cell])) continue;
          const { text, fixed } = ensureLowConfTentative(asStr(row[cell]));
          if (fixed) {
            row[cell] = text;
            changed = true;
            fixes.push(`low_conf_hedge:${aspect}.${cell}`);
          }
        }
        table[i] = row;
      }

      // 전 행 공통 — 셀 단위 존댓말·대시 정화 (개조식/반말 셀 방어)
      for (const cell of ["a", "b"] as const) {
        if (!asStr(row[cell])) continue;
        const { text, fixed } = polishKoTableCell(asStr(row[cell]));
        if (fixed) {
          row[cell] = text;
          changed = true;
          fixes.push(`cell_tone_polish:${aspect}.${cell}`);
        }
      }
      table[i] = row;
    }
    if (changed) {
      s2.comparison_table = table;
      stripped.section_2_nature = s2;
    }
  }

  const action = asObj(stripped.section_5_action);
  if (action) {
    const bridgePool = buildAdviceBridgePool({
      mismatchRoles: mismatch,
      comparisonLeans: leans,
    });
    for (const listKey of ["advice_for_a", "advice_for_b"] as const) {
      const list = Array.isArray(action[listKey])
        ? (action[listKey] as AnyRec[])
        : [];
      if (!list.length) continue;
      let touched = false;
      const usedBridges = new Set<string>();
      list.forEach((tip, tipIndex) => {
        const reason = asStr(tip.saju_reason);
        const cleaned = reason
          .replace(/\[source:\s*[a-z0-9_*]+\]\s*/gi, "")
          .trim();
        if (cleaned !== reason) {
          tip.saju_reason = cleaned;
          touched = true;
          fixes.push(`strip_source_tag:${listKey}`);
        }
        let finalReason = asStr(tip.saju_reason);
        if (finalReason && adviceHasLeadingEvidenceBridge(finalReason)) {
          const head = (
            finalReason.split(/(?<=[.。])\s+/)[0] || finalReason
          ).slice(0, 48);
          usedBridges.add(head);
        } else if (
          finalReason &&
          !adviceHasLeadingEvidenceBridge(finalReason)
        ) {
          const bridge = pickAdviceBridge(bridgePool, tipIndex, usedBridges);
          const { text, fixed } = ensureAdviceEvidenceBridge(
            finalReason,
            bridge,
          );
          if (fixed) {
            tip.saju_reason = text;
            finalReason = text;
            touched = true;
            fixes.push(`advice_bridge_fallback:${listKey}:${tipIndex + 1}`);
          } else {
            fixes.push(`advice_missing_evidence_bridge:${listKey}`);
          }
        }
        if (
          GENERIC_ONLY_ADVICE.test(finalReason) ||
          GENERIC_ONLY_ADVICE.test(asStr(tip.action_title))
        ) {
          fixes.push(`advice_generic_only:${listKey}`);
        }
      });
      if (touched) action[listKey] = list;
    }

    const together = asStr(action.together);
    if (together && FEWSHOT_TOGETHER_BLEED.test(together)) {
      action.together = mismatch
        ? "역할·리스크·보고처럼 이 파트너십에서 잡힌 차이를 이번 주 한 가지만 짧게 적어 보자. 없애려 하기보다 소유권과 한도를 문서로 합의하는 편이 도움이 된다. 주간 점검에서 10분만 핸드오프를 맞춰 보자."
        : "파트너 사이에서 잡힌 역할·리스크·보고 결을 이번 주 한 가지만 짚어 기록해 보자. 같은 안건에도 추진 속도가 다를 수 있다. 주간에 짧은 운영 점검을 잡아 보자.";
      fixes.push("together_fewshot_rewrite");
    }

    stripped.section_5_action = action;
  }

  const polishTree = (node: unknown): unknown => {
    if (typeof node === "string") {
      let s = node;
      let any = false;
      for (const name of [nicknameA, nicknameB]) {
        const { text, fixed } = polishInventedNameForms(s, name);
        if (fixed) {
          s = text;
          any = true;
        }
      }
      if (any) fixes.push("naming_polish");
      const tone = polishKoTone(s);
      if (tone.fixed) {
        s = tone.text;
        fixes.push("ko_tone_polish");
      }
      return s;
    }
    if (Array.isArray(node)) return node.map(polishTree);
    const obj = asObj(node);
    if (!obj) return node;
    const out: AnyRec = {};
    for (const [k, v] of Object.entries(obj)) out[k] = polishTree(v);
    return out;
  };

  return {
    report: polishTree(stripped) as AnyRec,
    fixes: [...new Set(fixes)],
  };
}
