/**
 * Evidence-Grounded Narrative Editor — unit tests.
 * The LLM is always mocked here — no live API calls. See
 * tests/scripts/verify-romantic-narrative-editor-live.ts for the separate,
 * manually-run 5-pair validation against the real API.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  validateNarrativeEdits,
  extractNarrativeEditablePackets,
  buildRomanticNarrativeEditor,
  buildRomanticNarrativeEditorSafe,
  applyNarrativeEdits,
} from "../../lib/relationship/romantic/prototypeV4/romanticNarrativeEditor.ts";

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

/** Like makeOpenAiMock but passes each string through verbatim (no
 * JSON.stringify) — for exercising genuinely-unparseable raw content. */
function makeOpenAiRawMock(rawContents) {
  let call = 0;
  return {
    chat: {
      completions: {
        create: async () => ({ choices: [{ message: { content: rawContents[call++] } }] }),
      },
    },
  };
}

const NAMES = { a: "지민", b: "정우" };

const PACKETS = [
  {
    chapterOwner: "c3_dynamics",
    blockId: "face.stress",
    currentText: "지민은 스트레스를 받으면 말이 없어지고, 정우는 그 침묵을 거리감으로 해석합니다.",
    evidenceIds: ["axisResults.conflict_style", "faces.stress.provenance"],
  },
  {
    chapterOwner: "c6_hidden_hearts",
    blockId: "hidden.a",
    currentText: "지민은 속으로 인정받고 싶어하지만 겉으로는 무심한 척합니다.",
    evidenceIds: ["hiddenHearts.a.provenance"],
  },
];

function baseValidEdit(overrides = {}) {
  return {
    chapterOwner: "c3_dynamics",
    targetBlockId: "face.stress",
    editedText: "지민이 조용해지면 정우는 거리감으로 느끼지만, 지민은 그저 정리할 시간이 필요한 거예요.",
    evidenceRefs: ["axisResults.conflict_style"],
    supportedMeaning: "지민의 침묵은 거부가 아니라 처리 시간이라는 뜻입니다.",
    claimBoundary: { supported: "침묵의 의미", notSupported: "침묵의 정확한 지속 시간" },
    recognitionLine: null,
    ...overrides,
  };
}

