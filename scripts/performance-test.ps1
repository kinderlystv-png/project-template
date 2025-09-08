# Simple Performance Manager Test
param(
    [string]$Action = "status"
)

try {
    Write-Host "🚀 PERFORMANCE MANAGER v2.2" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectRoot = Split-Path -Parent $scriptPath

    Write-Host "📁 Project Root: $projectRoot" -ForegroundColor Green
    Write-Host "📂 Script Path: $scriptPath" -ForegroundColor Green

    # Check for package.json
    $packageJson = Join-Path $projectRoot "package.json"
    $hasPackageJson = Test-Path $packageJson
    Write-Host "📦 Package.json: $(if($hasPackageJson){'✅ Found'}else{'❌ Missing'})" -ForegroundColor $(if($hasPackageJson){'Green'}else{'Red'})

    # Check for Node processes
    try {
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        Write-Host "⚡ Node Processes: $($nodeProcesses.Count)" -ForegroundColor Green
    } catch {
        Write-Host "⚡ Node Processes: 0" -ForegroundColor Yellow
    }

    # Check if dev server is running on port 5173
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port 5173 -WarningAction SilentlyContinue -InformationLevel Quiet
        $devServerRunning = $connection.TcpTestSucceeded
        Write-Host "🌐 Dev Server (5173): $(if($devServerRunning){'🟢 Running'}else{'🔴 Stopped'})" -ForegroundColor $(if($devServerRunning){'Green'}else{'Red'})
    } catch {
        Write-Host "🌐 Dev Server (5173): 🔴 Stopped" -ForegroundColor Red
    }

    # Check for monitoring scripts
    $monitorScript = Join-Path $scriptPath "performance-monitor.ps1"
    $analyticsScript = Join-Path $scriptPath "performance-analytics.ps1"

    Write-Host "📊 Monitor Script: $(if(Test-Path $monitorScript){'✅ Found'}else{'❌ Missing'})" -ForegroundColor $(if(Test-Path $monitorScript){'Green'}else{'Red'})
    Write-Host "📈 Analytics Script: $(if(Test-Path $analyticsScript){'✅ Found'}else{'❌ Missing'})" -ForegroundColor $(if(Test-Path $analyticsScript){'Green'}else{'Red'})

    Write-Host "`n✅ Status check complete" -ForegroundColor Green

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
