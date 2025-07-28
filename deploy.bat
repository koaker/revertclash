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
call npm install --no-audit
if %errorlevel% neq 0 (
    echo ����: ���������װʧ��
    echo ��ʾ: �����postinstall���󣬿��Գ���ʹ�� --ignore-scripts ����
    pause
    exit /b 1
)
echo ���������װ�ɹ�

echo ���ڰ�װǰ������...
cd frontend
call npm install --no-audit
if %errorlevel% neq 0 (
    echo ����: ǰ��������װʧ��
    echo ��ǰĿ¼: %CD%
    cd ..
    pause
    exit /b 1
)
echo ǰ��������װ�ɹ�
cd ..

REM ����ǰ��
echo ���ڹ���ǰ��...
call npm run build
if %errorlevel% neq 0 (
    echo ����: ǰ�˹���ʧ��
    pause
    exit /b 1
)
echo ǰ�˹������

REM ����������������
echo ����Ӧ��������������...
if not exist configs\config.production.yaml (
    echo ����: config.production.yaml �����ڣ��������ļ�����...
    copy configs\config.production.example.yaml configs\config.production.yaml
    echo ��༭ configs\config.production.yaml ������������
)
copy configs\config.production.yaml configs\config.yaml

REM ���ǰ�˹������
if not exist frontend\dist\index.html (
    echo ����: ǰ�˹������ﲻ���ڣ���������ʧ��
    pause
    exit /b 1
)

REM ��������������
echo.
echo ========================================
echo   RevertClash ��������������ɣ�
echo ========================================
echo �����ļ�: configs\config.yaml
echo ǰ�˹���: frontend\dist\
echo.
echo ������������������...
echo ���������� https://localhost:3001
echo ���������������Ҳ��ͨ����������
echo.
echo �� Ctrl+C ֹͣ������
echo ========================================
echo.
set NODE_ENV=production
node src/index.js 