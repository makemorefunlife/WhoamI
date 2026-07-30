# 032 — Narrative Style Bible 이원화 해소 (05N v2.0 병합)

**날짜:** 2026-07-27  
**상태:** 확정 · 병합 완료  
**범위:**
- `docs/product/05N_Ahaitsme_Narrative_Style_Bible.md` (v1.0 → v2.0)
- `docs/dev/05_NARRATIVE_STYLE_BIBLE.md` (Invariant Core Rev. 7 → superseded pointer)
- 인용처: `01_Product_Vision.md`, `02_Relationship-ux-bible.md`, `05B_Friend_Product_Blueprint.md`, `05D_Family_Product_Blueprint.md`, `06B_Friend_Technical_Blueprint.md`, `07A_Romantic_Implementation_Checklist.md`, `docs/product/README.md`, `09_Product_and_Design_Intent_Package.md` §6.3/§7, `10_Design_IA_Canonicalization_Refactor_Plan.md`  
**비범위:** 각 도메인 Product Blueprint(`05A`–`05E`)에 남아있는 로컬 tone/voice 절 자체의 제거(별도 정리 과제로 `10`에 계속 추적)

---

## 배경

두 개의 문서가 동시에 "Narrative Style Bible" 권위를 주장하고 있었다:

1. `docs/product/05N_Ahaitsme_Narrative_Style_Bible.md` (v1.0) — 내레이터 정체성, 미션, 유머/은유/이중언어 정책, QA 루브릭(Q1–Q15), 사람이 읽는 편집 리뷰 절차를 포함한 프로즈 중심 문서.
2. `docs/dev/05_NARRATIVE_STYLE_BIBLE.md` ("Invariant Core" Rev. 7) — 도메인별 register dial/band, 주소 지정 법칙(Address Law), 근거-심각도 상한 매트릭스, 어휘 통제 시스템(Lexicon)을 포함한 훨씬 더 기계적으로 검증 가능한 규칙 문서.

`docs/product/README.md`, `09` §6.3, `10` §1.2/§10.1이 이미 이 이원화를 "가장 위험도가 높은 문서 잔재"로 표시해 두었고, 5개 도메인 Product Blueprint(`05A`–`05E`) 감사 결과 모두 독립적으로 동일한 증상을 보고했다: 각 블루프린트가 공유 문서를 인용하는 대신 자체 tone/voice 절을 반복 정의하고 있었다.

## 선택지

### A. 하나를 폐기하고 다른 하나만 유지

가장 단순하지만, 두 문서 모두 서로에게 없는 실질적 내용을 갖고 있어 폐기 쪽의 내용이 통째로 유실된다 (`05N`에만 있던 유머 예산·은유 정책·이중언어 로케일 규칙, 또는 Invariant Core에만 있던 register band·심각도 상한·어휘 통제 시스템).

### B. 두 문서를 물리적으로 병합해 `docs/product/05N_…` v2.0 하나로 통일

`docs/product/README.md`의 거버닝 순서(`05N`이 `docs/product` 트리의 정식 위치)를 따르되, Invariant Core의 상위 기술 장치(§15 Register Band, §16 Lexicon, §5.3 심각도×근거 상한표, §20.2 Golden Examples)를 `05N`의 온보딩 친화적 산문 구조 안에 절로 흡수한다. `docs/dev/05_NARRATIVE_STYLE_BIBLE.md`는 매핑 표를 포함한 superseded pointer로 축소.

---

## 결정

**선택:** B.

**이유:** 두 문서는 서로 대체 관계가 아니라 다른 고도(altitude)에서 같은 대상을 다루고 있었다 — v1.0은 사람이 읽고 내면화하기 좋은 미션/온보딩 문서, Invariant Core는 리뷰어가 문단 단위로 기계적으로 검증할 수 있는 규칙 문서. 병합이 두 강점을 모두 보존하는 유일한 방법이며, 폐기 쪽 어느 것을 고르든 실제로 쓰이고 있는 법칙(예: Work 문서의 humor 최저 밴드, Romantic 문서의 severity 상한표)이 조용히 사라진다.

---

## 영향

- **바뀌는 것:**
  - `docs/product/05N_Ahaitsme_Narrative_Style_Bible.md`가 v2.0으로 전면 개정 — Domain Register Bands(§15), Lexicon and Terminology Control(§16), 심각도×근거 상한표(§5.3), Domain Golden Examples(§20.2) 신설.
  - `docs/dev/05_NARRATIVE_STYLE_BIBLE.md`는 내용이 제거되고 매핑 표를 포함한 superseded pointer로 대체.
  - `01`, `02`, `05B`, `05D`, `06B`, `07A`의 인용이 모두 `05N`을 직접 가리키도록 수정.
  - `docs/product/README.md`, `09` §6.3/§7, `10`(§0.0/§1.1/§1.2/§1.3/§7/§10.1/§10.2/§10.6)의 관련 항목이 `[UNRESOLVED]` → 해결됨으로 갱신.
- **안 바뀌는 것:**
  - 두 원본 문서 어디에도 있던 실질적 규칙(narrative law)은 하나도 약화되거나 제거되지 않음 — 모두 `05N` v2.0 안에 그대로 존재.
  - 각 도메인 Product Blueprint(`05A`–`05E`)가 로컬 tone/voice 절을 여전히 중복 보유하고 있는 문제는 이번 결정의 범위 밖이며, `10`의 기존 정리 로드맵을 통해 점진적으로 해소되어야 함.
  - Style Bible 자체의 내용(narrative law)에 대한 개정은 아님 — 순수히 문서 소유권/위치 통합.

---

## 관련

- `docs/product/README.md` §1 (`05N_Ahaitsme_Narrative_Style_Bible.md` 항목)
- `docs/product/09_Product_and_Design_Intent_Package.md` §6.3, §7.7
- `docs/product/10_Design_IA_Canonicalization_Refactor_Plan.md` §1.2, §10.1
