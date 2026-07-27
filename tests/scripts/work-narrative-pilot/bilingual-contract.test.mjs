/**
 * Batch V bilingual voice contract.
 * Run: npx tsx tests/scripts/work-narrative-pilot/bilingual-contract.test.mjs
 */
import assert from "node:assert/strict";
import { buildWorkColleagueReport } from "../../../lib/relationship/workColleague/buildWorkColleagueReport.ts";
import { buildWorkPilotContextPackage } from "./buildContextPackage.ts";
import { canonicalHash, contextHash } from "./pilotHashes.ts";
import {
  buildVariantCVoiceSystemPrompt,
  buildVariantUserPrompt,
} from "./prompts.ts";
import { PILOT_FIXTURES, sajuFromBirth } from "./fixtures.ts";
import {
  BILINGUAL_VOICE_CONTRACT_MARKERS,
  VOICE_POLICY_VERSION,
} from "./voicePolicy.ts";

function ok(name) {
  console.log(`ok - ${name}`);
}

const koSys = buildVariantCVoiceSystemPrompt("ko-KR");
const enSys = buildVariantCVoiceSystemPrompt("en-US");

assert.ok(koSys.includes(VOICE_POLICY_VERSION));
assert.ok(enSys.includes(VOICE_POLICY_VERSION));
assert.ok(koSys.includes(BILINGUAL_VOICE_CONTRACT_MARKERS.meaningParity));
assert.ok(enSys.includes(BILINGUAL_VOICE_CONTRACT_MARKERS.meaningParity));
assert.ok(koSys.includes(BILINGUAL_VOICE_CONTRACT_MARKERS.playfulnessCap));
assert.ok(enSys.includes(BILINGUAL_VOICE_CONTRACT_MARKERS.playfulnessCap));
assert.ok(koSys.includes(BILINGUAL_VOICE_CONTRACT_MARKERS.noJudgmentChange));
assert.ok(enSys.includes(BILINGUAL_VOICE_CONTRACT_MARKERS.noJudgmentChange));
assert.ok(koSys.includes(BILINGUAL_VOICE_CONTRACT_MARKERS.koHonorific));
assert.ok(enSys.includes(BILINGUAL_VOICE_CONTRACT_MARKERS.enDirect));
assert.ok(koSys.includes("관찰 → 이유 → 실제 장면 → 권장 행동"));
assert.ok(enSys.includes("Lead with the core observation"));
assert.ok(koSys.includes("stock_fast_vs_detail_allowed is ALWAYS false"));
assert.ok(enSys.includes("stock_fast_vs_detail_allowed is ALWAYS false"));
ok("voice policies attached without dropping Batch IV gates");

const fx = PILOT_FIXTURES[0];
const report = buildWorkColleagueReport({
  nicknameA: fx.nicknameA,
  nicknameB: fx.nicknameB,
  sajuJsonA: sajuFromBirth(fx.birthA, fx.timeA),
  sajuJsonB: sajuFromBirth(fx.birthB, fx.timeB),
  psychMasterA: fx.psychA,
  psychMasterB: fx.psychB,
  workSignalsA: fx.workSignalsA,
  workSignalsB: fx.workSignalsB,
  locale: fx.locale,
});
const pkg = buildWorkPilotContextPackage({
  pair_id: fx.pair_id,
  category: fx.category,
  nicknameA: fx.nicknameA,
  nicknameB: fx.nicknameB,
  sajuJsonA: sajuFromBirth(fx.birthA, fx.timeA),
  sajuJsonB: sajuFromBirth(fx.birthB, fx.timeB),
  psychMasterA: fx.psychA,
  psychMasterB: fx.psychB,
  workSignalsA: fx.workSignalsA,
  workSignalsB: fx.workSignalsB,
  locale: fx.locale,
  report,
  variant: "C",
});

const h1 = canonicalHash(pkg);
const h2 = contextHash(pkg);
const userKo = buildVariantUserPrompt(pkg, { outputLocale: "ko-KR" });
const userEn = buildVariantUserPrompt(pkg, { outputLocale: "en-US" });
assert.equal(h1, canonicalHash(pkg));
assert.equal(h2, contextHash(pkg));
assert.ok(userKo.includes("output_locale: ko-KR"));
assert.ok(userEn.includes("output_locale: en-US"));
assert.ok(userKo.includes(VOICE_POLICY_VERSION));
assert.ok(userEn.includes("change delivery only"));
ok("same package yields stable hashes; locale only in prompt wrapper");

console.log("\nAll bilingual-contract checks passed.");
