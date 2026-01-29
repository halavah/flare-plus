#!/bin/bash

# 05-kv 开发模式脚本
cd "$(dirname "$0")/.."
cd 05-kv

echo "🚀 启动 KV 开发模式..."
echo "项目目录: $(pwd)"
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

# 启动开发模式
npm run dev