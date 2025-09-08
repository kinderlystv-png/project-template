param(
    [int]$RefreshSeconds = 5,
    [array]$MonitorPorts = @(5173, 3000, 8080, 4173),
    [switch]$Detailed = $false,
    [switch]$Quiet = $false
)

# Расширенный скрипт мониторинга с улучшенной детекцией портов
if (-not $Quiet) {
    Write-Host "🖥️  ENHANCED MONITORING - PORT DETECTION OPTIMIZATION" -ForegroundColor Cyan
    Write-Host "⏱️  Refresh: $RefreshSeconds sec | Ports: $($MonitorPorts -join ', ')" -ForegroundColor Yellow
    Write-Host "⛔ Ctrl+C to stop | Use -Detailed for verbose output" -ForegroundColor Red
    Write-Host ("=" * 90) -ForegroundColor Cyan
}

function Test-PortAdvanced {
    param(
        [int]$Port,
        [string]$ComputerName = "localhost"
    )

    $result = @{
        Port = $Port
        IsListening = $false
        ProcessName = ""
        ProcessId = 0
        Method = ""
        Error = ""
    }

    try {
        # Method 1: Test-NetConnection (Windows 8+)
        if (Get-Command Test-NetConnection -ErrorAction SilentlyContinue) {
            $tcpTest = Test-NetConnection -ComputerName $ComputerName -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
            if ($tcpTest) {
                $result.IsListening = $true
                $result.Method = "Test-NetConnection"
            }
        }

        # Method 2: netstat parsing (fallback for older systems)
        if (-not $result.IsListening) {
            $netstatOutput = netstat -an 2>$null | Select-String ":$Port\s.*LISTENING"
            if ($netstatOutput) {
                $result.IsListening = $true
                $result.Method = "netstat"
            }
        }

        # Method 3: Direct TCP connection test
        if (-not $result.IsListening) {
            try {
                $tcpClient = New-Object System.Net.Sockets.TcpClient
                $connection = $tcpClient.BeginConnect($ComputerName, $Port, $null, $null)
                $wait = $connection.AsyncWaitHandle.WaitOne(1000, $false)
                if ($wait) {
                    $tcpClient.EndConnect($connection)
                    $result.IsListening = $true
                    $result.Method = "TcpClient"
                }
                $tcpClient.Close()
            }
            catch {
                # Port is not listening
            }
        }

        # Get process information if port is listening
        if ($result.IsListening) {
            try {
                $processInfo = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($processInfo) {
                    $process = Get-Process -Id $processInfo.OwningProcess -ErrorAction SilentlyContinue
                    if ($process) {
                        $result.ProcessName = $process.ProcessName
                        $result.ProcessId = $process.Id
                    }
                }
            }
            catch {
                # Try alternative method with netstat
                try {
                    $netstatPID = netstat -ano | Select-String ":$Port\s.*LISTENING" | Select-Object -First 1
                    if ($netstatPID) {
                        $pidMatch = [regex]::Match($netstatPID.ToString(), '\s+(\d+)$')
                        if ($pidMatch.Success) {
                            $pid = [int]$pidMatch.Groups[1].Value
                            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                            if ($process) {
                                $result.ProcessName = $process.ProcessName
                                $result.ProcessId = $pid
                            }
                        }
                    }
                }
                catch {
                    $result.Error = "Could not determine process"
                }
            }
        }
    }
    catch {
        $result.Error = $_.Exception.Message
    }

    return $result
}

function Get-ProcessInfoAdvanced {
    param($ProcessName)
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($processes) {
        $totalMemory = ($processes | Measure-Object WorkingSet -Sum).Sum
        $cpuTime = ($processes | Measure-Object CPU -Sum -ErrorAction SilentlyContinue).Sum

        return @{
            Count = $processes.Count
            MemoryMB = [math]::Round($totalMemory / 1MB, 1)
            CPUTime = if ($cpuTime) { [math]::Round($cpuTime, 2) } else { 0 }
            Status = "✅ Active"
            Color = "Green"
            PIDs = $processes.Id -join ", "
        }
    } else {
        return @{
            Count = 0
            MemoryMB = 0
            CPUTime = 0
            Status = "❌ Stopped"
            Color = "Red"
            PIDs = ""
        }
    }
}

function Get-SystemMetrics {
    try {
        $cpu = Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average
        $memory = Get-CimInstance Win32_OperatingSystem
        $memoryUsed = $memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory
        $memoryPercent = [math]::Round(($memoryUsed / $memory.TotalVisibleMemorySize) * 100, 1)

        return @{
            CPUUsage = [math]::Round($cpu.Average, 1)
            MemoryPercent = $memoryPercent
            MemoryUsedGB = [math]::Round($memoryUsed / 1MB, 1)
            MemoryTotalGB = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 1)
        }
    }
    catch {
        return @{
            CPUUsage = 0
            MemoryPercent = 0
            MemoryUsedGB = 0
            MemoryTotalGB = 0
        }
    }
}

