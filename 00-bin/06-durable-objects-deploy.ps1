# 06-durable-objects 部署脚本
# Set encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change to script directory
Set-Location (Join-Path $PSScriptRoot "..")
Set-Location "06-durable-objects"

Write-Host "🌐 部署 Durable Objects 到 Cloudflare..."
Write-Host "项目目录: $PWD"
Write-Host ""

# 检查是否已构建
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 正在安装依赖..."
    npm install
    Write-Host ""
}

# 部署到 Cloudflare
npm run deploy

Write-Host ""
Write-Host "✅ 部署完成！"
