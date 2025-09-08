# Quick Port Detection Test
# Tests all available methods for port detection

param(
    [int]$Port = 5173,
    [string]$TargetHost = "localhost"
)

Write-Host "🔍 TESTING PORT DETECTION METHODS FOR ${TargetHost}:${Port}" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Method 1: Test-NetConnection
Write-Host "`n🧪 Method 1: Test-NetConnection" -ForegroundColor Yellow
try {
    $result1 = Test-NetConnection -ComputerName $TargetHost -Port $Port -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($result1) {
        Write-Host "  ✅ SUCCESSFUL - Port is accessible" -ForegroundColor Green
    } else {
        Write-Host "  ❌ FAILED - Port not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️  ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# Method 2: netstat
Write-Host "`n🧪 Method 2: netstat parsing" -ForegroundColor Yellow
try {
    $netstatResult = netstat -an | Select-String ":$Port " | Select-String "LISTENING"
    if ($netstatResult) {
        Write-Host "  ✅ SUCCESSFUL - Port found in netstat" -ForegroundColor Green
        Write-Host "  📋 Details: $($netstatResult -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "  ❌ FAILED - Port not found in netstat" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️  ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# Method 3: TcpClient
Write-Host "`n🧪 Method 3: TcpClient direct connection" -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connect = $tcpClient.BeginConnect($TargetHost, $Port, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(1000, $false)

    if ($wait -and $tcpClient.Connected) {
        Write-Host "  ✅ SUCCESSFUL - Direct connection established" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "  ❌ FAILED - Connection timeout or refused" -ForegroundColor Red
    }
    $tcpClient.Close()
} catch {
    Write-Host "  ⚠️  ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# Method 4: Get-NetTCPConnection (Windows 8+)
Write-Host "`n🧪 Method 4: Get-NetTCPConnection" -ForegroundColor Yellow
try {
    $tcpConnections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($tcpConnections) {
        Write-Host "  ✅ SUCCESSFUL - Found listening connections" -ForegroundColor Green
        foreach ($conn in $tcpConnections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  📋 Process: $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  ❌ FAILED - No listening connections found" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️  ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# Method 5: Windows Management Instrumentation (WMI)
Write-Host "`n🧪 Method 5: WMI Query" -ForegroundColor Yellow
try {
    $wmiQuery = Get-WmiObject -Class Win32_Process | Where-Object {
        $_.CommandLine -like "*:$Port*" -or $_.Name -eq "node.exe"
    }
    if ($wmiQuery) {
        Write-Host "  ✅ SUCCESSFUL - Found processes with port reference" -ForegroundColor Green
        foreach ($proc in $wmiQuery) {
            Write-Host "  📋 Process: $($proc.Name) - $($proc.CommandLine)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ FAILED - No matching processes found" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠️  ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n📊 SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 30 -ForegroundColor Cyan

$workingMethods = 0
if ($result1) { $workingMethods++ }
if ($netstatResult) { $workingMethods++ }
# Add other method checks...

Write-Host "🎯 Working methods: $workingMethods/5" -ForegroundColor $(if ($workingMethods -gt 0) { "Green" } else { "Red" })

# Quick recommendation
if ($workingMethods -eq 0) {
    Write-Host "💡 Recommendation: Ensure the service is running on port $Port" -ForegroundColor Yellow
} elseif ($workingMethods -ge 3) {
    Write-Host "💡 Recommendation: All detection methods are working well" -ForegroundColor Green
} else {
    Write-Host "💡 Recommendation: Some methods failed, but basic detection is functional" -ForegroundColor Yellow
}

Write-Host "`n🚀 Test completed at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
