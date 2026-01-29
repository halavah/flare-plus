#!/bin/bash

# Flare Plus - Unified Project Manager
# Manages all Cloudflare services from a single interface

set -e

# ANSI colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Change to project root directory
cd "$(dirname "$0")"

# Service list
services=(
    "01-workers:Cloudflare Workers"
    "02-pages:Cloudflare Pages"
    "03-r2:Cloudflare R2 Storage"
    "04-d1:Cloudflare D1 Database"
    "05-kv:Cloudflare KV"
    "06-durable-objects:Cloudflare Durable Objects"
    "07-email-routing:Cloudflare Email Routing"
    "08-webhooks:Cloudflare Webhooks"
    "09-queue:Cloudflare Queue"
    "10-turnstile:Cloudflare Turnstile"
)

# Display header
show_header() {
    clear
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    Flare Plus Manager                        ║${NC}"
    echo -e "${PURPLE}║              Unified Cloudflare Services Manager           ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}Project Directory: ${YELLOW}$(pwd)${NC}"
    echo -e "${CYAN}Git Branch: ${YELLOW}$(git branch --show-current 2>/dev/null || echo 'Not a git repo')${NC}"
    echo
}

# Check service status
check_service_status() {
    local service_key="$1"
    # Check if service scripts exist in 00-bin
    if [ -f "00-bin/${service_key}-dev.sh" ] || [ -f "00-bin/${service_key}-dev.bat" ]; then
        echo -e "${GREEN}Available${NC}"
    else
        echo -e "${RED}Missing Scripts${NC}"
    fi
}

# Show main menu
show_main_menu() {
    echo -e "${WHITE}Available Services:${NC}"
    echo

    # Services
    for i in "${!services[@]}"; do
        IFS=':' read -r key name <<< "${services[$i]}"
        status=$(check_service_status "$key")
        echo -e "  ${CYAN}[$((i+1))]${NC} 🌐 $name (${status})"
    done

    echo
    echo -e "  ${RED}[q]${NC} Quit"
    echo
    echo -ne "${GREEN}Select operation [1-10/q]: ${NC}"
}


# Show service menu
show_service_menu() {
    local service_num="$1"
    local service_info="${services[$((service_num-1))]}"
    IFS=':' read -r key name <<< "$service_info"

    clear
    echo -e "${BLUE}🌐 $name Management${NC}"
    echo
    echo -e "${YELLOW}Service Key: ${CYAN}$key${NC}"
    echo -e "${YELLOW}Status: $(check_service_status "$key")${NC}"
    echo
    echo "Available Operations:"
    echo "  1) Start Development Server"
    echo "  2) Deploy to Cloudflare"
    echo "  3) Build Project"
    echo "  4) Install Dependencies"
    echo "  5) Clean Build"
    echo
    echo "  b) Back to Main Menu"
    echo
    echo -ne "${GREEN}Select operation [1-5/b]: ${NC}"
}


