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
call npm install --no-audit
if %errorlevel% neq 0 (
    echo 错误: 后端依赖安装失败
    echo 提示: 如果是postinstall错误，可以尝试使用 --ignore-scripts 参数
    pause
    exit /b 1
)
echo 后端依赖安装成功

echo 正在安装前端依赖...
cd frontend
call npm install --no-audit
if %errorlevel% neq 0 (
    echo 错误: 前端依赖安装失败
    echo 当前目录: %CD%
    cd ..
    pause
    exit /b 1
)
echo 前端依赖安装成功
cd ..

REM 构建前端
echo 正在构建前端...
call npm run build
if %errorlevel% neq 0 (
    echo 错误: 前端构建失败
    pause
    exit /b 1
)
echo 前端构建完成

REM 复制生产环境配置
echo 正在应用生产环境配置...
if not exist configs\config.production.yaml (
    echo 警告: config.production.yaml 不存在，从样例文件创建...
    copy configs\config.production.example.yaml configs\config.production.yaml
    echo 请编辑 configs\config.production.yaml 设置您的域名
)
copy configs\config.production.yaml configs\config.yaml

REM 检查前端构建结果
if not exist frontend\dist\index.html (
    echo 错误: 前端构建产物不存在，构建可能失败
    pause
    exit /b 1
)

REM 启动生产服务器
echo.
echo ========================================
echo   RevertClash 生产环境部署完成！
echo ========================================
echo 配置文件: configs\config.yaml
echo 前端构建: frontend\dist\
echo.
echo 正在启动生产服务器...
echo 服务将运行在 https://localhost:3001
echo 如果配置了域名，也可通过域名访问
echo.
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.
set NODE_ENV=production
node src/index.js 