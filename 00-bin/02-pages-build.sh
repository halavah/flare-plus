#!/bin/bash

# 02-pages Build Script
# Builds static site for production

set -e

# ANSI colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/.."
cd 02-pages

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}       02-Pages Build Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Project Directory: $(pwd)"
echo

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from 02-pages directory.${NC}"
    exit 1
fi

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    echo
fi

# Clean previous build
echo -e "${BLUE}Cleaning previous build...${NC}"
rm -rf public .cache
echo -e "${GREEN}✓ Cleaned previous build${NC}"

# Run build
echo
echo -e "${BLUE}Building static site...${NC}"
if npm run build; then
    echo -e "${GREEN}✓ Build completed successfully!${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Build summary
echo
echo -e "${BLUE}Build Summary:${NC}"
echo -e "Output directory: public/"

# List created files
if [ -d "public" ]; then
    echo -e "${GREEN}Files created:${NC}"
    find public -type f | head -20 | while read file; do
        echo -e "  ${GREEN}✓${NC} ${file#public/}"
    done

    file_count=$(find public -type f | wc -l)
    echo -e "${BLUE}Total files: $file_count${NC}"

    # Calculate total size
    if command -v du >/dev/null 2>&1; then
        total_size=$(du -sh public | cut -f1)
        echo -e "${BLUE}Total size: $total_size${NC}"
    fi
else
    echo -e "${RED}✗ No output directory found${NC}"
    exit 1
fi

# Check critical files
echo
echo -e "${BLUE}Checking critical files...${NC}"
critical_files=("index.html" "assets/css/main.css" "assets/js/main.js")

for file in "${critical_files[@]}"; do
    if [ -f "public/$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file (missing)${NC}"
    fi
done

# Check build artifacts
echo
echo -e "${BLUE}Build artifacts:${NC}"
if [ -f "public/sitemap.xml" ]; then
    echo -e "${GREEN}✓ sitemap.xml${NC}"
fi

if [ -f "public/feed.xml" ]; then
    echo -e "${GREEN}✓ feed.xml${NC}"
fi

if [ -d "public/api" ]; then
    echo -e "${GREEN}✓ API functions${NC}"
fi

echo
echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${YELLOW}Ready for deployment to Cloudflare Pages.${NC}"