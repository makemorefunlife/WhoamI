export const runtime = "nodejs";
export const maxDuration = 300;

import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { buildUserInput } from "../../../lib/buildUserInput";
import {
  INTEGRATED_SYSTEM_PROMPT,
  buildIntegratedPhase1UserPrompt,
  buildIntegratedPhase2UserPrompt,
} from "../../../lib/prompts/integratedPremiumReport";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode = body.mode;

    // ============================================================
    // 🔥 모드 1: 설문 세부 해석 (detailed_survey)
    // ============================================================
    if (mode === "detailed_survey") {
      const { patterns } = body;
      const detailedSurveyPrompt = `
당신은 심리 분석 전문가입니다. 아래는 18문항 설문 결과(Y/N 패턴)입니다.

## 입력 데이터
- MBTI (q1-q3): ${patterns?.mbti || "N/A"}
- DISC (q4-q6): ${patterns?.disc || "N/A"}
- 에니어그램 (q7-q9): ${patterns?.enneagram || "N/A"}
- RIASEC (q10-q12): ${patterns?.riasec || "N/A"}
- PSS/PHQ-9 (q13-q15): ${patterns?.pss || "N/A"}
- TCI (q16-q18): ${patterns?.tci || "N/A"}

## 출력 요청
각 영역별로 5-10문장으로 작성해주세요. "너는 ~하는 스타일이야" 형식으로, 구체적인 행동 예시를 포함해주세요.

### MBTI - 사고 방식
### DISC - 에너지 방향
### 에니어그램 - 핵심 동기
### RIASEC - 직업 흥미
### PSS/PHQ-9 - 현재 상태 (스트레스/불안/우울)
### TCI - 기질·성격

마지막에 종합 분석을 작성해주세요:
- 현재 너의 강점 (2-3가지)
- 주의할 점 (2-3가지)
- 스트레스 상황에서의 패턴
- 관계에서 보이는 특징

말투는 다정하지만 핵심을 찌르는 친구처럼. 전문용어는 피하고 일상 언어로 써주세요.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: detailedSurveyPrompt }],
        temperature: 0.7,
        max_tokens: 5000,
      });

      return Response.json({ report: completion.choices[0].message.content });
    }

    // ============================================================
    // 🔥 모드 2: 통합 보고서 (integrated)
    // ============================================================
    if (mode === "integrated") {
      const { detailedSurvey, sajuData, astrologyText, stream: wantStream } =
        body as {
          detailedSurvey?: unknown;
          sajuData?: unknown;
          astrologyText?: string | null;
          stream?: boolean;
        };

      const surveyAnalysis =
        typeof detailedSurvey === "string"
          ? detailedSurvey
          : JSON.stringify(detailedSurvey ?? null, null, 2);
      const sajuSummary =
        sajuData == null
          ? "(없음)"
          : typeof sajuData === "string"
            ? sajuData
            : JSON.stringify(sajuData, null, 2);
      const astrologyInterpretation =
        typeof astrologyText === "string" && astrologyText.trim()
          ? astrologyText.trim()
          : "(없음)";

      const phase1User = buildIntegratedPhase1UserPrompt(
        surveyAnalysis,
        sajuSummary,
        astrologyInterpretation,
      );

      const phase1Messages: ChatCompletionMessageParam[] = [
        { role: "system", content: INTEGRATED_SYSTEM_PROMPT },
        { role: "user", content: phase1User },
      ];

      const useStream = wantStream === true;

      if (useStream) {
        const encoder = new TextEncoder();
        const streamOut = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              let acc = "";
              const s1 = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: phase1Messages,
                temperature: 0.65,
                max_tokens: 8192,
                stream: true,
              });
              for await (const chunk of s1) {
                const c = chunk.choices[0]?.delta?.content ?? "";
                if (c) {
                  acc += c;
                  controller.enqueue(encoder.encode(c));
                }
              }
              controller.enqueue(encoder.encode("\n\n—\n\n"));
              const excerpt = acc.length > 12000 ? acc.slice(-12000) : acc;
              const phase2User = buildIntegratedPhase2UserPrompt(
                surveyAnalysis,
                sajuSummary,
                astrologyInterpretation,
                excerpt,
              );
              const s2 = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: INTEGRATED_SYSTEM_PROMPT },
                  { role: "user", content: phase2User },
                ],
                temperature: 0.65,
                max_tokens: 8192,
                stream: true,
              });
              for await (const chunk of s2) {
                const c = chunk.choices[0]?.delta?.content ?? "";
                if (c) controller.enqueue(encoder.encode(c));
              }
              controller.close();
            } catch (e) {
              controller.error(
                e instanceof Error ? e : new Error(String(e)),
              );
            }
          },
        });

        return new Response(streamOut, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        });
      }

      const c1 = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: phase1Messages,
        temperature: 0.65,
        max_tokens: 8192,
      });
      const part1 = c1.choices[0].message.content ?? "";
      const excerpt = part1.length > 12000 ? part1.slice(-12000) : part1;
      const phase2User = buildIntegratedPhase2UserPrompt(
        surveyAnalysis,
        sajuSummary,
        astrologyInterpretation,
        excerpt,
      );
      const c2 = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: INTEGRATED_SYSTEM_PROMPT },
          { role: "user", content: phase2User },
        ],
        temperature: 0.65,
        max_tokens: 8192,
      });
      const part2 = c2.choices[0].message.content ?? "";
      const report = `${part1}\n\n—\n\n${part2}`;

      return Response.json({ report });
    }

    // ============================================================
    // 기존 코드 (free 모드 + 통합 모드 호환 유지)
    // ============================================================
    let userInput = "";

    if (body?.data) {
      userInput = buildUserInput(body.data);
    } else if (body?.userInput) {
      userInput = body.userInput;
    } else {
      return Response.json({ error: "No input data" }, { status: 400 });
    }

    const existingMode = body?.mode === "integrated" ? "integrated" : "free";

    if (existingMode === "integrated") {
      const integratedPrompt = `
너는 설문·사주·점성학(또는 출생 맥락) 데이터를 하나의 이야기로 엮는 분석가야.
전문용어는 필요할 때만 짧게 쓰고, 평소 말처럼 풀어서 설명해.

[통합 보고서 규칙]
- 설문에서 보이는 행동 패턴, 사주에서 보이는 기질, 점성/출생 맥락은 따로 나열하지 말고 자연스럽게 한 흐름으로 연결해.
- 단정적 예언 대신 경향·패턴·조건 중심으로 써.
- 소제목은 ### 형식으로 구분해도 좋아. 문단 사이 줄바꿈은 유지해.
- 분량은 충분히 길게(여러 섹션) 작성해.
- 말투는 따뜻하고 다정한 쿨한 반말로 끝까지 통일해.
- 문장 끝은 "~해", "~거야" 중심으로 쓰고, "~이다", "~다", "~입니다", "~습니다" 같은 보고서체는 쓰지 마.

[입력 데이터]
${userInput}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `한국어로만 응답한다. 친절하고 구체적으로. 따뜻하고 다정한 쿨한 반말(~해, ~거야)로 통일한다. "~이다/~다/~입니다/~습니다" 종결은 사용하지 않는다. 사용자가 바로 읽을 수 있는 통합 보고서 형식.`,
          },
          { role: "user", content: integratedPrompt },
        ],
        temperature: 0.65,
        max_tokens: 12000,
      });

      const report = completion.choices[0].message.content?.trim() || "";

      return Response.json({
        report,
        full: report,
        free: "",
        paid: "",
      });
    }

    // ============================================================
    // 무료 모드 (free)
    // ============================================================
    const hookTemplates = [
      "이거 그냥 재미로 볼 수 있는데, 생각보다 꽤 정확하게 나온다",
      "이거 가볍게 시작해도 생각보다 설명이 잘 되는 편이다",
      "이거 그냥 보면 되는데, 네가 몰랐던 부분도 좀 보일 수 있다",
      "이거 단순한 테스트 느낌은 아닌데, 이해는 쉽게 된다",
      "이거 그냥 가볍게 보면 되는데, 생각보다 납득되는 부분이 있다",
    ];

    const randomHook =
      hookTemplates[Math.floor(Math.random() * hookTemplates.length)];

    const prompt = `
${randomHook}

너는 사람을 아주 잘 읽고, 상대가 바로 이해할 말로 짚어주는 분석가야.
친한 친구한테 말하듯, 짧고 또렷하게 말해.

---

[분량·가독성 — 매우 중요]

- 네 문단 모두 **짧게**: 문단당 대략 **2~4문장**이 적당해. 억지로 길게 늘리지 마라.
- 한 문장은 **한 가지 장면·행동·느낌**만. 문장이 길어지면 둘로 나눠라.
- 뜻이 바로 떠오르는 **일상 단어**만 써라. 추상적이거나 어색한 비유·군더더기 표현은 쓰지 마라.

---

[문장 흐름]

- 각 문단 안에서는 **행동 → 감정·느낌 → 이유(왜 그런지)** 순으로 자연스럽게 이어라.
- "맨날", "자꾸", "결국" 같은 말은 **앞뒤가 말이 되는 조합**일 때만 쓴다. (예: "혼자 정리하려다가도 결국 눈치 보게 되는"처럼 행동이 이어져야 함)
- **문단마다 말투·어조가 갑자기 바뀌지 않게** 한 가지 톤을 유지해라.

---

[말끝·해석 표현 — 자연스러운 구어체]

- 문장 끝은 **구어체**로 맞춰라. 예: ~거야, ~쪽이야, ~느낌이야, ~해석돼, ~하는 걸로 보여, ~있잖아
- "이렇게 읽히는 편이야", "이런 식으로 보이는 경우가 많아"처럼 **끝이 길고 둥둥 떠다니는 말**은 피해라.
- **딱딱한 보고서체**로 끝내지 마라. (예: ~이다, ~한 편이다, ~하는 경우가 많다 로만 줄줄 끝내기 금지)

---

[금지]

- 무슨 뜻인지 한 번에 안 잡히는 표현, 억지로 붙인 긴 수식
- 즉 / 이는 / 성향 / 본질 / 기인 / 보여준다 / 나타낸다
- ~것 같아 / ~라고 볼 수 있어 / ~경향이 있어
- 문장마다 말투가 달라지게 쓰기

---

[형식]

- 문장 앞에 "-", "•", 번호 매기기 금지. 리스트가 아니라 문단으로만.
- "---" 구분선 금지.
- 네 문단 사이에는 **빈 줄 하나**만.

---

[기질·사주 언급]

- 앞부분에서 "사주", "점성학" 단어를 꺼내지 마라. 행동·패턴 먼저, 필요하면 뒤에서 살짝만.

---

[입력 데이터]

${userInput}

---

[네 문단 역할]

**첫 번째 문단 (외면 카드)**  
- **구체적인 행동·장면**으로 바로 시작해라. (예: 혼자 결정하려다가도, 먼저 반응 확인하는 식)
- 그 다음 한두 문장으로 **그게 어떤 느낌인지·어떻게 읽히는지** 짧게 연결해라.

**두 번째 문단**  
- 왜 그런 흐름이 반복되는지, 겉 행동과 안쪽 이유를 짧게 연결.

**세 번째 문단**  
- 사람들과 부딪히는 장면을 **현실적으로** 한두 가지 예로.

**네 번째 문단**  
- 오늘 할 수 있는 **작은 행동** 한두 가지. 추상적인 위로는 빼라.

---

[출력 끝]

- 네 문단만 출력. 네 번째 문단에서 끝.
- 덧붙이는 안내·업그레이드 유도 문구 금지.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
너는 사람을 정확하게 읽는 분석가다.
짧고 읽기 쉬운 문장으로, 친구한테 말하듯 써라.
각 문단은 2~4문장 정도로 압축하고, 억지로 길게 늘리지 마라.
행동 → 감정·느낌 → 이유 순으로 자연스럽게 이어져야 한다.
딱딱한 보고서체로 끝내지 말고, ~거야 / ~해석돼 / ~하는 걸로 보여 같은 자연스러운 구어체로 맞춰라.
첫 문단은 반드시 구체 행동·장면으로 시작해라.
기호나 리스트 형식은 쓰지 마라.
`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const fullText = completion.choices[0].message.content?.trim() || "";

    return Response.json({
      free: fullText,
      paid: "",
      full: fullText,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "LLM error" }, { status: 500 });
  }
}