# Execute service command
execute_service_command() {
    local service_num="$1"
    local command="$2"
    local service_info="${services[$((service_num-1))]}"
    IFS=':' read -r key name <<< "$service_info"

    # Check if the service script exists
    local script_path=""
    case $command in
        1) script_path="00-bin/${key}-dev.sh" ;;
        2) script_path="00-bin/${key}-deploy.sh" ;;
        3) script_path="00-bin/${key}-build.sh" ;;
        4) script_path="00-bin/${key}-install.sh" ;;
        5) script_path="00-bin/${key}-clean.sh" ;;
    esac

    case $command in
        1) # Development server
            echo -e "${BLUE}🚀 Starting development server for $name...${NC}"
            echo -e "${YELLOW}Note: Press Ctrl+C to stop the server${NC}"
            echo
            if [ -f "00-bin/${key}-dev.sh" ]; then
                bash "00-bin/${key}-dev.sh"
            else
                echo -e "${RED}✗ Development script not found: 00-bin/${key}-dev.sh${NC}"
                echo -e "${YELLOW}Please ensure the script exists in the 00-bin directory.${NC}"
            fi
            ;;
        2) # Deploy
            echo -e "${BLUE}📤 Deploying $name to Cloudflare...${NC}"
            if [ -f "00-bin/${key}-deploy.sh" ]; then
                bash "00-bin/${key}-deploy.sh"
            else
                echo -e "${RED}✗ Deployment script not found: 00-bin/${key}-deploy.sh${NC}"
                echo -e "${YELLOW}Please ensure the script exists in the 00-bin directory.${NC}"
            fi
            ;;
        3) # Build
            echo -e "${BLUE}🏗️ Building $name...${NC}"
            if [ -f "00-bin/${key}-build.sh" ]; then
                bash "00-bin/${key}-build.sh"
            else
                echo -e "${RED}✗ Build script not found: 00-bin/${key}-build.sh${NC}"
                echo -e "${YELLOW}Please ensure the script exists in the 00-bin directory.${NC}"
            fi
            ;;
        4) # Install dependencies
            echo -e "${BLUE}📦 Installing dependencies for $name...${NC}"
            if [ -f "00-bin/${key}-install.sh" ]; then
                bash "00-bin/${key}-install.sh"
            else
                echo -e "${YELLOW}⚠ No install script found, trying npm install...${NC}"
                # Try to find the service directory and run npm install
                service_dir=""
                case $key in
                    "01-workers") service_dir="01-workers" ;;
                    "02-pages") service_dir="02-pages" ;;
                    "03-r2") service_dir="03-r2" ;;
                    "04-d1") service_dir="04-d1" ;;
                    "05-kv") service_dir="05-kv" ;;
                    "06-durable-objects") service_dir="06-durable-objects" ;;
                    "07-email-routing") service_dir="07-email-routing" ;;
                    "08-webhooks") service_dir="08-webhooks" ;;
                    "09-queue") service_dir="09-queue" ;;
                    "10-turnstile") service_dir="10-turnstile" ;;
                esac

                if [ -n "$service_dir" ] && [ -d "$service_dir" ] && [ -f "$service_dir/package.json" ]; then
                    cd "$service_dir"
                    npm install
                    echo -e "${GREEN}✓ Dependencies installed${NC}"
                    cd ..
                else
                    echo -e "${RED}✗ No package.json found for $name${NC}"
                fi
            fi
            ;;
        5) # Clean
            echo -e "${BLUE}🧹 Cleaning build for $name...${NC}"
            if [ -f "00-bin/${key}-clean.sh" ]; then
                bash "00-bin/${key}-clean.sh"
            else
                echo -e "${YELLOW}⚠ No clean script found, performing default clean...${NC}"
                # Try to find the service directory and clean it
                service_dir=""
                case $key in
                    "01-workers") service_dir="01-workers" ;;
                    "02-pages") service_dir="02-pages" ;;
                    "03-r2") service_dir="03-r2" ;;
                    "04-d1") service_dir="04-d1" ;;
                    "05-kv") service_dir="05-kv" ;;
                    "06-durable-objects") service_dir="06-durable-objects" ;;
                    "07-email-routing") service_dir="07-email-routing" ;;
                    "08-webhooks") service_dir="08-webhooks" ;;
                    "09-queue") service_dir="09-queue" ;;
                    "10-turnstile") service_dir="10-turnstile" ;;
                esac

                if [ -n "$service_dir" ] && [ -d "$service_dir" ]; then
                    cd "$service_dir"
                    [ -d "node_modules" ] && rm -rf node_modules
                    [ -d "dist" ] && rm -rf dist
                    [ -d "public" ] && rm -rf public
                    [ -d ".cache" ] && rm -rf .cache
                    echo -e "${GREEN}✓ Build cleaned${NC}"
                    cd ..
                else
                    echo -e "${RED}✗ Service directory not found for $name${NC}"
                fi
            fi
            ;;
    esac

    echo
    read -p "Press Enter to continue..."
}


# Service operations menu
service_menu() {
    local service_num="$1"

    while true; do
        show_service_menu "$service_num"
        read -r choice

        case $choice in
            [1-5])
                execute_service_command "$service_num" "$choice"
                ;;
            b|B)
                return
                ;;
            *)
                echo -e "${RED}Invalid choice. Please select 1-5 or b.${NC}"
                echo
                read -p "Press Enter to continue..."
                ;;
        esac
    done
}

# Main loop
main() {
    while true; do
        show_header
        show_main_menu
        read -r choice

        case $choice in
            [1-9]|10)
                service_menu "$choice"
                ;;
            q|Q)
                echo -e "${GREEN}Goodbye! 👋${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice. Please select 1-10 or q.${NC}"
                echo
                read -p "Press Enter to continue..."
                ;;
        esac
    done
}

# Check if git is available
if ! command -v git >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Git not found. Git operations will not be available.${NC}"
fi

# Run main function
main "$@"
