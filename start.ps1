param(
    [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "BNT Enterprise Digital Twin"
Write-Host "Local server: http://localhost:$Port"
Write-Host ""

Start-Process "http://localhost:$Port"

if (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server $Port
}
elseif (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server $Port
}
else {
    Write-Host "Python не найден."
    Write-Host "Установи Python либо используй: npx serve ."
}
