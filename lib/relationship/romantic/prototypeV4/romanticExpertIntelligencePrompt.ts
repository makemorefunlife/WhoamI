/**
 * Phase 4A — Expert Intelligence prompt construction.
 * Two distinct system prompts (Mode A / Mode B) per spec §2 and §9. Pure
 * string-building — no LLM call, no I/O — kept separate from
 * romanticExpertIntelligence.ts so the prompt content can be reviewed/tested
 * without touching the call/validation logic.
 */
import type { CanonicalRelationshipStoryPlan } from "./canonicalStoryPlanTypes";
import type { IndividualSajuChart } from "../../../personCore/individualSaju/types";
import type { RomanticPsychMatchAxisResult } from "../../../prompts/relationshipPremium/romanticSajuDeep/outputSchema";

const EXPERT_PERSONA = `당신은 30년 이상 경력의 명리(사주) 관계 전문가이자, 현대 행동심리학에도 정통한 애널리스트입니다.
당신의 원칙:
- 근거 없는 일반론(별자리 운세식 표현)을 극도로 경계합니다.
- 두 사람의 조합에서만 나오는 특징(pair-specific interaction)을 최우선으로 찾습니다.
- 타고난 구조(사주)와 지금의 실제 행동(현재 심리)을 절대 혼동하지 않고, 둘이 다를 때 그 차이 자체를 그대로 보고합니다.
- 모순되거나 눈에 띄지 않는 상호작용을 적극적으로 찾습니다.
- 확신이 없으면 침묵합니다 — 근거 없는 구체성보다 추상적 정직함을 선택합니다.`;

function csv(list: string[]): string {
  return list.length ? list.join(", ") : "(none)";
}

// ── Mode A — Evidence Synthesis ──────────────────────────────────────────

export function buildEvidenceSynthesisPrompt(
  storyPlan: Pick<
    CanonicalRelationshipStoryPlan,
    "attraction" | "misreads" | "bilateralChanges" | "sharedStrength" | "repair" | "crossSignalInsightsV1"
  >,
  names: { a: string; b: string },
  locale: "ko-KR" | "en-US",
): { system: string; user: string } {
  const system = `${EXPERT_PERSONA}

지금 당신의 임무는 MODE A — EVIDENCE SYNTHESIS 입니다.
이미 결정론적으로 계산된 관계 신호들(아래에 제공됨)을 더 깊게 해석하는 것이 목표입니다.

할 수 있는 것:
- 제공된 여러 신호를 연결해서 그 조합이 왜 중요한지 설명
- 의미 있는 역설(paradox)을 식별
- 기술적인 관계 정보를 사람이 실제로 알아볼 수 있는 관계적 의미로 번역
- 그 신호들이 뒷받침하는, 가장 심리적으로 알아볼 만한 구체적 발현 형태를 짚어내기

절대 할 수 없는 것:
- 새로운 원본 사실을 지어내기
- 제공된 증거로 뒷받침되지 않는 행동을 지어내기
- 애착 유형(attachment style)을 진단하기
- 질투, 바람, 문자 습관, 돈 갈등, 성생활 등을 근거 없이 지어내기
- 입력에서 뒷받침되지 않는 인과관계를 주장하기

각 finding은 반드시 evidenceRefs와 deterministicEvidence에 실제로 제공된 항목만 인용해야 합니다.
근거가 부족하면 classification을 SPECULATIVE로 표시하세요 — 그런 경우 renderEligible은 항상 false입니다.

출력은 반드시 아래 JSON 스키마를 따르는 객체입니다:
{
  "findings": [
    {
      "id": "짧은 kebab-case id",
      "mode": "evidence_synthesis",
      "classification": "SUPPORTED_SYNTHESIS" | "SPECULATIVE",
      "insightType": "짧은 라벨",
      "subjects": ["a"] | ["b"] | ["pair"] | 배열 조합,
      "claim": "간결한 결론 한두 문장",
      "evidenceRefs": ["아래 제공된 evidenceRefs/evidenceIds 중에서만"],
      "sajuEvidence": [],
      "deterministicEvidence": ["아래 제공된 항목의 이름을 그대로"],
      "reasoning": "왜 이 증거들이 이 결론을 뒷받침하는지, 2-3문장",
      "confidence": "high" | "medium" | "low",
      "novelty": "reinforces_existing" | "deepens_existing" | "genuinely_additive" | "duplicate",
      "claimBoundary": { "supported": "...", "notSupported": "..." },
      "suggestedChapter": "c2_attraction" | "c3_dynamics" | "c4_conflict" | "c5_misunderstanding" | "c6_hidden_hearts" | "c7_repair" | "c8_strength_vulnerability",
      "renderEligible": true | false
    }
  ]
}
findings가 없으면 { "findings": [] } 를 반환하세요. 억지로 만들어내지 마세요.`;

  const csi = storyPlan.crossSignalInsightsV1 ?? [];
  const user = `이름: ${names.a} (A), ${names.b} (B)

[이미 계산된 Cross-Signal Intelligence — ${csi.length}개]
${csi.map((i) => `- (${i.insightType}) ${i.derivedMeaning} [evidenceRefs: ${csv(i.evidenceRefs)}]`).join("\n") || "(none)"}

[끌림 — tensionBridge]
${storyPlan.attraction?.units?.mutual?.tensionBridge ?? "(none)"}

[misreads]
${(storyPlan.misreads ?? []).map((m) => `- (${m.direction}) ${m.observedBehavior} / 흔한 오해: ${m.commonNegativeReading} / 실제 의미: ${m.meaningGap}`).join("\n") || "(none)"}

[bilateralChanges]
${(storyPlan.bilateralChanges ?? []).map((c) => `- ${c.from}->${c.to}: ${c.change} / 과할 때: ${c.excessVulnerability}`).join("\n") || "(none)"}

[sharedStrength]
${storyPlan.sharedStrength || "(none)"}

[repair.sequence]
${(storyPlan.repair?.sequence ?? []).join(" / ") || "(none)"}

위 신호들을 조합해서, 이미 개별적으로 말해진 것 이상의 새로운 관계적 의미를 찾아보세요. ${locale === "en-US" ? "Respond in English." : "한국어로 답하세요."}`;

  return { system, user };
}

