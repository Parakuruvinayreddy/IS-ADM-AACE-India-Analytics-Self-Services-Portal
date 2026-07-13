# ================================================================
#  ADM Analytics Platform - Windows Quick-Start Script
#  Usage:  .\start_all.ps1
#  Launches all 6 services across 3 modules in separate terminals.
# ================================================================

# -- Helper: stop any process already bound to a port --
Function Stop-Port ($Port) {
    Try {
        $PIDs = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty OwningProcess
        If ($PIDs) {
            Write-Host "Killing existing process on port $Port..." -ForegroundColor Yellow
            Stop-Process -Id $PIDs -Force -ErrorAction SilentlyContinue
        }
    } Catch { }
}

$ports = @(3000, 8081, 3001, 3002, 8000, 5175)
foreach ($p in $ports) { Stop-Port $p }

$Root = $PSScriptRoot

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   ADM Analytics Platform - Starting All Modules " -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# -- Load environment variables from .env --
$EnvFile = "$Root\.env"
if (Test-Path $EnvFile) {
    Write-Host "[ENV] Loading environment variables from .env..." -ForegroundColor Cyan
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $index = $line.IndexOf('=')
            $key = $line.Substring(0, $index).Trim()
            $value = $line.Substring($index + 1).Trim()
            # Remove surrounding quotes from value if present
            if ($value.StartsWith('"') -and $value.EndsWith('"')) { $value = $value.Substring(1, $value.Length - 2) }
            elseif ($value.StartsWith("'") -and $value.EndsWith("'")) { $value = $value.Substring(1, $value.Length - 2) }
            [System.Environment]::SetEnvironmentVariable($key, $value)
            $env:$key = $value
        }
    }
}

# -- PostgreSQL credentials & default fallbacks --
if (-not $env:DB_URL) {
    $pg_pwd_url = 'RVaku%4063042'
    $env:DB_URL = "postgresql://postgres:${pg_pwd_url}@localhost:5432/postgres?options=-c%20search_path%3Dis_adm_india"
}
if (-not $env:TOKEN_ENCRYPTION_KEY) {
    $env:TOKEN_ENCRYPTION_KEY = "7650676dd6c496bd2bda396802e7bdaeac921c40dd1714938236b7dad975c1f4"
}

# -- Install Node dependencies for all backends --
Write-Host "[DEPS] Installing Node dependencies..." -ForegroundColor Magenta

Write-Host "  -> 1_main_website/backend" -ForegroundColor Gray
Set-Location "$Root\1_main_website\backend"
npm install --silent 2>&1 | Select-Object -Last 1
Set-Location $Root

Write-Host "  -> 2_admin_website/backend" -ForegroundColor Gray
Set-Location "$Root\2_admin_website\backend"
npm install --silent 2>&1 | Select-Object -Last 1
Set-Location $Root

Write-Host "  -> 3_intake_page/backend" -ForegroundColor Gray
Set-Location "$Root\3_intake_page\backend"
npm install --silent 2>&1 | Select-Object -Last 1
Set-Location $Root

Write-Host "[DEPS] Done." -ForegroundColor Magenta
Write-Host ""

# -- Create tables in adm_admin_db (IF NOT EXISTS) --
Write-Host "[DB] Initialising tables..." -ForegroundColor Magenta
Set-Location "$Root\2_admin_website\backend"
node setup_db.js
Set-Location $Root
Write-Host "[DB] Done." -ForegroundColor Magenta
Write-Host ""

# -- MODULE 2 : Admin Website --
Write-Host "[2] Starting Admin Website Backend  (Port 3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:DB_URL='$($env:DB_URL)'; `$env:TOKEN_ENCRYPTION_KEY='$($env:TOKEN_ENCRYPTION_KEY)'; cd '$Root\2_admin_website\backend'; node index.js"

Write-Host "[2] Starting Admin Website Frontend (Port 3002)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\2_admin_website\frontend'; npm run dev"

Start-Sleep -Seconds 2

# -- MODULE 3 : Intake Page --
Write-Host "[3] Starting Intake Page Backend    (Port 8000)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:DB_URL='$($env:DB_URL)'; `$env:TOKEN_ENCRYPTION_KEY='$($env:TOKEN_ENCRYPTION_KEY)'; cd '$Root\3_intake_page\backend'; node index.js"

Write-Host "[3] Starting Intake Page Frontend   (Port 5175)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\3_intake_page\frontend'; npm run dev"

Start-Sleep -Seconds 2

# -- MODULE 1 : Main Website --
Write-Host "[1] Starting Main Website Backend   (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:DB_URL='$($env:DB_URL)'; cd '$Root\1_main_website\backend'; node index.js"

Write-Host "[1] Starting Main Website Frontend  (Port 8081)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\1_main_website\frontend\adm-dashboard'; npm start"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  All 6 services launched in separate windows!" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Module 1 - Main Website" -ForegroundColor Yellow
Write-Host "    Backend  : http://localhost:3000" -ForegroundColor Yellow
Write-Host "    Frontend : http://localhost:8081" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Module 2 - Admin Website" -ForegroundColor Green
Write-Host "    Backend  : http://localhost:3001" -ForegroundColor Green
Write-Host "    Frontend : http://localhost:3002" -ForegroundColor Green
Write-Host ""
Write-Host "  Module 3 - Intake Page" -ForegroundColor Blue
Write-Host "    Backend  : http://localhost:8000" -ForegroundColor Blue
Write-Host "    Frontend : http://localhost:5175" -ForegroundColor Blue
Write-Host "=================================================" -ForegroundColor Cyan
