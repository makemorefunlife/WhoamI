/**
 * Stage 0 fixes (2026-10-09):
 *  1. reading the friend list never deletes invites; unused invites expire after 30 days
 *  2. ko-KR: no forced survey before birth-based free / paid Personal pages (en-US unchanged)
 *  3. relationship "premium ready" is judged in the viewed language
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { INVITE_TTL_DAYS, inviteExpiryCutoffIso, isInviteExpired } from "../../lib/relationship/inviteExpiry";
import { isRelationshipPremiumComplete } from "../../lib/relationship/isRelationshipPremiumComplete";
import { mergePremiumKindLocale } from "../../lib/relationship/premiumByKind";
import { isPsychSurveyRequired } from "../../lib/i18n/localePolicy";
import { decideBlueprintMissingStep } from "../../lib/v2/blueprint/blueprintMissingStep";

let n = 0;
const ok = (m: string) => {
  n++;
  console.log(`ok - ${m}`);
};

// 1. invites
{
  const now = new Date("2026-10-09T00:00:00Z");
  assert.equal(INVITE_TTL_DAYS, 30);
  assert.equal(isInviteExpired("2026-09-10T00:00:01Z", now), false, "29d23h59m old: still valid");
  assert.equal(isInviteExpired("2026-09-09T00:00:00Z", now), true, "exactly 30 days: expired");
  assert.equal(isInviteExpired(null, now), false);
  assert.equal(inviteExpiryCutoffIso(now), "2026-09-09T00:00:00.000Z");
  // route + the list logic it calls (lib/relationship/hubList.ts)
  const list = readFileSync("app/api/relationship/list/route.ts", "utf8") + readFileSync("lib/relationship/hubList.ts", "utf8");
  assert.doesNotMatch(list, /cleanupStaleOpenInvites\s*\(/, "list route no longer deletes invites");
  assert.doesNotMatch(list, /\.delete\(/, "list route performs no deletes");
  const complete = readFileSync("app/api/invite/complete/route.ts", "utf8");
  assert.match(complete, /\.gt\("created_at", inviteExpiryCutoffIso\(\)\)/, "complete only consumes unexpired invites");
  assert.match(complete, /invite_expired/);
  ok("invites: list is read-only; 30-day expiry enforced when completing");
}

// 2. survey optional (ko-KR) vs required (en-US) -- the pure rule used by all blueprint pages
{
  const kr = isPsychSurveyRequired("ko-KR");
  const us = isPsychSurveyRequired("en-US");
  assert.equal(kr, false);
  assert.equal(us, true);
  assert.equal(decideBlueprintMissingStep({ reportId: "r1", hasSurvey: false, hasBirth: true, surveyRequired: kr }), null, "KR: birth only is enough");
  assert.equal(decideBlueprintMissingStep({ reportId: "r1", hasSurvey: false, hasBirth: false, surveyRequired: kr }), "/onboarding/birth?reportId=r1", "KR: missing birth -> birth page (not the survey)");
  assert.equal(decideBlueprintMissingStep({ reportId: "r1", hasSurvey: false, hasBirth: true, surveyRequired: us }), "/survey-v2?reportId=r1", "US: survey still required");
  assert.equal(decideBlueprintMissingStep({ reportId: "r1", hasSurvey: true, hasBirth: false, surveyRequired: us }), "/survey-v2/complete?reportId=r1");
  assert.equal(decideBlueprintMissingStep({ reportId: "r1", hasSurvey: true, hasBirth: true, surveyRequired: us }), null);
  for (const f of [
    "app/blueprint-preview/page.tsx",
    "app/blueprint-preview/[reportId]/current/page.tsx",
    "app/blueprint-preview/[reportId]/essence/page.tsx",
    "app/blueprint-preview/[reportId]/essence/deep/page.tsx",
  ]) {
    const src = readFileSync(f, "utf8");
    assert.match(src, /blueprintMissingStepPath\(/, `${f} uses the shared rule`);
    assert.doesNotMatch(src, /router\.replace\(localize\((ROUTES\.surveyV2|"\/survey-v2")\)\)/, `${f}: no unconditional survey redirect`);
  }
  const bundle = readFileSync("lib/v2/blueprint/useBlueprintBundle.ts", "utf8");
  assert.match(bundle, /if \(!survey && surveyRequired\)/, "bundle drops only when the survey is required");
  ok("blueprint: KR opens free + paid Personal pages without a survey; US unchanged");
}

// 3. premium ready per language
{
  const byKind = mergePremiumKindLocale({}, "romantic", "ko-KR", { report: { ok: true } } as never);
  const ko = isRelationshipPremiumComplete("premium", byKind, "romantic", "ko-KR");
  const en = isRelationshipPremiumComplete("premium", byKind, "romantic", "en-US");
  assert.equal(en, false, "only a Korean report -> not ready in English");
  assert.equal(ko, isRelationshipPremiumComplete("premium", byKind, "romantic"), "same answer as language-agnostic when it exists in that language");
  const detail = readFileSync("app/api/relationship/detail/route.ts", "utf8");
  assert.match(detail, /hasPremiumCacheForKindLocale\(byKind, k, locale\)/, "detail: premium_kinds_ready per language");
  ok("relationship premium ready is judged in the viewed language");
}

console.log(`\nstage0-fixes: ${n} passed`);