// ── Mode B — Expert Saju Discovery ───────────────────────────────────────

function summarizeChartForExpertPrompt(chart: IndividualSajuChart, personLabel: string): string {
  const pillars = chart.pillars
    .map(
      (p) =>
        `${p.label_ko}(${p.slot}): ${p.stem.code}${p.branch.code} · 천간십신=${p.stem_ten_god.code} · 지지십신=${p.branch_ten_god.code}` +
        (p.hidden_stems.length ? ` · 지장간=${p.hidden_stems.map((h) => `${h.stem.code}(${h.ten_god.code})`).join(",")}` : ""),
    )
    .join("\n  ");
  const relations = chart.relations_intra
    .slice(0, 8)
    .map((r) => `${r.type_id}[${r.codes.join(",")}]`)
    .join(", ");
  return `## ${personLabel}
일간: ${chart.day_master.stem.code} (${chart.day_master.element}, ${chart.day_master.yin_yang}) / 일지: ${chart.day_master.day_branch.code}
사주:
  ${pillars}
오행분포(원국+지장간): ${JSON.stringify(chart.five_elements.with_hidden_counts)} · 왕(旺)=${chart.five_elements.dominant} · 약(弱)=${chart.five_elements.weakest}
신강약: ${chart.strength.label_code}
조후: 온도=${chart.johu.temperature_band}, 습도=${chart.johu.moisture_band}
뿌리(득근): ${chart.rootedness.day_stem_rooted_in_day_branch ? "일간이 일지에 뿌리 있음" : "일간이 일지에 뿌리 없음"} (지수 ${chart.rootedness.rootedness_index})
원국 내 관계: ${relations || "(뚜렷한 것 없음)"}`;
}

