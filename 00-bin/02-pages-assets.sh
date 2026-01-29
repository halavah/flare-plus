#!/bin/bash

# 02-pages Asset Generator
# Generates placeholder assets for development

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
echo -e "${BLUE}    02-Pages Asset Generator${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Project Directory: $(pwd)"
echo

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from 02-pages directory.${NC}"
    exit 1
fi

# Check Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is required to run the asset generator.${NC}"
    echo -e "${YELLOW}Please install Python 3: https://www.python.org/downloads/${NC}"
    exit 1
fi

# Check Pillow library
if ! python3 -c "import PIL" &> /dev/null; then
    echo -e "${YELLOW}Installing required Python packages...${NC}"
    pip3 install Pillow
    echo
fi

# Parse command line arguments
ASSET_TYPE="all"
if [ $# -gt 0 ]; then
    ASSET_TYPE="$1"
fi

# Validate asset type
case $ASSET_TYPE in
    all|images|icons|fonts|files)
        ;;
    *)
        echo -e "${RED}Error: Invalid asset type '$ASSET_TYPE'${NC}"
        echo -e "Usage: $0 [all|images|icons|fonts|files]"
        exit 1
        ;;
esac

echo -e "${BLUE}Generating assets of type: ${YELLOW}$ASSET_TYPE${NC}"
echo

# Run the asset generator
python3 scripts/generate_assets.py --type "$ASSET_TYPE"

if [ $? -eq 0 ]; then
    echo
    echo -e "${GREEN}✓ Asset generation completed successfully!${NC}"
    echo
    echo -e "${BLUE}Generated files:${NC}"
    find src/assets -type f | wc -l | xargs echo -e "  ${YELLOW}Total files:${NC}"
    echo
    echo -e "${BLUE}Asset structure:${NC}"
    tree src/assets/ 2>/dev/null || find src/assets -type d | sort
    echo
else
    echo -e "${RED}✗ Asset generation failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Replace placeholder images with real ones"
echo -e "  2. Upload actual font files to src/assets/fonts/"
echo -e "  3. Update public/manifest.json with your domain"
echo -e "  4. Customize icons with your brand identity"
echo
echo -e "${BLUE}Ready to build and deploy! 🚀${NC}"