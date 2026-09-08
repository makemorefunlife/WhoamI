/**
 * Regression test suite for UI/content cleanup batch:
 * 1. Unified Instagram URL (https://www.instagram.com/aha_itsme_/) across site footer and contact page.
 * 2. Official contact email (contact@ahaitsme.com) on Contact page and business footer info.
 * 3. Unified footer background color (bg-primary) and text contrast across all pages via SSOT StitchAppFooter.
 *
 * Run: npx tsx tests/unit/footer-and-contact-cleanup.test.mjs
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

const TARGET_INSTAGRAM_URL = "https://www.instagram.com/aha_itsme_/";
const OLD_INSTAGRAM_URL = "https://www.instagram.com/ahaitsme";
const TARGET_CONTACT_EMAIL = "contact@ahaitsme.com";

section("1. Instagram Link Unification");
{
  const aboutSrc = readSrc("app/about/page.tsx");
  const contactSrc = readSrc("app/contact/page.tsx");
  const layoutSrc = readSrc("app/layout.tsx");

  assert.ok(
    aboutSrc.includes(TARGET_INSTAGRAM_URL),
    "About page must use https://www.instagram.com/aha_itsme_/",
  );
  assert.ok(
    contactSrc.includes(TARGET_INSTAGRAM_URL),
    "Contact page must use https://www.instagram.com/aha_itsme_/",
  );
  assert.ok(
    layoutSrc.includes(TARGET_INSTAGRAM_URL),
    "Layout JSON-LD must use https://www.instagram.com/aha_itsme_/",
  );

  assert.equal(
    aboutSrc.includes(OLD_INSTAGRAM_URL),
    false,
    "About page must not contain old instagram URL",
  );
  assert.equal(
    contactSrc.includes(OLD_INSTAGRAM_URL),
    false,
    "Contact page must not contain old instagram URL",
  );
  assert.equal(
    layoutSrc.includes(OLD_INSTAGRAM_URL),
    false,
    "Layout must not contain old instagram URL",
  );

  ok("Official Instagram URL is unified to https://www.instagram.com/aha_itsme_/ across About, Contact, and Layout");
}

section("2. Official Contact Email Unification");
{
  const contactSrc = readSrc("app/contact/page.tsx");
  const layoutSrc = readSrc("app/layout.tsx");
  const koMessages = getMessages("ko-KR");
  const enMessages = getMessages("en-US");

  assert.ok(
    contactSrc.includes(TARGET_CONTACT_EMAIL),
    "Contact page must show contact@ahaitsme.com",
  );
  assert.equal(
    contactSrc.includes("hong@ahaitsme.com"),
    false,
    "Contact page must not display personal hong@ email",
  );

  assert.ok(
    layoutSrc.includes(TARGET_CONTACT_EMAIL),
    "Layout JSON-LD must use contact@ahaitsme.com",
  );

  assert.equal(
    koMessages.footer.business.email,
    TARGET_CONTACT_EMAIL,
    "ko-KR footer.business.email must be contact@ahaitsme.com",
  );
  assert.equal(
    enMessages.footer.business.email,
    TARGET_CONTACT_EMAIL,
    "en-US footer.business.email must be contact@ahaitsme.com",
  );

  ok("Official public contact email is updated to contact@ahaitsme.com");
}

section("3. Footer Background Color & SSOT Unification");
{
  const footerSrc = readSrc("components/layout/stitch/StitchAppFooter.tsx");

  assert.ok(
    footerSrc.includes("bg-primary"),
    "StitchAppFooter must use bg-primary for unified footer background color",
  );
  assert.ok(
    footerSrc.includes("text-on-primary"),
    "StitchAppFooter must use text-on-primary for readable high contrast",
  );
  assert.equal(
    footerSrc.includes("bg-surface-container-low/35"),
    false,
    "StitchAppFooter must no longer use transparent bg-surface-container-low/35",
  );

  ok("StitchAppFooter uses bg-primary text-on-primary as SSOT across all subpages");
}

console.log(`\nAll ${passed} UI/content cleanup tests passed.`);
