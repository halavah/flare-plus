# 02-Pages Manager
# Set encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change to script directory
Set-Location (Join-Path $PSScriptRoot "..")
Set-Location "02-pages"

function Show-Header {
    Clear-Host
    Write-Host "╔════════════════════════════════════════════════════════════════════╗"
    Write-Host "║                    02-Pages Manager                           ║"
    Write-Host "║              Cloudflare Pages Project Manager            ║"
    Write-Host "╚════════════════════════════════════════════════════════════════════╝"
    Write-Host ""
    Write-Host "Project Directory: $PWD"
    $checkStatus = Get-Status
    Write-Host "Project Status: $checkStatus"
    Write-Host ""
}

function Get-Status {
    if (Test-Path "public\index.html") {
        return "Built"
    } elseif (Test-Path "node_modules") {
        return "Ready to Build"
    } else {
        return "Setup Required"
    }
}

function Show-Menu {
    Write-Host "Available Operations:"
    Write-Host "  1) Setup & Dependencies"
    Write-Host "  2) Generate Assets"
    Write-Host "  3) Build Project"
    Write-Host "  4) Start Development Server"
    Write-Host "  5) Deploy to Cloudflare"
    Write-Host "  6) Clean Build"
    Write-Host "  7) Build Statistics"
    Write-Host "  8) Health Check"
    Write-Host ""
    Write-Host "  H) Help & Documentation"
    Write-Host "  Q) Quit"
    Write-Host ""
}

function Invoke-Setup {
    Write-Host ""
    Write-Host "🔧 Setting up project..."
    Write-Host ""

    # Install dependencies
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing Node.js dependencies..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to install dependencies"
            pause
            return
        }
    }

    # Generate assets
    if (-not (Test-Path "src\assets")) {
        Write-Host "Generating placeholder assets..."
        & (Join-Path $PSScriptRoot "02-pages-assets.ps1") "all"
    }

    # Check configuration
    if (-not (Test-Path "wrangler.toml")) {
        Write-Host "Creating Cloudflare configuration..."
        @"
name = "flare-plus-pages"
compatibility_date = "2023-05-18"

[env.production]
name = "flare-plus-pages"

[env.preview]
name = "flare-plus-pages-preview"
"@ | Out-File -FilePath "wrangler.toml" -Encoding UTF8
    }

    Write-Host "✓ Project setup completed!"
    pause
}

function Invoke-Assets {
    Write-Host ""
    Write-Host "🎨 Asset Generation"
    Write-Host ""
    Write-Host "Select asset type:"
    Write-Host "  1) All assets"
    Write-Host "  2) Images only"
    Write-Host "  3) Icons only"
    Write-Host "  4) Fonts only"
    Write-Host "  5) Files only"
    Write-Host ""

    $assetChoice = Read-Host "Choose [1-5]"

    $types = @("all", "images", "icons", "fonts", "files")
    if ($assetChoice -match '^[1-5]$') {
        & (Join-Path $PSScriptRoot "02-pages-assets.ps1") $types[$assetChoice - 1]
    }
}

function Invoke-Build {
    Write-Host ""
    Write-Host "🏗️ Building Project"
    Write-Host ""
    & (Join-Path $PSScriptRoot "02-pages-build.ps1")
}

function Invoke-Dev {
    Write-Host ""
    Write-Host "🚀 Starting Development Server"
    Write-Host ""
    Write-Host "Note: Development server will run on http://localhost:8788"
    Write-Host "Press Ctrl+C to stop the server"
    Write-Host ""
    & (Join-Path $PSScriptRoot "02-pages-dev.ps1")
}

function Invoke-Deploy {
    Write-Host ""
    Write-Host "📤 Deploying to Cloudflare Pages"
    Write-Host ""
    & (Join-Path $PSScriptRoot "02-pages-deploy.ps1")
}

function Invoke-Clean {
    Write-Host ""
    Write-Host "🧹 Cleaning Build"
    Write-Host ""

    if (Test-Path "public") {
        Write-Host "Removing build output..."
        Remove-Item -Path "public" -Recurse -Force
    }

    if (Test-Path ".cache") {
        Write-Host "Removing cache..."
        Remove-Item -Path ".cache" -Recurse -Force
    }

    Write-Host "✓ Build cleaned"
    pause
}

