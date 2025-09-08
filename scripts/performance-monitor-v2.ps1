#Requires -Version 5.1
<#
.SYNOPSIS
    Advanced PowerShell performance monitoring script for SHINOMONTAGKA project

.DESCRIPTION
    Monitors system and process performance metrics including CPU, Memory, Disk I/O, and Network usage.
    Uses WMI/CIM for maximum compatibility across different Windows configurations.

.PARAMETER ProcessName
    Name of the process to monitor (optional)

.PARAMETER IntervalSeconds
    Monitoring interval in seconds (default: 5)

.PARAMETER DurationMinutes
    Monitoring duration in minutes (default: 10)

.PARAMETER OutputFormat
    Output format: JSON, CSV, or TABLE (default: TABLE)

.PARAMETER LogFile
    Path to log file (default: logs/performance-monitor.log)

.PARAMETER Silent
    Suppress console output except errors

.EXAMPLE
    .\performance-monitor.ps1 -ProcessName "node" -IntervalSeconds 3 -DurationMinutes 5 -Verbose
#>

param(
    [string]$ProcessName = "",
    [int]$IntervalSeconds = 5,
    [int]$DurationMinutes = 10,
    [ValidateSet("JSON", "CSV", "TABLE")]
    [string]$OutputFormat = "TABLE",
    [string]$LogFile = "logs/performance-monitor.log",
    [switch]$Silent
)

# Global configuration
$Global:Thresholds = @{
    CPU_HIGH = 80
    CPU_CRITICAL = 95
    MEMORY_HIGH = 1GB
    MEMORY_CRITICAL = 2GB
    DISK_IO_HIGH = 50MB
    NETWORK_HIGH = 10MB
}

function Write-ColorOutput {
    param([string]$Message, [string]$Type = "Info")
    if ($Silent) { return }

    $color = switch ($Type) {
        "Success" { "Green" }
        "Warning" { "Yellow" }
        "Error" { "Red" }
        "Info" { "Cyan" }
        default { "White" }
    }
    Write-Host $Message -ForegroundColor $color
}

function Initialize-LogDirectory {
    $LogDir = Split-Path $LogFile -Parent
    if (-not (Test-Path $LogDir)) {
        New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
        Write-ColorOutput "📁 Created logs directory: $LogDir" "Success"
    }
}

