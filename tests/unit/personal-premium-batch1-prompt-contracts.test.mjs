/**
 * Personal Premium Narrative Quality Singleton — Batch 1: Prompt Contract Cleanup.
 *
 * Source-wiring tests only (same convention as
 * personal-deep-essence-cache-revalidation.test.mjs) — deepEssenceStructured.ts
 * is a prompt-string builder, not directly executable narrative logic, so these
 * assertions confirm the actual instruction text landed in the file rather than
 * re-testing prose the LLM itself must follow.
 *
 * Run: npx tsx --test tests/unit/personal-premium-batch1-prompt-contracts.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";

const src = fs.readFileSync("lib/prompts/deepEssenceStructured.ts", "utf8");

describe("Layered Identity title contract — generic-label + true-self prohibition", () => {
  it("defines a shared LAYER_TITLE_FIELD_DESC constant reused across all four layers (no drift between layers)", () => {
    const matches = src.match(/\$\{LAYER_TITLE_FIELD_DESC\}/g) ?? [];
    assert.equal(matches.length, 4, "all four layer title fields must interpolate the same shared description");
  });

  it("forbids personality-noun/virtue labels in the title description", () => {
    assert.match(src, /자유로운 영혼/);
    assert.match(src, /배려 깊은 친구/);
    assert.match(src, /좋은 사람/);
    assert.match(src, /free spirit/);
    assert.match(src, /caring friend/);
  });

  it("forbids the true-self phrase family in both languages", () => {
    assert.match(src, /진정한 나/);
    assert.match(src, /진짜 나/);
    assert.match(src, /본모습/);
    assert.match(src, /real self/);
    assert.match(src, /authentic self/);
  });

  it("states the underlying philosophy: no layer is more real than another", () => {
    assert.match(src, /no layer is more real than another/);
  });

  it("gives a copy-paste-onto-a-stranger test for title genericness", () => {
    assert.match(src, /could describe a stranger's report unchanged/);
  });

  it("bans the true-self phrase family broadly (not just a fixed string list) so close synonyms like 진정한 모습 are also covered", () => {
    assert.match(src, /진정한 모습/);
    assert.match(src, /PHRASE FAMILY, not a fixed list/);
    assert.match(src, /close variant not spelled out above is still forbidden/);
  });

  it("explicitly extends the true-self ban to synthesis.narrative, not just layer titles", () => {
    assert.match(src, /including synthesis\.narrative/);
  });
});

describe("Layered Identity synthesis — contrast requirement + FAILED\\/WORKING example", () => {
  it("requires explicitly answering at least one of the named contrast questions", () => {
    assert.match(src, /you MUST explicitly answer at least ONE of/);
  });

  it("includes the FAILED re-list example", () => {
    assert.match(src, /처음에는 차분하고, 친해지면 다정하고, 가까우면 자유로워요/);
  });

  it("includes the WORKING contrast example naming a genuine shift", () => {
    assert.match(src, /안전하다고 느낄수록 스스로를 조절할 필요가 줄어들기 때문일 수 있습니다/);
  });
});

describe("Watchout semantic diversity guard", () => {
  it("prohibits three watchouts reducing to the same causal mechanism", () => {
    assert.match(src, /WATCHOUT DIVERSITY/);
    assert.match(src, /do not return three watchouts that all reduce to the same underlying causal mechanism/);
  });

  it("lists candidate cost domains", () => {
    for (const domain of ["decision load", "emotional labor", "adaptation load", "boundary maintenance", "uncertainty handling", "relationship calibration", "self-suppression"]) {
      assert.match(src, new RegExp(domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  });

  it("forbids inventing an unsupported domain just to force variety", () => {
    assert.match(src, /never invent a domain the evidence doesn't support just to force variety/);
  });

  it("includes a concrete FAILED example pair (abstract-only diversity rules were observed insufficient in live QA)", () => {
    assert.match(src, /two of these three are the SAME mechanism restated/);
    assert.match(src, /결정 장애로 인한 우유부단함/);
  });
});

describe("Relationship fit — mirror-copy prohibition + mechanism requirement", () => {
  it("requires fit items to pair the other person's trait with why it eases this user's own pattern", () => {
    assert.match(src, /MIRROR-COPY IS FORBIDDEN/);
    assert.match(src, /never simply restate one of this user's own strengths\/titles as the trait the other person should have/);
  });

  it("uses an abstract non-copyable TEMPLATE instead of a ready-made sentence (a live QA run showed the ready-made example being echoed near-verbatim across profiles)", () => {
    assert.match(src, /Use this TEMPLATE, never a ready-made sentence/);
    assert.doesNotMatch(src, /결정을 재촉하지 않고, 서로의 생각이 정리될 시간을 허용하는 사람/, "the old copyable example sentence must be fully removed, not just warned against");
  });

  it("forbids bare universal-virtue nouns without an attached mechanism", () => {
    assert.match(src, /좋은 사람/);
    assert.match(src, /이해심 많은 사람/);
    assert.match(src, /신뢰할 수 있는 사람/);
  });

  it("schema hint for fit no longer describes a bare trait list", () => {
    assert.doesNotMatch(src, /"trait of people who feel easy 1"/);
    assert.match(src, /never a mirror-copy of this user's own strength/);
  });

  it("warns against echoing the illustrative examples verbatim (observed live: examples were copied near-unchanged)", () => {
    assert.match(src, /REUSE CHECK for fit\/friction/);
    assert.match(src, /fit\/friction item that would read identically on a different user's report has failed/i);
  });

  it("schema hint no longer repeats the exact same example phrase as the grounding-rules example (avoids a double anchor)", () => {
    const ruleExample = "결정을 재촉하지 않고, 서로의 생각이 정리될 시간을 허용하는 사람";
    const schemaFitLine = src.match(/"fit": \[[^\]]*\]/)?.[0] ?? "";
    assert.ok(!schemaFitLine.includes(ruleExample), "schema hint should not restate the rules' own example verbatim");
  });
});

describe("Relationship friction — interaction-mechanism contract", () => {
  it("forbids bare trait-mismatch labels and requires an interaction mechanism", () => {
    assert.match(src, /a friction item is NEVER a trait-mismatch label on the other person/);
    assert.match(src, /name what both people are doing.*name why that specific combination creates friction/);
  });

  it("uses an abstract non-copyable TEMPLATE instead of a ready-made sentence (a live QA run showed the ready-made examples being echoed near-verbatim across profiles)", () => {
    assert.doesNotMatch(src, /서로 확신을 기다리느라 결정이 계속 미뤄지는 관계/, "the old copyable example sentence must be fully removed, not just warned against");
    assert.doesNotMatch(src, /상대의 반응을 지나치게 읽어야 안전하다고 느끼는 상호작용/, "the old copyable example sentence must be fully removed, not just warned against");
  });

  it("schema hint for friction no longer describes a bare trait list", () => {
    assert.doesNotMatch(src, /"trait of people who feel hard 1"/);
    assert.match(src, /never a bare trait-mismatch label on the other person/);
  });

  it("schema hint no longer repeats the exact same example phrase as the grounding-rules example (avoids a double anchor)", () => {
    const ruleExample = "서로 확신을 기다리느라 결정이 계속 미뤄지는 관계";
    const schemaFrictionLine = src.match(/"friction": \[[^\]]*\]/)?.[0] ?? "";
    assert.ok(!schemaFrictionLine.includes(ruleExample), "schema hint should not restate the rules' own example verbatim");
  });
});

describe("Checklist (One Next Move) — exactly-1 SSOT, no 8-12 contradiction", () => {
  it("states EXACTLY 1 ITEM as the sole checklist-length rule", () => {
    assert.match(src, /checklist \(One Next Move\) is EXACTLY 1 ITEM — a string array with exactly one entry\. This is the SOLE checklist-length rule/);
  });

  it("does NOT instruct an 8-12 item checklist anywhere (only the pre-existing FORBIDDEN-pattern reference to 8-12-item homework dumps may remain)", () => {
    const eightToTwelveMatches = [...src.matchAll(/8-12/g)];
    assert.equal(eightToTwelveMatches.length, 1, "exactly one 8-12 reference should remain in the file");
    // That one remaining reference must be the FORBIDDEN task-dump line, not a real instruction.
    const idx = eightToTwelveMatches[0].index;
    const context = src.slice(idx - 60, idx + 60);
    assert.match(context, /FORBIDDEN/);
  });

  it("does not instruct spreading items across an 8-12 diversity list (stale copy removed)", () => {
    assert.doesNotMatch(src, /the 8-12 items should not cluster/);
    assert.doesNotMatch(src, /Do not pad the 8-12 count/);
  });

  it("keeps the semantic duplication guard (still relevant for a single item) but reframes overlap as expected, not a defect", () => {
    assert.match(src, /SEMANTIC duplication guard/);
    assert.match(src, /a One Next Move that is clearly connected to the report's central tension is the goal, not a defect/);
  });
});

describe("Closing — evaluative-praise prohibition", () => {
  it("forbids evaluating the insight's worth, separately from the existing cheer/wishing ban", () => {
    assert.match(src, /NO evaluative praise of the insight itself/);
    assert.match(src, /참 의미 있어요/);
    assert.match(src, /의미 있는 변화예요/);
  });

  it("includes a FAILED\\/WORKING example pair for evaluative praise, matching the adaptation_story example-pair pattern", () => {
    assert.match(src, /이 점을 알게 되었다는 것이 참 의미 있어요/);
    assert.match(src, /이제 중요한 선택 앞에서 어느 쪽을 더 사용하고 있는지 알아차릴 수 있습니다/);
  });

  it("the pre-existing cheer\\/wishing ban is still present (not replaced, only supplemented)", () => {
    assert.match(src, /STRICTLY FORBIDDEN.*응원합니다.*풍요롭길 바랍니다/s);
  });
});
