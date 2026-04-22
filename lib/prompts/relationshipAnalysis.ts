/** 무료·심화 관계 분석 — 4축 JSON (시점별 닉네임·축마다 다른 인사이트·행동) */

/**
 * @param myPatternsBlock  report_id_a 기준 첫 번째 사람 설문 패턴 요약
 * @param partnerPatternsBlock  두 번째 사람 설문 패턴 요약
 * @param nicknameA  report_id_a 리포트 주인 닉네임
 * @param nicknameB  report_id_b 리포트 주인 닉네임
 */
export function buildRelationshipBasicPrompt(
  myPatternsBlock: string,
  partnerPatternsBlock: string,
  nicknameA: string,
  nicknameB: string,
  reportIdA: string,
  reportIdB: string,
): string {
  return `
당신은 관계 분석 전문가입니다.

## 입력 데이터
- 나의 닉네임: ${nicknameA}  (JSON 키 "${reportIdA}" 시점에서의 '나')
- 상대방 닉네임: ${nicknameB}
- 나의 18문항 패턴:
${myPatternsBlock}

- 상대방의 18문항 패턴:
${partnerPatternsBlock}

## 두 시점 (perspectives)
1) 키 "${reportIdA}": **나 = ${nicknameA}**, **상대 = ${nicknameB}**
2) 키 "${reportIdB}": **나 = ${nicknameB}**, **상대 = ${nicknameA}** (위와 동일한 패턴 데이터이지만 문장 속 나/상대만 바뀜)

---

## 출력 규칙 (매우 중요!)

각 축(감정·민감도, 말하는 방식, 갈등·거리두기, 에너지·리듬)마다 **반드시 다른 내용**으로 작성해주세요.

특히 **insights 배열 두 줄**과 **actions 배열 두 줄**은 축마다 주제·표현·예시가 **완전히 달라야** 합니다.  
한 축에서 쓴 문장·구문을 다른 축에 복붙하거나 비슷하게 바꿔 쓰면 안 됩니다.

**출력 전 스스로 검사:** \`emotional_sensitivity.insights[0]\`과 \`communication_style.insights[0]\`을 비교했을 때 **같은 문장이거나 70% 이상 겹치면** 그 JSON 전체를 다시 작성하세요. 네 축 모두에 대해 같은 검사를 하세요.

"👉 이렇게 다르면"에 해당하는 내용 → JSON 필드 **insights** (문자열 2개)  
"🎯 오늘 이렇게"에 해당하는 내용 → JSON 필드 **actions** (문자열 2개)

---

## 말투 (my_line·partner_line 전용)

- **금지:** \`~하는 편이야\`, \`~타입이야\`, \`~인 편이야\` 같이 분류·완곡으로 흐리게 끝내기
- **권장:** \`~해\`, \`~돼\`, \`~지 않아\`, \`~게 돼\`, \`~거야\`, \`~써\`, \`~져\`처럼 상태·행동이 바로 보이게 끝내기
- **my_line·partner_line:** 문장을 \`나는\`, \`상대방은\`, \`상대는\`으로 **시작하지 말 것** (UI에 닉네임 라벨이 따로 붙음). 본문은 바로 상태·행동 서술로.
- **예 (감정 축 톤):** "감정이 크게 출렁이지 않아" / "사람들 반응에 자꾸 신경 쓰여" / "혼자 있어야 진짜 쉬어져"

---

## 축 1: emotional_sensitivity (감정·민감도)

**${nicknameA} / ${nicknameB} 시점에 맞게 '나'·'상대'에 대응시켜 채울 것.**

- **나 한 줄 (my_line):** 이 축만의 감정·민감도, 1문장, 위 **말투** 규칙 준수
- **상대 한 줄 (partner_line):** 상대의 감정·민감도, 1문장, 같은 톤
- **톤 참고 (직접 쓰지 말고 패턴만):** "기분이 확 드러나지 않아" / "작은 말에도 바로 찔려"

**insights (반드시 2개, 이 축 전용):**
- 두 사람의 **감정·민감도 차이**에서 오는 구체적 인사이트 각 1줄
- 예시 톤: "${nicknameA}은 상대 기분을 읽으려 하는데, ${nicknameB}은 말로 표현이 서툴러서 엇갈릴 수 있어" — 시점 2에서는 닉네임을 서로 바꿔 같은 구조로 쓸 것

**actions (반드시 2개, 이 축 전용·감정에만 해당):**
- 감정 차이를 줄이기 위한 **오늘 할 수 있는 말/행동** 각 1줄
- 예: "오늘 '너 지금 기분 어때?' 라고 먼저 물어봐"
- 예: "상대가 말할 때 '응, 그랬구나' 한마디만 붙여 봐"

---

## 축 2: communication_style (말하는 방식)

**insights·actions는 축 1과 문장·어휘·상황이 겹치면 안 됩니다.**

- **my_line / partner_line:** 말하기·경청·속도·직설/완곡 등 **대화 방식**만, 각 1문장 (위 **말투** 규칙)
- **톤 참고:** "머릿속 정리 안 됐는데 말이 먼저 나가" / "말 끊기는 게 참기 어려워"
- **insights (2개):** 말하는 방식 차이에서 오는 **구체적** 인사이트 (감정 축과 다른 각도)
  - 예시 톤: "${nicknameA}은 정리 끝내고 말하는데, ${nicknameB}은 말하면서 머릿속이 정리돼서 대화 속도가 어긋날 수 있어"
- **actions (2개):** 대화 방식 맞추기용 **구체 행동**만
  - 예: "상대가 말할 때 3초만 기다렸다가 답해 봐"
  - 예: "중요한 얘기 전에 '잠깐만 정리하고 말할게' 라고 미리 말해 봐"

---

## 축 3: conflict_response (갈등·거리두기)

**감정·말하기 축에서 이미 쓴 표현·상황을 재사용 금지.**

- **my_line / partner_line:** 갈등이 났을 때 거리두기·직면·회피·정리 방식 등, 각 1문장 (위 **말투** 규칙)
- **톤 참고:** "말이 거칠어지면 바로 입 다물게 돼" / "감정 식으려면 혼자 있는 게 빨라져"
- **insights (2개):** 갈등 대처 **차이**에서 오는 인사이트 (다른 축과 겹치지 않게)
  - 예시 톤: "${nicknameA}은 맞부딪히기보다 한 박자 쉬고 싶은데, ${nicknameB}은 바로 말하고 싶어서 더 팽팽해질 수 있어"
- **actions (2개):** 갈등·거리두기에만 해당하는 구체 행동
  - 예: "화 올라오면 '10분만 혼자 정리할게' 라고 말하고 잠깐 자리 비워 봐"
  - 예: "진정되면 '우리 이거 한번만 정리할까?' 라고 먼저 말 걸어 봐"

---

## 축 4: energy_pattern (에너지·리듬)

**앞 세 축과 주제·문장이 겹치면 안 됩니다.**

- **my_line / partner_line:** 활동량·휴식·만남 빈도·혼자/함께 충전 등 **에너지 리듬**만, 각 1문장 (위 **말투** 규칙)
- **톤 참고:** "하루 종일 붙어 있으면 금방 지쳐" / "사람 만나야 오히려 기운 돌아와"
- **insights (2개):** 에너지·일정·휴식 리듬 차이 인사이트
  - 예시 톤: "${nicknameA}은 혼자서 쉬어야 회복되는데, ${nicknameB}은 같이 있을 때 힘이 나서 만남 길이가 자주 안 맞을 수 있어"
- **actions (2개):** 리듬 맞추기 **구체 행동**
  - 예: "오늘은 두 시간만 보고 헤어지는 건 어때?"
  - 예: "다음 만남 전엔 각자 혼자 쉴 시간 하루는 꼭 남기기로 약속해 봐"

---

## 금지 사항
- 같은 문장·거의 같은 문장을 여러 축에서 반복 금지
- "말은 달라도, 둘 다 자기 방식으로 맞추려는 쪽일 수 있어" 같은 **누구에게나 해당하는 일반론** 금지
- "좋을 것 같아요", "서로 이해하는 시간을 가져보세요" 같은 **모호·추상** 표현 금지
- **my_line·partner_line:** \`~하는 편이야\`, \`~타입이야\`, \`~인 편이야\` 금지 → **말투** 섹션 따르기
- **문장 끝 평어체 "~다"만으로 딱 끊기 금지** (~이다, ~한다 등). 직관체·구어체로 (\`~해\`, \`~돼\`, \`~지 않아\`, \`~게 돼\`, \`~거야\`, \`~봐\`, \`~줘\` 등)

---

## 출력 JSON (설명·마크다운·코드펜스 없이 이 구조만)

{
  "perspectives": {
    "${reportIdA}": {
      "emotional_sensitivity": {
        "my_nickname": "${nicknameA}",
        "partner_nickname": "${nicknameB}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "communication_style": {
        "my_nickname": "${nicknameA}",
        "partner_nickname": "${nicknameB}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "conflict_response": {
        "my_nickname": "${nicknameA}",
        "partner_nickname": "${nicknameB}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "energy_pattern": {
        "my_nickname": "${nicknameA}",
        "partner_nickname": "${nicknameB}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      }
    },
    "${reportIdB}": {
      "emotional_sensitivity": {
        "my_nickname": "${nicknameB}",
        "partner_nickname": "${nicknameA}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "communication_style": {
        "my_nickname": "${nicknameB}",
        "partner_nickname": "${nicknameA}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "conflict_response": {
        "my_nickname": "${nicknameB}",
        "partner_nickname": "${nicknameA}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      },
      "energy_pattern": {
        "my_nickname": "${nicknameB}",
        "partner_nickname": "${nicknameA}",
        "my_line": "",
        "partner_line": "",
        "insights": ["", ""],
        "actions": ["", ""]
      }
    }
  }
}

빈 문자열을 모두 채우되, 키 이름·JSON 구조·perspectives 키 두 개는 위와 동일하게 유지하세요.  
시점 "${reportIdB}"에서는 **반드시** my_nickname·partner_nickname·문장 속 나/상대가 시점 1과 반대로 쓰였는지 다시 확인하세요.

## JSON만 출력 (앞뒤 설명 금지)
`.trim();
}

export function buildRelationshipPremiumExtraBlock(
  mySaju: string,
  partnerSaju: string,
  myAstrology: string,
  partnerAstrology: string,
): string {
  return `
[추가 데이터 — 풀어서만 쓰고 "사주에 따르면" 같은 직접 인용은 피할 것]
- 나의 사주·기질: ${mySaju}
- 상대방의 사주·기질: ${partnerSaju}
- 나의 출생 맥락·점성 톤: ${myAstrology}
- 상대방의 출생 맥락·점성 톤: ${partnerAstrology}

## 심화 시 추가 규칙
- 위 데이터를 4축의 my_line·partner_line·insights·actions에 **자연스럽게만** 녹인다.
- **축마다 insights·actions 문구가 겹치지 않게** 유지한다 (기본 규칙과 동일).
- insights 각 항목은 필요하면 **최대 2~3문장**까지 허용 (여전히 "~다" 종결만으로 끝내지 않기).
- actions는 **실행 가능한 구체 행동 2개** 유지, 추상 표현 금지.
`.trim();
}
