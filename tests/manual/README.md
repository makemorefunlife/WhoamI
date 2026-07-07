# manual — 수동 API 호출

로컬 dev 서버(`npm run dev`)가 떠 있어야 합니다.

| 파일 | 용도 |
|------|------|
| `slim-v1-deep-api.ps1` | Slim V1 `/api/v2/deep/innate` 스모크 |

PowerShell:

```powershell
$env:REPORT_ID = "<유효한-report-uuid>"
.\tests\manual\slim-v1-deep-api.ps1
# 포트 변경: $env:PORT=3001; .\tests\manual\slim-v1-deep-api.ps1
```
