# Enhanced Terminal Status Monitor with Improved Port Detection
# Version: 2.0
# Features: Cross-platform compatibility, multiple detection methods, performance optimization

param(
    [switch]$Once = $false,
    [int]$RefreshInterval = 3,
    [switch]$Verbose = $false
)

function Test-PortWithMultipleMethods {
    param(
        [string]$ComputerName = "localhost",
        [int]$Port,
        [string]$Description = ""
    )

    $results = @()
    $successCount = 0

    # Method 1: Test-NetConnection (Primary)
    try {
        $tcResult = Test-NetConnection -ComputerName $ComputerName -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($tcResult) {
            $results += "✅ Test-NetConnection: SUCCESS"
            $successCount++
        } else {
            $results += "❌ Test-NetConnection: FAILED"
        }
    } catch {
        $results += "⚠️ Test-NetConnection: ERROR - $($_.Exception.Message)"
    }

    # Method 2: netstat parsing (Secondary)
    try {
        $netstatResult = netstat -an | Select-String ":$Port.*LISTENING"
        if ($netstatResult) {
            $results += "✅ netstat: SUCCESS"
            $successCount++
        } else {
            $results += "❌ netstat: No listening port"
        }
    } catch {
        $results += "⚠️ netstat: ERROR - $($_.Exception.Message)"
    }

    # Method 3: Get-NetTCPConnection (Modern PowerShell)
    try {
        $netTcpResult = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($netTcpResult) {
            $results += "✅ Get-NetTCPConnection: SUCCESS"
            $successCount++
        } else {
            $results += "❌ Get-NetTCPConnection: No connections"
        }
    } catch {
        $results += "⚠️ Get-NetTCPConnection: ERROR"
    }

    # Determine overall status
    $status = if ($successCount -ge 2) { "🟢 ACTIVE" } elseif ($successCount -eq 1) { "🟡 PARTIAL" } else { "🔴 STOPPED" }

    return @{
        Status = $status
        SuccessCount = $successCount
        TotalMethods = 3
        Results = $results
        Description = $Description
    }
}

function Get-EnhancedProcessInfo {
    param([string]$ProcessName)

    try {
        $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($processes) {
            $totalMemory = ($processes | Measure-Object WorkingSet -Sum).Sum / 1MB
            $processCount = $processes.Count
            $totalCPU = ($processes | Measure-Object CPU -Sum).Sum

            return @{
                Status = "✅ Active"
                Count = $processCount
                Memory = "{0:N1} MB" -f $totalMemory
                CPU = "{0:N2}s" -f $totalCPU
                Found = $true
            }
        } else {
            return @{
                Status = "❌ Stopped"
                Count = 0
                Memory = "0 MB"
                CPU = "0s"
                Found = $false
            }
        }
    } catch {
        return @{
            Status = "⚠️ Error"
            Count = 0
            Memory = "Unknown"
            CPU = "Unknown"
            Found = $false
        }
    }
}

