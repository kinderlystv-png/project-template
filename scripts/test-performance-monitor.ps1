# Quick test script for performance monitoring
Write-Host "🚀 Testing Performance Monitor Components..." -ForegroundColor Green

# Test 1: Basic system info
Write-Host "`n📊 Test 1: Basic System Information" -ForegroundColor Cyan
try {
    $os = Get-CimInstance -ClassName Win32_OperatingSystem
    $totalMemory = $os.TotalVisibleMemorySize * 1KB
    $availableMemory = $os.FreePhysicalMemory * 1KB
    $usedMemory = $totalMemory - $availableMemory

    Write-Host "  ✅ Total Memory: $([math]::Round($totalMemory / 1GB, 2)) GB" -ForegroundColor Green
    Write-Host "  ✅ Used Memory: $([math]::Round($usedMemory / 1GB, 2)) GB" -ForegroundColor Green
    Write-Host "  ✅ Available Memory: $([math]::Round($availableMemory / 1GB, 2)) GB" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: CPU usage
Write-Host "`n🖥️  Test 2: CPU Performance Counter" -ForegroundColor Cyan
try {
    $cpuUsage = (Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 1).CounterSamples.CookedValue
    Write-Host "  ✅ CPU Usage: $([math]::Round($cpuUsage, 2))%" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  English counter failed, trying fallback..." -ForegroundColor Yellow
    try {
        $cpuUsage = (Get-CimInstance -ClassName Win32_Processor | Measure-Object -Property LoadPercentage -Average).Average
        if ($null -eq $cpuUsage) { $cpuUsage = 0 }
        Write-Host "  ✅ CPU Usage (fallback): $cpuUsage%" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Disk I/O
Write-Host "`n💾 Test 3: Disk I/O Counters" -ForegroundColor Cyan
try {
    $diskCounters = Get-Counter "\PhysicalDisk(_Total)\Disk Read Bytes/sec", "\PhysicalDisk(_Total)\Disk Write Bytes/sec"
    $diskRead = ($diskCounters.CounterSamples | Where-Object {$_.Path -like "*Read*"}).CookedValue
    $diskWrite = ($diskCounters.CounterSamples | Where-Object {$_.Path -like "*Write*"}).CookedValue

    Write-Host "  ✅ Disk Read: $([math]::Round($diskRead / 1MB, 2)) MB/s" -ForegroundColor Green
    Write-Host "  ✅ Disk Write: $([math]::Round($diskWrite / 1MB, 2)) MB/s" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Network I/O
Write-Host "`n🌐 Test 4: Network Counters" -ForegroundColor Cyan
try {
    $networkCounters = Get-Counter "\Network Interface(*)\Bytes Sent/sec", "\Network Interface(*)\Bytes Received/sec"
    $networkSent = ($networkCounters.CounterSamples | Where-Object {$_.Path -like "*Sent*" -and $_.InstanceName -notlike "*Loopback*"}).CookedValue | Measure-Object -Sum | Select-Object -ExpandProperty Sum
    $networkReceived = ($networkCounters.CounterSamples | Where-Object {$_.Path -like "*Received*" -and $_.InstanceName -notlike "*Loopback*"}).CookedValue | Measure-Object -Sum | Select-Object -ExpandProperty Sum

    if ($null -eq $networkSent) { $networkSent = 0 }
    if ($null -eq $networkReceived) { $networkReceived = 0 }

    Write-Host "  ✅ Network Sent: $([math]::Round($networkSent / 1MB, 2)) MB/s" -ForegroundColor Green
    Write-Host "  ✅ Network Received: $([math]::Round($networkReceived / 1MB, 2)) MB/s" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Hash table creation
Write-Host "`n📋 Test 5: Data Structure Creation" -ForegroundColor Cyan
try {
    $testMetrics = @{
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        CPU = @{
            Usage = 15.5
            Status = "NORMAL"
        }
        Memory = @{
            Total = 50GB
            Used = 20GB
            Available = 30GB
            UsagePercent = 40.0
            UsageGB = 20.0
            Status = "NORMAL"
        }
        Disk = @{
            ReadBytesPerSec = 1048576
            WriteBytesPerSec = 2097152
            ReadMBPerSec = 1.0
            WriteMBPerSec = 2.0
            TotalIOPerSec = 3145728
            Status = "NORMAL"
        }
        Network = @{
            SentBytesPerSec = 524288
            ReceivedBytesPerSec = 1048576
            SentMBPerSec = 0.5
            ReceivedMBPerSec = 1.0
            TotalBandwidthPerSec = 1572864
            Status = "NORMAL"
        }
    }

    Write-Host "  ✅ Hash table created successfully" -ForegroundColor Green
    Write-Host "  ✅ Keys: $($testMetrics.Keys -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Performance Monitor Component Test Complete!" -ForegroundColor Green
