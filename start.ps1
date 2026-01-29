# Flare Plus - Unified Project Manager
# Manages all Cloudflare services from a single interface

# Set encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change to script directory
Set-Location $PSScriptRoot

# Service list
$services = @(
    @{ Key = "01-workers"; Name = "Cloudflare Workers" },
    @{ Key = "02-pages"; Name = "Cloudflare Pages" },
    @{ Key = "03-r2"; Name = "Cloudflare R2 Storage" },
    @{ Key = "04-d1"; Name = "Cloudflare D1 Database" },
    @{ Key = "05-kv"; Name = "Cloudflare KV" },
    @{ Key = "06-durable-objects"; Name = "Cloudflare Durable Objects" },
    @{ Key = "07-email-routing"; Name = "Cloudflare Email Routing" },
    @{ Key = "08-webhooks"; Name = "Cloudflare Webhooks" },
    @{ Key = "09-queue"; Name = "Cloudflare Queue" },
    @{ Key = "10-turnstile"; Name = "Cloudflare Turnstile" }
)

# Check service status
function Get-ServiceStatus {
    param([string]$ServiceKey)

    $devScript = Join-Path "00-bin" "$ServiceKey-dev.ps1"

    if (Test-Path $devScript) {
        return "Available"
    } else {
        return "Missing Scripts"
    }
}

# Show header
function Show-Header {
    Clear-Host
    Write-Host "╔════════════════════════════════════════════════════════════════════╗"
    Write-Host "║                    Flare Plus Manager                        ║"
    Write-Host "║              Unified Cloudflare Services Manager           ║"
    Write-Host "╚════════════════════════════════════════════════════════════════════╝"
    Write-Host ""
    Write-Host "Project Directory: $PWD"

    $gitBranch = git branch --show-current 2>$null
    if ($gitBranch) {
        Write-Host "Git Branch: $gitBranch"
    } else {
        Write-Host "Git Branch: Not a git repo"
    }
    Write-Host ""
}

# Show main menu
function Show-MainMenu {
    Write-Host "Available Services:"
    Write-Host ""

    # Services
    for ($i = 0; $i -lt $services.Count; $i++) {
        $status = Get-ServiceStatus -ServiceKey $services[$i].Key
        $num = $i + 1
        Write-Host "  [$num] 🌐 $($services[$i].Name) ($status)"
    }

    Write-Host ""
    Write-Host "  [q] Quit"
    Write-Host ""
}

# Show service menu
function Show-ServiceMenu {
    param([int]$ServiceNum)

    $idx = $ServiceNum - 1
    $serviceKey = $services[$idx].Key
    $serviceName = $services[$idx].Name

    Clear-Host
    Write-Host "🌐 $serviceName Management"
    Write-Host ""
    Write-Host "Service Key: $serviceKey"
    $status = Get-ServiceStatus -ServiceKey $serviceKey
    Write-Host "Status: $status"
    Write-Host ""
    Write-Host "Available Operations:"
    Write-Host "  1) Start Development Server"
    Write-Host "  2) Deploy to Cloudflare"
    Write-Host "  3) Build Project"
    Write-Host "  4) Install Dependencies"
    Write-Host "  5) Clean Build"
    Write-Host ""
    Write-Host "  b) Back to Main Menu"
    Write-Host ""
}

