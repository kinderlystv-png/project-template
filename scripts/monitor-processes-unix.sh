#!/bin/bash
# Cross-platform monitoring script for Linux/macOS
# Enhanced Terminal Status Monitor - Bash Version
# Version: 2.0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Default parameters
ONCE=false
REFRESH_INTERVAL=3
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --once)
            ONCE=true
            shift
            ;;
        --refresh)
            REFRESH_INTERVAL="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--once] [--refresh SECONDS] [--verbose] [--help]"
            echo "  --once      Run once and exit"
            echo "  --refresh   Set refresh interval (default: 3 seconds)"
            echo "  --verbose   Show detailed port detection info"
            echo "  --help      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Function to test port with multiple methods (Linux/macOS)
test_port_multiple_methods() {
    local host=${1:-localhost}
    local port=$2
    local description=${3:-""}
    local success_count=0
    local results=()

    # Method 1: nc (netcat) - primary method
    if command -v nc >/dev/null 2>&1; then
        if nc -z "$host" "$port" >/dev/null 2>&1; then
            results+=("✅ netcat: SUCCESS")
            ((success_count++))
        else
            results+=("❌ netcat: FAILED")
        fi
    else
        results+=("⚠️ netcat: NOT AVAILABLE")
    fi

    # Method 2: telnet timeout test
    if command -v timeout >/dev/null 2>&1 && command -v telnet >/dev/null 2>&1; then
        if timeout 1 telnet "$host" "$port" >/dev/null 2>&1; then
            results+=("✅ telnet: SUCCESS")
            ((success_count++))
        else
            results+=("❌ telnet: FAILED")
        fi
    else
        results+=("⚠️ telnet: NOT AVAILABLE")
    fi

    # Method 3: /dev/tcp (bash built-in)
    if timeout 1 bash -c "echo >/dev/tcp/$host/$port" >/dev/null 2>&1; then
        results+=("✅ /dev/tcp: SUCCESS")
        ((success_count++))
    else
        results+=("❌ /dev/tcp: FAILED")
    fi

    # Method 4: ss command (modern Linux)
    if command -v ss >/dev/null 2>&1; then
        if ss -tlnp | grep -q ":$port "; then
            results+=("✅ ss: SUCCESS")
            ((success_count++))
        else
            results+=("❌ ss: No listening port")
        fi
    else
        results+=("⚠️ ss: NOT AVAILABLE")
    fi

    # Method 5: lsof (if available)
    if command -v lsof >/dev/null 2>&1; then
        if lsof -i ":$port" -sTCP:LISTEN >/dev/null 2>&1; then
            results+=("✅ lsof: SUCCESS")
            ((success_count++))
        else
            results+=("❌ lsof: No listening port")
        fi
    else
        results+=("⚠️ lsof: NOT AVAILABLE")
    fi

    # Determine overall status
    if [[ $success_count -ge 2 ]]; then
        status="🟢 ACTIVE"
    elif [[ $success_count -eq 1 ]]; then
        status="🟡 PARTIAL"
    else
        status="🔴 STOPPED"
    fi

    echo "$status|$success_count|5|$(IFS='|'; echo "${results[*]}")|$description"
}

# Function to get process info (Linux/macOS)
get_process_info() {
    local process_name=$1

    if pgrep -f "$process_name" >/dev/null 2>&1; then
        local process_count=$(pgrep -f "$process_name" | wc -l)
        local memory_mb=0

        # Try different methods to get memory usage
        if command -v ps >/dev/null 2>&1; then
            # Linux: RSS in KB, convert to MB
            if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                memory_kb=$(ps -o rss= -p $(pgrep -f "$process_name" | tr '\n' ',' | sed 's/,$//') 2>/dev/null | awk '{sum+=$1} END {print sum}')
                memory_mb=$((memory_kb / 1024))
            # macOS: RSS in KB, convert to MB
            elif [[ "$OSTYPE" == "darwin"* ]]; then
                memory_kb=$(ps -o rss= -p $(pgrep -f "$process_name" | tr '\n' ',' | sed 's/,$//') 2>/dev/null | awk '{sum+=$1} END {print sum}')
                memory_mb=$((memory_kb / 1024))
            fi
        fi

        echo "✅ Active|$process_count|${memory_mb:-0} MB|true"
    else
        echo "❌ Stopped|0|0 MB|false"
    fi
}

