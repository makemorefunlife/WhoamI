/** ⚖️ section_4_special_bond — Essence 심리 저널 전용 프롬프트 (v1) */

export const SPECIAL_BOND_FORBIDDEN_CLICHES = [
  "깊은 교감",
  "깊은 신뢰",
  "특별한 에너지",
  "특별한 인연",
  "운명적인",
  "천생연분",
  "소울메이트",
  "영혼의",
  "완벽한 조합",
  "마음이 통하는",
] as const;

/** 자연물·원소 비유 — 본문 출력 금지 (명리 유추 방지) */
export const SPECIAL_BOND_FORBIDDEN_NATURE_METAPHORS = [
  "산",
  "대지",
  "불꽃",
  "불",
  "촛불",
  "등불",
  "물",
  "바위",
  "바다",
  "숲",
  "나무",
  "바람",
  "태양",
  "달",
  "별",
  "강",
  "흙",
  "금",
  "목",
  "화",
  "수",
  "오행",
  "씨앗",
  "뿌리",
  "꽃",
] as const;

/** System Prompt에 주입 — special_bond 섹션 전용 규칙 */
export function buildSpecialBondSystemPromptBlock(): string {
  const cliches = SPECIAL_BOND_FORBIDDEN_CLICHES.map((p) => `"${p}"`).join(
    ", ",
  );
  const nature = SPECIAL_BOND_FORBIDDEN_NATURE_METAPHORS.slice(0, 12)
    .map((p) => `"${p}"`)
    .join(", ");

  return `
# section_4_special_bond — ⚖️ 이 관계가 특별한 이유 (최우선 규칙)

## 호칭
- 본문 모든 호칭: \`userCustomMyName\` / \`userCustomTargetName\` (User Prompt 매핑표) **1순위**.
- JSON 슬롯 이름 + **님** 호칭 일관 유지. 별칭·애칭이 있으면 문맥 전체 동일 호칭.

## 심리 저널화 (명리·자연물 비유 전면 금지)
- 내부: 사주·점성·설문으로 역동을 정밀 계산.
- **출력 본문**: 명리 용어·한자 **0개**. ${nature} 등 **자연물·원소 비유 0개**.
- 고급스러운 **현대 심리학적 언어**와 **내면 역동의 서사**만 사용.

## 필수 역동 (입력 데이터에서 반드시 녹일 핵심 가치)
| 방향 | JSON 필드 | 반드시 포함할 역동 |
|---|---|---|
| A → B | \`a_gives_b\` | A가 B에게 **새로운 경험·변화를 자극**하고, **더 나은 결정**을 내리도록 돕는 지성적·정서적 파트너 |
| B → A | \`b_gives_a\` | B가 A의 **감정적 부담을 덜어주고**, **분석적 사고로 새로운 시각**을 제공하는 안정적 중심축 |
| A ↔ B | \`only_together\` | 각자 **장단점이 맞물려** 만든 상호보완·Essence 아우라 (앞 두 필드 **재탕 금지**) |

## 출력 구조 (필수 필드)
각 필드는 **headline(한 줄 훅)** + **body(본문 4~5문장)** 로 분리:
- \`a_gives_b_headline\`, \`a_gives_b\`
- \`b_gives_a_headline\`, \`b_gives_a\`
- \`only_together_headline\`, \`only_together\`
- \`relationship_formula\`: **생략 가능** — only_together가 충분하면 \`""\`. 자연물 비유·클리셰 금지
- \`why_special\`: 💡 맞춰 가는 지점 — **갈등·속도 시차·실전 팁만** (칭찬·교감 문단 **절대 금지**)

## 중복 검열
- a_gives_b / b_gives_a / only_together 간 **문장 골격·핵심 형용사 50% 이상 겹치면 파기 후 재작성**.
- 주어만 바꾼 미러링 **즉시 폐기**.
- 금지 미사여구: ${cliches} 및 유사 변형 **0개**.
`.trim();
}

