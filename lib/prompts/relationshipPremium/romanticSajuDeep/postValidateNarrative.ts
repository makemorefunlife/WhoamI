/**
 * Deterministic post-LLM narrative guards for Romantic only.
 * Cheap string fixes — not a second LLM pass.
 */

import { polishKoTableCell, polishKoTone } from "@/lib/i18n/koToneGuards";
import { polishEnTone } from "@/lib/i18n/enToneGuards";

type AnyRec = Record<string, unknown>;

const MISMATCH_AUDIBLE =
  /어긋|불일치|맞지\s*않|갭|필요와\s*제공|니드와\s*기브|need\/give|일치하지\s*않/i;

const SOFT_WASH_FINAL =
  /서로에게\s*(안정감|위안|안심)을\s*주는\s*관계|이미\s*서로\s*(안심|위안)|상호\s*안심|서로\s*잘\s*맞춰\s*주는/i;

const SAME_LEAN_FORBIDDEN_PAIRS: Array<[RegExp, RegExp]> = [
  [/감정|돌봄|케어|emotional/i, /행동|선물|액션|action/i],
  [/유연/i, /신중/i],
  [/표현적|외향|솔직히\s*드러/i, /절제|내향|감추/i],
  [/독립/i, /상의|상의형|상의하/i],
];

