import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { getMessages } from "../../lib/i18n/messages/index.ts";

test("1. Messages Catalog — Personal & Relationship Premium generating & alreadyGenerating copy in KR and EN", () => {
  const en = getMessages("en-US");
  const ko = getMessages("ko-KR");

  // Personal
  assert.equal(ko.blueprint.generatingPersonalTitle, "개인 분석을 생성하고 있어요");
  assert.equal(ko.blueprint.generatingPersonalSubtitle, "나만의 리포트를 만들고 있어요. 잠시만 기다려주세요.");
  assert.equal(ko.blueprint.alreadyGeneratingTitle, "이미 분석을 생성하고 있어요");
  assert.equal(ko.blueprint.alreadyGeneratingSubtitle, "잠시 후 결과가 표시됩니다.");

  assert.equal(en.blueprint.generatingPersonalTitle, "Generating your Personal Analysis");
  assert.equal(en.blueprint.generatingPersonalSubtitle, "Creating your custom report. Please wait a moment.");
  assert.equal(en.blueprint.alreadyGeneratingTitle, "Analysis generation already in progress");
  assert.equal(en.blueprint.alreadyGeneratingSubtitle, "Your results will be displayed shortly.");

  // Relationship
  assert.equal(ko.report.relationshipGeneratingTitle, "관계 분석을 생성하고 있어요");
  assert.equal(ko.report.relationshipGeneratingBody, "두 사람의 데이터를 바탕으로 리포트를 만들고 있어요. 잠시만 기다려주세요.");
  assert.equal(ko.report.relationshipAlreadyGeneratingTitle, "이미 이 관계의 분석을 생성하고 있어요");
  assert.equal(ko.report.relationshipAlreadyGeneratingBody, "완료되면 저장된 결과를 확인할 수 있어요.");

  assert.equal(en.report.relationshipGeneratingTitle, "Generating your Relationship Analysis");
  assert.equal(en.report.relationshipGeneratingBody, "We're creating your report from both profiles. Please wait a moment.");
  assert.equal(en.report.relationshipAlreadyGeneratingTitle, "This Relationship Analysis is already being generated");
  assert.equal(en.report.relationshipAlreadyGeneratingBody, "You'll be able to view the saved result once it's ready.");
});

test("2. Personal Server Correctness — personalPremiumGenerationLock helper methods", () => {
  const lockSrc = fs.readFileSync(
    path.join(process.cwd(), "lib/report/personalPremiumGenerationLock.ts"),
    "utf-8"
  );

  assert.match(lockSrc, /export async function acquirePersonalPremiumGenerationLock/, "Must export acquire function");
  assert.match(lockSrc, /export async function releasePersonalPremiumGenerationLock/, "Must export release function");
  assert.match(lockSrc, /export async function stillOwnsPersonalPremiumGenerationLock/, "Must export stillOwns function");
  assert.match(lockSrc, /\.eq\("current_request_id", generationRequestId\)/, "Release/stillOwns must fence on generationRequestId");
});

test("3. Personal Server Route — v2/deep/essence pre-save ownership check", () => {
  const routeSrc = fs.readFileSync(
    path.join(process.cwd(), "app/api/v2/deep/essence/route.ts"),
    "utf-8"
  );

  assert.match(routeSrc, /stillOwnsPersonalPremiumGenerationLock/, "Must import stillOwnsPersonalPremiumGenerationLock");
  assert.match(
    routeSrc,
    /stillOwnsPersonalPremiumGenerationLock[\s\S]*?writePersistedDeepEssenceAnalysis/,
    "Must verify lock ownership before saving persisted deep essence analysis"
  );
  assert.match(
    routeSrc,
    /stillOwnsPersonalPremiumGenerationLock[\s\S]*?consumeCredit/,
    "Must verify lock ownership before consuming credit"
  );
});

