# Romantic Headline Engine — English Copy

원문 구조를 그대로 따라가되, 영어는 조사(와/과) 로직이 필요 없으므로 결합 로직은 단순히
`${a} and ${b}` 형태로 통일합니다. (아래 "구조적으로 단순해지는 부분" 참고)

---

## 1. DAY_STEM_ROMANTIC_PROFILES (10개)

| 천간 키 | image | essence | inLove | headlineLabel |
|---|---|---|---|---|
| `gap` | Tall Tree | growing steady and strong | a root that keeps you grounded | steadfast tall tree |
| `eul` | Flower | softly taking root | fills the space with small kindnesses | delicate flower |
| `byeong` | Sun | shining bright | lights up everything around them | radiant sun |
| `jeong` | Candle | a steady, warm glow | warmth that lights up the heart | warm candle |
| `mu` | Mountain | solid and reassuring | a steady shelter from the wind | steadfast mountain |
| `gi` | Field | warmly holding everything | quietly supports everyday life | wide open field |
| `gyeong` | Steel | firm and clear | steadies you when you waver | unbending steel |
| `sin` | Gem | delicate and gleaming | notices even the smallest signal | polished gem |
| `im` | Deep River | flowing deep and wide | holds the full depth of your feelings | deep river |
| `gye` | Stream | quietly seeping in | understands without needing words | gentle stream |

### 보조 상수 영문판

```
ELEMENT_PAIR_CLOSER_EN = {
  "wood→fire": "One nurtures, and the other catches fire.",
  "fire→earth": "One lights things up, the other becomes a steady shelter.",
  "earth→metal": "Value shines longest when it rests on solid ground.",
  "metal→water": "A cool edge softens in a gentle current.",
  "water→wood": "One waters the heart, and new growth follows.",
}

DEFAULT_SANGSAENG_CLOSER_EN = "Your core natures grow each other, quite naturally."
DEFAULT_SANGGEUK_CLOSER_EN = "You push against each other — and that friction can be where growth starts."
DEFAULT_SAME_ELEMENT_CLOSER_EN = "Similar natures make it easy to relate — though your stubborn streaks can collide too."

ROMANTIC_ESSENCE_FALLBACK_EN = "warm and open"
```

### body 조합 템플릿 영문판

```
// opener
closeRelationship ? "In close moments," : "When you're together,"

// 상생: `${opener} ${pair} ${closer}`
// 상극/같은기운: 동일 패턴, closer만 SANGGEUK/SAME_ELEMENT 상수로 교체
// fallback: `${opener} ${pair} fill the relationship with each other's different strengths.`

// formatRomanticEssencePair (EN)
// a = `${profile.essence} ${nickname}` → 영어 어순 주의: `${nickname}, ${profile.essence}`
//   예: "Sera, growing steady and strong" (한국어는 형용사가 앞, 영어는 이름 먼저 + 콤마+ 묘사가 더 자연스러움)
```

---

## 2. HEADLINE_RULES (5개)

| ruleId | 한국어 headline | 영문 headline |
|---|---|---|
| `headline_tension_day_cross` | 가까울수록 예민해지는 조합 | **Closeness that turns sharp** |
| `headline_day_stem_sangsaeng` | (동적 조합) | (동적 조합, 아래 결합 로직 참고) |
| `headline_yukhap_pull` | 끌리는데 이유가 있는 관계 | **There's a reason you're drawn together** |
| `headline_strength_complement` | (동적 조합) | (동적 조합) |
| `headline_metaphor_default` | (동적 조합) | (동적 조합) |

### body 템플릿 (고정 문구가 들어가는 것만)

- Rule 5 default body 접미사: `"가 만나 서로 다른 리듬을 채워요."` → **"come together, filling in each other's rhythm."**
  - 전체 예: `${A} and ${B} come together, filling in each other's rhythm.`

---

## 3. crossHeadline() 전체

