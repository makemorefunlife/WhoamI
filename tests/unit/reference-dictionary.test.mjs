/**
 * Reference Dictionary MVP unit tests
 * Run: npx tsx tests/unit/reference-dictionary.test.mjs
 */
import assert from "node:assert/strict";
import {
  REFERENCE_DICTIONARY_VERSION,
  REFERENCE_SOURCE_INVENTORY,
  FIELD_CLASSIFICATIONS,
  buildReferenceDictionary,
  getReferenceDictionary,
  resetReferenceDictionaryCache,
  lookupReference,
  listByCategory,
  requireReference,
  assertDictionaryPurity,
  FORBIDDEN_ENTRY_KEYS,
} from "../../lib/personCore/referenceDictionary/index.ts";
import {
  stemReferenceId,
  branchReferenceId,
  tenGodReferenceId,
  twelveStageReferenceId,
  shinsalReferenceId,
  relationReferenceId,
  hiddenStemReferenceId,
} from "../../lib/personCore/individualSaju/refIds.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}

section("schema version + build");
resetReferenceDictionaryCache();
const dict = buildReferenceDictionary("2026-07-29T00:00:00.000Z");
assert.equal(dict.schema_version, REFERENCE_DICTIONARY_VERSION);
assert.equal(dict.built_at, "2026-07-29T00:00:00.000Z");
assert.ok(dict.entry_count > 100, `expected many entries, got ${dict.entry_count}`);
assert.equal(dict.entry_count, dict.entries.length);
assert.equal(Object.keys(dict.by_id).length, dict.entry_count);
console.log(`  ✓ built ${dict.entry_count} entries`);

section("required categories present");
const categories = [
  "element",
  "stem",
  "branch",
  "ten_god",
  "twelve_stage",
  "hidden_layer",
  "hidden_stem",
  "relation_type",
  "relation_pair",
  "shinsal",
  "noble",
  "special_signal",
  "strength",
  "johu_temp",
  "johu_moist",
  "pillar_slot",
  "gongmang",
];
for (const cat of categories) {
  const rows = listByCategory(cat, dict);
  assert.ok(rows.length > 0, `missing category ${cat}`);
}
assert.equal(listByCategory("stem", dict).length, 10);
assert.equal(listByCategory("branch", dict).length, 12);
assert.equal(listByCategory("ten_god", dict).length, 10);
assert.equal(listByCategory("element", dict).length, 5);
console.log("  ✓ all MVP categories populated");

section("stable ids align with Individual refIds");
assert.ok(lookupReference(stemReferenceId("gap"), dict));
assert.ok(lookupReference(branchReferenceId("ja"), dict));
assert.ok(lookupReference(tenGodReferenceId("bigyeon"), dict));
assert.ok(lookupReference(twelveStageReferenceId("jangsaeng"), dict));
assert.ok(lookupReference(shinsalReferenceId(15), dict));
assert.ok(lookupReference(relationReferenceId(30), dict));
assert.ok(lookupReference(hiddenStemReferenceId("ja", "gye", "residual"), dict));
assert.ok(lookupReference("noble:cheoneul_guin", dict));
assert.ok(lookupReference("strength:shin_gang", dict));
assert.ok(lookupReference("gongmang:void", dict));
assert.ok(lookupReference("special:dohwa", dict));
console.log("  ✓ reference_id scheme");

section("purity — no advice/trait/domain fields");
const purity = assertDictionaryPurity(dict);
assert.equal(purity.ok, true, purity.errors.join("\n"));
for (const e of dict.entries) {
  const json = JSON.stringify(e);
  for (const key of FORBIDDEN_ENTRY_KEYS) {
    if (
      key === "romantic" ||
      key === "marriage" ||
      key === "friend" ||
      key === "family" ||
      key === "work" ||
      key === "narrative" ||
      key === "prompt" ||
      key === "advice"
    ) {
      continue;
    }
    assert.equal(
      new RegExp(`"${key}"\\s*:`).test(json),
      false,
      `${e.reference_id} has ${key}`,
    );
  }
  assert.equal(e.limits.allows_advice, false);
  assert.equal(e.limits.allows_domain_lens, false);
  assert.equal(e.limits.allows_narrative, false);
}
console.log(
  `  ✓ structural purity (advice-like base_meaning count=${purity.advice_like_base_meaning_count} — cleanup candidates only)`,
);

section("relation pair excludes REF interpretive meaning_ko");
const pair = requireReference(relationReferenceId(30), dict);
assert.ok(pair.base_meaning.ko.includes("오묘파") || pair.base_meaning.ko.includes("branch_break"));
assert.equal(pair.base_meaning.ko.includes("새로운 시도가 필요합니다"), false);
console.log("  ✓ relation pair structural only");

section("hidden stem excludes personality prose");
const hidden = requireReference(
  hiddenStemReferenceId("ja", "gye", "residual"),
  dict,
);
assert.match(hidden.base_meaning.ko, /지장간/);
assert.equal(hidden.base_meaning.ko.includes("속마음을 털어놓는"), false);
console.log("  ✓ hidden stem factual only");

section("ten god null meaning gets fallback");
const geopjae = requireReference(tenGodReferenceId("geopjae"), dict);
assert.ok(geopjae.base_meaning.ko.includes("겁재"));
console.log("  ✓ ten god fallback");

section("lookup helpers + singleton");
resetReferenceDictionaryCache();
const a = getReferenceDictionary();
const b = getReferenceDictionary();
assert.equal(a, b);
assert.equal(lookupReference("missing:id"), null);
assert.throws(() => requireReference("missing:id"));
console.log("  ✓ lookup + cache");

section("inventory artifact");
assert.ok(REFERENCE_SOURCE_INVENTORY.length >= 10);
assert.ok(FIELD_CLASSIFICATIONS.length >= 20);
const buckets = new Set(FIELD_CLASSIFICATIONS.map((c) => c.bucket));
for (const need of [
  "A_dictionary_base_meaning",
  "B_display_metadata",
  "C_remain_ssot",
  "D_move_to_context_engine",
  "E_delete_or_ignore",
]) {
  assert.ok(buckets.has(need), `missing bucket ${need}`);
}
console.log("  ✓ inventory classifications");

console.log("\nOK: reference dictionary tests passed");
