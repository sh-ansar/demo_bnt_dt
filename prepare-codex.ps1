$ErrorActionPreference = "Stop"

$Root = Get-Location

Write-Host "BNT Codex handoff preparation" -ForegroundColor Cyan
Write-Host "Repository: $Root"

New-Item -ItemType Directory -Force "docs" | Out-Null
New-Item -ItemType Directory -Force "legacy" | Out-Null

if (Test-Path ".\CODEX_TASK.md") {
    Write-Host "[OK] CODEX_TASK.md present" -ForegroundColor Green
}

Write-Host ""
Write-Host "Top-level files:" -ForegroundColor Cyan
Get-ChildItem -Force | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize

Write-Host ""
Write-Host "Git status:" -ForegroundColor Cyan
if (Test-Path ".git") {
    git status --short
} else {
    Write-Host "No .git directory found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Legacy v5 candidates:" -ForegroundColor Cyan
Get-ChildItem -Directory | Where-Object {
    $_.Name -match 'v5|report|studio|old|legacy'
} | Select-Object FullName | Format-Table -AutoSize

Write-Host ""
Write-Host "Next: open CODEX_TASK.md and let Codex inventory the repo before changing code." -ForegroundColor Green
