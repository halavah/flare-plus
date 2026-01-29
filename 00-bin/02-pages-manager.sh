#!/bin/bash

# 02-Pages Manager Script
# Unified management interface for 02-pages project

set -e

# ANSI colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/.."
cd 02-pages

# Display header
show_header() {
    clear
    echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                    02-Pages Manager                           ║${NC}"
    echo -e "${PURPLE}║              Cloudflare Pages Project Manager            ║${NC}"
    echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${CYAN}Project Directory: ${YELLOW}$(pwd)${NC}"
    echo -e "${CYAN}Project Status: ${YELLOW}$(check_project_status)${NC}"
    echo
}

# Check project status
check_project_status() {
    if [ -f "public/index.html" ]; then
        echo -e "${GREEN}Built${NC}"
    elif [ -d "node_modules" ]; then
        echo -e "${YELLOW}Ready to Build${NC}"
    else
        echo -e "${RED}Setup Required${NC}"
    fi
}

# Show main menu
show_menu() {
    echo -e "${BLUE}Available Operations:${NC}"
    echo
    echo -e "  ${CYAN}[1]${NC} 📦 Setup & Dependencies"
    echo -e "  ${CYAN}[2]${NC} 🎨 Generate Assets"
    echo -e "  ${CYAN}[3]${NC} 🏗️  Build Project"
    echo -e "  ${CYAN}[4]${NC] 🚀 Start Development Server"
    echo -e "  ${CYAN}[5]${NC} 📤 Deploy to Cloudflare"
    echo -e "  ${CYAN}[6]${NC} 🧹 Clean Build"
    echo -e "  ${CYAN}[7]${NC} 📊 Build Statistics"
    echo -e "  ${CYAN}[8]${NC} 🔍 Health Check"
    echo
    echo -e "  ${YELLOW}[h]${NC} Help & Documentation"
    echo -e "  ${RED}[q]${NC} Quit"
    echo
    echo -ne "${GREEN}Select operation [1-8/h/q]: ${NC}"
}

# Setup project
setup_project() {
    echo -e "${BLUE}🔧 Setting up project...${NC}"
    echo

    # Install dependencies
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
        npm install
    fi

    # Generate assets
    if [ ! -d "src/assets" ]; then
        echo -e "${YELLOW}Generating placeholder assets...${NC}"
        ./00-bin/02-pages-assets.sh
    fi

    # Check configuration
    if [ ! -f "wrangler.toml" ]; then
        echo -e "${YELLOW}Creating Cloudflare configuration...${NC}"
        cat > wrangler.toml << EOF
name = "flare-plus-pages"
compatibility_date = "2023-05-18"

[env.production]
name = "flare-plus-pages"

[env.preview]
name = "flare-plus-pages-preview"
EOF
    fi

    echo -e "${GREEN}✓ Project setup completed!${NC}"
    echo
    read -p "Press Enter to continue..."
}

# Generate assets
generate_assets() {
    echo -e "${BLUE}🎨 Asset Generation${NC}"
    echo
    echo -e "${YELLOW}Select asset type:${NC}"
    echo "  1) All assets"
    echo "  2) Images only"
    echo "  3) Icons only"
    echo "  4) Fonts only"
    echo "  5) Files only"
    echo
    read -p "Choose [1-5]: " asset_choice

    case $asset_choice in
        1) ./00-bin/02-pages-assets.sh all ;;
        2) ./00-bin/02-pages-assets.sh images ;;
        3) ./00-bin/02-pages-assets.sh icons ;;
        4) ./00-bin/02-pages-assets.sh fonts ;;
        5) ./00-bin/02-pages-assets.sh files ;;
        *) echo -e "${RED}Invalid choice${NC}"; return 1 ;;
    esac
}

# Build project
build_project() {
    echo -e "${BLUE}🏗️ Building Project${NC}"
    echo
    ./00-bin/02-pages-build.sh
}

# Start development server
start_dev_server() {
    echo -e "${BLUE}🚀 Starting Development Server${NC}"
    echo
    echo -e "${YELLOW}Note: Development server will run on http://localhost:8788${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    echo
    ./00-bin/02-pages-dev.sh
}

# Deploy project
deploy_project() {
    echo -e "${BLUE}📤 Deploying to Cloudflare Pages${NC}"
    echo
    ./00-bin/02-pages-deploy.sh
}

# Clean build
clean_build() {
    echo -e "${BLUE}🧹 Cleaning Build${NC}"
    echo

    if [ -d "public" ]; then
        echo -e "${YELLOW}Removing build output...${NC}"
        rm -rf public
    fi

    if [ -d ".cache" ]; then
        echo -e "${YELLOW}Removing cache...${NC}"
        rm -rf .cache
    fi

    echo -e "${GREEN}✓ Build cleaned${NC}"
    echo
    read -p "Press Enter to continue..."
}

