@echo off
echo 正在部署RevertClash到生产环境...

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 安装依赖
echo 正在安装后端依赖...
npm install
if %errorlevel% neq 0 (
    echo 错误: 后端依赖安装失败
    pause
    exit /b 1
)

echo 正在安装前端依赖...
cd frontend
npm install
if %errorlevel% neq 0 (
    echo 错误: 前端依赖安装失败
    pause
    exit /b 1
)
cd ..

REM 构建前端
echo 正在构建前端...
npm run build
if %errorlevel% neq 0 (
    echo 错误: 前端构建失败
    pause
    exit /b 1
)

REM 复制生产环境配置
echo 正在应用生产环境配置...
copy configs\config.production.yaml configs\config.yaml

REM 启动生产服务器
echo 正在启动生产服务器...
echo 服务将运行在 https://spocel.top:3001
echo 按 Ctrl+C 停止服务器
set NODE_ENV=production
node src/index.js 