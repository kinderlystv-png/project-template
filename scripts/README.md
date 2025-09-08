# Enhanced Monitoring Scripts

This directory contains cross-platform monitoring scripts for the SHINOMONTAGKA project.

## Scripts Overview

### 1. enhanced-port-monitor.ps1 (Windows PowerShell)

Advanced port monitoring script with multiple detection methods and system metrics.

**Features:**

- Multiple port detection methods (Test-NetConnection, netstat, TcpClient)
- System performance metrics (CPU, Memory)
- Process monitoring and memory usage
- Detailed process information with PIDs
- Color-coded output and real-time refresh

**Usage:**

```powershell
# Basic monitoring
.\enhanced-port-monitor.ps1

# Monitor specific ports
.\enhanced-port-monitor.ps1 -Ports 5173,3000,8080

# Detailed mode with process PIDs
.\enhanced-port-monitor.ps1 -Detailed

# Quiet mode for automation
.\enhanced-port-monitor.ps1 -Quiet

# Custom refresh interval
.\enhanced-port-monitor.ps1 -RefreshSeconds 10

# Show help
.\enhanced-port-monitor.ps1 -Help
```

### 2. enhanced-port-monitor.sh (Linux/macOS/WSL)

Cross-platform bash monitoring script with OS-specific optimizations.

**Features:**

- Cross-platform compatibility (Linux, macOS, WSL)
- Multiple detection methods (netcat, netstat, ss, lsof, bash TCP)
- OS-specific process and memory monitoring
- Automatic OS detection and method selection
- Color-coded terminal output

**Usage:**

```bash
# Make executable (Linux/macOS)
chmod +x enhanced-port-monitor.sh

# Basic monitoring
./enhanced-port-monitor.sh

# Monitor specific ports
./enhanced-port-monitor.sh -p 5173,3000,8080

# Detailed mode
./enhanced-port-monitor.sh -d

# Quiet mode
./enhanced-port-monitor.sh -q

# Custom refresh interval
./enhanced-port-monitor.sh -r 10

# Show help
./enhanced-port-monitor.sh -h
```

## Port Detection Methods

### Windows (PowerShell)

1. **Test-NetConnection** - Primary method using Windows networking cmdlets
2. **netstat** - Fallback using command-line network statistics
3. **TcpClient** - Direct .NET socket connection testing
4. **Process identification** - Get-Process with port association

### Linux/macOS (Bash)

1. **netcat (nc)** - Most reliable network utility
2. **netstat** - Traditional network statistics
3. **ss** - Modern Linux socket statistics
4. **lsof** - List open files and network connections
5. **bash TCP** - Built-in bash TCP device testing

## System Metrics

### Windows

- CPU usage via Get-Counter performance counters
- Memory usage via Get-CimInstance Win32_OperatingSystem
- Process memory via Get-Process WorkingSet64

### Linux/macOS

- CPU usage via top command parsing
- Memory usage via free (Linux) or vm_stat (macOS)
- Process memory via ps command with RSS values

## Monitored Services

### Default Ports

- **5173** - Vite development server
- **3000** - Common Node.js application port
- **8080** - Alternative web server port
- **4173** - Vite preview server

### Monitored Processes

- **node** - Node.js processes
- **chrome/firefox** - Web browsers
- **code** - VS Code editor
- **bash/zsh/powershell** - Shell processes

## Integration with Development Workflow

### VS Code Integration

The monitoring scripts can be integrated with VS Code tasks:

```json
{
  "label": "Start Monitoring",
  "type": "shell",
  "command": "powershell",
  "args": ["-File", "scripts/enhanced-port-monitor.ps1"],
  "group": "build",
  "isBackground": true
}
```

### Docker Integration

Scripts can monitor Docker container ports and processes:

```bash
# Monitor Docker port mappings
./enhanced-port-monitor.sh -p 3000,8080,5432
```

### Automation Support

Both scripts support quiet mode for automation:

```powershell
# PowerShell automation
$status = .\enhanced-port-monitor.ps1 -Quiet -CheckOnce
if ($status -eq "5173:LISTENING") {
    Write-Host "Development server is ready"
}
```

```bash
# Bash automation
status=$(./enhanced-port-monitor.sh -q)
if [[ $status == *"5173:LISTENING"* ]]; then
    echo "Development server is ready"
fi
```

## Performance Optimization

### Resource Usage

- Minimal CPU impact with configurable refresh intervals
- Memory-efficient with targeted process monitoring
- Network-light with local connection testing

### Scalability

- Supports monitoring dozens of ports simultaneously
- Efficient process enumeration with OS-specific optimizations
- Configurable detail levels for performance tuning

## Troubleshooting

### Common Issues

1. **Permission Errors (Windows)**

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Missing Dependencies (Linux/macOS)**

   ```bash
   # Install netcat
   sudo apt-get install netcat  # Ubuntu/Debian
   brew install netcat          # macOS

   # Install lsof
   sudo apt-get install lsof    # Ubuntu/Debian
   brew install lsof            # macOS
   ```

3. **Port Access Issues**
   - Ensure firewall allows local connections
   - Check if processes are running with sufficient privileges
   - Verify network interfaces are properly configured

### Debug Mode

Enable verbose output for troubleshooting:

```powershell
# PowerShell debug
$VerbosePreference = "Continue"
.\enhanced-port-monitor.ps1 -Verbose
```

```bash
# Bash debug
bash -x ./enhanced-port-monitor.sh -d
```

## Phase 2 Implementation Status

✅ **Phase 2.1: Port Detection Optimization**

- Multiple detection methods implemented
- Cross-platform compatibility achieved
- Fallback mechanisms in place

🚧 **Phase 2.2: Cross-Platform Scripts**

- PowerShell version completed
- Bash version completed
- Windows/Linux/macOS compatibility verified

⏳ **Phase 2.3: Performance Metrics Integration**

- CPU monitoring implemented
- Memory monitoring implemented
- Process tracking completed
- Network I/O monitoring pending

## Next Steps (Phase 3)

The monitoring infrastructure is ready for Phase 3 CI/CD integration:

- Automated health checks in CI pipelines
- Performance regression detection
- Resource usage tracking in deployments
- Integration with monitoring platforms (Prometheus, Grafana)
