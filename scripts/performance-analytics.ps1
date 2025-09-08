# ===================================================================================================
# PERFORMANCE ANALYTICS & REPORTING ENGINE
# Advanced analytics for performance metrics with trend analysis
# Created: September 8, 2025
# ===================================================================================================

param(
    [string]$LogFile = "logs\performance-metrics.log",
    [string]$ReportPath = "logs\performance-report.html",
    [switch]$GenerateReport,
    [switch]$ShowTrends,
    [switch]$AnalyzeAnomalies,
    [int]$TimeWindowHours = 24
)

# Import required modules
Add-Type -AssemblyName System.Web

function Import-PerformanceData {
    param([string]$LogPath)

    if (-not (Test-Path $LogPath)) {
        Write-Warning "Log file not found: $LogPath"
        return @()
    }

    $logContent = Get-Content $LogPath
    $metrics = @()

    foreach ($line in $logContent) {
        try {
            if ($line.StartsWith('{')) {
                # JSON format
                $metric = $line | ConvertFrom-Json
                $metrics += $metric
            } elseif ($line -match '\[(.*?)\].*CPU:(\d+\.?\d*)%.*MEM:(\d+\.?\d*)GB') {
                # Simple text format
                $timestamp = [DateTime]::Parse($matches[1])
                $cpu = [double]$matches[2]
                $memory = [double]$matches[3]

                $metrics += [PSCustomObject]@{
                    Timestamp = $timestamp.ToString("yyyy-MM-dd HH:mm:ss")
                    System = [PSCustomObject]@{
                        CPU = [PSCustomObject]@{ Usage = $cpu }
                        Memory = [PSCustomObject]@{ UsageGB = $memory }
                    }
                }
            }
        } catch {
            Write-Verbose "Skipped invalid log line: $line"
        }
    }

    return $metrics
}

function Analyze-PerformanceTrends {
    param($MetricsData)

    if ($MetricsData.Count -lt 2) {
        Write-Warning "Insufficient data for trend analysis"
        return $null
    }

    $cpuValues = @()
    $memoryValues = @()
    $timestamps = @()

    foreach ($metric in $MetricsData) {
        if ($metric.System) {
            $cpuValues += $metric.System.CPU.Usage
            $memoryValues += $metric.System.Memory.UsageGB
            $timestamps += [DateTime]::Parse($metric.Timestamp)
        }
    }

    # Calculate statistics
    $cpuStats = @{
        Average = ($cpuValues | Measure-Object -Average).Average
        Maximum = ($cpuValues | Measure-Object -Maximum).Maximum
        Minimum = ($cpuValues | Measure-Object -Minimum).Minimum
        StandardDeviation = [Math]::Sqrt((($cpuValues | ForEach-Object {[Math]::Pow($_ - ($cpuValues | Measure-Object -Average).Average, 2)}) | Measure-Object -Sum).Sum / $cpuValues.Count)
    }

    $memoryStats = @{
        Average = ($memoryValues | Measure-Object -Average).Average
        Maximum = ($memoryValues | Measure-Object -Maximum).Maximum
        Minimum = ($memoryValues | Measure-Object -Minimum).Minimum
        StandardDeviation = [Math]::Sqrt((($memoryValues | ForEach-Object {[Math]::Pow($_ - ($memoryValues | Measure-Object -Average).Average, 2)}) | Measure-Object -Sum).Sum / $memoryValues.Count)
    }

    # Trend analysis
    $timeSpan = $timestamps[-1] - $timestamps[0]
    $cpuTrend = if ($cpuValues[-1] -gt $cpuValues[0]) { "INCREASING" } elseif ($cpuValues[-1] -lt $cpuValues[0]) { "DECREASING" } else { "STABLE" }
    $memoryTrend = if ($memoryValues[-1] -gt $memoryValues[0]) { "INCREASING" } elseif ($memoryValues[-1] -lt $memoryValues[0]) { "DECREASING" } else { "STABLE" }

    return @{
        DataPoints = $MetricsData.Count
        TimeSpan = $timeSpan
        CPU = @{
            Stats = $cpuStats
            Trend = $cpuTrend
            TrendChange = [Math]::Round($cpuValues[-1] - $cpuValues[0], 2)
        }
        Memory = @{
            Stats = $memoryStats
            Trend = $memoryTrend
            TrendChange = [Math]::Round($memoryValues[-1] - $memoryValues[0], 2)
        }
    }
}

