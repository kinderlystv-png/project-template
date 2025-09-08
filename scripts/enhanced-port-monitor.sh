#!/bin/bash

# Enhanced Cross-Platform Monitoring Script
# Compatible with Linux, macOS, and WSL

# Default parameters
REFRESH_SECONDS=5
MONITOR_PORTS=(5173 3000 8080 4173)
DETAILED=false
QUIET=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -r|--refresh)
            REFRESH_SECONDS="$2"
            shift 2
            ;;
        -p|--ports)
            IFS=',' read -ra MONITOR_PORTS <<< "$2"
            shift 2
            ;;
        -d|--detailed)
            DETAILED=true
            shift
            ;;
        -q|--quiet)
            QUIET=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -r, --refresh SECONDS    Refresh interval (default: 5)"
            echo "  -p, --ports PORT1,PORT2  Ports to monitor (default: 5173,3000,8080,4173)"
            echo "  -d, --detailed           Show detailed information"
            echo "  -q, --quiet             Quiet mode (minimal output)"
            echo "  -h, --help              Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Detect operating system
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "Linux";;
        Darwin*)    echo "macOS";;
        CYGWIN*)    echo "Windows";;
        MINGW*)     echo "Windows";;
        MSYS*)      echo "Windows";;
        *)          echo "Unknown";;
    esac
}

OS=$(detect_os)

# Platform-specific process listing
get_processes() {
    local process_name=$1
    case $OS in
        "Linux")
            ps aux | grep -i "$process_name" | grep -v grep | wc -l
            ;;
        "macOS")
            ps aux | grep -i "$process_name" | grep -v grep | wc -l
            ;;
        *)
            pgrep -f "$process_name" | wc -l
            ;;
    esac
}

# Enhanced port testing function
test_port() {
    local port=$1
    local host=${2:-localhost}
    local method=""
    local is_listening=false
    local process_info=""

    # Method 1: netcat (most reliable)
    if command -v nc >/dev/null 2>&1; then
        if nc -z "$host" "$port" 2>/dev/null; then
            is_listening=true
            method="netcat"
        fi
    fi

    # Method 2: netstat
    if [ "$is_listening" = false ] && command -v netstat >/dev/null 2>&1; then
        if netstat -ln 2>/dev/null | grep -q ":$port "; then
            is_listening=true
            method="netstat"
        fi
    fi

    # Method 3: ss (modern Linux)
    if [ "$is_listening" = false ] && command -v ss >/dev/null 2>&1; then
        if ss -ln 2>/dev/null | grep -q ":$port "; then
            is_listening=true
            method="ss"
        fi
    fi

    # Method 4: lsof
    if [ "$is_listening" = false ] && command -v lsof >/dev/null 2>&1; then
        if lsof -i ":$port" 2>/dev/null | grep -q LISTEN; then
            is_listening=true
            method="lsof"
        fi
    fi

    # Method 5: /dev/tcp (bash built-in)
    if [ "$is_listening" = false ]; then
        if timeout 1 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
            is_listening=true
            method="bash-tcp"
        fi
    fi

    # Get process information
    if [ "$is_listening" = true ]; then
        if command -v lsof >/dev/null 2>&1; then
            process_info=$(lsof -i ":$port" 2>/dev/null | grep LISTEN | head -1 | awk '{print $2":"$1}')
        elif command -v netstat >/dev/null 2>&1; then
            # Try to get process info from netstat
            case $OS in
                "Linux")
                    process_info=$(netstat -tulpn 2>/dev/null | grep ":$port " | head -1 | awk '{print $7}' | cut -d'/' -f2,1 --output-delimiter=':')
                    ;;
                "macOS")
                    # macOS netstat doesn't show process info by default
                    process_info=$(lsof -i ":$port" 2>/dev/null | grep LISTEN | head -1 | awk '{print $2":"$1}')
                    ;;
            esac
        fi
    fi

    echo "$is_listening|$method|$process_info"
}

# Get system metrics
get_system_metrics() {
    local cpu_usage=""
    local memory_info=""

    case $OS in
        "Linux")
            # CPU usage
            cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
            # Memory usage
            memory_info=$(free | awk 'FNR==2{printf "%.1f/%.1f GB (%.1f%%)", $3/1024/1024, $2/1024/1024, $3*100/$2}')
            ;;
        "macOS")
            # CPU usage
            cpu_usage=$(top -l 1 -s 0 | grep "CPU usage" | awk '{print $3}' | cut -d'%' -f1)
            # Memory usage
            memory_pressure=$(memory_pressure | grep "System-wide memory free percentage" | awk '{print 100-$5}' | cut -d'%' -f1)
            memory_info=$(vm_stat | awk '
                /Pages free:/ { free = $3 }
                /Pages active:/ { active = $3 }
                /Pages inactive:/ { inactive = $3 }
                /Pages speculative:/ { speculative = $3 }
                /Pages wired down:/ { wired = $4 }
                END {
                    total = (free + active + inactive + speculative + wired) * 4096 / 1024 / 1024 / 1024
                    used = (active + inactive + wired) * 4096 / 1024 / 1024 / 1024
                    printf "%.1f/%.1f GB (%.1f%%)", used, total, used*100/total
                }')
            ;;
        *)
            cpu_usage="N/A"
            memory_info="N/A"
            ;;
    esac

    echo "$cpu_usage|$memory_info"
}

