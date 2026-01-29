# 02-Pages Asset Generator
# Set encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change to script directory
Set-Location (Join-Path $PSScriptRoot "..")
Set-Location "02-pages"

Write-Host "========================================"
Write-Host "    02-Pages Asset Generator"
Write-Host "========================================"
Write-Host "Project Directory: $PWD"
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run from 02-pages directory."
    pause
    exit 1
}

# Check Python 3
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Python 3 is required to run the asset generator."
    Write-Host "Please install Python 3: https://www.python.org/downloads/"
    pause
    exit 1
}

# Check Pillow library
$pillowCheck = python -c "from PIL import Image" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing required Python packages..."
    pip install Pillow
    Write-Host ""
}

# Parse command line arguments
$assetType = if ($args.Count -gt 0) { $args[0] } else { "all" }

# Validate asset type
$validTypes = @("all", "images", "icons", "fonts", "files")
if ($assetType -notin $validTypes) {
    Write-Host "Error: Invalid asset type '$assetType'"
    Write-Host "Usage: $($MyInvocation.MyCommand.Name) [all|images|icons|fonts|files]"
    pause
    exit 1
}

Write-Host "Generating assets of type: $assetType"
Write-Host ""

# Run the asset generator
python scripts\generate_assets.py --type $assetType

if ($LASTEXITCODE -ne 0) {
    Write-Host "Asset generation failed!"
    pause
    exit 1
}

Write-Host ""
Write-Host "✓ Asset generation completed successfully!"
Write-Host ""

Write-Host "Next steps:"
Write-Host "  1. Replace placeholder images with real ones"
Write-Host "  2. Upload actual font files to src\assets\fonts\"
Write-Host "  3. Update public\manifest.json with your domain"
Write-Host "  4. Customize icons with your brand identity"
Write-Host ""
Write-Host "Ready to build and deploy! 🚀"
pause