| 조건 | 한국어 | 영문 |
|---|---|---|
| `육합` | 끌리는 조합 | **A magnetic pull** |
| `충` | 예민해지는 지점 | **Where it gets sensitive** |
| `TENSION_CROSS` (형/해/파) | 부딪히는 지점 | **Where you clash** |
| `POSITIVE_CROSS` (천간합/삼합/방합) | 잘 맞는 조합 | **A natural fit** |
| 그 외 | 서로 다른 리듬 | **Different rhythms** |

---

## 4. 결합 함수 — 구조적으로 단순해지는 부분

한국어는 `waGwaAfter`(받침 유무로 "와"/"과" 선택), `joinPersonalityHeadline`(끝글자 모음 유무로 "와"/"과" 선택) 두 개의 서로 다른 조사 판정 로직이 필요했지만, **영어는 이 로직 자체가 필요 없습니다.**

```typescript
// EN에서는 두 함수 모두 아래 하나로 대체 가능 (조사 판정 로직 삭제)
export function joinHeadlineLabelsEn(labelA: string, labelB: string): string {
  return `${labelA} and ${labelB}`;
}
```

`romanticHeadlineFromProfiles`, `joinPersonalityHeadline` 둘 다 locale이 `en`이면 이 함수로 라우팅하면 됩니다. 한국어 전용 조사 함수(`waGwaAfter`, `hasBatchimKorean`)는 `en` 분기에서 아예 호출되지 않아야 합니다.

예시: `"warm candle"` + `"steadfast mountain"` → **"warm candle and steadfast mountain"**

---

## Cursor에 그대로 넘길 프롬프트

```
lib/relationship/dayStemRomanticProfile.ts, lib/relationship/romanticRules/headlineRules.ts,
lib/relationship/romanticHeadline/buildInsightPool.ts, lib/relationship/romanticEverydayText.ts
에 locale 분기를 추가해줘. 콘텐츠는 아래 @ROMANTIC_HEADLINE_EN.md 파일 내용을 그대로 써줘
(내가 직접 작성한 영문 카피이니 의역하거나 바꾸지 마).

1. DAY_STEM_ROMANTIC_PROFILES를 DAY_STEM_ROMANTIC_PROFILES_KO로 이름 변경(기존 유지)하고,
   동일 구조의 DAY_STEM_ROMANTIC_PROFILES_EN을 문서의 표 그대로 추가해줘.
   locale에 따라 선택하는 getDayStemProfiles(locale) 함수를 만들어줘.

2. ELEMENT_PAIR_CLOSER, DEFAULT_SANGSAENG_CLOSER 등 보조 상수도 동일하게 _KO/_EN으로 분리해줘.

3. HEADLINE_RULES의 고정 headline 문자열(headline_tension_day_cross, headline_yukhap_pull)을
   locale 분기하도록 수정해줘. 동적 조합(headline_day_stem_sangsaeng 등)은 아래 4번의
   결합 함수가 locale을 따라가면 자동으로 해결돼.

4. romanticHeadlineFromProfiles, joinPersonalityHeadline에 locale 파라미터를 추가해줘.
   locale === 'en'이면 문서의 joinHeadlineLabelsEn 로직(단순 " and " 결합, 조사 판정 로직 없음)을 쓰고,
   locale === 'ko'(기본값)면 기존 waGwaAfter 로직을 그대로 써줘.

5. crossHeadline()도 locale 분기로 문서의 표 그대로 반영해줘.

6. formatRomanticEssencePair도 영어일 때 어순을 `${nickname}, ${profile.essence}` 형태로
   바꿔줘 (한국어는 형용사가 명사 앞, 영어는 이름 먼저 + 콤마 + 묘사가 자연스러움).

이 모든 locale 배선은 이미 만들어둔 romanticSajuDeep의 locale 파라미터를 그대로 타고 내려오게
연결해줘 (buildRomanticRulesBundle, buildRomanticHeadlineContext 시그니처에 locale 추가).

변경 후 language 생략 시(기존 한국어 호출) 결과가 예전과 100% 동일한지 회귀 확인해줘.
CHANGELOG.md에 3줄 요약 추가해줘.
```