function Show-Statistics {
    Write-Host ""
    Write-Host "📊 Build Statistics"
    Write-Host ""

    if (-not (Test-Path "public")) {
        Write-Host "No build found. Run build first."
        pause
        return
    }

    Write-Host "Build Output: public\"
    Write-Host ""

    $files = Get-ChildItem -Path "public" -Recurse -File
    $fileCount = $files.Count
    Write-Host "Total Files: $fileCount"

    Write-Host ""
    Write-Host "Directory Structure:"
    Get-ChildItem -Path "public" -Recurse | ForEach-Object { Write-Host $_.FullName.Replace((Get-Location).Path + "\public\", "") }

    if (Test-Path "public") {
        $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
        Write-Host ""
        Write-Host "Total Size: $totalSize bytes"
    }

    Write-Host ""
    Write-Host "Critical Files:"
    if (Test-Path "public\index.html") { Write-Host "✓ index.html" } else { Write-Host "✗ index.html - missing" }
    if (Test-Path "public\sitemap.xml") { Write-Host "✓ sitemap.xml" } else { Write-Host "✗ sitemap.xml - missing" }
    if (Test-Path "public\assets\css\main.css") { Write-Host "✓ assets/css/main.css" } else { Write-Host "✗ assets/css/main.css - missing" }
    if (Test-Path "public\assets\js\main.js") { Write-Host "✓ assets/js/main.js" } else { Write-Host "✗ assets/js/main.js - missing" }

    pause
}

function Invoke-HealthCheck {
    Write-Host ""
    Write-Host "🔍 Health Check"
    Write-Host ""

    # Check Node.js
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Node.js - not found"
    } else {
        Write-Host "✓ Node.js - installed ($nodeVersion)"
    }

    # Check npm
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ npm - not found"
    } else {
        Write-Host "✓ npm - installed ($npmVersion)"
    }

    # Check Python
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        $pythonVersion = python3 --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ Python - not found"
        } else {
            Write-Host "✓ Python 3 - installed ($pythonVersion)"
        }
    } else {
        Write-Host "✓ Python - installed ($pythonVersion)"
    }

    # Check Wrangler
    $wranglerVersion = npx wrangler --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Wrangler CLI - not found"
    } else {
        Write-Host "✓ Wrangler CLI - installed"
    }

    # Check project files
    Write-Host ""
    Write-Host "Project Files:"
    if (Test-Path "package.json") { Write-Host "✓ package.json" } else { Write-Host "✗ package.json - missing" }
    if (Test-Path "src\build\generator.js") { Write-Host "✓ src/build/generator.js" } else { Write-Host "✗ src/build/generator.js - missing" }

    # Check dependencies
    if (Test-Path "node_modules") {
        Write-Host "✓ Dependencies installed"
    } else {
        Write-Host "✗ Dependencies not installed"
    }

    Write-Host ""
    pause
}

function Show-Help {
    Write-Host ""
    Write-Host "📚 Help & Documentation"
    Write-Host ""
    Write-Host "Available Commands:"
    Write-Host "  • Setup & Dependencies: Install all required dependencies and tools"
    Write-Host "  • Generate Assets: Create placeholder images, icons, and other resources"
    Write-Host "  • Build Project: Compile the static site for production"
    Write-Host "  • Start Development Server: Run local development server with hot reload"
    Write-Host "  • Deploy to Cloudflare: Deploy the built site to Cloudflare Pages"
    Write-Host "  • Clean Build: Remove all build artifacts and cache"
    Write-Host "  • Build Statistics: Show detailed information about the build"
    Write-Host "  • Health Check: Verify that all dependencies and tools are properly installed"
    Write-Host ""
    Write-Host "Documentation:"
    Write-Host "  • README.md: Comprehensive project documentation"
    Write-Host "  • src\config\site.js: Site configuration file"
    Write-Host "  • package.json: Project dependencies and scripts"
    Write-Host ""
    Write-Host "Useful Commands:"
    Write-Host "  • npm install: Install dependencies"
    Write-Host "  • npm run build: Build the project"
    Write-Host "  • npm run dev: Start development server"
    Write-Host "  • wrangler whoami: Check Cloudflare login status"
    Write-Host ""
    Write-Host "Development Workflow:"
    Write-Host "  1. Run 'Setup & Dependencies' to install required tools"
    Write-Host "  2. Run 'Generate Assets' to create placeholder resources"
    Write-Host "  3. Run 'Build Project' to compile your site"
    Write-Host "  4. Run 'Start Development Server' to test locally"
    Write-Host "  5. Run 'Deploy to Cloudflare' when ready for production"
    Write-Host ""
    pause
}

# Main loop
while ($true) {
    Show-Header
    Show-Menu
    $choice = Read-Host "Select operation [1-8/H/Q]"

    switch ($choice.ToUpper()) {
        "1" { Invoke-Setup }
        "2" { Invoke-Assets }
        "3" { Invoke-Build }
        "4" { Invoke-Dev }
        "5" { Invoke-Deploy }
        "6" { Invoke-Clean }
        "7" { Show-Statistics }
        "8" { Invoke-HealthCheck }
        "H" { Show-Help }
        "Q" {
            Write-Host ""
            Write-Host "Goodbye! 👋"
            exit 0
        }
        default {
            Write-Host "Invalid choice. Please select 1-8, H, or Q."
            Write-Host ""
            pause
        }
    }
}
