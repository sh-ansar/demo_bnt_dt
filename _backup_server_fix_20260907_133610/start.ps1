param(
    [int]$Port = 8080
)

$ErrorActionPreference =
    "Stop"

Set-Location $PSScriptRoot

if (
    -not (
        Get-Command node `
        -ErrorAction SilentlyContinue
    )
) {

    Write-Host ""
    Write-Host "Node.js не найден." `
        -ForegroundColor Red

    Write-Host `
        "Установи Node.js LTS и повтори запуск."

    exit 1
}

Write-Host ""
Write-Host "BNT Enterprise v8" `
    -ForegroundColor Cyan

Write-Host ""
Write-Host `
    "http://localhost:$Port"

Write-Host `
    "http://localhost:$Port/digital-twin"

Write-Host ""

Start-Process `
    "http://localhost:$Port/digital-twin"

$env:PORT = $Port

node server.js