function Get-SystemMetrics {
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

        # CPU Usage - using multiple methods for compatibility
        $cpuUsage = 0
        try {
            # Try Russian counter first
            $cpuUsage = (Get-Counter "\Сведения о процессоре(_Total)\Производительность процессора %" -SampleInterval 1 -MaxSamples 1 -ErrorAction Stop).CounterSamples.CookedValue
        } catch {
            try {
                # Try English counter
                $cpuUsage = (Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 1 -ErrorAction Stop).CounterSamples.CookedValue
            } catch {
                try {
                    # Fallback to WMI/CIM
                    $cpuUsage = (Get-CimInstance -ClassName Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
                    if ($null -eq $cpuUsage) { $cpuUsage = 0 }
                } catch {
                    $cpuUsage = 0
                }
            }
        }

        # Memory Usage - using WMI/CIM only for reliability
        $totalMemory = 0
        $availableMemory = 0
        try {
            $os = Get-CimInstance -ClassName Win32_OperatingSystem
            $totalMemory = $os.TotalVisibleMemorySize * 1KB
            $availableMemory = $os.FreePhysicalMemory * 1KB
        } catch {
            try {
                $computer = Get-CimInstance Win32_ComputerSystem
                $totalMemory = $computer.TotalPhysicalMemory
                # Estimate available memory as 30% of total (fallback)
                $availableMemory = $totalMemory * 0.3
            } catch {
                $totalMemory = 8GB  # Default fallback
                $availableMemory = 4GB
            }
        }

        $usedMemory = $totalMemory - $availableMemory
        $memoryUsagePercent = if ($totalMemory -gt 0) { ($usedMemory / $totalMemory) * 100 } else { 0 }

        # Disk I/O - using WMI for basic disk stats
        $diskRead = 0
        $diskWrite = 0
        try {
            # Try performance counters first
            $diskCounters = Get-Counter "\PhysicalDisk(_Total)\Disk Read Bytes/sec", "\PhysicalDisk(_Total)\Disk Write Bytes/sec" -ErrorAction Stop
            $diskRead = ($diskCounters.CounterSamples | Where-Object {$_.Path -like "*Read*"}).CookedValue
            $diskWrite = ($diskCounters.CounterSamples | Where-Object {$_.Path -like "*Write*"}).CookedValue
        } catch {
            try {
                # Try Russian counters
                $diskCounters = Get-Counter "\Физический диск(_Total)\Байт чтений с диска/с", "\Физический диск(_Total)\Байт записей на диск/с" -ErrorAction Stop
                $diskRead = ($diskCounters.CounterSamples | Where-Object {$_.Path -like "*чтений*"}).CookedValue
                $diskWrite = ($diskCounters.CounterSamples | Where-Object {$_.Path -like "*записей*"}).CookedValue
            } catch {
                # Fallback - use WMI disk performance (basic estimation)
                try {
                    $disks = Get-CimInstance -ClassName Win32_PerfRawData_PerfDisk_PhysicalDisk | Where-Object { $_.Name -eq "_Total" }
                    if ($disks) {
                        $diskRead = $disks.DiskReadBytesPerSec * 1MB  # Rough estimation
                        $diskWrite = $disks.DiskWriteBytesPerSec * 1MB
                    }
                } catch {
                    # Final fallback - no disk metrics
                    $diskRead = 0
                    $diskWrite = 0
                }
            }
        }

        # Network I/O - simplified approach
        $networkSent = 0
        $networkReceived = 0
        try {
            # Try English network counters
            $networkCounters = Get-Counter "\Network Interface(*)\Bytes Sent/sec", "\Network Interface(*)\Bytes Received/sec" -ErrorAction Stop
            $networkSent = ($networkCounters.CounterSamples | Where-Object {$_.Path -like "*Sent*" -and $_.InstanceName -notlike "*Loopback*"}).CookedValue | Measure-Object -Sum | Select-Object -ExpandProperty Sum
            $networkReceived = ($networkCounters.CounterSamples | Where-Object {$_.Path -like "*Received*" -and $_.InstanceName -notlike "*Loopback*"}).CookedValue | Measure-Object -Sum | Select-Object -ExpandProperty Sum
            if ($null -eq $networkSent) { $networkSent = 0 }
            if ($null -eq $networkReceived) { $networkReceived = 0 }
        } catch {
            try {
                # Try Russian network counters
                $networkCounters = Get-Counter "\Сетевой интерфейс(*)\Байт отправлено/с", "\Сетевой интерфейс(*)\Байт получено/с" -ErrorAction Stop
                $networkSent = ($networkCounters.CounterSamples | Where-Object {$_.Path -like "*отправлено*" -and $_.InstanceName -notlike "*Loopback*"}).CookedValue | Measure-Object -Sum | Select-Object -ExpandProperty Sum
                $networkReceived = ($networkCounters.CounterSamples | Where-Object {$_.Path -like "*получено*" -and $_.InstanceName -notlike "*Loopback*"}).CookedValue | Measure-Object -Sum | Select-Object -ExpandProperty Sum
                if ($null -eq $networkSent) { $networkSent = 0 }
                if ($null -eq $networkReceived) { $networkReceived = 0 }
            } catch {
                # Fallback - use WMI network adapter stats (basic)
                try {
                    $adapters = Get-CimInstance -ClassName Win32_PerfRawData_Tcpip_NetworkInterface | Where-Object { $_.Name -notlike "*Loopback*" -and $_.Name -ne "NULL" }
                    $networkSent = ($adapters | Measure-Object -Property BytesSentPerSec -Sum).Sum
                    $networkReceived = ($adapters | Measure-Object -Property BytesReceivedPerSec -Sum).Sum
                } catch {
                    # Final fallback - no network metrics
                    $networkSent = 0
                    $networkReceived = 0
                }
            }
        }

        return @{
            Timestamp = $timestamp
            CPU = @{
                Usage = [math]::Round($cpuUsage, 2)
                Status = if ($cpuUsage -gt $Thresholds.CPU_CRITICAL) { "CRITICAL" }
                        elseif ($cpuUsage -gt $Thresholds.CPU_HIGH) { "HIGH" }
                        else { "NORMAL" }
            }
            Memory = @{
                Total = $totalMemory
                Used = $usedMemory
                Available = $availableMemory
                UsagePercent = [math]::Round($memoryUsagePercent, 2)
                UsageGB = [math]::Round($usedMemory / 1GB, 2)
                Status = if ($usedMemory -gt $Thresholds.MEMORY_CRITICAL) { "CRITICAL" }
                        elseif ($usedMemory -gt $Thresholds.MEMORY_HIGH) { "HIGH" }
                        else { "NORMAL" }
            }
            Disk = @{
                ReadBytesPerSec = $diskRead
                WriteBytesPerSec = $diskWrite
                ReadMBPerSec = [math]::Round($diskRead / 1MB, 2)
                WriteMBPerSec = [math]::Round($diskWrite / 1MB, 2)
                TotalIOPerSec = $diskRead + $diskWrite
                Status = if (($diskRead + $diskWrite) -gt $Thresholds.DISK_IO_HIGH) { "HIGH" } else { "NORMAL" }
            }
            Network = @{
                SentBytesPerSec = $networkSent
                ReceivedBytesPerSec = $networkReceived
                SentMBPerSec = [math]::Round($networkSent / 1MB, 2)
                ReceivedMBPerSec = [math]::Round($networkReceived / 1MB, 2)
                TotalBandwidthPerSec = $networkSent + $networkReceived
                Status = if (($networkSent + $networkReceived) -gt $Thresholds.NETWORK_HIGH) { "HIGH" } else { "NORMAL" }
            }
        }
    } catch {
        Write-Warning "Error collecting system metrics: $($_.Exception.Message)"
        return $null
    }
}