# Main monitoring loop
while ($true) {
    if (-not $Quiet) { Clear-Host }

    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

    if (-not $Quiet) {
        Write-Host "🕒 $timestamp - ENHANCED SYSTEM MONITORING" -ForegroundColor Cyan
        Write-Host ("=" * 90) -ForegroundColor Cyan
    }

    # System metrics
    $systemMetrics = Get-SystemMetrics
    if (-not $Quiet) {
        Write-Host "`n📊 SYSTEM METRICS:" -ForegroundColor Yellow
        Write-Host "  🖥️  CPU Usage: $($systemMetrics.CPUUsage)%" -ForegroundColor $(if ($systemMetrics.CPUUsage -gt 80) { "Red" } elseif ($systemMetrics.CPUUsage -gt 60) { "Yellow" } else { "Green" })
        Write-Host "  🧠 Memory: $($systemMetrics.MemoryUsedGB)/$($systemMetrics.MemoryTotalGB) GB ($($systemMetrics.MemoryPercent)%)" -ForegroundColor $(if ($systemMetrics.MemoryPercent -gt 80) { "Red" } elseif ($systemMetrics.MemoryPercent -gt 60) { "Yellow" } else { "Green" })
    }

    # Enhanced port monitoring
    if (-not $Quiet) {
        Write-Host "`n🔌 PORT STATUS (Enhanced Detection):" -ForegroundColor Yellow
    }

    foreach ($port in $MonitorPorts) {
        $portInfo = Test-PortAdvanced -Port $port
        $status = if ($portInfo.IsListening) { "🟢 LISTENING" } else { "🔴 CLOSED" }
        $color = if ($portInfo.IsListening) { "Green" } else { "Red" }

        if (-not $Quiet) {
            Write-Host "  📡 Port $($port): " -NoNewline
            Write-Host "$status" -ForegroundColor $color -NoNewline

            if ($portInfo.IsListening -and $portInfo.ProcessName) {
                Write-Host " [$($portInfo.ProcessName):$($portInfo.ProcessId)]" -ForegroundColor Gray -NoNewline
            }

            if ($Detailed -and $portInfo.Method) {
                Write-Host " [$($portInfo.Method)]" -ForegroundColor DarkGray -NoNewline
            }

            if ($portInfo.Error) {
                Write-Host " [Error: $($portInfo.Error)]" -ForegroundColor Yellow -NoNewline
            }

            Write-Host ""
        }
    }

    # Enhanced process monitoring
    if (-not $Quiet) {
        Write-Host "`n📋 PROCESS STATUS:" -ForegroundColor Yellow
    }

    $processesToMonitor = @("node", "chrome", "Code", "powershell")
    foreach ($processName in $processesToMonitor) {
        $processInfo = Get-ProcessInfoAdvanced -ProcessName $processName
        if (-not $Quiet) {
            Write-Host "  🔧 $($processName): " -NoNewline
            Write-Host "$($processInfo.Status)" -ForegroundColor $processInfo.Color -NoNewline

            if ($processInfo.Count -gt 0) {
                Write-Host " [$($processInfo.Count) processes, $($processInfo.MemoryMB) MB" -ForegroundColor Gray -NoNewline
                if ($processInfo.CPUTime -gt 0) {
                    Write-Host ", CPU: $($processInfo.CPUTime)s" -ForegroundColor Gray -NoNewline
                }
                Write-Host "]" -ForegroundColor Gray

                if ($Detailed -and $processInfo.PIDs) {
                    Write-Host "    PIDs: $($processInfo.PIDs)" -ForegroundColor DarkGray
                }
            } else {
                Write-Host ""
            }
        }
    }

    # Development server specific checks
    if (-not $Quiet) {
        Write-Host "`n🚀 DEVELOPMENT SERVERS:" -ForegroundColor Yellow

        # Vite dev server check
        $vitePort = Test-PortAdvanced -Port 5173
        Write-Host "  📦 Vite (5173): " -NoNewline
        if ($vitePort.IsListening) {
            Write-Host "🟢 RUNNING" -ForegroundColor Green -NoNewline
            Write-Host " [http://localhost:5173]" -ForegroundColor Cyan
        } else {
            Write-Host "🔴 STOPPED" -ForegroundColor Red
        }

        # Preview server check
        $previewPort = Test-PortAdvanced -Port 4173
        Write-Host "  👁️  Preview (4173): " -NoNewline
        if ($previewPort.IsListening) {
            Write-Host "🟢 RUNNING" -ForegroundColor Green -NoNewline
            Write-Host " [http://localhost:4173]" -ForegroundColor Cyan
        } else {
            Write-Host "🔴 STOPPED" -ForegroundColor Red
        }
    }

    if (-not $Quiet) {
        Write-Host "`n$(Get-Date -Format 'HH:mm:ss') - Next refresh in $RefreshSeconds seconds..." -ForegroundColor DarkGray
    }

    Start-Sleep -Seconds $RefreshSeconds
}
