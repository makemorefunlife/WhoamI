# Slim V1 Essence deep — API 스모크 (PowerShell)
# Usage: .\tests\manual\slim-v1-deep-api.ps1

$port = if ($env:PORT) { $env:PORT } else { "3000" }
$uri = "http://localhost:$port/api/v2/deep/essence"

if (-not $env:REPORT_ID) {
  Write-Host "REPORT_ID 환경변수가 필요합니다 (유효한 report UUID)." -ForegroundColor Red
  exit 1
}

$body = @{
  reportId         = $env:REPORT_ID
  birthDate        = "1990-05-15"
  birthTime        = "14:30"
  birthTimeUnknown = $false
  birthPlace       = "서울"
} | ConvertTo-Json

Write-Host "POST $uri" -ForegroundColor Cyan
Write-Host "Body: $body"
Write-Host "응답 대기 중 (1~2분)..." -ForegroundColor Yellow

try {
  $res = Invoke-RestMethod -Uri $uri -Method POST `
    -Body $body -ContentType "application/json; charset=utf-8" `
    -TimeoutSec 180
  $chars = $res.slim_v1.report.Length
  Write-Host "OK — report length: $chars chars" -ForegroundColor Green
  Write-Host "llm_source: $($res.slim_v1.llm_source)"
} catch {
  Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
