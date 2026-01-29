#!/bin/bash

# 01-workers 部署脚本
cd "$(dirname "$0")/.."
cd 01-workers

echo "🌐 部署 Workers 到 Cloudflare..."
echo "项目目录: $(pwd)"
echo ""

# 加载环境变量
if [ -f ".env" ]; then
    echo "📝 加载环境变量..."
    export $(cat .env | grep -v '^#' | xargs)
fi

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