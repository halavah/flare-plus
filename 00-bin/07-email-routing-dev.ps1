# 07-email-routing 开发模式脚本
# Set encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change to script directory
Set-Location (Join-Path $PSScriptRoot "..")
Set-Location "07-email-routing"

Write-Host "🚀 启动 Email Routing 开发模式..."
Write-Host "项目目录: $PWD"
Write-Host ""

# 检查是否已安装依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 首次运行，正在安装依赖..."
    npm install
    Write-Host ""
}

# 启动开发模式
npm run dev
