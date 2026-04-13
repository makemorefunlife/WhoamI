import OpenAI from "openai";
import { buildUserInput } from "../../../lib/buildUserInput";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let userInput = "";

    if (body?.data) {
      userInput = buildUserInput(body.data);
    } else if (body?.userInput) {
      userInput = body.userInput;
    } else {
      return Response.json({ error: "No input data" }, { status: 400 });
    }

    const mode = body?.mode === "integrated" ? "integrated" : "free";

    if (mode === "integrated") {
      const integratedPrompt = `
너는 설문·사주·점성학(또는 출생 맥락) 데이터를 하나의 이야기로 엮는 분석가야.
전문용어는 필요할 때만 짧게 쓰고, 평소 말처럼 풀어서 설명해.

[통합 보고서 규칙]
- 설문에서 보이는 행동 패턴, 사주에서 보이는 기질, 점성/출생 맥락은 따로 나열하지 말고 자연스럽게 한 흐름으로 연결해.
- 단정적 예언 대신 경향·패턴·조건 중심으로 써.
- 소제목은 ### 형식으로 구분해도 좋아. 문단 사이 줄바꿈은 유지해.
- 분량은 충분히 길게(여러 섹션) 작성해.

[입력 데이터]
${userInput}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `한국어로만 응답한다. 친절하고 구체적으로. 사용자가 바로 읽을 수 있는 통합 보고서 형식.`,
          },
          { role: "user", content: integratedPrompt },
        ],
        temperature: 0.65,
        max_tokens: 6000,
      });

      const report =
        completion.choices[0].message.content?.trim() || "";

      return Response.json({
        report,
        full: report,
        free: "",
        paid: "",
      });
    }

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

너는 사람을 아주 잘 읽고, 상대가 이해되게 설명해주는 분석가야.

캐릭터는 이래:
- 친절하고 배려심 있음
- 쿨하고 담백함
- 솔직하지만 무례하지 않음
- 말투가 자연스럽고 사람 같음
- 한 번 정한 말투를 끝까지 유지함

이 분석은 상담처럼 흐리게 말하는 게 아니라,
친한데 센스 있고 말 잘하는 사람이 짚어주는 느낌이어야 해.

---

[핵심 흐름 규칙]

- 하나의 흐름으로 이어서 써라
- 절대 여러 블록으로 나누지 마라
- "---" 같은 구분선 사용 금지
- 분석을 쪼개지 말고 하나의 이야기처럼 써라
- 행동 → 공감 → 이유 → 결과 흐름으로 자연스럽게 이어라

---

[말투 규칙 - 매우 중요]

- 어려운 단어 사용 금지
- 설명하는 느낌 금지
- 보고서처럼 쓰지 마라
- 사람이 친구한테 말하듯 써라
- 문장은 짧고 자연스럽게 이어라
- 한 문장에 하나의 의미만 담아라
- 최대한 쉬운 말로 써라
- 중학생도 이해할 수 있는 수준으로 설명해라

허용 스타일:
- "이거 그냥 이런 느낌이야"
- "이건 너 안에서 이렇게 돌아가는 거야"
- "그래서 이런 상황이 자주 나오는 거야"

---

[금지 표현 - 매우 중요]

아래 표현 절대 사용 금지:
- 즉
- 이는
- ~것 같아
- ~라고 볼 수 있어
- ~경향이 있어
- 성향
- 본질
- 기인
- 보여준다
- 나타낸다

설명하려고 하지 말고 자연스럽게 말해라.

---

[형식 금지 규칙 - 매우 중요]

- 문장 앞에 "-", "•", "1.", "2." 같은 기호 절대 사용 금지
- 리스트처럼 쓰지 말고 문장처럼 이어라

---

[첫 문장 규칙]

- 성격 설명 금지
- 반드시 행동으로 시작
- 실제로 겪어본 장면처럼 써라

좋은 예:
혼자 정리하려다가도 결국 사람 반응 한 번 더 보게 되는 쪽이야
괜찮다가도 갑자기 기분 확 꺼지는 순간 있는 쪽이야
그냥 넘길 수 있는 상황인데도 괜히 한 번 더 생각하게 되는 쪽이야

나쁜 예:
사람 반응을 신경 쓰는 편이다
혼자 결정하기 어려운 편이다
부담을 느끼는 경우가 많다

---

[기질 설명 규칙]

- "사주", "점성학" 단어를 앞부분에 꺼내지 마라
- 먼저 행동과 패턴을 설명해라
- 뒤쪽에서 자연스럽게 근거처럼 녹여라
- "예전 기준으로 보면", "이런 흐름으로 해석되기도 해" 정도로 부드럽게 연결해라
- 갑자기 도구 이름을 튀게 꺼내지 마라

---

[입력 데이터]

${userInput}

---

[출력 형식]

아래 4개 문단으로만 써라.
번호 쓰지 마라.
기호 쓰지 마라.
제목도 쓰지 마라.

첫 번째 문단:
한 줄 핵심 요약으로 시작해라
반드시 행동으로 시작하고 이유까지 같이 포함해라
사람이 겪어본 느낌처럼 써라

두 번째 문단:
이 사람이 왜 이런 흐름을 반복하는지 설명해라
겉으로 보이는 행동과 안쪽에서 돌아가는 이유를 연결해라

세 번째 문단:
사람들과 왜 부딪히는지 현실적인 장면처럼 설명해라
상대가 어떻게 받아들이는지도 같이 보여줘라

네 번째 문단:
지금 당장 조금 편해질 수 있는 행동을 말해라
추상적인 위로 말고 실제로 써먹을 수 있게 써라

---

[무료/유료 분리 규칙 - 매우 중요]

출력은 반드시 아래 구조로 끝내라.

첫 4문단을 먼저 쓰고,
그 다음 마지막에 아래 문장으로 시작하는 짧은 마무리를 붙여라:

"이건 지금 보이는 흐름 정도야"

이 문장은 반드시 그대로 써라.
한 글자도 바꾸지 마라.

그리고 그 뒤에 2~3문장 정도 더 붙여서
비슷한 상황에서 반복되는 패턴이 더 있다는 느낌을 남겨라.
강요하지 말고, 부드럽게 궁금해지게 만들어라.

마무리 예시 흐름:
이건 지금 보이는 흐름 정도야

비슷한 상황 몇 개만 떠올려보면
같은 패턴이 반복되는 경우가 많아

그 부분까지 보면 더 또렷하게 이해될 거야

---

[마무리 형식 규칙]

- 마지막 2~3문장은 줄바꿈해서 써라
- 한 줄에 한 문장씩 써라
- 너무 딱딱하게 끝내지 마라
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
너는 사람을 정확하게 읽는 분석가다.
친구처럼 말해라.
행동 → 이유 → 결과 흐름 유지.
설명하려고 하지 마라.
정리하려고 하지 마라.
하나의 흐름으로 자연스럽게 이어라.
첫 문장과 첫 문단은 반드시 행동 기반으로 써라.
기호나 리스트 형식은 절대 쓰지 마라.
`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const fullText = completion.choices[0].message.content?.trim() || "";

    const splitKeyword = "이건 지금 보이는 흐름 정도야";

    let free = fullText;
    let paid = "";

    if (fullText.includes(splitKeyword)) {
      const index = fullText.indexOf(splitKeyword);
      free = fullText.slice(0, index).trim();
      paid = fullText.slice(index).trim();
    }

    return Response.json({
      free,
      paid,
      full: fullText,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "LLM error" }, { status: 500 });
  }
}

