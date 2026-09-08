import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { getMessages } from "../../lib/i18n/messages/index.ts";

test("1. Messages Catalog — Personal Premium generating & alreadyGenerating copy in KR and EN", () => {
  const en = getMessages("en-US");
  const ko = getMessages("ko-KR");

  assert.equal(ko.blueprint.generatingPersonalTitle, "개인 분석을 생성하고 있어요");
  assert.equal(ko.blueprint.generatingPersonalSubtitle, "나만의 리포트를 만들고 있어요. 잠시만 기다려주세요.");
  assert.equal(ko.blueprint.alreadyGeneratingTitle, "이미 분석을 생성하고 있어요");
  assert.equal(ko.blueprint.alreadyGeneratingSubtitle, "잠시 후 결과가 표시됩니다.");

  assert.equal(en.blueprint.generatingPersonalTitle, "Generating your Personal Analysis");
  assert.equal(en.blueprint.generatingPersonalSubtitle, "Creating your custom report. Please wait a moment.");
  assert.equal(en.blueprint.alreadyGeneratingTitle, "Analysis generation already in progress");
  assert.equal(en.blueprint.alreadyGeneratingSubtitle, "Your results will be displayed shortly.");
});

test("2. Source Code Wiring — useSlimV1Integrated 409 handling & polling", () => {
  const hookSrc = fs.readFileSync(
    path.join(process.cwd(), "lib/v1/slim/useSlimV1Integrated.ts"),
    "utf-8"
  );

  assert.match(
    hookSrc,
    /res\.status === 409 \|\| json\.in_progress === true/,
    "useSlimV1Integrated must inspect 409 or in_progress: true without throwing fatal error"
  );
  assert.match(
    hookSrc,
    /setInProgress\(true\)/,
    "useSlimV1Integrated must set inProgress to true when lock is active"
  );
  assert.match(
    hookSrc,
    /pollTimerRef\.current = setTimeout\(/,
    "useSlimV1Integrated must schedule a polling timer when 409 in_progress is returned"
  );
  assert.match(
    hookSrc,
    /if \(isFetchingRef\.current && !opts\?\.isPolling\) return/,
    "useSlimV1Integrated must guard against repeated button clicks"
  );
});

test("3. Source Code Wiring — StitchDeepEssenceView & page button disabling", () => {
  const viewSrc = fs.readFileSync(
    path.join(process.cwd(), "components/results/StitchDeepEssenceView.tsx"),
    "utf-8"
  );
  const pageSrc = fs.readFileSync(
    path.join(process.cwd(), "app/blueprint-preview/[reportId]/essence/deep/page.tsx"),
    "utf-8"
  );

  assert.match(
    viewSrc,
    /inProgress[\s\S]*?messages\.blueprint\.alreadyGeneratingTitle[\s\S]*?messages\.blueprint\.generatingPersonalTitle/,
    "StitchDeepEssenceView must display generating/alreadyGenerating title based on inProgress state"
  );
  assert.match(
    viewSrc,
    /inProgress[\s\S]*?messages\.blueprint\.alreadyGeneratingSubtitle[\s\S]*?messages\.blueprint\.generatingPersonalSubtitle/,
    "StitchDeepEssenceView must display generating/alreadyGenerating subtitle based on inProgress state"
  );
  assert.match(
    pageSrc,
    /disabled=\{loading \|\| inProgress\}/,
    "EssenceDeepPage regenerate button must be disabled when loading || inProgress"
  );
});