const LEAN_LABEL_KO: Record<string, string> = {
  emotional_care: "정서적 돌봄",
  action_gift: "행동·선물",
  balanced: "균형",
  reserved: "절제",
  expressive: "표현",
  principled: "원칙",
  direct: "직접",
  explosive: "폭발",
  steady: "차분",
  withdrawn: "철수",
  independent: "독립",
  consultative: "상의",
  considerate: "배려",
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
    // leftover bare self-name used as partner noun
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

function ensureMismatchNote(matchNote: string): string {
  const base = matchNote.trim();
  const gap =
    "안심을 원하는 방식과 건네는 방식이 서로 어긋날 수 있어요. 상대가 어떤 표현을 안심으로 받아들이는지 한 번 확인해 보면 좋아요.";
  if (!base) return gap;
  let out = base;
  if (!MISMATCH_AUDIBLE.test(out)) {
    out = `${gap} ${out}`.trim();
  }
  out = scrubPresentMutualComfortClauses(out);
  if (SOFT_WASH_FINAL.test(out)) {
    out =
      `${out.replace(SOFT_WASH_FINAL, "").trim()} 맞춰 갈 여지는 충분히 확인해 볼 수 있어요.`.trim();
  }
  return out;
}

/**
 * Round 3 — scrub present-tense mutual-comfort claims while keeping
 * evidence-specific need/give sentences. Clause-level only.
 */
function scrubPresentMutualComfortClauses(body: string): string {
  let out = body;
  // Longest / most specific first to avoid stacked "맞추려면…맞추려면"
  const replacements: Array<[RegExp, string]> = [
    [
      /이를\s*통해\s*나의\s*감정이\s*존중받고\s*있다는\s*느낌을\s*받으며,?\s*안정감을\s*느낍니다\.?/g,
      "존중받는 느낌과 안심이 맞으려면, 상대가 안심으로 받아들이는 표현인지 확인해 보는 게 좋아요.",
    ],
    [
      /결국\s*서로에게\s*큰\s*안심이\s*됩니다?/g,
      "맞춰 가면 안심으로 이어질 수 있어요",
    ],
    [
      /이미\s*서로의?\s*위안이\s*되고\s*있습니다?/g,
      "아직은 안심 방식이 서로 어긋날 수 있어요",
    ],
    [
      /서로의\s*부족한\s*안심을\s*채워\s*줍니다?/g,
      "부족한 안심을 채우려면 서로의 표현부터 확인해 보는 게 좋아요",
    ],
    [
      /서로에게\s*(?:큰\s*)?(?:안심|위안|안정감)을\s*주는\s*관계입니다?/g,
      "안심 방식을 맞춰 갈 여지는 충분해요",
    ],
    [
      /서로에게\s*(?:큰\s*)?(?:안심|위안)이\s*됩니다?/g,
      "맞춰 가면 안심이 될 수 있어요",
    ],
    [/서로\s*잘\s*맞춰\s*주는/g, "맞춰 가려면 확인이 필요한"],
    [
      /(?:나에게?|나의)\s*감정적\s*돌봄이\s*([^.]{0,24}?)큰\s*위안이\s*되며/g,
      "감정적 돌봄이 $1위안이 되려면 방식이 맞는지 확인해 보는 게 좋고",
    ],
    [
      /큰\s*위안이\s*되며/g,
      "위안이 되려면 방식이 맞는지 확인해 보는 게 좋고",
    ],
    [
      /큰\s*위안이\s*됩니다?/g,
      "위안이 되려면 방식이 맞는지 확인해 보는 게 좋아요",
    ],
    [
      /위안이\s*되며/g,
      "위안이 되려면 방식이 맞는지 확인해 보는 게 좋고",
    ],
    [
      /안정감을\s*느낍니다\.?/g,
      "안정감을 맞춰 갈 여지는 충분해요.",
    ],
    [/안정감을\s*느끼며/g, "안정감을 맞추려 할 때"],
    [
      /존중받고\s*있다는\s*느낌을\s*받으며,?\s*/g,
      "존중받는 느낌이 서로 맞는지는 확인이 필요하고, ",
    ],
    [
      /무의식적으로\s*서로에게\s*안정감을\s*주는\s*관계를\s*형성하고\s*있습니다/g,
      "안심 방식이 어긋날 수 있어서, 서로의 표현을 번역해 주면 도움이 돼요",
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
  if (!MISMATCH_AUDIBLE.test(out.slice(0, Math.min(out.length, 120)))) {
    out = `필요한 안심과 건네는 방식이 서로 어긋날 수 있어요. ${out}`;
  }
  out = scrubPresentMutualComfortClauses(out);
  out = out
    .replace(/서로에게\s*위안이\s*됩니다?/g, "맞춰 가면 위안이 될 수 있어요")
    .replace(
      /서로에게\s*안정감을\s*주는\s*관계입니다?/g,
      "안정감을 맞춰 갈 여지는 충분해요",
    )
    .replace(/이미\s*서로\s*안심/g, "아직 안심 방식이 어긋날 수 있어");
  return out;
}

const TENTATIVE_MARKER =
  /보일\s*수\s*있|가능성이\s*있|확인해\s*볼|경향이\s*있|편으로|듯하|수\s*있습니다|가까울|상황에\s*따라|다르게\s*나타날/;

function ensureLowConfTentative(cell: string): { text: string; fixed: boolean } {
  const raw = cell.trim();
  if (!raw) return { text: cell, fixed: false };
  if (TENTATIVE_MARKER.test(raw)) return { text: raw, fixed: false };
  const base = raw.replace(/[.。]\s*$/, "");
  return {
    text: `${base}. 다만 실제 관계에서는 상황에 따라 다르게 나타날 수 있어요.`,
    fixed: true,
  };
}

/** Leading evidence-bridge patterns (digest-grounded natural Korean). Round 4 expanded. */
const EVIDENCE_BRIDGE =
  /결정.{0,16}균형|균형형|안심.{0,24}(방식|어긋|원하|건네|필요)|건네는\s*방식|감정\s*표현(\s*속도|\s*결)?|표현\s*(속도|결|타이밍)|정서적\s*타이밍|회복\s*속도|갈등\s*뒤|갈등.{0,14}(반응|직면|결|기울)|스트레스(\s*반응)?(\s*결)?|애정\s*(언어|표현|결)|소통\s*방식|의사결정|역할|프레임|잔류|일치하지|어긋|같은\s*결|공유하는\s*편|기울기가?\s*다르|기질.{0,8}(결|반응)|반응\s*결|잡히기\s*때문에|잡히므로|보이기\s*때문에/;

/** True if the opening sentence (before first 。/.) contains an evidence bridge. */
function adviceHasLeadingEvidenceBridge(reason: string): boolean {
  const first = reason.split(/(?<=[.。])\s+/)[0] || reason;
  // Also allow bridge in first ~100 chars if no period yet
  const head = first.length >= 12 ? first : reason.slice(0, 100);
  return EVIDENCE_BRIDGE.test(head);
}

type LeanRow = {
  lean_a?: string | null;
  lean_b?: string | null;
  confidence?: string | null;
  align?: string | null;
};

const ASPECT_BRIDGE_LABEL: Record<string, string> = {
  expression: "감정 표현",
  conflict: "갈등 반응",
  affection: "애정 언어",
  stress: "스트레스 반응",
  decision: "의사결정",
  communication: "소통 방식",
};

/**
 * Digest-grounded bridge pool for Round 4 fallback.
 * Prefer mismatch + lean diffs; rotate by tip index so tip2/tip3 get distinct bridges.
 */
function buildAdviceBridgePool(params: {
  mismatch: boolean;
  comparisonLeans?: Partial<Record<string, LeanRow>>;
}): string[] {
  const pool: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    if (!s || seen.has(s)) return;
    seen.add(s);
    pool.push(s);
  };

  if (params.mismatch) {
    push("안심을 원하는 방식과 건네는 방식이 어긋날 수 있어서");
  }

  const leans = params.comparisonLeans ?? {};
  const order = [
    "expression",
    "conflict",
    "affection",
    "stress",
    "decision",
    "communication",
  ] as const;

  for (const key of order) {
    const row = leans[key];
    const a = row?.lean_a ?? null;
    const b = row?.lean_b ?? null;
    if (!a || !b) continue;
    const label = ASPECT_BRIDGE_LABEL[key] ?? key;
    if (a === b) {
      if (key === "decision" && a === "balanced") {
        push("두 사람 모두 결정에서 균형형으로 잡히기 때문에");
      } else {
        push(`두 사람 모두 ${label}에서 같은 결을 공유하는 편으로 잡히기 때문에`);
      }
    } else if (key === "expression") {
      push("감정 표현 속도가 다르게 잡히므로");
    } else if (key === "conflict") {
      push("갈등 반응 기울기가 다르게 보이기 때문에");
    } else if (key === "affection") {
      push("애정 언어 결이 다르게 잡히기 때문에");
    } else if (key === "stress") {
      push("스트레스 반응 결이 다르게 잡히므로");
    } else if (key === "decision") {
      push("의사결정에서 기울기가 다르게 잡히기 때문에");
    } else if (key === "communication") {
      push("소통 방식이 다르게 잡히므로");
    }
  }

  // Always keep at least one safe structural fallback (still digest-shaped wording).
  push("관계에서 잡힌 반응 결이 달라 보일 수 있어서");
  return pool;
}

function pickAdviceBridge(pool: string[], tipIndex: number, used: Set<string>): string {
  if (pool.length === 0) {
    return "관계에서 잡힌 반응 결이 달라 보일 수 있어서";
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

/** Prepend a digest-grounded bridge when the leading sentence lacks one. */
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
  return {
    text: `${clause}, ${raw}`,
    fixed: true,
  };
}

const GENERIC_ONLY_ADVICE =
  /서로\s*존중하며\s*소통하세요|감정을\s*솔직히\s*표현하세요|서로의\s*차이를\s*이해하세요|깊은\s*교감|특별한\s*에너지|작은\s*신호부터/;

/** Known few-shot diary bleed (structural examples must never ship verbatim). */
const FEWSHOT_TOGETHER_BLEED =
  /가장\s*아름다운\s*조각|따뜻한\s*차\s*한\s*잔을\s*사이에\s*두고|깊이\s*있는\s*저널을\s*써보듯|방어벽\s*뒤로\s*숨기지/;

const FEWSHOT_STARTER_BLEED =
  /마음의\s*온도가\s*어땠는지.*속마음에\s*대해\s*편안하게\s*얘기해\s*볼까/;

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
  // Awkward "이름의" after batchim subject particle bleed: 동글이의 → 동글의
  const iui = new RegExp(`${escapeRe(n)}이의`, "g");
  if (iui.test(out)) {
    out = out.replace(iui, `${n}의`);
    fixed = true;
  }
  return { text: out, fixed };
}

function sameLeanCellsLookOpposed(a: string, b: string): boolean {
  for (const [ra, rb] of SAME_LEAN_FORBIDDEN_PAIRS) {
    if ((ra.test(a) && rb.test(b)) || (rb.test(a) && ra.test(b))) return true;
  }
  return false;
}

function similarityCell(lean: string, side: "a" | "b"): string {
  const label = LEAN_LABEL_KO[lean] ?? lean;
  if (side === "a") {
    return `${label} 쪽으로 기우는 신호가 보여요. 결이 같아서 편한 만큼, 둘 다 놓치기 쉬운 맹점도 함께 살펴보면 좋아요.`;
  }
  return `같은 ${label} 결을 공유하는 편이에요. 반대 스타일로 단정하기보다, 공통 경향과 맹점을 확인해 보는 쪽이 훨씬 정확해요.`;
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

export type RomanticPostValidateResult = {
  report: AnyRec;
  fixes: string[];
};

export function postValidateRomanticNarrative(
  report: AnyRec,
  params: {
    nicknameA: string;
    nicknameB: string;
    matchAGivesB?: boolean | null;
    matchBGivesA?: boolean | null;
    comparisonLeans?: Partial<
      Record<
        string,
        {
          lean_a?: string | null;
          lean_b?: string | null;
          confidence?: string | null;
          align?: string | null;
        }
      >
    >;
    locale?: string;
  },
): RomanticPostValidateResult {
  const isEn = (params.locale ?? "").toLowerCase().startsWith("en");
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

  // B 1st-person only (voice + description both speak as B)
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

  const mismatch =
    params.matchAGivesB === false || params.matchBGivesA === false;
  if (mismatch) {
    const frames = asObj(stripped.section_4_relationship_frames) ?? {};
    const reass = asObj(frames.reassurance_signal) ?? {};
    const prevNote = asStr(reass.match_note);
    const nextNote = ensureMismatchNote(prevNote);
    if (nextNote !== prevNote) {
      reass.match_note = nextNote;
      fixes.push("mismatch_match_note");
    }
    const aBody = softWashBody(asStr(reass.a_body));
    const bBody = softWashBody(asStr(reass.b_body));
    if (aBody !== asStr(reass.a_body)) {
      reass.a_body = aBody;
      fixes.push("mismatch_a_body");
    }
    if (bBody !== asStr(reass.b_body)) {
      reass.b_body = bBody;
      fixes.push("mismatch_b_body");
    }
    frames.reassurance_signal = reass;
    stripped.section_4_relationship_frames = frames;
  }

  const leans = params.comparisonLeans ?? {};
  const aspectToKey: Record<string, string> = {
    "감정 표현": "expression",
    "갈등 반응": "conflict",
    "애정 언어": "affection",
    "스트레스 패턴": "stress",
    "의사결정": "decision",
    "소통 방식": "communication",
  };
  const lowConfAspects = new Set(["expression", "conflict", "stress"]);
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
      const leanA = leanRow?.lean_a ?? null;
      const leanB = leanRow?.lean_b ?? null;

      // Same-lean invented opposition rewrite
      if (leanA && leanB && leanA === leanB) {
        const a = asStr(row.a);
        const b = asStr(row.b);
        if (sameLeanCellsLookOpposed(a, b)) {
          row.a = similarityCell(leanA, "a");
          row.b = similarityCell(leanB, "b");
          if (leanRow?.confidence === "low" || leanRow?.align === "caution") {
            row.a = `${asStr(row.a)} 실제 생활에서 확인해 볼 신호예요.`;
            row.b = `${asStr(row.b)} 아직 단정하긴 일러요. 천천히 맞춰 보면 돼요.`;
          }
          table[i] = row;
          changed = true;
          fixes.push(`same_lean_rewrite:${aspect}`);
          continue;
        }
      }

      // Round 3 — low-conf tentative markers on expression/conflict/stress
      if (
        !isEn &&
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

      // 전 행 공통 — 셀 단위 톤 정화 (개조식/반말/em-dash 방어)
      for (const cell of ["a", "b"] as const) {
        const { text, fixed } = isEn
          ? polishEnTone(asStr(row[cell]))
          : polishKoTableCell(asStr(row[cell]));
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

  // Strip source tags; Round 4 — prepend digest-grounded bridge when missing (narrow fallback).
  const action = asObj(stripped.section_5_action);
  if (action) {
    const bridgePool = buildAdviceBridgePool({
      mismatch,
      comparisonLeans: leans,
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
          // Reserve the leading clause so later fallbacks prefer unused digest bridges.
          const head = (finalReason.split(/(?<=[.。])\s+/)[0] || finalReason).slice(0, 48);
          usedBridges.add(head);
        } else if (finalReason && !adviceHasLeadingEvidenceBridge(finalReason)) {
          const bridge = pickAdviceBridge(bridgePool, tipIndex, usedBridges);
          const { text, fixed } = ensureAdviceEvidenceBridge(finalReason, bridge);
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
      if (touched) {
        action[listKey] = list;
      }
    }

    // Few-shot together prose bleed (Style Bible V2) — narrow fingerprint rewrite only.
    const together = asStr(action.together);
    if (together && FEWSHOT_TOGETHER_BLEED.test(together)) {
      action.together = mismatch
        ? "안심을 건네는 방식과 받아들이는 방식이 어긋날 수 있다는 전제로, 이번 주에는 상대가 안심으로 느꼈던 표현을 하나만 짧게 적어 보세요. 차이를 없애려 하기보다, 서로의 표현을 번역해 주는 한 문장이 큰 도움이 돼요. 주말에 10분만 서로의 온도를 확인해 보세요."
        : "두 분에게서 잡힌 반응·표현 결의 차이를 이번 주에 한 가지만 짚어 기록해 보세요. 같은 상황에서 서로 다른 속도로 움직인다는 걸 확인하는 것만으로도 다음 대화가 달라져요. 주말에 짧은 점검 시간을 잡아 보세요.";
      fixes.push("together_fewshot_rewrite");
    }
    const starter = asStr(action.together_starter);
    if (starter && FEWSHOT_STARTER_BLEED.test(starter)) {
      action.together_starter =
        "이번 주에 서로 마음이 달랐던 순간이 있었어? 하나만 짧게 말해 볼까?";
      fixes.push("together_starter_fewshot_rewrite");
    }

    stripped.section_5_action = action;
  }

  // Naming polish: invented 님 / awkward 이의 on display names
  // + tone polish: dash/fragment repair, ko 문어체→해요체 or en cliché/em-dash scrub
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
      const tone = isEn ? polishEnTone(s) : polishKoTone(s);
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
  const polished = polishTree(stripped) as AnyRec;

  return { report: polished, fixes: [...new Set(fixes)] };
}
