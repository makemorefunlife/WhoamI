import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { getMessages } from "../../lib/i18n/messages/index.ts";
import { relationshipKindBadgeLabel } from "../../lib/relationship/relationshipKindBadge.ts";
import { resolveViewerDisplayName } from "../../lib/relationship/viewerFirstDisplay.ts";

const HANGUL_REGEX = /[\uac00-\ud7a3]/;

test("1. StartChoiceModal — i18n catalog completeness & EN Hangul-free", () => {
  const en = getMessages("en-US");
  const ko = getMessages("ko-KR");

  assert.ok(en.startChoiceModal, "en-US startChoiceModal catalog exists");
  assert.ok(ko.startChoiceModal, "ko-KR startChoiceModal catalog exists");

  const fields = [
    "tag",
    "title",
    "subtitle",
    "personalTitle",
    "personalDesc",
    "relationshipTitle",
    "relationshipDesc",
    "decisionTitle",
    "decisionDesc",
    "loginLink",
  ];

  for (const field of fields) {
    assert.ok(en.startChoiceModal[field], `en-US field ${field} is present`);
    assert.ok(ko.startChoiceModal[field], `ko-KR field ${field} is present`);
    assert.equal(
      HANGUL_REGEX.test(en.startChoiceModal[field]),
      false,
      `en-US startChoiceModal.${field} must not contain Hangul: "${en.startChoiceModal[field]}"`
    );
  }
});

test("2. Relationship type labels — SSOT messages.hub integration & EN Hangul-free", () => {
  const en = getMessages("en-US");
  const ko = getMessages("ko-KR");

  const kinds = ["romantic", "work", "cohabitation", "friendship", "family", "unspecified"];

  for (const kind of kinds) {
    const enLabel = relationshipKindBadgeLabel(kind, en);
    const koLabel = relationshipKindBadgeLabel(kind, ko);

    assert.ok(enLabel, `en label for ${kind} exists`);
    assert.ok(koLabel, `ko label for ${kind} exists`);
    assert.equal(
      HANGUL_REGEX.test(enLabel),
      false,
      `en label for ${kind} ("${enLabel}") must not contain Hangul`
    );
  }

  assert.equal(relationshipKindBadgeLabel("romantic", en), "Romantic");
  assert.equal(relationshipKindBadgeLabel("work", en), "Colleague");
  assert.equal(relationshipKindBadgeLabel("cohabitation", en), "Married");
  assert.equal(relationshipKindBadgeLabel("friendship", en), "Friend");
  assert.equal(relationshipKindBadgeLabel("family", en), "Family");
});

test("3. '무료 관계분석' hardcoded Korean check", () => {
  const badgeFile = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/RelationshipKindBadge.tsx"),
    "utf-8"
  );
  const viewFile = fs.readFileSync(
    path.join(process.cwd(), "app/relationship/[id]/RelationshipView.tsx"),
    "utf-8"
  );

  assert.equal(
    badgeFile.includes('"무료 관계분석"'),
    false,
    "RelationshipKindBadge.tsx must not contain hardcoded '무료 관계분석'"
  );
  assert.equal(
    viewFile.includes('"무료 관계분석"'),
    false,
    "RelationshipView.tsx must not contain hardcoded '무료 관계분석'"
  );
});

test("4. Friend card directional header — Name resolution & No 'For 나' leakage", () => {
  // Test case A: Resolved actual user display name "Alex"
  const resolvedEnName = resolveViewerDisplayName({
    reportName: "Alex",
    clerkFirstName: "Alex",
    clerkFullName: "Alex Smith",
    fallback: "",
  });
  assert.equal(resolvedEnName, "Alex");

  const headerEnWithUser = `For ${resolvedEnName}`;
  assert.equal(headerEnWithUser, "For Alex");
  assert.equal(HANGUL_REGEX.test(headerEnWithUser), false, "EN header with user name must be Hangul-free");

  // Test case B: Unresolved user name (fallback)
  const unresolvedEnName = resolveViewerDisplayName({
    reportName: "나",
    clerkFirstName: undefined,
    clerkFullName: undefined,
    fallback: "",
  });
  assert.equal(unresolvedEnName, "", "Generic '나' with no Clerk name resolves to empty fallback");

  const headerEnFallback = unresolvedEnName ? `For ${unresolvedEnName}` : "For You";
  assert.equal(headerEnFallback, "For You");
  assert.equal(headerEnFallback.includes("For 나"), false, "EN header must never render 'For 나'");
  assert.equal(HANGUL_REGEX.test(headerEnFallback), false, "EN fallback header must be Hangul-free");

  // Test case C: KR resolved name
  const resolvedKoName = resolveViewerDisplayName({
    reportName: "홍길동",
    fallback: "나",
  });
  const headerKoWithUser = `▫ ${resolvedKoName}에게 민수는`;
  assert.equal(headerKoWithUser, "▫ 홍길동에게 민수는");
});

test("5. Landing Radar & Decision Sample — EN Hangul-free", () => {
  const en = getMessages("en-US");
  const ko = getMessages("ko-KR");

  // Radar
  assert.ok(en.landing.relBridgeSampleBadge);
  assert.ok(en.landing.relBridgeSampleNote);
  assert.equal(
    HANGUL_REGEX.test(en.landing.relBridgeSampleBadge),
    false,
    "en-US relBridgeSampleBadge must be Hangul-free"
  );
  assert.equal(
    HANGUL_REGEX.test(en.landing.relBridgeSampleNote),
    false,
    "en-US relBridgeSampleNote must be Hangul-free"
  );

  // Decision sample
  assert.ok(en.decisionSample);
  assert.ok(ko.decisionSample);

  const decisionFields = [
    "dateBadge",
    "todayDecisionLabel",
    "todayDecisionContext",
    "feelingsLabel",
    "feelingsText",
    "patternReflectionLabel",
    "patternReflectionNote",
  ];

  for (const field of decisionFields) {
    assert.ok(en.decisionSample[field], `en-US decisionSample.${field} exists`);
    assert.ok(ko.decisionSample[field], `ko-KR decisionSample.${field} exists`);
    assert.equal(
      HANGUL_REGEX.test(en.decisionSample[field]),
      false,
      `en-US decisionSample.${field} ("${en.decisionSample[field]}") must be Hangul-free`
    );
  }
});
