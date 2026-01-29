# 02-Pages Deploy Script
# Set encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change to script directory
Set-Location (Join-Path $PSScriptRoot "..")
Set-Location "02-pages"

Write-Host "========================================"
Write-Host "       02-Pages Deploy Script"
Write-Host "========================================"
Write-Host "Project Directory: $PWD"
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run from 02-pages directory."
    pause
    exit 1
}

# Check for wrangler
$npxOutput = npx wrangler --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing Wrangler CLI..."
    npm install -g wrangler
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Wrangler CLI"
        pause
        exit 1
    }
}

# Check if logged in to Cloudflare
$whoamiOutput = npx wrangler whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Cloudflare first:"
    npx wrangler auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to login to Cloudflare"
        pause
        exit 1
    }
}

# Pre-deployment checks
Write-Host ""
Write-Host "Running pre-deployment checks..."

# Check if wrangler.toml exists
if (-not (Test-Path "wrangler.toml")) {
    Write-Host "Warning: wrangler.toml not found. Creating default configuration..."
    @"
name = "flare-plus-pages"
compatibility_date = "2023-05-18"

[env.production]
name = "flare-plus-pages"

[env.preview]
name = "flare-plus-pages-preview"
"@ | Out-File -FilePath "wrangler.toml" -Encoding UTF8
}

# Check build output
if (-not (Test-Path "public")) {
    Write-Host "Building project first..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed, cannot deploy"
        pause
        exit 1
    }
}

# Check critical files
if (-not (Test-Path "public\index.html")) {
    Write-Host "Error: index.html not found in build output"
    pause
    exit 1
}

Write-Host "✓ Pre-deployment checks passed"

# Confirm deployment
Write-Host ""
$confirm = Read-Host "Deploy to Cloudflare Pages? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y" -and $confirm -ne "yes" -and $confirm -ne "YES") {
    Write-Host "Deployment cancelled"
    pause
    exit 0
}

# Deploy
Write-Host ""
Write-Host "Deploying to Cloudflare Pages..."
npx wrangler pages deploy public --project-name=flare-plus-pages
if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed"
    pause
    exit 1
}

Write-Host ""
Write-Host "✓ Deployment completed successfully!"

# Get deployment URL
Write-Host ""
Write-Host "Retrieving deployment information..."
$deploymentOutput = npx wrangler pages deployment list --project-name=flare-plus-pages --limit=1 2>&1
if ($deploymentOutput -match '(https://[^\s]+)') {
    $url = $matches[1]
    Write-Host "Deployment URL: $url"
    Write-Host ""
    $open = Read-Host "Would you like to open the deployed site? (y/N)"
    if ($open -eq "y" -or $open -eq "Y") {
        Start-Process $url
    }
}

pause
