# ===================================================================================================
# INTEGRATED PERFORMANCE MANAGEMENT SYSTEM
# Unified interface for all performance monitoring and analysis tools
# Created: September 8, 2025
# ===================================================================================================

param(
    [string]$Action = "menu",
    [string]$Target = "auto",
    [int]$Duration = 60,
    [switch]$AutoStart,
    [switch]$Quiet
)

$ErrorActionPreference = "Continue"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath

# Configuration
$config = @{
    MonitorScript = Join-Path $scriptPath "performance-monitor.ps1"
    AnalyticsScript = Join-Path $scriptPath "performance-analytics.ps1"
    PortDetectionScript = Join-Path $scriptPath "port-detection.ps1"
    LogsPath = Join-Path $projectRoot "logs"
    ReportsPath = Join-Path $projectRoot "logs"
    DevServer = @{
        Command = "npm run dev"
        Port = 5173
        ProcessName = "node"
    }
}

function Write-Banner {
    if (-not $Quiet) {
        Clear-Host
        Write-Host @"

  ╔══════════════════════════════════════════════════════════════════════╗
  ║                🚀 INTEGRATED PERFORMANCE MANAGER v2.2                ║
  ║                     Advanced Development Monitoring                   ║
  ╚══════════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
    }
}

function Initialize-Environment {
    # Ensure required directories exist
    if (-not (Test-Path $config.LogsPath)) {
        New-Item -Path $config.LogsPath -ItemType Directory -Force | Out-Null
        Write-Host "📁 Created logs directory: $($config.LogsPath)" -ForegroundColor Green
    }

    # Check for required scripts
    $requiredScripts = @($config.MonitorScript, $config.AnalyticsScript, $config.PortDetectionScript)
    foreach ($script in $requiredScripts) {
        if (-not (Test-Path $script)) {
            Write-Warning "Required script not found: $script"
            return $false
        }
    }

    return $true
}

function Get-NodeProcesses {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        return $nodeProcesses | Select-Object Id, ProcessName, WorkingSet, CPU, StartTime | Sort-Object WorkingSet -Descending
    }
    return @()
}

function Get-ProjectStatus {
    $status = @{
        DevServerRunning = $false
        NodeProcesses = 0
        ActivePorts = @()
        ProjectPath = $projectRoot
        PackageJsonExists = Test-Path (Join-Path $projectRoot "package.json")
    }

    # Check for Node.js processes
    $nodeProcs = Get-NodeProcesses
    $status.NodeProcesses = $nodeProcs.Count

    # Check for dev server on expected port
    try {
        $devPort = $config.DevServer.Port
        $connection = Test-NetConnection -ComputerName "localhost" -Port $devPort -WarningAction SilentlyContinue -InformationLevel Quiet
        $status.DevServerRunning = $connection.TcpTestSucceeded
        if ($status.DevServerRunning) {
            $status.ActivePorts += $devPort
        }
    } catch {
        # Silently continue
    }

    # Detect additional active ports
    if (Test-Path $config.PortDetectionScript) {
        try {
            $portResults = & $config.PortDetectionScript -Method "netstat" -Quiet 2>$null
            if ($portResults) {
                $status.ActivePorts += $portResults | Where-Object { $_ -ne $config.DevServer.Port }
            }
        } catch {
            # Silently continue
        }
    }

    return $status
}

