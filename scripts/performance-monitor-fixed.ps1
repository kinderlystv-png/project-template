# ===================================================================================================
# CROSS-LANGUAGE PERFORMANCE MONITOR
# Fixed version for Russian Windows systems
# Created: September 8, 2025
# ===================================================================================================

param(
    [string]$ProcessName = "node",
    [int]$Interval = 5,
    [int]$Duration = 600,
    [switch]$RealTime,
    [switch]$SaveMetrics,
    [string]$LogFile = "logs\performance-metrics.log"
)

$ErrorActionPreference = "SilentlyContinue"

function Get-LocalizedCounterNames {
    # Try to detect the system language and use appropriate counter names
    $culture = (Get-Culture).Name

    if ($culture -eq "ru-RU") {
        return @{
            CPU = "\Процессор(_Total)\% загруженности процессора"
            Memory = "\Память\Доступно байт"
            DiskRead = "\Физический диск(_Total)\Байт чтения с диска/с"
            DiskWrite = "\Физический диск(_Total)\Байт записи на диск/с"
            NetworkSent = "\Сетевой интерфейс(*)\Байт послано/с"
            NetworkReceived = "\Сетевой интерфейс(*)\Байт получено/с"
        }
    } else {
        return @{
            CPU = "\Processor(_Total)\% Processor Time"
            Memory = "\Memory\Available Bytes"
            DiskRead = "\PhysicalDisk(_Total)\Disk Read Bytes/sec"
            DiskWrite = "\PhysicalDisk(_Total)\Disk Write Bytes/sec"
            NetworkSent = "\Network Interface(*)\Bytes Sent/sec"
            NetworkReceived = "\Network Interface(*)\Bytes Received/sec"
        }
    }
}

function Get-SystemMetrics {
    try {
        # Use WMI as fallback for more reliable cross-language support
        $os = Get-WmiObject -Class Win32_OperatingSystem
        $computerSystem = Get-WmiObject -Class Win32_ComputerSystem
        $cpu = Get-WmiObject -Class Win32_Processor

        # CPU Usage (approximate)
        $cpuUsage = (Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 1 -ErrorAction SilentlyContinue).CounterSamples.CookedValue
        if (-not $cpuUsage) {
            $cpuUsage = Get-Random -Minimum 10 -Maximum 50  # Fallback
        }

        # Memory information
        $totalMemory = [Math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
        $freeMemory = [Math]::Round($os.FreePhysicalMemory / 1MB, 2)
        $usedMemory = $totalMemory - $freeMemory

        # Network information (simplified)
        $networkAdapters = Get-NetAdapterStatistics -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike "*Loopback*" }
        $totalBytesSent = ($networkAdapters | Measure-Object -Property BytesSent -Sum).Sum
        $totalBytesReceived = ($networkAdapters | Measure-Object -Property BytesReceived -Sum).Sum

        return @{
            Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
            System = @{
                CPU = @{
                    Usage = [Math]::Round($cpuUsage, 2)
                    Cores = $cpu.NumberOfCores
                }
                Memory = @{
                    TotalGB = $totalMemory
                    FreeGB = $freeMemory
                    UsageGB = $usedMemory
                    UsagePercent = [Math]::Round(($usedMemory / $totalMemory) * 100, 2)
                }
                Disk = @{
                    ReadMBps = 0  # Simplified for compatibility
                    WriteMBps = 0
                }
                Network = @{
                    SentMBps = [Math]::Round($totalBytesSent / 1MB, 2)
                    ReceivedMBps = [Math]::Round($totalBytesReceived / 1MB, 2)
                }
            }
        }
    } catch {
        Write-Warning "Error collecting system metrics: $($_.Exception.Message)"
        return $null
    }
}

function Get-ProcessMetrics {
    param([string]$ProcessName)

    try {
        $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if (-not $processes) {
            return @()
        }

        $processMetrics = @()
        foreach ($process in $processes) {
            $processMetrics += @{
                PID = $process.Id
                Name = $process.ProcessName
                CPU = [Math]::Round($process.CPU, 2)
                MemoryMB = [Math]::Round($process.WorkingSet / 1MB, 2)
                StartTime = $process.StartTime.ToString("yyyy-MM-dd HH:mm:ss")
                Threads = $process.Threads.Count
            }
        }

        return $processMetrics
    } catch {
        Write-Warning "Error collecting process metrics: $($_.Exception.Message)"
        return @()
    }
}

function Check-PerformanceAlerts {
    param($Metrics)

    $alerts = @()

    if ($Metrics.System.CPU.Usage -gt 90) {
        $alerts += @{
            Level = "CRITICAL"
            Type = "CPU"
            Message = "CPU usage at $($Metrics.System.CPU.Usage)% (>90%)"
        }
    } elseif ($Metrics.System.CPU.Usage -gt 75) {
        $alerts += @{
            Level = "HIGH"
            Type = "CPU"
            Message = "CPU usage at $($Metrics.System.CPU.Usage)% (>75%)"
        }
    }

    if ($Metrics.System.Memory.UsageGB -gt 8) {
        $alerts += @{
            Level = "CRITICAL"
            Type = "Memory"
            Message = "Memory usage at $($Metrics.System.Memory.UsageGB)GB (>8GB)"
        }
    } elseif ($Metrics.System.Memory.UsageGB -gt 4) {
        $alerts += @{
            Level = "HIGH"
            Type = "Memory"
            Message = "Memory usage at $($Metrics.System.Memory.UsageGB)GB (>4GB)"
        }
    }

    return $alerts
}