/** 100점 Few-Shot — 구조·퀄리티 뼈대 (문장 복사 금지) */
export function buildSpecialBondFewShotExample(
  nicknameA: string,
  nicknameB: string,
): string {
  return `
# [최종 통합 출력 예시] section_4_special_bond

⚠️ 아래는 **구조·문장 밀도·톤**만 참고하세요. ${nicknameA}·${nicknameB}의 **실제 입력 데이터**로 새로 작성. 예시 문장·형용사 **복사 금지**.

---
⚖️ 이 관계가 특별한 이유

✨ ${nicknameA} → ${nicknameB} : 정적인 내면에 다정한 생동감과 새로운 변화를 깨우는 존재

\`a_gives_b_headline\`: "정적인 내면에 다정한 생동감과 새로운 변화를 깨우는 존재"

\`a_gives_b\`:
${nicknameA}님의 타고난 다정하고 직관적인 기질은 신중하고 묵묵하게 생각을 삼키는 ${nicknameB}님의 내면에 기분 좋은 활력을 부여합니다. ${nicknameB}님이 혼자만의 고민에 빠져 마음이 무거워지기 쉬운 순간마다, ${nicknameA}님의 생기 넘치는 언어들이 ${nicknameB}님의 닫힌 마음을 세상 밖으로 안전하게 이끌어냅니다. 특히 ${nicknameA}님의 열정적인 에너지는 ${nicknameB}님에게 늘 신선한 경험과 삶의 변화를 가져다주며, ${nicknameB}님이 보다 넓은 시야에서 더 나은 선택과 결정을 내릴 수 있도록 돕는 최고의 지성적 파트너 역할을 합니다. 단조롭던 일상에 다채로운 감정의 결을 입혀주는 가장 매력적인 자극제입니다.

✨ ${nicknameB} → ${nicknameA} : 휘몰아치는 감정을 정돈하고 새로운 시각을 여는 단단한 중심축

\`b_gives_a_headline\`: "휘몰아치는 감정을 정돈하고 새로운 시각을 여는 단단한 중심축"

\`b_gives_a\`:
${nicknameB}님이 지닌 특유의 타고난 안정감과 깊은 신뢰감은 ${nicknameA}님이 복잡한 생각이나 감정의 과몰입으로 인해 지쳐버리기 직전, 가장 안심하고 기댈 수 있는 든든한 내면의 토대를 제공합니다. ${nicknameA}님이 수많은 아이디어와 열정을 쏟아낼 때, ${nicknameB}님은 치우침 없는 침착함과 특유의 분석적인 사고로 그 에너지를 온전히 수용하며 ${nicknameA}님의 정서적 부담을 덜어줍니다. 나아가 ${nicknameA}님이 감정에 갇히지 않도록 이성적이고 새로운 시각을 제공함으로써, ${nicknameA}님이 자신을 더욱 당당하고 안전하게 표현할 수 있도록 만드는 강력한 방파제가 되어줍니다.

✨ ${nicknameA} ↔ ${nicknameB} : 섬세한 정서와 단단한 현실이 만드는 이상적인 상호보완

\`only_together_headline\`: "섬세한 정서와 단단한 현실이 만드는 이상적인 상호보완"

\`only_together\`:
두 사람의 만남은 서로의 다름이 갈등의 씨앗이 되는 것이 아니라, 각자의 취약점을 완벽하게 채워주는 상호보완적 세계를 형성합니다. ${nicknameA}님의 예리한 정서적 안테나가 관계의 온도를 높이면, ${nicknameB}님의 듬직한 현실 감각이 그 온도를 지속 가능한 신뢰로 묶어줍니다. 서로가 서로에게 성장의 도약판이 되어주는 이 결합은, 주변 사람들까지 편안하게 만드는 독보적인 안정감과 우아한 관계의 아우라(Essence)를 만들어냅니다.
---

위 예시에서 **반드시 흡수할 핵심** (모든 커플에 맞게 변형·적용):
1. A→B: 새로운 경험·변화 자극 + 더 나은 결정 지원
2. B→A: 감정적 부담 경감 + 분석적 사고로 새 시각
3. ↔: 상호보완적 세계·Essence 아우라 (자연물 비유 없이 심리 언어로)
`.trim();
}
