# WhoamI — Agent 가이드

## Next.js

This version has breaking changes. Read `node_modules/next/dist/docs/` before writing Next.js code.

## 개발 트래킹 (함께 쓰는 devlog)

| 문서 | 역할 |
|------|------|
| `docs/dev/README.md` | devlog 시작점 |
| `docs/dev/00_Status.md` | **NOW 1개** Todo SSOT |
| `docs/dev/PROJECT_RULES.md` | 개발 규정 |
| `docs/dev/CORE_MAP.md` | 코어 / 실험 / 삭제 후보 |
| `docs/dev/daily/` | 하루 기록 |
| `docs/dev/decisions/` | 중요 결정 |

세션 시작: `00_Status.md` 읽기.  
종료 시 사용자가 "오늘 로그 남겨줘" → `daily/` + Status 갱신.

## 테스트

- `tests/` — 수동·스크립트 검증 (프로덕션 아님)
- `sandbox/` — 실험 코드 (삭제 가능)

## 제품 핵심 (2026-06)

- Blueprint: v2 설문 10문항 → 생년월일·**출생지**·시간 → Lite + Gap
- 심화: Slim V1 (`lib/v1/slim`) — 설문 + 기질(신살) + 점성, 관계 맥락 제외
- 사주 시간 모름 → 12:00; 점성은 **출생지 필수**

Cursor rules: `.cursor/rules/dev-workflow.mdc`, `code-zones.mdc`