test("4. Personal Client Hook — useSlimV1Integrated 409 handling & polling", () => {
  const hookSrc = fs.readFileSync(
    path.join(process.cwd(), "lib/v1/slim/useSlimV1Integrated.ts"),
    "utf-8"
  );

  assert.match(hookSrc, /res\.status === 409 \|\| json\.in_progress === true/, "Must inspect 409 or in_progress: true");
  assert.match(hookSrc, /setInProgress\(true\)/, "Must set inProgress to true");
  assert.match(hookSrc, /pollTimerRef\.current = setTimeout\(/, "Must schedule polling timer on 409");
  assert.match(hookSrc, /if \(isFetchingRef\.current && !opts\?\.isPolling\) return/, "Must guard duplicate clicks");
});

test("5. Personal UI — StitchDeepEssenceView & page button disabling", () => {
  const viewSrc = fs.readFileSync(
    path.join(process.cwd(), "components/results/StitchDeepEssenceView.tsx"),
    "utf-8"
  );
  const pageSrc = fs.readFileSync(
    path.join(process.cwd(), "app/blueprint-preview/[reportId]/essence/deep/page.tsx"),
    "utf-8"
  );

  assert.match(viewSrc, /alreadyGeneratingTitle/, "StitchDeepEssenceView must use alreadyGeneratingTitle");
  assert.match(pageSrc, /disabled=\{loading \|\| inProgress\}/, "Page regenerate button must be disabled when loading || inProgress");
});

test("6. Relationship Server Correctness — relationshipPremiumGenerationLock helper methods", () => {
  const lockSrc = fs.readFileSync(
    path.join(process.cwd(), "lib/relationship/relationshipPremiumGenerationLock.ts"),
    "utf-8"
  );

  assert.match(lockSrc, /export async function acquireRelationshipPremiumGenerationLock/, "Must export acquire function");
  assert.match(lockSrc, /export async function releaseRelationshipPremiumGenerationLock/, "Must export release function");
  assert.match(lockSrc, /export async function stillOwnsRelationshipPremiumGenerationLock/, "Must export stillOwns function");
  assert.match(lockSrc, /\.eq\("current_request_id", generationRequestId\)/, "Release/stillOwns must fence on generationRequestId");
});

test("7. Relationship Server Route — analyze/premium route locking & pre-save check", () => {
  const routeSrc = fs.readFileSync(
    path.join(process.cwd(), "app/api/relationship/analyze/premium/route.ts"),
    "utf-8"
  );

  assert.match(routeSrc, /acquireRelationshipPremiumGenerationLock/, "Must acquire lock in analyze/premium route");
  assert.match(routeSrc, /stillOwnsRelationshipPremiumGenerationLock/, "Must check lock ownership before saving result");
  assert.match(routeSrc, /in_progress: lockAcquire\.reason === "in_progress"/, "Must return in_progress: true on 409 lock collision");
});

test("8. Relationship Client Hook — useRelationshipDetail 409 handling & polling", () => {
  const hookSrc = fs.readFileSync(
    path.join(process.cwd(), "app/relationship/[id]/useRelationshipDetail.ts"),
    "utf-8"
  );

  assert.match(hookSrc, /res\.status === 409 \|\| data\?\.in_progress === true/, "Must handle 409/in_progress cleanly in runPremium");
  assert.match(hookSrc, /setPremiumInProgress\(true\)/, "Must set premiumInProgress to true on 409");
  assert.match(hookSrc, /load\(premiumKind, \{ silent: true \}\)/, "Must use read-only load() polling during generation");
  assert.match(hookSrc, /setInterval/, "Must poll periodically while premiumInProgress is true");
});

test("9. Relationship UI Panel — RelationshipGeneratingPanel inProgress handling", () => {
  const panelSrc = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/detail/RelationshipGeneratingPanel.tsx"),
    "utf-8"
  );

  assert.match(panelSrc, /inProgress\?: boolean/, "Must accept inProgress prop");
  assert.match(panelSrc, /relationshipAlreadyGeneratingTitle/, "Must render alreadyGeneratingTitle when inProgress is true");
  assert.match(panelSrc, /relationshipAlreadyGeneratingBody/, "Must render alreadyGeneratingBody when inProgress is true");
});

test("10. Relationship UI View & Section — RelationshipView busy & inProgress wiring", () => {
  const viewSrc = fs.readFileSync(
    path.join(process.cwd(), "app/relationship/[id]/RelationshipView.tsx"),
    "utf-8"
  );

  assert.match(viewSrc, /generating = busy \|\| autostartActive \|\| premiumInProgress/, "generating state must include premiumInProgress");
  assert.match(viewSrc, /inProgress=\{premiumInProgress\}/, "RelationshipGeneratingPanel must receive inProgress prop");
});

test("11. Regenerate Confirmation Modal — Copy & Flow", () => {
  const modalSrc = fs.readFileSync(
    path.join(process.cwd(), "components/relationship/detail/RegenerateConfirmDialog.tsx"),
    "utf-8"
  );
  const koMessages = getMessages("ko-KR");
  const enMessages = getMessages("en-US");

  assert.equal(koMessages.report.regenerateModalTitle, "이미 저장된 분석이 있어요. 새로 분석할까요?");
  assert.equal(enMessages.report.regenerateModalTitle, "You already have a saved analysis. Create a new one?");

  assert.match(modalSrc, /regenerateModalTitle/, "RegenerateConfirmDialog must display regenerateModalTitle");
  assert.match(modalSrc, /onCreateNew/, "RegenerateConfirmDialog must trigger onCreateNew only on explicit user click");
});