function Detect-PerformanceAnomalies {
    param($MetricsData, [double]$Threshold = 2.0)

    $anomalies = @()

    if ($MetricsData.Count -lt 10) {
        Write-Warning "Insufficient data for anomaly detection (need at least 10 data points)"
        return $anomalies
    }

    $cpuValues = $MetricsData | ForEach-Object { $_.System.CPU.Usage }
    $memoryValues = $MetricsData | ForEach-Object { $_.System.Memory.UsageGB }

    # Calculate moving averages and detect outliers
    for ($i = 5; $i -lt $MetricsData.Count; $i++) {
        $recentCpu = $cpuValues[($i-5)..$i] | Measure-Object -Average
        $recentMemory = $memoryValues[($i-5)..$i] | Measure-Object -Average

        $cpuDeviation = [Math]::Abs($cpuValues[$i] - $recentCpu.Average)
        $memoryDeviation = [Math]::Abs($memoryValues[$i] - $recentMemory.Average)

        if ($cpuDeviation -gt ($recentCpu.Average * 0.3)) {
            $anomalies += @{
                Timestamp = $MetricsData[$i].Timestamp
                Type = "CPU_SPIKE"
                Value = $cpuValues[$i]
                Expected = [Math]::Round($recentCpu.Average, 2)
                Deviation = [Math]::Round($cpuDeviation, 2)
                Severity = if ($cpuDeviation -gt ($recentCpu.Average * 0.5)) { "HIGH" } else { "MEDIUM" }
            }
        }

        if ($memoryDeviation -gt ($recentMemory.Average * 0.2)) {
            $anomalies += @{
                Timestamp = $MetricsData[$i].Timestamp
                Type = "MEMORY_SPIKE"
                Value = $memoryValues[$i]
                Expected = [Math]::Round($recentMemory.Average, 2)
                Deviation = [Math]::Round($memoryDeviation, 2)
                Severity = if ($memoryDeviation -gt ($recentMemory.Average * 0.4)) { "HIGH" } else { "MEDIUM" }
            }
        }
    }

    return $anomalies
}

