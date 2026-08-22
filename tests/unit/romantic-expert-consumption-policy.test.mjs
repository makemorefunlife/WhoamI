/**
 * Phase 4B — Expert Finding Consumption Policy unit tests. Pure deterministic
 * post-processing, no LLM involved at all (mocked or otherwise) — this tests
 * romanticExpertConsumptionPolicy.ts against hand-built RomanticExpertFinding
 * objects, plus composeCanonicalSectionNarratives.ts's optional splice param.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyConsumptionTier,
  buildExistingReportTextCorpus,
  translateFindingToUserCopy,
  selectUserVisibleExpertBlocks,
} from "../../lib/relationship/romantic/prototypeV4/romanticExpertConsumptionPolicy.ts";
import { composeCanonicalSectionNarratives } from "../../lib/relationship/romantic/prototypeV4/composeCanonicalSectionNarratives.ts";

function makeFinding(overrides = {}) {
  return {
    id: "f-1",
    mode: "saju_discovery",
    classification: "EXPERT_DERIVED",
    insightType: "chart_interaction",
    subjects: ["pair"],
    claim: "지민과 정우의 원국에서 서로의 지지 간 충돌이 발생할 수 있습니다.",
    evidenceRefs: ["chartA.branch_clash"],
    sajuEvidence: ["branch_clash[yu,myo]"],
    deterministicEvidence: [],
    reasoning: "일지와 시지 간의 충돌이 긴장감을 유발할 수 있습니다.",
    confidence: "high",
    novelty: "genuinely_additive",
    claimBoundary: { supported: "차트 구조상 긴장 가능성", notSupported: "실제 행동 확인" },
    suggestedChapter: "c4_conflict",
    renderEligible: true,
    psychCrossCheck: undefined,
    ...overrides,
  };
}

function minimalStoryPlan(overrides = {}) {
  return {
    locale: "ko-KR",
    names: { a: "지민", b: "정우" },
    crossSignalInsightsV1: [
      { insightType: "hidden_collision", derivedMeaning: "비슷해서 편한 축이지만 갈등직면성에서는 둘 다 역할을 비워두는 위험이 됩니다.", evidenceRefs: [] },
    ],
    ...overrides,
  };
}

function minimalSections(overrides = []) {
  return [
    { chapterId: "c4_conflict", blocks: [{ body: "이런 장면에서 나타날 가능성이 있어요: 계획이 갑자기 틀어질 때." }] },
    { chapterId: "c8_strength_vulnerability", blocks: [{ body: "둘이 함께 만들어내는 가장 큰 강점입니다." }] },
    ...overrides,
  ];
}

describe("Expert Consumption Policy — classifyConsumptionTier (spec §1 A-D)", () => {
  it("§1.A: EXPERT_DERIVED + genuinely_additive + renderEligible + confidence>=medium -> A_primary", () => {
    assert.equal(classifyConsumptionTier(makeFinding()), "A_primary");
  });

  it("§1.A: same shape but confidence=low -> not tier A (below safe threshold)", () => {
    assert.notEqual(classifyConsumptionTier(makeFinding({ confidence: "low" })), "A_primary");
  });

  it("§1.B: SUPPORTED_SYNTHESIS + deepens_existing + renderEligible -> B_secondary", () => {
    const f = makeFinding({ classification: "SUPPORTED_SYNTHESIS", novelty: "deepens_existing", sajuEvidence: [] });
    assert.equal(classifyConsumptionTier(f), "B_secondary");
  });

  it("§1.C: novelty=reinforces_existing -> C_internal, never a new block", () => {
    const f = makeFinding({ novelty: "reinforces_existing" });
    assert.equal(classifyConsumptionTier(f), "C_internal");
  });

  it("§1.D: classification=SPECULATIVE -> D_never", () => {
    assert.equal(classifyConsumptionTier(makeFinding({ classification: "SPECULATIVE" })), "D_never");
  });

  it("§1.D: renderEligible=false -> D_never regardless of classification/novelty", () => {
    assert.equal(classifyConsumptionTier(makeFinding({ renderEligible: false })), "D_never");
  });

  it("§1.D: novelty=duplicate -> D_never", () => {
    assert.equal(classifyConsumptionTier(makeFinding({ novelty: "duplicate" })), "D_never");
  });

  it("unlisted combination (EXPERT_DERIVED + deepens_existing) -> D_never (strict-literal read of §1)", () => {
    assert.equal(classifyConsumptionTier(makeFinding({ novelty: "deepens_existing" })), "D_never");
  });
});

describe("Expert Consumption Policy — dedup against report corpus (spec §2)", () => {
  it("buildExistingReportTextCorpus includes both Cross-Signal V1 and chapter block text", () => {
    const plan = minimalStoryPlan();
    const sections = minimalSections();
    const corpus = buildExistingReportTextCorpus(plan, sections);
    assert.ok(corpus.some((t) => t.includes("갈등직면성")));
    assert.ok(corpus.some((t) => t.includes("계획이 갑자기 틀어질 때")));
  });

  it("a finding that only restates existing chapter content is rejected as duplicate, not selected", () => {
    const plan = minimalStoryPlan();
    const sections = minimalSections();
    const nearDuplicate = makeFinding({
      id: "f-dup",
      claim: "이런 장면에서 나타날 가능성이 있어요: 계획이 갑자기 틀어질 때 마찰이 생겨요.",
    });
    const selection = selectUserVisibleExpertBlocks([nearDuplicate], plan, sections, "ko-KR");
    assert.equal(selection.meta.selectedCount, 0);
    assert.equal(selection.meta.rejectedDuplicateAgainstReportCount, 1);
  });
});

describe("Expert Consumption Policy — chapter ownership & cap (spec §3/§4/§7)", () => {
  it("a genuinely additive finding with no overlap is selected into its suggestedChapter", () => {
    const plan = minimalStoryPlan();
    const sections = minimalSections();
    const selection = selectUserVisibleExpertBlocks([makeFinding()], plan, sections, "ko-KR");
    assert.equal(selection.meta.selectedCount, 1);
    assert.ok(selection.blocksByChapter.c4_conflict);
    assert.equal(selection.blocksByChapter.c4_conflict.length, 1);
  });

  it("max 1 per chapter: two tier-A candidates for the same chapter -> only the higher-confidence one survives", () => {
    const plan = minimalStoryPlan();
    const sections = minimalSections();
    const low = makeFinding({ id: "f-low", confidence: "medium", claim: "정우의 오행이 세영과 다른 방식으로 반응합니다." });
    const high = makeFinding({ id: "f-high", confidence: "high", claim: "지민의 뿌리 구조가 갈등 상황에서 다르게 작동합니다." });
    const selection = selectUserVisibleExpertBlocks([low, high], plan, sections, "ko-KR");
    assert.equal(selection.blocksByChapter.c4_conflict.length, 1);
    assert.equal(selection.blocksByChapter.c4_conflict[0].structuredData.expertFindingId, "f-high");
    assert.equal(selection.meta.rejectedChapterCapCount, 1);
  });

  it("Chapter 08 is never a default overflow for Tier B — SUPPORTED_SYNTHESIS never renders anywhere", () => {
    const plan = minimalStoryPlan();
    const sections = minimalSections();
    const tierB = makeFinding({
      classification: "SUPPORTED_SYNTHESIS",
      novelty: "deepens_existing",
      sajuEvidence: [],
      suggestedChapter: "c8_strength_vulnerability",
      claim: "완전히 새로운 시너지 해석 문장입니다.",
    });
    const selection = selectUserVisibleExpertBlocks([tierB], plan, sections, "ko-KR");
    assert.equal(selection.meta.selectedCount, 0);
    assert.equal(selection.meta.tierBCount, 1);
    assert.ok(!selection.blocksByChapter.c8_strength_vulnerability);
  });
});

describe("Expert Consumption Policy — display rule / psych cross-check wording (spec §5/§6)", () => {
  it("CONTRADICTED_BY_CURRENT produces layered wording (chart tendency + current behavior + tension note)", () => {
    const f = makeFinding({
      psychCrossCheck: { status: "CONTRADICTED_BY_CURRENT", axisKey: "conflict_style", note: "실제로는 회피형으로 나타납니다." },
    });
    const copy = translateFindingToUserCopy(f, "ko-KR");
    assert.ok(copy.body.includes(f.claim));
    assert.ok(copy.body.includes("실제로는 회피형으로 나타납니다."));
    assert.ok(copy.body.includes("의미 있는 신호"));
  });

  it("NOT_MEASURED uses the claim as-is (chart-level interpretation only, no invented behavior)", () => {
    const f = makeFinding({ psychCrossCheck: { status: "NOT_MEASURED", axisKey: null, note: "" } });
    const copy = translateFindingToUserCopy(f, "ko-KR");
    assert.equal(copy.body, f.claim);
  });

  it("MIXED retains claim boundary caveat in the visible copy", () => {
    const f = makeFinding({ psychCrossCheck: { status: "MIXED", axisKey: "conflict_style", note: "" } });
    const copy = translateFindingToUserCopy(f, "ko-KR");
    assert.ok(copy.body.includes(f.claimBoundary.notSupported));
  });

  it("never exposes raw sajuEvidence/evidenceRefs strings in the user-facing body", () => {
    const f = makeFinding();
    const copy = translateFindingToUserCopy(f, "ko-KR");
    assert.ok(!copy.body.includes("branch_clash"));
  });
});

describe("Expert Consumption Policy — failure/fallback (spec §13)", () => {
  it("empty findings array -> empty selection, no chapters touched", () => {
    const plan = minimalStoryPlan();
    const sections = minimalSections();
    const selection = selectUserVisibleExpertBlocks([], plan, sections, "ko-KR");
    assert.equal(selection.meta.selectedCount, 0);
    assert.deepEqual(selection.blocksByChapter, {});
  });

  it("composeCanonicalSectionNarratives with an empty blocksByChapter map produces sections identical to omitting the param entirely", () => {
    const plan = {
      locale: "ko-KR",
      names: { a: "지민", b: "정우" },
      relationshipDefinition: "정의",
      bondMode: "결합",
      attraction: {
        aSeeks: { seeksInPartner: "", partnerMatchPoint: "", cautionReasons: [], provenance: [] },
        bSeeks: { seeksInPartner: "", partnerMatchPoint: "", cautionReasons: [], provenance: [] },
        uniqueCombination: "",
        flipsToConflictWhen: "",
        provenance: [],
      },
      faces: [],
      recurringLoop: { triggerScene: "", steps: [], provenance: [] },
      topDifferences: [],
      misreads: [],
      hiddenHearts: [],
      repair: { sequence: [], helpsA: [], helpsB: [], provenance: [] },
      bilateralChanges: [],
      sharedStrength: "",
      sharedVulnerability: "",
      crossSignalInsightsV1: [],
      connectedEvidenceIds: [],
    };
    const withoutParam = composeCanonicalSectionNarratives(plan, undefined);
    const withEmptyMap = composeCanonicalSectionNarratives(plan, undefined, {});
    assert.deepEqual(withEmptyMap, withoutParam);
  });
});