function Show-SystemStatus {
    $status = Get-ProjectStatus

    Write-Host "📊 SYSTEM STATUS" -ForegroundColor White
    Write-Host "─────────────────────────────────────────────────────" -ForegroundColor Gray

    # Project Information
    Write-Host "📁 Project: " -NoNewline -ForegroundColor White
    Write-Host (Split-Path $status.ProjectPath -Leaf) -ForegroundColor Green

    Write-Host "📦 Package.json: " -NoNewline -ForegroundColor White
    Write-Host $(if($status.PackageJsonExists){"✅ Found"}else{"❌ Missing"}) -ForegroundColor $(if($status.PackageJsonExists){"Green"}else{"Red"})

    # Development Server Status
    Write-Host "🌐 Dev Server: " -NoNewline -ForegroundColor White
    if ($status.DevServerRunning) {
        Write-Host "🟢 Running on port $($config.DevServer.Port)" -ForegroundColor Green
    } else {
        Write-Host "🔴 Not running" -ForegroundColor Red
    }

    # Node.js Processes
    Write-Host "⚡ Node Processes: " -NoNewline -ForegroundColor White
    if ($status.NodeProcesses -gt 0) {
        Write-Host "$($status.NodeProcesses) active" -ForegroundColor Green
        $nodeProcs = Get-NodeProcesses
        foreach ($proc in $nodeProcs | Select-Object -First 3) {
            $memoryMB = [Math]::Round($proc.WorkingSet / 1MB, 1)
            Write-Host "   └─ PID $($proc.Id): ${memoryMB}MB" -ForegroundColor Gray
        }
    } else {
        Write-Host "None" -ForegroundColor Yellow
    }

    # Active Ports
    Write-Host "🔌 Active Ports: " -NoNewline -ForegroundColor White
    if ($status.ActivePorts.Count -gt 0) {
        Write-Host ($status.ActivePorts -join ", ") -ForegroundColor Green
    } else {
        Write-Host "None detected" -ForegroundColor Yellow
    }

    Write-Host ""
}

function Show-MainMenu {
    Write-Host "🎛️  PERFORMANCE MANAGEMENT OPTIONS" -ForegroundColor White
    Write-Host "─────────────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "1. 🚀 Start Development Monitoring (Real-time)" -ForegroundColor Green
    Write-Host "2. 📊 Start Background Monitoring (Log metrics)" -ForegroundColor Green
    Write-Host "3. 📈 Analyze Performance Data" -ForegroundColor Cyan
    Write-Host "4. 📄 Generate Performance Report" -ForegroundColor Cyan
    Write-Host "5. 🔍 Check Port Status" -ForegroundColor Yellow
    Write-Host "6. 🎯 Start Dev Server + Monitor" -ForegroundColor Magenta
    Write-Host "7. 🔧 System Diagnostics" -ForegroundColor Blue
    Write-Host "8. ❌ Exit" -ForegroundColor Red
    Write-Host ""

    $choice = Read-Host "Select option (1-8)"
    return $choice
}

function Start-DevServerWithMonitoring {
    Write-Host "🚀 Starting development server with integrated monitoring..." -ForegroundColor Green

    # Check if dev server is already running
    $status = Get-ProjectStatus
    if ($status.DevServerRunning) {
        Write-Host "⚠️  Development server already running on port $($config.DevServer.Port)" -ForegroundColor Yellow
        $continue = Read-Host "Continue with monitoring only? (y/n)"
        if ($continue -ne "y") { return }
    } else {
        # Start dev server in background
        Write-Host "📦 Starting npm dev server..." -ForegroundColor Yellow
        $devJob = Start-Job -ScriptBlock {
            param($projectPath)
            Set-Location $projectPath
            npm run dev
        } -ArgumentList $projectRoot

        Write-Host "⏳ Waiting for server to start (15 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15
    }

    # Start monitoring
    Write-Host "📊 Starting performance monitoring..." -ForegroundColor Green
    $monitorArgs = @(
        "-RealTime",
        "-ProcessName", "node",
        "-SaveMetrics",
        "-AlertThresholds", "CPU:75,Memory:1.5"
    )

    & $config.MonitorScript @monitorArgs
}

