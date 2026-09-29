/**
 * Header EN | 한국어 switcher -- target URLs.
 * Run: npx tsx tests/unit/language-switcher.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { LANGUAGE_OPTIONS, languageSwitchHref } from "../../components/layout/stitch/LanguageSwitcher";

let passed = 0;
const ok = (n: string) => {
  passed += 1;
  console.log(`ok - ${n}`);
};

assert.equal(languageSwitchHref("/", "ko-KR"), "/kr");
assert.equal(languageSwitchHref("/kr", "en-US"), "/");
ok("/ -> /kr and /kr -> /");

assert.equal(languageSwitchHref("/pricing", "ko-KR"), "/kr/pricing");
assert.equal(languageSwitchHref("/kr/pricing", "en-US"), "/pricing");
assert.equal(languageSwitchHref("/kr/relationship/abc-123", "en-US"), "/relationship/abc-123");
assert.equal(languageSwitchHref("/blueprint-preview/r1/essence", "ko-KR"), "/kr/blueprint-preview/r1/essence");
ok("current path is preserved in both directions");

assert.equal(languageSwitchHref("/kr/redeem", "en-US", "?code=ABC#top"), "/redeem?code=ABC#top");
assert.equal(languageSwitchHref("/", "ko-KR", "#how-it-works"), "/kr#how-it-works");
ok("query string and hash are carried over");

assert.equal(languageSwitchHref("/en/faq", "ko-KR"), "/kr/faq");
assert.equal(languageSwitchHref("", "ko-KR"), "/kr");
ok("legacy /en prefix and empty path are normalized");

const header = readFileSync(new URL("../../components/layout/stitch/StitchFixedHeader.tsx", import.meta.url), "utf8");
assert.ok(header.includes("<LanguageSwitcher"), "switcher is rendered in the shared site header (all breakpoints)");
const sw = readFileSync(new URL("../../components/layout/stitch/LanguageSwitcher.tsx", import.meta.url), "utf8");
assert.ok(sw.includes('aria-current="true"') && sw.includes("<a"), "active language marked; other language is a full-navigation link");
assert.ok(/<LanguageSwitcher className="sm:mr-1" \/>/.test(header) && !/inline-flex[^"]*\bhidden\b/.test(sw), "the control itself is never hidden (only its long/short label swaps at sm)");
ok("header renders the switcher at every breakpoint with the active language marked");

assert.deepEqual(LANGUAGE_OPTIONS.map((o) => o.label), ["English (US)", "한국어 (KR)"]);
assert.deepEqual(LANGUAGE_OPTIONS.map((o) => o.locale), ["en-US", "ko-KR"]);
const menu = readFileSync(new URL("../../components/layout/stitch/StitchSideMenu.tsx", import.meta.url), "utf8");
assert.ok(menu.includes('<LanguageSwitcher variant="menu" />'), "full labels also in the mobile side menu");
ok("labels are 'English (US) | 한국어 (KR)' in header and side menu");

const proxy = readFileSync(new URL("../../proxy.ts", import.meta.url), "utf8");
assert.ok(!/accept-language|x-vercel-ip-country|geo/i.test(proxy), "no language/IP/country detection");
assert.ok(!sw.includes("navigator.language") && !sw.includes("useEffect"), "switcher never redirects on its own");
ok("no automatic redirect: proxy has no detection; switcher only navigates on click");

console.log(`\nlanguage-switcher: ${passed} passed`);
