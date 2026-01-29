#!/bin/bash

# 09-queue 部署脚本
cd "$(dirname "$0")/.."
cd 09-queue

echo "🌐 部署 Queue 到 Cloudflare..."
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