function Generate-PerformanceReport {
    param($MetricsData, $TrendAnalysis, $Anomalies, $OutputPath)

    $reportDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Analysis Report</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 20px; margin-bottom: 30px; }
        .metric-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: 15px 0; border-radius: 10px; }
        .trend-up { color: #e74c3c; }
        .trend-down { color: #27ae60; }
        .trend-stable { color: #f39c12; }
        .anomaly-high { background: #e74c3c; color: white; padding: 10px; border-radius: 5px; margin: 5px 0; }
        .anomaly-medium { background: #f39c12; color: white; padding: 10px; border-radius: 5px; margin: 5px 0; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-box { background: #ecf0f1; padding: 15px; border-radius: 8px; text-align: center; }
        .chart-placeholder { background: #34495e; color: white; padding: 40px; text-align: center; border-radius: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Performance Analysis Report</h1>
            <p>Generated on: $reportDate</p>
            <p>Analysis Period: $($TrendAnalysis.TimeSpan.TotalHours.ToString("F1")) hours | Data Points: $($TrendAnalysis.DataPoints)</p>
        </div>

        <div class="metric-card">
            <h2>📊 Executive Summary</h2>
            <div class="stats-grid">
                <div class="stat-box">
                    <h3>CPU Performance</h3>
                    <p>Average: $([Math]::Round($TrendAnalysis.CPU.Stats.Average, 2))%</p>
                    <p>Peak: $([Math]::Round($TrendAnalysis.CPU.Stats.Maximum, 2))%</p>
                    <p class="trend-$(if($TrendAnalysis.CPU.Trend -eq 'INCREASING'){'up'}elseif($TrendAnalysis.CPU.Trend -eq 'DECREASING'){'down'}else{'stable'})">Trend: $($TrendAnalysis.CPU.Trend)</p>
                </div>
                <div class="stat-box">
                    <h3>Memory Usage</h3>
                    <p>Average: $([Math]::Round($TrendAnalysis.Memory.Stats.Average, 2))GB</p>
                    <p>Peak: $([Math]::Round($TrendAnalysis.Memory.Stats.Maximum, 2))GB</p>
                    <p class="trend-$(if($TrendAnalysis.Memory.Trend -eq 'INCREASING'){'up'}elseif($TrendAnalysis.Memory.Trend -eq 'DECREASING'){'down'}else{'stable'})">Trend: $($TrendAnalysis.Memory.Trend)</p>
                </div>
                <div class="stat-box">
                    <h3>System Health</h3>
                    <p>Anomalies: $($Anomalies.Count)</p>
                    <p>High Severity: $(($Anomalies | Where-Object {$_.Severity -eq 'HIGH'}).Count)</p>
                    <p>Status: $(if($Anomalies.Count -lt 5){'🟢 Good'}elseif($Anomalies.Count -lt 15){'🟡 Monitor'}else{'🔴 Attention'})</p>
                </div>
            </div>
        </div>

        <div class="metric-card">
            <h2>📈 Performance Trends</h2>
            <p><strong>CPU Usage Trend:</strong> $($TrendAnalysis.CPU.Trend) ($($TrendAnalysis.CPU.TrendChange)% change)</p>
            <p><strong>Memory Usage Trend:</strong> $($TrendAnalysis.Memory.Trend) ($($TrendAnalysis.Memory.TrendChange)GB change)</p>
            <div class="chart-placeholder">
                📊 Interactive charts would be displayed here<br>
                (CPU and Memory usage over time with trend lines)
            </div>
        </div>

        <div class="metric-card">
            <h2>🚨 Anomaly Detection Results</h2>
"@

    if ($Anomalies.Count -gt 0) {
        $html += "<p>Detected $($Anomalies.Count) performance anomalies:</p>"
        foreach ($anomaly in $Anomalies | Sort-Object Timestamp -Descending | Select-Object -First 10) {
            $cssClass = if ($anomaly.Severity -eq "HIGH") { "anomaly-high" } else { "anomaly-medium" }
            $html += "<div class='$cssClass'>"
            $html += "<strong>$($anomaly.Timestamp)</strong> - $($anomaly.Type): $($anomaly.Value) (expected ~$($anomaly.Expected), deviation: $($anomaly.Deviation)) - Severity: $($anomaly.Severity)"
            $html += "</div>"
        }
    } else {
        $html += "<p style='color: #27ae60;'><strong>✅ No significant anomalies detected during the monitoring period.</strong></p>"
    }

    $html += @"
        </div>

        <div class="metric-card">
            <h2>🔧 Recommendations</h2>
            <ul>
"@

    # Generate recommendations based on analysis
    if ($TrendAnalysis.CPU.Stats.Average -gt 70) {
        $html += "<li>⚠️ High average CPU usage ($([Math]::Round($TrendAnalysis.CPU.Stats.Average, 2))%) detected. Consider optimizing CPU-intensive operations.</li>"
    }

    if ($TrendAnalysis.Memory.Stats.Average -gt 4) {
        $html += "<li>⚠️ High memory usage ($([Math]::Round($TrendAnalysis.Memory.Stats.Average, 2))GB) detected. Review memory management and potential leaks.</li>"
    }

    if ($TrendAnalysis.CPU.Trend -eq "INCREASING") {
        $html += "<li>📈 CPU usage is trending upward. Monitor for potential performance degradation.</li>"
    }

    if ($TrendAnalysis.Memory.Trend -eq "INCREASING") {
        $html += "<li>📈 Memory usage is trending upward. Investigate potential memory leaks.</li>"
    }

    if ($Anomalies.Count -gt 10) {
        $html += "<li>🚨 High number of anomalies detected. Review system stability and resource allocation.</li>"
    }

    $html += "<li>✅ Continue monitoring with the performance monitor script for ongoing analysis.</li>"
    $html += "<li>📊 Consider setting up automated alerts for critical thresholds.</li>"

    $html += @"
            </ul>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #7f8c8d;">
            <p>Report generated by Performance Analytics Engine v2.2</p>
            <p>For real-time monitoring, use: <code>.\performance-monitor.ps1 -RealTime</code></p>
        </div>
    </div>
</body>
</html>
"@

    $html | Out-File -FilePath $OutputPath -Encoding UTF8
    Write-Host "📊 Performance report generated: $OutputPath" -ForegroundColor Green
}

function Show-PerformanceSummary {
    param($MetricsData, $TrendAnalysis, $Anomalies)

    Write-Host "`n🎯 PERFORMANCE ANALYSIS SUMMARY" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

    Write-Host "`n📊 Dataset Information:" -ForegroundColor White
    Write-Host "  • Data Points: $($TrendAnalysis.DataPoints)" -ForegroundColor Gray
    Write-Host "  • Time Span: $($TrendAnalysis.TimeSpan.TotalHours.ToString("F1")) hours" -ForegroundColor Gray

    Write-Host "`n💻 CPU Performance:" -ForegroundColor White
    Write-Host "  • Average Usage: $([Math]::Round($TrendAnalysis.CPU.Stats.Average, 2))%" -ForegroundColor Gray
    Write-Host "  • Peak Usage: $([Math]::Round($TrendAnalysis.CPU.Stats.Maximum, 2))%" -ForegroundColor Gray
    Write-Host "  • Trend: $($TrendAnalysis.CPU.Trend) ($($TrendAnalysis.CPU.TrendChange)% change)" -ForegroundColor $(if($TrendAnalysis.CPU.Trend -eq 'INCREASING'){'Yellow'}else{'Green'})

    Write-Host "`n🧠 Memory Performance:" -ForegroundColor White
    Write-Host "  • Average Usage: $([Math]::Round($TrendAnalysis.Memory.Stats.Average, 2))GB" -ForegroundColor Gray
    Write-Host "  • Peak Usage: $([Math]::Round($TrendAnalysis.Memory.Stats.Maximum, 2))GB" -ForegroundColor Gray
    Write-Host "  • Trend: $($TrendAnalysis.Memory.Trend) ($($TrendAnalysis.Memory.TrendChange)GB change)" -ForegroundColor $(if($TrendAnalysis.Memory.Trend -eq 'INCREASING'){'Yellow'}else{'Green'})

    Write-Host "`n🚨 Anomaly Detection:" -ForegroundColor White
    Write-Host "  • Total Anomalies: $($Anomalies.Count)" -ForegroundColor Gray
    Write-Host "  • High Severity: $(($Anomalies | Where-Object {$_.Severity -eq 'HIGH'}).Count)" -ForegroundColor Red
    Write-Host "  • Medium Severity: $(($Anomalies | Where-Object {$_.Severity -eq 'MEDIUM'}).Count)" -ForegroundColor Yellow

    if ($Anomalies.Count -gt 0) {
        Write-Host "`n🔍 Recent Anomalies:" -ForegroundColor White
        $recentAnomalies = $Anomalies | Sort-Object Timestamp -Descending | Select-Object -First 5
        foreach ($anomaly in $recentAnomalies) {
            $color = if ($anomaly.Severity -eq "HIGH") { "Red" } else { "Yellow" }
            Write-Host "  • $($anomaly.Timestamp): $($anomaly.Type) - $($anomaly.Value) (Severity: $($anomaly.Severity))" -ForegroundColor $color
        }
    }

    Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
}

# Main execution
Write-Host "🎯 PERFORMANCE ANALYTICS ENGINE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

if (-not (Test-Path $LogFile)) {
    Write-Warning "Performance log file not found: $LogFile"
    Write-Host "Run the performance monitor first:" -ForegroundColor Yellow
    Write-Host "  .\performance-monitor.ps1 -SaveMetrics" -ForegroundColor Green
    exit 1
}

Write-Host "📂 Loading performance data from: $LogFile" -ForegroundColor Green
$metricsData = Import-PerformanceData -LogPath $LogFile

if ($metricsData.Count -eq 0) {
    Write-Warning "No valid performance data found in log file"
    exit 1
}

Write-Host "✅ Loaded $($metricsData.Count) data points" -ForegroundColor Green

if ($ShowTrends -or $GenerateReport) {
    Write-Host "📈 Analyzing performance trends..." -ForegroundColor Yellow
    $trendAnalysis = Analyze-PerformanceTrends -MetricsData $metricsData
}

if ($AnalyzeAnomalies -or $GenerateReport) {
    Write-Host "🔍 Detecting performance anomalies..." -ForegroundColor Yellow
    $anomalies = Detect-PerformanceAnomalies -MetricsData $metricsData
}

if ($GenerateReport) {
    Write-Host "📊 Generating HTML report..." -ForegroundColor Yellow
    Generate-PerformanceReport -MetricsData $metricsData -TrendAnalysis $trendAnalysis -Anomalies $anomalies -OutputPath $ReportPath
}

if ($ShowTrends -or $AnalyzeAnomalies -or (-not $GenerateReport)) {
    Show-PerformanceSummary -MetricsData $metricsData -TrendAnalysis $trendAnalysis -Anomalies $anomalies
}