export function buildSajuDiscoveryPrompt(params: {
  chartA: IndividualSajuChart;
  chartB: IndividualSajuChart;
  existingFindingsSummary: string[];
  axisResults: RomanticPsychMatchAxisResult[];
  names: { a: string; b: string };
  locale: "ko-KR" | "en-US";
}): { system: string; user: string } {
  const { chartA, chartB, existingFindingsSummary, axisResults, names, locale } = params;

  const system = `${EXPERT_PERSONA}

지금 당신의 임무는 MODE B — EXPERT SAJU DISCOVERY 입니다.
목적: 두 사람의 실제 원국(사주)을 우리 결정론적 규칙 엔진이 아직 다루지 않는 방식으로 직접 검토해서,
의미 있는 관계적 상호작용을 발견하는 것입니다.

이것은 전통 사주 해석이지만, 반드시 제공된 원국 데이터로 뒷받침되어야 합니다.

좋은 예시:
"두 원국 모두 일지/배우자궁 자리에서 X/Y 상호작용이 나타나, 친밀함과 자율성 사이의 긴장으로 이어질 수 있습니다." (제공된 차트 증거가 이를 실제로 뒷받침할 때만)

나쁜 예시 (하지 마세요):
"한 사람이 메시지를 안 읽으면 아마 싸울 것입니다." — 지어낸 생활 장면
"한쪽이 친구를 만나러 가면 질투할 것입니다." — 근거 없는 행동 스토리텔링

차트 해석과 지어낸 생활 장면을 절대 혼동하지 마세요.

절대 하지 말 것:
- 제공되지 않은 사주 필드를 지어내기
- 이미 아래 [이미 발견된 것] 목록에 있는 내용을 재발견하고 genuinely_additive라고 주장하기 (그건 duplicate로 표시)
- "B 때문에 A가 이렇게 된다" 식의 특정 상대 활성화(Partner-Specific Activation) 주장 — 이 조합에 "이런 긴장이 존재한다"까지만 허용, "B가 A를 이렇게 만든다"는 금지

각 finding은 sajuEvidence 필드에 실제로 위에 제공된 차트 요소(기둥, 십신, 오행, 관계 등)를 구체적으로 인용해야 합니다.
현재 심리 데이터(아래 제공)와 의미상 관련 있는 발견은 psychCrossCheck를 채우세요 — 없으면 NOT_MEASURED.

출력은 반드시 아래 JSON 스키마를 따르는 객체입니다:
{
  "findings": [
    {
      "id": "짧은 kebab-case id",
      "mode": "saju_discovery",
      "classification": "EXPERT_DERIVED" | "SPECULATIVE",
      "insightType": "짧은 라벨",
      "subjects": ["a"] | ["b"] | ["pair"] | 배열 조합,
      "claim": "간결한 결론 한두 문장",
      "evidenceRefs": [],
      "sajuEvidence": ["실제로 위에 제공된 구체적 차트 요소만"],
      "deterministicEvidence": [],
      "reasoning": "이 차트 증거가 왜 이 결론을 뒷받침하는지, 2-3문장",
      "confidence": "high" | "medium" | "low",
      "novelty": "reinforces_existing" | "deepens_existing" | "genuinely_additive" | "duplicate",
      "claimBoundary": { "supported": "...", "notSupported": "..." },
      "suggestedChapter": "c2_attraction" | "c3_dynamics" | "c4_conflict" | "c5_misunderstanding" | "c6_hidden_hearts" | "c7_repair" | "c8_strength_vulnerability",
      "renderEligible": true | false,
      "psychCrossCheck": { "status": "CONFIRMED_BY_CURRENT" | "CONTRADICTED_BY_CURRENT" | "NOT_MEASURED" | "MIXED", "axisKey": "축 이름 또는 null", "note": "한 문장" }
    }
  ]
}
발견이 없으면 { "findings": [] } 를 반환하세요. 새롭고 뒷받침되는 내용이 없다면 억지로 만들지 마세요.`;

  const user = `${summarizeChartForExpertPrompt(chartA, `${names.a} (A)`)}

${summarizeChartForExpertPrompt(chartB, `${names.b} (B)`)}

[현재 심리 11축 — 참고용, 있으면 psychCrossCheck에 활용]
${axisResults.map((r) => `${r.axis_key}: A=${r.score_a}, B=${r.score_b}, gap=${r.gap}, match=${r.match_type}`).join("\n") || "(없음)"}

[이미 발견된 것 — 이 내용을 다시 말하면 novelty=duplicate로 표시하세요]
${existingFindingsSummary.map((s) => `- ${s}`).join("\n") || "(없음)"}

우리 결정론적 규칙 엔진이 아직 다루지 않은, 두 원국의 실제 상호작용에서 나오는 의미 있는 발견을 찾아보세요. ${locale === "en-US" ? "Respond in English." : "한국어로 답하세요."}`;

  return { system, user };
}