function Get-ProcessMetrics {
    param([string]$ProcessName)

    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if (-not $processes) {
        return $null
    }

    $processMetrics = @()
    foreach ($process in $processes) {
        $processMetrics += @{
            ProcessId = $process.Id
            ProcessName = $process.ProcessName
            CPUTime = $process.TotalProcessorTime.TotalSeconds
            WorkingSet = $process.WorkingSet64
            WorkingSetMB = [math]::Round($process.WorkingSet64 / 1MB, 2)
            PrivateMemorySize = $process.PrivateMemorySize64
            PrivateMemoryMB = [math]::Round($process.PrivateMemorySize64 / 1MB, 2)
            HandleCount = $process.HandleCount
            ThreadCount = $process.Threads.Count
            StartTime = $process.StartTime
            Status = if ($process.WorkingSet64 -gt 500MB) { "HIGH_MEMORY" } else { "NORMAL" }
        }
    }

    return $processMetrics
}

function Test-Alerts {
    param($Metrics)

    $alerts = @()

    if ($Metrics.CPU.Status -eq "CRITICAL") {
        $alerts += "🔥 CRITICAL: CPU usage at $($Metrics.CPU.Usage)%"
    } elseif ($Metrics.CPU.Status -eq "HIGH") {
        $alerts += "⚠️ WARNING: CPU usage at $($Metrics.CPU.Usage)%"
    }

    if ($Metrics.Memory.Status -eq "CRITICAL") {
        $alerts += "🔥 CRITICAL: Memory usage at $($Metrics.Memory.UsageGB)GB"
    } elseif ($Metrics.Memory.Status -eq "HIGH") {
        $alerts += "⚠️ WARNING: Memory usage at $($Metrics.Memory.UsageGB)GB"
    }

    if ($Metrics.Disk.Status -eq "HIGH") {
        $totalDiskIO = $Metrics.Disk.ReadMBPerSec + $Metrics.Disk.WriteMBPerSec
        $alerts += "⚠️ WARNING: High disk I/O at $([math]::Round($totalDiskIO, 2))MB/s"
    }

    if ($Metrics.Network.Status -eq "HIGH") {
        $totalNetworkIO = $Metrics.Network.SentMBPerSec + $Metrics.Network.ReceivedMBPerSec
        $alerts += "⚠️ WARNING: High network usage at $([math]::Round($totalNetworkIO, 2))MB/s"
    }

    return $alerts
}

function Format-Output {
    param($Metrics, $ProcessMetrics, $Format)

    switch ($Format) {
        "JSON" {
            $output = @{
                SystemMetrics = $Metrics
                ProcessMetrics = $ProcessMetrics
            }
            return ($output | ConvertTo-Json -Depth 4)
        }
        "CSV" {
            $csvData = [PSCustomObject]@{
                Timestamp = $Metrics.Timestamp
                CPU_Usage = $Metrics.CPU.Usage
                CPU_Status = $Metrics.CPU.Status
                Memory_UsageGB = $Metrics.Memory.UsageGB
                Memory_Status = $Metrics.Memory.Status
                Disk_ReadMBps = $Metrics.Disk.ReadMBPerSec
                Disk_WriteMBps = $Metrics.Disk.WriteMBPerSec
                Disk_Status = $Metrics.Disk.Status
                Network_SentMBps = $Metrics.Network.SentMBPerSec
                Network_ReceivedMBps = $Metrics.Network.ReceivedMBPerSec
                Network_Status = $Metrics.Network.Status
            }
            return ($csvData | ConvertTo-Csv -NoTypeInformation)
        }
        "TABLE" {
            $output = @"
⏰ Timestamp: $($Metrics.Timestamp)
🖥️  CPU: $($Metrics.CPU.Usage)% [$($Metrics.CPU.Status)]
🧠 Memory: $($Metrics.Memory.UsageGB)GB / $([math]::Round($Metrics.Memory.Total / 1GB, 2))GB [$($Metrics.Memory.Status)]
💾 Disk I/O: R:$($Metrics.Disk.ReadMBPerSec)MB/s W:$($Metrics.Disk.WriteMBPerSec)MB/s [$($Metrics.Disk.Status)]
🌐 Network: ↑$($Metrics.Network.SentMBPerSec)MB/s ↓$($Metrics.Network.ReceivedMBPerSec)MB/s [$($Metrics.Network.Status)]
"@
            if ($ProcessMetrics) {
                $output += "`n📊 Process Metrics:"
                foreach ($proc in $ProcessMetrics) {
                    $output += "`n  PID:$($proc.ProcessId) - $($proc.ProcessName) - $($proc.WorkingSetMB)MB [$($proc.Status)]"
                }
            }
            return $output
        }
    }
}

