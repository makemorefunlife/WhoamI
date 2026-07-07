# sandbox/

**다음 실험용** 폴더. 프로덕션(`app/`, 코어 `lib/`)에 바로 넣기 전에 여기서 검증.

## 규칙

- `app/`에서 `sandbox/` import 금지
- 실험 끝나면 **삭제**하거나 `lib/`로 이사
- 짧은 메모는 `sandbox/notes.md`에 (선택)

## 예시

```text
sandbox/
  try-new-prompt.ts      # 일회성 LLM 프롬프트 시험
  ui-mock/               # UI 스케치
```

코어 vs 실험 맵: `docs/dev/CORE_MAP.md`
