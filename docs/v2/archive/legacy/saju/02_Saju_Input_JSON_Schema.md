# 02_Saju_Input_JSON_Schema

## 목적

이 문서는 아하잇츠미의 사주 분석 엔진에서 사용할 입력 데이터 구조를 정의한다.

목표는 사용자가 입력한 출생정보를 바탕으로, 만세력 계산과 6축 Fast Score 계산에 사용할 수 있는 표준 JSON 구조를 만드는 것이다.

이 문서는 다음 단계의 기준이 된다.

```text
사용자 입력
↓
출생지 자동 조회
↓
출생시간 보정
↓
만세력 계산
↓
NormalizedSaju JSON 생성
↓
6축 Fast Score 계산
```

---

# 1. 사용자 입력값

사용자가 직접 입력하는 값은 최소화한다.

사용자가 직접 입력하는 값:

```json
{
  "birthDate": "1988-01-01",
  "birthTime": "14:30",
  "birthTimeUnknown": false,
  "birthCountry": "South Korea",
  "birthCity": "Seoul",
  "calendarType": "solar",
  "gender": "female"
}
```

---

## 필드 설명

### birthDate

출생일.

형식:

```text
YYYY-MM-DD
```

예시:

```text
1988-01-01
```

---

### birthTime

출생시간.

형식:

```text
HH:mm
```

예시:

```text
14:30
```

출생시간을 모르는 경우 `null`로 저장한다.

---

### birthTimeUnknown

출생시간 모름 여부.

```json
{
  "birthTimeUnknown": true
}
```

출생시간을 모르는 경우:

```text
시주 계산 제외
시주 기반 점수 제외
결과에 정확도 안내 문구 표시
```

---

### birthCountry

출생 국가.

예시:

```text
South Korea
United States
Japan
Canada
```

---

### birthCity

출생 도시.

예시:

```text
Seoul
New York
Tokyo
Vancouver
```

---

### calendarType

양력 / 음력 여부.

허용값:

```text
solar
lunar
```

MVP 기본값:

```text
solar
```

---

### gender

성별.

허용값:

```text
female
male
unknown
```

성별은 대운 방향, 일부 전통 해석 로직에서 사용할 수 있으나, 무료 6축 Fast Score에서는 직접적인 핵심 점수 요소로 사용하지 않는다.

---

# 2. 시스템 자동 생성값

사용자가 직접 입력하지 않는다.

출생국가와 출생도시를 기준으로 시스템이 자동 계산한다.

```json
{
  "geo": {
    "latitude": 37.5665,
    "longitude": 126.9780,
    "timezone": "Asia/Seoul",
    "timezoneSource": "geocoding"
  }
}
```

---

## geo.latitude

출생지 위도.

사용자 입력값이 아니라 시스템 조회값이다.

---

## geo.longitude

출생지 경도.

사용자 입력값이 아니라 시스템 조회값이다.

---

## geo.timezone

출생지의 IANA timezone.

예시:

```text
Asia/Seoul
America/New_York
Europe/London
Asia/Tokyo
```

---

## geo.timezoneSource

타임존 조회 출처.

예시:

```text
geocoding
manual_admin_override
cached_city_database
```

---

# 3. 출생시간 보정값

출생시간 보정 결과는 별도 객체로 저장한다.

```json
{
  "birthTimeCorrection": {
    "localBirthDateTime": "1988-01-01T14:30:00",
    "utcBirthDateTime": "1988-01-01T05:30:00Z",
    "timezoneOffsetMinutes": 540,
    "dstApplied": false,
    "standardMeridian": 135,
    "longitudeCorrectionMinutes": -32.09,
    "equationOfTimeMinutes": -3.5,
    "trueSolarTime": "1988-01-01T13:54:25",
    "sajuCalculationTime": "1988-01-01T13:54:25",
    "correctionMethod": "local_true_solar_time"
  }
}
```

---

## localBirthDateTime

사용자가 입력한 출생지 현지시간.

---

## utcBirthDateTime

UTC 기준 출생시간.

---

## timezoneOffsetMinutes

해당 날짜, 해당 출생지의 실제 타임존 오프셋.

서머타임이 적용된 경우 그 값까지 반영한다.

---

## dstApplied

해당 출생일에 서머타임이 적용되었는지 여부.

---

## standardMeridian

해당 타임존의 기준 경도.

계산 예시:

```text
timezoneOffsetHours × 15
```

예:

```text
UTC+9 → 135도
UTC-5 → -75도
```

---

## longitudeCorrectionMinutes

출생지 실제 경도와 표준 경도의 차이 보정값.

계산 개념:

```text
longitudeCorrectionMinutes = (actualLongitude - standardMeridian) × 4
```

경도 1도 차이는 약 4분 차이로 본다.

---

## equationOfTimeMinutes

균시차 보정값.

날짜에 따라 실제 태양시와 평균 태양시 사이의 차이를 보정한다.

MVP에서는 계산 라이브러리 또는 근사식을 사용하고, 계산 출처를 기록한다.

---

## trueSolarTime

경도 보정과 균시차를 반영한 진태양시.

---

## sajuCalculationTime

만세력 계산에 최종적으로 사용할 시간.

MVP 정책:

