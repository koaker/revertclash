@echo off
echo ========================================
echo   RevertClash 调试部署脚本
echo ========================================
echo 此脚本将逐步执行部署过程，每步都会暂停
echo 如果某步失败，您可以手动修复后继续
echo ========================================
pause

REM 检查Node.js
echo.
echo [步骤1] 检查Node.js版本...
node --version
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js
    pause
    exit /b 1
)
echo Node.js 检查通过
pause

REM 检查当前目录
echo.
echo [步骤2] 检查项目结构...
echo 当前目录: %CD%
if not exist package.json (
    echo 错误: 未找到package.json，请确保在项目根目录运行
    pause
    exit /b 1
)
if not exist frontend\package.json (
    echo 错误: 未找到frontend目录或其package.json
    pause
    exit /b 1
)
echo 项目结构检查通过
pause

REM 安装后端依赖
echo.
echo [步骤3] 安装后端依赖...
echo 执行: call npm install --no-audit
call npm install --no-audit
if %errorlevel% neq 0 (
    echo 警告: 后端依赖安装失败
    echo 是否继续？(Y/N)
    set /p continue=
    if /i "%continue%" neq "Y" exit /b 1
)
echo 后端依赖安装完成
pause

REM 安装前端依赖
echo.
echo [步骤4] 安装前端依赖...
cd frontend
echo 当前目录: %CD%
echo 执行: call npm install --no-audit
call npm install --no-audit
if %errorlevel% neq 0 (
    echo 警告: 前端依赖安装失败
    cd ..
    echo 是否继续？(Y/N)
    set /p continue=
    if /i "%continue%" neq "Y" exit /b 1
) else (
    cd ..
)
echo 前端依赖安装完成
pause

REM 构建前端
echo.
echo [步骤5] 构建前端应用...
echo 执行: call npm run build
call npm run build
if %errorlevel% neq 0 (
    echo 警告: 前端构建失败
    echo 是否继续？(Y/N)
    set /p continue=
    if /i "%continue%" neq "Y" exit /b 1
)
echo 前端构建完成
pause

REM 检查构建产物
echo.
echo [步骤6] 验证构建产物...
if exist frontend\dist\index.html (
    echo ✓ frontend\dist\index.html 存在
) else (
    echo ✗ frontend\dist\index.html 不存在
)
dir frontend\dist
pause

REM 配置生产环境
echo.
echo [步骤7] 配置生产环境...
if not exist configs\config.production.yaml (
    echo 创建生产配置文件...
    copy configs\config.production.example.yaml configs\config.production.yaml
    echo.
    echo 重要: 请编辑 configs\config.production.yaml 设置您的域名
    echo 是否现在编辑配置文件？(Y/N)
    set /p edit=
    if /i "%edit%" equ "Y" notepad configs\config.production.yaml
)
copy configs\config.production.yaml configs\config.yaml
echo 生产配置已应用
pause

REM 启动服务器
echo.
echo [步骤8] 启动生产服务器...
echo ========================================
echo   准备启动服务器
echo ========================================
echo 配置文件: configs\config.yaml
echo 前端文件: frontend\dist\
echo 环境变量: NODE_ENV=production
echo.
echo 服务器将在以下地址可用:
echo - HTTP:  http://localhost:3000
echo - HTTPS: https://localhost:3001
echo.
echo 按任意键启动服务器...
pause
echo.
set NODE_ENV=production
node src/index.js 