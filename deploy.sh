#!/bin/bash

echo "正在部署RevertClash到生产环境..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未检测到Node.js，请先安装Node.js"
    exit 1
fi

# 安装依赖
echo "正在安装后端依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "错误: 后端依赖安装失败"
    exit 1
fi

echo "正在安装前端依赖..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "错误: 前端依赖安装失败"
    exit 1
fi
cd ..

# 构建前端
echo "正在构建前端..."
npm run build
if [ $? -ne 0 ]; then
    echo "错误: 前端构建失败"
    exit 1
fi

# 应用生产环境配置
echo "正在应用生产环境配置..."
cp configs/config.production.yaml configs/config.yaml

# 启动生产服务器
echo "正在启动生产服务器..."
echo "服务将运行在 https://spocel.top:3001"
echo "按 Ctrl+C 停止服务器"
export NODE_ENV=production
node src/index.js 