```text
출생지 현지시간을 기준으로 한다.
해외 출생자는 한국 시간으로 단순 변환하지 않는다.
경도, 서머타임, 균시차 보정값을 반영한 sajuCalculationTime을 사용한다.
```

---

## correctionMethod

시간 보정 방식.

허용값 예시:

```text
local_time_only
local_with_timezone
local_true_solar_time
manual_override
```

MVP 권장값:

```text
local_true_solar_time
```

---

# 4. 만세력 계산 결과 원본

`@fullstackfamily/manseryeok`의 계산 결과는 원본 그대로 저장할 수 있다.

단, UI와 점수 계산에는 원본을 직접 사용하지 않는다.

```json
{
  "rawManseryeok": {
    "provider": "@fullstackfamily/manseryeok",
    "version": "unknown",
    "dataSource": "KASI",
    "result": {}
  }
}
```

---

# 5. NormalizedSaju JSON

아하잇츠미 내부 엔진은 반드시 정규화된 구조를 사용한다.

```json
{
  "normalizedSaju": {
    "dayMaster": "丁",
    "pillars": {
      "year": {
        "stem": "丁",
        "branch": "卯",
        "tenGodStem": "比肩",
        "tenGodBranch": "偏印",
        "hiddenStems": ["甲", "乙"],
        "twelveStage": "病"
      },
      "month": {
        "stem": "癸",
        "branch": "丑",
        "tenGodStem": "偏官",
        "tenGodBranch": "食神",
        "hiddenStems": ["癸", "辛", "己"],
        "twelveStage": "墓"
      },
      "day": {
        "stem": "丁",
        "branch": "亥",
        "tenGodStem": "本元",
        "tenGodBranch": "正官",
        "hiddenStems": ["戊", "甲", "壬"],
        "twelveStage": "胎"
      },
      "hour": {
        "stem": "乙",
        "branch": "巳",
        "tenGodStem": "偏印",
        "tenGodBranch": "劫財",
        "hiddenStems": ["戊", "庚", "丙"],
        "twelveStage": "帝旺"
      }
    },
    "fiveElements": {
      "wood": 0,
      "fire": 0,
      "earth": 0,
      "metal": 0,
      "water": 0
    },
    "tenGodsCount": {
      "比肩": 0,
      "劫財": 0,
      "食神": 0,
      "傷官": 0,
      "正財": 0,
      "偏財": 0,
      "正官": 0,
      "偏官": 0,
      "正印": 0,
      "偏印": 0
    },
    "relations": {
      "stemClashes": [],
      "branchClashes": [],
      "combinations": [],
      "punishments": [],
      "harms": [],
      "breaks": []
    },
    "voidBranches": [],
    "luckCycles": []
  }
}
```

---

# 6. Fast Score 입력 구조

6축 Fast Score Engine은 아래 구조만 입력받는다.

```json
{
  "dayMaster": "丁",
  "monthBranch": "丑",
  "pillars": {},
  "fiveElements": {},
  "tenGodsCount": {},
  "relations": {},
  "birthTimeUnknown": false
}
```

Fast Score는 LLM을 호출하지 않는다.

---

# 7. Fast Score 출력 구조

```json
{
  "scores": {
    "freedom": 68,
    "relation": 62,
    "stability": 82,
    "challenge": 56,
    "control": 88,
    "flexibility": 43
  },
  "debugReasons": [
    {
      "source": "tenGods",
      "rule": "正官 strong",
      "effects": {
        "stability": 10,
        "control": 10,
        "flexibility": -6
      }
    },
    {
      "source": "relations",
      "rule": "multiple clashes",
      "effects": {
        "challenge": 4,
        "control": 4,
        "flexibility": -8,
        "stability": -3
      }
    }
  ],
  "confidence": {
    "level": "medium",
    "reasons": [
      "birth time provided",
      "geo data resolved",
      "true solar time calculated"
    ]
  }
}
```

---

# 8. 출생시간 모름일 때 처리

출생시간이 없으면:

```text
hour pillar = null
hour-based ten gods excluded
hour-based hidden stems excluded
hour-based relations excluded
```

confidence는 낮아진다.

```json
{
  "confidence": {
    "level": "low",
    "reasons": [
      "birth time unknown",
      "hour pillar excluded"
    ]
  }
}
```

사용자에게는 다음과 같이 안내한다.

```text
출생시간이 없어 일부 분석 정확도가 낮아질 수 있습니다.
다만 년주, 월주, 일주 기준의 큰 성향 흐름은 확인할 수 있습니다.
```

---

# 9. 설계 원칙

1. 사용자는 위도와 경도를 입력하지 않는다.
2. 위도, 경도, 타임존은 시스템이 자동 조회한다.
3. 해외 출생자는 한국 시간으로 단순 변환하지 않는다.
4. 출생지 현지시간을 기준으로 보정한다.
5. 보정값은 모두 저장한다.
6. 만세력 원본과 서비스용 JSON은 분리한다.
7. Fast Score는 LLM 없이 계산한다.
8. 같은 입력은 항상 같은 결과를 반환해야 한다.
9. 모든 점수 계산 근거는 debugReasons에 남긴다.
10. 상세 리포트는 Fast Score 이후 별도 엔진에서 처리한다.