# Get process information
get_process_info() {
    local process_name=$1
    local count=0
    local memory_mb=0
    local pids=""

    case $OS in
        "Linux")
            if pgrep -f "$process_name" >/dev/null 2>&1; then
                count=$(pgrep -f "$process_name" | wc -l)
                memory_mb=$(ps -C "$process_name" -o rss= 2>/dev/null | awk '{sum+=$1} END {print int(sum/1024)}')
                pids=$(pgrep -f "$process_name" | tr '\n' ',' | sed 's/,$//')
            fi
            ;;
        "macOS")
            if pgrep -f "$process_name" >/dev/null 2>&1; then
                count=$(pgrep -f "$process_name" | wc -l)
                memory_mb=$(ps -axo rss,comm | grep "$process_name" | awk '{sum+=$1} END {print int(sum/1024)}')
                pids=$(pgrep -f "$process_name" | tr '\n' ',' | sed 's/,$//')
            fi
            ;;
        *)
            count=0
            memory_mb=0
            pids=""
            ;;
    esac

    echo "$count|$memory_mb|$pids"
}

# Initialize
if [ "$QUIET" = false ]; then
    echo -e "${CYAN}🖥️  ENHANCED CROSS-PLATFORM MONITORING ($OS)${NC}"
    echo -e "${YELLOW}⏱️  Refresh: ${REFRESH_SECONDS}s | Ports: ${MONITOR_PORTS[*]}${NC}"
    echo -e "${RED}⛔ Ctrl+C to stop | Use -d for detailed output${NC}"
    echo -e "${CYAN}$(printf '=%.0s' {1..80})${NC}"
fi

# Main monitoring loop
while true; do
    if [ "$QUIET" = false ]; then
        clear
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        echo -e "${CYAN}🕒 $timestamp - ENHANCED SYSTEM MONITORING${NC}"
        echo -e "${CYAN}$(printf '=%.0s' {1..80})${NC}"
    fi

    # System metrics
    if [ "$QUIET" = false ]; then
        metrics=$(get_system_metrics)
        cpu_usage=$(echo "$metrics" | cut -d'|' -f1)
        memory_info=$(echo "$metrics" | cut -d'|' -f2)

        echo -e "\n${YELLOW}📊 SYSTEM METRICS:${NC}"
        echo -e "  🖥️  CPU Usage: ${cpu_usage}%"
        echo -e "  🧠 Memory: ${memory_info}"
    fi

    # Port monitoring
    if [ "$QUIET" = false ]; then
        echo -e "\n${YELLOW}🔌 PORT STATUS (Cross-Platform Detection):${NC}"
    fi

    for port in "${MONITOR_PORTS[@]}"; do
        result=$(test_port "$port")
        is_listening=$(echo "$result" | cut -d'|' -f1)
        method=$(echo "$result" | cut -d'|' -f2)
        process_info=$(echo "$result" | cut -d'|' -f3)

        if [ "$QUIET" = false ]; then
            if [ "$is_listening" = "true" ]; then
                echo -ne "  📡 Port $port: ${GREEN}🟢 LISTENING${NC}"
                if [ -n "$process_info" ]; then
                    echo -ne " ${GRAY}[$process_info]${NC}"
                fi
                if [ "$DETAILED" = true ] && [ -n "$method" ]; then
                    echo -ne " ${GRAY}[$method]${NC}"
                fi
                echo ""
            else
                echo -e "  📡 Port $port: ${RED}🔴 CLOSED${NC}"
            fi
        fi
    done

    # Process monitoring
    if [ "$QUIET" = false ]; then
        echo -e "\n${YELLOW}📋 PROCESS STATUS:${NC}"
    fi

    processes_to_monitor=("node" "chrome" "code" "bash" "zsh")
    for process_name in "${processes_to_monitor[@]}"; do
        if [ "$QUIET" = false ]; then
            process_data=$(get_process_info "$process_name")
            count=$(echo "$process_data" | cut -d'|' -f1)
            memory_mb=$(echo "$process_data" | cut -d'|' -f2)
            pids=$(echo "$process_data" | cut -d'|' -f3)

            echo -ne "  🔧 $process_name: "
            if [ "$count" -gt 0 ]; then
                echo -ne "${GREEN}✅ Active${NC} ${GRAY}[$count processes"
                if [ "$memory_mb" -gt 0 ]; then
                    echo -ne ", ${memory_mb} MB"
                fi
                echo -e "]${NC}"

                if [ "$DETAILED" = true ] && [ -n "$pids" ]; then
                    echo -e "    ${GRAY}PIDs: $pids${NC}"
                fi
            else
                echo -e "${RED}❌ Stopped${NC}"
            fi
        fi
    done

    # Development servers
    if [ "$QUIET" = false ]; then
        echo -e "\n${YELLOW}🚀 DEVELOPMENT SERVERS:${NC}"

        # Vite dev server
        vite_result=$(test_port 5173)
        vite_listening=$(echo "$vite_result" | cut -d'|' -f1)
        echo -ne "  📦 Vite (5173): "
        if [ "$vite_listening" = "true" ]; then
            echo -e "${GREEN}🟢 RUNNING${NC} ${CYAN}[http://localhost:5173]${NC}"
        else
            echo -e "${RED}🔴 STOPPED${NC}"
        fi

        # Preview server
        preview_result=$(test_port 4173)
        preview_listening=$(echo "$preview_result" | cut -d'|' -f1)
        echo -ne "  👁️  Preview (4173): "
        if [ "$preview_listening" = "true" ]; then
            echo -e "${GREEN}🟢 RUNNING${NC} ${CYAN}[http://localhost:4173]${NC}"
        else
            echo -e "${RED}🔴 STOPPED${NC}"
        fi

        echo -e "\n${GRAY}$(date '+%H:%M:%S') - Next refresh in ${REFRESH_SECONDS} seconds...${NC}"
    fi

    sleep "$REFRESH_SECONDS"
done
