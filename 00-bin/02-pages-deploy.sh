#!/bin/bash

# 02-pages Deploy Script
# Deploys static site to Cloudflare Pages

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
echo -e "${BLUE}       02-Pages Deploy Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Project Directory: $(pwd)"
echo

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from 02-pages directory.${NC}"
    exit 1
fi

# Check for wrangler
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}Installing Wrangler CLI...${NC}"
    npm install -g wrangler
fi

# Check if logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Cloudflare first:${NC}"
    wrangler auth login
fi

# Pre-deployment checks
echo
echo -e "${BLUE}Running pre-deployment checks...${NC}"

# Check if wrangler.toml exists
if [ ! -f "wrangler.toml" ]; then
    echo -e "${YELLOW}Warning: wrangler.toml not found. Creating default configuration...${NC}"
    create_wrangler_config
fi

# Check build output
if [ ! -d "public" ]; then
    echo -e "${YELLOW}Building project first...${NC}"
    npm run build
fi

# Check critical files
if [ ! -f "public/index.html" ]; then
    echo -e "${RED}Error: index.html not found in build output${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Pre-deployment checks passed${NC}"

# Confirm deployment
echo
read -p "Deploy to Cloudflare Pages? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Deploy
echo
echo -e "${BLUE}Deploying to Cloudflare Pages...${NC}"
if wrangler pages deploy public --project-name=flare-plus-pages; then
    echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

# Get deployment URL
echo
echo -e "${BLUE}Retrieving deployment information...${NC}"
DEPLOYMENT_URL=$(wrangler pages deployment list --project-name=flare-plus-pages --limit=1 | grep -o 'https://[^[:space:]]*' | head -1)

if [ ! -z "$DEPLOYMENT_URL" ]; then
    echo -e "${GREEN}Deployment URL: $DEPLOYMENT_URL${NC}"
    echo
    read -p "Would you like to open the deployed site? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command -v open &> /dev/null; then
            open "$DEPLOYMENT_URL"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$DEPLOYMENT_URL"
        else
            echo "Please open manually: $DEPLOYMENT_URL"
        fi
    fi
fi

echo
echo -e "${GREEN}Deployment completed successfully!${NC}"

# Function to create wrangler configuration
create_wrangler_config() {
    cat > wrangler.toml << EOF
name = "flare-plus-pages"
compatibility_date = "2023-05-18"

[env.production]
name = "flare-plus-pages"

[env.preview]
name = "flare-plus-pages-preview"
EOF
}