# Execute service command
function Invoke-ServiceCommand {
    param(
        [int]$ServiceNum,
        [string]$Command
    )

    $idx = $ServiceNum - 1
    $serviceKey = $services[$idx].Key
    $serviceName = $services[$idx].Name
    $serviceDir = $serviceKey

    switch ($Command) {
        "1" {
            Write-Host ""
            Write-Host "🚀 Starting development server for $serviceName..."
            Write-Host "Note: Press Ctrl+C to stop the server"
            Write-Host ""

            $devScript = Join-Path "00-bin" "$serviceKey-dev.ps1"

            if (Test-Path $devScript) {
                & $devScript
            } else {
                Write-Host "✗ Development script not found: 00-bin\$serviceKey-dev.ps1"
                Write-Host "Please ensure the script exists in the 00-bin directory."
            }
        }
        "2" {
            Write-Host ""
            Write-Host "📤 Deploying $serviceName to Cloudflare..."

            $deployScript = Join-Path "00-bin" "$serviceKey-deploy.ps1"

            if (Test-Path $deployScript) {
                & $deployScript
            } else {
                Write-Host "✗ Deployment script not found: 00-bin\$serviceKey-deploy.ps1"
                Write-Host "Please ensure the script exists in the 00-bin directory."
            }
        }
        "3" {
            Write-Host ""
            Write-Host "🏗️ Building $serviceName..."

            $buildScript = Join-Path "00-bin" "$serviceKey-build.ps1"

            if (Test-Path $buildScript) {
                & $buildScript
            } else {
                Write-Host "✗ Build script not found: 00-bin\$serviceKey-build.ps1"
                Write-Host "Please ensure the script exists in the 00-bin directory."
            }
        }
        "4" {
            Write-Host ""
            Write-Host "📦 Installing dependencies for $serviceName..."

            $installScript = Join-Path "00-bin" "$serviceKey-install.ps1"

            if (Test-Path $installScript) {
                & $installScript
            } else {
                Write-Host "⚠ No install script found, trying npm install..."

                if (Test-Path $serviceDir) {
                    $packageJson = Join-Path $serviceDir "package.json"
                    if (Test-Path $packageJson) {
                        Push-Location $serviceDir
                        npm install
                        Write-Host "✓ Dependencies installed"
                        Pop-Location
                    } else {
                        Write-Host "✗ No package.json found for $serviceName!"
                    }
                } else {
                    Write-Host "✗ Service directory not found for $serviceName!"
                }
            }
        }
        "5" {
            Write-Host ""
            Write-Host "🧹 Cleaning build for $serviceName..."

            $cleanScript = Join-Path "00-bin" "$serviceKey-clean.ps1"

            if (Test-Path $cleanScript) {
                & $cleanScript
            } else {
                Write-Host "⚠ No clean script found, performing default clean..."

                if (Test-Path $serviceDir) {
                    Push-Location $serviceDir

                    $dirsToClean = @("node_modules", "dist", "public", ".cache")
                    foreach ($dir in $dirsToClean) {
                        if (Test-Path $dir) {
                            Remove-Item $dir -Recurse -Force
                        }
                    }

                    Write-Host "✓ Build cleaned"
                    Pop-Location
                } else {
                    Write-Host "✗ Service directory not found for $serviceName!"
                }
            }
        }
    }

    Write-Host ""
    Read-Host "Press Enter to continue"
}

# Service menu loop
function Show-ServiceMenuLoop {
    param([int]$ServiceNum)

    while ($true) {
        Show-ServiceMenu -ServiceNum $ServiceNum
        $choice = Read-Host "Select operation [1-5/b]"

        if ($choice -eq "b" -or $choice -eq "B") {
            break
        }

        if ($choice -match "^[1-5]$") {
            Invoke-ServiceCommand -ServiceNum $ServiceNum -Command $choice
        }
    }
}

# Main loop
function Show-MainMenuLoop {
    while ($true) {
        Show-Header
        Show-MainMenu

        $choice = Read-Host "Select operation [1-10/q]"

        if ($choice -eq "q" -or $choice -eq "Q") {
            Write-Host ""
            Write-Host "Goodbye! 👋"
            exit 0
        } elseif ($choice -match "^[1-9]$|^10$") {
            $serviceNum = [int]$choice
            Show-ServiceMenuLoop -ServiceNum $serviceNum
        } else {
            Write-Host ""
            Write-Host "Invalid choice. Please select 1-10 or q."
            Write-Host ""
            Read-Host "Press Enter to continue"
        }
    }
}

# Check if git is available
$gitVersion = git --version 2>$null
if (-not $gitVersion) {
    Write-Host "Warning: Git not found. Git operations will not be available."
    Write-Host ""
    Read-Host "Press Enter to continue"
}

# Run main loop
Show-MainMenuLoop