describe("Narrative Editor — validateNarrativeEdits", () => {
  it("accepts a valid grounded edit", () => {
    const out = validateNarrativeEdits([baseValidEdit()], { packets: PACKETS, names: NAMES });
    assert.equal(out.length, 1);
    assert.equal(out[0].rejected, false);
  });

  it("rejects an edit whose evidenceRefs cannot be resolved", () => {
    const out = validateNarrativeEdits(
      [baseValidEdit({ evidenceRefs: ["axisResults.made_up_axis"] })],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out[0].rejected, true);
    assert.match(out[0].rejectionReason, /do(?:es)? not resolve/);
  });

  it("rejects an edit that claims a different chapter than its packet (claim-boundary / ownership violation)", () => {
    const out = validateNarrativeEdits(
      [baseValidEdit({ chapterOwner: "c8_strength_vulnerability" })],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out[0].rejected, true);
    assert.match(out[0].rejectionReason, /chapterOwner/);
  });

  it("rejects fabricated specificity (exact duration/physical affection/counterfactual)", () => {
    const cases = [
      "정우는 매번 30분 동안 말을 걸지 않아요.",
      "지민은 힘들 때 정우가 안아주길 바라요.",
      "정우가 없었다면 지민은 훨씬 더 힘들었을 거예요.",
      "지민은 답장이 늦으면 질투를 느껴요.",
    ];
    for (const editedText of cases) {
      const out = validateNarrativeEdits([baseValidEdit({ editedText })], { packets: PACKETS, names: NAMES });
      assert.equal(out[0].rejected, true, `expected rejection for: ${editedText}`);
      assert.match(out[0].rejectionReason, /forbidden content/);
    }
  });

  it("allows carrying forward forbidden-pattern content that was ALREADY in the deterministic source (not fabricated)", () => {
    const jealousyPackets = [
      {
        chapterOwner: "c6_hidden_hearts",
        blockId: "hidden.a",
        currentText: "관계가 흔들릴 때 질투심과 소유욕이 강해져 상대의 사소한 시선에도 예민하게 반응할 수 있습니다.",
        evidenceIds: ["hiddenHearts.a.provenance"],
      },
    ];
    const out = validateNarrativeEdits(
      [
        baseValidEdit({
          chapterOwner: "c6_hidden_hearts",
          targetBlockId: "hidden.a",
          editedText: "관계가 흔들리면 질투심과 소유욕이 강해지는 편이에요.",
          evidenceRefs: ["hiddenHearts.a.provenance"],
        }),
      ],
      { packets: jealousyPackets, names: NAMES },
    );
    assert.equal(out[0].rejected, false);
  });

  it("still rejects jealousy that is NEW — not present anywhere in the source packet", () => {
    const out = validateNarrativeEdits(
      [baseValidEdit({ editedText: "정우는 답장이 늦으면 질투를 느껴요." })],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out[0].rejected, true);
    assert.match(out[0].rejectionReason, /forbidden content/);
  });

  it("GOOD: keeps a recognitionLine with a real A->B/B->A consequence chain", () => {
    const out = validateNarrativeEdits(
      [
        baseValidEdit({
          recognitionLine: "지민이 말수가 줄어들수록 정우는 그걸 거리감으로 받아들여서 먼저 다가가기를 망설이게 돼요.",
        }),
      ],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out[0].rejected, false);
    assert.equal(out[0].recognitionLine, "지민이 말수가 줄어들수록 정우는 그걸 거리감으로 받아들여서 먼저 다가가기를 망설이게 돼요.");
  });

  it("BAD: drops a recognitionLine that is parallel description with no consequence chain", () => {
    const out = validateNarrativeEdits(
      [baseValidEdit({ recognitionLine: "지민과 정우는 각자의 방식으로 관계를 발전시킵니다." })],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out[0].rejected, false);
    assert.equal(out[0].recognitionLine, null);
    assert.match(out[0].rejectionReason, /parallel description/);
  });

  it("BAD: drops a recognitionLine that merely restates editedText (no meaning added)", () => {
    const edit = baseValidEdit();
    const out = validateNarrativeEdits(
      [{ ...edit, recognitionLine: `${edit.editedText} 그래서 정우는 그렇게 받아들이면 돼요.` }],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out[0].rejected, false);
    assert.equal(out[0].recognitionLine, null);
    assert.match(out[0].rejectionReason, /restates editedText/);
  });

  it("drops a generic recognitionLine that doesn't name both people, but keeps the edit itself", () => {
    const out = validateNarrativeEdits(
      [baseValidEdit({ recognitionLine: "두 사람은 서로를 이해하려고 노력합니다." })],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out[0].rejected, false);
    assert.equal(out[0].recognitionLine, null);
  });

  it("keeps a recognitionLine that actually names both people and shows their interaction (A/B directionality)", () => {
    const out = validateNarrativeEdits(
      [baseValidEdit({ recognitionLine: "지민이 조용해질 때, 정우는 그걸 거리감으로 읽어요." })],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out[0].rejected, false);
    assert.equal(out[0].recognitionLine, "지민이 조용해질 때, 정우는 그걸 거리감으로 읽어요.");
  });

  it("allows a null recognitionLine as a valid, unpenalized outcome", () => {
    const out = validateNarrativeEdits([baseValidEdit({ recognitionLine: null })], { packets: PACKETS, names: NAMES });
    assert.equal(out[0].rejected, false);
    assert.equal(out[0].recognitionLine, null);
  });

  it("hard-rejects an edit missing required fields (no partial claimBoundary)", () => {
    const out = validateNarrativeEdits(
      [{ chapterOwner: "c3_dynamics", targetBlockId: "face.stress", editedText: "x", evidenceRefs: [], supportedMeaning: "y" }],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out.length, 0);
  });

  it("enforces chapter ownership: a real targetBlockId claimed under the wrong chapterOwner is rejected", () => {
    const out = validateNarrativeEdits(
      [baseValidEdit({ chapterOwner: "c3_dynamics", targetBlockId: "hidden.a", evidenceRefs: ["hiddenHearts.a.provenance"] })],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out[0].rejected, true);
    assert.match(out[0].rejectionReason, /chapterOwner/);
  });

  it("accepts an edit correctly targeting a different real block/chapter (hidden.a under c6_hidden_hearts)", () => {
    const out = validateNarrativeEdits(
      [
        baseValidEdit({
          chapterOwner: "c6_hidden_hearts",
          targetBlockId: "hidden.a",
          editedText: "지민은 인정받고 싶지만 겉으로는 무심한 척을 해요.",
          evidenceRefs: ["hiddenHearts.a.provenance"],
        }),
      ],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out[0].rejected, false);
    assert.equal(out[0].chapterOwner, "c6_hidden_hearts");
  });
});

