/**
 * Friend-invite link preview — locale-aware Open Graph/Twitter metadata.
 *
 * Root cause this closes: app/invite/page.tsx was a Client Component with
 * no generateMetadata, so every invite link (any locale) fell through to
 * app/layout.tsx's static homepage title/description — a chat-app crawler
 * (KakaoTalk/iMessage/Slack/WhatsApp) fetching the invite URL server-side,
 * no JS, always saw the generic "Aha It's me! — Know yourself" preview.
 * Separately, proxy.ts only ever did `res.headers.set(...)` for the
 * resolved locale, which exposes a header to the CLIENT but never reaches
 * the SAME request's own Server Component render — so even a correct
 * generateMetadata would still resolve to en-US for a crawler's first,
 * cookie-less hit to /kr/invite. Both are fixed together; this suite
 * guards both by static source inspection (live proof was already done via
 * `curl` against the dev server for /invite and /kr/invite).
 *
 * Run: npx tsx tests/unit/invite-link-locale-metadata.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildInviteUrl,
  buildConnectUrl,
  inviteShareText,
} from "../../lib/relationship/inviteShare.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

let passed = 0;
function ok(name) {
  passed += 1;
  console.log(`ok - ${name}`);
}
function section(title) {
  console.log(`\n=== ${title} ===`);
}
function readSrc(relPath) {
  return readFileSync(join(root, relPath), "utf8");
}

section("A. Invite URLs carry the sharer's own locale prefix");
{
  assert.equal(
    buildInviteUrl("tok_abc", "ko-KR", "https://www.ahaitsme.com"),
    "https://www.ahaitsme.com/kr/invite?token=tok_abc",
  );
  assert.equal(
    buildInviteUrl("tok_abc", "en-US", "https://www.ahaitsme.com"),
    "https://www.ahaitsme.com/invite?token=tok_abc",
  );
  assert.equal(
    buildConnectUrl("tok_abc", "ko-KR", "https://www.ahaitsme.com"),
    "https://www.ahaitsme.com/kr/connect?token=tok_abc",
  );
  ok("buildInviteUrl/buildConnectUrl prefix by locale, token untouched");
}

section("B. Share text is locale-supplied, never hardcoded inside the module");
{
  assert.equal(
    inviteShareText("https://x/invite?token=t", "초대 메시지"),
    "초대 메시지\nhttps://x/invite?token=t",
  );
  const src = readSrc("lib/relationship/inviteShare.ts");
  assert.equal(
    /["']함께 관계 분석을 받아보자["']|["']친구 초대["']/.test(src),
    false,
    "inviteShare.ts must not hardcode any locale's copy — callers pass their own locale's message",
  );
  ok("inviteShareText takes the message as a parameter; module has zero hardcoded copy");
}

section("C. app/invite/page.tsx is a Server Component with locale-aware generateMetadata");
{
  const src = readSrc("app/invite/page.tsx");
  assert.equal(src.includes('"use client"'), false, 'page.tsx must not be "use client" — generateMetadata requires a Server Component');
  assert.ok(src.includes("export async function generateMetadata"));
  assert.ok(src.includes("getRequestLocale"));
  assert.ok(src.includes("buildPageMetadata"));
  assert.ok(src.includes("messages.invite.metaTitle"));
  assert.ok(src.includes("messages.invite.metaDescription"));
  ok("invite page exports generateMetadata using getRequestLocale + messages.invite.metaTitle/metaDescription");
}

section("D. metaTitle/metaDescription carry the agreed-on copy in both locales");
{
  const ko = readSrc("lib/i18n/messages/ko-KR.ts");
  const en = readSrc("lib/i18n/messages/en-US.ts");
  assert.ok(ko.includes("Aha! it's me · 함께 관계를 알아봐요"));
  assert.ok(ko.includes("초대를 수락하고, 우리 관계를 함께 알아보세요."));
  assert.ok(en.includes("Aha! it's me · Let's explore our relationship"));
  assert.ok(en.includes("Accept the invitation and discover how you connect."));
  ok("ko-KR/en-US invite.metaTitle/metaDescription match the exact agreed copy");
}

section("E. proxy.ts forwards the resolved locale to THIS request's own render");
{
  const src = readSrc("proxy.ts");
  assert.equal(
    /res\.headers\.set\(LOCALE_HEADER/.test(src),
    false,
    "the old response-only header set must be gone — it never reached the same request's Server Component render",
  );
  assert.ok(
    src.includes("request: { headers: withLocaleRequestHeaders(req,"),
    "both the /kr rewrite and the default en-US next() must forward the locale via the request-header form",
  );
  const rewriteCount = (src.match(/NextResponse\.rewrite\(url, \{/g) ?? []).length;
  const nextCount = (src.match(/NextResponse\.next\(\{/g) ?? []).length;
  assert.equal(rewriteCount, 1, "the ko-KR rewrite branch must pass the request-header init");
  assert.equal(nextCount, 1, "the default en-US next() branch must pass the request-header init");
  ok("proxy.ts forwards locale via NextResponse.{rewrite,next}({ request: { headers } }), not response headers");
}

console.log(`\n${passed} passed`);