function Run-SystemDiagnostics {
    Write-Host "🔧 SYSTEM DIAGNOSTICS" -ForegroundColor Cyan
    Write-Host "═════════════════════════════════════════════════════════" -ForegroundColor Cyan

    # PowerShell version
    Write-Host "📋 PowerShell Version: $($PSVersionTable.PSVersion)" -ForegroundColor White

    # System resources
    $os = Get-WmiObject -Class Win32_OperatingSystem
    $totalMemory = [Math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
    $freeMemory = [Math]::Round($os.FreePhysicalMemory / 1MB, 2)
    $memoryUsage = [Math]::Round((($totalMemory - $freeMemory) / $totalMemory) * 100, 1)

    Write-Host "💾 System Memory: $totalMemory GB total, ${freeMemory}GB free (${memoryUsage}% used)" -ForegroundColor White

    # CPU information
    $cpu = Get-WmiObject -Class Win32_Processor | Select-Object -First 1
    Write-Host "⚡ CPU: $($cpu.Name)" -ForegroundColor White
    Write-Host "🔢 Cores: $($cpu.NumberOfCores) cores, $($cpu.NumberOfLogicalProcessors) logical processors" -ForegroundColor White

    # Disk space
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $diskFree = [Math]::Round($disk.FreeSpace / 1GB, 2)
    $diskTotal = [Math]::Round($disk.Size / 1GB, 2)
    $diskUsage = [Math]::Round((($diskTotal - $diskFree) / $diskTotal) * 100, 1)

    Write-Host "💿 Disk C: ${diskTotal}GB total, ${diskFree}GB free (${diskUsage}% used)" -ForegroundColor White

    # Network adapters
    $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" } | Select-Object -First 3
    Write-Host "🌐 Active Network Adapters: $($adapters.Count)" -ForegroundColor White
    foreach ($adapter in $adapters) {
        Write-Host "   └─ $($adapter.Name): $($adapter.LinkSpeed)" -ForegroundColor Gray
    }

    # Node.js version (if available)
    try {
        $nodeVersion = node --version 2>$null
        Write-Host "📦 Node.js: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "📦 Node.js: Not installed or not in PATH" -ForegroundColor Red
    }

    # NPM version (if available)
    try {
        $npmVersion = npm --version 2>$null
        Write-Host "📦 NPM: v$npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "📦 NPM: Not available" -ForegroundColor Red
    }

    Write-Host "`n✅ Diagnostics complete" -ForegroundColor Green
    Read-Host "Press Enter to continue"
}

function Execute-Action {
    param([string]$ActionChoice)

    switch ($ActionChoice) {
        "1" {
            Write-Host "🚀 Starting real-time monitoring..." -ForegroundColor Green
            & $config.MonitorScript -RealTime -ProcessName "node"
        }
        "2" {
            $duration = Read-Host "Enter monitoring duration in seconds (default: 300)"
            if (-not $duration -or $duration -eq "") { $duration = 300 }
            Write-Host "📊 Starting background monitoring for $duration seconds..." -ForegroundColor Green
            & $config.MonitorScript -SaveMetrics -Duration $duration -ProcessName "node"
        }
        "3" {
            Write-Host "📈 Analyzing performance data..." -ForegroundColor Cyan
            & $config.AnalyticsScript -ShowTrends -AnalyzeAnomalies
            Read-Host "`nPress Enter to continue"
        }
        "4" {
            Write-Host "📄 Generating comprehensive report..." -ForegroundColor Cyan
            & $config.AnalyticsScript -GenerateReport
            Read-Host "Press Enter to continue"
        }
        "5" {
            Write-Host "🔍 Checking port status..." -ForegroundColor Yellow
            & $config.PortDetectionScript -Method "all"
            Read-Host "Press Enter to continue"
        }
        "6" {
            Start-DevServerWithMonitoring
        }
        "7" {
            Run-SystemDiagnostics
        }
        "8" {
            Write-Host "👋 Goodbye!" -ForegroundColor Green
            exit 0
        }
        default {
            Write-Host "❌ Invalid option. Please try again." -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
}

# Main execution flow
Write-Banner

if (-not (Initialize-Environment)) {
    Write-Host "❌ Initialization failed. Please check the setup." -ForegroundColor Red
    exit 1
}

if ($AutoStart) {
    Write-Host "🚀 Auto-starting development monitoring..." -ForegroundColor Green
    Start-DevServerWithMonitoring
    exit 0
}

if ($Action -eq "menu" -and -not $Quiet) {
    do {
        Write-Banner
        Show-SystemStatus
        $choice = Show-MainMenu
        Execute-Action -ActionChoice $choice
    } while ($choice -ne "8")
} else {
    # Direct action execution
    switch ($Action.ToLower()) {
        "monitor" { & $config.MonitorScript -RealTime -ProcessName "node" }
        "analyze" { & $config.AnalyticsScript -ShowTrends -AnalyzeAnomalies }
        "report" { & $config.AnalyticsScript -GenerateReport }
        "ports" { & $config.PortDetectionScript -Method "all" }
        "dev" { Start-DevServerWithMonitoring }
        "status" { Show-SystemStatus }
        default {
            Write-Host "Available actions: monitor, analyze, report, ports, dev, status, menu" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n✅ Performance management session complete" -ForegroundColor Green
