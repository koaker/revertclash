@echo off
echo ���ڲ���RevertClash����������...

REM ���Node.js�Ƿ�װ
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ����: δ��⵽Node.js�����Ȱ�װNode.js
    pause
    exit /b 1
)

REM ��װ����
echo ���ڰ�װ�������...
npm install
if %errorlevel% neq 0 (
    echo ����: ���������װʧ��
    pause
    exit /b 1
)

echo ���ڰ�װǰ������...
cd frontend
npm install
if %errorlevel% neq 0 (
    echo ����: ǰ��������װʧ��
    pause
    exit /b 1
)
cd ..

REM ����ǰ��
echo ���ڹ���ǰ��...
npm run build
if %errorlevel% neq 0 (
    echo ����: ǰ�˹���ʧ��
    pause
    exit /b 1
)

REM ����������������
echo ����Ӧ��������������...
copy configs\config.production.yaml configs\config.yaml

REM ��������������
echo ������������������...
echo ���������� https://spocel.top:3001
echo �� Ctrl+C ֹͣ������
set NODE_ENV=production
node src/index.js 