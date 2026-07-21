# 006 — 공용 신호 레이어 통합 + Family/Romantic 확장 마스터 로드맵

**날짜:** 2026-07-20
**상태:** 계획 확정 — 실행 대기 (코드 변경 없음, 사용자 승인 후 Step 1부터 착수)

`005_compare-table-signal-layer-audit.md`(감사 결과)와 이후 논의를 근거로, family/romantic이 아직 와이어프레임을 안 끝낸 지금이 신호 레이어를 먼저 바로잡을 마지막 기회라는 판단 하에 세운 실행 순서. **원칙**: 한 번에 한 스텝, 매 스텝 끝나면 테스트/실측으로 검증 후 다음 스텝. 코드/카피/스키마는 각 스텝 실행 시점에만 건드리고, 도메인 간 범위는 격리.

---

## 트랙 구조

- **트랙 A (공용 신호):** primitive 계산 함수 신설. friend/work/marriage/family가 공통으로 쓸 계산 레이어.
- **트랙 B (family 신규):** family는 비교표·Part1-5 자체가 없어서, 트랙 A 일부 위에 **처음부터 올바르게** 짓는다.
- **트랙 C (기존 도메인 이관):** 이미 UI가 있는 friend/work/marriage를 트랙 A로 갈아탄다. 화면은 안 건드리고 내부 계산만 교체.
- **트랙 D (로맨틱):** 4개 도메인 전부 끝난 뒤 별도 착수(구조 자체가 LLM 기반이라 트랙 A/B/C와 무관, `004` 문서 참조).

---

## 실행 순서

### Step 1 — family 전용 primitive 2개 구현 (트랙 A 일부)
- 대상: `origin_family_tension`(marriage `analyzeFamilyBoundary` + family 3신호 통합), `parenting_style_lean`(family용 어댑터 신설)
- 작업: 신규 공용 함수 작성(기존 marriage/family 파일은 안 건드림, 순수 추가) + 두 기존 공식과 신규 공식을 실측·합성 데이터로 비교하는 진단 스크립트
- **결정 필요 지점:** 두 기존 공식 중 어느 걸 canonical로 할지(또는 재조합할지) — 비교 결과 들고 확인받음
- 완료 기준: 새 함수 유닛테스트 통과 + 비교 리포트 제출

### Step 2 — family 6행 비교표 설계 확정
- family는 현재 3-게이지 스냅샷만 있고 6행 비교표가 없음 — 어떤 6개 축을 넣을지 **새로 정의**해야 함(work/friend/marriage 패턴 참고: 사주 신호 기반, 서로 독립, 상대비교)
- **결정 필요 지점:** 축 후보 제시 → 확인받고 확정(콘텐츠 설계라 카피 방향도 같이 논의)
- 완료 기준: 6행 설계 문서화(신호 소스만, 카피는 다음 스텝)

### Step 3 — family 비교표 구현
- Step1 primitive + 기존 family raw 신호(필요한 나머지) 기반으로 `familySajuCompareTable.ts` 신규 작성
- 기존 3-게이지 로직(`familyEventScores.ts`)은 그대로 둠(범위 격리, 이번 스텝 대상 아님)
- 완료 기준: 유닛테스트(독립성·결정론성·콤보 전수) 통과

### Step 4 — family Part1-5 와이어프레임
- friend/marriage와 동일 패턴: ViewModel(`buildFamilyReportViewModel.ts`) + SectionRenderer + i18n(ko/en 동시)
- **결정 필요 지점:** Part1(어떤 서사?) 콘텐츠 방향
- 완료 기준: 렌더링 확인(React Hooks 규칙 준수 포함)

### Step 5 — family 전체 검증
- 실제 테스트 유저로 비교표 6행 독립성 진단 스크립트 실행 → 겹침 없는지 확인
- 완료 기준: 실측 결과 리포트, 필요시 threshold 조정

### Step 6 — friend 이관 (트랙 C)
- 로컬 `resolveDominantCategory`/`resolveRhythmBand`/`resolveFriendStrengthBand`(margin=1)를 트랙 A 공용 함수로 교체
- 완료 기준: 기존 회귀 테스트 통과, 결과값 변화 있으면 사유 기록

### Step 7 — marriage 이관 (트랙 C)
- 십신카테고리 → 공용 함수, 원가족바운더리 → Step1 통합 공식(family와 동일 공식 공유하게 됨), 육아성향 → family와 공유
- **밤의 리드 스타일 버그 수정** 별도 포함 — 이전에 설계만 제안한 "5대 카테고리 기반 재설계" 확정 후 적용
- **family punishment/karma 신호 반영 여부 결정** (2026-07-20 확정) — Step1에서 관찰용 primitive로만 노출해둔 `homePunishment`/`karmaTensionIndex`를 실제 threshold에 넣을지는 여기서 다음 6개를 확인한 뒤 결정한다. 그 전까지는 (a) 최종 bucket threshold에 미사용, (b) 사용자 문구에 비노출, (c) 다른 신호 가중치 불변 — 3원칙 유지.
  1. 실제 표본에서 값의 분포
  2. 특정 bucket 쏠림 여부
  3. 기존 family 결과와의 상관관계
  4. marriage 원가족 신호와의 일치·모순 사례
  5. 신호를 추가했을 때 실제 구분력이 개선되는지
  6. 결과 변화율과 회귀 범위
- 완료 기준: 기존 회귀 테스트 통과 + 밤의 리드 스타일 신규 테스트(전 십신 커버리지 확인) + 위 6항목 실측 리포트

### Step 8 — work 이관 (트랙 C)
- 십신카테고리 변형/일간양음간/오행 → 공용 함수, 신강신약 문자열 파싱 어댑터 제거
- **결정 필요 지점:** 신강신약 margin 통일이 work/romantic 실사용자 결과에 영향 — 진행 여부 재확인(family/marriage처럼 "테스트 전용" 확정이면 스킵 가능)
- 완료 기준: 기존 회귀 테스트 통과

### Step 9 — 로컬 중복 계산 제거 (Phase 4)
- Step6~8에서 이관 끝난 도메인들의 옛 로컬 함수 바디 삭제(grep으로 미사용 확인 후)
- 완료 기준: 삭제 후 전체 테스트 재통과

### Step 10 — 회귀 테스트 + 캐시/schema 호환성 검증 (Phase 5)
- 새 필드가 없는 구 캐시(`person_core_blueprints.saju_master_json`) row에 대한 폴백 동작 확인
- 완료 기준: 전체 도메인 테스트 스위트 + 구 캐시 시뮬레이션 테스트 통과

### Step 11 — 로맨틱 착수 (트랙 D, 별도)
- 004 문서의 미결 사안(규칙엔진에 PersonCore 관통 vs 현행 유지)부터 재논의
- Step1~10과 독립적으로 진행 가능, 우선순위는 4개 도메인 완료 후

---

## 진행 로그
- 2026-07-20: 로드맵 확정, 실행 대기.
