/**
 * Deterministic post-LLM narrative guards for Married Couples (cohabitation) only.
 * Skeleton ported from Romantic — domain labels / soft-wash / bridges are marriage-specific.
 * Not a second LLM pass. Do not import romanticSajuDeep.
 */

import { polishKoTableCell, polishKoTone } from "@/lib/i18n/koToneGuards";

type AnyRec = Record<string, unknown>;

const SOFT_WASH_HOUSEHOLD =
  /이미\s*잘\s*맞춰\s*사는|갈등이\s*없는\s*가정|역할이\s*이미\s*완벽|서로\s*알아서\s*잘\s*돌아|문제\s*없는\s*부부|이미\s*균형이\s*잡혀\s*있는\s*가정/i;

const MISMATCH_AUDIBLE =
  /어긋|불일치|맞지\s*않|갭|다를\s*수|확인해\s*볼|조율|분담이\s*어긋|역할이\s*겹/i;

const TENTATIVE_MARKER =
  /보일\s*수\s*있|가능성이\s*있|확인해\s*볼|경향이\s*있|편으로|듯하|수\s*있습니다|가까울|상황에\s*따라|다르게\s*나타날/;

/** Leading evidence-bridge patterns — household / money / conflict / roles. */
const EVIDENCE_BRIDGE =
  /가사|루틴|스트레스|부부싸움|갈등\s*반응|침묵형|폭발형|재정|자산|CFO|예산|지출|원가족|경계|육아|교육|역할\s*분담|생활\s*케미|동반자|잡히기\s*때문에|잡히므로|보이기\s*때문에|어긋날\s*수\s*있어서|같은\s*결|기울기가?\s*다르|다르게\s*잡히/;

const GENERIC_ONLY_ADVICE =
  /서로\s*존중하며\s*소통하세요|감정을\s*솔직히\s*표현하세요|서로의\s*차이를\s*이해하세요|설레는\s*연애|특별한\s*에너지|깊은\s*교감/;

const FEWSHOT_TOGETHER_BLEED =
  /가장\s*아름다운\s*조각|따뜻한\s*차\s*한\s*잔을\s*사이에\s*두고|깊이\s*있는\s*저널을\s*써보듯|설레는\s*데이트/;

const ASPECT_BRIDGE_LABEL: Record<string, string> = {
  household_stress: "가사·루틴 스트레스",
  marital_conflict: "부부 갈등 반응",
  bedroom_lead: "침실 리드 성향",
  family_boundary: "원가족 경계",
  asset_management: "자산관리 기질",
  parenting_style: "육아·교육 가치",
  operating_cfo: "일상 재정 운영",
};

