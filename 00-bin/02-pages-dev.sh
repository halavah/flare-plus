#!/bin/bash

# 02-pages Development Environment Launcher
# Starts local development server with hot reload

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
echo -e "${BLUE}   02-Pages Development Environment${NC}"
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
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    echo
fi

# Load environment variables
if [ -f ".env" ]; then
    echo -e "${BLUE}Loading environment variables...${NC}"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check required configuration
if [ ! -f "src/config/site.js" ]; then
    echo -e "${YELLOW}Warning: src/config/site.js not found. Using default configuration.${NC}"
fi

# Build static site
echo
echo -e "${GREEN}🏗️ Building static site...${NC}"
if ! npm run build; then
    echo -e "${RED}Build failed${NC}"
    exit 1
fi

# Start development server
echo
echo -e "${GREEN}🚀 Starting development server...${NC}"
echo -e "Local URL: http://localhost:8788"
echo -e "Functions: http://localhost:8788/api/"
echo

# Use serve to start development server (wrangler requires Node >=20.18.1)
npx serve public -l 8788

echo
echo -e "${YELLOW}Development server stopped.${NC}"