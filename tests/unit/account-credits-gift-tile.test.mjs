/**
 * "My Credits" gift tile regression coverage (AccountCreditsSection.tsx +
 * GiftShareModal.tsx).
 *
 * This is a focused UI integration on top of the ALREADY-EXISTING gift
 * backend (gift_personal_coupons, redeem_gift_personal_coupon,
 * /api/account/entitlements' personalGifts field, and the /redeem page --
 * all shipped in the prior redeem-code-system change, see
 * tests/unit/redeem-code-system.test.mjs). Nothing here touches Paddle,
 * membership grant rules, Annual first-activation logic, gift creation,
 * credit-lot logic, or the redeem RPCs/routes -- this suite exists partly
 * to prove that (see section F).
 *
 * Static-source-assertion style (no jsdom/live render), matching this
 * repo's other tests/unit/* suites: DOM/render-shaped assertions are
 * approximated by (a) asserting the exact expression the component uses,
 * and (b) evaluating that same expression against fixture data so the
 * numbered spec cases are checked for real, not just described.
 *
 * Run: npx tsx tests/unit/account-credits-gift-tile.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getMessages } from "../../lib/i18n/messages/index.ts";

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

const creditsSrc = readSrc("components/account/AccountCreditsSection.tsx");
const modalSrc = readSrc("components/account/GiftShareModal.tsx");

// ---------------------------------------------------------------------------
// A. Personal / Relationship tiles unchanged, gift count fully separate
// ---------------------------------------------------------------------------
section("A. Personal/Relationship tiles unchanged; gift count is a separate value");
{
  assert.ok(
    creditsSrc.includes(
      "entitlements.personal.remaining > 0\n                ? copy.myAccessRemainingCount(entitlements.personal.remaining)",
    ),
    "Personal tile must still read entitlements.personal.remaining directly, unchanged",
  );
  assert.ok(
    creditsSrc.includes(
      "entitlements.relationship.remaining > 0\n                ? copy.myAccessRemainingCount(entitlements.relationship.remaining)",
    ),
    "Relationship tile must still read entitlements.relationship.remaining directly, unchanged",
  );
  ok("(1) Personal and Relationship credit tiles are untouched");

  assert.ok(
    !/entitlements\.personal\.remaining\s*\+/.test(creditsSrc) &&
      !/availableGiftsCount\s*\+\s*entitlements\.personal/.test(creditsSrc),
    "gift count must never be summed into the Personal (or Relationship) remaining count",
  );
  assert.ok(
    creditsSrc.includes(
      'const availableGiftsCount =\n    entitlements?.personalGifts.filter((g) => g.status === "available").length ?? 0;',
    ),
    "availableGiftsCount must be its own derived value, computed only from personalGifts",
  );
  ok("(2) Gift count is a fully separate derived value, never mixed into the Personal credit count");
}

// ---------------------------------------------------------------------------
// B. Gift count derivation matches spec (available-only, real evaluation)
// ---------------------------------------------------------------------------
section("B. Gift remaining count: available-only, evaluated against fixtures");
{
  // Kept in lockstep with the assertion above -- if the component's filter
  // expression ever changes, this literal string match fails loudly rather
  // than silently testing stale logic.
  function availableCount(personalGifts) {
    return personalGifts.filter((g) => g.status === "available").length;
  }

  assert.equal(
    availableCount([
      { code: "GIFT-AAAAAAAAAA", status: "available" },
      { code: "GIFT-BBBBBBBBBB", status: "available" },
    ]),
    2,
  );
  ok('(3) 2 available gifts => count 2 (renders myAccessRemainingCount(2) = "2 remaining")');

  assert.equal(
    availableCount([
      { code: "GIFT-AAAAAAAAAA", status: "claimed" },
      { code: "GIFT-BBBBBBBBBB", status: "available" },
    ]),
    1,
  );
  ok('(4) 1 claimed + 1 available => count 1 (renders "1 remaining")');

  assert.equal(
    availableCount([
      { code: "GIFT-AAAAAAAAAA", status: "expired" },
      { code: "GIFT-BBBBBBBBBB", status: "available" },
    ]),
    1,
  );
  ok("(5) An expired gift is never counted as available");
}

// ---------------------------------------------------------------------------
// C. Send-a-gift opens the modal; modal is read-only against the existing
//    inventory (no new gift creation)
// ---------------------------------------------------------------------------
section("C. Send-a-gift CTA opens GiftShareModal; modal never creates a gift");
{
  assert.ok(
    creditsSrc.includes("import GiftShareModal") &&
      creditsSrc.includes('from "@/components/account/GiftShareModal"'),
    "AccountCreditsSection must render the existing GiftShareModal, not a bespoke inline modal",
  );
  assert.ok(
    /onClick=\{\(\)\s*=>\s*setGiftModalOpen\(true\)\}/.test(creditsSrc),
    "the Send-a-gift button must open the gift modal",
  );
  assert.ok(
    creditsSrc.includes("<GiftShareModal") &&
      creditsSrc.includes("open={giftModalOpen}") &&
      creditsSrc.includes("gifts={entitlements.personalGifts}"),
    "GiftShareModal must be wired to the existing personalGifts array from /api/account/entitlements",
  );
  ok("(6) Send a gift opens the gift UI (GiftShareModal), fed from the existing personalGifts data");

  for (const forbidden of ["fetch(", "supabase", ".insert(", ".rpc(", "POST"]) {
    assert.ok(
      !modalSrc.includes(forbidden),
      `GiftShareModal must not perform any network/DB call (found "${forbidden}") -- it only reads the gifts prop and copies to the clipboard`,
    );
  }
  ok("(9) Opening/using the modal creates no new gift -- it makes no network or DB call at all, purely reads the gifts prop");
}

// ---------------------------------------------------------------------------
// D. Copy actions reuse the EXISTING gift code / redeem route -- no new code
// ---------------------------------------------------------------------------
section("D. Copy gift link / Copy gift code use the existing code and /redeem route");
{
  assert.ok(
    /const path = href\(`\$\{ROUTES\.redeem\}\?code=\$\{encodeURIComponent\(code\)\}`\)/.test(modalSrc),
    "copyLink must build a link against the existing ROUTES.redeem path with the gift's own code",
  );
  assert.ok(
    modalSrc.includes('import { ROUTES } from "@/constants/routes"'),
    "must reuse the existing ROUTES.redeem constant, not a hardcoded path",
  );
  ok("(7) Copy gift link uses the existing /redeem route + the gift's existing code, not a new link/token");

  assert.ok(
    /await navigator\.clipboard\.writeText\(code\)/.test(modalSrc),
    "copyCode must copy the gift's own `code` field verbatim (no re-derivation, no new code)",
  );
  ok("(8) Copy gift code copies the existing gift code verbatim");

  assert.ok(
    !modalSrc.includes("generateTesterCode") &&
      !modalSrc.includes("gen_random_uuid") &&
      !modalSrc.includes("crypto.randomUUID"),
    "the modal must never generate a code client-side",
  );
  ok("No code generation logic exists client-side -- every code shown was already issued by the backend");
}

// ---------------------------------------------------------------------------
// E. No Annual gift history => no misleading count (tile hidden entirely)
// ---------------------------------------------------------------------------
section("E. Users with no Annual gift history never see a misleading count");
{
  assert.ok(
    creditsSrc.includes("{entitlements.personalGifts.length > 0 ? (") &&
      creditsSrc.includes("          ) : null}\n        </div>"),
    "the entire gift tile must be gated on personalGifts.length > 0 and render nothing otherwise",
  );
  ok("(10) A user who was never issued an Annual gift (empty personalGifts) sees no gift tile at all -- not a tile claiming 0/None, just nothing");
}

// ---------------------------------------------------------------------------
// F. Scope: Paddle / membership / gift-creation / credit-lot / redeem logic
//    untouched by this UI-only change
// ---------------------------------------------------------------------------
section("F. Scope -- Paddle, membership grants, gift creation, credit-lot, redeem RPCs untouched");
{
  for (const forbidden of ["paddle", "Paddle", "grant_credit_lot", "process_us_purchase", "membership_term_grants"]) {
    assert.ok(
      !creditsSrc.includes(forbidden) && !modalSrc.includes(forbidden),
      `neither AccountCreditsSection nor GiftShareModal should reference "${forbidden}" -- this is a read-only UI layer over the existing entitlements API`,
    );
  }
  ok("This UI integration never references Paddle, membership grant rules, or credit-lot internals directly");

  const redeemRoute = readSrc("app/api/redeem/route.ts");
  const redeemPage = readSrc("app/redeem/page.tsx");
  assert.ok(
    redeemRoute.includes("redeemGiftPersonalCoupon") && redeemRoute.includes("redeemTesterPersonalCode"),
    "the existing /api/redeem dispatch logic must be unchanged",
  );
  assert.ok(
    redeemPage.includes('fetch("/api/redeem"') && redeemPage.includes('searchParams.get("code")'),
    "the existing /redeem page (manual entry + ?code= claim-link flow) must be unchanged",
  );
  ok("(12) The existing /redeem page and /api/redeem dispatch logic are unchanged by this UI-only integration");
}

// ---------------------------------------------------------------------------
// G. EN/KR copy
// ---------------------------------------------------------------------------
section("G. EN/KR copy for the tile and modal");
{
  const en = getMessages("en-US");
  const ko = getMessages("ko-KR");

  assert.equal(en.account.myAccessGiftsTileLabel, "Personal analysis gifts");
  assert.equal(en.account.myAccessGiftsSendCta, "Send a gift");
  assert.equal(en.account.myAccessGiftsModalTitle, "Gift a Personal Analysis");
  assert.equal(en.account.myAccessGiftsModalRemaining(2), "You have 2 gifts remaining.");
  assert.equal(en.account.myAccessGiftsModalRemaining(1), "You have 1 gift remaining.");
  assert.equal(en.account.myAccessGiftCopyCode, "Copy gift code");
  assert.equal(en.account.myAccessGiftCopyLink, "Copy gift link");

  assert.equal(ko.account.myAccessGiftsTileLabel, "개인 분석 선물");
  assert.equal(ko.account.myAccessGiftsSendCta, "선물 보내기");
  assert.equal(ko.account.myAccessGiftsModalTitle, "개인 분석 선물하기");
  assert.equal(ko.account.myAccessGiftCopyCode, "선물 코드 복사");
  assert.equal(ko.account.myAccessGiftCopyLink, "선물 링크 복사");

  ok("(11) EN/KR copy for the tile label, Send-a-gift CTA, modal title/body, and copy actions all match spec");
}

console.log(`\nAll ${passed} account-credits gift-tile regression tests passed.`);
