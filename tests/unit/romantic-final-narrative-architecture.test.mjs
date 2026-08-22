/**
 * Final Narrative Architecture — 2-call orchestrator unit tests.
 * The LLM is always mocked here — no live API calls. See
 * tests/scripts/verify-romantic-final-narrative-architecture-live.ts for
 * the separate, manually-run production-equivalent 5-pair validation.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRomanticFinalNarrativeArchitecture,
  buildRomanticFinalNarrativeArchitectureSafe,
} from "../../lib/relationship/romantic/prototypeV4/romanticFinalNarrativeArchitecture.ts";

function makeOpenAiMock(responses) {
  let call = 0;
  return {
    chat: {
      completions: {
        create: async () => {
          const r = responses[call++];
          if (r instanceof Error) throw r;
          return { choices: [{ message: { content: JSON.stringify(r) } }] };
        },
      },
    },
  };
}

const NAMES = { a: "지민", b: "정우" };

const SECTIONS = [
  {
    chapterId: "c3_dynamics",
    blocks: [
      {
        blockId: "face.stress",
        body: "지민은 스트레스를 받으면 말이 없어지고, 정우는 그 침묵을 거리감으로 해석합니다.",
        evidenceIds: ["axisResults.conflict_style"],
      },
    ],
  },
];

const STORY_PLAN = {
  crossSignalInsightsV1: [
    { insightType: "hidden_collision", derivedMeaning: "비슷해서 편한 축이지만 갈등직면성에서는 둘 다 역할을 비워두는 위험이 됩니다.", evidenceRefs: ["axisResults.conflict_style"] },
  ],
};

const MINIMAL_CHART = {
  pillars: [],
  day_master: { stem: { code: "gap" }, day_branch: { code: "ja" }, element: "wood", yin_yang: "yang" },
  five_elements: { with_hidden_counts: { wood: 3, fire: 1, earth: 1, metal: 1, water: 2 }, dominant: "wood", weakest: "fire" },
  johu: { temperature_band: "neutral", moisture_band: "neutral" },
  strength: { label_code: "balanced" },
  rootedness: { day_stem_rooted_in_day_branch: true, rootedness_index: 0.5 },
  relations_intra: [],
};

const GOOD_EDIT = {
  chapterOwner: "c3_dynamics",
  targetBlockId: "face.stress",
  editedText: "지민이 조용해지면 정우는 거리감으로 느끼지만, 지민은 그저 정리할 시간이 필요한 거예요.",
  evidenceRefs: ["axisResults.conflict_style"],
  supportedMeaning: "지민의 침묵은 거부가 아니라 처리 시간이라는 뜻입니다.",
  claimBoundary: { supported: "침묵의 의미", notSupported: "침묵의 정확한 지속 시간" },
  recognitionLine: null,
};

const GOOD_DISCOVERY_FINDING = {
  id: "d-1",
  mode: "saju_discovery",
  classification: "EXPERT_DERIVED",
  insightType: "test",
  subjects: ["pair"],
  claim: "두 원국의 지지 구조가 회복 리듬의 속도 차이와 관련됩니다",
  evidenceRefs: [],
  sajuEvidence: ["day_branch_relation"],
  deterministicEvidence: [],
  reasoning: "두 신호를 결합했을 때 이런 의미가 나옵니다.",
  confidence: "medium",
  novelty: "genuinely_additive",
  claimBoundary: { supported: "X", notSupported: "Y" },
  suggestedChapter: "c4_conflict",
  renderEligible: true,
};

function baseParams(openai) {
  return {
    openai,
    sections: SECTIONS,
    storyPlan: STORY_PLAN,
    chartA: MINIMAL_CHART,
    chartB: MINIMAL_CHART,
    axisResults: [],
    names: NAMES,
    locale: "ko-KR",
  };
}

describe("Final Narrative Architecture — call count", () => {
  it("makes exactly 2 LLM calls when both steps have work to do", async () => {
    const openai = makeOpenAiMock([{ edits: [GOOD_EDIT] }, { findings: [GOOD_DISCOVERY_FINDING] }]);
    const result = await buildRomanticFinalNarrativeArchitecture(baseParams(openai));
    assert.equal(result.meta.callCount, 2);
    assert.equal(result.meta.failed, false);
  });

  it("never makes a 3rd call — Mode A's old evidence_synthesis prompt is not invoked", async () => {
    let calls = 0;
    const openai = {
      chat: {
        completions: {
          create: async (req) => {
            calls++;
            // Mode A's old persona text ("MODE A") must never appear — this
            // architecture only ever sends Narrative Editor or Mode B prompts.
            const sys = req.messages[0].content;
            assert.doesNotMatch(sys, /MODE A/);
            return { choices: [{ message: { content: JSON.stringify(calls === 1 ? { edits: [] } : { findings: [] }) } }] };
          },
        },
      },
    };
    await buildRomanticFinalNarrativeArchitecture(baseParams(openai));
    assert.equal(calls, 2);
  });
});

describe("Final Narrative Architecture — dedup corpus", () => {
  it("feeds Mode B's dedup context using Narrative Editor output, not old Mode A findings", async () => {
    let capturedModeBUser = null;
    const openai = {
      chat: {
        completions: {
          create: async (req) => {
            const isModeB = req.messages[1].content.includes("MODE B") || req.messages[0].content.includes("MODE B");
            if (isModeB) capturedModeBUser = req.messages[0].content + req.messages[1].content;
            const isFirstCall = capturedModeBUser === null;
            return {
              choices: [{
                message: {
                  content: JSON.stringify(isFirstCall ? { edits: [GOOD_EDIT] } : { findings: [] }),
                },
              }],
            };
          },
        },
      },
    };
    await buildRomanticFinalNarrativeArchitecture(baseParams(openai));
    assert.ok(capturedModeBUser, "expected a Mode B call to happen");
    // The applied edit's supportedMeaning should appear in what Mode B saw,
    // proving the dedup corpus carries Narrative Editor output forward.
    assert.match(capturedModeBUser, /지민의 침묵은 거부가 아니라 처리 시간이라는 뜻입니다/);
  });
});

describe("Final Narrative Architecture — fallback behavior", () => {
  it("deterministic sections survive when Call 1 (Narrative Editor) fails", async () => {
    const openai = makeOpenAiMock([new Error("call 1 down"), { findings: [] }]);
    const result = await buildRomanticFinalNarrativeArchitectureSafe(baseParams(openai));
    assert.equal(result.meta.narrativeEditor.failed, true);
    assert.deepEqual(result.sections, SECTIONS);
  });

  it("deterministic sections survive when Call 2 (Discovery) fails", async () => {
    const openai = makeOpenAiMock([{ edits: [] }, new Error("call 2 down")]);
    const result = await buildRomanticFinalNarrativeArchitectureSafe(baseParams(openai));
    assert.equal(result.meta.discovery.failed, true);
    assert.equal(result.meta.failed, true);
  });

  it("deterministic sections survive when BOTH calls fail", async () => {
    const openai = makeOpenAiMock([new Error("call 1 down"), new Error("call 2 down")]);
    const result = await buildRomanticFinalNarrativeArchitectureSafe(baseParams(openai));
    assert.equal(result.meta.failed, true);
    assert.deepEqual(result.sections, SECTIONS);
    assert.deepEqual(result.narrativeEdits, []);
    assert.deepEqual(result.expertFindings, []);
  });

  it("never throws even on a totally malformed setup (unexpected error path)", async () => {
    const brokenOpenai = { chat: { completions: { create: async () => { throw new TypeError("boom"); } } } };
    const result = await buildRomanticFinalNarrativeArchitectureSafe(baseParams(brokenOpenai));
    assert.equal(result.meta.failed, true);
    assert.deepEqual(result.sections, SECTIONS);
  });
});

describe("Final Narrative Architecture — Mode B findings are separate from rendered sections", () => {
  it("Mode B discoveries are returned but not spliced into sections (documented scope decision)", async () => {
    const openai = makeOpenAiMock([{ edits: [] }, { findings: [GOOD_DISCOVERY_FINDING] }]);
    const result = await buildRomanticFinalNarrativeArchitecture(baseParams(openai));
    assert.equal(result.expertFindings.length, 1);
    // sections must be byte-identical to input since no narrative edit applied
    assert.deepEqual(result.sections, SECTIONS);
  });
});