# Function to show system status
show_system_status() {
    clear

    local timestamp=$(date '+%H:%M:%S')
    echo -e "${CYAN}🖥️ SHINOMONTAGKA ENHANCED DEVELOPMENT MONITOR (Linux/macOS)${NC}"
    echo -e "${GRAY}⏰ Last Updated: $timestamp${NC}"
    echo -e "${GRAY}$(printf '=%.0s' {1..80})${NC}"
    echo ""

    # Process Status
    echo -e "${YELLOW}📋 PROCESS STATUS:${NC}"

    # Get process information
    IFS='|' read -r node_status node_count node_memory node_found <<< "$(get_process_info "node")"
    IFS='|' read -r chrome_status chrome_count chrome_memory chrome_found <<< "$(get_process_info "chrome")"
    IFS='|' read -r code_status code_count code_memory code_found <<< "$(get_process_info "code")"
    IFS='|' read -r bash_status bash_count bash_memory bash_found <<< "$(get_process_info "bash")"

    # Display process status with colors
    if [[ "$node_found" == "true" ]]; then
        echo -e "  🔧 node: ${GREEN}$node_status [$node_count processes, $node_memory]${NC}"
    else
        echo -e "  🔧 node: ${RED}$node_status [$node_count processes, $node_memory]${NC}"
    fi

    if [[ "$chrome_found" == "true" ]]; then
        echo -e "  🔧 chrome: ${GREEN}$chrome_status [$chrome_count processes, $chrome_memory]${NC}"
    else
        echo -e "  🔧 chrome: ${RED}$chrome_status [$chrome_count processes, $chrome_memory]${NC}"
    fi

    if [[ "$code_found" == "true" ]]; then
        echo -e "  🔧 code: ${GREEN}$code_status [$code_count processes, $code_memory]${NC}"
    else
        echo -e "  🔧 code: ${RED}$code_status [$code_count processes, $code_memory]${NC}"
    fi

    if [[ "$bash_found" == "true" ]]; then
        echo -e "  🔧 bash: ${GREEN}$bash_status [$bash_count processes, $bash_memory]${NC}"
    else
        echo -e "  🔧 bash: ${RED}$bash_status [$bash_count processes, $bash_memory]${NC}"
    fi

    echo ""

    # Development Servers with Enhanced Detection
    echo -e "${YELLOW}🚀 DEVELOPMENT SERVERS:${NC}"

    # Test ports
    IFS='|' read -r vite_status vite_success vite_total vite_results vite_desc <<< "$(test_port_multiple_methods localhost 5173 "Vite Dev Server")"
    IFS='|' read -r preview_status preview_success preview_total preview_results preview_desc <<< "$(test_port_multiple_methods localhost 4173 "Vite Preview Server")"

    # Display server status with colors
    if [[ "$vite_status" == *"ACTIVE"* ]]; then
        echo -e "  📦 Vite (5173): ${GREEN}$vite_status${NC}"
    elif [[ "$vite_status" == *"PARTIAL"* ]]; then
        echo -e "  📦 Vite (5173): ${YELLOW}$vite_status${NC}"
    else
        echo -e "  📦 Vite (5173): ${RED}$vite_status${NC}"
    fi

    if [[ "$preview_status" == *"ACTIVE"* ]]; then
        echo -e "  👁️  Preview (4173): ${GREEN}$preview_status${NC}"
    elif [[ "$preview_status" == *"PARTIAL"* ]]; then
        echo -e "  👁️  Preview (4173): ${YELLOW}$preview_status${NC}"
    else
        echo -e "  👁️  Preview (4173): ${RED}$preview_status${NC}"
    fi

    # Verbose mode - show detailed port detection
    if [[ "$VERBOSE" == "true" ]]; then
        echo ""
        echo -e "${MAGENTA}🔍 DETAILED PORT DETECTION:${NC}"
        echo -e "  ${GRAY}Vite (5173) - Success: $vite_success/$vite_total${NC}"
        IFS='|' read -r -a vite_results_array <<< "$vite_results"
        for result in "${vite_results_array[@]}"; do
            echo -e "    ${GRAY}$result${NC}"
        done
        echo -e "  ${GRAY}Preview (4173) - Success: $preview_success/$preview_total${NC}"
        IFS='|' read -r -a preview_results_array <<< "$preview_results"
        for result in "${preview_results_array[@]}"; do
            echo -e "    ${GRAY}$result${NC}"
        done
    fi

    echo ""

    # System Memory
    if command -v free >/dev/null 2>&1; then
        # Linux
        local total_memory_gb=$(free -g | awk 'NR==2{printf "%.1f", $2}')
        echo -e "${CYAN}💾 SYSTEM MEMORY: ${total_memory_gb} GB Total${NC}"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        local total_memory_bytes=$(sysctl -n hw.memsize)
        local total_memory_gb=$(echo "scale=1; $total_memory_bytes / 1024 / 1024 / 1024" | bc)
        echo -e "${CYAN}💾 SYSTEM MEMORY: ${total_memory_gb} GB Total${NC}"
    else
        echo -e "${YELLOW}💾 SYSTEM MEMORY: Unable to retrieve${NC}"
    fi

    if [[ "$ONCE" != "true" ]]; then
        echo ""
        echo -e "${GRAY}$timestamp - Next refresh in $REFRESH_INTERVAL seconds...${NC}"
        if [[ "$VERBOSE" == "true" ]]; then
            echo -e "${GRAY}Press Ctrl+C to stop monitoring${NC}"
        fi
    fi
}

# Main execution
if [[ "$ONCE" == "true" ]]; then
    show_system_status
else
    echo -e "${GREEN}🚀 Starting Enhanced Development Monitor (Linux/macOS)...${NC}"
    echo -e "${GRAY}📊 Refresh interval: $REFRESH_INTERVAL seconds${NC}"
    echo -e "${GRAY}🔧 Use --verbose for detailed port detection info${NC}"
    echo -e "${GRAY}🛑 Press Ctrl+C to stop${NC}"
    echo ""

    # Handle Ctrl+C gracefully
    trap 'echo -e "\n${YELLOW}🛑 Monitor stopped by user${NC}"; exit 0' INT

    while true; do
        show_system_status
        sleep "$REFRESH_INTERVAL"
    done
fi
