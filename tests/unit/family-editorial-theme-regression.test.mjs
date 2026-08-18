/**
 * Family report — cream/dark-green editorial theme parity regression.
 *
 * Family's SectionRenderer.tsx was the one relationship domain still on the
 * old dark-card reportLayout skin (text-white/XX, bg-white/[0.03], glowy
 * dark-mode color-200/300 accents) while Romantic V4/Friend/Marriage/Work
 * had all migrated to the shared cream + deep-green editorial system
 * (rel-* design tokens, familyEditorialAdapter.tsx mirroring
 * workEditorialAdapter.tsx/marriageEditorialAdapter.tsx). This is a
 * permanent DOM-level regression gate against that: renders every
 * FamilyReportSectionCard variant through the real production component and
 * asserts none of the old dark-theme utility classes are present, and the
 * editorial tokens are.
 *
 * Run: npx tsx --test tests/unit/family-editorial-theme-regression.test.mjs
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import React from "react";
import ReactDOMServer from "react-dom/server";

const Module = await import("node:module");
const originalRequire = Module.default.prototype.require;
Module.default.prototype.require = function (request) {
  if (request === "next/font/google") {
    const dummyFont = () => ({ variable: "font-dummy", className: "font-dummy" });
    return { Noto_Sans_KR: dummyFont, Noto_Serif_KR: dummyFont };
  }
  return originalRequire.apply(this, arguments);
};

const { FamilyReportViewModelView } = await import(
  "../../components/relationship/familyParent/sections/SectionRenderer.tsx"
);
const { LocaleProvider } = await import("../../lib/i18n/LocaleProvider.tsx");

const NAMES = ["지훈", "서연"];

/** One minimal, valid fixture per FamilyReportSection variant — same field names SectionRenderer.tsx's card components read. */
const SECTIONS = [
  { id: "s1", type: "relationship_index", title: "관계 지수", frictionIndex: 42, safeDistanceNote: "안전 거리 안내", decisionAxisNote: "결정 축 메모" },
  { id: "s2", type: "compare_table", title: "비교표", rows: [{ id: "r1", label: "라벨", personParent: { shortLabel: "부모" }, personChild: { shortLabel: "자녀" }, meaning: "의미" }] },
  { id: "s3", type: "household_roles", title: "가정 내 역할", selfName: "부모", partnerName: "자녀", selfRoleLabel: "역할A", selfRoleDetail: "상세A", partnerRoleLabel: "역할B", partnerRoleDetail: "상세B", complement: "보완", tension: "긴장" },
  {
    id: "s5",
    type: "child_dna",
    title: "자녀 DNA",
    geniusArchetype: "wood",
    geniusTitle: "성장형",
    communicationStyle: "소통 스타일",
    hiddenSensitivity: "숨은 예민함",
    attentionFocusStyle: "집중 스타일",
    hiddenGenius: "숨은 재능",
    praiseTriggerNote: "칭찬 트리거",
  },
  { id: "s6", type: "talent", title: "재능", studyType: "creative", studyTypeLabel: "창의형", studyTypeNote: "노트", wealthVessel: "practical_finance", wealthVesselLabel: "실속형", wealthVesselNote: "노트", inheritedNote: "물려받은 노트" },
  { id: "s7", type: "growth_tunnel", title: "성장 터널", currentChallenge: "현재 과제", focusAreas: ["집중영역A", "집중영역B"] },
  { id: "s8", type: "family_role", title: "가족 역할", childRole: "fixer", roleLabel: "해결사", roleDescription: "역할 설명" },
  { id: "s9", type: "filial_frequency", title: "효도 주파수", frequencyType: "cash_gift", frequencyLabel: "현금형", frequencyNote: "노트" },
  { id: "s10", type: "destiny", title: "운명적 케미", harmonyOneLiner: "조화 한줄", favoritismWarning: "편애 경고", parentLensSummary: "부모 렌즈 요약" },
  { id: "s11", type: "filial_reward", title: "미래 보답", futureReward: "미래 보답 내용" },
  { id: "s12", type: "sos_script", title: "SOS 스크립트", triggerLabel: "트리거", sosLine: "SOS 대사" },
  {
    id: "s13",
    type: "de_escalation",
    title: "갈등 완화",
    card: {
      color: "yellow",
      hashtag: "#차분모드",
      archetype_label: "차분형",
      psych_state: "심리 상태",
      avoid_actions: "피해야 할 행동",
      solution_script: "해결 대본",
      boundary_script: "경계 대본",
      contact_wait_note: "연락 대기 노트",
    },
  },
  { id: "s14", type: "prescription", title: "처방전", introLine: "처방 인트로", items: [] },
];

function makeVm() {
  return {
    kind: "family",
    opening: {
      headline: "A steady, well-matched family bond",
      subtitle: "Built on trust and shared rhythm",
      grade: "A",
      gradeReason: "Strong alignment",
      names: NAMES,
    },
    snapshot: null,
    editorialChapters: [],
    sections: SECTIONS,
    raw: { report: {} },
  };
}

function renderVm(vm, locale = "ko-KR") {
  return ReactDOMServer.renderToString(
    React.createElement(
      LocaleProvider,
      { locale },
      React.createElement(FamilyReportViewModelView, { vm }),
    ),
  );
}

describe("Family report — editorial theme parity (no leftover dark-card styling)", () => {
  it("renders all 13 legacy section-card types without throwing", () => {
    assert.doesNotThrow(() => renderVm(makeVm()));
  });

  it("contains none of the old dark-card utility classes (text-white/*, bg-white/[...], border-white/10)", () => {
    const html = renderVm(makeVm());
    assert.ok(!html.includes("text-white/"), "no text-white/NN classes should remain");
    assert.ok(!html.includes("bg-white/["), "no bg-white/[...] classes should remain");
    assert.ok(!html.includes("border-white/10"), "no border-white/10 classes should remain");
  });

  it("contains none of the old glow-dark color-200/300/950 accent classes", () => {
    const html = renderVm(makeVm());
    for (const leaked of [
      "text-emerald-200/",
      "text-amber-200/",
      "text-rose-200/",
      "text-violet-200/",
      "text-pink-200/",
      "text-pink-300",
      "text-emerald-300",
      "text-sky-300",
      "bg-emerald-950/",
      "bg-sky-950/",
      "bg-pink-950/",
      "bg-rose-950/",
      "border-emerald-400/",
      "border-sky-400/",
      "border-pink-400/",
      "border-rose-400/",
      "text-amber-100",
    ]) {
      assert.ok(!html.includes(leaked), `"${leaked}" (old dark-mode accent) must not appear in the rendered output`);
    }
  });

  it("uses the shared cream/deep-green editorial tokens (rel-ink, rel-bg, font-rel-sans)", () => {
    const html = renderVm(makeVm());
    assert.ok(html.includes("bg-rel-bg"), "root wrapper must use the shared editorial background token");
    assert.ok(html.includes("font-rel-sans"), "root wrapper must use the shared editorial sans font token");
    assert.ok(html.includes("text-rel-ink"), "card body text must use the shared editorial ink token");
  });

  it("uses the same unified editorial accent (#1b3b2b) as Marriage/Work/Friend, not the old per-domain mint (#9ed4b8)", () => {
    const html = renderVm(makeVm());
    assert.ok(html.includes("#1b3b2b"), "must use the shared rel-deep accent color");
    assert.ok(!html.includes("#9ed4b8"), "must not use the old family-only tab-theme mint accent");
  });
});
