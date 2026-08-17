/**
 * IA Batch 4 — Energy + Strength Overuse.
 * Part 05 ("잘하고 있는데, 왜 피곤할 때가 있을까요?") framing verification:
 * - Strengths: natural capability in action (concrete behavior title, not generic MBTI labels)
 * - Watchouts: Strength Overuse / Adaptation Overuse (energy cost of relying on a strength too long, not a defect list)
 * - Pattern, Not People: forbidden diagnostic/defect noun titles (의존성, 완벽주의, 불안정함, 통제욕, 권력욕, 회피형)
 * - Energy Causality: connects energy spend with strength/adaptation overuse and situational dynamics, never "people make you tired"
 * - Fuels / Drains: situational conditions, forbidden generic wellness advice (친구와의 대화, 자연 속 시간, 스트레스, 명상, 휴식)
 * - No Generic Advice: forbidden self-care advice in Part 05
 * - Existing Schema: zero top-level schema changes
 * - No new LLM call: exactly 2 LLM calls (Part A, Part B)
 *
 * Run: npx tsx tests/unit/deep-essence-energy-strength-overuse.test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { buildPersonalCeFixtureChart, runPersonalContextEngine } from "../../lib/personCore/personalContextEngine/index.ts";
import { buildPart01IdentityEvidencePacket } from "../../lib/v1/slim/part01IdentityEvidence.ts";
import { formatPart01EvidenceForPrompt } from "../../lib/report/formatPart01EvidenceForPrompt.ts";
import { buildDeepEssenceStructuredPartAUserPrompt } from "../../lib/prompts/deepEssenceStructured.ts";
import { isDeepEssenceStructuredReport } from "../../lib/report/deepEssenceStructuredSchema.ts";

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

describe("Personal Premium Batch 4 — Energy + Strength Overuse", () => {
  it("A. Pattern-Not-People: prompt forbids diagnostic noun titles (의존성, 완벽주의, 불안정함, 회피형)", () => {
    const part01Evidence = buildFixtureEvidence();
    const promptKo = buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: "test survey",
      essenceAnalysisSummary: "test essence",
      birthEnergyContext: "test birth energy",
      currentAxisScores: { autonomy: 60, connection: 50, stability: 70, growth: 40, structure: 55, adaptability: 65 },
      part01Evidence,
      locale: "ko-KR",
    });

    assert.match(promptKo, /의존성/);
    assert.match(promptKo, /완벽주의/);
    assert.match(promptKo, /불안정함/);
    assert.match(promptKo, /회피형/);
    assert.match(promptKo, /NEVER use single-word defect, diagnostic, or personality-type labels/);
  });

  it("B. Strength Overuse: prompt mandates watchouts be framed as strength/adaptation overuse", () => {
    const part01Evidence = buildFixtureEvidence();
    const promptKo = buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: "test survey",
      essenceAnalysisSummary: "test essence",
      birthEnergyContext: "test birth energy",
      currentAxisScores: { autonomy: 60, connection: 50, stability: 70, growth: 40, structure: 55, adaptability: 65 },
      part01Evidence,
      locale: "ko-KR",
    });

    assert.match(promptKo, /STRENGTH OVERUSE/);
    assert.match(promptKo, /ADAPTATION OVERUSE/);
    assert.match(promptKo, /Watchouts are strictly for RECOGNITION AND UNDERSTANDING/);
  });

  it("C. No Generic Advice: prompt forbids self-care advice in Part 05", () => {
    const part01Evidence = buildFixtureEvidence();
    const promptKo = buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: "test survey",
      essenceAnalysisSummary: "test essence",
      birthEnergyContext: "test birth energy",
      currentAxisScores: { autonomy: 60, connection: 50, stability: 70, growth: 40, structure: 55, adaptability: 65 },
      part01Evidence,
      locale: "ko-KR",
    });

    assert.match(promptKo, /NO GENERIC ADVICE IN PART 05/);
    assert.match(promptKo, /자신을 돌보세요/);
    assert.match(promptKo, /충분히 쉬세요/);
  });

  it("D. Energy Causality & Situational Fuels/Drains: prompt forbids 'people make you tired' and generic wellness advice", () => {
    const part01Evidence = buildFixtureEvidence();
    const promptEn = buildDeepEssenceStructuredPartAUserPrompt({
      surveyAnalysis: "test survey",
      essenceAnalysisSummary: "test essence",
      birthEnergyContext: "test birth energy",
      currentAxisScores: { autonomy: 60, connection: 50, stability: 70, growth: 40, structure: 55, adaptability: 65 },
      part01Evidence,
      locale: "en-US",
    });

    assert.match(promptEn, /ENERGY SYNTHESIS/);
    assert.match(promptEn, /Never 'people make you tired'/);
    assert.match(promptEn, /FUELS & DRAINS \(Situational Triggers, NO Generic Wellness Advice\)/);
  });

  it("E. Existing Schema: validates report shape without top-level schema modifications", () => {
    const sampleReport = {
      summary: {
        core_mode: "Quiet Navigator",
        energy_balance: "65 / 35",
        growth_edge: "Decisiveness",
      },
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
          "내 에너지는 한정되어 있으며 우선순위가 필요합니다.",
          "타인의 기준보다 나의 내면 신호가 더 중요합니다.",
          "쉬어가는 것이 멈추는 것은 아닙니다.",
        ],
        leap: "타인의 반응보다 나의 내면 신호에 더 큰 무게를 둡니다.",
      },
      closing: "당신은 이미 충분히 잘 적응해 왔습니다.",
      checklist: [
        "오늘 나만의 조용한 시간 30분 확보하기",
        "타인의 부탁에 즉각 답하지 않고 시간 가지기",
        "하루의 감정 기록해 보기",
        "충분한 물 섭취하기",
        "가벼운 산책하기",
        "자기 전에 스마트폰 멀리하기",
        "스스로에게 긍정적인 말 해주기",
        "편안한 음악 듣기",
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