# Show build statistics
show_statistics() {
    echo -e "${BLUE}📊 Build Statistics${NC}"
    echo

    if [ ! -d "public" ]; then
        echo -e "${RED}No build found. Run build first.${NC}"
        echo
        read -p "Press Enter to continue..."
        return
    fi

    echo -e "${CYAN}Build Output: ${YELLOW}public/${NC}"
    echo

    # File count
    file_count=$(find public -type f | wc -l)
    echo -e "${CYAN}Total Files: ${YELLOW}$file_count${NC}"

    # Directory structure
    echo
    echo -e "${CYAN}Directory Structure:${NC}"
    tree public -L 3 2>/dev/null || find public -type d | sort | head -10

    # Size
    if command -v du >/dev/null 2>&1; then
        total_size=$(du -sh public | cut -f1)
        echo
        echo -e "${CYAN}Total Size: ${YELLOW}$total_size${NC}"
    fi

    # Critical files
    echo
    echo -e "${CYAN}Critical Files:${NC}"
    critical_files=("index.html" "sitemap.xml" "assets/css/main.css" "assets/js/main.js")
    for file in "${critical_files[@]}"; do
        if [ -f "public/$file" ]; then
            echo -e "  ${GREEN}✓${NC} $file"
        else
            echo -e "  ${RED}✗${NC} $file (missing)"
        fi
    done

    echo
    read -p "Press Enter to continue..."
}

# Health check
health_check() {
    echo -e "${BLUE}🔍 Health Check${NC}"
    echo

    issues=0

    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Node.js ($(node --version))"
    else
        echo -e "${RED}✗${NC} Node.js (not found)"
        ((issues++))
    fi

    # Check npm
    if command -v npm >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} npm ($(npm --version))"
    else
        echo -e "${RED}✗${NC} npm (not found)"
        ((issues++))
    fi

    # Check Python 3
    if command -v python3 >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Python 3 ($(python3 --version))"
    else
        echo -e "${RED}✗${NC} Python 3 (not found)"
        ((issues++))
    fi

    # Check Wrangler
    if command -v wrangler >/dev/null 2>&1 || npx wrangler --version >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Wrangler CLI"
    else
        echo -e "${RED}✗${NC} Wrangler CLI (not found)"
        ((issues++))
    fi

    # Check project files
    echo
    echo -e "${CYAN}Project Files:${NC}"
    project_files=("package.json" "src/build/generator.js")
    for file in "${project_files[@]}"; do
        if [ -f "$file" ]; then
            echo -e "  ${GREEN}✓${NC} $file"
        else
            echo -e "  ${RED}✗${NC} $file (missing)"
            ((issues++))
        fi
    done

    # Check dependencies
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✓${NC} Dependencies installed"
    else
        echo -e "${RED}✗${NC} Dependencies not installed"
        ((issues++))
    fi

    # Summary
    echo
    if [ $issues -eq 0 ]; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
    else
        echo -e "${RED}❌ Health check failed ($issues issues)${NC}"
    fi

    echo
    read -p "Press Enter to continue..."
}

# Show help
show_help() {
    echo -e "${BLUE}📚 Help & Documentation${NC}"
    echo
    echo -e "${CYAN}Available Commands:${NC}"
    echo "  • Setup & Dependencies: Install all required dependencies and tools"
    echo "  • Generate Assets: Create placeholder images, icons, and other resources"
    echo "  • Build Project: Compile the static site for production"
    echo "  • Start Development Server: Run local development server with hot reload"
    echo "  • Deploy to Cloudflare: Deploy the built site to Cloudflare Pages"
    echo "  • Clean Build: Remove all build artifacts and cache"
    echo "  • Build Statistics: Show detailed information about the build"
    echo "  • Health Check: Verify that all dependencies and tools are properly installed"
    echo
    echo -e "${CYAN}Documentation:${NC}"
    echo "  • README.md: Comprehensive project documentation"
    echo "  • src/config/site.js: Site configuration file"
    echo "  • package.json: Project dependencies and scripts"
    echo
    echo -e "${CYAN}Useful Commands:${NC}"
    echo "  • npm install: Install dependencies"
    echo "  • npm run build: Build the project"
    echo "  • npm run dev: Start development server"
    echo "  • wrangler whoami: Check Cloudflare login status"
    echo
    echo -e "${CYAN}Development Workflow:${NC}"
    echo "  1. Run 'Setup & Dependencies' to install required tools"
    echo "  2. Run 'Generate Assets' to create placeholder resources"
    echo "  3. Run 'Build Project' to compile your site"
    echo "  4. Run 'Start Development Server' to test locally"
    echo "  5. Run 'Deploy to Cloudflare' when ready for production"
    echo
    echo -e "${CYAN}Troubleshooting:${NC}"
    echo "  • If npm install fails, try clearing npm cache: npm cache clean --force"
    echo "  • If Wrangler commands fail, try: npm install -g wrangler"
    echo "  • If assets don't load, check that src/assets directory exists"
    echo "  • For deployment issues, verify Cloudflare authentication: wrangler whoami"
    echo
    read -p "Press Enter to continue..."
}

# Main loop
main() {
    while true; do
        show_header
        show_menu
        read -r choice

        case $choice in
            1)
                setup_project
                ;;
            2)
                generate_assets
                ;;
            3)
                build_project
                ;;
            4)
                start_dev_server
                ;;
            5)
                deploy_project
                ;;
            6)
                clean_build
                ;;
            7)
                show_statistics
                ;;
            8)
                health_check
                ;;
            h|H)
                show_help
                ;;
            q|Q)
                echo -e "${GREEN}Goodbye! 👋${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice. Please select 1-8, h, or q.${NC}"
                echo
                read -p "Press Enter to continue..."
                ;;
        esac
    done
}

# Run main function
main "$@"