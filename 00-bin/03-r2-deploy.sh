#!/bin/bash

# 03-r2 部署脚本
cd "$(dirname "$0")/.."
cd 03-r2

echo "🌐 部署 R2 到 Cloudflare..."
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