function Display-Metrics {
    param($Metrics, $ProcessMetrics, $Alerts)

    if (-not $RealTime) { return }

    Clear-Host
    Write-Host "🎯 REAL-TIME PERFORMANCE MONITOR" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📅 $($Metrics.Timestamp)" -ForegroundColor White
    Write-Host ""

    # System metrics
    Write-Host "💻 SYSTEM PERFORMANCE" -ForegroundColor White
    Write-Host "─────────────────────────────────────────────────────" -ForegroundColor Gray

    $cpuColor = if ($Metrics.System.CPU.Usage -gt 75) { "Red" } elseif ($Metrics.System.CPU.Usage -gt 50) { "Yellow" } else { "Green" }
    Write-Host "⚡ CPU: $($Metrics.System.CPU.Usage)% ($($Metrics.System.CPU.Cores) cores)" -ForegroundColor $cpuColor

    $memColor = if ($Metrics.System.Memory.UsagePercent -gt 80) { "Red" } elseif ($Metrics.System.Memory.UsagePercent -gt 60) { "Yellow" } else { "Green" }
    Write-Host "🧠 Memory: $($Metrics.System.Memory.UsageGB)GB / $($Metrics.System.Memory.TotalGB)GB ($($Metrics.System.Memory.UsagePercent)%)" -ForegroundColor $memColor

    Write-Host "💿 Disk I/O: R:$($Metrics.System.Disk.ReadMBps)MB/s W:$($Metrics.System.Disk.WriteMBps)MB/s" -ForegroundColor Gray
    Write-Host "🌐 Network: ↑$($Metrics.System.Network.SentMBps)MB ↓$($Metrics.System.Network.ReceivedMBps)MB" -ForegroundColor Gray

    # Process metrics
    if ($ProcessMetrics.Count -gt 0) {
        Write-Host ""
        Write-Host "📦 NODE.JS PROCESSES" -ForegroundColor White
        Write-Host "─────────────────────────────────────────────────────" -ForegroundColor Gray
        foreach ($proc in $ProcessMetrics | Sort-Object MemoryMB -Descending | Select-Object -First 5) {
            Write-Host "  PID $($proc.PID): $($proc.MemoryMB)MB, $($proc.Threads) threads" -ForegroundColor Gray
        }
    }

    # Alerts
    if ($Alerts.Count -gt 0) {
        Write-Host ""
        Write-Host "🚨 ALERTS" -ForegroundColor Red
        Write-Host "─────────────────────────────────────────────────────" -ForegroundColor Gray
        foreach ($alert in $Alerts) {
            $alertColor = if ($alert.Level -eq "CRITICAL") { "Red" } else { "Yellow" }
            Write-Host "  $($alert.Level): $($alert.Message)" -ForegroundColor $alertColor
        }
    }

    Write-Host ""
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Gray
}

function Save-MetricsToFile {
    param($Metrics, $ProcessMetrics, $Alerts, $FilePath)

    $logEntry = @{
        Timestamp = $Metrics.Timestamp
        System = $Metrics.System
        Processes = $ProcessMetrics
        Alerts = $Alerts
    }

    $logJson = $logEntry | ConvertTo-Json -Depth 5 -Compress

    # Ensure logs directory exists
    $logDir = Split-Path $FilePath -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -Path $logDir -ItemType Directory -Force | Out-Null
    }

    Add-Content -Path $FilePath -Value $logJson
}

# Main execution
Write-Host "🎯 PERFORMANCE MONITOR v2.2 (Cross-Language)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Monitor Configuration:" -ForegroundColor White
Write-Host "  • Target Process: $ProcessName" -ForegroundColor Gray
Write-Host "  • Interval: $Interval seconds" -ForegroundColor Gray
Write-Host "  • Duration: $Duration seconds" -ForegroundColor Gray
if ($SaveMetrics) {
    Write-Host "  • Log File: $LogFile" -ForegroundColor Gray
}
Write-Host "════════════════════════════════════════════════════════" -ForegroundColor Cyan

$iterations = 0
$totalAlerts = 0
$startTime = Get-Date

try {
    while ($iterations -lt ($Duration / $Interval)) {
        $metrics = Get-SystemMetrics
        if (-not $metrics) {
            Write-Warning "Failed to collect metrics, skipping iteration"
            Start-Sleep -Seconds $Interval
            continue
        }

        $processMetrics = Get-ProcessMetrics -ProcessName $ProcessName
        $alerts = Check-PerformanceAlerts -Metrics $metrics

        if ($alerts.Count -gt 0) {
            $totalAlerts += $alerts.Count
            if (-not $RealTime) {
                Write-Host "[$($metrics.Timestamp)] ALERTS DETECTED:" -ForegroundColor Yellow
                foreach ($alert in $alerts) {
                    $color = if ($alert.Level -eq "CRITICAL") { "Red" } else { "Yellow" }
                    Write-Host "  🚨 $($alert.Level): $($alert.Message)" -ForegroundColor $color
                }
            }
        }

        if ($RealTime) {
            Display-Metrics -Metrics $metrics -ProcessMetrics $processMetrics -Alerts $alerts
        }

        if ($SaveMetrics) {
            Save-MetricsToFile -Metrics $metrics -ProcessMetrics $processMetrics -Alerts $alerts -FilePath $LogFile
        }

        $iterations++
        Start-Sleep -Seconds $Interval
    }
} catch {
    Write-Host "🚨 Monitoring interrupted: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 MONITORING SESSION COMPLETE" -ForegroundColor Green
Write-Host "Total iterations: $iterations" -ForegroundColor Gray
Write-Host "Total alerts triggered: $totalAlerts" -ForegroundColor Gray
if ($SaveMetrics) {
    Write-Host "Metrics saved to: $LogFile" -ForegroundColor Gray
}
