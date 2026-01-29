# 02-Pages Development Environment Launcher
# Set encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change to script directory
Set-Location (Join-Path $PSScriptRoot "..")
Set-Location "02-pages"

Write-Host "========================================"
Write-Host "   02-Pages Development Environment"
Write-Host "========================================"
Write-Host "项目目录: $PWD"
Write-Host ""

# 检查是否已安装依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 首次运行，正在安装依赖..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies"
        pause
        exit 1
    }
    Write-Host ""
}

# 加载环境变量
if (Test-Path ".env") {
    Write-Host "Loading environment variables..."
    Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_.Trim() -ne '' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

# 检查必要配置
if (-not (Test-Path "src/config/site.js")) {
    Write-Host "Warning: src/config/site.js not found. Using default configuration."
}

# 构建静态网站
Write-Host ""
Write-Host "🏗️ Building static site..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed"
    pause
    exit 1
}

# 启动开发服务器
Write-Host ""
Write-Host "🚀 Starting development server..."
Write-Host "Local URL: http://localhost:8788"
Write-Host "Functions: http://localhost:8788/api/"
Write-Host ""

# 使用 wrangler 启动开发服务器
npx wrangler pages dev public --compatibility-date=2023-05-18 --binding ENVIRONMENT=development

Write-Host ""
Write-Host "Development server stopped."
pause
