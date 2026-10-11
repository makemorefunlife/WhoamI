/**
 * Stage 1 (2026-10-11): one return rule after sign-in / sign-up / KR consent.
 * Run: npx tsx tests/unit/auth-return-path.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { continueHref, sanitizeReturnPath } from "../../lib/auth/returnPath";
import { GET } from "../../app/api/auth/continue/route";

let n = 0;
const ok = (name: string, fn: () => void | Promise<void>) =>
  Promise.resolve(fn()).then(() => { n++; console.log(`ok - ${name}`); });

async function main() {
  await ok("keeps internal paths with locale and purpose", () => {
    assert.equal(sanitizeReturnPath("/kr/checkout/toss/claim?orderId=AB"), "/kr/checkout/toss/claim?orderId=AB");
    assert.equal(sanitizeReturnPath("/relationships?section=add&myReportId=x"), "/relationships?section=add&myReportId=x");
    assert.equal(sanitizeReturnPath("/?token=abc"), "/?token=abc");
  });
  await ok("rejects external and tricky targets", () => {
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "/ x", "/a\nb", "", null, 42])
      assert.equal(sanitizeReturnPath(bad as never), null, String(bad));
  });
  await ok("rejects loops into auth/consent/API", () => {
    for (const bad of ["/sign-in", "/sign-up?x=1", "/kr/sign-in", "/onboarding/legal-consent?next=/", "/api/x", "/sso-callback"])
      assert.equal(sanitizeReturnPath(bad), null, bad);
    assert.equal(sanitizeReturnPath("/sign-instead"), "/sign-instead");
  });
  await ok("server continue route redirects only inside the site", async () => {
    const go = async (to: string) => {
      const res = GET(new Request(`https://ahaitsme.test/api/auth/continue?to=${encodeURIComponent(to)}`));
      return new URL(res.headers.get("location")!);
    };
    assert.equal((await go("/kr/invite-birth")).pathname, "/kr/invite-birth");
    const ext = await go("https://evil.com/x");
    assert.equal(ext.host, "ahaitsme.test"); assert.equal(ext.pathname, "/");
    const dbl = await go("//evil.com");
    assert.equal(dbl.host, "ahaitsme.test");
    assert.equal(continueHref("https://evil.com"), "/api/auth/continue?to=%2F");
  });
  await ok("wiring: consent returns to origin; sign-in/up use the server check; no forced home", () => {
    const consent = readFileSync("app/onboarding/legal-consent/page.tsx", "utf8");
    assert.match(consent, /continueHref\(next, href\(ROUTES\.home\)\)/);
    assert.doesNotMatch(consent, /router\.replace\(href\(ROUTES\.home\)\)/);
    const guard = readFileSync("components/legal/LegalConsentGuard.tsx", "utf8");
    assert.match(guard, /RETURN_QUERY_KEY/);
    assert.match(readFileSync("app/sign-in/[[...sign-in]]/page.tsx", "utf8"), /forceRedirectUrl=\{afterSignIn\}/);
    assert.match(readFileSync("app/sign-up/[[...sign-up]]/page.tsx", "utf8"), /continueHref\(/);
    assert.match(readFileSync("app/invite/InviteContent.tsx", "utf8"), /redirect_url=/);
    assert.match(readFileSync("app/homecontent.tsx", "utf8"), /fallbackRedirectPath="\/\?start=self"/);
    for (const f of ["app/checkout/toss/success/TossSuccessClient.tsx", "lib/payment/postPurchaseDestination.ts", "lib/relationship/selfProfileReturn.ts"])
      assert.match(readFileSync(f, "utf8"), /sanitizeReturnPath/, f);
  });
  console.log(`\n${n} passed`);
}
main().catch((e) => { console.error(e); process.exit(1); });
