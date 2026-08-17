/**
 * IA Batch 5 — Going Forward + One Next Move
 * Part 07 ("앞으로 더 나답게 선택한다는 것") framing & decision compass verification:
 * - Predictive language regression: prompt forbids predictive/fortune-telling claims (당신에게 다가올 것, 앞으로 이런 일이 생길 거예요, 성장할 것입니다, will happen)
 * - Self-help & customer-service tone regression: prompt forbids customer service/self-help filler (고객님, 회원님, 귀하, 응원합니다, 성공할 것입니다, 노력하세요, 명상하세요)
 * - Going-forward roles: 3 distinct roles for remember (01 Keep, 02 Loosen, 03 Recover) + 1 decision compass for leap
 * - One Next Move & Checklist migration: checklist coerced & validated to 1 item (One Next Move), user-visible task dump removed
 * - Existing Schema: zero top-level schema additions, checklist schema validated for 1-12 items
 * - No new LLM call: exactly 2 LLM call sites (Part A, Part B)
 *
 * Run: npx tsx tests/unit/deep-essence-going-forward-next-move.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { buildPersonalCeFixtureChart, runPersonalContextEngine } from "../../lib/personCore/personalContextEngine/index.ts";
import { buildPart01IdentityEvidencePacket } from "../../lib/v1/slim/part01IdentityEvidence.ts";
import { formatPart01EvidenceForPrompt } from "../../lib/report/formatPart01EvidenceForPrompt.ts";
import { buildDeepEssenceStructuredPartBUserPrompt } from "../../lib/prompts/deepEssenceStructured.ts";
import { isDeepEssenceStructuredReport } from "../../lib/report/deepEssenceStructuredSchema.ts";
import { coerceDeepEssencePartB } from "../../lib/report/coerceDeepEssenceStructured.ts";

function buildFixtureEvidence() {
  const chart = buildPersonalCeFixtureChart("known_time");
  const personalContext = runPersonalContextEngine({ chart });
  const packet = buildPart01IdentityEvidencePacket({
    chart,
    personalContext,
    currentPrimary: { autonomy: 60, connection: 50, stability: 70, growth: 40, structure: 55, adaptability: 65 },
    currentSecondary: { stimulation: 60, self_control: 50, practicality: 55, structure: 45, empathy: 65, conflict_style: 40, resilience: 70, recognition: 50, energy_style: 55, thinking_style: 60, decision_style: 45 },
    innatePrimary: { autonomy: 40, connection: 60, stability: 65, growth: 50, structure: 55, adaptability: 45 },
  });
  return formatPart01EvidenceForPrompt(packet);
}

describe("Personal Premium Batch 5 — Going Forward + One Next Move", () => {
  it("A. Predictive Language Regression: prompt forbids predictive/fortune-telling claims", () => {
    const part01Evidence = buildFixtureEvidence();
    const promptKo = buildDeepEssenceStructuredPartBUserPrompt({
      surveyAnalysis: "test survey",
      essenceAnalysisSummary: "test essence",
      birthEnergyContext: "test birth energy",
      partAExcerpt: "test excerpt",
      part01Evidence: {
        relationshipText: "rel text",
        practiceText: "prac text",
        futureText: "fut text",
      },
      locale: "ko-KR",
    });

    assert.match(promptKo, /FORBIDDEN PREDICTIVE FRAMING/);
    assert.match(promptKo, /당신에게 다가올 것/);
    assert.match(promptKo, /성장할 것입니다/);
    assert.match(promptKo, /Frame everything as AGENCY/);
  });

  it("B. Self-Help / Customer Service Tone Regression: prompt forbids filler words (응원합니다, 고객님, 명상하세요)", () => {
    const part01Evidence = buildFixtureEvidence();
    const promptKo = buildDeepEssenceStructuredPartBUserPrompt({
      surveyAnalysis: "test survey",
      essenceAnalysisSummary: "test essence",
      birthEnergyContext: "test birth energy",
      partAExcerpt: "test excerpt",
      part01Evidence: {
        relationshipText: "rel text",
        practiceText: "prac text",
        futureText: "fut text",
      },
      locale: "ko-KR",
    });

    assert.match(promptKo, /FORBIDDEN SELF-HELP\/CUSTOMER SERVICE CHEERS/);
    assert.match(promptKo, /응원합니다/);
    assert.match(promptKo, /고객님/);
    assert.match(promptKo, /명상하세요/);
  });

  it("C. Going-Forward Roles Contract: remember mandated 3 distinct roles (Keep, Loosen, Recover) and leap as Decision Compass", () => {
    const part01Evidence = buildFixtureEvidence();
    const promptKo = buildDeepEssenceStructuredPartBUserPrompt({
      surveyAnalysis: "test survey",
      essenceAnalysisSummary: "test essence",
      birthEnergyContext: "test birth energy",
      partAExcerpt: "test excerpt",
      part01Evidence: {
        relationshipText: "rel text",
        practiceText: "prac text",
        futureText: "fut text",
      },
      locale: "ko-KR",
    });

    assert.match(promptKo, /remember\[0\] \(계속 가져갈 것 \/ Keep\)/);
    assert.match(promptKo, /remember\[1\] \(조금 덜 해도 되는 것 \/ Loosen\)/);
    assert.match(promptKo, /remember\[2\] \(다시 회복해도 되는 것 \/ Recover\)/);
    assert.match(promptKo, /leap \(선택할 때 기억할 단 하나의 기준 \/ Decision Compass\)/);
  });

  it("D. One Next Move & Checklist Migration: prompt mandates exactly 1 checklist item and coercion outputs 1 item", () => {
    const part01Evidence = buildFixtureEvidence();
    const promptKo = buildDeepEssenceStructuredPartBUserPrompt({
      surveyAnalysis: "test survey",
      essenceAnalysisSummary: "test essence",
      birthEnergyContext: "test birth energy",
      partAExcerpt: "test excerpt",
      part01Evidence: {
        relationshipText: "rel text",
        practiceText: "prac text",
        futureText: "fut text",
      },
      locale: "ko-KR",
    });

    assert.match(promptKo, /checklist \(지금 당신에게 가장 중요한 한 가지 \/ One Next Move\)/);
    assert.match(promptKo, /EXACTLY 1 ITEM/);

    const rawPartB = {
      relationships: { pattern: "pat", fit: ["f1", "f2", "f3"], friction: ["fr1", "fr2", "fr3"], compare: [{ wound: "w1", steady: "s1" }, { wound: "w2", steady: "s2" }, { wound: "w3", steady: "s3" }] },
      playbook: { rule: "r", rows: [{ situation: "s1", old: "o1", better: "b1" }, { situation: "s2", old: "o2", better: "b2" }, { situation: "s3", old: "o3", better: "b3" }], heated: "h", reset: "rs" },
      future: { remember: ["keep", "loosen", "recover"], leap: "decision compass" },
      closing: "closing narrative",
      checklist: ["action 1", "action 2", "action 3"],
    };

    const coerced = coerceDeepEssencePartB(rawPartB);
    const checklistResult = coerced.value.checklist;
    assert.equal(checklistResult.length, 1);
    assert.equal(checklistResult[0], "action 1");
  });

  it("E. Schema Validation: accepts 1 item checklist in isDeepEssenceStructuredReport", () => {
    const sampleReport = {
      summary: { core_mode: "Quiet Navigator", energy_balance: "65 / 35", growth_edge: "Decisiveness" },
      radar_potential: { autonomy: 80, connection: 70, stability: 75, growth: 85, structure: 60, adaptability: 70 },
      strengths: [
        { title: "말보다 먼저 분위기를 읽는 힘", body: "상대방의 기류 변화를 빠르게 포착하고 조율하는 능력이 자연스럽게 드러납니다." },
        { title: "복잡한 상황에서 중심을 잡는 방식", body: "감정이 고조될 때 한 걸음 물러서서 현상을 객관적으로 조망합니다." },
        { title: "약속한 바를 끝까지 지키는 책임감", body: "자신이 맡은 역할에 대해 높은 표준을 유지하며 성실하게 완수합니다." },
      ],
      watchouts: [
        { title: "중요한 결정에서 다른 사람의 확신을 먼저 확인하는 방식", body: "관점을 깊이 고려하는 강점이 과사용될 때 결정 자체보다 확인 과정에 더 많은 에너지를 쓰게 됩니다." },
        { title: "충분히 잘하고 있어도 기준을 쉽게 낮추지 않는 방식", body: "높은 표준을 유지하려는 태도가 계속 유지되면 작은 지연에도 피로가 누적될 수 있습니다." },
        { title: "예측하기 어려운 상황에서 더 많은 에너지를 쓰는 패턴", body: "변수를 미리 파악하려는 노력이 길어질 때 관계 자체보다 조율 상태에서 에너지가 소모됩니다." },
      ],
      energy: {
        headline: "관계 속에서 계속 감정과 반응을 읽고 조정하느라 에너지가 소모되고 있습니다.",
        balance_pct: 35,
        bars: [
          { label: "Energy spent on people & relationships", value: 65, tone: "highlight" },
          { label: "Energy returning to you", value: 35, tone: "accent" },
          { label: "Solo recovery time", value: 50, tone: "ink" },
        ],
        summary: "사람들과 함께 있는 것 자체보다, 관계 속에서 상대의 반응을 읽고 자신의 판단을 조정해야 하는 상황에서 더 많은 에너지를 씁니다.",
        fuels: ["내 의도를 길게 설명하지 않아도 통하는 대화", "계속 반응하지 않아도 되는 조용한 시간", "의사결정 권한이 명확한 작업 환경"],
        drains: ["여러 사람의 기대를 동시에 맞춰야 하는 상황", "결정 전에 너무 많은 관점을 계속 확인해야 하는 상황", "예측되지 않은 스케줄 변경"],
        optimal: ["독립적인 작업 시간이 확보된 환경", "서로의 경계를 존중하는 상호작용"],
      },
      relationships: {
        pattern: "서로의 독립성을 존중할 때 가장 깊은 안도감을 느낍니다.",
        fit: ["감정을 과하게 강요하지 않는 사람", "개인의 영역을 존중하는 사람", "판단을 서두르지 않는 사람"],
        friction: ["경계를 침범하는 사람", "솔직함을 가장해 비난하는 사람", "모든 스케줄을 통제하려는 사람"],
        compare: [
          { wound: "왜 말을 안 해?", steady: "천천히 생각하고 편할 때 말해줘" },
          { wound: "너만 바빠?", steady: "오늘 고생 많았어, 쉬어" },
          { wound: "왜 이렇게 신경질적이야?", steady: "지쳤구나, 나중에 얘기하자" },
        ],
      },
      playbook: {
        rule: "상대방의 기대에 반응하기 전에 내 판단을 먼저 확인합니다.",
        rows: [
          { situation: "급한 요청", old: "바로 승낙", better: "생각할 시간을 가짐" },
          { situation: "갈등 상황", old: "회피", better: "내 입장을 전달" },
          { situation: "피로 누적", old: "참기", better: "휴식 요청" },
        ],
        heated: "잠시 자리를 비우고 호흡을 다듬습니다.",
        reset: "주말 오전 홀로 시간을 갖습니다.",
      },
      future: {
        remember: [
          "01 Keep: 나의 독자적인 분석과 준비 과정을 굳이 바꾸지 않고 계속 신뢰해도 괜찮습니다.",
          "02 Loosen: 모든 상황에서 완벽한 조율을 증명하려 애쓰지 않아도 됩니다.",
          "03 Recover: 타인의 확신을 묻기 전에 나의 내면 신호로 돌아오는 허락을 스스로에게 주어도 됩니다.",
        ],
        leap: "앞으로 중요한 선택을 앞두고, 나의 자율성이 확보되는 환경을 우선 선택하고, 다수의 기대만을 맞춰야 하는 상황은 피하는 것을 하나의 판단 기준으로 삼을 수 있어요.",
      },
      closing: "지금까지 살아오며 만들어온 방식과 본래 편한 방식 중 어느 하나만이 진짜 당신인 것은 아니에요. 중요한 건 앞으로 어떤 선택에서 어느 쪽을 더 사용할지 스스로 알아볼 수 있게 되었다는 점입니다.",
      checklist: [
        "다음 중요한 결정을 앞두고 다른 사람의 의견을 묻기 전에, 먼저 '나는 지금 무엇을 원하지?'를 한 문장으로 적어보세요",
      ],
    };

    assert.equal(isDeepEssenceStructuredReport(sampleReport), true);
  });

  it("F. No new LLM call: runDeepEssenceStructuredLlm maintains 2 call sites (Part A, Part B)", () => {
    const src = fs.readFileSync("lib/report/runDeepEssenceStructuredLlm.ts", "utf8");
    const callSites = src.match(/=>\s*callLlmJson\(openai,/g) ?? [];
    assert.equal(callSites.length, 2, `expected exactly 2 callLlmJson call sites (Part A + Part B), found ${callSites.length}`);
  });
});