type LeanRow = {
  lean_a?: string | null;
  lean_b?: string | null;
  band_a?: string | null;
  band_b?: string | null;
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

function partnerLabelForB(nicknameA: string): string {
  const a = nicknameA.trim();
  if (!a || a === "나" || a === "저") return "상대";
  return a;
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
 * In B 1st-person prose, ban treating B's own display name as the partner.
 * When A is literally "나", partner refs become "상대".
 */
export function rewriteBSpeakerSelfName(
  text: string,
  nicknameB: string,
  nicknameA: string,
): { text: string; fixed: boolean } {
  const b = nicknameB.trim();
  if (!b || !text) return { text, fixed: false };
  const partner = partnerLabelForB(nicknameA);
  let out = text;
  let fixed = false;

  const patterns: Array<[RegExp, string]> = [
    [
      new RegExp(`나와\\s*${escapeRe(b)}의`, "g"),
      `나와 ${partner}의`,
    ],
    [
      new RegExp(`나와\\s*${escapeRe(b)}[이가]`, "g"),
      `나와 ${partner}${iGa(partner)}`,
    ],
    [new RegExp(`나와\\s*${escapeRe(b)}`, "g"), `나와 ${partner}`],
    [new RegExp(`${escapeRe(b)}와\\s*나`, "g"), `${partner}${waGwa(partner)} 나`],
    [new RegExp(`${escapeRe(b)}과\\s*나`, "g"), `${partner}${waGwa(partner)} 나`],
    [
      new RegExp(`${escapeRe(b)}와의\\s*관계`, "g"),
      `${partner}${waGwa(partner)}의 관계`,
    ],
    [
      new RegExp(`${escapeRe(b)}과의\\s*관계`, "g"),
      `${partner}${waGwa(partner)}의 관계`,
    ],
    [new RegExp(`${escapeRe(b)}과의`, "g"), `${partner}${waGwa(partner)}의`],
    [new RegExp(`${escapeRe(b)}와의`, "g"), `${partner}${waGwa(partner)}의`],
    [new RegExp(`${escapeRe(b)}에게`, "g"), `${partner}에게`],
    [new RegExp(`${escapeRe(b)}한테`, "g"), `${partner}한테`],
    [new RegExp(`${escapeRe(b)}의`, "g"), `${partner}의`],
    [new RegExp(`${escapeRe(b)}을`, "g"), `${partner}${eulReul(partner)}`],
    [new RegExp(`${escapeRe(b)}를`, "g"), `${partner}${eulReul(partner)}`],
    [new RegExp(`${escapeRe(b)}이(?![가-힣])`, "g"), `${partner}${iGa(partner)}`],
    [new RegExp(`${escapeRe(b)}가(?![가-힣])`, "g"), `${partner}${iGa(partner)}`],
    [
      new RegExp(`(?<![가-힣A-Za-z])${escapeRe(b)}(?![가-힣A-Za-z님])`, "g"),
      partner,
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

function polishInventedNameForms(
  text: string,
  name: string,
): { text: string; fixed: boolean } {
  const n = name.trim();
  if (!n || n === "나" || n === "저" || n === "상대") {
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
    text: `${base}. 다만 실제 생활에서는 상황에 따라 다르게 나타날 수 있어요.`,
    fixed: true,
  };
}

export function adviceHasLeadingEvidenceBridge(reason: string): boolean {
  const first = reason.split(/(?<=[.。])\s+/)[0] || reason;
  const head = first.length >= 12 ? first : reason.slice(0, 100);
  return EVIDENCE_BRIDGE.test(head);
}

function scrubHouseholdSoftWash(body: string): string {
  let out = body;
  const replacements: Array<[RegExp, string]> = [
    [
      /이미\s*잘\s*맞춰\s*사는\s*부부입니다?/g,
      "역할·생활 리듬을 맞춰 가려면 확인이 필요하다",
    ],
    [
      /갈등이\s*없는\s*가정입니다?/g,
      "갈등 방식이 다를 수 있어 조율이 필요하다",
    ],
    [
      /역할이\s*이미\s*완벽히\s*분담되어\s*있습니다?/g,
      "역할 분담을 맞춰 가려면 확인해 볼 필요가 있다",
    ],
    [
      /서로\s*알아서\s*잘\s*돌아갑니다?/g,
      "생활 운영을 맞추려면 분담을 점검해 볼 필요가 있다",
    ],
    [
      /문제\s*없는\s*부부입니다?/g,
      "생활 케미의 어긋남을 확인해 볼 필요가 있다",
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
  if (!MISMATCH_AUDIBLE.test(out.slice(0, Math.min(out.length, 140)))) {
    out = `생활·역할에서 어긋날 수 있는 지점이 있다. ${out}`;
  }
  out = scrubHouseholdSoftWash(out);
  if (SOFT_WASH_HOUSEHOLD.test(out)) {
    out = `${out.replace(SOFT_WASH_HOUSEHOLD, "").trim()} 맞춰 갈 여지는 확인해 볼 수 있다.`.trim();
  }
  return out;
}

function buildAdviceBridgePool(params: {
  mismatchRoles?: boolean;
  comparisonLeans?: Partial<Record<string, LeanRow>>;
  operatingCfoSide?: string | null;
}): string[] {
  const pool: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    if (!s || seen.has(s)) return;
    seen.add(s);
    pool.push(s);
  };

  if (params.mismatchRoles) {
    push("역할·생활 분담이 어긋날 수 있어서");
  }
  if (params.operatingCfoSide) {
    push("일상 재정 운영(CFO) 역할이 한쪽으로 잡히기 때문에");
  }

  const leans = params.comparisonLeans ?? {};
  const order = [
    "household_stress",
    "marital_conflict",
    "asset_management",
    "family_boundary",
    "parenting_style",
    "bedroom_lead",
  ] as const;

  for (const key of order) {
    const row = leans[key];
    const a = row?.band_a ?? row?.lean_a ?? null;
    const b = row?.band_b ?? row?.lean_b ?? null;
    if (!a || !b) continue;
    const label = ASPECT_BRIDGE_LABEL[key] ?? key;
    if (a === b) {
      push(`두 사람 모두 ${label}에서 같은 결을 공유하는 편으로 잡히기 때문에`);
    } else if (key === "marital_conflict") {
      push("부부 갈등 반응(폭발·침묵) 결이 다르게 잡히기 때문에");
    } else if (key === "household_stress") {
      push("가사·루틴 스트레스 드러내는 방식이 다르게 잡히므로");
    } else if (key === "asset_management") {
      push("자산관리 기질 밴드가 다르게 잡히기 때문에");
    } else if (key === "family_boundary") {
      push("원가족 경계 필요가 다르게 보이기 때문에");
    } else if (key === "parenting_style") {
      push("육아·교육 가치 기울기가 다르게 잡히기 때문에");
    } else {
      push(`${label} 결이 다르게 잡히기 때문에`);
    }
  }

  push("가정 운영에서 잡힌 반응·역할 결이 달라 보일 수 있어서");
  return pool;
}

function pickAdviceBridge(
  pool: string[],
  tipIndex: number,
  used: Set<string>,
): string {
  if (pool.length === 0) {
    return "가정 운영에서 잡힌 반응·역할 결이 달라 보일 수 있어서";
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

export type MarriedPostValidateResult = {
  report: AnyRec;
  fixes: string[];
};

/**
 * Round 1 marriage narrative post-validate.
 * Expects optional `section_5_action` / `section_2_nature` shaped like romantic
 * overlay — safe no-op when fields are absent (rule-only marriage body).
 */
export function postValidateMarriedNarrative(
  report: AnyRec,
  params: {
    nicknameA: string;
    nicknameB: string;
    /** True when role/chore or conflict bands disagree enough to need audible gap. */
    mismatchRoles?: boolean | null;
    operatingCfoSide?: string | null;
    comparisonLeans?: Partial<Record<string, LeanRow>>;
  },
): MarriedPostValidateResult {
  const fixes: string[] = [];
  const { nicknameA, nicknameB } = params;
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

  // B 1st-person fields
  const nature = asObj(stripped.section_2_nature);
  if (nature) {
    const bNature = asObj(nature.b_nature);
    if (bNature) {
      for (const key of ["first_person_voice", "description"] as const) {
        patchStringField(
          bNature,
          key,
          (s) => rewriteBSpeakerSelfName(s, nicknameB, nicknameA),
          fixes,
          `b_nature.${key}`,
        );
      }
      nature.b_nature = bNature;
      stripped.section_2_nature = nature;
    }
  }

  const hidden = asObj(stripped.section_4_hidden_hearts);
  if (hidden) {
    const bHidden = asObj(hidden.b_hidden);
    if (bHidden) {
      for (const key of ["need", "reason", "voice"]) {
        patchStringField(
          bHidden,
          key,
          (s) => rewriteBSpeakerSelfName(s, nicknameB, nicknameA),
          fixes,
          `b_hidden.${key}`,
        );
      }
      hidden.b_hidden = bHidden;
      stripped.section_4_hidden_hearts = hidden;
    }
  }

  const mismatch = params.mismatchRoles === true;
  if (mismatch) {
    const frames = asObj(stripped.section_4_household_frames) ??
      asObj(stripped.section_4_relationship_frames) ??
      {};
    const roleSignal =
      asObj(frames.role_balance_signal) ??
      asObj(frames.reassurance_signal) ??
      frames;
    if (asObj(roleSignal)) {
      const bodyKeys = ["a_body", "b_body", "match_note"] as const;
      for (const key of bodyKeys) {
        const prev = asStr((roleSignal as AnyRec)[key]);
        if (!prev) continue;
        const nextBody =
          key === "match_note"
            ? (() => {
                let note = prev;
                if (!MISMATCH_AUDIBLE.test(note)) {
                  note =
                    "역할·생활 분담이 어긋날 수 있다. 상대가 편하다고 느끼는 운영 방식을 따로 확인해 볼 필요가 있다.";
                }
                return scrubHouseholdSoftWash(note);
              })()
            : softWashBody(prev);
        if (nextBody !== prev) {
          (roleSignal as AnyRec)[key] = nextBody;
          fixes.push(`mismatch_${key}`);
        }
      }
      if (frames === roleSignal) {
        // roleSignal was frames itself
      } else if (asObj(frames.role_balance_signal)) {
        frames.role_balance_signal = roleSignal;
      } else if (asObj(frames.reassurance_signal)) {
        frames.reassurance_signal = roleSignal;
      }
      if (stripped.section_4_household_frames) {
        stripped.section_4_household_frames = frames;
      } else if (stripped.section_4_relationship_frames) {
        stripped.section_4_relationship_frames = frames;
      }
    }
  }

  const leans = params.comparisonLeans ?? {};
  const aspectToKey: Record<string, string> = {
    "가사 스트레스": "household_stress",
    "가사·루틴 스트레스": "household_stress",
    "부부 갈등": "marital_conflict",
    "갈등 반응": "marital_conflict",
    "자산 관리": "asset_management",
    "원가족 경계": "family_boundary",
    "육아 스타일": "parenting_style",
    "침실 리드": "bedroom_lead",
  };
  const lowConfAspects = new Set([
    "household_stress",
    "marital_conflict",
    "parenting_style",
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
      operatingCfoSide: params.operatingCfoSide ?? null,
    });
    for (const listKey of ["advice_for_a", "advice_for_b"] as const) {
      const list = Array.isArray(action[listKey])
        ? (action[listKey] as AnyRec[])
        : [];
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
        } else if (finalReason && !adviceHasLeadingEvidenceBridge(finalReason)) {
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
        ? "역할·재정·갈등 반응처럼 이 가정에서 잡힌 차이를 이번 주 한 가지만 짧게 적어 보자. 없애려 하기보다 운영 규칙을 하나 합의하는 편이 도움이 된다. 주말에 10분만 가사·지출 온도를 점검해 보자."
        : "가정 운영에서 잡힌 생활 리듬·역할 결을 이번 주 한 가지만 짚어 기록해 보자. 같은 집안일에도 스트레스 드러내는 방식이 다를 수 있다. 주말에 짧은 점검 시간을 잡아 보자.";
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
