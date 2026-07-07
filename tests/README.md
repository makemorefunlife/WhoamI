# tests/

프로덕션 코드가 **아닌** 검증·실험용 모음.

```text
tests/
  README.md           ← 이 파일
  scripts/            # Node .mjs — API/파이프라인 스모크 (구 scripts/ 이전)
  manual/             # curl, PowerShell — 로컬 dev 서버 수동 호출
  regression/         # 회귀 검증 가이드 (체크리스트)
  fixtures/           # (선택) 샘플 JSON payload
```

## 실행 전

```bash
cd WhoamI
npm run dev   # localhost:3000
```

## scripts 예시

```bash
node tests/scripts/verify-premium-pipeline.mjs
```

## manual 예시

```powershell
.\tests\manual\slim-v1-deep-api.ps1
```

## 규칙

- `app/`·`lib/`에서 `tests/` 파일을 import **하지 않음**
- 새 실험 스크립트는 여기에만 추가
- 자동화 프레임워크 도입 시 `tests/unit/` 등 하위 추가 가능