// Phase 1 English remediation parity: hasInteractionConsequenceShape() used
// to be Korean-word-list-only, so every valid English Recognition Line
// failed the shape check and was silently dropped. These mirror the KR
// GOOD/BAD consequence-shape cases above with locale: "en-US" passed.
const NAMES_EN = { a: "Mia", b: "Jordan" };
const PACKETS_EN = [
  {
    chapterOwner: "c3_dynamics",
    blockId: "face.stress",
    currentText: "When Mia gets quiet under stress, Jordan tends to read that silence as distance.",
    evidenceIds: ["axisResults.conflict_style", "faces.stress.provenance"],
  },
];

function baseValidEditEn(overrides = {}) {
  return {
    chapterOwner: "c3_dynamics",
    targetBlockId: "face.stress",
    editedText: "When Mia goes quiet, Jordan feels the distance, but Mia just needs time to process.",
    evidenceRefs: ["axisResults.conflict_style"],
    supportedMeaning: "Mia's silence means she needs processing time, not that she is shutting Jordan out.",
    claimBoundary: { supported: "what the silence means", notSupported: "exactly how long the silence lasts" },
    recognitionLine: null,
    ...overrides,
  };
}

describe("Narrative Editor — validateNarrativeEdits (English locale parity)", () => {
  it("GOOD: keeps an English recognitionLine with a real A->B/B->A consequence chain", () => {
    const out = validateNarrativeEdits(
      [
        baseValidEditEn({
          recognitionLine: "When Mia gets quieter, Jordan reads it as distance and holds back from reaching out first.",
        }),
      ],
      { packets: PACKETS_EN, names: NAMES_EN, locale: "en-US" },
    );
    assert.equal(out[0].rejected, false);
    assert.equal(
      out[0].recognitionLine,
      "When Mia gets quieter, Jordan reads it as distance and holds back from reaching out first.",
    );
  });

  it("BAD: drops an English recognitionLine that is parallel description with no consequence chain", () => {
    const out = validateNarrativeEdits(
      [baseValidEditEn({ recognitionLine: "Mia and Jordan each handle stress in their own way." })],
      { packets: PACKETS_EN, names: NAMES_EN, locale: "en-US" },
    );
    assert.equal(out[0].rejected, false);
    assert.equal(out[0].recognitionLine, null);
    assert.match(out[0].rejectionReason, /parallel description/);
  });

  it("does not leak the English shape-check into Korean validation when locale is omitted (default stays ko-KR)", () => {
    const out = validateNarrativeEdits(
      [
        baseValidEdit({
          recognitionLine: "지민이 말수가 줄어들수록 정우는 그걸 거리감으로 받아들여서 먼저 다가가기를 망설이게 돼요.",
        }),
      ],
      { packets: PACKETS, names: NAMES },
    );
    assert.equal(out[0].rejected, false);
    assert.equal(out[0].recognitionLine, "지민이 말수가 줄어들수록 정우는 그걸 거리감으로 받아들여서 먼저 다가가기를 망설이게 돼요.");
  });
});

