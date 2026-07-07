# 002 — Prompt 파이프라인 v1 아키텍처 확정

**날짜:** 2026-06-25  
**상태:** 확정

---

## 배경

계산·해석·리포트·UI가 한곳에 섞이면 수정 시 context가 흐려지고 AI·개발자 모두 어느 파일을 고쳐야 할지 불명확했다.

---

## 결정

**v1 아키텍처로 확정:**

* Prompt 체인: `00 → 01 → 02 → 03A → 03B → 03C → 03D → 03E`
* 판단 기준: "중복 없음"보다 **"파일당 책임 하나"** (Single Responsibility)
* 정본 문서: `docs/guide/10_Pipeline_Architecture_v1.md`

---

## 영향

* `08_Master_Logic_Map.md` — 파일 상태 트래킹 (파이프라인 상세는 10 참조)
* Phase D~E — 03B~03E 초안 파일명·역할 정렬
* 다음 Schema 작업 — `05`에 `deep_pattern` 등 객체 추가

---

## 보류 / 이후

* `08_Self_Analysis_Signal_Mapping` — 03B·03C **참조 규칙서** (Runtime 중간 단계 아님)
* 사주 `01`/`02` 파일명 정리 — v1.1
* 구조 뒤집기 가능성: **낮음** — Prompt·문장 품질 튜닝 위주로 진행

---

## 관련

* [10_Pipeline_Architecture_v1.md](../../guide/10_Pipeline_Architecture_v1.md)
* Daily: [2026-06-25.md](../daily/2026-06-25.md)
