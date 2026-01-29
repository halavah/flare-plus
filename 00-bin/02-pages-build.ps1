# 02-Pages Build Script
# Set encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change to script directory
Set-Location (Join-Path $PSScriptRoot "..")
Set-Location "02-pages"

Write-Host "========================================"
Write-Host "    02-Pages Build Script"
Write-Host "========================================"
Write-Host "Project Directory: $PWD"
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: package.json not found. Please run from 02-pages directory."
    pause
    exit 1
}

# Check dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies"
        pause
        exit 1
    }
    Write-Host ""
}

# Clean previous build
Write-Host "Cleaning previous build..."
if (Test-Path "public") {
    Remove-Item -Path "public" -Recurse -Force
}
if (Test-Path ".cache") {
    Remove-Item -Path ".cache" -Recurse -Force
}

# Run build
Write-Host ""
Write-Host "Building static site..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed"
    pause
    exit 1
}

# Build summary
Write-Host ""
Write-Host "✓ Build completed successfully!"
Write-Host "Output directory: public\"

# List created files
if (Test-Path "public") {
    Write-Host "Files created:"
    Get-ChildItem -Path "public" -Recurse | ForEach-Object { Write-Host $_.FullName.Replace((Get-Location).Path + "\public\", "") }
}

# Check critical files
Write-Host ""
Write-Host "Checking critical files..."
if (Test-Path "public\index.html") {
    Write-Host "✓ index.html"
} else {
    Write-Host "✗ index.html (missing)"
}

if (Test-Path "public\assets") {
    Write-Host "✓ assets directory"
} else {
    Write-Host "✗ assets directory (missing)"
}

# Calculate size
Write-Host ""
Write-Host "Build summary:"
if (Test-Path "public") {
    $files = Get-ChildItem -Path "public" -Recurse -File
    $fileCount = $files.Count
    $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
    Write-Host "- File count: $fileCount"
    Write-Host "- Total size: $totalSize bytes"
}

pause
