# 01_Core_User_Flow

## Purpose

Ahaitsme v2 **최상위 사용자 여정** 정본 (SSOT).

Product Design · UX · 개발 · Prompt · Report 설계는 이 문서를 따른다.

**Last updated:** 2026-06-28 (Blueprint gate · v2 survey · v1 Deep reuse)

---

# Core Value Proposition

1. **Current Self** — 지금의 행동·결정 패턴 (설문 v2)
2. **Innate Self** — 타고난 기질 참조 프레임 (사주 Lite → Human Framework 6축)
3. **Gap** — 둘이 왜 다른지 (축별 점수·delta; 무료는 해석 라벨 없음)

---

# Architecture Split (중요)

| 구간 | 엔진 | 비고 |
|------|------|------|
| 설문·점수·Gap·6각형 | **v2** (`docs/v2/survey`, `analysis`, `saju` Lite) | deterministic + hardcoded |
| Lite 요약 문장 | **v2** prompt 01·02 | LLM (점수 재계산 금지) |
| Deep Self (유료) | **v1** integrated pipeline | 유지·Dashboard에서 연결 |
| Relationship Lite / Deep | **v1** `analyze/basic`, `analyze/premium` | 유지 |
| Decision AI | Phase 3 | Dashboard Coming soon |

---

# Free Experience (가입 전)

## Step 1 — Landing

* Start Free Analysis
* Login (기존 사용자 → Dashboard)

---

## Step 2 — Survey (v2)

* 10문항 (Q1~Q9 scored, Q10 personalization)
* 정본: `docs/v2/survey/02_Survey_Questions.md`
* 점수: `03_Survey_Scoring_Rules.md` → Human Framework 6축

---

## Step 3 — Birth Information

* 생년월일·시간·성별·출생지 (스키마: `docs/v2/saju/02_Saju_Input_Schema.md`)
* **설문 직후** 수집 (Current와 Innate를 한 묶음으로 분석)

---

## Step 4 — Analysis Engines (백엔드)

순서 (논리):

```text
Survey answers → Current Self Profile (6 primary axes)
Birth data     → Saju Lite → Innate Self Profile (6 primary axes)
Both           → Gap Analysis Rules (delta only, no LLM)
```

* Gap 정본: `docs/v2/analysis/01_Gap_Analysis_Rules.md`
* 무료 UI: `free_preview` — 레이더 + 축 점수 + delta 숫자만

---

## Step 5 — Free Results Screen

사용자에게 **한 화면**에서 표시:

| 블록 | 내용 |
|------|------|
| Current Self | 6-Axis Radar + 축 점수 |
| Innate Self | 6-Axis Radar + 축 점수 |
| Gap | overlay 또는 나란히 + delta (라벨· suppression 등 **노출 안 함**) |
| Lite copy | LLM 01 (Current) + 02 (Innate) — 짧은 요약 |

시각화: `docs/v2/guide/09_Visualization_Guide.md`

---

## Step 6 — Blueprint Save Gate (가입 유일 트리거)

프롬프트:

**"My Blueprint를 저장하세요"**

* 이 시점까지 **회원가입 불필요** (미리보기 전부 열람 가능)
* 저장·Dashboard·관계 초대 등 지속 기능 → **Clerk 가입 필수**

Supported: Google · Email · 기타 Clerk providers

---

# Post-Signup — Dashboard (MVP Sprint 1)

## Step 7 — Dashboard

| 카드 | 상태 | 엔진 |
|------|------|------|
| **Deep Self** | 유료 | v1 integrated / Deep prompts |
| **Relationship** | Lite 무료 | v1 relationship basic |
| **Relationship Deep** | 유료 | v1 relationship premium |
| **Decision AI** | Coming soon | placeholder |

---

## Step 8 — Deep Self (Paid)

* v1 심화 사주·통합 리포트 파이프라인 유지
* v2 GapProfile·Current/Innate 프로필을 **입력**으로 연결 (향후)
* Gap **서사·라벨** (Alignment, Suppression 등): 유료 prompt 03A~

결제: 토스 샌드박스 제거됨 → **신규 결제 수단 도입 전** placeholder (`/payment`)

---

## Step 9 — Relationship

* Lite: v1 기본 관계 분석
* Deep: v1 심화 관계 분석
* v2 Human Framework와의 정렬은 점진적 (Phase 2)

---

# Future — Decision Loop (Phase 3+)

```text
Decision → Reflection → Pattern → Better next decision → Repeat
```

Dashboard **Decision AI** 카드 → Decision Journal → AI Memory

---

# Long-Term Vision

* Who am I?
* Why am I living this way?
* What decisions create the best outcomes?
* How can I live closer to my Innate Self?

---

# Related Documents

| Topic | Path |
|-------|------|
| PRD | `docs/v2/PRD/00_Master_PRD.md` |
| Human Framework | `docs/v2/framework/10_Human_Framework.md` |
| Gap free vs paid | `docs/v2/analysis/01_Gap_Analysis_Rules.md` |
| Pipeline | `docs/v2/guide/10_Pipeline_Architecture_v1.md` |
