/**
 * Locale SSOT unit tests
 * Run: npx tsx tests/unit/locale.test.mjs
 */
import assert from "node:assert/strict";
import {
  normalizeLocale,
  localeToPathPrefix,
  pathPrefixToLocale,
  localizedPath,
  isEnPrefixedPath,
  stripEnPrefix,
  stripKrPrefix,
  localeToHtmlLang,
} from "../../lib/i18n/locale.ts";

function section(title) {
  console.log(`\n=== ${title} ===`);
}

section("normalizeLocale");
assert.equal(normalizeLocale("en"), "en-US");
assert.equal(normalizeLocale("en-US"), "en-US");
assert.equal(normalizeLocale("EN_us"), "en-US");
assert.equal(normalizeLocale("/"), "en-US");
assert.equal(normalizeLocale("ko"), "ko-KR");
assert.equal(normalizeLocale("ko-KR"), "ko-KR");
assert.equal(normalizeLocale("kr"), "ko-KR");
assert.equal(normalizeLocale("/kr"), "ko-KR");
assert.equal(normalizeLocale("/kr/survey-v2"), "ko-KR");
assert.equal(normalizeLocale("bogus"), "en-US");
assert.equal(normalizeLocale(null), "en-US");
assert.equal(normalizeLocale(undefined), "en-US");
assert.equal(normalizeLocale(""), "en-US");
console.log("  ✓ normalizeLocale");

section("pathPrefixToLocale / localeToPathPrefix");
assert.equal(pathPrefixToLocale("/"), "en-US");
assert.equal(pathPrefixToLocale("/about"), "en-US");
assert.equal(pathPrefixToLocale("/kr"), "ko-KR");
assert.equal(pathPrefixToLocale("/kr/about"), "ko-KR");
assert.equal(localeToPathPrefix("en-US"), "");
assert.equal(localeToPathPrefix("ko-KR"), "/kr");
assert.equal(localeToHtmlLang("en-US"), "en");
assert.equal(localeToHtmlLang("ko-KR"), "ko");
console.log("  ✓ path / prefix helpers");

section("localizedPath");
assert.equal(localizedPath("/about", "en-US"), "/about");
assert.equal(localizedPath("/about", "ko-KR"), "/kr/about");
assert.equal(localizedPath("/", "ko-KR"), "/kr");
assert.equal(localizedPath("/survey-v2?x=1", "ko-KR"), "/kr/survey-v2?x=1");
assert.equal(localizedPath("/api/v2/survey", "ko-KR"), "/api/v2/survey");
assert.equal(localizedPath("/kr/about", "ko-KR"), "/kr/about");
assert.equal(localizedPath("/en/about", "en-US"), "/about");
console.log("  ✓ localizedPath");

section("en/kr strip");
assert.equal(isEnPrefixedPath("/en"), true);
assert.equal(isEnPrefixedPath("/en/about"), true);
assert.equal(isEnPrefixedPath("/about"), false);
assert.equal(stripEnPrefix("/en/about"), "/about");
assert.equal(stripKrPrefix("/kr/survey-v2"), "/survey-v2");
assert.equal(stripKrPrefix("/kr"), "/");
console.log("  ✓ strip helpers");

console.log("\nOK: locale tests passed");
