param(
    [int]$Port = 8080
)

$ErrorActionPreference =
    "Stop"

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "BNT Enterprise" `
    -ForegroundColor Cyan

Write-Host ""

if (
    -not (
        Get-Command node `
        -ErrorAction SilentlyContinue
    )
) {

    Write-Host `
        "Node.js not found." `
        -ForegroundColor Red

    exit 1
}


# -----------------------------------------
# Stop previous process on this exact port
# -----------------------------------------

$Connections =
    Get-NetTCPConnection `
        -LocalPort $Port `
        -State Listen `
        -ErrorAction SilentlyContinue

if ($Connections) {

    $Pids =
        $Connections |
        Select-Object `
            -ExpandProperty OwningProcess `
            -Unique

    foreach ($ProcessId in $Pids) {

        $ProcessInfo =
            Get-Process `
                -Id $ProcessId `
                -ErrorAction SilentlyContinue

        if ($ProcessInfo) {

            Write-Host `
                "Stopping previous local server PID $ProcessId..." `
                -ForegroundColor Yellow

            Stop-Process `
                -Id $ProcessId `
                -Force
        }
    }

    Start-Sleep `
        -Milliseconds 600
}


$env:PORT = $Port


Write-Host `
    "Starting local server..." `
    -ForegroundColor Green

Write-Host ""

Write-Host `
    "http://localhost:$Port/dispatcher"

Write-Host ""


Start-Process `
    "http://localhost:$Port/dispatcher"


node server.js
