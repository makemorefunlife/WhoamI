# Saju_Fast_Score_Architecture_v1

## 목적

아하잇츠미의 "본래의 나(Innate Self)" 분석을 위한 1차 엔진 설계 문서.

본 문서는 사용자의 출생정보를 기반으로 사주 원국을 계산하고, 이를 Human Framework의 상위 6축으로 빠르게 변환하는 구조를 정의한다.

무료 분석 단계에서는 LLM을 사용하지 않는다.

목표는:

```text
생년월일시 입력
↓
사주 계산
↓
6축 점수 산출
↓
무료 결과 제공
```

을 1~2초 이내에 완료하는 것이다.

---

# 핵심 원칙

## 원칙 1

만세력 계산과 해석을 분리한다.

```text
만세력 패키지
=
사주 원자료 계산

아하잇츠미 엔진
=
사주 원자료 해석
```

---

## 원칙 2

LLM은 계산하지 않는다.

LLM은 나중에 상세 리포트 작성에만 사용한다.

무료 분석에서는:

```text
사주 계산
+
규칙 기반 점수 계산
```

만 수행한다.

---

## 원칙 3

모든 사주는 Human Framework로 번역한다.

최종 출력은:

```text
자유성
관계성
안정성
도전성
통제성
유연성
```

이다.

---

# 전체 구조

```text
사용자 입력

↓

출생지 조회

↓

시간 보정

↓

만세력 계산

↓

NormalizedSaju 생성

↓

Fast Score Engine

↓

6축 결과
```

---

# 사용자 입력

사용자가 직접 입력하는 정보

```json
{
  "birthDate": "1988-01-01",
  "birthTime": "14:30",
  "birthCountry": "South Korea",
  "birthCity": "Seoul",
  "calendarType": "solar",
  "gender": "female"
}
```

---

## 출생시간 모름

```json
{
  "birthTimeUnknown": true
}
```

이 경우:

```text
시주 계산 제외

시주 기반 가중치 제거

정확도 안내 문구 표시
```

---

# 시스템 자동 생성 정보

사용자가 입력하지 않는다.

시스템이 자동 계산한다.

```text
latitude
longitude
timezone
timezoneOffset
dstApplied
standardMeridian
longitudeCorrection
equationOfTime
trueSolarTime
sajuCalculationTime
```

---

# 출생지 조회

사용자 입력:

```text
국가
도시
```

↓

시스템 조회

```text
위도
경도
타임존
```

예시:

```text
대한민국 서울

↓

37.5665
126.9780
Asia/Seoul
```

---

# 시간 보정 정책

아하잇츠미는 단순 한국시간 변환을 사용하지 않는다.

기본 원칙:

```text
출생지 현지시간 기준
+
경도 보정
+
서머타임 확인
+
균시차 보정
```

---

## 저장값

### localBirthDateTime

사용자가 입력한 출생지 현지시간

---

### utcBirthDateTime

UTC 기준 시간

---

### timezoneOffsetMinutes

실제 타임존 오프셋

---

### dstApplied

서머타임 적용 여부

---

### standardMeridian

해당 타임존 기준 경도

---

### longitudeCorrectionMinutes

경도 차이 보정

---

### equationOfTimeMinutes

균시차

---

### trueSolarTime

진태양시

---

### sajuCalculationTime

최종 사주 계산용 시간

---

# 만세력 계산 엔진

현재 채택 예정:

```text
@fullstackfamily/manseryeok

GitHub:
urstory/manseryeok-js

데이터:
한국천문연구원(KASI)

License:
MIT
```

---

# NormalizedSaju

만세력 결과를 그대로 사용하지 않는다.

서비스용 구조로 변환한다.

예시:

```json
{
  "dayMaster": "丁",

  "pillars": {
    "year": {},
    "month": {},
    "day": {},
    "hour": {}
  },

  "fiveElements": {},

  "tenGodsCount": {},

  "relations": {},

  "twelveStages": {},

  "voidBranches": [],

  "luckCycles": [],

  "birthTimeCorrection": {}
}
```

---

# Fast Score Engine

목적:

```text
사주 원국

↓

6축 점수
```

변환

---

## 출력

```json
{
  "freedom": 68,
  "relation": 62,
  "stability": 82,
  "challenge": 56,
  "control": 88,
  "flexibility": 43
}
```

---

# Human Framework 상위 6축

## 자유성

외부 기준보다 자기 기준을 우선하는 정도

---

## 관계성

사람과의 연결을 중요하게 여기는 정도

---

## 안정성

예측 가능성과 안전함을 선호하는 정도

---

## 도전성

새로운 경험과 변화를 추구하는 정도

---

## 통제성

계획과 자기조절을 중요하게 여기는 정도

---

## 유연성

예상 밖 상황에 적응하는 정도

---

# Fast Score 계산 대상

무료 분석에서는 아래 요소만 사용

## 일간

기본 기질

---

## 월지

계절 에너지

---

## 오행 분포

목화토금수 비율

---

## 십성 분포

비견
겁재
식신
상관
정재
편재
정관
편관
정인
편인

---

## 합충

원국 내 주요 합충만 반영

---

# Fast Score 계산 제외

아래는 상세 리포트에서 사용

```text
격국

용신

희신

기신

세운

월운

신살

세부 장간 분석
```

---

# 상세 분석 엔진과의 관계

무료 분석

```text
Fast Score Engine
```

사용

---

유료 분석

```text
Fast Score 결과

+

원국 전체

+

합충형파해

+

대운

+

용신

+

RAG

+

LLM
```

사용

---

# 향후 추가 문서

```text
Saju_Input_JSON_Schema.md

Saju_Human_Framework_Mapping.md

Saju_Fast_Score_Rules_v1.md

Saju_Deep_Analysis_Rules_v1.md

Saju_Interpretation_Prompt_v1.md
```

---

# 현재 단계 목표

현재 목표는:

```text
출생정보

↓

만세력

↓

NormalizedSaju

↓

6축 점수
```

를 안정적으로 계산하는 것이다.

사주 해석 문장 생성은 다음 단계에서 진행한다.
