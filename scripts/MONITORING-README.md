# 🖥️ SHINOMONTAGKA MONITORING TOOLS

## 📋 Overview

Comprehensive monitoring solution for SHINOMONTAGKA development environment with cross-platform support and enhanced port detection capabilities.

## 🚀 Available Tools

### 1. Enhanced PowerShell Monitor (Windows)

**File**: `terminal-status-monitor-enhanced.ps1`

**Features**:

- ✅ Multiple port detection methods (Test-NetConnection, netstat, Get-NetTCPConnection)
- ✅ Enhanced process monitoring with memory/CPU usage
- ✅ Real-time status updates
- ✅ Verbose mode for detailed diagnostics
- ✅ Cross-platform compatibility planning

**Usage**:

```powershell
# Run once with detailed info
.\scripts\terminal-status-monitor-enhanced.ps1 -Once -Verbose

# Continuous monitoring (default 3s interval)
.\scripts\terminal-status-monitor-enhanced.ps1

# Custom refresh interval
.\scripts\terminal-status-monitor-enhanced.ps1 -RefreshInterval 5

# Background monitoring
Start-Job -ScriptBlock { .\scripts\terminal-status-monitor-enhanced.ps1 }
```

### 2. Cross-Platform Unix Monitor (Linux/macOS)

**File**: `monitor-processes-unix.sh`

**Features**:

- ✅ Multiple port detection (nc, telnet, /dev/tcp, ss, lsof)
- ✅ Process monitoring with memory usage
- ✅ Cross-platform compatibility (Linux/macOS)
- ✅ Colored output for better readability
- ✅ Graceful shutdown handling

**Usage**:

```bash
# Make executable (first time only)
chmod +x scripts/monitor-processes-unix.sh

# Run once with detailed info
./scripts/monitor-processes-unix.sh --once --verbose

# Continuous monitoring
./scripts/monitor-processes-unix.sh

# Custom refresh interval
./scripts/monitor-processes-unix.sh --refresh 5
```

### 3. Port Detection Testing

**File**: `test-port-detection.ps1`

**Purpose**: Test and validate all port detection methods

**Usage**:

```powershell
.\scripts\test-port-detection.ps1
```

### 4. Legacy Monitors

- `terminal-status-monitor.ps1` - Original Windows monitor
- `simple-monitor.ps1` - Lightweight monitoring
- `monitor-processes.ps1` - Basic process tracking

## 🎯 VS Code Integration

**Keybindings** (in `.vscode/keybindings.json`):

| Shortcut       | Action                    | Description                              |
| -------------- | ------------------------- | ---------------------------------------- |
| `Ctrl+Shift+T` | Enhanced Status Dashboard | **Recommended** comprehensive monitoring |
| `Ctrl+Shift+D` | Start Dev Server          | Launch `pnpm run dev`                    |
| `Ctrl+Shift+R` | Restart Dev Server        | Stop & restart Node processes            |
| `Ctrl+Shift+S` | Stop All Node             | Emergency stop all Node.js processes     |
| `Ctrl+Shift+F` | Foreground Monitor        | Monitor in current terminal              |
| `Ctrl+Shift+B` | Background Monitor        | Separate window monitoring               |

## 🔍 Port Detection Methods

### Windows (PowerShell)

1. **Test-NetConnection** - Primary, most reliable
2. **netstat parsing** - Secondary, command-line based
3. **Get-NetTCPConnection** - Modern PowerShell cmdlet
4. ~~Get-WmiObject~~ - Deprecated in PowerShell Core

### Linux/macOS (Bash)

1. **netcat (nc)** - Primary, widely available
2. **telnet** - Secondary, timeout-based
3. **/dev/tcp** - Bash built-in TCP test
4. **ss** - Modern Linux socket utility
5. **lsof** - List open files/ports

## 📊 Monitoring Coverage

### Processes Monitored

- **node** - Development servers (Vite, etc.)
- **chrome** - Browser processes
- **Code** - VS Code editor
- **powershell/bash** - Shell processes

### Ports Monitored

- **5173** - Vite Development Server
- **4173** - Vite Preview Server
- **3000-3999** - Common development ports (configurable)

## 🎛️ Configuration Options

### Refresh Intervals

- **Default**: 3 seconds
- **Fast**: 1 second (high resource usage)
- **Slow**: 5-10 seconds (low resource usage)

### Verbosity Levels

- **Normal**: Basic status indicators
- **Verbose**: Detailed port detection results
- **Quiet**: Minimal output (once mode)

## 🚀 Performance Optimizations

### Enhanced Features (v2.0)

- ✅ Multiple detection methods with fallbacks
- ✅ Cached process information
- ✅ Error handling and graceful degradation
- ✅ Background execution support
- ✅ Cross-platform compatibility

### Resource Usage

- **Memory**: ~5-10 MB per monitor instance
- **CPU**: <1% during monitoring cycles
- **Network**: Local-only port testing

## 🔧 Troubleshooting

### Common Issues

1. **PowerShell Execution Policy**

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Port Detection Failures**
   - Check if process is actually running
   - Verify port numbers (5173 for dev, 4173 for preview)
   - Try verbose mode for detailed diagnostics

3. **Cross-Platform Issues**
   - Linux: Install `netcat-openbsd` or `netcat-traditional`
   - macOS: Install via Homebrew: `brew install netcat`

### Debug Commands

```powershell
# Windows: Test specific port
Test-NetConnection -ComputerName localhost -Port 5173 -InformationLevel Detailed

# Linux/macOS: Test specific port
nc -zv localhost 5173
```

## 📝 Development Notes

### Future Enhancements (Roadmap v2.1)

- [ ] Web-based monitoring dashboard
- [ ] Performance metrics collection
- [ ] Notification system for failures
- [ ] Docker container monitoring
- [ ] CI/CD integration

### Version History

- **v2.0** - Enhanced multi-method detection, cross-platform support
- **v1.5** - VS Code integration, background monitoring
- **v1.0** - Basic PowerShell monitoring

---

**Last Updated**: September 8, 2025
**Compatibility**: Windows 10+, Linux, macOS
**Dependencies**: PowerShell 5.1+, Bash 4.0+