function Show-EnhancedSystemStatus {
    Clear-Host

    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "🖥️ SHINOMONTAGKA ENHANCED DEVELOPMENT MONITOR" -ForegroundColor Cyan
    Write-Host "⏰ Last Updated: $timestamp" -ForegroundColor Gray
    Write-Host ("=" * 80) -ForegroundColor Gray
    Write-Host ""

    # Process Status
    Write-Host "📋 PROCESS STATUS:" -ForegroundColor Yellow

    $nodeInfo = Get-EnhancedProcessInfo -ProcessName "node"
    $chromeInfo = Get-EnhancedProcessInfo -ProcessName "chrome"
    $codeInfo = Get-EnhancedProcessInfo -ProcessName "Code"
    $powershellInfo = Get-EnhancedProcessInfo -ProcessName "powershell"

    Write-Host "  🔧 node: $($nodeInfo.Status) [$($nodeInfo.Count) processes, $($nodeInfo.Memory), CPU: $($nodeInfo.CPU)]" -ForegroundColor $(if($nodeInfo.Found){"Green"}else{"Red"})
    Write-Host "  🔧 chrome: $($chromeInfo.Status) [$($chromeInfo.Count) processes, $($chromeInfo.Memory), CPU: $($chromeInfo.CPU)]" -ForegroundColor $(if($chromeInfo.Found){"Green"}else{"Red"})
    Write-Host "  🔧 Code: $($codeInfo.Status) [$($codeInfo.Count) processes, $($codeInfo.Memory), CPU: $($codeInfo.CPU)]" -ForegroundColor $(if($codeInfo.Found){"Green"}else{"Red"})
    Write-Host "  🔧 powershell: $($powershellInfo.Status) [$($powershellInfo.Count) processes, $($powershellInfo.Memory), CPU: $($powershellInfo.CPU)]" -ForegroundColor $(if($powershellInfo.Found){"Green"}else{"Red"})
    Write-Host ""

    # Development Servers with Enhanced Detection
    Write-Host "🚀 DEVELOPMENT SERVERS:" -ForegroundColor Yellow

    $viteResult = Test-PortWithMultipleMethods -Port 5173 -Description "Vite Dev Server"
    $previewResult = Test-PortWithMultipleMethods -Port 4173 -Description "Vite Preview Server"

    Write-Host "  📦 Vite (5173): $($viteResult.Status)" -ForegroundColor $(if($viteResult.Status -like "*ACTIVE*"){"Green"}elseif($viteResult.Status -like "*PARTIAL*"){"Yellow"}else{"Red"})
    Write-Host "  👁️  Preview (4173): $($previewResult.Status)" -ForegroundColor $(if($previewResult.Status -like "*ACTIVE*"){"Green"}elseif($previewResult.Status -like "*PARTIAL*"){"Yellow"}else{"Red"})

    if ($Verbose) {
        Write-Host ""
        Write-Host "🔍 DETAILED PORT DETECTION:" -ForegroundColor Magenta
        Write-Host "  Vite (5173) - Success: $($viteResult.SuccessCount)/$($viteResult.TotalMethods)" -ForegroundColor Gray
        foreach ($result in $viteResult.Results) {
            Write-Host "    $result" -ForegroundColor Gray
        }
        Write-Host "  Preview (4173) - Success: $($previewResult.SuccessCount)/$($previewResult.TotalMethods)" -ForegroundColor Gray
        foreach ($result in $previewResult.Results) {
            Write-Host "    $result" -ForegroundColor Gray
        }
    }

    Write-Host ""

    # System Memory (Enhanced with error handling)
    try {
        $memory = Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction SilentlyContinue
        if ($memory) {
            $totalMemoryGB = [math]::Round($memory.TotalPhysicalMemory / 1GB, 1)
            Write-Host "💾 SYSTEM MEMORY: $totalMemoryGB GB Total" -ForegroundColor Cyan
        } else {
            Write-Host "💾 SYSTEM MEMORY: Unable to retrieve" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "💾 SYSTEM MEMORY: Error retrieving information" -ForegroundColor Red
    }

    if (-not $Once) {
        Write-Host ""
        Write-Host "$timestamp - Next refresh in $RefreshInterval seconds..." -ForegroundColor Gray
        if ($Verbose) {
            Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor DarkGray
        }
    }
}

# Main execution
if ($Once) {
    Show-EnhancedSystemStatus
} else {
    Write-Host "🚀 Starting Enhanced Development Monitor..." -ForegroundColor Green
    Write-Host "📊 Refresh interval: $RefreshInterval seconds" -ForegroundColor Gray
    Write-Host "🔧 Use -Verbose for detailed port detection info" -ForegroundColor Gray
    Write-Host "🛑 Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""

    try {
        while ($true) {
            Show-EnhancedSystemStatus
            Start-Sleep -Seconds $RefreshInterval
        }
    } catch {
        Write-Host ""
        Write-Host "🛑 Monitor stopped by user" -ForegroundColor Yellow
    }
}
