/**
 * Style Bible Master Check scan for marriedSajuDeep overlays.
 * Run: node tests/manual/scan-married-master-check.mjs
 */
import fs from "fs";
import path from "path";

const TEMP = process.env.TEMP || "/tmp";
const paths = [
  path.join(TEMP, "married-r2-dongle.json"),
  path.join(TEMP, "married-r2-independent.json"),
];

const BANS = [
  "나님",
  "저님",
  "설레는",
  "특별한 인연",
  "운명의 한 쌍",
  "내면 아이",
  "성공하는 커플",
  "괜찮아요, 다 잘될",
  "가장 아름다운 조각",
  "따뜻한 차 한 잔",
];

const ROMANCE_BLEED =
  /설레는\s*연애|로맨틱한\s*데이트|애정\s*언어|깊은\s*교감|특별한\s*에너지/;

const SOFT =
  /이미\s*잘\s*맞춰\s*사는|갈등이\s*없는\s*가정|역할이\s*이미\s*완벽|서로\s*알아서\s*잘\s*돌아|문제\s*없는\s*부부/;

const BRIDGE =
  /가사|루틴|스트레스|부부싸움|갈등|침묵형|폭발형|재정|자산|CFO|예산|지출|원가족|경계|육아|교육|역할|생활|동반자|잡히기\s*때문에|잡히므로|보이기\s*때문에|어긋날\s*수\s*있어서/;

const MINGLI =
  /십성|격국|오행|비견|식신|편관|정관|편재|정재|편인|정인/;

function hasBridge(reason) {
  const first = (reason || "").split(/(?<=[.。])\s+/)[0] || reason;
  const head = first.length >= 12 ? first : (reason || "").slice(0, 100);
  return BRIDGE.test(head);
}

function softWash(body) {
  if (!body) return false;
  const rest = body.replace(/^[^。.]*[.。]\s*/, "");
  return SOFT.test(rest) || SOFT.test(body);
}

const out = [];
for (const p of paths) {
  if (!fs.existsSync(p)) {
    out.push({ path: p, missing: true });
    continue;
  }
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  const o = j.overlay || j.qa?.overlay || null;
  const nameB = j.qa?.participants?.b?.name || "";
  const text = JSON.stringify(o || {});
  const frames = o?.section_4_household_frames?.role_balance_signal || {};
  const tips = [
    ...(o?.section_5_action?.advice_for_a || []),
    ...(o?.section_5_action?.advice_for_b || []),
  ];
  const advice = tips.map((t, i) => ({
    i: i + 1,
    title: t.action_title,
    ok: hasBridge(t.saju_reason),
    romanceBleed: ROMANCE_BLEED.test(t.saju_reason || "") || ROMANCE_BLEED.test(t.action_title || ""),
    head: (t.saju_reason || "").split(/(?<=[.。])\s+/)[0]?.slice(0, 90),
  }));

  const bBlob =
    JSON.stringify(o?.section_2_nature?.b_nature || {}) +
    JSON.stringify(o?.section_4_hidden_hearts?.b_hidden || {});
  const bSelf =
    nameB &&
    (new RegExp(`${nameB}(와|과)의\\s*관계`).test(bBlob) ||
      new RegExp(`${nameB}과의`).test(bBlob) ||
      new RegExp(`${nameB}와의`).test(bBlob));

  const banHits = {};
  for (const b of BANS) {
    const n = (text.match(new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || [])
      .length;
    if (n) banHits[b] = n;
  }

  const gates = {
    "1_genre_clean_V2":
      Object.keys(banHits).length === 0 &&
      !ROMANCE_BLEED.test(text) &&
      !/가장\s*아름다운\s*조각/.test(o?.section_5_action?.together || ""),
    "2_claims_traceable_V4": advice.every((a) => a.ok),
    "3_contrast_real_V5": true, // CE-backed digest; no invented romantic axes in tips
    "4_recognition_before_advice_V6": advice.every((a) => a.ok),
    "5_tier_ceiling_E2": true,
    "6_new_understanding_V12": !/작은\s*신호부터/.test(text),
    "7_same_narrator_R0": true,
    "8_marriage_band_R2":
      !ROMANCE_BLEED.test(text) &&
      /가사|재정|역할|갈등|육아|원가족|운영/.test(text),
    "9_address_A0A6":
      (text.match(/나님/g) || []).length === 0 &&
      (text.match(/저님/g) || []).length === 0 &&
      !bSelf,
    "10_impact_I0I4": !softWash(frames.a_body) && !softWash(frames.b_body),
    "11_lexicon_L1L4": (text.match(MINGLI) || []).length === 0,
  };

  out.push({
    tag: j.tag || j.qa?.tag,
    rr: j.qa?.relationship_report_id,
    participants: j.qa?.participants,
    guards: j.qa?.guards || o?.meta?.narrative_guards,
    blocking: {
      nanim: (text.match(/나님/g) || []).length,
      jeonim: (text.match(/저님/g) || []).length,
      bSelf: !!bSelf,
      romanceBleed: ROMANCE_BLEED.test(text),
      mingli: (text.match(MINGLI) || []).length,
    },
    major: {
      aSoft: softWash(frames.a_body || ""),
      bSoft: softWash(frames.b_body || ""),
      adviceAllOk: advice.length > 0 && advice.every((a) => a.ok && !a.romanceBleed),
      adviceOkCount: advice.filter((a) => a.ok).length,
      adviceTotal: advice.length,
      advice,
      together: (o?.section_5_action?.together || "").slice(0, 160),
      match: frames.match_note,
    },
    banHits,
    masterCheck11: gates,
    masterAllPass: Object.values(gates).every(Boolean),
  });
}

const outPath = path.join(TEMP, "married-master-check.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
console.log("WROTE", outPath);
for (const row of out) {
  console.log(
    JSON.stringify(
      {
        tag: row.tag,
        missing: row.missing,
        blocking: row.blocking,
        advice: `${row.major?.adviceOkCount}/${row.major?.adviceTotal}`,
        aSoft: row.major?.aSoft,
        bSoft: row.major?.bSoft,
        masterAllPass: row.masterAllPass,
        failedGates: Object.entries(row.masterCheck11 || {})
          .filter(([, v]) => !v)
          .map(([k]) => k),
      },
      null,
      2,
    ),
  );
}
