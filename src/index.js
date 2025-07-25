const path = require('path');
const fs = require('fs').promises;
const https = require('https');
const app = require('./app');
const { initDatabase, get } = require('./db');
const userAuthService = require('./services/userAuth');
async function getSslCredentials() {
    const sslDir = path.join(__dirname, '..', 'ssl');

    try {
        const key = await fs.readFile(path.join(sslDir, 'privkey.pem'));
        const cert = await fs.readFile(path.join(sslDir, 'fullchain.pem'));
        return { key, cert };
    } catch (error) {
        console.log('未找到.pem格式的SSL证书文件，将使用.crt格式');

        try {
            const key = await fs.readFile(path.join(sslDir, 'private.key'));
            const cert = await fs.readFile(path.join(sslDir, 'certificate.crt'));
            // 如果有CA证书链，也读取它
            const ca = await fs.readFile(path.join(sslDir, 'ca_bundle.crt'));
            return { key, cert, ca };

        } catch (error) {
            console.error('读取SSL证书失败:', error);
            throw new Error('未找到有效的SSL证书文件，请检查ssl目录');
        }
    }
}
async function startServer() {
    const PORT = process.env.PORT || 3000;
    
    console.log('启动HTTP服务器...');
    // 启动 HTTP 服务
    const httpServer = app.listen(PORT, () => {
        console.log(`HTTP服务器已启动: http://localhost:${PORT}`);
    });

    try {
        // 读取SSL证书文件
        const sslCredentials = await getSslCredentials();

        // 创建HTTPS服务器
        const httpsServer = https.createServer(sslCredentials, app);

        // 启动HTTPS服务
        const HTTPS_PORT = process.env.HTTPS_PORT || 3001;
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`HTTPS服务器已启动: https://localhost:${HTTPS_PORT}`);
            console.log(`配置文件地址: https://localhost:${HTTPS_PORT}/config`);
        });
        
        return { httpServer, httpsServer };
    } catch (err) {
        console.log('未找到SSL证书文件，仅启动HTTP服务');
        console.log(`配置文件地址: http://localhost:${PORT}/config`);

        
        return { httpServer };
    }
}

async function main() {
    try {
        console.log('启动RevertClash服务...');
        
        // 先初始化数据库
        console.log('正在初始化数据库...');
        await initDatabase(); // 确保先初始化数据库表
        
        
        // 检查数据库表是否存在
        try {
            const tableCheck = await get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
            if (tableCheck) {
                console.log('用户表已存在，检查是否有用户');
                // 然后检查是否需要初始设置
                const hasAdmin = await userAuthService.hasInitialAdmin();
                console.log(`检查用户结果: hasAdmin=${hasAdmin}`);
            } else {
                console.log('用户表不存在，需要初始设置');
            }
        } catch (error) {
            console.error('检查数据库表失败:', error);
        }
        
        // 然后启动HTTP服务器
        const servers = await startServer();
        
        console.log('RevertClash服务初始化完成');
    } catch (error) {
        console.error('启动RevertClash服务失败:', error);
        process.exit(1);
    }
}

main().catch(console.error);