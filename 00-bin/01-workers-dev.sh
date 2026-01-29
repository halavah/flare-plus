#!/bin/bash

# 01-workers 开发模式脚本
cd "$(dirname "$0")/.."
cd 01-workers

echo "🚀 启动 Workers 开发模式..."
echo "项目目录: $(pwd)"
echo ""

# 加载环境变量
if [ -f ".env" ]; then
    echo "📝 加载环境变量..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

# 启动开发模式
npm run dev