function Write-LogEntry {
    param($LogPath, $Metrics, $ProcessMetrics)

    try {
        $logEntry = @{
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            SystemMetrics = $Metrics
            ProcessMetrics = $ProcessMetrics
        }

        $logJson = $logEntry | ConvertTo-Json -Depth 4 -Compress
        Add-Content -Path $LogPath -Value $logJson -Encoding UTF8
    } catch {
        Write-Warning "Failed to write log entry: $($_.Exception.Message)"
    }
}

# Main execution
try {
    Initialize-LogDirectory

    Write-ColorOutput "🚀 Starting Performance Monitor v2.2" "Success"
    Write-ColorOutput "📊 Monitoring Configuration:" "Info"
    Write-ColorOutput "   • Process: $(if ($ProcessName) { $ProcessName } else { 'All System' })" "Info"
    Write-ColorOutput "   • Interval: $IntervalSeconds seconds" "Info"
    Write-ColorOutput "   • Duration: $DurationMinutes minutes" "Info"
    Write-ColorOutput "   • Output: $OutputFormat" "Info"
    Write-ColorOutput "   • Log File: $LogFile" "Info"
    Write-ColorOutput "" "Info"

    $startTime = Get-Date
    $endTime = $startTime.AddMinutes($DurationMinutes)
    $iteration = 0
    $totalAlerts = 0

    while ((Get-Date) -lt $endTime) {
        $iteration++

        # Collect system metrics
        $systemMetrics = Get-SystemMetrics
        if (-not $systemMetrics) {
            Write-ColorOutput "❌ Failed to collect system metrics" "Error"
            Start-Sleep -Seconds $IntervalSeconds
            continue
        }

        # Collect process metrics if specified
        $processMetrics = $null
        if ($ProcessName) {
            $processMetrics = Get-ProcessMetrics -ProcessName $ProcessName
            if (-not $processMetrics) {
                Write-ColorOutput "⚠️ Process '$ProcessName' not found" "Warning"
            }
        }

        # Check for alerts
        $alerts = Test-Alerts -Metrics $systemMetrics
        if ($alerts.Count -gt 0) {
            $totalAlerts += $alerts.Count
            Write-ColorOutput "🚨 ALERTS DETECTED:" "Error"
            foreach ($alert in $alerts) {
                Write-ColorOutput "   $alert" "Error"
            }
            Write-ColorOutput "" "Info"
        }

        # Output metrics
        $output = Format-Output -Metrics $systemMetrics -ProcessMetrics $processMetrics -Format $OutputFormat

        if (-not $Silent) {
            Write-ColorOutput "📈 Iteration $iteration - $(Get-Date -Format 'HH:mm:ss')" "Info"
            Write-Host $output
            Write-ColorOutput ("-" * 80) "Info"
        }

        # Write to log
        Write-LogEntry -LogPath $LogFile -Metrics $systemMetrics -ProcessMetrics $processMetrics

        # Wait for next iteration
        if ((Get-Date) -lt $endTime) {
            Start-Sleep -Seconds $IntervalSeconds
        }
    }

    Write-ColorOutput "✅ Monitoring completed!" "Success"
    Write-ColorOutput "📊 Summary:" "Info"
    Write-ColorOutput "   • Total iterations: $iteration" "Info"
    Write-ColorOutput "   • Total alerts: $totalAlerts" "Info"
    Write-ColorOutput "   • Log file: $LogFile" "Info"

} catch {
    Write-ColorOutput "💥 Critical error in performance monitor: $($_.Exception.Message)" "Error"
    Write-ColorOutput "Stack trace: $($_.ScriptStackTrace)" "Error"
    exit 1
}
