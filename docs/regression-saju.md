# /api/saju 회귀 검증 가이드

이 문서는 `/api/saju` 리팩토링 이후 기능 불변을 확인하기 위한 회귀 검증 기준이다.

## 범위

- API 엔드포인트: `POST /api/saju`
- 연계 플로우:
  - `app/report/reportcontent.tsx`에서 호출하는 개인 리포트 흐름
  - `app/api/relationship/analyze/premium/route.ts`에서 호출하는 프리미엄 관계 분석 흐름

## 1) 수동 테스트용 POST payload

기본 요청:

- Method: `POST`
- URL: `/api/saju`
- Header: `Content-Type: application/json`

### 케이스 A: 기본 성공

```json
{
  "birthDate": "1993-08-21",
  "birthTime": "14:35",
  "birthPlace": "Seoul"
}
```

### 케이스 B: 저장 포함 성공 (reportId 포함)

```json
{
  "birthDate": "1988-02-02",
  "birthTime": "11:10",
  "birthPlace": "Busan",
  "reportId": "YOUR_EXISTING_REPORT_UUID"
}
```

### 케이스 C: birthPlace 없이 성공

```json
{
  "birthDate": "2000-01-01",
  "birthTime": "00:30"
}
```

## 2) 성공 응답 필수 필드

성공 시(`2xx`) 아래 필드가 반드시 존재해야 한다.

- `success` (boolean, `true`)
- `saju` (object)
  - `yearPillar` (string)
  - `monthPillar` (string)
  - `dayPillar` (string)
  - `hourPillar` (string)
- `dayStemData` (object 또는 null)
- `dayBranchData` (object 또는 null)
- `hiddenStemsData` (array, 최소 `[]`)
- `tenGods` (array, 기대 길이 4)
- `twelveStageData` (object 또는 null)
- `relations` (array, 원소는 최소 `type`, `interpretation` 포함)

회귀 관점 필수 확인:

- 키 이름 변경 없음
- `relations` 응답이 `type`/`interpretation` 중심으로 유지됨

## 3) 실패 케이스 payload

### 케이스 F1: `birthTime` 누락

```json
{
  "birthDate": "1993-08-21"
}
```

기대 결과:

- HTTP `400`
- 에러 JSON 반환

### 케이스 F2: `birthDate` 누락

```json
{
  "birthTime": "14:35"
}
```

기대 결과:

- HTTP `400`
- 에러 JSON 반환

### 케이스 F3: 필수값 빈 문자열

```json
{
  "birthDate": "",
  "birthTime": ""
}
```

기대 결과:

- HTTP `400`
- 에러 JSON 반환

### 케이스 F4: 비정상 형식(방어 확인)

```json
{
  "birthDate": "not-a-date",
  "birthTime": "99:99"
}
```

기대 결과:

- 서버 프로세스 크래시 없이 JSON 에러 응답 반환(보통 `500`)

## 4) 연계 체크포인트

## `reportcontent` 플로우

확인 대상: `app/report/reportcontent.tsx`

- 유료 + 출생정보 완성 조건에서 `/api/saju` 호출되는지
- `/api/saju` 성공 시:
  - 응답 JSON이 로컬 상태(`localSajuData`)로 저장되는지
  - 이후 통합 리포트 생성 흐름이 정상 진행되는지
- `/api/saju` 실패 시:
  - 화면이 멈추지 않고 실패 상태(`sajuStatus.ok=false`)로 처리되는지

## `premium analyze` 플로우

확인 대상: `app/api/relationship/analyze/premium/route.ts`

- 내부 `fetchSajuJson()`의 `/api/saju` 호출 성공 시 분석 텍스트 생성이 정상인지
- `/api/saju` 실패 시 `null` 처리로 degrade 되며, 프리미엄 분석 전체가 치명적으로 중단되지 않는지

## 5) 자동 테스트로 확장할 최소 계획

최소 4개 테스트 케이스부터 시작한다.

1. **성공 응답 스키마 테스트**
   - 입력: 케이스 A
   - 검증: status `200`, 필수 키 존재

2. **fallback 보장 테스트**
   - 규칙 조회 미존재 상황을 모킹
   - 검증:
     - `calculateTenGod` fallback = `"bigyeon"`
     - `calculateTwelveStage` fallback = `"byeong"`
     - `hiddenStemsData`는 배열

3. **필수값 누락 400 테스트**
   - 입력: 케이스 F1/F2
   - 검증: status `400`, 에러 JSON

4. **프리미엄 연계 스모크 테스트**
   - `relationship/analyze/premium`에서 `/api/saju` 성공/실패를 각각 모킹
   - 검증:
     - 성공 시 사주 데이터가 분석 컨텍스트에 반영됨
     - 실패 시도 프리미엄 분석 응답 자체는 치명적으로 깨지지 않음

## 회귀 기준 요약

- `/api/saju` 응답 JSON 키와 형태 유지
- fallback 값 유지 (`"bigyeon"`, `"byeong"`, `[]`)
- reportcontent/premium 연계 플로우 정상 동작
