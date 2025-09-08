# Get available performance counters for debugging
Write-Host "🔍 Analyzing available performance counters..." -ForegroundColor Cyan

# Get all processor-related counters
Write-Host "`n🖥️ Processor Counters:" -ForegroundColor Yellow
try {
    $processorCounters = Get-Counter -ListSet "*Процессор*" 2>$null
    if ($processorCounters) {
        foreach ($set in $processorCounters) {
            Write-Host "  Set: $($set.CounterSetName)" -ForegroundColor Green
            $set.Paths | Select-Object -First 5 | ForEach-Object { Write-Host "    $_" -ForegroundColor White }
        }
    }

    # Try English version
    $processorCountersEn = Get-Counter -ListSet "*Processor*" 2>$null
    if ($processorCountersEn) {
        Write-Host "`nEnglish Processor Counters:" -ForegroundColor Yellow
        foreach ($set in $processorCountersEn) {
            Write-Host "  Set: $($set.CounterSetName)" -ForegroundColor Green
            $set.Paths | Select-Object -First 5 | ForEach-Object { Write-Host "    $_" -ForegroundColor White }
        }
    }
} catch {
    Write-Host "  ❌ Error getting processor counters: $($_.Exception.Message)" -ForegroundColor Red
}

# Get memory counters
Write-Host "`n🧠 Memory Counters:" -ForegroundColor Yellow
try {
    $memoryCounters = Get-Counter -ListSet "*Память*", "*Memory*" 2>$null
    foreach ($set in $memoryCounters) {
        Write-Host "  Set: $($set.CounterSetName)" -ForegroundColor Green
        $set.Paths | Select-Object -First 3 | ForEach-Object { Write-Host "    $_" -ForegroundColor White }
    }
} catch {
    Write-Host "  ❌ Error getting memory counters: $($_.Exception.Message)" -ForegroundColor Red
}

# Get disk counters
Write-Host "`n💾 Disk Counters:" -ForegroundColor Yellow
try {
    $diskCounters = Get-Counter -ListSet "*Диск*", "*Disk*" 2>$null
    foreach ($set in $diskCounters) {
        Write-Host "  Set: $($set.CounterSetName)" -ForegroundColor Green
        $set.Paths | Select-Object -First 3 | ForEach-Object { Write-Host "    $_" -ForegroundColor White }
    }
} catch {
    Write-Host "  ❌ Error getting disk counters: $($_.Exception.Message)" -ForegroundColor Red
}

# Get network counters
Write-Host "`n🌐 Network Counters:" -ForegroundColor Yellow
try {
    $networkCounters = Get-Counter -ListSet "*Сеть*", "*Network*" 2>$null
    foreach ($set in $networkCounters) {
        Write-Host "  Set: $($set.CounterSetName)" -ForegroundColor Green
        $set.Paths | Select-Object -First 3 | ForEach-Object { Write-Host "    $_" -ForegroundColor White }
    }
} catch {
    Write-Host "  ❌ Error getting network counters: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Counter analysis complete!" -ForegroundColor Green