describe("Narrative Editor — orchestrator", () => {
  it("returns validated edits from a well-formed LLM response", async () => {
    const openai = makeOpenAiMock([{ edits: [baseValidEdit()] }]);
    const result = await buildRomanticNarrativeEditor({ openai, packets: PACKETS, names: NAMES, locale: "ko-KR" });
    assert.equal(result.meta.failed, false);
    assert.equal(result.meta.totalApplied, 1);
    assert.equal(result.meta.callCount, 1);
  });

  it("falls back to zero edits (deterministic-report-safe) when the LLM call fails", async () => {
    const openai = makeOpenAiMock([new Error("network down")]);
    const result = await buildRomanticNarrativeEditorSafe({ openai, packets: PACKETS, names: NAMES, locale: "ko-KR" });
    assert.equal(result.meta.failed, true);
    assert.deepEqual(result.edits, []);
  });

  it("returns zero calls and zero edits when given zero packets (nothing to edit is not an error)", async () => {
    const openai = makeOpenAiMock([]);
    const result = await buildRomanticNarrativeEditor({ openai, packets: [], names: NAMES, locale: "ko-KR" });
    assert.equal(result.meta.callCount, 0);
    assert.deepEqual(result.edits, []);
  });

  it("does not throw even on a malformed/garbage LLM response (never-throwing contract)", async () => {
    // fetchLlmJsonWithParseRetry retries JSON.parse failures up to 3 total
    // attempts — supply garbage for all of them so it exhausts retries and
    // surfaces as a clean failure rather than looping into undefined mock calls.
    const openai = makeOpenAiRawMock(["not even json {", "still not json {", "nope {"]);
    const result = await buildRomanticNarrativeEditorSafe({ openai, packets: PACKETS, names: NAMES, locale: "ko-KR" });
    assert.equal(result.meta.failed, true);
    assert.deepEqual(result.edits, []);
  });
});

describe("Narrative Editor — extractNarrativeEditablePackets", () => {
  it("extracts only the curated locked-chapter blocks, skipping others untouched", () => {
    const sections = [
      { chapterId: "c1_hero", blocks: [{ blockId: "def.core", body: "x", evidenceIds: [] }] },
      { chapterId: "c2_attraction", blocks: [{ blockId: "attr.unique", body: "attraction text", evidenceIds: ["e1"] }] },
      { chapterId: "c9_daily_life", blocks: [{ blockId: "life.weekend", body: "y", evidenceIds: [] }] },
    ];
    const packets = extractNarrativeEditablePackets(sections);
    assert.equal(packets.length, 1);
    assert.equal(packets[0].chapterOwner, "c2_attraction");
    assert.equal(packets[0].blockId, "attr.unique");
  });

  it("falls back to the second candidate blockId when the first isn't present (e.g. misread.b_observes_a only)", () => {
    const sections = [
      {
        chapterId: "c5_misunderstanding",
        blocks: [{ blockId: "misread.b_observes_a", body: "z", evidenceIds: ["e2"] }],
      },
    ];
    const packets = extractNarrativeEditablePackets(sections);
    assert.equal(packets.length, 1);
    assert.equal(packets[0].blockId, "misread.b_observes_a");
  });
});

describe("Narrative Editor — applyNarrativeEdits", () => {
  it("replaces only the targeted block's body, leaving everything else byte-identical", () => {
    const sections = [
      {
        chapterId: "c3_dynamics",
        blocks: [
          { blockId: "face.stress", body: "original text" },
          { blockId: "face.private", body: "untouched" },
        ],
      },
    ];
    const edits = validateNarrativeEdits([baseValidEdit()], { packets: PACKETS, names: NAMES });
    const out = applyNarrativeEdits(sections, edits);
    assert.equal(out[0].blocks[0].body, baseValidEdit().editedText);
    assert.equal(out[0].blocks[1].body, "untouched");
  });

  it("never applies a rejected edit", () => {
    const sections = [{ chapterId: "c3_dynamics", blocks: [{ blockId: "face.stress", body: "original text" }] }];
    const edits = validateNarrativeEdits(
      [baseValidEdit({ evidenceRefs: ["nope.not.real"] })],
      { packets: PACKETS, names: NAMES },
    );
    const out = applyNarrativeEdits(sections, edits);
    assert.equal(out[0].blocks[0].body, "original text");
  });
});
