# 개발 진행 트래커 (Todo + Context)

> SSOT: [10_Pipeline_Architecture_v1.md](../guide/10_Pipeline_Architecture_v1.md) § SSOT

**마지막 업데이트:** 2026-06-25 (세션 종료)

---

## ✅ Phase F (완료)

- `relationship-compat-analyzer.js` — Lite + Deep (`07` §1–§3)
- `integrated-compat-analyzer.js` — `09`
- `@fullstackfamily/manseryeok` + `saju-calculator.js` + `npm run saju`
- `npm run relationship-lite` / `relationship-integrated` / `relationship-deep`

## 🔴 NOW (내일 첫 작업)

```text
[ ] LLM 프롬프트 품질 — 출력이 generic함 → 훅·날카로운 문체로 개선
    - 대상: relationship lite/deep (04/05) 우선, 필요 시 gap/03A·deep-self(03B–D) 연쇄
    - runtime/prompts/*.txt + docs/prompt/ SSOT 동기화
    - 샘플 재실행 후 relationship_*_result.json 품질 비교
```

> 내일 시작할 때: **"우리 뭐부터 하지?"** → 위 NOW 1개부터.

---

## NEXT (NOW 다음)

```text
[ ] 만세력 v2 — 운성·신살 enrichment (03 full)
[ ] Phase D — Deep Self Rules 코드화
[ ] 상대 Current/Gap 실설문 연결 (partner placeholder 제거)
```

---

## ✅ 최근 정리 (구조)

- `analysis-context.js` — 계산 1회 · `analysis_bundle.json` 캐시
- `env.js` `sampleFiles` — 샘플 경로 단일 정본
- legacy 문서 → `docs/archive/legacy/`
- 중복 샘플 → `samples/archive/`
- PRD 6→4 통합 — `docs/PRD/00`–`03` (구본 → `docs/PRD/archive/`)

---

## 샘플 경로 (고정)

| 파일 | 역할 |
|------|------|
| `samples/survey_answers.json` | 설문 입력 |
| `samples/innate_profile.json` | 사주 프로필 |
| `samples/analysis_bundle.json` | 계산 캐시 |
| `samples/current_self_profile.json` | bundle 스냅샷 |
| `samples/gap_profile.json` | bundle 스냅샷 |

```bash
cd runtime && npm run pipeline -- --force
```

---

## Phase C ✅

Gap Rules · 03A · Schema · analysis-context

---

## NEXT

1. **LLM 프롬프트 훅·문체 개선** (relationship → self 리포트 순)
2. `deep_*` Schema in 05
3. 만세력 v2 / Phase D
