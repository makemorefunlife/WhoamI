/**
 * Friend Style Bible Master Check scanner (Round 2 QA JSON).
 * Run: node tests/manual/friend-master-check.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP = process.env.TEMP || "/tmp";
const soft =
  /친구니까\s*무조건|진짜\s*친구면\s*괜찮|무조건\s*다\s*이해|절교각|다\s*잘될\s*거예|그냥\s*친구라서\s*괜찮|친구면\s*참아야/gi;
const romance =
  /설레는\s*데이트|연애\s*운|운명의\s*상대|가사\s*분담|침실|부부\s*갈등|operating_cfo|무조건\s*사랑|양육|핸드오프|손익|업무\s*경계|bond_distance/gi;
const mingli = /오행|격국|십성|일간|사주\s*상/gi;
const nanim = /나님|저님/g;
const few =
  /가장\s*아름다운\s*조각|따뜻한\s*차\s*한\s*잔을\s*사이에\s*두고|설레는\s*데이트/gi;
const problemLabel = /문제\s*친구|절교각|무능한\s*쪽/g;
const gapAudible =
  /어긋|불일치|맞지\s*않|갭|다를\s*수|확인해\s*볼|조율|거리|템포|리듬|서운|연락|티키타카|배터리|만남|약속/;
const punchDown = /한심|찐따|호구|꼴불견/gi;

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function scan(file, partnerB) {
  const j = JSON.parse(fs.readFileSync(path.join(TEMP, file), "utf8"));
  const o = j.overlay || {};
  const text = JSON.stringify(o);
  const bNature = o.section_2_nature?.b_nature || {};
  const bVoice = [bNature.first_person_voice, bNature.description]
    .filter(Boolean)
    .join("\n");
  const selfRe = new RegExp(esc(partnerB) + "\\s*(과의|와의)");
  const tips = [
    ...(o.section_5_action?.advice_for_a || []),
    ...(o.section_5_action?.advice_for_b || []),
  ];
  const gap = o.section_4_friend_frames?.friendship_gap_signal || {};
  const bodies = [gap.a_body, gap.b_body, gap.match_note]
    .filter(Boolean)
    .join(" ");
  return {
    tag: j.tag,
    rr: j.qa?.relationship_report_id,
    nanim: (text.match(nanim) || []).length,
    soft: [...text.matchAll(soft)].map((m) => m[0]),
    romance: [...text.matchAll(romance)].map((m) => m[0]),
    mingli: [...text.matchAll(mingli)].map((m) => m[0]),
    few: [...text.matchAll(few)].map((m) => m[0]),
    problemLabel: [...text.matchAll(problemLabel)].map((m) => m[0]),
    punchDown: [...text.matchAll(punchDown)].map((m) => m[0]),
    bSelfAsOther: selfRe.test(bVoice) ? bVoice.slice(0, 160) : null,
    adviceN: tips.length,
    adviceBridgeAll: (j.qa?.adviceQa || []).every((a) => a.bridgeOk),
    adviceHeads: (j.qa?.adviceQa || []).map((a) => ({
      i: a.i,
      ok: a.bridgeOk,
      head: a.head,
    })),
    gapA: (gap.a_body || "").slice(0, 200),
    gapB: (gap.b_body || "").slice(0, 200),
    matchNote: (gap.match_note || "").slice(0, 200),
    gapAudible: gapAudible.test(bodies) || !bodies,
    guards: o.meta?.narrative_guards || [],
    domain: o.meta?.domain,
    topKeys: Object.keys(o),
  };
}

const out = {
  same: scan("friend-r2-same.json", "동글"),
  indep: scan("friend-r2-indep.json", "다시고고"),
};

const blockingFail = (s) =>
  s.nanim > 0 ||
  s.soft.length > 0 ||
  s.romance.length > 0 ||
  s.mingli.length > 0 ||
  s.few.length > 0 ||
  s.problemLabel.length > 0 ||
  s.punchDown.length > 0 ||
  s.bSelfAsOther ||
  !s.adviceBridgeAll ||
  s.adviceN < 6;

out.verdict = {
  samePass: !blockingFail(out.same),
  indepPass: !blockingFail(out.indep),
};

const outPath = path.join(TEMP, "friend-master-check.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
console.log(JSON.stringify(out, null, 2));
console.error(`WROTE ${outPath}`);
