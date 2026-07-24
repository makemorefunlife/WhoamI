/**
 * Deterministic post-LLM narrative guards for Romantic only.
 * Cheap string fixes — not a second LLM pass.
 */

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
    "필요한 안심과 실제로 건네는 방식이 어긋날 수 있다. 맞춰 가려면 서로의 need/give를 확인해 볼 수 있다.";
  if (!base) return gap;
  let out = base;
  if (!MISMATCH_AUDIBLE.test(out)) {
    out = `${gap} ${out}`.trim();
  }
  if (SOFT_WASH_FINAL.test(out)) {
    out =
      `${out.replace(SOFT_WASH_FINAL, "").trim()} 맞춰 갈 여지는 확인해 볼 수 있다.`.trim();
  }
  return out;
}

function softWashBody(body: string): string {
  if (!body.trim()) return body;
  let out = body.trim();
  if (!MISMATCH_AUDIBLE.test(out.slice(0, Math.min(out.length, 120)))) {
    out = `필요한 안심과 실제로 건네는 방식이 어긋날 수 있다. ${out}`;
  }
  out = out
    .replace(/서로에게\s*위안이\s*됩니다?/g, "맞춰 가면 위안이 될 수 있다")
    .replace(
      /서로에게\s*안정감을\s*주는\s*관계입니다?/g,
      "안정감을 맞출 여지는 확인해 볼 수 있다",
    )
    .replace(/이미\s*서로\s*안심/g, "아직 안심 방식이 어긋날 수 있어");
  return out;
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
    return `${label} 쪽으로 기울 수 있는 신호가 있습니다. 같은 결을 공유할 때 생기는 맹점도 함께 살펴볼 필요가 있습니다.`;
  }
  return `같은 ${label} 결을 공유하는 편으로 읽힐 수 있습니다. 대비되는 스타일로 단정하기보다 공통 경향과 맹점을 확인하는 편이 안전합니다.`;
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
  },
): RomanticPostValidateResult {
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

  // B 1st-person only
  const nature = asObj(stripped.section_2_nature);
  if (nature) {
    const bNature = asObj(nature.b_nature);
    if (bNature) {
      patchStringField(
        bNature,
        "first_person_voice",
        (s) => rewriteBSpeakerSelfName(s, nicknameB, nicknameA),
        fixes,
        "b_nature.first_person_voice",
      );
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
      if (!leanA || !leanB || leanA !== leanB) continue;
      const a = asStr(row.a);
      const b = asStr(row.b);
      if (!sameLeanCellsLookOpposed(a, b)) continue;
      row.a = similarityCell(leanA, "a");
      row.b = similarityCell(leanB, "b");
      if (leanRow?.confidence === "low" || leanRow?.align === "caution") {
        row.a = `${asStr(row.a)} (실제 생활에서 확인해 볼 신호)`;
        row.b = `${asStr(row.b)} (단정하지 말고 맞춰 보세요)`;
      }
      table[i] = row;
      changed = true;
      fixes.push(`same_lean_rewrite:${aspect}`);
    }
    if (changed) {
      s2.comparison_table = table;
      stripped.section_2_nature = s2;
    }
  }

  // Strip accidental internal source tags if the model left them in output.
  const action = asObj(stripped.section_5_action);
  if (action) {
    for (const listKey of ["advice_for_a", "advice_for_b"] as const) {
      const list = Array.isArray(action[listKey])
        ? (action[listKey] as AnyRec[])
        : [];
      let touched = false;
      for (const tip of list) {
        const reason = asStr(tip.saju_reason);
        const cleaned = reason
          .replace(/\[source:\s*[a-z0-9_*]+\]\s*/gi, "")
          .trim();
        if (cleaned !== reason) {
          tip.saju_reason = cleaned;
          touched = true;
        }
      }
      if (touched) {
        action[listKey] = list;
        fixes.push(`strip_source_tag:${listKey}`);
      }
    }
    stripped.section_5_action = action;
  }

  return { report: stripped, fixes: [...new Set(fixes)] };
}
