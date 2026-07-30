/**
 * Prove four-CE sibling integration into Romantic Narrative prototype.
 * Run: npx tsx tests/scripts/prove-romantic-four-ce-integration.ts
 */
import fs from "node:fs";
import path from "node:path";
import { buildActualFourCeContract } from "@/lib/relationship/romantic/prototypeV3/buildActualFourCeContract";
import { buildRomanticV3PrototypePayload } from "@/lib/relationship/romantic/prototypeV3/buildRomanticV3PrototypePayload";

const outDir = path.resolve("tests/artifacts/romantic-v3-prototype");
fs.mkdirSync(outDir, { recursive: true });

const { contract, prepared, pairCeBondingValue } = buildActualFourCeContract("ko-KR");
const payload = buildRomanticV3PrototypePayload("complete", "ko-KR", {
  contractOverride: contract,
});

const narrativeBlocks = payload.chapters
  .flatMap((chapter) =>
    chapter.blocks.map((block) => ({
      chapter: chapter.chapter,
      blockId: block.blockId,
      sourceKind: block.sourceKind,
      content: block.content,
      evidenceIds: block.evidenceIds,
    })),
  )
  .filter((row) => row.sourceKind !== "editorial_label");

const result = {
  "1_actual_A_individual_ce_input": contract.siblingInputs.individualCeA,
  "2_actual_B_individual_ce_input": contract.siblingInputs.individualCeB,
  "3_actual_pair_ce_input": {
    source: contract.siblingInputs.pairCeCommon.source,
    value: contract.siblingInputs.pairCeCommon.output,
    pairCeBondingValue,
    pairLensFromPrepared: prepared.dynamicsTyped?.pairLens ?? null,
  },
  "4_actual_romantic_ce_input": {
    source: contract.siblingInputs.romanticCeSpecific.source,
    value: contract.siblingInputs.romanticCeSpecific.output,
    dominantCategoryKeys: Object.keys(
      (prepared.romanticContextInput?.dominant_categories ?? {}) as Record<
        string,
        unknown
      >,
    ),
  },
  "5_combined_pre_narrative_payload": contract,
  "6_resulting_korean_romantic_narrative": narrativeBlocks.filter((row) =>
    ["ch0_opening", "ch1_who_we_are_together", "ch2_you_and_me", "ch3_why_this_works"].includes(
      row.chapter,
    ),
  ),
  "7_evidence_all_four_materially_influenced_output": {
    influenceAudit: payload.fourCeInfluenceAudit ?? [],
    whyChapterEvidence: narrativeBlocks
      .filter((row) => row.chapter === "ch3_why_this_works")
      .map((row) => ({
        blockId: row.blockId,
        evidenceIds: row.evidenceIds,
      })),
    contractEvidenceIndex: contract.evidenceIndex,
  },
  paragraph_provenance: [
    {
      paragraphId: "ch2.profile.a",
      sourceCeField: "individualCeA.personal_ce_v1 packets(identity/energy)",
      selectedMeaning: "빠른 정서 언어화 + 연결 신호 확인 욕구",
      narrativePlanAssignment: "Chapter2D A 1인칭 일상 애정 표현",
      renderedSentence: payload.chapters
        .find((c) => c.chapter === "ch2_you_and_me")
        ?.blocks.find((b) => b.blockId === "profile.a")?.content,
    },
    {
      paragraphId: "ch2.profile.b",
      sourceCeField: "individualCeB.personal_ce_v1 packets(identity/strengths)",
      selectedMeaning: "행동 기반 애정 증명 + 숙성 후 언어화",
      narrativePlanAssignment: "Chapter2D B 1인칭 일상 애정 표현",
      renderedSentence: payload.chapters
        .find((c) => c.chapter === "ch2_you_and_me")
        ?.blocks.find((b) => b.blockId === "profile.b")?.content,
    },
    {
      paragraphId: "ch3.why.a_to_b",
      sourceCeField: "pairCeCommon.packets + romanticCeSpecific.expression_speed",
      selectedMeaning: "A의 선제 언어화가 B의 반응 속도 안정화에 기여",
      narrativePlanAssignment: "Chapter3 A gives B",
      renderedSentence: payload.chapters
        .find((c) => c.chapter === "ch3_why_this_works")
        ?.blocks.find((b) => b.blockId === "why.a_to_b")?.content,
    },
    {
      paragraphId: "ch3.why.b_to_a",
      sourceCeField: "pairCeCommon.energy flow + romanticCeSpecific.reassurance_signal",
      selectedMeaning: "B의 행동 증거가 A의 불안 과증폭을 완화",
      narrativePlanAssignment: "Chapter3 B gives A",
      renderedSentence: payload.chapters
        .find((c) => c.chapter === "ch3_why_this_works")
        ?.blocks.find((b) => b.blockId === "why.b_to_a")?.content,
    },
    {
      paragraphId: "ch3.why.together",
      sourceCeField:
        "pairCeCommon.group(bonding/friction) + romanticCeSpecific(recovery/balance/reassurance)",
      selectedMeaning: "관계 운영체계(빠른 연결 + 지연 없는 복귀 약속)",
      narrativePlanAssignment: "Chapter3 together capability",
      renderedSentence: payload.chapters
        .find((c) => c.chapter === "ch3_why_this_works")
        ?.blocks.find((b) => b.blockId === "why.together")?.content,
    },
  ],
};

const outFile = path.join(outDir, "four-ce-integration-proof.json");
fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
console.log(`WROTE: ${outFile}`);
