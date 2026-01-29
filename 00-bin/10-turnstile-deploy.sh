#!/bin/bash

# 10-turnstile 部署脚本
cd "$(dirname "$0")/.."
cd 10-turnstile

echo "🌐 部署 Turnstile 到 Cloudflare..."
echo "项目目录: $(pwd)"
echo ""

# 检查是否已构建
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    echo ""
fi

# 部署到 Cloudflare
npm run deploy

echo ""
echo "✅ 部署完成！"