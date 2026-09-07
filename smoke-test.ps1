param(
    [int]$Port = 8080
)

$Base =
    "http://127.0.0.1:$Port"

$Routes = @(
    "/",
    "/dispatcher",
    "/digital-twin",
    "/equipment",
    "/equipment-detail",
    "/analytics",
    "/toir",
    "/logistics",
    "/procurement",
    "/reports",
    "/templates",
    "/builder",
    "/data",
    "/mailings",
    "/sync",
    "/api/config"
)

Write-Host ""
Write-Host "BNT ROUTE TEST" `
    -ForegroundColor Cyan

Write-Host ""

$Failed = 0

foreach ($Route in $Routes) {

    try {

        $Response =
            Invoke-WebRequest `
                -Uri "$Base$Route" `
                -UseBasicParsing `
                -TimeoutSec 5

        if (
            $Response.StatusCode -eq 200
        ) {

            Write-Host `
                "[OK] $Route" `
                -ForegroundColor Green
        }
        else {

            Write-Host `
                "[FAIL] $Route -> $($Response.StatusCode)" `
                -ForegroundColor Red

            $Failed++
        }

    }
    catch {

        Write-Host `
            "[FAIL] $Route -> $($_.Exception.Message)" `
            -ForegroundColor Red

        $Failed++
    }
}

Write-Host ""

if (
    $Failed -eq 0
) {

    Write-Host `
        "ALL ROUTES OK" `
        -ForegroundColor Green

    exit 0
}

Write-Host `
    "$Failed route(s) failed." `
    -ForegroundColor Red

exit 1
