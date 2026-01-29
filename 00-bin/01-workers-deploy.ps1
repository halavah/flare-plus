# 01-workers 部署脚本
# Set encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Change to script directory
Set-Location (Join-Path $PSScriptRoot "..")
Set-Location "01-workers"

Write-Host "🌐 部署 Workers 到 Cloudflare..."
Write-Host "项目目录: $PWD"
Write-Host ""

# 加载环境变量
if (Test-Path ".env") {
    Write-Host "📝 加载环境变量..."
    Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_.Trim() -ne '' } | ForEach-Object {
        $key, $value = $_.Split('=', 2)
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

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
